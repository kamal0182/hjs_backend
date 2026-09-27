from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc, context):
    if isinstance(exc, ProtectedError):
        return Response(
            {'detail': "Suppression impossible : cet élément est utilisé par d'autres enregistrements."},
            status=status.HTTP_409_CONFLICT,
        )
    return drf_exception_handler(exc, context)


class Conflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Action impossible : cet élément est utilisé par d'autres enregistrements."
