const CACHE='vrf-guide-v10';
const ASSETS=['/','/styles.css','/quick-procedures.css','/triangle.css','/app.js','/lg-reference-update.js','/field-diagnostics-v2.js','/manufacturer-app-data-v1.js','/lg-multiv5-manual-v1.js','/lg-multiv5-error-families-v1.js','/lg-ch-flows-v2.js','/lg-code-disambiguation-v1.js','/daikin-reyq-manual-v1.js','/service-tool.js','/triangle-engine.js','/alarm-lookup-v1.js','/quick-procedures.js','/manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/'))))});
