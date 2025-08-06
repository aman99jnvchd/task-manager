# tasks/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, user_list, admin_list, current_user

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
    path('users/', user_list),  # GET for admin only
    path('admins/', admin_list),
    path('me/', current_user),  # GET logged in user deatils
]
