import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';

const project = 'manos-monas-puntos';
const firestore = 'https://firestore.googleapis.com/v1/projects/' + project + '/databases/(default)/documents';
const messaging = 'https://fcm.googleapis.com/v1/projects/' + project + '/messages:send';

export async function sendTest(identifier, post) {
  const equalTo = (fieldPath, stringValue) => ({
    fieldFilter: { field: { fieldPath }, op: 'EQUAL', value: { stringValue } }
  });
  const query = (collectionId, field, value) => post(firestore + ':runQuery', {
    structuredQuery: { from: [{ collectionId }], where: equalTo(field, value) }
  });
  let uid = identifier;
  if (identifier.includes('@')) {
    const users = (await query('users', 'email', identifier.toLowerCase())).filter(row => row.document);
    if (users.length !== 1) {
      throw Error('El correo no identifica una cuenta única. Vuelve a ejecutar y pega el UID de Firebase Authentication.');
    }
    uid = users[0].document.name.split('/').pop();
  }
  const devices = (await query('clubPushDevices', 'uid', uid))
    .map(row => row.document?.fields)
    .filter(fields => fields?.uid?.stringValue === uid && fields.token?.stringValue)
    .sort((a, b) => Date.parse(b.updatedAt?.timestampValue) - Date.parse(a.updatedAt?.timestampValue));
  if (!devices.length) throw Error('Esa cuenta todavía no tiene un dispositivo registrado. Revisa que diga «Avisos activados».');
  await post(messaging, { message: {
    token: devices[0].token.stringValue,
    notification: { title: 'Manos Monas Club', body: 'Este es tu aviso de prueba. Tócalo para abrir Reservas.' },
    webpush: {
      headers: { TTL: '120' },
      notification: { icon: 'https://manosmonas.github.io/web/assets/img/logo.png' },
      fcmOptions: { link: 'https://manosmonas.github.io/web/puntos/?tab=reservas' }
    }
  }});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const input = createInterface({ input: process.stdin, output: process.stdout });
    const identifier = (await input.question('UID o correo de tu cuenta de prueba en el Club: ')).trim();
    input.close();
    if (!identifier || identifier.length > 254) throw Error('Escribe el UID o correo de tu cuenta de prueba.');
    const access = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
    if (!access) throw Error('Cloud Shell no tiene una cuenta autorizada.');
    const post = async (url, body) => {
      const reply = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(15000),
        headers: { authorization: 'Bearer ' + access, 'content-type': 'application/json' },
        body: JSON.stringify(body) });
      const data = await reply.json();
      if (!reply.ok) {
        const fcmCode = data.error?.details?.find(detail => detail.errorCode)?.errorCode;
        const service = url === messaging ? 'Envío del aviso' : 'Consulta de la cuenta o dispositivo';
        throw Error(service + ' rechazado (' + (fcmCode || data.error?.status || reply.status) + ').');
      }
      return data;
    };
    await sendTest(identifier, post);
    console.log('Aviso de prueba enviado al dispositivo registrado más recientemente para esa cuenta.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
