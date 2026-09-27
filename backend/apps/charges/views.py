from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.views import ServiceViewSet

from .serializers import ChargeSerializer, ChargesStatsSerializer
from .services import ChargeService


class ChargeViewSet(ServiceViewSet):
    """/api/charges/?page=&pageSize= and /api/charges/stats/"""

    service_class = ChargeService
    serializer_class = ChargeSerializer
    paginate = True

    @action(detail=False, methods=['get'])
    def stats(self, request):
        return Response(ChargesStatsSerializer(self.get_service().stats()).data)
