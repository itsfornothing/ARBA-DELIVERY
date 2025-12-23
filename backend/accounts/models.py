from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """Custom User model for the delivery platform"""
    
    ROLE_CHOICES = [
        ('CUSTOMER', 'Customer'),
        ('COURIER', 'Courier'),
        ('ADMIN', 'Admin'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER')
    phone_number = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.role})"


class CourierStatus(models.Model):
    """Model to track courier availability and workload"""
    
    courier = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        limit_choices_to={'role': 'COURIER'},
        related_name='courier_status'
    )
    is_available = models.BooleanField(default=True)
    current_orders_count = models.IntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    location_description = models.CharField(max_length=200, blank=True)
    
    class Meta:
        verbose_name_plural = "Courier Statuses"
    
    def __str__(self):
        return f"{self.courier.username} - {'Available' if self.is_available else 'Unavailable'}"
