from django.contrib import admin

from .models import Charge


@admin.register(Charge)
class ChargeAdmin(admin.ModelAdmin):
    list_display = ['date', 'montant', 'comment']
    list_filter = ['date']
    search_fields = ['comment']
