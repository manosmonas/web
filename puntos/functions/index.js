
'use strict';
const {onSchedule}=require('firebase-functions/v2/scheduler');
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {onDocumentCreated}=require('firebase-functions/v2/firestore');
const {initializeApp}=require('firebase-admin/app');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
const {getMessaging}=require('firebase-admin/messaging');
const {createHash}=require('node:crypto');
initializeApp();
const db=getFirestore(),region='us-central1',zone='America/Lima';
const morningMinute=8*60,advanceMinutes=2*60;
const pushTestDelayMs=6000;
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
exports.testClubPush=onCall({region},async req=>{
 const uid=req.auth?.uid,token=req.data?.token;
 if(!uid)throw new HttpsError('unauthenticated','Inicia sesión.');
 if(!validToken(token))throw new HttpsError('invalid-argument','Registro inválido.');
 const device=db.collection('clubPushDevices').doc(hash(token));
 const recentTest=db.collection('clubPushTests').doc(uid);
 await db.runTransaction(async tx=>{
  const [registration,previous]=await Promise.all([tx.get(device),tx.get(recentTest)]);
  if(registration.data()?.uid!==uid||registration.data()?.token!==token){
   throw new HttpsError('failed-precondition','Vuelve a activar los avisos en este dispositivo.');
  }
  const lastTest=previous.data()?.sentAt?.toMillis();
  if(lastTest!==undefined&&Date.now()-lastTest<pushTestDelayMs){
   throw new HttpsError('resource-exhausted','La prueba anterior aún se está enviando.');
  }
  tx.set(recentTest,{sentAt:FieldValue.serverTimestamp()});
 });
 await new Promise(resolve=>setTimeout(resolve,pushTestDelayMs));
 const registration=(await device.get()).data();
 if(registration?.uid!==uid||registration?.token!==token){
  throw new HttpsError('failed-precondition','Vuelve a activar los avisos en este dispositivo.');
 }
 try{
  await getMessaging().send({token,data:{kind:'test'},notification:{title:'Manos Monas Club',body:'¡Llegó tu aviso de prueba!'},
   webpush:{headers:{TTL:'120'},notification:{tag:'club-push-test',icon:'https://manosmonas.github.io/web/assets/img/logo.png'},
    fcmOptions:{link:'https://manosmonas.github.io/web/puntos/?tab=reservas'}}});
 }catch(error){
  if(['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(error.code)){
   throw new HttpsError('failed-precondition','Vuelve a activar los avisos en este dispositivo.');
  }
  console.error('Test push delivery failed',error.code||'unknown');
  throw new HttpsError('unavailable','El servicio de avisos no aceptó la prueba.');
 }
 return {accepted:true};
});
function limaParts(now){
 const p=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(x=>[x.type,x.value]));
 return {date:p.year+'-'+p.month+'-'+p.day,minute:Number(p.hour)*60+Number(p.minute)};
}
function dueKind(b,minute){
 if(b.status!=='confirmed'||b.guest===true||typeof b.userId!=='string'||!b.userId||!Number.isInteger(b.start)||b.start<=minute)return null;
 if(minute===morningMinute)return 'morning';
 if(b.start===minute+advanceMinutes)return 'twoHours';
 return null;
}
function appointmentMessage(start){
 const hour=Math.floor(start/60),minutes=String(start%60).padStart(2,'0');
 return {title:'¡Tienes una Cita Programada!',body:'Hoy '+(hour%12||12)+':'+minutes+' '+(hour<12?'a.m.':'p.m.')};
}
async function sendClubNotification(uid,id,kind,notification,tab,isCurrent){
 const devices=await db.collection('clubPushDevices').where('uid','==',uid).get();
 for(const device of devices.docs){
  const [current,registration]=await Promise.all([isCurrent(),device.ref.get()]);
  const reg=registration.data();
  if(!current||reg?.uid!==uid||!validToken(reg.token))continue;
  try{
   await getMessaging().send({token:reg.token,data:{kind},notification,webpush:{headers:{TTL:'600'},
    notification:{tag:id,icon:'https://manosmonas.github.io/web/assets/img/logo.png'},
    fcmOptions:{link:'https://manosmonas.github.io/web/puntos/?tab='+tab}}});
  }catch(error){
   if(!['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(error.code)){
    console.error('Push delivery failed',error.code||'unknown');
    continue;
   }
   await db.runTransaction(async tx=>{
    const current=(await tx.get(device.ref)).data();
    if(current?.uid===uid&&current.token===reg.token)tx.delete(device.ref);
   });
  }
 }
}
exports.pointsEarnedNotification=onDocumentCreated({document:'visits/{visitId}',region:'southamerica-west1'},async event=>{
 const visit=event.data?.data();
 if(typeof visit?.userId!=='string'||!visit.userId||!Number.isSafeInteger(visit.points)||visit.points<=0)return;
 const visitId=event.params.visitId;
 const id='points-'+visitId;
 const {userId,points}=visit;
 const notice=db.collection('users').doc(userId).collection('reminders').doc(id);
 const reversal=db.collection('voids').doc('void-'+visitId);
 const created=await db.runTransaction(async tx=>{
  const [previous,voided]=await Promise.all([tx.get(notice),tx.get(reversal)]);
  if(previous.exists||voided.exists)return false;
  tx.create(notice,{kind:'points',visitId,points,createdAt:FieldValue.serverTimestamp()});
  return true;
 });
 if(!created)return;
 await sendClubNotification(userId,id,'points',{title:'¡Ganaste '+points+' puntos!',body:'Ya puedes verlos en Manos Monas Club.'},
  'recompensas',async()=>!(await reversal.get()).exists);
});
exports.bookingReminders=onSchedule({region,schedule:'* 8,13-19 * * *',timeZone:zone,timeoutSeconds:120,retryCount:2},async event=>{
 const scheduled=new Date(event.scheduleTime),actual=new Date();
 if(!Number.isFinite(scheduled.getTime())||actual-scheduled>10*60*1000)return;
 const {date,minute}=limaParts(scheduled);
 const now=limaParts(actual);
 if(now.date!==date||(minute>morningMinute&&minute<13*60))return;
 let appointments=db.collection('reservations').where('date','==',date);
 if(minute!==morningMinute)appointments=appointments.where('start','==',minute+advanceMinutes);
 const snap=await appointments.get();
 for(const doc of snap.docs){
  const b=doc.data(),kind=dueKind(b,minute);if(!kind||b.start<=now.minute)continue;
  // Reutiliza la clave del aviso previo para evitar duplicados durante una actualización.
  const id=hash(doc.id+'|'+date+'|'+(kind==='morning'?'morning':'hour|'+b.start));
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
  await sendClubNotification(b.userId,id,'appointment',appointmentMessage(b.start),'reservas',async()=>{
   const f=(await doc.ref.get()).data();
   return f?.status==='confirmed'&&f.date===date&&f.start===b.start&&f.userId===b.userId;
  });
 }
});
