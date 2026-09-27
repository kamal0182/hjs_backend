from django.db.models import Q

from apps.common.lookups import LookupRepository
from apps.common.repositories import BaseRepository

from .models import Category, City, Client, Commande, CommandeLine


class CategoryRepository(LookupRepository):
    model = Category
    not_found_message = 'Catégorie introuvable.'
    usages = [(CommandeLine, 'category')]


class CityRepository(LookupRepository):
    model = City
    not_found_message = 'Ville introuvable.'
    usages = [(Commande, 'city'), (Client, 'city')]


class ClientRepository(BaseRepository):
    model = Client
    not_found_message = 'Client introuvable.'

    def list(self, search=None):
        queryset = self.get_queryset()
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(company__icontains=search))
        return queryset


class CommandeRepository(BaseRepository):
    model = Commande
    not_found_message = 'Commande introuvable.'

    def get_queryset(self):
        return self.model.objects.select_related('client').prefetch_related('lines')

    def list(self, search=None, city=None, date=None):
        queryset = self.get_queryset()
        if search:
            queryset = queryset.filter(
                Q(client__name__icontains=search) | Q(client__company__icontains=search)
            )
        if city:
            queryset = queryset.filter(city=city)
        if date:
            queryset = queryset.filter(date=date)
        return queryset

    def create(self, lines, **data):
        commande = self.model.objects.create(**data)
        # Reference derived from the primary key: unique and race-free.
        commande.reference = f'CMD-{commande.pk:03d}'
        commande.save(update_fields=['reference'])
        self.replace_lines(commande, lines)
        return commande

    def update(self, instance, lines=None, **data):
        instance = super().update(instance, **data)
        if lines is not None:
            self.replace_lines(instance, lines)
        return instance

    def replace_lines(self, commande, lines):
        commande.lines.all().delete()
        CommandeLine.objects.bulk_create(
            CommandeLine(commande=commande, category=line['category'], quantity=line['quantity'])
            for line in lines
        )

    def count(self):
        return self.model.objects.count()

    def count_on(self, day):
        return self.model.objects.filter(date=day).count()

    def distinct_clients_count(self):
        return self.model.objects.values('client').distinct().count()

    def distinct_cities_count(self):
        return self.model.objects.values('city').distinct().count()
