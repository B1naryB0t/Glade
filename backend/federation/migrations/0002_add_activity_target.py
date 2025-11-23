# backend/federation/migrations/0002_add_activity_target.py
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("federation", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="activity",
            name="target",
            field=models.URLField(blank=True),
        ),
        migrations.AddIndex(
            model_name="activity",
            index=models.Index(
                fields=["direction", "-created_at"], name="federation_a_directi_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="activity",
            index=models.Index(
                fields=["activity_type", "direction"], name="federation_a_activit_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="activity",
            index=models.Index(fields=["processed"],
                               name="federation_a_process_idx"),
        ),
    ]
