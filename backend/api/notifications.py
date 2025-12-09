"""Notification helpers and Celery-backed delivery.

This module persists `Notification` records and dispatches background tasks
to deliver them via configured providers (Firebase for push, SendGrid for email,
Twilio for SMS). All provider usage is optional and guarded: missing
libraries or environment variables result in safe no-ops.
"""
from typing import List, Optional
from django.conf import settings
from django.utils import timezone
from .models import Notification, PushToken, User
import json
import traceback

# Optional provider libraries (imported lazily)
try:
    import firebase_admin
    from firebase_admin import credentials as fb_credentials, messaging as fb_messaging
    _have_firebase = True
except Exception:
    firebase_admin = None
    fb_credentials = None
    fb_messaging = None
    _have_firebase = False

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    _have_sendgrid = True
except Exception:
    SendGridAPIClient = None
    Mail = None
    _have_sendgrid = False

try:
    from twilio.rest import Client as TwilioClient
    _have_twilio = True
except Exception:
    TwilioClient = None
    _have_twilio = False

try:
    from celery import shared_task
    _have_celery = True
except Exception:
    shared_task = None
    _have_celery = False


def enqueue_notification(user: User, actor: Optional[User], verb: str, data: dict = None, channels: List[str] = None):
    """Create a Notification record and enqueue delivery.

    This function is best-effort and will not raise if delivery fails.
    """
    if data is None:
        data = {}
    if channels is None:
        channels = ['push']

    try:
        n = Notification.objects.create(
            user=user,
            actor=actor,
            verb=verb,
            data=data,
            channel=channels[0] if channels else 'push',
        )
    except Exception:
        return

    try:
        if _have_celery and shared_task:
            deliver_notification_task.delay(str(n.id), channels)
        else:
            _deliver_notification_sync(n, channels)
    except Exception:
        pass


def _format_title_body(n: Notification):
    """Return a human-friendly (title, body) tuple for a Notification.

    Uses the actor, verb, and common data keys to produce concise messages
    for push notifications. Falls back to a short JSON preview when no
    friendly fields are present.
    """
    data = n.data or {}
    actor = getattr(n, 'actor', None)
    actor_name = None
    if actor:
        # Prefer full name, then username/email
        try:
            actor_name = actor.get_full_name() or None
        except Exception:
            actor_name = None
        if not actor_name:
            actor_name = getattr(actor, 'name', None) or getattr(actor, 'email', None)

    # Normalize verb to a stable key (e.g. 'task_assigned') and friendly text
    verb_key = (n.verb or '').lower().replace(' ', '_').strip()
    verb_text = (n.verb or '').replace('_', ' ').strip()

    # Build task/project fields if present
    task_title = None
    project_name = None
    if isinstance(data, dict):
        task_title = data.get('taskTitle')
        project_name = data.get('projectName')

    # Verb-specific title/body templates
    if verb_key == 'task_assigned':
        # Title: You've been assigned to a task by "name"
        title_actor = actor_name or 'Someone'
        title = f"You've been assigned to a task by {title_actor}"

        # Body: "name" assigned you to a task ("task name") in "project name"
        body_actor = actor_name or 'Someone'
        # ensure task_title and project_name are nicely quoted if present
        if task_title:
            task_part = f"\"{task_title}\""
        else:
            task_part = '("task")'

        if project_name:
            body = f"\"{body_actor}\" assigned you to the task {task_part} in \"{project_name}\""
        else:
            body = f"\"{body_actor}\" assigned you to a task {task_part}"
        return title, body

    # Default title when not task_assigned
    if actor_name:
        title = f"{actor_name} {verb_text.capitalize()}"
    else:
        title = verb_text.capitalize() or 'Notification'

    # Body priority: explicit message, task/project concise summary, fallback JSON
    if isinstance(data, dict) and data.get('message'):
        body = data.get('message')
    else:
        parts = []
        if task_title:
            parts.append(task_title)
        if project_name:
            parts.append(f"in {project_name}")
        due = data.get('due') or data.get('due_date') or data.get('due_at')
        if due:
            parts.append(f"Due {due}")

        if parts:
            body = ' — '.join(parts)
        else:
            # short JSON preview
            try:
                if isinstance(data, (dict, list)) and data:
                    body = json.dumps(data)
                else:
                    body = str(data)
            except Exception:
                body = str(data)

    return title, body


