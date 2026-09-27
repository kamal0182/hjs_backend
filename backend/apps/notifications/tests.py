from datetime import date
from unittest import mock

from django.core import mail
from django.test import TestCase, override_settings

from apps.accounts.models import User
from apps.clients_money.models import ClientMoneyRecord, Payment

from .models import NotificationLog
from .services import notify_upcoming_traites

TODAY = date(2026, 3, 10)


@override_settings(MAILERS={'default': {'BACKEND': 'django.core.mail.backends.locmem.EmailBackend'}})
class TraiteReminderTests(TestCase):
    def setUp(self):
        User.objects.create_user(email='admin@example.com', password='x', role=User.Role.ADMIN)
        User.objects.create_user(email='off@example.com', password='x', role=User.Role.ADMIN, is_active=False)
        User.objects.create_user(email='viewer@example.com', password='x')
        record = ClientMoneyRecord.objects.create(client_name='Karim', montant=1000, date=date(2026, 1, 1))
        self.pay = lambda **kw: Payment.objects.create(record=record, **{'payment_type': 'Traite', 'price': 500, **kw})

    def test_day_before_and_due_day_reminders_go_to_active_admins_once(self):
        self.pay(date=date(2026, 3, 11))                      # due tomorrow
        self.pay(date=TODAY, price=250)                       # due today
        self.pay(date=date(2026, 3, 11), payment_type='Cash')  # not a traite
        self.pay(date=date(2026, 3, 20))                      # too far away

        notify_upcoming_traites(today=TODAY)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ['admin@example.com'])
        self.assertIn("1 aujourd'hui et 1 demain", message.subject)
        self.assertIn('Karim', message.body)
        self.assertEqual(NotificationLog.objects.count(), 2)

        # Running again the same day sends nothing new.
        notify_upcoming_traites(today=TODAY)
        self.assertEqual(len(mail.outbox), 1)

        # Next day: the traite that was "tomorrow" now gets its due-day reminder.
        notify_upcoming_traites(today=date(2026, 3, 11))
        self.assertEqual(len(mail.outbox), 2)
        self.assertIn("1 aujourd'hui", mail.outbox[1].subject)
        self.assertNotIn('demain', mail.outbox[1].subject)

    def test_type_match_is_case_insensitive_and_nothing_due_sends_nothing(self):
        notify_upcoming_traites(today=TODAY)
        self.assertEqual(len(mail.outbox), 0)
        self.pay(date=TODAY, payment_type='traite')
        notify_upcoming_traites(today=TODAY)
        self.assertEqual(len(mail.outbox), 1)

    def test_smtp_failure_logs_nothing_so_next_run_retries(self):
        self.pay(date=TODAY)
        with mock.patch('apps.notifications.services.send_email', side_effect=OSError('smtp down')):
            with self.assertRaises(OSError):
                notify_upcoming_traites(today=TODAY)
        self.assertEqual(NotificationLog.objects.count(), 0)
        notify_upcoming_traites(today=TODAY)
        self.assertEqual(len(mail.outbox), 1)

    def test_dry_run_sends_and_logs_nothing(self):
        self.pay(date=TODAY)
        due_today, _, recipients = notify_upcoming_traites(today=TODAY, dry_run=True)
        self.assertEqual((len(due_today), recipients), (1, ['admin@example.com']))
        self.assertEqual((len(mail.outbox), NotificationLog.objects.count()), (0, 0))
