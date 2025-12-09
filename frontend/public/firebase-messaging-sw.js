// Minimal service worker to handle background push messages.
// Place this file in `frontend/public/` so it's served at `/firebase-messaging-sw.js`.

self.addEventListener('push', function(event) {
  let payload = {};
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (e) {
    payload = { notification: { title: 'Notification', body: event.data?.text() || '' } };
  }

  const title = (payload.notification && payload.notification.title) || payload.title || 'Notification';
  const body = (payload.notification && payload.notification.body) || payload.body || '';
  const options = {
    body: body,
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        const client = clientList[0];
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
