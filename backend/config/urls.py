from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

urlpatterns = [
    path('api/health/', lambda request: JsonResponse({'status': 'ok'}), name='health'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.clients.urls')),
    path('api/gazoil/', include('apps.gazoil.urls')),
    path('api/clients-money/', include('apps.clients_money.urls')),
    path('api/charges/', include('apps.charges.urls')),
]
