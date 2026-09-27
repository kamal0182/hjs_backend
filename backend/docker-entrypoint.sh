#!/bin/sh
set -e

# Secondary containers (the scheduler) set SKIP_MIGRATE=1: the backend owns migrations.
if [ "$SKIP_MIGRATE" != "1" ]; then
    python manage.py migrate --noinput

    # Dev stack sets SEED_USERS=1: create the default users if they don't exist yet.
    if [ "$SEED_USERS" = "1" ]; then
        python manage.py users_seed --skip-existing
    fi

    # Optionally bootstrap the first admin (skipped if the email already exists).
    if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
        python manage.py createsuperuser --noinput 2>/dev/null || true
    fi
fi

exec "$@"
