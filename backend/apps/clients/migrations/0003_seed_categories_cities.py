from django.db import migrations

DEFAULT_CATEGORIES = ['Ramla', 'Kayas', 'Toufna']


def seed(apps, schema_editor):
    Category = apps.get_model('clients', 'Category')
    City = apps.get_model('clients', 'City')
    Client = apps.get_model('clients', 'Client')
    Commande = apps.get_model('clients', 'Commande')
    CommandeLine = apps.get_model('clients', 'CommandeLine')

    categories = set(DEFAULT_CATEGORIES) | set(CommandeLine.objects.values_list('category', flat=True))
    for name in sorted(c for c in categories if c):
        Category.objects.get_or_create(name=name)

    # Every ville already typed on a client or a commande becomes a managed ville.
    cities = set(Client.objects.values_list('city', flat=True)) | set(Commande.objects.values_list('city', flat=True))
    for name in sorted(c for c in cities if c):
        City.objects.get_or_create(name=name)


class Migration(migrations.Migration):
    dependencies = [('clients', '0002_alter_client_city_alter_commandeline_category_and_more')]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
