from decimal import Decimal

from django.db.models import (
    Case,
    Count,
    DateField,
    DecimalField,
    F,
    OuterRef,
    Subquery,
    Sum,
    Value,
    When,
)
from django.db.models.functions import Coalesce

from apps.common.lookups import LookupRepository
from apps.common.repositories import BaseRepository

from .models import ClientMoneyRecord, Payment, PaymentType

MONEY = DecimalField(max_digits=14, decimal_places=2)


class ClientMoneyRecordRepository(BaseRepository):
    model = ClientMoneyRecord
    not_found_message = 'Client introuvable.'

    def summaries(self, search=None):
        """
        One row per record. The record's own montant counts as its first entry;
        a later payment supersedes it as the "latest" entry.
        """
        latest_payment = Payment.objects.filter(record=OuterRef('pk')).order_by('-date', '-id')
        queryset = self.model.objects.annotate(
            last_payment_date=Subquery(latest_payment.values('date')[:1]),
            last_payment_price=Subquery(latest_payment.values('price')[:1]),
            payments_count=Count('payments'),
            payments_total=Coalesce(Sum('payments__price'), Value(Decimal('0')), output_field=MONEY),
        ).annotate(
            latest_date=Case(
                When(last_payment_date__gte=F('date'), then=F('last_payment_date')),
                default=F('date'),
                output_field=DateField(),
            ),
            latest_montant=Case(
                When(last_payment_date__gte=F('date'), then=F('last_payment_price')),
                default=F('montant'),
                output_field=MONEY,
            ),
            total_montant=F('montant') + F('payments_total'),
        )
        if search:
            queryset = queryset.filter(client_name__icontains=search)
        return queryset.order_by('-latest_date', '-id')

    def totals(self):
        return self.model.objects.aggregate(total_montant=Sum('montant'), total_records=Count('id'))


class PaymentRepository(BaseRepository):
    model = Payment
    not_found_message = 'Paiement introuvable.'

    def get_queryset(self):
        return self.model.objects.select_related('record')

    def list(self, record_id=None):
        queryset = self.get_queryset()
        if record_id:
            queryset = queryset.filter(record_id=record_id)
        return queryset

    def totals(self):
        return self.model.objects.aggregate(total_price=Sum('price'), total_payments=Count('id'))


class PaymentTypeRepository(LookupRepository):
    model = PaymentType
    not_found_message = 'Type de paiement introuvable.'
    usages = [(Payment, 'payment_type')]
