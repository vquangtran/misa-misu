// Nơi lưu dữ liệu. Có 2 kiểu, cùng một giao diện:
//   - localStore: lưu trong trình duyệt của máy đang dùng (không đồng bộ).
//   - firebaseStore: lưu trên Cloud Firestore, đồng bộ giữa các máy cùng "mã gia đình".
//
// Dữ liệu gồm 6 nhóm (collection), mỗi nhóm là { id: object }:
//   kids     các con        { name, avatar, birthday, weekBonus (đồng), wbLog: [{ from, amount, prev }] các lần đổi mức thưởng tuần, tint, order, since,
//                             dayBonus (đồng, thưởng mỗi ngày đủ việc), dayFrom: thứ Hai của tuần bắt đầu thưởng theo ngày, dbLog: như wbLog, tableVer: bản bảng mẫu đã xem }
//   chores   việc nhà       { name, icon, money (đồng; kind must có money = 0 là việc bắt buộc mỗi ngày, quyết định thưởng đủ tuần), kind: must|extra|fun, kids: [kidId], days: [0..6], order,
//                             since: ngày thêm việc, weeklyFrom: thứ Hai của tuần việc bắt đầu là việc bắt buộc, claim: ai làm trước thì tính, cùng làm thì chia đều tiền }
//   rewards  bảng giá       { name, icon, kind: merit|penalty|fee|gift (merit: thành tích học tập ở trường và ở lớp học thêm, con tự báo, bố mẹ duyệt), price (đồng; fee là đồng/giờ), all: mất hết tiền, week: mất hết tiền được thưởng trong tuần,
//                             again (đồng): mức phạt từ lần thứ hai trong cùng tuần; mỗi lần phạt ghi ledger.rid = mã mục để đếm }
//   done     việc đã xong   id = "YYYY-MM-DD", { [kidId]: { [choreId]: số tiền nhận được (0 = chưa),
//                             [choreId + '~s']: các mục con đã tick (mặt nạ bit), [choreId + '~r']: { what, pages } con đã đọc gì, bao nhiêu trang } }
//   ledger   sổ tài khoản   { kid, amount (đồng), kind: bonus|penalty|fee|spend|reward, note, icon, at, skip: ngày được miễn việc, wipe: thứ Hai của tuần bị phạt mất tiền thưởng,
//                             pending: true = thành tích con báo đang chờ bố mẹ duyệt (amount = 0, số tiền sẽ cộng ở ask); duyệt xong thì amount = ask, có okAt }
//   paid     (cũ, không dùng nữa) tiền tiêu vặt đã trả theo tuần
//            Riêng id "caidat" là cài đặt của gia đình: { pin: mã PIN bố mẹ đã băm, merit: 1 = đã thêm sẵn các mục thành tích, hw: 1 = đã thêm sẵn hai việc BTVN và mục phạt Thiếu BTVN, bottle: 1 = đã gắn "(mai đi học)" cho mục con tráng bình nước,
//                             nodone: 1 = đã bỏ mục con "Việc ngày hôm nay đã hoàn thành" }. Có PIN thì mỗi máy phải chọn là máy của bố mẹ hay của một con.
//   Dữ liệu cũ tính bằng sao (chores.stars, rewards.cost, ledger.delta, done < 100) được quy đổi 1 sao = 5.000đ.
//   timetables thời khoá biểu  id = kidId, { cls, year, days: [1..6], lunch, rows: [{ s, e, d: { [thứ]: môn } }] }
//   lessons  học thêm       { kid, day: 0..6, s: "HH:MM", e: "HH:MM", name, at, home, go, back }
//   stays    các con ở đâu  id = thứ "0".."6", { day, night }
//   tasks    bài tập        { kid, title, kind: bt|on|da, subj, due, notes, steps: [{ t, done }], done, doneAt, by: mã của con nếu con tự thêm từ màn của con }
//   goals    mục tiêu tiết kiệm { kid, name, icon, price (đồng), order, done, doneAt }
//   events   mốc năm học    { name, icon, kind: exam|holiday|meeting|event, from, to, kids: [] = cả nhà }
//   Sổ học của cô: danh sách lớp của nhà nằm trong nhóm `paid`, id "lop-<mã>": { lop: 1, kid, name (môn), book (tên sổ, trống = "Sổ học <môn>"), dur (7 số phút theo thứ, CN = 0), hwPen ({ mã bài: 1 } đã trừ tiền Thiếu BTVN), teacher, code (mã lớp), at, fee, feeOn, feeBy, feeOff }.
//   Cài đặt `caidat` có thêm so: 1 = đã tạo sẵn sổ học cho các cô của nhà; book: 1 = đã đổi tên sổ Tiếng Việt của Su; dur: 1 = đã ghi thời lượng theo thứ cho sổ đó.
//   Việc thích làm con xin thêm, xin sửa (chờ bố mẹ duyệt) cũng nằm trong nhóm `paid`, id "xin-<mã>": { xin: 'fun', kid, chore (mã việc xin sửa; không có = xin thêm), name, icon, minutes, slot, days, at }.
//   Nội dung sổ (buổi học, bài cô giao, file đính kèm) nằm ở một nhánh riêng cho từng lớp, xem classStore ở cuối file.

