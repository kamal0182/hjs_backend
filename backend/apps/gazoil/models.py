from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import TimeStampedModel


class Camion(TimeStampedModel):
    """A truck, identified by its licence plate (matricule)."""

    matricule = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ['matricule']

    def __str__(self):
        return self.matricule


class GazoilRecord(TimeStampedModel):
    """One fill-up (plein) for a truck."""

    camion = models.ForeignKey(Camion, on_delete=models.PROTECT, related_name='records')
    price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    date = models.DateField()

    class Meta:
        ordering = ['-date', '-id']
        indexes = [models.Index(fields=['camion', '-date'])]

    def __str__(self):
        return f'{self.camion} — {self.price} ({self.date})'


class GazoilComment(TimeStampedModel):
    """A dated note attached to a truck."""

    camion = models.ForeignKey(Camion, on_delete=models.CASCADE, related_name='comments')
    comment = models.TextField()
    date = models.DateField()

    class Meta:
        ordering = ['-date', '-id']

    def __str__(self):
        return f'{self.camion} — {self.date}'
