from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Notification
from .serializers import (
    NotificationSerializer, NotificationCreateSerializer, 
    NotificationMarkReadSerializer, UnreadCountResponseSerializer
)


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for notification management"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter notifications for the current user"""
        return Notification.objects.filter(user=self.request.user).select_related('related_order')

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return NotificationCreateSerializer
        elif self.action == 'mark_as_read':
            return NotificationMarkReadSerializer
        return NotificationSerializer

    def create(self, request, *args, **kwargs):
        """Create a new notification"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notification = serializer.save()
        
        response_serializer = NotificationSerializer(notification)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications for the current user"""
        unread_notifications = self.get_queryset().filter(is_read=False)
        serializer = NotificationSerializer(unread_notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        response_data = {'unread_count': count}
        
        # Validate response format for consistency
        serializer = UnreadCountResponseSerializer(data=response_data)
        serializer.is_valid(raise_exception=True)
        
        return Response(serializer.validated_data)

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        """Mark multiple notifications as read"""
        serializer = NotificationMarkReadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        notification_ids = serializer.validated_data['notification_ids']
        
        # Update notifications
        updated_count = Notification.objects.filter(
            id__in=notification_ids,
            user=request.user
        ).update(is_read=True)
        
        return Response({
            'message': f'{updated_count} notifications marked as read',
            'updated_count': updated_count
        })

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user"""
        updated_count = self.get_queryset().filter(is_read=False).update(is_read=True)
        
        return Response({
            'message': f'All {updated_count} notifications marked as read',
            'updated_count': updated_count
        })

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent notifications (last 50)"""
        recent_notifications = self.get_queryset()[:50]
        serializer = NotificationSerializer(recent_notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def order_notifications(self, request):
        """Get notifications related to orders"""
        order_id = request.query_params.get('order_id')
        
        queryset = self.get_queryset().filter(related_order__isnull=False)
        
        if order_id:
            try:
                order_id = int(order_id)
                queryset = queryset.filter(related_order_id=order_id)
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid order_id parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = NotificationSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'])
    def clear_read(self, request):
        """Delete all read notifications for the current user"""
        deleted_count, _ = self.get_queryset().filter(is_read=True).delete()
        
        return Response({
            'message': f'{deleted_count} read notifications deleted',
            'deleted_count': deleted_count
        })

    def destroy(self, request, *args, **kwargs):
        """Delete a notification"""
        notification = self.get_object()
        notification.delete()
        return Response(
            {'message': 'Notification deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )
