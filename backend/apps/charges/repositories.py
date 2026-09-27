from django.db.models import Count, Sum

from apps.common.repositories import BaseRepository

from .models import Charge


class ChargeRepository(BaseRepository):
    model = Charge
    not_found_message = 'Charge introuvable.'

    def totals(self):
        return self.model.objects.aggregate(total_montant=Sum('montant'), total_records=Count('id'))
