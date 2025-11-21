#!/usr/bin/env python
"""
Standalone Admin CLI for Glade
Works without full Django setup - connects directly to database
"""
import os
import sys
from datetime import datetime, timedelta, timezone
import psycopg2
from psycopg2.extras import RealDictCursor

# Try to load .env from parent directory
try:
    from decouple import Config, RepositoryEnv
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        config = Config(RepositoryEnv(env_path))
    else:
        from decouple import config
except:
    from decouple import config


class GladeAdmin:
    def __init__(self, use_production=True):
        """
        Initialize admin connection
        
        Args:
            use_production: If True, use production DB from .env (DEFAULT)
                          If False, use local development DB
        """
        if use_production:
            # Production: Use .env settings
            db_host = config('DB_HOST', default='localhost')
            if '${RDS_ENDPOINT}' in db_host:
                db_host = config('RDS_ENDPOINT', default='localhost')
            
            db_config = {
                'dbname': config('DB_NAME', default='glade'),
                'user': config('DB_USER', default='postgres'),
                'password': config('DB_PASSWORD', default=''),
                'host': db_host,
                'port': config('DB_PORT', default='5432')
            }
        else:
            # Development: Use local defaults from backend/.env
            db_config = {
                'dbname': 'glade',
                'user': 'glade',
                'password': 'glade_dev_password',
                'host': 'localhost',
                'port': '5432'
            }
        
        try:
            print(f'Connecting to {db_config["host"]}...')
            db_config['connect_timeout'] = 5  # 5 second timeout
            self.conn = psycopg2.connect(**db_config)
            self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
            print('✓ Connected successfully\n')
        except psycopg2.OperationalError as e:
            print(f'\n❌ Database connection failed!')
            print(f'Error: {e}')
            print(f'\nConnection details:')
            print(f'  Host: {db_config["host"]}')
            print(f'  Database: {db_config["dbname"]}')
            print(f'  User: {db_config["user"]}')
            print(f'\nTroubleshooting:')
            if use_production:
                print(f'  - Check if you have network access to AWS RDS')
                print(f'  - Verify security group allows your IP')
                print(f'  - Check .env file has correct credentials')
                print(f'  - If running locally, you may need SSH tunnel to EC2')
            else:
                print(f'  - Make sure PostgreSQL is running locally')
                print(f'  - Check credentials (default: postgres/postgres)')
            print(f'\nTry:')
            print(f'  - For production (default): python admin_cli.py stats')
            print(f'  - For local dev: python admin_cli.py --dev stats')
            sys.exit(1)

    def show_stats(self):
        """Display platform statistics"""
        print('\n=== PLATFORM STATISTICS ===\n')
        
        # User stats
        self.cursor.execute('SELECT COUNT(*) as count FROM accounts_user')
        total_users = self.cursor.fetchone()['count']
        
        self.cursor.execute('SELECT COUNT(*) as count FROM accounts_user WHERE email_verified = true')
        verified_users = self.cursor.fetchone()['count']
        
        # Active users
        now = datetime.now(timezone.utc)
        active_15min = now - timedelta(minutes=15)
        active_24h = now - timedelta(hours=24)
        active_7d = now - timedelta(days=7)
        
        self.cursor.execute('SELECT COUNT(*) as count FROM accounts_user WHERE last_active_at >= %s', (active_15min,))
        active_15 = self.cursor.fetchone()['count']
        
        self.cursor.execute('SELECT COUNT(*) as count FROM accounts_user WHERE last_active_at >= %s', (active_24h,))
        active_24 = self.cursor.fetchone()['count']
        
        self.cursor.execute('SELECT COUNT(*) as count FROM accounts_user WHERE last_active_at >= %s', (active_7d,))
        active_7 = self.cursor.fetchone()['count']
        
        print(f'Total Users: {total_users}')
        print(f'Verified Users: {verified_users}')
        print(f'Active (15 min): {active_15}')
        print(f'Active (24 hours): {active_24}')
        print(f'Active (7 days): {active_7}')
        
        # Content stats
        self.cursor.execute('SELECT COUNT(*) as count FROM posts_post')
        total_posts = self.cursor.fetchone()['count']
        
        self.cursor.execute('SELECT COUNT(*) as count FROM posts_like')
        total_likes = self.cursor.fetchone()['count']
        
        self.cursor.execute('SELECT COUNT(*) as count FROM posts_comment')
        total_comments = self.cursor.fetchone()['count']
        
        print(f'\nTotal Posts: {total_posts}')
        print(f'Total Likes: {total_likes}')
        print(f'Total Comments: {total_comments}')
        
        # Follow stats
        self.cursor.execute('SELECT COUNT(*) as count FROM accounts_follow WHERE accepted = true')
        total_follows = self.cursor.fetchone()['count']
        
        self.cursor.execute('SELECT COUNT(*) as count FROM accounts_follow WHERE accepted = false')
        pending_follows = self.cursor.fetchone()['count']
        
        print(f'\nTotal Follows: {total_follows}')
        print(f'Pending Follow Requests: {pending_follows}')
        
        # Notifications
        try:
            self.cursor.execute('SELECT COUNT(*) as count FROM notifications_notification')
            total_notifs = self.cursor.fetchone()['count']
            
            self.cursor.execute('SELECT COUNT(*) as count FROM notifications_notification WHERE read = false')
            unread_notifs = self.cursor.fetchone()['count']
            
            print(f'\nTotal Notifications: {total_notifs}')
            print(f'Unread Notifications: {unread_notifs}')
        except:
            pass
        
        # Failed logins
        self.cursor.execute(
            'SELECT COUNT(*) as count FROM accounts_loginattempt WHERE success = false AND created_at >= %s',
            (active_24h,)
        )
        failed_logins = self.cursor.fetchone()['count']
        print(f'\nFailed Logins (24h): {failed_logins}')
        
        # Top users
        print('\n=== TOP USERS BY POSTS ===')
        self.cursor.execute('''
            SELECT u.username, COUNT(p.id) as post_count
            FROM accounts_user u
            LEFT JOIN posts_post p ON u.id = p.author_id
            GROUP BY u.id, u.username
            ORDER BY post_count DESC
            LIMIT 5
        ''')
        
        for row in self.cursor.fetchall():
            print(f'{row["username"]}: {row["post_count"]} posts')

    def list_users(self):
        """List all users"""
        print('\n=== ALL USERS ===\n')
        self.cursor.execute('''
            SELECT username, email, email_verified, created_at, last_active_at
            FROM accounts_user
            ORDER BY created_at DESC
        ''')
        
        now = datetime.now(timezone.utc)
        for row in self.cursor.fetchall():
            status = '✓' if row['email_verified'] else '✗'
            active = '🟢' if row['last_active_at'] and (now - row['last_active_at']).total_seconds() < 900 else '⚪'
            created = row['created_at'].strftime('%Y-%m-%d')
            last_active = row['last_active_at'].strftime('%Y-%m-%d %H:%M') if row['last_active_at'] else 'Never'
            print(f'{active} {status} {row["username"]} ({row["email"]}) - Joined: {created} - Last: {last_active}')

    def show_active_users(self):
        """Show currently active users"""
        print('\n=== ACTIVE USERS (Last 15 min) ===\n')
        active_time = datetime.now(timezone.utc) - timedelta(minutes=15)
        
        self.cursor.execute('''
            SELECT username, last_active_at
            FROM accounts_user
            WHERE last_active_at >= %s
            ORDER BY last_active_at DESC
        ''', (active_time,))
        
        rows = self.cursor.fetchall()
        if not rows:
            print('No active users')
            return
        
        now = datetime.now(timezone.utc)
        for row in rows:
            minutes_ago = int((now - row['last_active_at']).total_seconds() / 60)
            print(f'🟢 {row["username"]} - {minutes_ago} min ago')

    def delete_user(self, username):
        """Delete a user"""
        self.cursor.execute('''
            SELECT username, email, created_at,
                   (SELECT COUNT(*) FROM posts_post WHERE author_id = accounts_user.id) as post_count
            FROM accounts_user
            WHERE username = %s
        ''', (username,))
        
        user = self.cursor.fetchone()
        if not user:
            print(f'\n✗ User {username} not found')
            return
        
        print(f'\nUser: {user["username"]}')
        print(f'Email: {user["email"]}')
        print(f'Joined: {user["created_at"]}')
        print(f'Posts: {user["post_count"]}')
        
        confirm = input(f'\nAre you sure you want to delete {username}? (yes/no): ')
        
        if confirm.lower() == 'yes':
            self.cursor.execute('DELETE FROM accounts_user WHERE username = %s', (username,))
            self.conn.commit()
            print(f'\n✓ User {username} deleted successfully')
        else:
            print('\nDeletion cancelled')

    def show_suspicious_activity(self):
        """Show suspicious activity"""
        print('\n=== SUSPICIOUS ACTIVITY ===\n')
        
        # Failed logins
        print('Failed Login Attempts (last 24h):')
        active_24h = datetime.now(timezone.utc) - timedelta(hours=24)
        
        self.cursor.execute('''
            SELECT username, ip_address, COUNT(*) as attempt_count
            FROM accounts_loginattempt
            WHERE success = false AND created_at >= %s
            GROUP BY username, ip_address
            HAVING COUNT(*) >= 3
            ORDER BY attempt_count DESC
        ''', (active_24h,))
        
        rows = self.cursor.fetchall()
        if not rows:
            print('  None')
        else:
            for row in rows:
                print(f'  {row["username"]} from {row["ip_address"]}: {row["attempt_count"]} attempts')
        
        # High volume posters
        print('\nUsers with High Post Volume (last 24h):')
        self.cursor.execute('''
            SELECT u.username, COUNT(p.id) as recent_posts
            FROM accounts_user u
            JOIN posts_post p ON u.id = p.author_id
            WHERE p.created_at >= %s
            GROUP BY u.id, u.username
            HAVING COUNT(p.id) >= 50
            ORDER BY recent_posts DESC
        ''', (active_24h,))
        
        rows = self.cursor.fetchall()
        if not rows:
            print('  None')
        else:
            for row in rows:
                print(f'  {row["username"]}: {row["recent_posts"]} posts')

    def quick_summary(self):
        """Show quick summary"""
        print('\n=== QUICK SUMMARY ===\n')
        
        # Quick counts
        self.cursor.execute('SELECT COUNT(*) as count FROM accounts_user')
        total_users = self.cursor.fetchone()['count']
        
        self.cursor.execute('SELECT COUNT(*) as count FROM posts_post')
        total_posts = self.cursor.fetchone()['count']
        
        active_15min = datetime.now(timezone.utc) - timedelta(minutes=15)
        self.cursor.execute('SELECT COUNT(*) as count FROM accounts_user WHERE last_active_at >= %s', (active_15min,))
        active_now = self.cursor.fetchone()['count']
        
        print(f'👥 Total Users: {total_users}')
        print(f'📝 Total Posts: {total_posts}')
        print(f'🟢 Active Now: {active_now}')
        
        if total_users > 0:
            avg_posts = total_posts / total_users
            print(f'📊 Avg Posts/User: {avg_posts:.1f}')

    def search_user(self, username):
        """Search for a specific user"""
        print(f'\n=== SEARCHING FOR: {username} ===\n')
        
        self.cursor.execute('''
            SELECT u.username, u.email, u.email_verified, u.created_at, u.last_active_at,
                   (SELECT COUNT(*) FROM posts_post WHERE author_id = u.id) as post_count,
                   (SELECT COUNT(*) FROM accounts_follow WHERE follower_id = u.id AND accepted = true) as following_count,
                   (SELECT COUNT(*) FROM accounts_follow WHERE following_id = u.id AND accepted = true) as followers_count
            FROM accounts_user u
            WHERE u.username ILIKE %s
            LIMIT 10
        ''', (f'%{username}%',))
        
        rows = self.cursor.fetchall()
        if not rows:
            print(f'❌ No users found matching "{username}"')
            return
        
        for row in rows:
            print(f'\n👤 {row["username"]}')
            print(f'   Email: {row["email"]} {"✓" if row["email_verified"] else "✗"}')
            print(f'   Joined: {row["created_at"].strftime("%Y-%m-%d")}')
            print(f'   Last Active: {row["last_active_at"].strftime("%Y-%m-%d %H:%M") if row["last_active_at"] else "Never"}')
            print(f'   Posts: {row["post_count"]} | Following: {row["following_count"]} | Followers: {row["followers_count"]}')

    def interactive_mode(self):
        """Interactive dashboard mode"""
        while True:
            # Clear screen for better UX
            os.system('clear' if os.name != 'nt' else 'cls')
            
            print('\n' + '='*60)
            print('           🌲 GLADE ADMIN DASHBOARD 🌲')
            print('='*60)
            print('\n📊 MAIN MENU\n')
            print('  [1] 📈 Platform Statistics')
            print('  [2] 👥 List All Users')
            print('  [3] 🟢 Show Active Users')
            print('  [4] 🔍 Search User')
            print('  [5] 🗑️  Delete User')
            print('  [6] 🚨 Suspicious Activity')
            print('  [7] 📋 Quick Summary')
            print('  [0] 🚪 Exit')
            print('\n' + '-'*60)
            
            choice = input('\n👉 Select option (0-7): ').strip()
            
            print('\n' + '='*60 + '\n')
            
            if choice == '1':
                self.show_stats()
            elif choice == '2':
                self.list_users()
            elif choice == '3':
                self.show_active_users()
            elif choice == '4':
                username = input('Enter username to search: ').strip()
                if username:
                    self.search_user(username)
                else:
                    print('❌ Username cannot be empty')
            elif choice == '5':
                username = input('Enter username to delete: ').strip()
                if username:
                    self.delete_user(username)
                else:
                    print('❌ Username cannot be empty')
            elif choice == '6':
                self.show_suspicious_activity()
            elif choice == '7':
                self.quick_summary()
            elif choice == '0':
                print('\n👋 Goodbye!\n')
                break
            else:
                print('❌ Invalid option. Please select 0-7.')
            
            input('\n📌 Press Enter to continue...')

    def close(self):
        self.cursor.close()
        self.conn.close()


def main():
    # Check for --dev flag (production is default)
    use_production = '--dev' not in sys.argv
    if '--dev' in sys.argv:
        sys.argv.remove('--dev')
    
    # If no command specified, default to interactive mode
    if len(sys.argv) < 2:
        admin = GladeAdmin(use_production=use_production)
        try:
            admin.interactive_mode()
        finally:
            admin.close()
        return
    
    admin = GladeAdmin(use_production=use_production)
    
    try:
        command = sys.argv[1]
        
        if command == 'stats':
            admin.show_stats()
        elif command == 'users':
            admin.list_users()
        elif command == 'active':
            admin.show_active_users()
        elif command == 'delete' and len(sys.argv) > 2:
            admin.delete_user(sys.argv[2])
        elif command == 'suspicious':
            admin.show_suspicious_activity()
        elif command == 'interactive':
            admin.interactive_mode()
        else:
            print('\n❌ Invalid command')
            print('\nAvailable commands: stats, users, active, delete, suspicious, interactive')
            print('Or run without arguments for interactive mode\n')
    finally:
        admin.close()


if __name__ == '__main__':
    main()