export const COLS = ['kids', 'chores', 'rewards', 'done', 'ledger', 'paid', 'timetables', 'lessons', 'stays', 'events', 'tasks', 'goals'];
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

// Firebase chỉ mở một lần, dùng chung cho nhánh của gia đình và các nhánh sổ học của cô.
let fbReady = null;
function fb(config) {
  fbReady = fbReady || (async () => {
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
    return { fs, db };
  })();
  fbReady.catch(() => { fbReady = null; });
  return fbReady;
}

export async function firebaseStore(config, family, onData, onStatus) {
  const { fs, db } = await fb(config);

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

// ---------- sổ học của cô ----------
// Mỗi lớp (một cô, một con, một môn) là một nhánh riêng families/lop-<mã lớp>/..., tách khỏi nhánh của gia đình.
// Cô chỉ có mã lớp (trong link riêng của cô) nên chỉ đọc/ghi được sổ của lớp đó: không thấy việc nhà, tiền hay
// dữ liệu khác của gia đình. Máy của nhà biết mã lớp nên đọc được sổ và đưa bài cô giao vào phần Bài tập của con.
// Nhánh lớp dùng lại tên các nhóm đã có trong Rules, nên không phải dán lại Rules:
//   info     (lưu ở nhóm kids)    id "lop": { name (môn), teacher, student (tên con), days: [{ day, s, e }] lịch học thêm của môn này,
//                                 fee (đồng), feeBy: buoi|gio: học phí mỗi buổi hoặc mỗi giờ, để tính học phí theo số buổi đã dạy trong tháng;
//                                 feeOn: mức riêng cho buổi Online (0 = như buổi thường); feeOff: tạm ẩn cả phần học phí }
//                                 id "bank": { bank, number, holder, note } tài khoản nhận học phí, cô tự ghi và sửa
//                                 id "paid": { "YYYY-MM": { at, amount } } các tháng bố mẹ đã xác nhận chuyển khoản học phí
//   sessions (lưu ở nhóm events)  buổi học { date, state: done|plan, mode: on|off, mins, topic, content, src, note (nhận xét), next (mục tiêu buổi sau),
//                                 links: [url], files: [{ id, n, name, type, size }], at }
//   tasks    (lưu ở nhóm tasks)   bài cô giao { title, notes, due, session (mã buổi), steps: [{ t, done }], links, files, at,
//                                 done, doneAt: con báo đã làm xong; got, gotAt: cô đã nhận bài; score, review: điểm và nhận xét bài làm }
//   file đính kèm (nhóm paid)     cắt thành khúc, id "<mã file>_<i>": { d: Bytes }. Không nghe thay đổi, chỉ tải khi mở file.
export const CLASS_COLS = { info: 'kids', sessions: 'events', tasks: 'tasks' };
const FILE_COL = 'paid';
// Một tài liệu Firestore tối đa 1 MiB: mỗi khúc 900 KB.
const CHUNK = 900 * 1024;
const emptyClass = () => Object.fromEntries(Object.keys(CLASS_COLS).map(c => [c, {}]));
const timeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(Object.assign(new Error('timeout'), { code: 'timeout' })), ms))]);

