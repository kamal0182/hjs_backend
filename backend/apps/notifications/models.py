from django.db import models


class NotificationLog(models.Model):
    """
    One reminder already sent for a payment. Makes the scheduler idempotent:
    it can run every hour (or be restarted) without emailing twice.
    """

    class Kind(models.TextChoices):
        DAY_BEFORE = 'day_before', 'Veille de l’échéance'
        DUE_DAY = 'due_day', 'Jour de l’échéance'

    payment = models.ForeignKey('clients_money.Payment', on_delete=models.CASCADE, related_name='notifications')
    kind = models.CharField(max_length=20, choices=Kind.choices)
    # The due date the reminder was about: if the payment date is edited later,
    # reminders are sent again for the new date.
    due_date = models.DateField()
    recipients = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sent_at']
        constraints = [
            models.UniqueConstraint(fields=['payment', 'kind', 'due_date'], name='unique_notification_per_due_date'),
        ]

    def __str__(self):
        return f'{self.payment} — {self.get_kind_display()}'
