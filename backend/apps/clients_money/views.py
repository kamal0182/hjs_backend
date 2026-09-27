from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.common.lookups import LookupViewSet
from apps.common.views import ServiceViewSet

from .serializers import (
    ClientMoneyRecordSerializer,
    ClientMoneySummarySerializer,
    ClientsMoneyStatsSerializer,
    PaymentSerializer,
)
from .services import ClientMoneyRecordService, PaymentService, PaymentTypeService


class PaymentTypeViewSet(LookupViewSet):
    """/api/clients-money/payment-types/ — types de paiement."""

    service_class = PaymentTypeService


class ClientMoneyRecordViewSet(ServiceViewSet):
    """
    /api/clients-money/records/?search=&page=&pageSize=  -> per-record summaries
    /api/clients-money/records/stats/                    -> global totals
    """

    service_class = ClientMoneyRecordService
    serializer_class = ClientMoneyRecordSerializer
    paginate = True

    def list(self, request):
        search = request.query_params.get('search', '').strip() or None
        return self.respond_list(self.get_service().summaries(search=search), ClientMoneySummarySerializer)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        return Response(ClientsMoneyStatsSerializer(self.get_service().stats()).data)


class PaymentViewSet(ServiceViewSet):
    """/api/clients-money/payments/?recordId="""

    service_class = PaymentService
    serializer_class = PaymentSerializer

    def get_filters(self):
        record_id = self.request.query_params.get('recordId', '')
        if record_id and not record_id.isdigit():
            raise ValidationError({'recordId': 'Identifiant invalide.'})
        return {'record_id': record_id or None}
