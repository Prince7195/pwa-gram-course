importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

const CATCH_STATIC_NAME = "static-v11";
const CATCH_DYNAMIC_NAME = "dynamic-v4";
const STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/js/idb.js",
  "/src/js/utility.js",
  "/src/js/fetch.js",
  "/src/js/promise.js",
  "/src/js/material.min.js",
  "/src/css/app.css",
  "/src/css/feed.css",
  "/src/images/main-image.jpg",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css"
];

function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then(cache => {
    return cache.keys().then(keys => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
      }
    });
  });
}

self.addEventListener("install", function(event) {
  // console.log("[Service Worker] Installing Service Worker ...", event);
  event.waitUntil(
    caches.open(CATCH_STATIC_NAME).then(cache => {
      console.log("[Service Worker] Precaching App Shell");
      cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener("activate", function(event) {
  // console.log("[Service Worker] Activating Service Worker ...", event);
  event.waitUntil(
    caches.keys().then(keysList => {
      return Promise.all(
        keysList.map(key => {
          if (key !== CATCH_STATIC_NAME && key !== CATCH_DYNAMIC_NAME) {
            console.log("[Service Worker] Removing the old Cache.", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

function isInArray(str, array) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === str) {
      return true;
    }
  }
  return false;
}

// Cache with Network fallback ( Cache first Network next )
self.addEventListener("fetch", function(event) {
  // console.log("[Service Worker] Fetching Some Data ...", event);
  const url = "https://fb-storage-app.firebaseio.com/posts";
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request).then(res => {
        const clonedRes = res.clone();
        clearAllData("posts")
        .then(() => {
          return clonedRes.json();
        })
        .then((data) => {
          for (const key in data) {
            writeData("posts", data[key]);
          }
        });
        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    // Cache-Only
    event.respondWith(caches.match(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(res => {
              return caches.open(CATCH_DYNAMIC_NAME).then(cache => {
                // trimCache(CATCH_DYNAMIC_NAME, 3);
                // this condition is to avoid chrome-extension error on console
                if (event.request.url.indexOf("https") === 0) {
                  cache.put(event.request.url, res.clone());
                }
                return res;
              });
            })
            .catch(err => {
              return caches.open(CATCH_STATIC_NAME).then(cache => {
                if (event.request.headers.get("accept").includes("text/html")) {
                  return cache.match("/offline.html");
                }
              });
            });
        }
      })
    );
  }
});

// Initial Setup
// self.addEventListener("fetch", function(event) {
//   // console.log("[Service Worker] Fetching Some Data ...", event);
//   event.respondWith(
//     caches.match(event.request).then(response => {
//       if (response) {
//         return response;
//       } else {
//         return fetch(event.request)
//           .then(res => {
//             return caches.open(CATCH_DYNAMIC_NAME).then(cache => {
//               // this condition is to avoid chrome-extension error on console
//               if (event.request.url.indexOf("https") === 0) {
//                 cache.put(event.request.url, res.clone());
//               }
//               return res;
//             });
//           })
//           .catch(err => {
//             return caches.open(CATCH_STATIC_NAME)
//             .then(cache => {
//               return cache.match("/offline.html");
//             })
//           });
//       }
//     })
//   );
// });

// Network with cache fallback ( Network first Cache next )
// self.addEventListener("fetch", function(event) {
//   // console.log("[Service Worker] Fetching Some Data ...", event);
//   event.respondWith(
//     fetch(event.request)
//       .then(res => {
//         return caches.open(CATCH_DYNAMIC_NAME).then(cache => {
//           // this condition is to avoid chrome-extension error on console
//           if (event.request.url.indexOf("http") === 0) {
//             cache.put(event.request.url, res.clone());
//           }
//           return res;
//         });
//       })
//       .catch(err => {
//         return caches.match(event.request);
//       })
//   );
// });

// Cache-Only
// self.addEventListener("fetch", function(event) {
//   // console.log("[Service Worker] Fetching Some Data ...", event);
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

// Network-Only
// self.addEventListener("fetch", function(event) {
//   // console.log("[Service Worker] Fetching Some Data ...", event);
//   event.respondWith(
//     fetch(event.request)
//   );
// });
