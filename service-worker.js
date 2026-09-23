/* Jasper's Plant Room v4.43.0 — organic KEMURI experience */
const CACHE_NAME='jasper-plant-room-shell-v4.43.0';
const PHOTO_CACHE_NAME='jasper-plant-room-photos-v1';
const PLANT_MEDIA_ORIGIN='https://vslyrabiqgbgbcqgooxb.supabase.co';
const SHELL=[
  './',
  './manifest.webmanifest',
  './pwa-icon-192.png',
  './pwa-icon-512.png',
  './apple-touch-icon.png',
  './v25-photo-viewer.js?v=3.8.0',
  './v26-photo-fit.js?v=2.6.0',
  './v27-permanent-delete.js?v=2.7.0',
  './v28-chatgpt-share.js?v=2.9.0',
  './v30-growth-gallery.js?v=3.0.0',
  './v31-telegram-share.js?v=3.1.0',
  './v32-jasper-jungle-bot.js?v=3.2.0',
  './v33-telegram-inbound.js?v=3.3.0',
  './v34-plant-aliases.js?v=3.4.0',
  './v35-telegram-reference-packet.js?v=3.5.0',
  './v36-ai-review.js?v=3.7.0',
  './v36-mobile-gallery.js?v=3.9.0',
  './v37-mobile-plant-screen.js?v=4.0.0',
  './v38-full-plant-editor.js?v=4.1.0',
  './v39-editor-polish.js?v=4.2.0',
  './v40-editor-access-tweaks.js?v=4.2.1',
  './v41-desktop-gallery-wheel.js?v=4.3.0',
  './v42-desktop-gallery-menu.js?v=4.3.1',
  './v43-desktop-gallery-menu-toplayer.js?v=4.3.3',
  './v44-add-plant-presets-light.js?v=4.4.1',
  './v45-location-light-link.js?v=4.5.2',
  './v46-pwa-shell.js?v=4.15.0',
  './v47-mobile-navigation.js?v=4.43.0',
  './v48-upload-queue.js?v=4.43.0',
  './v48-kemuri.js?v=4.43.0',
  './v49-organic-experience.js?v=4.43.0'
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
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;

  const url=new URL(req.url);

  if(url.origin===PLANT_MEDIA_ORIGIN&&url.pathname.startsWith('/storage/v1/object/public/plant-media/')){
    event.respondWith((async()=>{
      const cache=await caches.open(PHOTO_CACHE_NAME);
      const cached=await cache.match(req);
      if(cached)return cached;
      const response=await fetch(req);
      if(response&&(response.ok||response.type==='opaque')){
        cache.put(req,response.clone()).catch(()=>{});
      }
      return response;
    })());
    return;
  }

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
      if(cached)return cached;
      const response=await fetch(req).catch(()=>null);
      if(response&&response.ok){
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
      }
      return response || Response.error();
    })());
  }
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING')self.skipWaiting();
});
