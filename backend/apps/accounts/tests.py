from unittest import mock

from django.conf import settings
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import User
from .throttling import LoginAccountThrottle

COOKIE = settings.JWT_REFRESH_COOKIE['name']
PASSWORD = 'S3cure-Passw0rd!'


@override_settings(REST_FRAMEWORK={**settings.REST_FRAMEWORK, 'DEFAULT_THROTTLE_CLASSES': []})
class AuthFlowTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_superuser(email='admin@example.com', password=PASSWORD)
        self.user = User.objects.create_user(email='user@example.com', password=PASSWORD)

    def login(self, email, password=PASSWORD):
        return self.client.post('/api/auth/login/', {'email': email, 'password': password}, format='json')

    def test_login_returns_access_and_sets_httponly_refresh_cookie(self):
        response = self.login('ADMIN@example.com')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        self.assertEqual(response.data['user']['role'], 'admin')
        cookie = response.cookies[COOKIE]
        self.assertTrue(cookie['httponly'])
        self.assertEqual(cookie['path'], '/api/auth/')

    def test_login_rejects_bad_credentials(self):
        self.assertEqual(self.login('admin@example.com', 'wrong').status_code, 401)
        self.assertEqual(self.login('nobody@example.com').status_code, 401)

    def test_protected_endpoint_requires_token(self):
        self.assertEqual(self.client.get('/api/charges/').status_code, 401)
        access = self.login('user@example.com').data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        self.assertEqual(self.client.get('/api/charges/').status_code, 200)

    def test_refresh_rotates_and_old_token_is_revoked(self):
        self.login('user@example.com')
        old = self.client.cookies[COOKIE].value
        response = self.client.post('/api/auth/refresh/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertNotEqual(self.client.cookies[COOKIE].value, old)

        self.client.cookies[COOKIE] = old
        self.assertEqual(self.client.post('/api/auth/refresh/').status_code, 401)

    def test_logout_revokes_refresh_token(self):
        self.login('user@example.com')
        token = self.client.cookies[COOKIE].value
        self.assertEqual(self.client.post('/api/auth/logout/').status_code, 204)
        self.client.cookies[COOKIE] = token
        self.assertEqual(self.client.post('/api/auth/refresh/').status_code, 401)

    def test_deactivated_user_cannot_refresh(self):
        self.login('user@example.com')
        self.user.is_active = False
        self.user.save()
        self.assertEqual(self.client.post('/api/auth/refresh/').status_code, 401)

    def test_only_admin_manages_users(self):
        payload = {'email': 'new@example.com', 'password': PASSWORD, 'role': 'user'}

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.login('user@example.com').data['access']}")
        self.assertEqual(self.client.post('/api/auth/users/', payload, format='json').status_code, 403)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.login('admin@example.com').data['access']}")
        response = self.client.post('/api/auth/users/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(User.objects.get(email='new@example.com').check_password(PASSWORD))

        weak = {**payload, 'email': 'weak@example.com', 'password': '123'}
        self.assertEqual(self.client.post('/api/auth/users/', weak, format='json').status_code, 400)
        duplicate = {**payload, 'email': 'NEW@example.com'}
        self.assertEqual(self.client.post('/api/auth/users/', duplicate, format='json').status_code, 400)


@override_settings(REST_FRAMEWORK={**settings.REST_FRAMEWORK, 'DEFAULT_THROTTLE_CLASSES': []})
class SessionRevocationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_superuser(email='admin@example.com', password=PASSWORD)
        self.user = User.objects.create_user(email='user@example.com', password=PASSWORD)

    def test_password_change_revokes_existing_sessions(self):
        victim = self.client_class()
        access = victim.post('/api/auth/login/', {'email': 'user@example.com', 'password': PASSWORD},
                             format='json').data['access']

        self.client.force_authenticate(self.admin)
        response = self.client.patch(f'/api/auth/users/{self.user.pk}/', {'password': 'An0ther-Str0ng-Pass'},
                                     format='json')
        self.assertEqual(response.status_code, 200, response.data)

        # Both the refresh cookie and the already-issued access token stop working.
        self.assertEqual(victim.post('/api/auth/refresh/').status_code, 401)
        victim.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        self.assertEqual(victim.get('/api/auth/me/').status_code, 401)

    def test_admin_cannot_lock_themselves_out(self):
        self.client.force_authenticate(self.admin)
        url = f'/api/auth/users/{self.admin.pk}/'
        self.assertEqual(self.client.patch(url, {'isActive': False}, format='json').status_code, 400)
        self.assertEqual(self.client.patch(url, {'role': 'user'}, format='json').status_code, 400)
        self.assertEqual(self.client.patch(url, {'firstName': 'Ok'}, format='json').status_code, 200)


class LoginThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()
        User.objects.create_user(email='user@example.com', password=PASSWORD)

    def attempt(self, **extra):
        return self.client.post('/api/auth/login/', {'email': 'user@example.com', 'password': 'wrong'},
                                format='json', **extra).status_code

    def test_forged_forwarded_for_does_not_bypass_ip_throttle(self):
        codes = [self.attempt(HTTP_X_FORWARDED_FOR=f'10.0.0.{i}') for i in range(12)]
        self.assertEqual(codes[:10], [401] * 10)
        self.assertEqual(codes[10:], [429, 429])

    # DRF reads rates at import time, so patch the class rather than settings.
    @mock.patch.object(LoginAccountThrottle, 'THROTTLE_RATES', {'login_account': '3/hour'})
    def test_account_throttle_applies_across_ips(self):
        codes = [self.attempt(REMOTE_ADDR=f'192.0.2.{i}') for i in range(4)]
        self.assertEqual(codes, [401, 401, 401, 429])
