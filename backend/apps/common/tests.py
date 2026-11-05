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

        # Editing a commande replaces its lines and keeps its reference.
        url = f"/api/commandes/{response.data['id']}/"
        edited = {**payload, 'lines': [{'category': 'Toufna', 'quantity': 2.5}], 'city': 'Rabat', 'comment': 'Urgent'}
        updated = self.client.put(url, edited, format='json')
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(updated.data['commandeRef'], response.data['commandeRef'])
        self.assertEqual(updated.data['lines'], [{'category': 'Toufna', 'quantity': 2.5}])
        self.assertEqual((updated.data['city'], updated.data['comment']), ('Rabat', 'Urgent'))

        self.as_viewer()
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertEqual(self.client.get('/api/commandes/stats/').data['totalCommandes'], 0)
        # Once its commandes are gone, the client can be deleted.
        self.assertEqual(self.client.delete(f"/api/clients/{client['id']}/").status_code, 204)

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

        # Edit then delete a plein: the truck's summary follows.
        latest = history[0]
        updated = self.client.put(f"/api/gazoil/records/{latest['id']}/",
                                  {'matricule': '123-A-45', 'price': 650, 'date': '2026-02-01'}, format='json')
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(self.client.get('/api/gazoil/camions/stats/').data['totalPriceAll'], 1250.0)
        self.assertEqual(self.client.delete(f"/api/gazoil/records/{latest['id']}/").status_code, 204)
        first = self.client.get('/api/gazoil/camions/', {'page': 1, 'pageSize': 10}).data['data'][0]
        self.assertEqual((first['latestPrice'], first['recordsCount']), (500.0, 1))

        # Edit then delete a commentaire.
        comment = self.client.get('/api/gazoil/comments/', {'matricule': '123-A-45'}).data[0]
        url = f"/api/gazoil/comments/{comment['id']}/"
        updated = self.client.put(url, {'matricule': '123-A-45', 'comment': ' Vidange + filtres ', 'date': '2026-02-03'},
                                  format='json')
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual((updated.data['comment'], updated.data['date']), ('Vidange + filtres', '2026-02-03'))
        self.assertEqual(self.client.put(url, {'matricule': '123-A-45', 'comment': '  ', 'date': '2026-02-03'},
                                         format='json').status_code, 400)
        self.as_viewer()
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertEqual(self.client.get('/api/gazoil/comments/', {'matricule': '123-A-45'}).data, [])


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
            'recordId': record['id'], 'clientName': 'Karim', 'montant': 1000.0, 'date': '2026-01-01',
            'latestMontant': 250.0, 'latestDate': '2026-03-01', 'paymentsCount': 1, 'totalMontant': 1250.0,
        })
        self.assertEqual(self.client.get('/api/clients-money/records/stats/').data,
                         {'totalCollected': 1250.0, 'totalClients': 1, 'totalPayments': 1})

        bad = {'recordId': record['id'], 'paymentType': 'Bitcoin', 'price': 1, 'date': '2026-03-01'}
        self.assertEqual(self.client.post('/api/clients-money/payments/', bad, format='json').status_code, 400)

        # Edit the payment and the record.
        payment_url = f"/api/clients-money/payments/{response.data['id']}/"
        updated = self.client.put(payment_url, {
            'recordId': record['id'], 'paymentType': 'cash', 'price': 300, 'date': '2026-03-02',
        }, format='json')
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual((updated.data['paymentType'], updated.data['price']), ('Cash', 300.0))
        record_url = f"/api/clients-money/records/{record['id']}/"
        updated = self.client.put(record_url, {'clientName': 'Karim B.', 'montant': 900, 'date': '2026-01-02'},
                                  format='json')
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(self.client.get('/api/clients-money/records/stats/').data['totalCollected'], 1200.0)

        # Delete the payment, then the record (which takes any remaining payments with it).
        self.assertEqual(self.client.delete(payment_url).status_code, 204)
        self.assertEqual(self.client.get('/api/clients-money/payments/', {'recordId': record['id']}).data, [])
        self.client.post('/api/clients-money/payments/', {
            'recordId': record['id'], 'paymentType': 'Cash', 'price': 10, 'date': '2026-04-01',
        }, format='json')
        self.assertEqual(self.client.delete(record_url).status_code, 204)
        self.assertEqual(self.client.get('/api/clients-money/records/stats/').data,
                         {'totalCollected': 0.0, 'totalClients': 0, 'totalPayments': 0})


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

        loyer = page['data'][1]
        url = f"/api/charges/{loyer['id']}/"
        updated = self.client.put(url, {'date': '2026-01-05', 'comment': 'Loyer janvier', 'montant': 3200}, format='json')
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(self.client.get('/api/charges/stats/').data, {'totalMontant': 4700.25, 'totalRecords': 2})

        # Deleting the only row of the last page: that page now clamps to the last one instead of a 404.
        self.assertEqual(self.client.get('/api/charges/', {'page': 2, 'pageSize': 1}).data['data'][0]['id'], loyer['id'])
        self.assertEqual(self.client.delete(url).status_code, 204)
        page = self.client.get('/api/charges/', {'page': 2, 'pageSize': 1})
        self.assertEqual(page.status_code, 200)
        self.assertEqual((page.data['page'], page.data['total']), (1, 1))
        self.assertEqual(self.client.get('/api/charges/', {'page': 'abc'}).status_code, 404)


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
