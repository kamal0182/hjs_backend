from django.db.models import Count, IntegerField, OuterRef, Subquery, Sum, Value
from django.db.models.functions import Coalesce

from apps.common.repositories import BaseRepository

from .models import Camion, GazoilComment, GazoilRecord


class CamionRepository(BaseRepository):
    model = Camion
    not_found_message = 'Camion introuvable.'

    def get_or_create_by_matricule(self, matricule, user=None):
        camion, _ = self.model.objects.get_or_create(
            matricule__iexact=matricule,
            defaults={'matricule': matricule, 'created_by': user},
        )
        return camion

    def matricule_exists(self, matricule, exclude_pk=None):
        queryset = self.model.objects.filter(matricule__iexact=matricule)
        if exclude_pk is not None:
            queryset = queryset.exclude(pk=exclude_pk)
        return queryset.exists()

    def summaries(self, search=None):
        """One row per truck that has at least one fill-up, newest activity first."""
        latest = GazoilRecord.objects.filter(camion=OuterRef('pk')).order_by('-date', '-id')
        comments_count = (
            GazoilComment.objects.filter(camion=OuterRef('pk'))
            .order_by()
            .values('camion')
            .annotate(c=Count('id'))
            .values('c')
        )
        queryset = self.model.objects.annotate(
            latest_price=Subquery(latest.values('price')[:1]),
            latest_date=Subquery(latest.values('date')[:1]),
            records_count=Count('records'),
            total_price=Sum('records__price'),
            comments_count=Coalesce(Subquery(comments_count, output_field=IntegerField()), Value(0)),
        ).filter(records_count__gt=0)
        if search:
            queryset = queryset.filter(matricule__icontains=search)
        return queryset.order_by('-latest_date', 'matricule')

    def directory(self, search=None):
        """Every truck, with or without fill-ups, for the management page."""
        comments_count = (
            GazoilComment.objects.filter(camion=OuterRef('pk'))
            .order_by()
            .values('camion')
            .annotate(c=Count('id'))
            .values('c')
        )
        queryset = self.model.objects.annotate(
            records_count=Count('records'),
            comments_count=Coalesce(Subquery(comments_count, output_field=IntegerField()), Value(0)),
        )
        if search:
            queryset = queryset.filter(matricule__icontains=search)
        return queryset.order_by('matricule')

    def matricules(self):
        return list(self.model.objects.order_by('matricule').values_list('matricule', flat=True))

    def count_with_records(self):
        return self.model.objects.filter(records__isnull=False).distinct().count()


class GazoilRecordRepository(BaseRepository):
    model = GazoilRecord
    not_found_message = 'Plein introuvable.'

    def get_queryset(self):
        return self.model.objects.select_related('camion')

    def list(self, matricule=None):
        queryset = self.get_queryset()
        if matricule:
            queryset = queryset.filter(camion__matricule__iexact=matricule)
        return queryset

    def totals(self):
        return self.model.objects.aggregate(total_price=Sum('price'), total_records=Count('id'))


class GazoilCommentRepository(BaseRepository):
    model = GazoilComment
    not_found_message = 'Commentaire introuvable.'

    def get_queryset(self):
        return self.model.objects.select_related('camion')

    def list(self, matricule=None):
        queryset = self.get_queryset()
        if matricule:
            queryset = queryset.filter(camion__matricule__iexact=matricule)
        return queryset
