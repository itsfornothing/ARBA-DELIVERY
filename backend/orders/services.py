"""
Services for order management and configuration.
"""

from decimal import Decimal
from datetime import datetime
from django.utils import timezone
from django.contrib.auth import get_user_model
from typing import Dict, Any, Optional

from .models import Order, PricingConfig, CourierStatus

User = get_user_model()


class ConfigurationService:
    """Service for managing system configuration"""
    
    def get_active_pricing_config(self) -> Optional[PricingConfig]:
        """Get the currently active pricing configuration"""
        return PricingConfig.objects.filter(is_active=True).first()
    
    def update_pricing_config(self, base_fee: Decimal, per_km_rate: Decimal, admin_user: User) -> PricingConfig:
        """
        Update pricing configuration with validation and change logging.
        
        Args:
            base_fee: New base fee amount
            per_km_rate: New per-kilometer rate
            admin_user: Admin user making the change
            
        Returns:
            New PricingConfig instance
            
        Raises:
            ValueError: If validation fails
        """
        # Validate inputs
        if base_fee < Decimal('0.01'):
            raise ValueError("Base fee must be at least 0.01")
        
        if per_km_rate < Decimal('0.01'):
            raise ValueError("Per-kilometer rate must be at least 0.01")
        
        if base_fee > Decimal('1000.00'):
            raise ValueError("Base fee cannot exceed 1000.00")
        
        if per_km_rate > Decimal('100.00'):
            raise ValueError("Per-kilometer rate cannot exceed 100.00")
        
        if not admin_user.role == 'ADMIN':
            raise ValueError("Only admin users can update pricing configuration")
        
        # Get current configuration before deactivating
        current_config = self.get_active_pricing_config()
        
        # Deactivate all current configurations
        PricingConfig.objects.filter(is_active=True).update(is_active=False)
        
        # Create new configuration
        new_config = PricingConfig.objects.create(
            base_fee=base_fee,
            per_km_rate=per_km_rate,
            is_active=True,
            created_by=admin_user
        )
        
        # Log the change
        self._log_configuration_change(
            admin_user=admin_user,
            change_type='PRICING_UPDATE',
            old_config=current_config,
            new_config=new_config
        )
        
        return new_config
    
    def get_pricing_history(self, limit: int = 50) -> list:
        """
        Get pricing configuration history.
        
        Args:
            limit: Maximum number of records to return
            
        Returns:
            List of pricing configurations ordered by creation date
        """
        configs = PricingConfig.objects.all().order_by('-created_at')[:limit]
        
        history = []
        for config in configs:
            history.append({
                'id': config.id,
                'base_fee': config.base_fee,
                'per_km_rate': config.per_km_rate,
                'is_active': config.is_active,
                'created_at': config.created_at,
                'created_by': {
                    'id': config.created_by.id,
                    'username': config.created_by.username,
                    'name': f"{config.created_by.first_name} {config.created_by.last_name}".strip()
                }
            })
        
        return history
    
    def calculate_price(self, distance_km: Decimal, pricing_config: Optional[PricingConfig] = None) -> Decimal:
        """
        Calculate order price using current or specified pricing configuration.
        
        Args:
            distance_km: Distance in kilometers
            pricing_config: Optional specific pricing config to use
            
        Returns:
            Calculated price
        """
        if pricing_config is None:
            pricing_config = self.get_active_pricing_config()
        
        if not pricing_config:
            raise ValueError("No active pricing configuration found")
        
        price = pricing_config.base_fee + (distance_km * pricing_config.per_km_rate)
        return price.quantize(Decimal('0.01'))
    
    def validate_configuration_change(self, base_fee: Decimal, per_km_rate: Decimal) -> Dict[str, Any]:
        """
        Validate configuration change and return validation results.
        
        Args:
            base_fee: Proposed base fee
            per_km_rate: Proposed per-kilometer rate
            
        Returns:
            Dictionary with validation results
        """
        errors = []
        warnings = []
        
        # Validation rules
        if base_fee < Decimal('0.01'):
            errors.append("Base fee must be at least 0.01")
        elif base_fee < Decimal('10.00'):
            warnings.append("Base fee is very low, consider minimum viable pricing")
        
        if per_km_rate < Decimal('0.01'):
            errors.append("Per-kilometer rate must be at least 0.01")
        elif per_km_rate < Decimal('5.00'):
            warnings.append("Per-kilometer rate is very low, may not cover costs")
        
        if base_fee > Decimal('1000.00'):
            errors.append("Base fee cannot exceed 1000.00")
        elif base_fee > Decimal('200.00'):
            warnings.append("Base fee is very high, may deter customers")
        
        if per_km_rate > Decimal('100.00'):
            errors.append("Per-kilometer rate cannot exceed 100.00")
        elif per_km_rate > Decimal('50.00'):
            warnings.append("Per-kilometer rate is very high, may deter customers")
        
        # Calculate impact on sample distances
        current_config = self.get_active_pricing_config()
        sample_impacts = []
        
        if current_config:
            sample_distances = [Decimal('1.0'), Decimal('5.0'), Decimal('10.0'), Decimal('25.0')]
            
            for distance in sample_distances:
                old_price = current_config.base_fee + (distance * current_config.per_km_rate)
                new_price = base_fee + (distance * per_km_rate)
                change_percent = ((new_price - old_price) / old_price * 100) if old_price > 0 else 0
                
                sample_impacts.append({
                    'distance_km': distance,
                    'old_price': old_price.quantize(Decimal('0.01')),
                    'new_price': new_price.quantize(Decimal('0.01')),
                    'change_amount': (new_price - old_price).quantize(Decimal('0.01')),
                    'change_percent': float(change_percent)
                })
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'sample_impacts': sample_impacts
        }
    
    def _log_configuration_change(self, admin_user: User, change_type: str, 
                                old_config: Optional[PricingConfig], 
                                new_config: PricingConfig) -> None:
        """
        Log configuration changes for audit trail.
        
        Args:
            admin_user: User making the change
            change_type: Type of change being made
            old_config: Previous configuration (if any)
            new_config: New configuration
        """
        # For now, we'll use Django's logging system
        # In a production system, you might want a dedicated audit log table
        import logging
        
        logger = logging.getLogger('delivery_platform.config')
        
        change_data = {
            'admin_user_id': admin_user.id,
            'admin_username': admin_user.username,
            'change_type': change_type,
            'timestamp': timezone.now().isoformat(),
            'new_config': {
                'base_fee': str(new_config.base_fee),
                'per_km_rate': str(new_config.per_km_rate)
            }
        }
        
        if old_config:
            change_data['old_config'] = {
                'base_fee': str(old_config.base_fee),
                'per_km_rate': str(old_config.per_km_rate)
            }
        
        logger.info(f"Configuration change: {change_data}")


