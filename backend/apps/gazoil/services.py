from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.common.services import BaseService

from .repositories import CamionRepository, GazoilCommentRepository, GazoilRecordRepository


class CamionService(BaseService):
    repository_class = CamionRepository

    def summaries(self, search=None):
        return self.repository.summaries(search=search)

    def directory(self, search=None):
        return self.repository.directory(search=search)

    def matricules(self):
        return self.repository.matricules()

    def create(self, data, user=None):
        if self.repository.matricule_exists(data['matricule']):
            raise ValidationError({'matricule': 'Ce matricule existe déjà.'})
        return super().create(data, user=user)

    def update(self, instance, data):
        if 'matricule' in data and self.repository.matricule_exists(data['matricule'], exclude_pk=instance.pk):
            raise ValidationError({'matricule': 'Ce matricule existe déjà.'})
        return super().update(instance, data)

    def stats(self):
        totals = GazoilRecordRepository().totals()
        return {
            'total_price_all': totals['total_price'] or Decimal('0'),
            'total_records': totals['total_records'],
            'total_camions': self.repository.count_with_records(),
        }


class _CamionLinkedService(BaseService):
    """Records and comments are submitted with a matricule; resolve it to a Camion."""

    def __init__(self, repository=None, camion_repository=None):
        super().__init__(repository)
        self.camion_repository = camion_repository or CamionRepository()

    def _resolve_camion(self, data, user=None):
        data = dict(data)
        matricule = data.pop('matricule', None)
        if matricule is not None:
            data['camion'] = self.camion_repository.get_or_create_by_matricule(matricule, user=user)
        return data

    @transaction.atomic
    def create(self, data, user=None):
        return super().create(self._resolve_camion(data, user), user=user)

    @transaction.atomic
    def update(self, instance, data):
        return super().update(instance, self._resolve_camion(data))


class GazoilRecordService(_CamionLinkedService):
    repository_class = GazoilRecordRepository


class GazoilCommentService(_CamionLinkedService):
    repository_class = GazoilCommentRepository
