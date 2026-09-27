from rest_framework.routers import SimpleRouter

from .views import CategoryViewSet, CityViewSet, ClientViewSet, CommandeViewSet

router = SimpleRouter()
router.register('clients', ClientViewSet, basename='client')
router.register('commandes', CommandeViewSet, basename='commande')
router.register('categories', CategoryViewSet, basename='category')
router.register('villes', CityViewSet, basename='city')

urlpatterns = router.urls
