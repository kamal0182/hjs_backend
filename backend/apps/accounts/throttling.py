from rest_framework.throttling import SimpleRateThrottle


class LoginAccountThrottle(SimpleRateThrottle):
    """
    Limits login attempts per target email, whatever IP they come from.
    Complements the per-IP `login` scope against distributed password guessing.
    """

    scope = 'login_account'

    def get_cache_key(self, request, view):
        email = request.data.get('email') if hasattr(request.data, 'get') else None
        if not isinstance(email, str) or not email.strip():
            return None  # nothing to key on: the per-IP throttle still applies
        return self.cache_format % {'scope': self.scope, 'ident': email.strip().lower()}