class OrderService:
    """Service for order management operations"""
    
    def __init__(self):
        self.config_service = ConfigurationService()
    
    def create_order(self, customer: User, pickup_address: str, delivery_address: str, 
                    distance_km: Decimal) -> Order:
        """
        Create a new order with current pricing.
        
        Args:
            customer: Customer placing the order
            pickup_address: Pickup location
            delivery_address: Delivery location
            distance_km: Distance in kilometers
            
        Returns:
            Created Order instance
        """
        # Calculate price using current configuration
        price = self.config_service.calculate_price(distance_km)
        
        order = Order.objects.create(
            customer=customer,
            pickup_address=pickup_address,
            delivery_address=delivery_address,
            distance_km=distance_km,
            price=price,
            status='CREATED'
        )
        
        return order
    
    def assign_courier(self, order: Order, courier: User, assigned_by: User) -> Order:
        """
        Assign a courier to an order.
        
        Args:
            order: Order to assign
            courier: Courier to assign
            assigned_by: User making the assignment
            
        Returns:
            Updated Order instance
        """
        if order.status != 'CREATED':
            raise ValueError(f"Cannot assign courier to order with status {order.status}")
        
        if courier.role != 'COURIER':
            raise ValueError("Assigned user must be a courier")
        
        # Check courier availability
        courier_status, created = CourierStatus.objects.get_or_create(
            courier=courier,
            defaults={'is_available': True, 'current_orders_count': 0}
        )
        
        if not courier_status.is_available:
            raise ValueError("Courier is not available")
        
        # Assign the order
        order.assigned_courier = courier
        order.status = 'ASSIGNED'
        order.assigned_at = timezone.now()
        order.save()
        
        # Update courier status
        courier_status.current_orders_count += 1
        courier_status.save()
        
        return order