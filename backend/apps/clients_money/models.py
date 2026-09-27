from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import LookupModel, TimeStampedModel


class PaymentType(LookupModel):
    """Payment method (type de paiement), e.g. Cash, Traite, Chèque."""


class ClientMoneyRecord(TimeStampedModel):
    """A client money account, independent from the Clients directory."""

    client_name = models.CharField(max_length=150)
    montant = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    date = models.DateField()

    class Meta:
        ordering = ['-date', '-id']

    def __str__(self):
        return self.client_name


class Payment(TimeStampedModel):
    """A payment logged against a ClientMoneyRecord."""

    record = models.ForeignKey(ClientMoneyRecord, on_delete=models.CASCADE, related_name='payments')
    payment_type = models.CharField(max_length=100)  # a PaymentType name
    price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    date = models.DateField()

    class Meta:
        ordering = ['-date', '-id']
        indexes = [models.Index(fields=['record', '-date'])]

    def __str__(self):
        return f'{self.record} — {self.payment_type} {self.price}'
