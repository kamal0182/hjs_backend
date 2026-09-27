from rest_framework.routers import SimpleRouter

from .views import ClientMoneyRecordViewSet, PaymentTypeViewSet, PaymentViewSet

router = SimpleRouter()
router.register('records', ClientMoneyRecordViewSet, basename='client-money-record')
router.register('payments', PaymentViewSet, basename='payment')
router.register('payment-types', PaymentTypeViewSet, basename='payment-type')

urlpatterns = router.urls
