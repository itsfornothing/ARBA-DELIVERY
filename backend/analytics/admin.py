from django.contrib import admin
from .models import AnalyticsMetric

@admin.register(AnalyticsMetric)
class AnalyticsMetricAdmin(admin.ModelAdmin):
    list_display = ('metric_type', 'metric_value', 'date', 'related_user', 'created_at')
    list_filter = ('metric_type', 'date', 'created_at')
    search_fields = ('metric_type', 'related_user__username')
    readonly_fields = ('created_at',)
