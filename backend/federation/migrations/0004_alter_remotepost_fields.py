# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('federation', '0003_remotefollow_remotepost_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='remotepost',
            name='summary',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='remotepost',
            name='in_reply_to',
            field=models.URLField(blank=True, default=''),
        ),
    ]
