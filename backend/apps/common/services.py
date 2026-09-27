class BaseService:
    """Business layer: views call services, services call repositories."""

    repository_class = None

    def __init__(self, repository=None):
        self.repository = repository or self.repository_class()

    def list(self, **filters):
        return self.repository.list(**filters)

    def get(self, pk):
        return self.repository.get_by_id(pk)

    def create(self, data, user=None):
        return self.repository.create(**data, created_by=user)

    def update(self, instance, data):
        return self.repository.update(instance, **data)

    def delete(self, instance):
        self.repository.delete(instance)
