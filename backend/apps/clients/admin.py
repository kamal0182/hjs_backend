from django.contrib import admin

from .models import Category, City, Client, Commande, CommandeLine


@admin.register(Category, City)
class LookupAdmin(admin.ModelAdmin):
    search_fields = ['name']


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'city']
    search_fields = ['name', 'company']
    list_filter = ['city']


class CommandeLineInline(admin.TabularInline):
    model = CommandeLine
    extra = 1


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ['reference', 'client', 'date', 'city']
    search_fields = ['reference', 'client__name', 'client__company']
    list_filter = ['city', 'date']
    inlines = [CommandeLineInline]
