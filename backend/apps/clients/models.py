from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import LookupModel, TimeStampedModel


class Category(LookupModel):
    """Product category of a commande line (e.g. Ramla, Kayas, Toufna)."""

    class Meta(LookupModel.Meta):
        verbose_name_plural = 'categories'


class City(LookupModel):
    """Delivery city (ville) offered in the commande form."""

    class Meta(LookupModel.Meta):
        verbose_name_plural = 'cities'


class Client(TimeStampedModel):
    name = models.CharField(max_length=150)
    company = models.CharField(max_length=150, blank=True)
    city = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.company})' if self.company else self.name


class Commande(TimeStampedModel):
    """One order. A client can have many; one order can cover several categories."""

    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='commandes')
    reference = models.CharField(max_length=20, unique=True, null=True, editable=False)
    date = models.DateField()
    city = models.CharField(max_length=100)  # a City name
    address = models.CharField(max_length=255)
    comment = models.TextField(blank=True)

    class Meta:
        ordering = ['-date', '-id']
        indexes = [models.Index(fields=['date']), models.Index(fields=['city'])]

    def __str__(self):
        return self.reference or f'Commande #{self.pk}'


class CommandeLine(models.Model):
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='lines')
    category = models.CharField(max_length=100)  # a Category name
    quantity = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])

    class Meta:
        ordering = ['id']
        constraints = [
            models.UniqueConstraint(fields=['commande', 'category'], name='unique_category_per_commande'),
        ]

    def __str__(self):
        return f'{self.category}: {self.quantity}'
