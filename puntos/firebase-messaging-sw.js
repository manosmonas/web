importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
firebase.initializeApp({"apiKey":"AIzaSyBFlT0Ikvn9sRioQPm5AZ3_MY-SPIatY0g","authDomain":"manos-monas-puntos.firebaseapp.com","projectId":"manos-monas-puntos","appId":"1:287636328368:web:6df910c1cbc672a192d075","messagingSenderId":"287636328368"});
// FCM shows the notification before calling this hook in the background.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
firebase.messaging().onBackgroundMessage(async payload=>{
 if(payload.data?.kind!=='test')return;
 try{
  const cache=await caches.open('manos-monas-push-diagnostics-v1');
  const key=new URL('push-test-receipt',self.registration.scope);
  await cache.put(key,new Response(String(Date.now())));
 }catch(_){}
});