export async function firebaseClass(config, code, onData, onStatus) {
  const { fs, db } = await fb(config);
  const base = ['families', code], names = Object.keys(CLASS_COLS);
  const D = emptyClass(), got = new Set(), cached = new Set(), subs = [];
  const ref = (col, id) => fs.doc(db, ...base, CLASS_COLS[col], id);
  const part = (id, i) => fs.doc(db, ...base, FILE_COL, id + '_' + i);
  const range = n => Array.from({ length: Math.max(1, Number(n) || 1) }, (_, i) => i);
  return {
    kind: 'firebase',
    start() {
      for (const col of names) {
        subs.push(fs.onSnapshot(
          fs.collection(db, ...base, CLASS_COLS[col]),
          { includeMetadataChanges: true },
          snap => {
            D[col] = Object.fromEntries(snap.docs.map(d => [d.id, d.data()]));
            got.add(col);
            snap.metadata.fromCache ? cached.add(col) : cached.delete(col);
            if (got.size === names.length) onData(D, { fromCache: cached.size > 0 });
          },
          err => {
            got.add(col);
            if (got.size === names.length) onData(D, { fromCache: true });
            onStatus && onStatus(err);
          },
        ));
      }
    },
    stop() { subs.splice(0).forEach(off => off()); },
    put: (col, id, data) => fs.setDoc(ref(col, id), data),
    // Chỉ ghi các trường được đưa vào, giữ nguyên phần còn lại: cô chấm bài và con tick xong không ghi đè lên nhau.
    patch: (col, id, data) => fs.setDoc(ref(col, id), data, { merge: true }),
    del: (col, id) => fs.deleteDoc(ref(col, id)),
    // Tải file lên từng khúc, trả về số khúc. Phải có mạng: mỗi khúc chờ máy chủ nhận xong.
    async putFile(id, u8, onProgress) {
      const n = Math.max(1, Math.ceil(u8.length / CHUNK));
      for (let i = 0; i < n; i++) {
        await timeout(fs.setDoc(part(id, i), { d: fs.Bytes.fromUint8Array(u8.subarray(i * CHUNK, (i + 1) * CHUNK)) }), 60000);
        onProgress && onProgress((i + 1) / n);
      }
      return n;
    },
    async getFile(id, n) {
      const docs = await timeout(Promise.all(range(n).map(i => fs.getDoc(part(id, i)))), 60000);
      if (docs.some(d => !d.exists())) throw Object.assign(new Error('missing'), { code: 'not-found' });
      return docs.map(d => d.data().d.toUint8Array());
    },
    delFile: (id, n) => Promise.all(range(n).map(i => fs.deleteDoc(part(id, i)))),
  };
}

// Sổ học lưu trên trình duyệt (khi app không bật Firebase): cô và nhà phải dùng chung một trình duyệt, chủ yếu để dùng thử.
// Tab khác của cùng trình duyệt ghi gì thì tab này nhận được qua sự kiện storage.
export function localClass(code, onData) {
  const KEY = 'misa-misu-so:' + code, fkey = id => 'misa-misu-tep:' + code + ':' + id;
  let D = emptyClass();
  const load = () => {
    D = emptyClass();
    try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j) for (const c of Object.keys(D)) D[c] = j[c] || {}; } catch (e) { /* bỏ qua dữ liệu hỏng */ }
  };
  const changed = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} onData(D, { fromCache: false }); };
  const onStorage = e => { if (e.key === KEY) { load(); onData(D, { fromCache: false }); } };
  return {
    kind: 'local',
    start() { load(); window.addEventListener('storage', onStorage); onData(D, { fromCache: false }); },
    stop() { window.removeEventListener('storage', onStorage); },
    async put(col, id, data) { load(); D[col][id] = data; changed(); },
    async patch(col, id, data) { load(); D[col][id] = { ...(D[col][id] || {}), ...data }; changed(); },
    async del(col, id) { load(); delete D[col][id]; changed(); },
    async putFile(id, u8, onProgress) {
      let s = '';
      for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      try { localStorage.setItem(fkey(id), btoa(s)); } catch (e) { throw Object.assign(new Error('quota'), { code: 'resource-exhausted' }); }
      onProgress && onProgress(1);
      return 1;
    },
    async getFile(id) {
      const b = localStorage.getItem(fkey(id));
      if (b == null) throw Object.assign(new Error('missing'), { code: 'not-found' });
      return [Uint8Array.from(atob(b), ch => ch.charCodeAt(0))];
    },
    async delFile(id) { localStorage.removeItem(fkey(id)); },
  };
}
