# Generated by Finn Stutzenstein on 2019-07-17 08:32
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("motions", "0029_motioncommentsection_weight")]

    operations = [
        migrations.AlterField(
            model_name="state",
            name="css_class",
            field=models.CharField(default="lightblue", max_length=255),
        )
    ]