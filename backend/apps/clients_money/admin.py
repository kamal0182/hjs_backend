from django.contrib import admin

from .models import ClientMoneyRecord, Payment, PaymentType


@admin.register(PaymentType)
class PaymentTypeAdmin(admin.ModelAdmin):
    search_fields = ['name']


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0


@admin.register(ClientMoneyRecord)
class ClientMoneyRecordAdmin(admin.ModelAdmin):
    list_display = ['client_name', 'montant', 'date']
    search_fields = ['client_name']
    inlines = [PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['record', 'payment_type', 'price', 'date']
    list_filter = ['payment_type', 'date']
