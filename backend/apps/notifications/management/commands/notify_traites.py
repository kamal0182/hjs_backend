from datetime import date

from django.core.management.base import BaseCommand, CommandError

from apps.notifications.services import notify_upcoming_traites


class Command(BaseCommand):
    help = 'Email active admins about Traite payments due tomorrow and today (never sends a reminder twice).'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='List what would be sent without sending.')
        parser.add_argument('--date', help='Pretend today is this date (YYYY-MM-DD), for testing.')

    def handle(self, *args, **options):
        today = None
        if options['date']:
            try:
                today = date.fromisoformat(options['date'])
            except ValueError:
                raise CommandError('--date must be YYYY-MM-DD.')

        due_today, due_tomorrow, recipients = notify_upcoming_traites(today=today, dry_run=options['dry_run'])

        if not (due_today or due_tomorrow):
            self.stdout.write('No Traite reminders to send.')
            return
        if not recipients:
            self.stderr.write(self.style.WARNING('Traites are due but there is no active admin with an email.'))
            return

        for label, payments in (('today', due_today), ('tomorrow', due_tomorrow)):
            for p in payments:
                self.stdout.write(f'  due {label}: {p.record.client_name} — {p.price} DH ({p.date})')
        verb = 'Would send' if options['dry_run'] else 'Sent'
        self.stdout.write(self.style.SUCCESS(f"{verb} reminder to {', '.join(recipients)}"))
