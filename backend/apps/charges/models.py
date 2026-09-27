from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import TimeStampedModel


class Charge(TimeStampedModel):
    """A company expense."""

    date = models.DateField()
    comment = models.TextField()
    montant = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        ordering = ['-date', '-id']

    def __str__(self):
        return f'{self.date} — {self.montant}'
