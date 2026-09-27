from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    """Audit fields shared by every business model."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
        editable=False,
    )

    class Meta:
        abstract = True


class LookupModel(TimeStampedModel):
    """A user-managed list value (catégorie, ville, type de paiement)."""

    name = models.CharField(max_length=100, unique=True)

    class Meta:
        abstract = True
        ordering = ['name']

    def __str__(self):
        return self.name
