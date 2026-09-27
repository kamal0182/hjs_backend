from django.contrib import admin

from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['payment', 'kind', 'due_date', 'sent_at']
    list_filter = ['kind', 'due_date']
    readonly_fields = ['payment', 'kind', 'due_date', 'recipients', 'sent_at']
