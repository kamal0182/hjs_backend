"""
Shared plumbing for user-managed lists (catégories, villes, types de paiement).

Business records store the lookup's *name* as plain text, so the API contract
stays a simple string. The service keeps that text consistent: renaming a value
rewrites every record that uses it, and a value still in use cannot be deleted.
"""

from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .exceptions import Conflict
from .repositories import BaseRepository
from .services import BaseService
from .views import ServiceViewSet


class LookupRepository(BaseRepository):
    # [(Model, field_name), ...] — every column that stores this lookup's name.
    usages = []

    def name_exists(self, name, exclude_pk=None):
        queryset = self.model.objects.filter(name__iexact=name)
        if exclude_pk is not None:
            queryset = queryset.exclude(pk=exclude_pk)
        return queryset.exists()

    def canonical_name(self, name):
        """The stored spelling of `name` (case-insensitive match), or None."""
        return self.model.objects.filter(name__iexact=name.strip()).values_list('name', flat=True).first()

    def names(self):
        return list(self.model.objects.order_by('name').values_list('name', flat=True))

    def is_used(self, name):
        return any(model.objects.filter(**{field: name}).exists() for model, field in self.usages)

    def rename_usages(self, old, new):
        for model, field in self.usages:
            model.objects.filter(**{field: old}).update(**{field: new})


class LookupService(BaseService):
    duplicate_message = 'Cette valeur existe déjà.'
    in_use_message = 'Suppression impossible : cette valeur est utilisée.'

    def create(self, data, user=None):
        if self.repository.name_exists(data['name']):
            raise ValidationError({'name': self.duplicate_message})
        return super().create(data, user=user)

    @transaction.atomic
    def update(self, instance, data):
        if self.repository.name_exists(data['name'], exclude_pk=instance.pk):
            raise ValidationError({'name': self.duplicate_message})
        old_name = instance.name
        instance = super().update(instance, data)
        if instance.name != old_name:
            self.repository.rename_usages(old_name, instance.name)
        return instance

    def delete(self, instance):
        if self.repository.is_used(instance.name):
            raise Conflict(self.in_use_message)
        super().delete(instance)


class LookupSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=100)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Veuillez indiquer un nom.')
        return value


class LookupViewSet(ServiceViewSet):
    """GET/POST /<lookup>/, PUT/DELETE /<lookup>/<id>/ — any user reads, admins write."""

    serializer_class = LookupSerializer


def resolve_lookup(repository_class, value, message):
    """For serializer validate_<field>: return the stored spelling or reject unknown names."""
    name = repository_class().canonical_name(value)
    if name is None:
        raise serializers.ValidationError(message)
    return name
