var CATCH_STATIC_NAME = "static-v3";
var CATCH_DYNAMIC_NAME = "dynamic-v2";

self.addEventListener("install", function(event) {
  // console.log("[Service Worker] Installing Service Worker ...", event);
  event.waitUntil(
    caches.open(CATCH_STATIC_NAME).then(cache => {
      console.log("[Service Worker] Precaching App Shell");
      cache.addAll([
        "/",
        "/index.html",
        "/src/js/app.js",
        "/src/js/feed.js",
        "/src/js/fetch.js",
        "/src/js/promise.js",
        "/src/js/material.min.js",
        "/src/css/app.css",
        "/src/css/feed.css",
        "/src/images/main-image.jpg",
        "https://fonts.googleapis.com/css?family=Roboto:400,700",
        "https://fonts.googleapis.com/icon?family=Material+Icons",
        "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css"
      ]);
    })
  );
});

self.addEventListener("activate", function(event) {
  // console.log("[Service Worker] Activating Service Worker ...", event);
  event.waitUntil(
    caches.keys()
    .then((keysList) => {
      return Promise.all(keysList.map(key => {
        if(key !== CATCH_STATIC_NAME && key !==CATCH_DYNAMIC_NAME) {
          console.log("[Service Worker] Removing the old Cache.", key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", function(event) {
  // console.log("[Service Worker] Fetching Some Data ...", event);
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      } else {
        return fetch(event.request)
          .then(res => {
            return caches.open(CATCH_DYNAMIC_NAME).then(cache => {
              // this condition is to avoid chrome-extension error on console
              if (event.request.url.indexOf("https") === 0) {
                cache.put(event.request.url, res.clone());
              }
              return res;
            });
          })
          .catch(err => {});
      }
    })
  );
});
