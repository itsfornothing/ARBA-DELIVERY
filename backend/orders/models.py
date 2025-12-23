from django.db import models
from django.conf import settings

class Order(models.Model):
    """Order model for delivery requests"""
    
    STATUS_CHOICES = [
        ('CREATED', 'Created'),
        ('ASSIGNED', 'Assigned'),
        ('PICKED_UP', 'Picked Up'),
        ('IN_TRANSIT', 'In Transit'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled')
    ]
    
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer_orders')
    assigned_courier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='courier_orders')
    pickup_address = models.TextField()
    delivery_address = models.TextField()
    distance_km = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CREATED')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    in_transit_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Order {self.id} - {self.status}"

class PricingConfig(models.Model):
    """Configuration for pricing calculations"""
    
    base_fee = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    per_km_rate = models.DecimalField(max_digits=10, decimal_places=2, default=20.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"Pricing Config - Base: {self.base_fee}, Per KM: {self.per_km_rate}"

class CourierStatus(models.Model):
    """Track courier availability and workload"""
    
    courier = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_available = models.BooleanField(default=True)
    current_orders_count = models.IntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    location_description = models.CharField(max_length=200, blank=True)
    
    def __str__(self):
        return f"{self.courier.username} - {'Available' if self.is_available else 'Unavailable'}"
