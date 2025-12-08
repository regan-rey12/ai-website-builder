import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

// Precache build files
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache GET API requests
registerRoute(
  ({ request }) => request.destination === '' || request.destination === 'document',
  new StaleWhileRevalidate()
);

self.addEventListener('install', () => {
  console.log("Service Worker installed");
});
