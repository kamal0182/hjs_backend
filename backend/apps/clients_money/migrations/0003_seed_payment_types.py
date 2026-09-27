from django.db import migrations

DEFAULT_PAYMENT_TYPES = ['Cash', 'Traite', 'Chèque']


def seed(apps, schema_editor):
    PaymentType = apps.get_model('clients_money', 'PaymentType')
    Payment = apps.get_model('clients_money', 'Payment')

    names = set(DEFAULT_PAYMENT_TYPES) | set(Payment.objects.values_list('payment_type', flat=True))
    for name in sorted(n for n in names if n):
        PaymentType.objects.get_or_create(name=name)


class Migration(migrations.Migration):
    dependencies = [('clients_money', '0002_alter_payment_payment_type_paymenttype')]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
