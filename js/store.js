// Nơi lưu dữ liệu. Có 2 kiểu, cùng một giao diện:
//   - localStore: lưu trong trình duyệt của máy đang dùng (không đồng bộ).
//   - firebaseStore: lưu trên Cloud Firestore, đồng bộ giữa các máy cùng "mã gia đình".
//
// Dữ liệu gồm 6 nhóm (collection), mỗi nhóm là { id: object }:
//   kids     các con        { name, avatar, birthday, allowance, mode, tint, order, since }
//   chores   việc nhà       { name, icon, stars, kids: [kidId], days: [0..6], order }
//   rewards  phần thưởng    { name, icon, cost }
//   done     việc đã xong   id = "YYYY-MM-DD", { [kidId]: { [choreId]: số sao nhận được (0 = chưa) } }
//   ledger   sổ sao         { kid, delta, kind: reward|bonus|penalty, note, icon, at }
//   paid     tiền đã trả    id = kidId_YYYY-MM-DD (thứ Hai), { kid, week, amount, paidAt }
//   timetables thời khoá biểu  id = kidId, { cls, year, days: [1..6], lunch, rows: [{ s, e, d: { [thứ]: môn } }] }
//   lessons  học thêm       { kid, day: 0..6, s: "HH:MM", e: "HH:MM", name, at, home, go, back }
//   stays    các con ở đâu  id = thứ "0".."6", { day, night }

export const COLS = ['kids', 'chores', 'rewards', 'done', 'ledger', 'paid', 'timetables', 'lessons', 'stays'];
const FIREBASE_VERSION = '10.12.2';
const FB = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;

const empty = () => Object.fromEntries(COLS.map(c => [c, {}]));

export function localStore(onData) {
  const KEY = 'be-cham-ngoan-v1';
  const S = empty();
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (j) COLS.forEach(c => (S[c] = j[c] || {}));
  } catch (e) { /* bỏ qua dữ liệu hỏng */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const changed = () => { save(); onData(S, { fromCache: false }); };
  return {
    kind: 'local',
    start() { onData(S, { fromCache: false }); },
    async put(col, id, data) { S[col][id] = data; changed(); },
    async del(col, id) { delete S[col][id]; changed(); },
    async setDone(date, kid, chore, val) {
      const day = (S.done[date] = S.done[date] || {});
      (day[kid] = day[kid] || {})[chore] = val;
      changed();
    },
    async importAll(data) {
      for (const c of COLS) Object.assign(S[c], data[c] || {});
      changed();
    },
  };
}

export async function firebaseStore(config, family, onData, onStatus) {
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(FB + 'firebase-app.js'),
    import(FB + 'firebase-auth.js'),
    import(FB + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(config);
  await auth.signInAnonymously(auth.getAuth(app));

  let db;
  try {
    db = fs.initializeFirestore(app, {
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });
  } catch (e) {
    db = fs.getFirestore(app);
  }

  const base = ['families', family];
  const S = empty();
  const got = new Set();
  const cached = new Set();

  return {
    kind: 'firebase',
    start() {
      for (const col of COLS) {
        fs.onSnapshot(
          fs.collection(db, ...base, col),
          { includeMetadataChanges: true },
          snap => {
            S[col] = Object.fromEntries(snap.docs.map(d => [d.id, d.data()]));
            got.add(col);
            snap.metadata.fromCache ? cached.add(col) : cached.delete(col);
            if (got.size === COLS.length) onData(S, { fromCache: cached.size > 0 });
          },
          err => {
            // Một nhóm lỗi (ví dụ Rules cũ chưa có nhóm mới) thì vẫn mở các nhóm còn lại.
            got.add(col);
            if (got.size === COLS.length) onData(S, { fromCache: cached.size > 0 });
            onStatus && onStatus('error', err);
          },
        );
      }
    },
    put: (col, id, data) => fs.setDoc(fs.doc(db, ...base, col, id), data),
    del: (col, id) => fs.deleteDoc(fs.doc(db, ...base, col, id)),
    setDone: (date, kid, chore, val) =>
      fs.setDoc(fs.doc(db, ...base, 'done', date), { [kid]: { [chore]: val } }, { merge: true }),
    async importAll(data) {
      const writes = [];
      for (const c of COLS) for (const [id, v] of Object.entries(data[c] || {})) writes.push([c, id, v]);
      for (let i = 0; i < writes.length; i += 400) {
        const b = fs.writeBatch(db);
        for (const [c, id, v] of writes.slice(i, i + 400)) b.set(fs.doc(db, ...base, c, id), v);
        await b.commit();
      }
    },
  };
}
