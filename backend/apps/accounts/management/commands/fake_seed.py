import random
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.charges.models import Charge
from apps.clients.models import Category, City, Client, Commande, CommandeLine
from apps.clients.repositories import CommandeRepository
from apps.clients_money.models import ClientMoneyRecord, Payment, PaymentType
from apps.gazoil.models import Camion, GazoilComment, GazoilRecord

FIRST_NAMES = [
    'Mohamed', 'Youssef', 'Ahmed', 'Omar', 'Karim', 'Hamza', 'Anas', 'Said', 'Rachid', 'Mustapha',
    'Fatima', 'Khadija', 'Salma', 'Imane', 'Nadia', 'Samira', 'Hicham', 'Adil', 'Brahim', 'Abdelali',
]
LAST_NAMES = [
    'El Amrani', 'Benali', 'Alaoui', 'Bennani', 'Tazi', 'Idrissi', 'Chraibi', 'Berrada', 'Ouazzani',
    'El Fassi', 'Lahlou', 'Bouzid', 'Naciri', 'Kettani', 'Zniber', 'Benjelloun', 'Sabri', 'Haddad',
]
COMPANIES = [
    'Sotradis', 'Atlas Négoce', 'Maghreb Distribution', 'Souss Matériaux', 'BTP Nour', 'Carrières du Nord',
    'Oriental Construction', 'Batimaroc', 'Sahara Travaux', 'Rif Béton', 'Chaouia Agrégats', '',
]
CITIES = [
    'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra',
    'Tétouan', 'El Jadida', 'Settat', 'Berrechid', 'Mohammedia', 'Khouribga',
]
STREETS = [
    'Bd Mohammed V', 'Av Hassan II', 'Rue Ibn Battouta', 'Zone Industrielle', 'Route de Rabat',
    'Quartier Industriel', 'Av des FAR', 'Rue Allal Ben Abdellah', 'Hay Mohammadi', 'Route Nationale 1',
]
COMMANDE_COMMENTS = [
    'Livraison le matin', 'Appeler avant livraison', 'Accès camion difficile', 'Client prioritaire',
    'Paiement à la livraison', 'Décharger sur chantier',
]
GAZOIL_COMMENTS = [
    'Vidange effectuée', 'Changement des pneus avant', 'Contrôle technique OK', 'Bruit au niveau du moteur',
    'Remplacement plaquettes de frein', 'Visite technique prévue', 'Réparation du phare arrière',
]
CHARGE_COMMENTS = [
    'Loyer du dépôt', 'Salaire chauffeurs', 'Assurance camions', 'Péage autoroute', 'Réparation camion',
    'Facture électricité', 'Facture téléphone', 'Achat pièces détachées', 'Frais bancaires', 'Vignette',
]
PLATE_LETTERS = ['A', 'B', 'D', 'H', 'W']


def money(low, high):
    return Decimal(random.randint(low * 100, high * 100)) / 100


def random_date(days_back):
    return timezone.localdate() - timedelta(days=random.randint(0, days_back))


