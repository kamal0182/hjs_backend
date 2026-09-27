from decimal import Decimal

from rest_framework import serializers

from apps.common.lookups import resolve_lookup

from .models import Client, Commande
from .repositories import CategoryRepository, CityRepository


class ClientSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')

    class Meta:
        model = Client
        fields = ['id', 'name', 'company', 'city']


class CommandeLineSerializer(serializers.Serializer):
    category = serializers.CharField(max_length=100)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))

    def validate_category(self, value):
        return resolve_lookup(CategoryRepository, value, 'Catégorie inconnue.')


class CommandeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    clientId = serializers.CharField(source='client_id', read_only=True)
    clientName = serializers.CharField(source='client.name', read_only=True)
    company = serializers.CharField(source='client.company', read_only=True)
    commandeRef = serializers.CharField(source='reference', read_only=True)
    lines = CommandeLineSerializer(many=True, read_only=True)

    class Meta:
        model = Commande
        fields = ['id', 'clientId', 'clientName', 'company', 'commandeRef', 'lines',
                  'date', 'comment', 'city', 'address']


class CommandeInputSerializer(serializers.ModelSerializer):
    clientId = serializers.PrimaryKeyRelatedField(source='client', queryset=Client.objects.all())
    lines = CommandeLineSerializer(many=True, allow_empty=False)
    comment = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Commande
        fields = ['clientId', 'lines', 'date', 'city', 'address', 'comment']

    def validate_lines(self, lines):
        categories = [line['category'] for line in lines]
        if len(categories) != len(set(categories)):
            raise serializers.ValidationError("Chaque catégorie ne peut être ajoutée qu'une seule fois.")
        return lines

    def validate_city(self, value):
        return resolve_lookup(CityRepository, value, 'Ville inconnue.')

    def validate_address(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Veuillez indiquer une adresse.')
        return value


class ClientsStatsSerializer(serializers.Serializer):
    totalClients = serializers.IntegerField(source='total_clients')
    totalCommandes = serializers.IntegerField(source='total_commandes')
    commandesAujourdhui = serializers.IntegerField(source='commandes_aujourdhui')
    villesCouvertes = serializers.IntegerField(source='villes_couvertes')
