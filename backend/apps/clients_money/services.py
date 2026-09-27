from decimal import Decimal

from apps.common.lookups import LookupService
from apps.common.services import BaseService

from .repositories import ClientMoneyRecordRepository, PaymentRepository, PaymentTypeRepository


class ClientMoneyRecordService(BaseService):
    repository_class = ClientMoneyRecordRepository

    def summaries(self, search=None):
        return self.repository.summaries(search=search)

    def stats(self):
        records = self.repository.totals()
        payments = PaymentRepository().totals()
        zero = Decimal('0')
        return {
            'total_collected': (records['total_montant'] or zero) + (payments['total_price'] or zero),
            'total_clients': records['total_records'],
            'total_payments': payments['total_payments'],
        }


class PaymentService(BaseService):
    repository_class = PaymentRepository


class PaymentTypeService(LookupService):
    repository_class = PaymentTypeRepository
    duplicate_message = 'Ce type de paiement existe déjà.'
    in_use_message = 'Suppression impossible : ce type de paiement est utilisé par des paiements.'
