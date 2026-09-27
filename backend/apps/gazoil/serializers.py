from decimal import Decimal

from rest_framework import serializers

from .models import Camion, GazoilComment, GazoilRecord


def _clean_matricule(value):
    value = value.strip().upper()
    if not value:
        raise serializers.ValidationError('Veuillez indiquer un matricule.')
    return value


class CamionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Camion
        fields = ['id', 'matricule']
        extra_kwargs = {'matricule': {'validators': []}}  # uniqueness checked in CamionService

    def validate_matricule(self, value):
        return _clean_matricule(value)


class CamionSummarySerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    matricule = serializers.CharField()
    latestPrice = serializers.DecimalField(source='latest_price', max_digits=12, decimal_places=2)
    latestDate = serializers.DateField(source='latest_date')
    recordsCount = serializers.IntegerField(source='records_count')
    totalPrice = serializers.DecimalField(source='total_price', max_digits=14, decimal_places=2)
    commentsCount = serializers.IntegerField(source='comments_count')


class CamionDirectorySerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    matricule = serializers.CharField()
    recordsCount = serializers.IntegerField(source='records_count')
    commentsCount = serializers.IntegerField(source='comments_count')


class GazoilStatsSerializer(serializers.Serializer):
    totalPriceAll = serializers.DecimalField(source='total_price_all', max_digits=14, decimal_places=2)
    totalRecords = serializers.IntegerField(source='total_records')
    totalCamions = serializers.IntegerField(source='total_camions')


class _MatriculeLinkedSerializer(serializers.ModelSerializer):
    """Exposes the truck as a flat `matricule` string; the service resolves it to a Camion."""

    id = serializers.CharField(read_only=True)
    matricule = serializers.CharField(source='camion.matricule', max_length=50)

    def validate_matricule(self, value):
        return _clean_matricule(value)

    def validate(self, attrs):
        camion = attrs.pop('camion', None)
        if camion is not None:
            attrs['matricule'] = camion['matricule']
        return attrs


class GazoilRecordSerializer(_MatriculeLinkedSerializer):
    price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))

    class Meta:
        model = GazoilRecord
        fields = ['id', 'matricule', 'price', 'date']


class GazoilCommentSerializer(_MatriculeLinkedSerializer):
    class Meta:
        model = GazoilComment
        fields = ['id', 'matricule', 'comment', 'date']

    def validate_comment(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Veuillez saisir un commentaire.')
        return value
