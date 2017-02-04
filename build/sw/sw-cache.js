var CACHE_NAME = 'cache-#CACHE_VERSION';

// Files to be cached immediately on worker installation.
// Other files can still be cached lazily later.
var PRE_CACHE_FILES = [
  'manifest.json',
  '/',
  'favicon.ico',
  'favicon.png',
  'app.js',
  'sprite.png',
  'styles.css'
];

this.addEventListener('install', function(event) {
	console.log('on install (' + CACHE_NAME + ')');

	event.waitUntil(
		caches.open(CACHE_NAME)
		.then(function(cache) {
			return cache.addAll(PRE_CACHE_FILES.map(function(fileUrl) {
        return new Request(fileUrl, {credentials: 'same-origin'});
			}));
		})
	);
});

this.addEventListener('activate', function(event) {
	console.log('on activate (' + CACHE_NAME + ')');

	event.waitUntil(
		caches
		.keys()
		.then(function (keys) {
			// remove old caches
			return Promise.all(
        keys
        .filter(function (key) {
          return key !== CACHE_NAME;
        })
        .map(function (key) {
          console.log('removing cache: ' + key);
          return caches.delete(key);
        })
			);
		})
	);
});

this.addEventListener('fetch', function(event) {
	event.respondWith(
    (event.request.url.includes('/api/') ||
     event.request.url.includes('/auth/')) ?

      // do not cache api calls
      fetch(event.request) :

      // check cache
      caches.match(event.request)
        .then(function(response) {
          if (!response) {
            // cache fail
            return fetch(event.request)
              .then(function (response) {
                // lazily add to cache
                caches.open(CACHE_NAME)
                  .then(function(cache) {
                    cache.put(event.request, response);
                  });

                return response.clone();
              });
          }

          // cache hit
          return response;
        })
  );
});
