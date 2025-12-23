from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
# ViewSets will be registered here

app_name = 'accounts'

urlpatterns = [
    # Authentication endpoints
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    
    # User profile management
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Role-based dashboards
    path('dashboard/customer/', views.CustomerDashboardView.as_view(), name='customer_dashboard'),
    path('dashboard/courier/', views.CourierDashboardView.as_view(), name='courier_dashboard'),
    path('dashboard/admin/', views.AdminDashboardView.as_view(), name='admin_dashboard'),
    
    # Admin user management endpoints
    path('admin/users/', views.AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/users/<int:pk>/', views.AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('admin/users/<int:pk>/activate/', views.AdminUserActivationView.as_view(), name='admin_user_activation'),
    path('admin/couriers/create/', views.AdminCourierCreationView.as_view(), name='admin_courier_create'),
    path('admin/couriers/available/', views.AvailableCouriersView.as_view(), name='available_couriers'),
    
    # Router URLs
    path('api/', include(router.urls)),
]