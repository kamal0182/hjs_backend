from decimal import Decimal

from rest_framework import serializers

from apps.common.lookups import resolve_lookup

from .models import ClientMoneyRecord, Payment
from .repositories import PaymentTypeRepository


class ClientMoneyRecordSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    clientName = serializers.CharField(source='client_name', max_length=150)
    montant = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))

    class Meta:
        model = ClientMoneyRecord
        fields = ['id', 'clientName', 'montant', 'date']

    def validate_clientName(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Veuillez indiquer le nom du client.')
        return value


class ClientMoneySummarySerializer(serializers.Serializer):
    recordId = serializers.CharField(source='id')
    clientName = serializers.CharField(source='client_name')
    latestMontant = serializers.DecimalField(source='latest_montant', max_digits=14, decimal_places=2)
    latestDate = serializers.DateField(source='latest_date')
    paymentsCount = serializers.IntegerField(source='payments_count')
    totalMontant = serializers.DecimalField(source='total_montant', max_digits=14, decimal_places=2)


class ClientsMoneyStatsSerializer(serializers.Serializer):
    totalCollected = serializers.DecimalField(source='total_collected', max_digits=14, decimal_places=2)
    totalClients = serializers.IntegerField(source='total_clients')
    totalPayments = serializers.IntegerField(source='total_payments')


class PaymentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    recordId = serializers.PrimaryKeyRelatedField(source='record', queryset=ClientMoneyRecord.objects.all())
    paymentType = serializers.CharField(source='payment_type', max_length=100)
    price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))

    class Meta:
        model = Payment
        fields = ['id', 'recordId', 'paymentType', 'price', 'date']

    def validate_paymentType(self, value):
        return resolve_lookup(PaymentTypeRepository, value, 'Type de paiement inconnu.')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['recordId'] = str(data['recordId'])
        return data
