"""Email notifications: who gets them and how they are sent."""

import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.db.models import Q
from django.template.loader import render_to_string
from django.utils import timezone

from apps.accounts.models import User
from apps.clients_money.models import Payment

from .models import NotificationLog

logger = logging.getLogger(__name__)


def admin_recipients():
    """Emails of every active admin (role admin or superuser)."""
    return list(
        User.objects.filter(Q(role=User.Role.ADMIN) | Q(is_superuser=True), is_active=True)
        .exclude(email='')
        .order_by('email')
        .values_list('email', flat=True)
        .distinct()
    )


def send_email(subject, recipients, template, context):
    """Render `notifications/<template>.txt|.html` and send it through the default mailer (SMTP)."""
    text = render_to_string(f'notifications/{template}.txt', context)
    html = render_to_string(f'notifications/{template}.html', context)
    message = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, to=recipients)
    message.attach_alternative(html, 'text/html')
    message.send()


def _pending_traites(due_date, kind):
    """Traite payments due on `due_date` that have not had this reminder yet."""
    already_sent = NotificationLog.objects.filter(kind=kind, due_date=due_date).values('payment_id')
    return list(
        Payment.objects.select_related('record')
        .filter(payment_type__iexact=settings.TRAITE_PAYMENT_TYPE, date=due_date)
        .exclude(pk__in=already_sent)
        .order_by('record__client_name', 'pk')
    )


def notify_upcoming_traites(today=None, dry_run=False):
    """
    Email all active admins about Traite payments due tomorrow (day-before
    reminder) and today (due-day reminder). One summary email per run.

    Returns (due_today, due_tomorrow, recipients). Nothing already notified
    is sent again, so this is safe to run as often as needed.
    """
    today = today or timezone.localdate()
    tomorrow = today + timedelta(days=1)

    due_today = _pending_traites(today, NotificationLog.Kind.DUE_DAY)
    due_tomorrow = _pending_traites(tomorrow, NotificationLog.Kind.DAY_BEFORE)
    recipients = admin_recipients()

    if not (due_today or due_tomorrow) or not recipients or dry_run:
        return due_today, due_tomorrow, recipients

    parts = []
    if due_today:
        parts.append(f"{len(due_today)} aujourd'hui")
    if due_tomorrow:
        parts.append(f'{len(due_tomorrow)} demain')
    subject = f"Rappel traites : {' et '.join(parts)}"

    context = {
        'today': today,
        'tomorrow': tomorrow,
        'due_today': due_today,
        'due_tomorrow': due_tomorrow,
        'total_today': sum(p.price for p in due_today),
        'total_tomorrow': sum(p.price for p in due_tomorrow),
    }
    # Send first, then record: if SMTP fails nothing is logged and the next run retries.
    send_email(subject, recipients, 'traite_reminder', context)

    sent_to = ', '.join(recipients)
    with transaction.atomic():
        NotificationLog.objects.bulk_create(
            [NotificationLog(payment=p, kind=NotificationLog.Kind.DUE_DAY, due_date=today, recipients=sent_to)
             for p in due_today]
            + [NotificationLog(payment=p, kind=NotificationLog.Kind.DAY_BEFORE, due_date=tomorrow,
                               recipients=sent_to)
               for p in due_tomorrow],
            ignore_conflicts=True,  # another run beat us to it: never double-log
        )
    logger.info('Traite reminder sent to %s (%d today, %d tomorrow)', sent_to, len(due_today), len(due_tomorrow))
    return due_today, due_tomorrow, recipients
