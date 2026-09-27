from django.db.models import Q

from apps.common.repositories import BaseRepository

from .models import User


class UserRepository(BaseRepository):
    model = User
    not_found_message = 'Utilisateur introuvable.'

    def list(self, search=None):
        queryset = self.get_queryset()
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) | Q(first_name__icontains=search) | Q(last_name__icontains=search)
            )
        return queryset

    def get_active_by_id(self, pk):
        return self.model.objects.filter(pk=pk, is_active=True).first()

    def email_exists(self, email, exclude_pk=None):
        queryset = self.model.objects.filter(email__iexact=email)
        if exclude_pk is not None:
            queryset = queryset.exclude(pk=exclude_pk)
        return queryset.exists()

    def create(self, **data):
        password = data.pop('password')
        return self.model.objects.create_user(password=password, **data)

    def set_password(self, user, password):
        user.set_password(password)
        user.save(update_fields=['password'])
        return user
