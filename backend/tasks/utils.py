# tasks/utils.py
from asgiref.sync import sync_to_async

def is_admin(user):
    return user.is_superuser or user.is_staff or user.groups.filter(name='admin').exists()

@sync_to_async
def is_admin_async(user):
    return is_admin(user)
