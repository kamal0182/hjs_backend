from django.core.paginator import EmptyPage, Paginator
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class ClampingPaginator(Paginator):
    """A page past the end returns the last page instead of a 404 (e.g. after deleting its last row)."""

    def validate_number(self, number):
        try:
            return super().validate_number(number)
        except EmptyPage:
            return self.num_pages if int(number) > 1 else 1


class StandardPagination(PageNumberPagination):
    """Matches the frontend `PaginatedResult<T>` shape: {data, total, page, pageSize}."""

    django_paginator_class = ClampingPaginator
    page_size = 10
    page_size_query_param = 'pageSize'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'data': data,
            'total': self.page.paginator.count,
            'page': self.page.number,
            'pageSize': self.get_page_size(self.request),
        })