class Command(BaseCommand):
    help = 'Fill the database with fake data for development.'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Delete existing business data first.')
        parser.add_argument('--clients', type=int, default=25)
        parser.add_argument('--commandes', type=int, default=80)
        parser.add_argument('--camions', type=int, default=8)
        parser.add_argument('--seed', type=int, default=None, help='Random seed for reproducible data.')

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError('fake_seed is for development only (DEBUG=False here).')
        if options['seed'] is not None:
            random.seed(options['seed'])
        if options['clear']:
            self.clear()

        self.users = list(User.objects.all()) or [None]
        self.categories = list(Category.objects.values_list('name', flat=True))
        self.payment_types = list(PaymentType.objects.values_list('name', flat=True))
        if not self.categories or not self.payment_types:
            raise CommandError('Add at least one catégorie and one type de paiement first (run migrate).')
        for city in CITIES:
            City.objects.get_or_create(name=city)
        clients = self.seed_clients(options['clients'])
        self.seed_commandes(clients, options['commandes'])
        camions = self.seed_camions(options['camions'])
        self.seed_gazoil(camions)
        self.seed_clients_money(clients)
        self.seed_charges()
        self.stdout.write(self.style.SUCCESS('Fake data seeded.'))

    def clear(self):
        for model in (Payment, ClientMoneyRecord, GazoilComment, GazoilRecord, Camion,
                      CommandeLine, Commande, Client, Charge):
            model.objects.all().delete()
        self.stdout.write('Existing business data cleared.')

    def author(self):
        return random.choice(self.users)

    def seed_clients(self, count):
        clients = Client.objects.bulk_create(
            Client(
                name=f'{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}',
                company=random.choice(COMPANIES),
                city=random.choice(CITIES),
                created_by=self.author(),
            )
            for _ in range(count)
        )
        self.stdout.write(f'  {len(clients)} clients')
        return clients

    def seed_commandes(self, clients, count):
        repository = CommandeRepository()
        for _ in range(count):
            client = random.choice(clients)
            categories = random.sample(self.categories, random.randint(1, len(self.categories)))
            repository.create(
                lines=[{'category': c, 'quantity': random.randint(1, 30)} for c in categories],
                client=client,
                date=random_date(120),
                city=client.city if random.random() < 0.7 else random.choice(CITIES),
                address=f'{random.randint(1, 250)} {random.choice(STREETS)}',
                comment=random.choice(COMMANDE_COMMENTS) if random.random() < 0.4 else '',
                created_by=self.author(),
            )
        self.stdout.write(f'  {count} commandes')

    def seed_camions(self, count):
        matricules = set(Camion.objects.values_list('matricule', flat=True))
        camions = []
        while len(camions) < count:
            matricule = f'{random.randint(10000, 99999)}-{random.choice(PLATE_LETTERS)}-{random.randint(1, 80)}'
            if matricule in matricules:
                continue
            matricules.add(matricule)
            camions.append(Camion(matricule=matricule, created_by=self.author()))
        camions = Camion.objects.bulk_create(camions)
        self.stdout.write(f'  {len(camions)} camions')
        return camions

    def seed_gazoil(self, camions):
        records, comments = [], []
        for camion in camions:
            records += [
                GazoilRecord(camion=camion, price=money(800, 3500), date=random_date(120), created_by=self.author())
                for _ in range(random.randint(8, 20))
            ]
            comments += [
                GazoilComment(camion=camion, comment=random.choice(GAZOIL_COMMENTS), date=random_date(120),
                              created_by=self.author())
                for _ in range(random.randint(0, 4))
            ]
        GazoilRecord.objects.bulk_create(records)
        GazoilComment.objects.bulk_create(comments)
        self.stdout.write(f'  {len(records)} pleins gazoil, {len(comments)} commentaires')

    def seed_clients_money(self, clients):
        payments = []
        records = ClientMoneyRecord.objects.bulk_create(
            ClientMoneyRecord(client_name=client.name, montant=money(5000, 120000), date=random_date(180),
                              created_by=self.author())
            for client in random.sample(clients, min(len(clients), 15))
        )
        for record in records:
            # Pay off a random share of the balance, never more than the montant.
            remaining = record.montant * Decimal(random.uniform(0, 1))
            days_since = (timezone.localdate() - record.date).days
            for _ in range(random.randint(0, 5)):
                if remaining < 100:
                    break
                price = min(remaining, money(500, 20000)).quantize(Decimal('0.01'))
                remaining -= price
                payments.append(Payment(
                    record=record,
                    payment_type=random.choice(self.payment_types),
                    price=price,
                    date=record.date + timedelta(days=random.randint(0, days_since)),
                    created_by=self.author(),
                ))
        Payment.objects.bulk_create(payments)
        self.stdout.write(f'  {len(records)} comptes clients, {len(payments)} paiements')

    def seed_charges(self):
        charges = Charge.objects.bulk_create(
            Charge(date=random_date(120), comment=random.choice(CHARGE_COMMENTS), montant=money(100, 15000),
                   created_by=self.author())
            for _ in range(40)
        )
        self.stdout.write(f'  {len(charges)} charges')
