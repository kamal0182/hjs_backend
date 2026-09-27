from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import User

USERS = [
    {
        'email': 'jawadmouhsin@gmail.com',
        'first_name': 'Jawad',
        'last_name': 'Mouhsine',
        'password': 'jawad2004',
        'role': User.Role.ADMIN,
    },
    {
        'email': 'hishammouhsine@gmail.com',
        'first_name': 'Hisham',
        'last_name': 'Mouhsine',
        'password': 'mouhsine2004',
        'role': User.Role.ADMIN,
    },
]


class Command(BaseCommand):
    # Development only: the passwords below are in source code and are weak.
    help = 'Seed the default application users (development only).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-existing', action='store_true',
            help='Only create missing users; leave existing ones (and their passwords) untouched.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError('users_seed is for development only (DEBUG=False here).')
        for data in USERS:
            data = dict(data)
            password = data.pop('password')
            if options['skip_existing'] and User.objects.filter(email=data['email']).exists():
                self.stdout.write(f'Skipped existing user {data["email"]}')
                continue
            user, created = User.objects.update_or_create(email=data.pop('email'), defaults=data)
            user.set_password(password)
            user.save()
            action = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{action} user {user.email}'))
