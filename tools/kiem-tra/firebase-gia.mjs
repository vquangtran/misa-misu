// Firebase giả cho bộ kiểm tra: thay ba file SDK app tải từ www.gstatic.com bằng bản chạy ngay trong trang, giữ dữ liệu trong bộ nhớ.
// Nhờ vậy đường chạy bằng Firebase của app (màn mở đầu, mã gia đình, ?gd=, &con=, sổ học trên Firestore) được kiểm tra mà không
// gửi gì ra ngoài. Dữ liệu ban đầu đặt ở window.__FS_GIA__ = { 'families/<mã>/<nhóm>/<id>': {...} }.
// Chỉ có những hàm js/store.js dùng. Ghi xong thì báo cho các nơi đang nghe ở lượt sau (như Firestore thật, không báo ngay).

export const FAKE_CONFIG = 'export const firebaseConfig = { apiKey: "gia", authDomain: "gia.invalid", projectId: "gia", appId: "gia" };\n';

export const FAKE_APP = 'export function initializeApp(config) { return { config }; }\n';

export const FAKE_AUTH = 'export function getAuth(app) { return { app }; }\nexport async function signInAnonymously() { return { user: { uid: "gia" } }; }\n';

export const FAKE_FIRESTORE = `
// Dữ liệu giữ trong sessionStorage của tab: tải lại trang vẫn còn, như Firestore thật.
const KEY = '__fs_gia__';
const revive = (k, x) => x && x.__bytes ? Bytes.fromArray(x.__bytes) : x;
const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v, (k, x) => x && x.__bytes ? { __bytes: x.__bytes } : x), revive);
let saved = null; try { saved = sessionStorage.getItem(KEY); } catch (e) {}
const docs = new Map(Object.entries(saved ? JSON.parse(saved) : window.__FS_GIA__ || {}));
const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(Object.fromEntries(docs), (k, x) => x && x.__bytes ? { __bytes: x.__bytes } : x)); } catch (e) {} };
window.__fsGiaDump = () => JSON.stringify(Object.fromEntries([...docs].sort((a, b) => a[0] < b[0] ? -1 : 1)), (k, x) => x && x.__bytes ? { __bytes: x.__bytes } : x);
const subs = new Set();
const isObj = v => v && typeof v === 'object' && !Array.isArray(v) && !v.__bytes;
function merge(a, b) { const out = isObj(a) ? { ...a } : {}; for (const [k, v] of Object.entries(b)) out[k] = isObj(v) && isObj(out[k]) ? merge(out[k], v) : v; return out; }
function snap(path) {
  const pre = path + '/', list = [];
  for (const [k, v] of docs) if (k.startsWith(pre) && !k.slice(pre.length).includes('/')) list.push({ id: k.slice(pre.length), data: () => clone(v) });
  list.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return { docs: list, metadata: { fromCache: false, hasPendingWrites: false } };
}
let queued = new Set(), scheduled = false;
function changed(path) {
  save();
  queued.add(path.slice(0, path.lastIndexOf('/')));
  if (scheduled) return; scheduled = true;
  setTimeout(() => { scheduled = false; const q = queued; queued = new Set(); for (const s of [...subs]) if (q.has(s.path)) s.next(snap(s.path)); }, 0);
}
export const persistentMultipleTabManager = () => ({});
export const persistentLocalCache = o => o;
export const initializeFirestore = () => ({ db: 'gia' });
export const getFirestore = () => ({ db: 'gia' });
export const collection = (db, ...p) => ({ path: p.join('/') });
export const doc = (db, ...p) => ({ path: p.join('/') });
export function onSnapshot(ref, opt, next) { const s = { path: ref.path, next }; subs.add(s); setTimeout(() => subs.has(s) && next(snap(ref.path)), 0); return () => subs.delete(s); }
export async function setDoc(ref, data, o) { docs.set(ref.path, o && o.merge ? merge(docs.get(ref.path), clone(data)) : clone(data)); changed(ref.path); }
export async function deleteDoc(ref) { docs.delete(ref.path); changed(ref.path); }
export async function getDoc(ref) { const v = docs.get(ref.path); return { exists: () => v !== undefined, data: () => clone(v) }; }
export function writeBatch() { const ops = []; return { set: (ref, v) => ops.push([ref, v]), commit: async () => { for (const [ref, v] of ops) await setDoc(ref, v); } }; }
export const Bytes = { fromArray: a => ({ __bytes: a, toUint8Array() { return Uint8Array.from(this.__bytes); } }), fromUint8Array: u => Bytes.fromArray(Array.from(u)) };
`;

// Dữ liệu ban đầu của Firestore giả từ các nhóm dữ liệu của một nhà ({ kids: {...}, chores: {...}, ... }).
export function firestoreFromData(data, family) {
  const out = {};
  for (const [col, items] of Object.entries(data)) for (const [id, v] of Object.entries(items || {})) out[`families/${family}/${col}/${id}`] = v;
  return out;
}
// Dữ liệu ban đầu của Firestore giả từ localStorage của điểm xuất phát: nhánh gia đình và nhánh sổ học của từng lớp.
export function firestoreFromLs(ls, family) {
  const out = {}, main = JSON.parse(ls['be-cham-ngoan-v1'] || '{}');
  for (const [col, items] of Object.entries(main)) for (const [id, v] of Object.entries(items || {})) out[`families/${family}/${col}/${id}`] = v;
  const CLASS = { info: 'kids', sessions: 'events', tasks: 'tasks' };
  for (const [k, v] of Object.entries(ls)) {
    const m = /^misa-misu-so:(lop-.+)$/.exec(k); if (!m) continue;
    const d = JSON.parse(v);
    for (const [col, fcol] of Object.entries(CLASS)) for (const [id, x] of Object.entries(d[col] || {})) out[`families/${m[1]}/${fcol}/${id}`] = x;
  }
  return out;
}
