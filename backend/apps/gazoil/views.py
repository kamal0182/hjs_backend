from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.views import ServiceViewSet

from .serializers import (
    CamionDirectorySerializer,
    CamionSerializer,
    CamionSummarySerializer,
    GazoilCommentSerializer,
    GazoilRecordSerializer,
    GazoilStatsSerializer,
)
from .services import CamionService, GazoilCommentService, GazoilRecordService


class CamionViewSet(ServiceViewSet):
    """
    /api/gazoil/camions/?search=&page=&pageSize=  -> per-truck summaries
    /api/gazoil/camions/directory/?search=        -> every truck, for the Gestion page
    /api/gazoil/camions/matricules/               -> every known matricule
    /api/gazoil/camions/stats/                    -> global totals
    """

    service_class = CamionService
    serializer_class = CamionSerializer
    paginate = True

    def list(self, request):
        search = request.query_params.get('search', '').strip() or None
        return self.respond_list(self.get_service().summaries(search=search), CamionSummarySerializer)

    @action(detail=False, methods=['get'])
    def directory(self, request):
        search = request.query_params.get('search', '').strip() or None
        return self.respond_list(self.get_service().directory(search=search), CamionDirectorySerializer)

    @action(detail=False, methods=['get'])
    def matricules(self, request):
        return Response(self.get_service().matricules())

    @action(detail=False, methods=['get'])
    def stats(self, request):
        return Response(GazoilStatsSerializer(self.get_service().stats()).data)


class _ByMatriculeViewSet(ServiceViewSet):
    def get_filters(self):
        return {'matricule': self.request.query_params.get('matricule') or None}


class GazoilRecordViewSet(_ByMatriculeViewSet):
    """/api/gazoil/records/?matricule= — fill-up history."""

    service_class = GazoilRecordService
    serializer_class = GazoilRecordSerializer


class GazoilCommentViewSet(_ByMatriculeViewSet):
    """/api/gazoil/comments/?matricule= — notes per truck."""

    service_class = GazoilCommentService
    serializer_class = GazoilCommentSerializer
