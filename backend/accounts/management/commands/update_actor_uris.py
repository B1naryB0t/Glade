# backend/accounts/management/commands/update_actor_uris.py
"""
Management command to update all user actor URIs to match current INSTANCE_DOMAIN.
Run this after changing INSTANCE_DOMAIN in production.

Usage:
    python manage.py update_actor_uris
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from accounts.models import User


class Command(BaseCommand):
    help = 'Update all user actor URIs to match current INSTANCE_DOMAIN'

    def handle(self, *args, **options):
        users = User.objects.all()
        updated_count = 0
        
        self.stdout.write(f'Current INSTANCE_DOMAIN: {settings.INSTANCE_DOMAIN}')
        self.stdout.write(f'Found {users.count()} users to update...\n')
        
        for user in users:
            old_uri = user.actor_uri
            new_uri = f'https://{settings.INSTANCE_DOMAIN}/users/{user.username}'
            
            if old_uri != new_uri:
                user.actor_uri = new_uri
                user.save(update_fields=['actor_uri'])
                updated_count += 1
                self.stdout.write(
                    f'  Updated {user.username}: {old_uri} -> {new_uri}'
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ {user.username}: already correct')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Updated {updated_count} user(s)')
        )
