from decimal import Decimal

from apps.common.services import BaseService

from .repositories import ChargeRepository


class ChargeService(BaseService):
    repository_class = ChargeRepository

    def stats(self):
        totals = self.repository.totals()
        return {
            'total_montant': totals['total_montant'] or Decimal('0'),
            'total_records': totals['total_records'],
        }
