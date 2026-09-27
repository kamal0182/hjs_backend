from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)


class UserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    firstName = serializers.CharField(source='first_name', read_only=True)
    lastName = serializers.CharField(source='last_name', read_only=True)
    isActive = serializers.BooleanField(source='is_active', read_only=True)
    isAdmin = serializers.BooleanField(source='is_admin', read_only=True)
    dateJoined = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'firstName', 'lastName', 'role', 'isAdmin', 'isActive', 'dateJoined']
        read_only_fields = fields


class UserInputSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name', required=False, allow_blank=True, max_length=150)
    lastName = serializers.CharField(source='last_name', required=False, allow_blank=True, max_length=150)
    isActive = serializers.BooleanField(source='is_active', required=False)
    password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)

    class Meta:
        model = User
        fields = ['email', 'firstName', 'lastName', 'role', 'isActive', 'password']
        # Uniqueness is enforced (case-insensitively) in UserService.
        extra_kwargs = {'email': {'validators': []}}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance is not None:
            self.fields['password'].required = False

    def validate_email(self, value):
        return value.lower()

    def validate(self, attrs):
        password = attrs.get('password')
        if password:
            candidate = self.instance or User(
                email=attrs.get('email', ''),
                first_name=attrs.get('first_name', ''),
                last_name=attrs.get('last_name', ''),
            )
            validate_password(password, user=candidate)
        return attrs
