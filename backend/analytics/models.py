from django.db import models
from django.conf import settings

class AnalyticsMetric(models.Model):
    """Store analytics metrics for the platform"""
    
    METRIC_TYPES = [
        ('DAILY_ORDERS', 'Daily Orders'),
        ('DAILY_REVENUE', 'Daily Revenue'),
        ('COURIER_PERFORMANCE', 'Courier Performance'),
        ('CUSTOMER_ACTIVITY', 'Customer Activity'),
    ]
    
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    metric_value = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField()
    related_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['metric_type', 'date', 'related_user']
    
    def __str__(self):
        return f"{self.metric_type} - {self.date}: {self.metric_value}"



