from django.contrib import admin
from .models import Order, PricingConfig, CourierStatus

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'assigned_courier', 'status', 'price', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('customer__username', 'assigned_courier__username', 'pickup_address', 'delivery_address')
    readonly_fields = ('created_at', 'assigned_at', 'picked_up_at', 'in_transit_at', 'delivered_at')

@admin.register(PricingConfig)
class PricingConfigAdmin(admin.ModelAdmin):
    list_display = ('base_fee', 'per_km_rate', 'is_active', 'created_at', 'created_by')
    list_filter = ('is_active', 'created_at')

@admin.register(CourierStatus)
class CourierStatusAdmin(admin.ModelAdmin):
    list_display = ('courier', 'is_available', 'current_orders_count', 'last_activity')
    list_filter = ('is_available', 'last_activity')
    search_fields = ('courier__username',)
