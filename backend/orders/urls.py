from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'orders'

router = DefaultRouter()
router.register(r'', views.OrderViewSet, basename='order')
router.register(r'pricing-config', views.PricingConfigViewSet, basename='pricing-config')
router.register(r'courier-status', views.CourierStatusViewSet, basename='courier-status')

urlpatterns = [
    path('', include(router.urls)),
    
    # Configuration Management API
    path('config/pricing/', views.get_pricing_config_api, name='get_pricing_config'),
    path('config/pricing/update/', views.update_pricing_config_api, name='update_pricing_config'),
    path('config/pricing/validate/', views.validate_pricing_config_api, name='validate_pricing_config'),
    path('config/pricing/history/', views.get_pricing_history_api, name='get_pricing_history'),
    path('config/pricing/preview/', views.calculate_price_preview_api, name='calculate_price_preview'),
]