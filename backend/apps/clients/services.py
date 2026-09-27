from django.db import transaction
from django.utils import timezone

from apps.common.lookups import LookupService
from apps.common.services import BaseService

from .repositories import CategoryRepository, CityRepository, ClientRepository, CommandeRepository


class ClientService(BaseService):
    repository_class = ClientRepository

    def cities(self):
        return CityRepository().names()


class CategoryService(LookupService):
    repository_class = CategoryRepository
    duplicate_message = 'Cette catégorie existe déjà.'
    in_use_message = 'Suppression impossible : cette catégorie est utilisée par des commandes.'


class CityService(LookupService):
    repository_class = CityRepository
    duplicate_message = 'Cette ville existe déjà.'
    in_use_message = 'Suppression impossible : cette ville est utilisée par des commandes ou des clients.'


class CommandeService(BaseService):
    repository_class = CommandeRepository

    @transaction.atomic
    def create(self, data, user=None):
        commande = self.repository.create(**data, created_by=user)
        return self.repository.get_by_id(commande.pk)

    @transaction.atomic
    def update(self, instance, data):
        self.repository.update(instance, **data)
        return self.repository.get_by_id(instance.pk)

    def stats(self):
        return {
            'total_clients': self.repository.distinct_clients_count(),
            'total_commandes': self.repository.count(),
            'commandes_aujourdhui': self.repository.count_on(timezone.localdate()),
            'villes_couvertes': self.repository.distinct_cities_count(),
        }
