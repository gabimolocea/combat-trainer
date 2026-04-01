# Generated migration for scheduled quick trainings and workouts

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("taxonomy", "0004_trainingtype"),
        ("workouts", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("calendar_app", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(
            code=lambda apps, schema_editor: None,
            reverse_code=lambda apps, schema_editor: None,
        ),
        migrations.CreateModel(
            name="ScheduledQuickTraining",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("scheduled_date", models.DateField()),
                ("start_time", models.TimeField()),
                ("duration_minutes", models.PositiveIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("training_type", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="scheduled_trainings", to="taxonomy.trainingtype")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="scheduled_quick_trainings", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["scheduled_date", "start_time"],
            },
        ),
        migrations.CreateModel(
            name="ScheduledWorkout",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("scheduled_date", models.DateField()),
                ("start_time", models.TimeField()),
                ("total_duration_minutes", models.PositiveIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="scheduled_workouts", to=settings.AUTH_USER_MODEL)),
                ("workout", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="scheduled_instances", to="workouts.workout")),
            ],
            options={
                "ordering": ["scheduled_date", "start_time"],
            },
        ),
        migrations.AddConstraint(
            model_name="scheduledquicktraining",
            constraint=models.UniqueConstraint(fields=["user", "scheduled_date", "start_time"], name="unique_quick_training_per_slot"),
        ),
    ]
