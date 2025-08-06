from django.db.models.signals import m2m_changed
from django.contrib.auth.models import Group
from django.core.cache import cache
from django.dispatch import receiver

@receiver(m2m_changed, sender=Group.user_set.through)
def clear_user_admin_cache_on_group_change(sender, instance, **kwargs):
    print("Clearing cache due to group membership change")
    cache.delete('user_list_cache')
    cache.delete('admin_list_cache')
