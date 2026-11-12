
'use strict';
const {onSchedule}=require('firebase-functions/v2/scheduler');
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
const {getMessaging}=require('firebase-admin/messaging');
const {createHash}=require('node:crypto');
initializeApp();
const db=getFirestore(),region='us-central1',zone='America/Lima';
const hash=t=>createHash('sha256').update(t).digest('hex');
function validToken(token){return typeof token==='string'&&token.length>=20&&token.length<=4096}
exports.registerClubPush=onCall({region},async req=>{
 if(!req.auth)throw new HttpsError('unauthenticated','Inicia sesión.');
 const token=req.data?.token;if(!validToken(token))throw new HttpsError('invalid-argument','Registro inválido.');
 await db.collection('clubPushDevices').doc(hash(token)).set({uid:req.auth.uid,token,updatedAt:FieldValue.serverTimestamp()});
 return {ok:true};
});
exports.unregisterClubPush=onCall({region},async req=>{
 if(!req.auth)throw new HttpsError('unauthenticated','Inicia sesión.');
 const token=req.data?.token;if(!validToken(token))throw new HttpsError('invalid-argument','Registro inválido.');
 const ref=db.collection('clubPushDevices').doc(hash(token));
 await db.runTransaction(async tx=>{const s=await tx.get(ref);if(s.exists&&s.data().uid===req.auth.uid)tx.delete(ref)});
 return {ok:true};
});
function limaParts(now){
 const p=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(x=>[x.type,x.value]));
 return {date:p.year+'-'+p.month+'-'+p.day,minute:Number(p.hour)*60+Number(p.minute)};
}
function dueKind(b,minute){
 if(b.status!=='confirmed'||b.start<=minute)return null;
 if(minute===480)return 'morning';
 if(b.start===minute+60)return 'hour';
 return null;
}
exports.bookingReminders=onSchedule({region,schedule:'0 8,14-20 * * *',timeZone:zone,timeoutSeconds:120,retryCount:2},async event=>{
 const scheduled=new Date(event.scheduleTime),actual=new Date();
 if(!Number.isFinite(scheduled.getTime())||actual-scheduled>10*60*1000)return;
 const {date,minute}=limaParts(scheduled);
 const snap=await db.collection('reservations').where('date','==',date).get();
 for(const doc of snap.docs){
  const b=doc.data(),kind=dueKind(b,minute);if(!kind)continue;
  const id=hash(doc.id+'|'+date+'|'+kind+(kind==='hour'?'|'+b.start:''));
  const reminder=db.collection('users').doc(b.userId).collection('reminders').doc(id);
  const claimed=await db.runTransaction(async tx=>{
   const [fresh,prior]=await Promise.all([tx.get(doc.ref),tx.get(reminder)]);
   if(prior.exists||!fresh.exists)return false;
   const f=fresh.data();
   if(f.userId!==b.userId||f.date!==date||f.start!==b.start||dueKind(f,minute)!==kind)return false;
   tx.create(reminder,{reservationId:doc.id,date,start:b.start,kind,createdAt:FieldValue.serverTimestamp()});
   return true;
  });
  if(!claimed)continue;
  const devices=await db.collection('clubPushDevices').where('uid','==',b.userId).get();
  for(const device of devices.docs){
   const [fresh,registration]=await Promise.all([doc.ref.get(),device.ref.get()]);
   const f=fresh.data(),reg=registration.data();
   if(!f||f.status!=='confirmed'||f.date!==date||f.start!==b.start||f.userId!==b.userId||!reg||reg.uid!==b.userId)continue;
   try{await getMessaging().send({token:reg.token,notification:{title:'Club Monas',body:kind==='morning'?'💅 Hoy tienes una cita. Consulta tus reservas.':'⏰ Falta una horita para tu cita. Consulta tus reservas.'},webpush:{headers:{TTL:'600'},notification:{tag:id,icon:'https://manosmonas.github.io/web/assets/img/logo.png'},fcmOptions:{link:'https://manosmonas.github.io/web/puntos/?tab=reservas'}}})}
   catch(err){if(['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(err.code)){await db.runTransaction(async tx=>{const v=await tx.get(device.ref);if(v.exists&&v.data().uid===b.userId&&v.data().token===reg.token)tx.delete(device.ref)})}else console.error('Push delivery failed',err.code||err.message)}
  }
 }
});
