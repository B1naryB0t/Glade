# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('federation', '0004_alter_remotepost_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='remotepost',
            name='summary',
            field=models.TextField(blank=True, null=True, default=''),
        ),
        migrations.AlterField(
            model_name='remotepost',
            name='in_reply_to',
            field=models.URLField(blank=True, null=True, default=''),
        ),
    ]
