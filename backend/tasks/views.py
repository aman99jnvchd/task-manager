# tasks/views.py
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Task
from .serializers import TaskSerializer
from .utils import is_admin
from django.contrib.auth.models import Group, User
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from .filters import TaskFilter
from django.core.exceptions import ValidationError

class TaskViewSet(ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = TaskFilter

    # Fetch task list
    def get_queryset(self):
        user = self.request.user
        is_user_admin = is_admin(user)

        if is_user_admin:
            # return Task.objects.all().order_by('-id')
            return Task.objects.select_related('assigned_to').all().order_by('-id')
        else:
            # return Task.objects.filter(assigned_to=user).order_by('-id')
            return Task.objects.select_related('assigned_to').filter(assigned_to=user).order_by('-id')

    # Create task
    def perform_create(self, serializer):
        user = self.request.user
        if not is_admin(user):
            raise PermissionDenied("Only admin users can create tasks")
        
        assigned_user_id = self.request.data.get('assigned_to')
        if not assigned_user_id:
            raise ValidationError("Please assign this task to someone")
        
        try:
            assigned_user = User.objects.get(id=assigned_user_id)
        except User.DoesNotExist:
            raise ValidationError("Assigned user does not exist")
        
        if not assigned_user.groups.filter(name='user').exists():
            raise ValidationError("Assigned user is not eligible anymore.")
        
        task = serializer.save(assigned_to=assigned_user)
        
        cache.delete('user_list_cache')
        cache.delete('admin_list_cache')
        from .serializers import TaskSerializer
        broadcast_task_event('created', TaskSerializer(task).data, assigned_to_id=task.assigned_to.id)

        # Invalidate cache on create
        cache.delete('tasks_admin')
        cache.delete(f'tasks_user_{task.assigned_to.id}')

    # Update task
    def update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            # Get only is_completed & is_approval_requested from request
            allowed_fields = {'is_completed', 'is_approval_requested'}
            incoming_fields = set(request.data.keys())

            if not incoming_fields.issubset(allowed_fields):
                raise PermissionDenied(f"Only 'is_completed' and 'is_approval_requested' fields are allowed. Received: {incoming_fields}")

            # Only update if fields are valid boolean
            for field in incoming_fields:
                if not isinstance(request.data.get(field), bool):
                    raise PermissionDenied(f"{field} must be a boolean.")
            
            response = super().update(request, *args, **kwargs)
            task = self.get_object()

            cache.delete('user_list_cache')
            cache.delete('admin_list_cache')

            broadcast_task_event(
                'updated',
                response.data,
                assigned_to_id=task.assigned_to.id
            )

            # Invalidate user cache
            cache.delete(f'tasks_user_{task.assigned_to.id}')
            return response
        
        # keep old assignee before update
        instance = self.get_object()
        previous_assignee_id = instance.assigned_to_id

        # updates the model and saves it using DRF’s default logic
        response = super().update(request, *args, **kwargs)
        task = self.get_object()

        # New assignee after update
        updated_assignee_id = task.assigned_to_id
        if previous_assignee_id == updated_assignee_id:
            previous_assignee_id = None

        cache.delete('user_list_cache')
        cache.delete('admin_list_cache')
        
        broadcast_task_event(
            'updated',
            response.data,
            assigned_to_id=task.assigned_to.id,
            previous_assignee_id=previous_assignee_id
        )

        # Invalidate admin + both user caches
        cache.delete('tasks_admin')
        cache.delete(f'tasks_user_{updated_assignee_id}')
        if previous_assignee_id:
            cache.delete(f'tasks_user_{previous_assignee_id}')
        return response

    # Delete task
    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            raise PermissionDenied("Only admin users can delete tasks")
        task = self.get_object()
        task_id = task.id
        assigned_id = task.assigned_to.id
        self.perform_destroy(task)  # task deletion
        broadcast_task_event('deleted', {'id': task_id}, assigned_to_id=assigned_id)
        # Invalidate cache on delete
        cache.delete('tasks_admin')
        cache.delete(f'tasks_user_{assigned_id}')
        return Response(status=204)

# list of users from group `user`
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    if not is_admin(request.user):
        return Response(status=403)

    cache_key = 'user_list_cache'
    cached_users = cache.get(cache_key)
    if cached_users:
        return Response(cached_users)

    try:
        user_group = Group.objects.get(name='user')  # group name is case-sensitive
        users = user_group.user_set.filter(is_staff=False, is_superuser=False).values('id', 'username')
        
        cache.set(cache_key, users, timeout=30)
        return Response(users)
    except Group.DoesNotExist:
        return Response({'detail': 'User group does not exist.'}, status=404)

# list of users from group `admin`
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list(request):
    cache_key = 'admin_list_cache'
    cached_admins = cache.get(cache_key)
    if cached_admins:
        return Response(cached_admins)

    try:
        admin_group = Group.objects.get(name='admin')
        admins = admin_group.user_set.values('id', 'username')

        cache.set(cache_key, admins, timeout=30)
        return Response(admins)
    except Group.DoesNotExist:
        return Response({'detail': 'Admin group does not exist.'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'is_admin': is_admin(user),
    })

# Broadcast event to admins and the assigned user
def broadcast_task_event(event_type, task_data, assigned_to_id=None, previous_assignee_id=None):
    channel_layer = get_channel_layer()

    # Notify all relevant users
    groups_to_notify = set()

    # Add admin group to notify
    groups_to_notify.add("admins")

    # Add assignee group to notify
    if assigned_to_id:
        groups_to_notify.add(f"user_{assigned_to_id}")
    
    # Add old assignee - in case of task assignee change
    if previous_assignee_id:
        groups_to_notify.add(f"user_{previous_assignee_id}")
    
    # Send to all relevant users
    for group in groups_to_notify:
        async_to_sync(channel_layer.group_send)(
            group, {
                "type": "send_task_update",
                "content": {
                    "event": event_type,
                    "task": task_data,
                }
            }
        )
