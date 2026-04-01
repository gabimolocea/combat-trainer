from django.db import migrations


# Legacy slugs to remove (duplicates of canonical slugs)
REMOVE_SLUGS = [
    "forearms",    # duplicate of "forearm"
    "glutes",      # duplicate of "gluteal"
    "hamstrings",  # duplicate of "hamstring"
    "quads",       # duplicate of "quadriceps"
    "traps",       # duplicate of "trapezius"
    "shoulders",   # duplicate of "front-deltoids" + "rear-deltoids"
    "lats",        # duplicate of "upper-back"
    "shins",       # duplicate of "tibialis"
    "abductors",   # not in original library
    "adductor",    # duplicate of "adductors"
    "back-deltoids",   # replaced by "rear-deltoids"
    "deltoids",    # replaced by front-deltoids + rear-deltoids
    "abs",         # replaced by upper/middle/lower abs
    "hair",        # visual-only, not a trainable muscle
]

# New body parts to add
NEW_BODY_PARTS = [
    ("Upper Abs", "upper-abs"),
    ("Middle Abs", "middle-abs"),
    ("Lower Abs", "lower-abs"),
    ("Front Deltoids", "front-deltoids"),
    ("Rear Deltoids", "rear-deltoids"),
    ("Tibialis", "tibialis"),
    ("Hands", "hands"),
    ("Feet", "feet"),
    ("Ankles", "ankles"),
]


def refine_body_parts(apps, schema_editor):
    BodyPart = apps.get_model("taxonomy", "BodyPart")

    # Add new entries first
    for name, slug in NEW_BODY_PARTS:
        BodyPart.objects.get_or_create(slug=slug, defaults={"name": name})

    # Reassign exercises from legacy slugs before removing
    Exercise = None
    try:
        Exercise = apps.get_model("exercises", "Exercise")
    except LookupError:
        pass

    if Exercise is not None:
        remap = {
            "abs": ["upper-abs", "middle-abs", "lower-abs"],
            "shoulders": ["front-deltoids", "rear-deltoids"],
            "deltoids": ["front-deltoids", "rear-deltoids"],
            "back-deltoids": ["rear-deltoids"],
            "forearms": ["forearm"],
            "glutes": ["gluteal"],
            "hamstrings": ["hamstring"],
            "quads": ["quadriceps"],
            "traps": ["trapezius"],
            "lats": ["upper-back"],
            "shins": ["tibialis"],
            "abductors": ["adductors"],
            "adductor": ["adductors"],
        }
        for old_slug, new_slugs in remap.items():
            try:
                old_bp = BodyPart.objects.get(slug=old_slug)
            except BodyPart.DoesNotExist:
                continue
            new_bps = list(BodyPart.objects.filter(slug__in=new_slugs))
            if not new_bps:
                continue
            for exercise in old_bp.exercises.all():
                for new_bp in new_bps:
                    exercise.body_parts.add(new_bp)
                exercise.body_parts.remove(old_bp)

    # Remove legacy/duplicate slugs
    BodyPart.objects.filter(slug__in=REMOVE_SLUGS).delete()


def reverse_refine(apps, schema_editor):
    BodyPart = apps.get_model("taxonomy", "BodyPart")
    # Re-create legacy entries
    legacy = [
        ("Forearms", "forearms"),
        ("Glutes", "glutes"),
        ("Hamstrings", "hamstrings"),
        ("Quads", "quads"),
        ("Traps", "traps"),
        ("Shoulders", "shoulders"),
        ("Lats", "lats"),
        ("Shins", "shins"),
        ("Abductors", "abductors"),
        ("Adductor", "adductor"),
        ("Abs", "abs"),
        ("Hair", "hair"),
    ]
    for name, slug in legacy:
        BodyPart.objects.get_or_create(slug=slug, defaults={"name": name})


class Migration(migrations.Migration):

    dependencies = [
        ("taxonomy", "0002_seed_all_body_parts"),
    ]

    operations = [
        migrations.RunPython(refine_body_parts, reverse_refine),
    ]
