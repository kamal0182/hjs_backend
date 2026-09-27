# --- base: python + dependencies, shared by every stage ---
FROM python:3.13-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Strip CRLF in case the script was checked out on Windows.
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
EXPOSE 8000

# --- development: Django dev server with auto-reload (source is bind-mounted) ---
FROM base AS development
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# --- production: gunicorn, non-root user, static files collected at build ---
FROM base AS production
RUN useradd --create-home --uid 1000 app \
    && mkdir -p /app/data /app/staticfiles \
    && chown -R app:app /app
COPY --chown=app:app . .
# collectstatic only needs *a* key and database URL to import settings (it never connects);
# the real values come from the env at runtime.
RUN SECRET_KEY=build-only DATABASE_URL=postgres://build@localhost/build python manage.py collectstatic --noinput
USER app
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--access-logfile", "-"]
