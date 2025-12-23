"""
Analytics service for calculating metrics and generating reports.
"""

from decimal import Decimal
from datetime import date, datetime, timedelta
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from typing import Dict, List, Any, Optional

from orders.models import Order, PricingConfig
from accounts.models import User
from .models import AnalyticsMetric


class AnalyticsService:
    """Service for analytics calculations and reporting"""
    
    def calculate_total_revenue(self, start_date: date, end_date: date) -> Decimal:
        """
        Calculate total revenue for delivered orders in date range.
        
        Args:
            start_date: Start date for calculation
            end_date: End date for calculation
            
        Returns:
            Total revenue as Decimal
        """
        revenue = Order.objects.filter(
            status='DELIVERED',
            delivered_at__date__gte=start_date,
            delivered_at__date__lte=end_date
        ).aggregate(total=Sum('price'))['total']
        
        return revenue or Decimal('0.00')
    
    def get_daily_stats(self, target_date: date) -> Dict[str, Any]:
        """
        Get daily statistics for a specific date.
        
        Args:
            target_date: Date to get statistics for
            
        Returns:
            Dictionary with daily statistics
        """
        orders_queryset = Order.objects.filter(
            delivered_at__date=target_date,
            status='DELIVERED'
        )
        
        stats = orders_queryset.aggregate(
            order_count=Count('id'),
            revenue=Sum('price'),
            avg_distance=Avg('distance_km'),
            avg_price=Avg('price')
        )
        
        return {
            'date': target_date,
            'order_count': stats['order_count'] or 0,
            'revenue': stats['revenue'] or Decimal('0.00'),
            'avg_distance': stats['avg_distance'] or Decimal('0.00'),
            'avg_price': stats['avg_price'] or Decimal('0.00')
        }
    
    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """
        Get key metrics for admin dashboard.
        
        Returns:
            Dictionary with dashboard metrics
        """
        today = date.today()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Total orders by status
        total_orders = Order.objects.count()
        completed_orders = Order.objects.filter(status='DELIVERED').count()
        pending_orders = Order.objects.filter(
            status__in=['CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
        ).count()
        
        # Revenue metrics
        total_revenue = self.calculate_total_revenue(
            start_date=date(2020, 1, 1),  # All time
            end_date=today
        )
        weekly_revenue = self.calculate_total_revenue(week_ago, today)
        monthly_revenue = self.calculate_total_revenue(month_ago, today)
        
        # User metrics
        total_customers = User.objects.filter(role='CUSTOMER').count()
        total_couriers = User.objects.filter(role='COURIER').count()
        active_couriers = User.objects.filter(
            role='COURIER',
            courierstatus__is_available=True
        ).count()
        
        # Performance metrics
        avg_delivery_time = self._calculate_avg_delivery_time()
        courier_utilization = self._calculate_courier_utilization()
        
        return {
            'total_orders': total_orders,
            'completed_orders': completed_orders,
            'pending_orders': pending_orders,
            'total_revenue': total_revenue,
            'weekly_revenue': weekly_revenue,
            'monthly_revenue': monthly_revenue,
            'total_customers': total_customers,
            'total_couriers': total_couriers,
            'active_couriers': active_couriers,
            'avg_delivery_time_minutes': avg_delivery_time,
            'courier_utilization_percent': courier_utilization
        }
    
    def get_revenue_trends(self, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get daily revenue trends for the specified number of days.
        
        Args:
            days: Number of days to include in trends
            
        Returns:
            List of daily revenue data
        """
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        trends = []
        current_date = start_date
        
        while current_date <= end_date:
            daily_stats = self.get_daily_stats(current_date)
            trends.append(daily_stats)
            current_date += timedelta(days=1)
        
        return trends
    
    def get_courier_performance(self) -> List[Dict[str, Any]]:
        """
        Get performance metrics for all couriers.
        
        Returns:
            List of courier performance data
        """
        couriers = User.objects.filter(role='COURIER')
        performance_data = []
        
        for courier in couriers:
            orders = Order.objects.filter(
                assigned_courier=courier,
                status='DELIVERED'
            )
            
            stats = orders.aggregate(
                total_orders=Count('id'),
                total_revenue=Sum('price'),
                avg_distance=Avg('distance_km')
            )
            
            avg_delivery_time = self._calculate_courier_avg_delivery_time(courier)
            
            performance_data.append({
                'courier_id': courier.id,
                'courier_name': f"{courier.first_name} {courier.last_name}".strip() or courier.username,
                'total_orders': stats['total_orders'] or 0,
                'total_revenue': stats['total_revenue'] or Decimal('0.00'),
                'avg_distance': stats['avg_distance'] or Decimal('0.00'),
                'avg_delivery_time_minutes': avg_delivery_time,
                'is_available': getattr(courier, 'courierstatus', None) and courier.courierstatus.is_available
            })
        
        return performance_data
    
    def generate_report(self, report_type: str, start_date: date, end_date: date) -> Dict[str, Any]:
        """
        Generate comprehensive report for specified date range.
        
        Args:
            report_type: Type of report ('revenue', 'performance', 'summary')
            start_date: Start date for report
            end_date: End date for report
            
        Returns:
            Report data dictionary
        """
        if report_type == 'revenue':
            return self._generate_revenue_report(start_date, end_date)
        elif report_type == 'performance':
            return self._generate_performance_report(start_date, end_date)
        elif report_type == 'summary':
            return self._generate_summary_report(start_date, end_date)
        else:
            raise ValueError(f"Unknown report type: {report_type}")
    
    def _calculate_avg_delivery_time(self) -> float:
        """Calculate average delivery time in minutes for completed orders"""
        completed_orders = Order.objects.filter(
            status='DELIVERED',
            created_at__isnull=False,
            delivered_at__isnull=False
        )
        
        if not completed_orders.exists():
            return 0.0
        
        total_minutes = 0
        count = 0
        
        for order in completed_orders:
            if order.created_at and order.delivered_at:
                duration = order.delivered_at - order.created_at
                total_minutes += duration.total_seconds() / 60
                count += 1
        
        return total_minutes / count if count > 0 else 0.0
    
    def _calculate_courier_utilization(self) -> float:
        """Calculate courier utilization percentage"""
        total_couriers = User.objects.filter(role='COURIER').count()
        if total_couriers == 0:
            return 0.0
        
        active_couriers = User.objects.filter(
            role='COURIER',
            courierstatus__is_available=True
        ).count()
        
        return (active_couriers / total_couriers) * 100
    
    def _calculate_courier_avg_delivery_time(self, courier: User) -> float:
        """Calculate average delivery time for a specific courier"""
        orders = Order.objects.filter(
            assigned_courier=courier,
            status='DELIVERED',
            created_at__isnull=False,
            delivered_at__isnull=False
        )
        
        if not orders.exists():
            return 0.0
        
        total_minutes = 0
        count = 0
        
        for order in orders:
            if order.created_at and order.delivered_at:
                duration = order.delivered_at - order.created_at
                total_minutes += duration.total_seconds() / 60
                count += 1
        
        return total_minutes / count if count > 0 else 0.0
    
    def _generate_revenue_report(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Generate revenue-focused report"""
        total_revenue = self.calculate_total_revenue(start_date, end_date)
        daily_trends = []
        
        current_date = start_date
        while current_date <= end_date:
            daily_stats = self.get_daily_stats(current_date)
            daily_trends.append(daily_stats)
            current_date += timedelta(days=1)
        
        return {
            'report_type': 'revenue',
            'start_date': start_date,
            'end_date': end_date,
            'total_revenue': total_revenue,
            'daily_trends': daily_trends,
            'generated_at': timezone.now()
        }
    
    def _generate_performance_report(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Generate performance-focused report"""
        orders_in_period = Order.objects.filter(
            delivered_at__date__gte=start_date,
            delivered_at__date__lte=end_date,
            status='DELIVERED'
        )
        
        performance_stats = orders_in_period.aggregate(
            total_orders=Count('id'),
            avg_delivery_time=Avg('delivered_at') - Avg('created_at'),
            avg_distance=Avg('distance_km')
        )
        
        courier_performance = self.get_courier_performance()
        
        return {
            'report_type': 'performance',
            'start_date': start_date,
            'end_date': end_date,
            'total_orders': performance_stats['total_orders'] or 0,
            'avg_distance': performance_stats['avg_distance'] or Decimal('0.00'),
            'courier_performance': courier_performance,
            'generated_at': timezone.now()
        }
    
    def _generate_summary_report(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Generate comprehensive summary report"""
        revenue_data = self._generate_revenue_report(start_date, end_date)
        performance_data = self._generate_performance_report(start_date, end_date)
        
        return {
            'report_type': 'summary',
            'start_date': start_date,
            'end_date': end_date,
            'revenue_summary': {
                'total_revenue': revenue_data['total_revenue'],
                'daily_trends': revenue_data['daily_trends']
            },
            'performance_summary': {
                'total_orders': performance_data['total_orders'],
                'avg_distance': performance_data['avg_distance'],
                'courier_performance': performance_data['courier_performance']
            },
            'generated_at': timezone.now()
        }