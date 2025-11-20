# Admin Dashboard

Interactive terminal-based admin dashboard for Glade.

## Quick Start

```bash
cd backend

# Interactive mode (recommended)
python admin_cli.py --dev

# Or on production (EC2)
docker exec -it {backend_container_name} python /app/admin_cli.py
```

## Interactive Menu

```
🌲 GLADE ADMIN DASHBOARD 🌲

📊 MAIN MENU

  [1] 📈 Platform Statistics
  [2] 👥 List All Users
  [3] 🟢 Show Active Users
  [4] 🔍 Search User
  [5] 🗑️  Delete User
  [6] 🚨 Suspicious Activity
  [7] 📋 Quick Summary
  [0] 🚪 Exit
```

## Features

✅ **Platform Statistics** - Users, posts, likes, comments, follows
✅ **User Management** - List, search, delete users
✅ **Active Tracking** - See who's online (15min, 24h, 7 days)
✅ **User Search** - Find users with detailed info
✅ **Security Monitoring** - Failed logins, spam detection
✅ **Quick Summary** - At-a-glance metrics

## Command Line Usage

```bash
# Specific commands (non-interactive)
python admin_cli.py --dev stats
python admin_cli.py --dev users
python admin_cli.py --dev active
python admin_cli.py --dev delete USERNAME
python admin_cli.py --dev suspicious
```

## Notes

- Defaults to **interactive mode** when run without arguments
- Defaults to **production database** (use `--dev` for local)
- Run on EC2 for production access
- All times in UTC