# tasks/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Task(models.Model):
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', db_index=True)
    due_date = models.DateField(db_index=True)
    is_completed = models.BooleanField(default=False, db_index=True)

    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks_assignee', db_index=True)
    assigned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks_creater', null=True, blank=True, db_index=True)
    assigned_at = models.DateTimeField(default=timezone.now, null=True, blank=True)

    is_approval_requested = models.BooleanField(default=False, db_index=True)
    approved_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='approved_tasks', null=True, blank=True, db_index=True)
    approved_at = models.DateTimeField(default=timezone.now, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
