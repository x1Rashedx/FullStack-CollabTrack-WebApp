Frontend push setup
===================

This project includes a small helper to register the browser for Firebase Cloud Messaging (FCM).

Environment variables (Vite)
---------------------------

- `VITE_FIREBASE_CONFIG` — JSON string of your Firebase config object (the one you get from the Firebase console). Example:

  ```env
  VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","messagingSenderId":"...","appId":"..."}
  ```

- `VITE_FIREBASE_VAPID_KEY` — the public VAPID key for FCM (found in Firebase Cloud Messaging settings).

Usage
-----

The header component will attempt to call the `registerForPush()` helper on load (best-effort). If registration succeeds the client will POST the FCM token to `/api/push-tokens/`.

You must also implement server-side delivery and run a background worker (Celery) to send pushes.
