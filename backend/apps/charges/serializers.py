from decimal import Decimal

from rest_framework import serializers

from .models import Charge


class ChargeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    montant = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))

    class Meta:
        model = Charge
        fields = ['id', 'date', 'comment', 'montant']

    def validate_comment(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Veuillez saisir un commentaire.')
        return value


class ChargesStatsSerializer(serializers.Serializer):
    totalMontant = serializers.DecimalField(source='total_montant', max_digits=14, decimal_places=2)
    totalRecords = serializers.IntegerField(source='total_records')
