from rest_framework.exceptions import NotFound


class BaseRepository:
    """Data-access layer: the only place that talks to the ORM for a model."""

    model = None
    not_found_message = 'Ressource introuvable.'

    def get_queryset(self):
        return self.model.objects.all()

    def list(self):
        return self.get_queryset()

    def get_by_id(self, pk):
        try:
            return self.get_queryset().get(pk=pk)
        except (self.model.DoesNotExist, ValueError, TypeError):
            raise NotFound(self.not_found_message)

    def create(self, **data):
        return self.model.objects.create(**data)

    def update(self, instance, **data):
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    def delete(self, instance):
        instance.delete()
