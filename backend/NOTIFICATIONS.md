Notification setup and running
=============================

This project includes a notification scaffold: `Notification` and `PushToken` models,
an enqueue helper at `api/notifications.py`, and a Celery task stub for delivery.

Quick setup (development)
-------------------------

1. Install Python dependencies (run in your backend virtualenv):

   ```powershell
   pip install -r requirements.txt
   ```

2. Run migrations to create notification tables:

   ```powershell
   python manage.py makemigrations api
   python manage.py migrate
   ```

3. Start a Redis broker (default):

   - On Windows you can use WSL or run a Redis docker container:

     ```powershell
     docker run -p 6379:6379 -d redis:7
     ```

4. Start a Celery worker from the backend project root:

   ```powershell
   celery -A backend worker -l info
   ```

5. Optionally run Celery Beat for scheduled reminders:

   ```powershell
   celery -A backend beat -l info
   ```

Provider credentials
--------------------

The code contains placeholders for provider integrations (Firebase, SendGrid, Twilio).
Set these env vars in your environment if you plan to integrate:

- `FIREBASE_SERVICE_ACCOUNT_JSON` — service account JSON string or path
- `SENDGRID_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

Next steps
----------

- Implement provider delivery logic in `api/notifications.py::deliver_notification_task`.
- Add frontend FCM registration code to get tokens and POST to `api/push-tokens/`.
- Implement a Notification UI component and load notifications via `api/notifications/`.
