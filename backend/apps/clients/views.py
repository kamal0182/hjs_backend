from django.utils.dateparse import parse_date
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.common.lookups import LookupViewSet
from apps.common.views import ServiceViewSet

from .serializers import (
    ClientSerializer,
    ClientsStatsSerializer,
    CommandeInputSerializer,
    CommandeSerializer,
)
from .services import CategoryService, CityService, ClientService, CommandeService


class CategoryViewSet(LookupViewSet):
    """/api/categories/ — catégories offered on commande lines."""

    service_class = CategoryService


class CityViewSet(LookupViewSet):
    """/api/villes/ — villes offered in the commande form."""

    service_class = CityService


class ClientViewSet(ServiceViewSet):
    """/api/clients/ — the client directory used by the commande form."""

    service_class = ClientService
    serializer_class = ClientSerializer

    def get_filters(self):
        return {'search': self.request.query_params.get('search', '').strip() or None}

    @action(detail=False, methods=['get'])
    def cities(self, request):
        return Response(self.get_service().cities())


class CommandeViewSet(ServiceViewSet):
    """/api/commandes/?search=&city=&date=&page=&pageSize="""

    service_class = CommandeService
    serializer_class = CommandeSerializer
    input_serializer_class = CommandeInputSerializer
    paginate = True

    def get_filters(self):
        params = self.request.query_params
        raw_date = params.get('date') or None
        try:
            date = parse_date(raw_date) if raw_date else None
        except ValueError:
            date = None
        if raw_date and date is None:
            raise ValidationError({'date': 'Format de date invalide (AAAA-MM-JJ).'})
        return {
            'search': params.get('search', '').strip() or None,
            'city': params.get('city') or None,
            'date': date,
        }

    @action(detail=False, methods=['get'])
    def stats(self, request):
        return Response(ClientsStatsSerializer(self.get_service().stats()).data)
