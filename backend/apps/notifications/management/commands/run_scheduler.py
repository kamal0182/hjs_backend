import logging
import time

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import close_old_connections
from django.utils import timezone

from apps.notifications.services import notify_upcoming_traites

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    Long-running "cron" for the scheduler container.

    Every `--interval` seconds, from NOTIFY_SEND_HOUR (local time) onwards, it
    runs the Traite reminders. Reminders are logged once sent, so running
    hourly never duplicates emails and catches up after any downtime.
    """

    help = 'Run periodic notification jobs forever (used by the scheduler container).'

    def add_arguments(self, parser):
        parser.add_argument('--interval', type=int, default=3600, help='Seconds between runs (default 3600).')

    def handle(self, *args, **options):
        interval = max(60, options['interval'])
        self.stdout.write(f'Scheduler started: every {interval}s, from {settings.NOTIFY_SEND_HOUR}h local time.')
        while True:
            self.tick()
            time.sleep(interval)

    def tick(self):
        now = timezone.localtime()
        if now.hour < settings.NOTIFY_SEND_HOUR:
            return
        close_old_connections()
        try:
            due_today, due_tomorrow, recipients = notify_upcoming_traites()
        except Exception:
            # Keep the scheduler alive (e.g. SMTP down): nothing was logged, the next run retries.
            logger.exception('Traite reminder run failed')
            self.stderr.write(self.style.ERROR(f'{now:%Y-%m-%d %H:%M} Traite reminder failed; will retry.'))
            return
        if (due_today or due_tomorrow) and recipients:
            self.stdout.write(f'{now:%Y-%m-%d %H:%M} Traite reminder sent '
                              f'({len(due_today)} today, {len(due_tomorrow)} tomorrow).')
