from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )


class IsCustomerUser(permissions.BasePermission):
    """
    Custom permission to only allow customer users to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'CUSTOMER'
        )


class IsCourierUser(permissions.BasePermission):
    """
    Custom permission to only allow courier users to access the view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'COURIER'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admin users to access it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin users can access any object
        if request.user.role == 'ADMIN':
            return True
        
        # Check if the object has an owner field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'customer'):
            return obj.customer == request.user
        elif hasattr(obj, 'assigned_courier'):
            return obj.assigned_courier == request.user
        
        # For User objects, check if it's the same user
        if hasattr(obj, 'id') and hasattr(request.user, 'id'):
            return obj.id == request.user.id
        
        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow read-only access to any authenticated user,
    but only allow write permissions to admin users.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for admin users
        return request.user.role == 'ADMIN'


class RoleBasedPermission(permissions.BasePermission):
    """
    Permission class that checks user roles based on view configuration.
    Views can define allowed_roles attribute to specify which roles can access them.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if view has allowed_roles defined
        allowed_roles = getattr(view, 'allowed_roles', None)
        if allowed_roles is None:
            # If no roles specified, allow all authenticated users
            return True
        
        return request.user.role in allowed_roles


class CourierOrAdminPermission(permissions.BasePermission):
    """
    Permission to allow access to courier or admin users only.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['COURIER', 'ADMIN']
        )


class CustomerOrAdminPermission(permissions.BasePermission):
    """
    Permission to allow access to customer or admin users only.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['CUSTOMER', 'ADMIN']
        )