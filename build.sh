#!/usr/bin/env bash
# Exit on error
set -o errexit  

# Install dependencies
pip install -r requirements.txt

# Run migrations and seed data
python manage.py migrate
python seed_data.py

# Import messages
python manage.py import_messages || true  

# Collect static files
python manage.py collectstatic --noinput