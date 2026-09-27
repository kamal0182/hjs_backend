from rest_framework import status, viewsets
from rest_framework.response import Response

from .pagination import StandardPagination
from .permissions import IsAdminOrReadOnly


class ServiceViewSet(viewsets.ViewSet):
    """
    CRUD viewset that delegates everything to a service.

    - `serializer_class` renders responses.
    - `input_serializer_class` validates create/update payloads (defaults to
      `serializer_class`). Its `validated_data` is handed to the service.
    - `paginate` wraps `list` in StandardPagination.
    - Override `get_filters` to turn query params into service kwargs.
    """

    service_class = None
    serializer_class = None
    input_serializer_class = None
    paginate = False
    permission_classes = [IsAdminOrReadOnly]

    def get_service(self):
        return self.service_class()

    def get_input_serializer_class(self):
        return self.input_serializer_class or self.serializer_class

    def get_filters(self):
        return {}

    def respond_list(self, items, serializer_class=None):
        serializer_class = serializer_class or self.serializer_class
        if self.paginate:
            paginator = StandardPagination()
            page = paginator.paginate_queryset(items, self.request, view=self)
            return paginator.get_paginated_response(serializer_class(page, many=True).data)
        return Response(serializer_class(items, many=True).data)

    def list(self, request):
        return self.respond_list(self.get_service().list(**self.get_filters()))

    def retrieve(self, request, pk=None):
        instance = self.get_service().get(pk)
        return Response(self.serializer_class(instance).data)

    def create(self, request):
        serializer = self.get_input_serializer_class()(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.get_service().create(serializer.validated_data, user=request.user)
        return Response(self.serializer_class(instance).data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None, partial=False):
        service = self.get_service()
        instance = service.get(pk)
        serializer = self.get_input_serializer_class()(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = service.update(instance, serializer.validated_data)
        return Response(self.serializer_class(instance).data)

    def partial_update(self, request, pk=None):
        return self.update(request, pk, partial=True)

    def destroy(self, request, pk=None):
        service = self.get_service()
        service.delete(service.get(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)
