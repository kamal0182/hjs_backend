from rest_framework.routers import SimpleRouter

from .views import CamionViewSet, GazoilCommentViewSet, GazoilRecordViewSet

router = SimpleRouter()
router.register('camions', CamionViewSet, basename='camion')
router.register('records', GazoilRecordViewSet, basename='gazoil-record')
router.register('comments', GazoilCommentViewSet, basename='gazoil-comment')

urlpatterns = router.urls