def _deliver_notification_sync(notification: Notification, channels: List[str]):
    """Synchronous delivery fallback used when Celery is not available.

    This will attempt to send via any available provider libraries. It is
    intentionally conservative and logs failures instead of raising.
    """
    try:
        title, body = _format_title_body(notification)

        # Push via Firebase
        # Initialize Firebase app lazily if configured
        if _have_firebase and firebase_admin and not firebase_admin._apps:
            sa = getattr(settings, 'FIREBASE_SERVICE_ACCOUNT_JSON_PATH', None)
            try:
                if sa:
                    if isinstance(sa, str) and sa.strip().startswith('{'):
                        cred = fb_credentials.Certificate(json.loads(sa))
                    else:
                        cred = fb_credentials.Certificate(sa)
                    firebase_admin.initialize_app(cred)
            except Exception:
                pass

        if _have_firebase and fb_messaging:
            tokens = list(PushToken.objects.filter(user=notification.user).values_list('token', flat=True))
            for token in tokens:
                try:
                    msg = fb_messaging.Message(
                        token=token,
                        notification=fb_messaging.Notification(title=title, body=body),
                        data={k: str(v) for k, v in (notification.data or {}).items()}
                    )
                    fb_messaging.send(msg)
                except Exception as exc:
                    tb = traceback.format_exc()
                    print(f"[notifications][_deliver_notification_sync] firebase send failed for token={token}: {exc}\n{tb}")
                    # prune tokens that look invalid/unregistered
                    txt = str(exc).lower()
                    if any(x in txt for x in ("invalidregistration", "notregistered", "registration token is not a valid", "unregistered")):
                        try:
                            PushToken.objects.filter(token=token).delete()
                            print(f"[notifications][_deliver_notification_sync] deleted invalid PushToken for token={token}")
                        except Exception:
                            pass

        # Email via SendGrid
        if 'email' in (channels or []) and _have_sendgrid and getattr(settings, 'SENDGRID_API_KEY', None) and notification.user.email:
            try:
                client = SendGridAPIClient(settings.SENDGRID_API_KEY)
                from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@example.com')
                message = Mail(from_email=from_email, to_emails=notification.user.email, subject=title, html_content=body)
                client.send(message)
            except Exception as exc:
                tb = traceback.format_exc()
                print(f"[notifications][_deliver_notification_sync] sendgrid send failed to {notification.user.email}: {exc}\n{tb}")

        # SMS via Twilio
        if 'sms' in (channels or []) and _have_twilio and getattr(settings, 'TWILIO_ACCOUNT_SID', None) and getattr(settings, 'TWILIO_AUTH_TOKEN', None) and getattr(settings, 'TWILIO_FROM_NUMBER', None) and notification.user.phone:
            try:
                tw_client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                tw_client.messages.create(body=body, from_=settings.TWILIO_FROM_NUMBER, to=notification.user.phone)
            except Exception as exc:
                tb = traceback.format_exc()
                print(f"[notifications][_deliver_notification_sync] twilio send failed to {notification.user.phone}: {exc}\n{tb}")
    except Exception:
        pass


if _have_celery:
    @shared_task
    def deliver_notification_task(notification_id: str, channels: List[str]):
        """Celery task that loads the Notification and delivers via providers.

        Providers are used only if their libraries and settings are available.
        """
        try:
            n = Notification.objects.get(id=notification_id)
        except Notification.DoesNotExist:
            return

        title, body = _format_title_body(n)

        # Initialize Firebase app lazily if configured
        if _have_firebase and firebase_admin and not firebase_admin._apps:
            sa = getattr(settings, 'FIREBASE_SERVICE_ACCOUNT_JSON_PATH', None)
            try:
                if sa:
                    if isinstance(sa, str) and sa.strip().startswith('{'):
                        cred = fb_credentials.Certificate(json.loads(sa))
                    else:
                        cred = fb_credentials.Certificate(sa)
                    firebase_admin.initialize_app(cred)
            except Exception:
                pass

        # Push
        if 'push' in (channels or []) and _have_firebase and fb_messaging:
            try:
                tokens = list(PushToken.objects.filter(user=n.user).values_list('token', flat=True))
                for token in tokens:
                    try:
                        msg = fb_messaging.Message(
                            token=token,
                            notification=fb_messaging.Notification(title=title, body=body),
                            data={k: str(v) for k, v in (n.data or {}).items()}
                        )
                        fb_messaging.send(msg)
                    except Exception as exc:
                        tb = traceback.format_exc()
                        print(f"[deliver_notification_task] firebase send failed for token={token}: {exc}\n{tb}")
                        # prune tokens that are clearly invalid/unregistered
                        txt = str(exc).lower()
                        if any(x in txt for x in ("invalidregistration", "notregistered", "registration token is not a valid", "unregistered")):
                            try:
                                PushToken.objects.filter(token=token).delete()
                                print(f"[deliver_notification_task] deleted invalid PushToken for token={token}")
                            except Exception:
                                pass
            except Exception:
                pass

        # Email
        if 'email' in (channels or []) and _have_sendgrid and getattr(settings, 'SENDGRID_API_KEY', None) and n.user.email:
            try:
                client = SendGridAPIClient(settings.SENDGRID_API_KEY)
                from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@example.com')
                message = Mail(from_email=from_email, to_emails=n.user.email, subject=title, html_content=body)
                client.send(message)
            except Exception:
                print(f"[deliver_notification_task] sendgrid send failed to {n.user.email}")

        # SMS
        if 'sms' in (channels or []) and _have_twilio and getattr(settings, 'TWILIO_ACCOUNT_SID', None) and getattr(settings, 'TWILIO_AUTH_TOKEN', None) and getattr(settings, 'TWILIO_FROM_NUMBER', None) and n.user.phone:
            try:
                tw_client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                tw_client.messages.create(body=body, from_=settings.TWILIO_FROM_NUMBER, to=n.user.phone)
            except Exception:
                print(f"[deliver_notification_task] twilio send failed to {n.user.phone}")

        return
