import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getApps } from '@react-native-firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithCredential, signOut } from '@react-native-firebase/auth';
import { collection, doc, getFirestore, onSnapshot, query, where } from '@react-native-firebase/firestore';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';

const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const weekdays = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const localDay = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Lima' });
const localTime = new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
const staff = { m1: 'Doris', m2: 'Miluzka' };
const tabs = [{ id: 'recompensas', name: 'Recompensas' }, { id: 'reservas', name: 'Reservas' }, { id: 'perfil', name: 'Perfil' }];

function Action({ children, onPress, disabled }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.pressed]}>
      <Text style={styles.buttonText}>{children}</Text>
    </Pressable>
  );
}

function useClubAccount(uid) {
  const empty = { profile: null, bookings: [], profileError: false, bookingError: false, ready: false };
  const [account, setAccount] = useState(empty);
  useEffect(() => {
    if (!uid) return;
    const db = getFirestore();
    const profile = onSnapshot(doc(db, 'users', uid), snapshot => {
      setAccount(old => ({ ...old, profile: snapshot.data() ?? null, profileError: false }));
    }, () => setAccount(old => ({ ...old, profileError: true })));
    const bookings = onSnapshot(query(collection(db, 'reservations'), where('userId', '==', uid)), snapshot => {
      const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      setAccount(old => ({ ...old, bookings: rows.sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start), ready: true, bookingError: false }));
    }, () => setAccount(old => ({ ...old, ready: true, bookingError: true })));
    return () => { profile(); bookings(); };
  }, [uid]);
  return account;
}

function BookingCard({ row, today }) {
  const day = row.date === today ? 'Hoy' : weekdays.format(new Date(row.date + 'T12:00:00Z'));
  const showTime = minutes => localTime.format(new Date(Date.UTC(2026, 0, 1, 0, minutes)));
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{row.service}</Text>
      <Text style={styles.text}>{day}</Text>
      <Text style={styles.highlight}>{showTime(row.start)} a {showTime(row.end)}</Text>
      <Text style={styles.text}>Te atiende {staff[row.staffId] ?? 'Por confirmar'}</Text>
    </View>
  );
}

function Club({ user, onSignOut, error }) {
  const [tab, setTab] = useState('recompensas');
  const account = useClubAccount(user.uid);
  const today = localDay.format(new Date());
  const upcoming = account.bookings.filter(row => row.status === 'confirmed' &&
    Date.now() < Date.parse(row.date + 'T00:00:00-05:00') + row.end * 60000);

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>MANOS MONAS CLUB</Text>
        {tab === 'reservas' && <>
          <Text style={styles.heading}>Mis reservas</Text>
          {account.bookingError ? <Text style={styles.text}>No pudimos cargar tus reservas.</Text> :
            !account.ready ? <ActivityIndicator color="#943d6a" /> :
            upcoming.length ? upcoming.map(row => <BookingCard key={row.id} row={row} today={today} />) :
            <Text style={styles.text}>Aún no tienes una próxima cita.</Text>}
        </>}
        {tab === 'recompensas' && <>
          <Text style={styles.heading}>Mis puntos</Text>
          <View style={styles.card}>
            <Text style={styles.highlight}>{account.profile?.points?.toLocaleString('es-PE') ?? '—'}</Text>
            <Text style={styles.text}>{account.profileError ? 'No pudimos cargar tu saldo.' : 'Puntos disponibles'}</Text>
          </View>
        </>}
        {tab === 'perfil' && <>
          <Text style={styles.heading}>Mi perfil</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{account.profile?.displayName || user.displayName || 'Clienta'}</Text>
            {!!user.email && <Text style={styles.text}>{user.email}</Text>}
          </View>
          <Action onPress={onSignOut}>Cerrar sesión</Action>
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        </>}
      </ScrollView>
      <View style={styles.navigation}>
        {tabs.map(item => (
          <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: item.id === tab }}
            onPress={() => setTab(item.id)} style={[styles.tab, item.id === tab && styles.selectedTab]}>
            <Text style={styles.tabText}>{item.name}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function Entry() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const configured = getApps().length > 0;
  useEffect(() => {
    if (!configured) { setReady(true); return; }
    if (googleClientId) GoogleSignin.configure({ webClientId: googleClientId });
    return onAuthStateChanged(getAuth(), account => { setUser(account); setReady(true); });
  }, [configured]);

  async function signIn() {
    setBusy(true); setError('');
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      if (!isSuccessResponse(result)) return;
      if (!result.data.idToken) throw Error('missing-id-token');
      await signInWithCredential(getAuth(), GoogleAuthProvider.credential(result.data.idToken));
    } catch (_) {
      setError('No pudimos iniciar sesión con Google. Inténtalo de nuevo.');
    } finally { setBusy(false); }
  }

  async function logout() {
    setError('');
    try {
      await signOut(getAuth());
      await GoogleSignin.signOut();
    } catch (_) {
      setError('No pudimos cerrar sesión. Inténtalo de nuevo.');
    }
  }

  if (!ready) return <ActivityIndicator style={styles.spinner} color="#943d6a" />;
  if (user) return <Club key={user.uid} user={user} onSignOut={logout} error={error} />;
  return (
    <View style={styles.login}>
      <Text style={styles.brand}>MANOS MONAS CLUB</Text>
      <Text style={styles.heading}>Bienvenida al Club</Text>
      <Action disabled={busy || !configured || !googleClientId} onPress={signIn}>
        {busy ? 'Iniciando sesión…' : 'Continuar con Google'}
      </Action>
      {(!configured || !googleClientId) && <Text style={styles.text}>El acceso de esta versión todavía está en preparación.</Text>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <Entry />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff7fb' },
  spinner: { flex: 1 },
  login: { flex: 1, justifyContent: 'center', padding: 24, gap: 18, width: '100%', maxWidth: 520, alignSelf: 'center' },
  content: { padding: 24, gap: 16, width: '100%', maxWidth: 660, alignSelf: 'center' },
  brand: { fontSize: 13, fontWeight: '800', color: '#84345e', letterSpacing: 1.5 },
  heading: { fontSize: 29, fontWeight: '800', color: '#321b2e' },
  card: { padding: 17, gap: 7, borderWidth: 1, borderColor: '#ead5e2', borderRadius: 16, backgroundColor: '#fff' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#321b2e' },
  text: { fontSize: 15, color: '#684b60' },
  error: { fontSize: 15, color: '#8d264c' },
  highlight: { fontSize: 21, fontWeight: '800', color: '#84345e' },
  button: { minHeight: 48, borderRadius: 13, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#84345e' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '750' },
  pressed: { opacity: 0.55 },
  navigation: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#ead5e2', backgroundColor: '#fff', padding: 8, gap: 4 },
  tab: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  selectedTab: { backgroundColor: '#f6e1ed' },
  tabText: { fontSize: 13, color: '#713452', fontWeight: '700' },
});
