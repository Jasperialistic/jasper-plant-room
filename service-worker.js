/* Jasper's Plant Room v4.9.5 — conservative PWA app shell */
const CACHE_NAME='jasper-plant-room-shell-v4.9.5';
const SHELL=[
  './',
  './manifest.webmanifest',
  './pwa-icon-192.png',
  './pwa-icon-512.png',
  './apple-touch-icon.png',
  './v46-pwa-shell.js?v=4.6.0',
  './v47-mobile-navigation.js?v=4.8.0'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith('jasper-plant-room-shell-')&&key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
      .then(()=>self.clients.matchAll({type:'window'}))
      .then(windows=>Promise.all(windows.map(client=>client.navigate(client.url))))
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;

  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return; // Never cache Supabase/auth/photo API traffic.

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req)
        .then(response=>{
          if(response&&response.ok){
            const copy=response.clone();
            caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
          }
          return response;
        })
        .catch(async()=>{
          return (await caches.match(req)) || (await caches.match('./')) || Response.error();
        })
    );
    return;
  }

  if(/\.(?:js|css|png|jpg|jpeg|svg|webp|ico|webmanifest)$/i.test(url.pathname)){
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      const network=fetch(req).then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
        }
        return response;
      }).catch(()=>null);
      return cached || (await network) || Response.error();
    })());
  }
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING')self.skipWaiting();
});
