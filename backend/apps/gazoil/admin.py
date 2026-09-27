from django.contrib import admin

from .models import Camion, GazoilComment, GazoilRecord


@admin.register(Camion)
class CamionAdmin(admin.ModelAdmin):
    search_fields = ['matricule']


@admin.register(GazoilRecord)
class GazoilRecordAdmin(admin.ModelAdmin):
    list_display = ['camion', 'price', 'date']
    list_filter = ['date']
    search_fields = ['camion__matricule']


@admin.register(GazoilComment)
class GazoilCommentAdmin(admin.ModelAdmin):
    list_display = ['camion', 'date', 'comment']
    search_fields = ['camion__matricule', 'comment']
