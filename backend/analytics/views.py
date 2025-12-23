"""
Analytics views for admin dashboard and reporting.
"""

from datetime import date, timedelta
from decimal import Decimal
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from django.core.exceptions import PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import csv
import json

from accounts.permissions import IsAdminUser
from .services import AnalyticsService


@method_decorator([login_required], name='dispatch')
class AnalyticsDashboardView(View):
    """Admin analytics dashboard view"""
    
    def dispatch(self, request, *args, **kwargs):
        if not request.user.role == 'ADMIN':
            raise PermissionDenied("Admin access required")
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        """Get dashboard metrics"""
        analytics_service = AnalyticsService()
        metrics = analytics_service.get_dashboard_metrics()
        
        return JsonResponse({
            'success': True,
            'data': {
                'metrics': metrics,
                'generated_at': date.today().isoformat()
            }
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def revenue_trends_api(request):
    """API endpoint for revenue trends"""
    days = int(request.GET.get('days', 30))
    
    if days > 365:
        return Response(
            {'error': 'Maximum 365 days allowed'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    analytics_service = AnalyticsService()
    trends = analytics_service.get_revenue_trends(days)
    
    return Response({
        'success': True,
        'data': {
            'trends': trends,
            'period_days': days
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def courier_performance_api(request):
    """API endpoint for courier performance metrics"""
    analytics_service = AnalyticsService()
    performance_data = analytics_service.get_courier_performance()
    
    return Response({
        'success': True,
        'data': {
            'couriers': performance_data,
            'total_couriers': len(performance_data)
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def generate_report_api(request):
    """API endpoint for generating reports"""
    report_type = request.GET.get('type', 'summary')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    
    # Validate parameters
    if not start_date_str or not end_date_str:
        return Response(
            {'error': 'start_date and end_date are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if start_date > end_date:
        return Response(
            {'error': 'start_date must be before end_date'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if report_type not in ['revenue', 'performance', 'summary']:
        return Response(
            {'error': 'Invalid report type. Use: revenue, performance, or summary'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    analytics_service = AnalyticsService()
    
    try:
        report_data = analytics_service.generate_report(report_type, start_date, end_date)
        
        return Response({
            'success': True,
            'data': report_data
        })
    except Exception as e:
        return Response(
            {'error': f'Failed to generate report: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def export_report_csv(request):
    """Export report data as CSV"""
    report_type = request.GET.get('type', 'summary')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    
    # Validate parameters
    if not start_date_str or not end_date_str:
        return Response(
            {'error': 'start_date and end_date are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    analytics_service = AnalyticsService()
    
    try:
        report_data = analytics_service.generate_report(report_type, start_date, end_date)
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report_{start_date}_{end_date}.csv"'
        
        writer = csv.writer(response)
        
        if report_type == 'revenue':
            # Revenue report CSV format
            writer.writerow(['Date', 'Order Count', 'Revenue', 'Avg Distance', 'Avg Price'])
            for day_data in report_data['daily_trends']:
                writer.writerow([
                    day_data['date'],
                    day_data['order_count'],
                    day_data['revenue'],
                    day_data['avg_distance'],
                    day_data['avg_price']
                ])
        
        elif report_type == 'performance':
            # Performance report CSV format
            writer.writerow(['Courier Name', 'Total Orders', 'Total Revenue', 'Avg Distance', 'Avg Delivery Time', 'Available'])
            for courier_data in report_data['courier_performance']:
                writer.writerow([
                    courier_data['courier_name'],
                    courier_data['total_orders'],
                    courier_data['total_revenue'],
                    courier_data['avg_distance'],
                    courier_data['avg_delivery_time_minutes'],
                    courier_data['is_available']
                ])
        
        else:  # summary
            # Summary report CSV format
            writer.writerow(['Metric', 'Value'])
            writer.writerow(['Report Type', report_data['report_type']])
            writer.writerow(['Start Date', report_data['start_date']])
            writer.writerow(['End Date', report_data['end_date']])
            writer.writerow(['Total Revenue', report_data['revenue_summary']['total_revenue']])
            writer.writerow(['Total Orders', report_data['performance_summary']['total_orders']])
            writer.writerow(['Avg Distance', report_data['performance_summary']['avg_distance']])
        
        return response
        
    except Exception as e:
        return Response(
            {'error': f'Failed to export report: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def daily_stats_api(request):
    """API endpoint for daily statistics"""
    date_str = request.GET.get('date')
    
    if date_str:
        try:
            target_date = date.fromisoformat(date_str)
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        target_date = date.today()
    
    analytics_service = AnalyticsService()
    daily_stats = analytics_service.get_daily_stats(target_date)
    
    return Response({
        'success': True,
        'data': daily_stats
    })
