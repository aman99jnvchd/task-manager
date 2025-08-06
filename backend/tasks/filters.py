# tasks/filters.py
import django_filters
from django.db.models import Q
from django_filters import rest_framework
from .models import Task
from datetime import date, timedelta

class TaskFilter(django_filters.FilterSet):
    is_completed = django_filters.BooleanFilter(method='filter_admin_status_completed')
    approval_status = rest_framework.CharFilter(method='filter_approval_status')
    due_date = rest_framework.CharFilter(method='filter_due_date_keyword')

    class Meta:
        model = Task
        fields = {
            'priority': ['exact'],
            'assigned_to': ['exact'],
            'assigned_by': ['exact']
        }

    def filter_admin_status_completed(self, queryset, name, value):
        user = getattr(self.request, 'user', None)

        if user and user.groups.filter(name='admin').exists():
            if value is True:
                # Admin: Completed -> Only approval sent + completed tasks
                return queryset.filter(is_completed=True, is_approval_requested=True)
            else:
                # Admin: In Progress -> Show in Progress OR completed but not approval sent
                return queryset.filter(
                    Q(is_completed=False) | Q(is_completed=True, is_approval_requested=False)
                )
        else:
            # Non-admin: default behavior
            return queryset.filter(**{name: value})
    
    def filter_approval_status(self, queryset, name, value):
        user = getattr(self.request, 'user', None)
        # Return approved tasks
        if value == 'approved':
            return queryset.filter(
                is_completed=True,
                is_approval_requested=True,
                approved_by__isnull=False
            )
        # Return tasks with approval pending
        elif value == 'pending':
            return queryset.filter(
                is_completed=True,
                is_approval_requested=True,
                approved_by__isnull=True
            )
        # Return tasks that do not meet the approved condition
        elif value == 'exclude_approved':
            return queryset.exclude(
                is_completed=True,
                is_approval_requested=True,
                approved_by__isnull=False
            )
        # when this filter not applied or empty
        return queryset
    
    def filter_due_date_keyword(self, queryset, name, value):
        today = date.today()
        if value == 'today':
            return queryset.filter(due_date=today)
        elif value == 'tomorrow':
            return queryset.filter(due_date=today + timedelta(days=1))
        elif value == 'this_week':
            start_of_week = today - timedelta(days=today.weekday())  # Monday
            end_of_week = start_of_week + timedelta(days=6)          # Sunday
            return queryset.filter(due_date__range=(start_of_week, end_of_week))
        elif value == 'future':
            return queryset.filter(due_date__gt=today)
        elif value == 'overdue':
            return queryset.filter(due_date__lt=today)
        return queryset
