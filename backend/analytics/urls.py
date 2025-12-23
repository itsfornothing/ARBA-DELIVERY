"""
URL patterns for analytics app.
"""

from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    # Dashboard
    path('dashboard/', views.AnalyticsDashboardView.as_view(), name='dashboard'),
    
    # API endpoints
    path('revenue-trends/', views.revenue_trends_api, name='revenue_trends_api'),
    path('courier-performance/', views.courier_performance_api, name='courier_performance_api'),
    path('daily-stats/', views.daily_stats_api, name='daily_stats_api'),
    path('generate-report/', views.generate_report_api, name='generate_report_api'),
    path('export-csv/', views.export_report_csv, name='export_report_csv'),
]