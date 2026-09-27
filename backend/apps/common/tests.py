"""End-to-end API tests for the business modules, mirroring what the frontend calls."""

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import User


class BusinessApiTestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(email='admin@example.com', password='x')
        self.viewer = User.objects.create_user(email='viewer@example.com', password='x')
        self.client.force_authenticate(self.admin)

    def as_viewer(self):
        self.client.force_authenticate(self.viewer)


class ClientsApiTests(BusinessApiTestCase):
    def test_commande_flow(self):
        for ville in ['Casablanca', 'Rabat']:
            self.assertEqual(self.client.post('/api/villes/', {'name': ville}, format='json').status_code, 201)
        # The ville is optional on a client.
        client = self.client.post('/api/clients/', {'name': 'John Doe', 'company': 'ABC'}, format='json').data
        today = timezone.localdate().isoformat()
        payload = {
            'clientId': client['id'],
            'lines': [{'category': 'Ramla', 'quantity': 5}, {'category': 'Kayas', 'quantity': 3}],
            'date': today, 'city': 'Casablanca', 'address': '12 Rue Ibn Sina', 'comment': '',
        }
        response = self.client.post('/api/commandes/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        unknown = {**payload, 'city': 'Atlantis'}
        self.assertEqual(self.client.post('/api/commandes/', unknown, format='json').status_code, 400)
        unknown = {**payload, 'lines': [{'category': 'Sable', 'quantity': 1}]}
        self.assertEqual(self.client.post('/api/commandes/', unknown, format='json').status_code, 400)
        self.assertEqual(response.data['commandeRef'], f"CMD-{int(response.data['id']):03d}")
        self.assertEqual(response.data['clientName'], 'John Doe')
        self.assertEqual(len(response.data['lines']), 2)

        duplicate = {**payload, 'lines': [{'category': 'Ramla', 'quantity': 1}] * 2}
        self.assertEqual(self.client.post('/api/commandes/', duplicate, format='json').status_code, 400)

        page = self.client.get('/api/commandes/', {'search': 'abc', 'city': 'Casablanca', 'page': 1, 'pageSize': 8}).data
        self.assertEqual((page['total'], page['page'], page['pageSize']), (1, 1, 8))
        self.assertEqual(self.client.get('/api/commandes/', {'date': 'bad'}).status_code, 400)

        stats = self.client.get('/api/commandes/stats/').data
        self.assertEqual(stats, {'totalClients': 1, 'totalCommandes': 1, 'commandesAujourdhui': 1, 'villesCouvertes': 1})
        self.assertEqual(self.client.get('/api/clients/cities/').data, ['Casablanca', 'Rabat'])

        # A client with commandes cannot be deleted.
        self.assertEqual(self.client.delete(f"/api/clients/{client['id']}/").status_code, 409)

    def test_viewer_can_read_but_not_write(self):
        self.as_viewer()
        self.assertEqual(self.client.get('/api/clients/').status_code, 200)
        response = self.client.post('/api/clients/', {'name': 'X', 'city': 'Rabat'}, format='json')
        self.assertEqual(response.status_code, 403)


class GazoilApiTests(BusinessApiTestCase):
    def test_gazoil_flow(self):
        for price, date in [(500, '2026-01-01'), (700.5, '2026-02-01')]:
            response = self.client.post('/api/gazoil/records/', {'matricule': ' 123-a-45 ', 'price': price, 'date': date},
                                        format='json')
            self.assertEqual(response.status_code, 201, response.data)
        self.client.post('/api/gazoil/records/', {'matricule': '999-B-1', 'price': 100, 'date': '2025-12-01'}, format='json')
        self.client.post('/api/gazoil/comments/', {'matricule': '123-A-45', 'comment': 'Vidange', 'date': '2026-02-02'},
                         format='json')

        page = self.client.get('/api/gazoil/camions/', {'page': 1, 'pageSize': 10}).data
        self.assertEqual(page['total'], 2)
        first = page['data'][0]
        self.assertEqual(first['matricule'], '123-A-45')
        self.assertEqual(first['latestPrice'], 700.5)
        self.assertEqual(first['latestDate'], '2026-02-01')
        self.assertEqual(first['recordsCount'], 2)
        self.assertEqual(first['totalPrice'], 1200.5)
        self.assertEqual(first['commentsCount'], 1)

        self.assertEqual(self.client.get('/api/gazoil/camions/stats/').data,
                         {'totalPriceAll': 1300.5, 'totalRecords': 3, 'totalCamions': 2})
        self.assertEqual(self.client.get('/api/gazoil/camions/matricules/').data, ['123-A-45', '999-B-1'])
        history = self.client.get('/api/gazoil/records/', {'matricule': '123-A-45'}).data
        self.assertEqual([r['date'] for r in history], ['2026-02-01', '2026-01-01'])
        self.assertEqual(len(self.client.get('/api/gazoil/comments/', {'matricule': '123-A-45'}).data), 1)


class ClientsMoneyApiTests(BusinessApiTestCase):
    def test_clients_money_flow(self):
        record = self.client.post('/api/clients-money/records/',
                                  {'clientName': 'Karim', 'montant': 1000, 'date': '2026-01-01'}, format='json').data
        response = self.client.post('/api/clients-money/payments/', {
            'recordId': record['id'], 'paymentType': 'Chèque', 'price': 250, 'date': '2026-03-01',
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['recordId'], record['id'])

        summary = self.client.get('/api/clients-money/records/', {'search': 'kar', 'page': 1, 'pageSize': 8}).data['data'][0]
        self.assertEqual(summary, {
            'recordId': record['id'], 'clientName': 'Karim', 'latestMontant': 250.0,
            'latestDate': '2026-03-01', 'paymentsCount': 1, 'totalMontant': 1250.0,
        })
        self.assertEqual(self.client.get('/api/clients-money/records/stats/').data,
                         {'totalCollected': 1250.0, 'totalClients': 1, 'totalPayments': 1})

        bad = {'recordId': record['id'], 'paymentType': 'Bitcoin', 'price': 1, 'date': '2026-03-01'}
        self.assertEqual(self.client.post('/api/clients-money/payments/', bad, format='json').status_code, 400)


class ChargesApiTests(BusinessApiTestCase):
    def test_charges_flow(self):
        self.client.post('/api/charges/', {'date': '2026-01-01', 'comment': 'Loyer', 'montant': 3000}, format='json')
        self.client.post('/api/charges/', {'date': '2026-02-01', 'comment': 'Assurance', 'montant': 1500.25},
                         format='json')
        page = self.client.get('/api/charges/', {'page': 1, 'pageSize': 8}).data
        self.assertEqual([c['comment'] for c in page['data']], ['Assurance', 'Loyer'])
        self.assertEqual(self.client.get('/api/charges/stats/').data, {'totalMontant': 4500.25, 'totalRecords': 2})
        self.assertEqual(self.client.post('/api/charges/', {'date': '2026-01-01', 'comment': 'x', 'montant': -5},
                                          format='json').status_code, 400)


class LookupApiTests(BusinessApiTestCase):
    def test_category_crud_renames_and_protects_usages(self):
        categories = self.client.get('/api/categories/').data
        self.assertEqual([c['name'] for c in categories], ['Kayas', 'Ramla', 'Toufna'])

        self.assertEqual(self.client.post('/api/categories/', {'name': 'ramla'}, format='json').status_code, 400)
        sable = self.client.post('/api/categories/', {'name': ' Sable '}, format='json').data
        self.assertEqual(sable['name'], 'Sable')

        self.client.post('/api/villes/', {'name': 'Fès'}, format='json')
        client = self.client.post('/api/clients/', {'name': 'X'}, format='json').data
        commande = {'clientId': client['id'], 'lines': [{'category': 'sable', 'quantity': 2}],
                    'date': '2026-01-01', 'city': 'fès', 'address': '1 Rue A'}
        created = self.client.post('/api/commandes/', commande, format='json').data
        self.assertEqual((created['lines'][0]['category'], created['city']), ('Sable', 'Fès'))

        # Renaming rewrites the commandes that use it; deleting while used is refused.
        self.client.put(f"/api/categories/{sable['id']}/", {'name': 'Sable fin'}, format='json')
        self.assertEqual(self.client.get(f"/api/commandes/{created['id']}/").data['lines'][0]['category'], 'Sable fin')
        self.assertEqual(self.client.delete(f"/api/categories/{sable['id']}/").status_code, 409)

        unused = self.client.post('/api/categories/', {'name': 'Gravier'}, format='json').data
        self.assertEqual(self.client.delete(f"/api/categories/{unused['id']}/").status_code, 204)

    def test_payment_types_and_permissions(self):
        names = [t['name'] for t in self.client.get('/api/clients-money/payment-types/').data]
        self.assertEqual(names, ['Cash', 'Chèque', 'Traite'])
        self.assertEqual(self.client.post('/api/clients-money/payment-types/', {'name': 'Virement'},
                                          format='json').status_code, 201)
        self.as_viewer()
        self.assertEqual(self.client.get('/api/villes/').status_code, 200)
        self.assertEqual(self.client.post('/api/villes/', {'name': 'Oujda'}, format='json').status_code, 403)
