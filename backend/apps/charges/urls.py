from rest_framework.routers import SimpleRouter

from .views import ChargeViewSet

router = SimpleRouter()
router.register('', ChargeViewSet, basename='charge')

urlpatterns = router.urls
