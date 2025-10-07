## Data Migration Strategy

### Schema Migration Process

1. **Create Migration**:

```bash
python manage.py makemigrations accounts
```

2. **Review Generated Migration**:

```python
# migrations/0002_auto_xxxx.py
operations = [
    migrations.AddField(
        model_name='user',
        name='new_field',
        field=models.CharField(max_length=100, default=''),
    ),
]
```

3. **Test Migration**:

```bash
python manage.py migrate --plan
python manage.py sqlmigrate accounts 0002
```

4. **Apply Migration**:

```bash
python manage.py migrate accounts
```

### Data Backfill Pattern

```python
# migrations/0003_backfill_data.py
from django.db import migrations

def backfill_data(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    for user in User.objects.all():
        if not user.notification_preferences:
            NotificationPreference.objects.create(user=user)

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0002_auto_xxxx'),
    ]
    operations = [
        migrations.RunPython(backfill_data),
    ]
```

---

## Testing Considerations
