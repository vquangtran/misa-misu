import { firebaseConfig } from './config.js';
import { COLS, localStore, firebaseStore } from './store.js';
import { AVATAR_SETS, avatarPick, isSvgAvatar } from './avatars.js';

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const WD = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const WDS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const pad = n => String(n).padStart(2, '0');
const key = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = k => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const weekStart = d => addDays(d, -((d.getDay() + 6) % 7));
const dm = d => d.getDate() + '/' + (d.getMonth() + 1);
const money = n => (Number(n) < 0 ? '−' : '') + Math.abs(Math.round(Number(n) || 0)).toLocaleString('vi-VN') + 'đ';
const signed = n => (Number(n) > 0 ? '+' : '') + money(n);
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.85 5.9 6.5.85-4.75 4.5 1.2 6.45L12 17.2l-5.8 3.1 1.2-6.45L2.65 9.35l6.5-.85z"/></svg>';
const AVATARS = ['🐔', '🐓', '🐣', '🐤', '🐥', '🐴', '🐎', '🦓', '🎠', '🦊', '🐯', '🐼', '🐨', '🦁', '🐸', '🐵', '🦄', '🐲', '🦖', '🐰', '🐱', '🐶', '🐧', '🐳', '🦋'];
const CHORE_ICONS = ['🛏️', '🪥', '🧸', '🍽️', '🪴', '📚', '🎒', '👕', '🧹', '🧽', '🗑️', '📦', '🛋️', '🧦', '👟', '🧺', '🛁', '🥢', '🐶', '🐟', '🍚', '✏️', '🎹', '🏃', '🪢', '🏫', '🎧', '🪑', '🤝', '🌙', '🎬', '🎮', '📺', '🧩', '🗣️'];
const PRICE_ICONS = {
  gift: ['🎁', '🎟️', '🍿', '🌙', '🧹', '🥞', '👫', '🍰', '🎬', '🎮', '🍦', '🧋', '🍕', '🧁', '📖', '🎡', '🛝', '🚲', '🏊'],
  penalty: ['😤', '🐢', '🤐', '🙉', '📢', '⚠️', '😠', '🙅', '🥊', '📵'],
  fee: ['📱', '📺', '🎮', '💻', '📲', '🎧'],
};
// Các loại mục trong Bảng giá (nhóm "rewards"): đổi quà, phạt, phí sử dụng theo giờ.
const PRICE_KINDS = [['penalty', 'Phạt', '⚠️'], ['fee', 'Phí sử dụng', '📱'], ['gift', 'Đổi quà', '🎁']];
const NAV = [
  { id: 'hom-nay', label: 'Hôm nay', svg: '<path d="M20 6 9 17l-5-5"/>' },
  { id: 'lich-hoc', label: 'Học tập', svg: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>' },
  { id: 'tai-khoan', label: 'Tài khoản', svg: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.2"/><path d="M6 12h.01M18 12h.01"/>' },
  { id: 'bang-gia', label: 'Bảng giá', svg: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><path d="M7.5 7.5h.01"/>' },
  { id: 'gia-dinh', label: 'Gia đình', svg: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>' },
];
// Link cũ (#phan-thuong, #tien-tieu-vat) mở trang mới tương ứng.
const NAV_ALIAS = { 'phan-thuong': 'bang-gia', 'tien-tieu-vat': 'tai-khoan' };
// Bảng thưởng phạt mẫu ("Cách cho con tiền tiêu vặt đúng cách"), dùng cho gia đình mới hoặc thêm vào bảng đang có.
// kind 'must': việc phải làm mỗi ngày, tính vào thưởng đủ tuần. kind 'extra': việc làm thêm, làm thì được tiền, không bắt buộc.
const DAILY = [0, 1, 2, 3, 4, 5, 6];
const SAMPLE_CHORES = [
  // also: tên cũ của cùng việc, nhà nào đã có thì không thêm lại.
  { name: 'Gấp chăn, dọn giường', also: ['Dọn giường', 'Gấp chăn'], icon: '🛏️', money: 5000, days: DAILY, slot: 'sang' },
  { name: 'Không kén ăn', icon: '🍚', money: 5000, days: DAILY },
  { name: 'Tự giác hoàn thành bài tập', icon: '✏️', money: 15000, days: [1, 2, 3, 4, 5], slot: 'toi' },
  { name: 'Nhảy dây mỗi ngày', icon: '🪢', money: 15000, days: DAILY },
  { name: 'Cất đồ chơi', icon: '🧸', money: 5000, days: DAILY, slot: 'toi' },
  // Bảng nhiệm vụ tuần của con (1 sao = 5.000đ).
  { name: 'Hoàn thành bài tập ở lớp', icon: '🏫', money: 10000, days: [1, 2, 3, 4, 5], slot: 'chieu' },
  { name: 'Đọc Raz-Kids, nghe audio', icon: '🎧', money: 10000, days: DAILY },
  { name: 'Đọc sách 30 phút', also: ['Đọc sách'], icon: '📚', money: 10000, days: DAILY, slot: 'toi', minutes: 30 },
  { name: 'Tự chuẩn bị, cất cặp', icon: '🎒', money: 5000, days: [1, 2, 3, 4, 5], slot: 'chieu' },
  { name: 'Dọn bàn học', icon: '🪑', money: 5000, days: DAILY, slot: 'toi' },
  { name: 'Đi bộ hoặc chạy ngoài trời', also: ['Đi bộ/chạy ngoài trời'], icon: '🏃', money: 10000, days: DAILY, perWeek: 3, minutes: 30 },
  { name: 'Checklist trước khi đi ngủ', also: ['Chuẩn bị trước khi ngủ'], icon: '🌙', money: 5000, days: DAILY, slot: 'toi',
    steps: ['Cặp sách đã chuẩn bị', 'Quần áo ngày mai đã chuẩn bị', 'Bàn học đã gọn', 'Sách đã cất đúng chỗ', 'Việc ngày hôm nay đã hoàn thành', 'Đã đánh răng, rửa mặt'] },
  { name: 'Quét nhà', icon: '🧹', money: 5000, kind: 'extra' },
  { name: 'Lau nhà', icon: '🧽', money: 10000, kind: 'extra' },
  { name: 'Rửa bát', icon: '🍽️', money: 10000, kind: 'extra' },
  { name: 'Lau bàn', icon: '🧽', money: 5000, kind: 'extra' },
  { name: 'Đổ rác', icon: '🗑️', money: 5000, kind: 'extra' },
  { name: 'Nhận bưu kiện', icon: '📦', money: 10000, kind: 'extra' },
  { name: 'Thu quần áo', icon: '👕', money: 10000, kind: 'extra' },
  { name: 'Phơi quần áo', icon: '🧺', money: 5000, kind: 'extra' },
  { name: 'Giặt tất', icon: '🧦', money: 5000, kind: 'extra' },
  { name: 'Dọn sofa', icon: '🛋️', money: 5000, kind: 'extra' },
  { name: 'Sắp xếp giày dép', icon: '👟', money: 5000, kind: 'extra' },
  { name: 'Chủ động giúp bố mẹ', icon: '🤝', money: 5000, kind: 'extra' },
  { name: 'Xem phim hoặc chơi Lego', icon: '🎬', money: 0, kind: 'fun', days: DAILY, slot: 'toi', minutes: 30 },
].map(c => ({ days: DAILY, kind: 'must', slot: '', ...c }));
const SAMPLE_PRICES = [
  { name: 'Nổi nóng', icon: '😤', kind: 'penalty', price: 10000 },
  { name: 'Trì hoãn', icon: '🐢', kind: 'penalty', price: 10000 },
  { name: 'Nói tục', icon: '🤐', kind: 'penalty', price: 10000 },
  { name: 'Cãi lời', icon: '🙉', kind: 'penalty', price: 10000 },
  { name: 'Réo “mẹ” trong lúc làm việc', icon: '📢', kind: 'penalty', price: 0, all: true },
  { name: 'Điện thoại', icon: '📱', kind: 'fee', price: 25000 },
  { name: 'Tivi', icon: '📺', kind: 'fee', price: 25000 },
  // Phiếu thưởng: con dùng tiền trong tài khoản để đổi. skip: miễn việc phải làm của một ngày.
  { name: 'Chọn phim tối nay', icon: '🍿', kind: 'gift', price: 15000, note: 'Con được chọn phim cả nhà xem tối nay' },
  { name: 'Chọn món ăn sáng', icon: '🥞', kind: 'gift', price: 15000, note: 'Con chọn món ăn sáng mình thích nhất' },
  { name: 'Món tráng miệng', icon: '🍰', kind: 'gift', price: 10000, note: 'Một món tráng miệng con thích sau bữa tối' },
  { name: 'Thức khuya thêm 30 phút', icon: '🌙', kind: 'gift', price: 20000, note: 'Đi ngủ muộn hơn 30 phút, một tối' },
  { name: 'Mời bạn đến chơi', icon: '👫', kind: 'gift', price: 30000, note: 'Mời một bạn đến nhà chơi' },
  { name: 'Một ngày không làm việc nhà', icon: '🧹', kind: 'gift', price: 50000, skip: true, note: 'Nghỉ hết việc phải làm trong một ngày, vẫn giữ thưởng đủ tuần' },
];
// Thưởng thêm khi con làm đủ mọi việc phải làm trong một tuần (Thứ Hai đến Chủ nhật).
const WEEK_BONUS = 25000;
// Trước đây app tính bằng sao. Dữ liệu cũ (sao) được quy đổi: 1 sao = 5.000đ.
const STAR_VND = 5000;

// Môn học gợi ý khi nhập thời khoá biểu (tiểu học và THCS).
const SUBJECTS = ['Toán', 'Tiếng Việt', 'Ngữ văn', 'Tiếng Anh', 'Khoa học', 'KHTN', 'Lịch sử và Địa lí', 'Đạo đức', 'GDCD', 'Âm nhạc', 'Mĩ thuật',
  'Tin học', 'Công nghệ', 'Giáo dục thể chất', 'Bơi', 'Hoạt động trải nghiệm', 'Sinh hoạt dưới cờ', 'Sinh hoạt lớp', 'Tự học'];
// Thời khoá biểu mẫu: 7 tiết, nghỉ trưa sau tiết 4, Thứ Hai đến Thứ Sáu.
const SAMPLE_PERIODS = [['08:00', '08:35'], ['08:45', '09:20'], ['09:40', '10:15'], ['10:25', '11:00'], ['14:10', '14:45'], ['14:55', '15:30'], ['15:40', '16:15']];

// ---------- state ----------
let S = Object.fromEntries(COLS.map(c => [c, {}]));
const UI = { view: 'hom-nay', date: today(), acctKid: null, acctKind: 'penalty', histAll: false, extraOpen: {}, learn: 'sap-toi', todayMode: 'day', gridWs: null, planNext: false, agDate: null, taskDone: false, tkbKid: null, km: { on: false, kid: null }, sheet: false };
let store = null, loaded = false, stale = false, family = null;
const FAMILY_KEY = 'be-cham-ngoan-family';
const getFamily = () => { try { return localStorage.getItem(FAMILY_KEY); } catch (e) { return null; } };
const setFamily = v => { try { v ? localStorage.setItem(FAMILY_KEY, v) : localStorage.removeItem(FAMILY_KEY); } catch (e) {} };

function writeErr(e) {
  const c = e && e.code;
  if (c === 'permission-denied') toast('Không có quyền lưu. Kiểm tra Firestore Rules (xem README).');
  else if (c === 'resource-exhausted') toast('Đã hết hạn mức miễn phí hôm nay của Firebase.');
  else toast('Chưa lưu được. Kiểm tra mạng rồi thử lại.');
  console.error(e);
}
// Ghi không chờ: Firestore tự lưu tạm khi mất mạng và gửi lại sau.
const put = (col, id, data) => { Promise.resolve(store.put(col, id, data)).catch(writeErr); };
const del = (col, id) => { Promise.resolve(store.del(col, id)).catch(writeErr); };
const setDone = (d, kid, chore, val) => { Promise.resolve(store.setDone(d, kid, chore, val)).catch(writeErr); };

// ---------- derived ----------
const kidsList = () => Object.entries(S.kids).map(([id, k]) => ({ id, ...k })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.name).localeCompare(String(b.name), 'vi'));
const choresList = () => Object.entries(S.chores).map(([id, c]) => ({ id, ...c })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.name).localeCompare(String(b.name), 'vi'));
// Bảng giá: { name, icon, kind: 'gift' | 'penalty' | 'fee', price (đồng; phí sử dụng là đồng/giờ), all: true = phạt mất hết tiền }.
// Mục cũ chỉ có cost (sao) và không có kind là đổi quà.
const priceKind = r => ['penalty', 'fee'].includes(r.kind) ? r.kind : 'gift';
const priceVnd = r => r.price != null ? Math.max(0, Number(r.price) || 0) : (Number(r.cost) || 0) * STAR_VND;
const pricesList = kind => Object.entries(S.rewards).map(([id, r]) => ({ id, ...r })).filter(r => !kind || priceKind(r) === kind)
  .sort((a, b) => (a.all ? 1 : 0) - (b.all ? 1 : 0) || priceVnd(a) - priceVnd(b) || String(a.name).localeCompare(String(b.name), 'vi'));
// Việc nhà: { name, icon, money (đồng), kids, days, order,
//   kind: 'must' (phải làm, có tiền) | 'extra' (làm thêm, có tiền, không bắt buộc)
//         | 'fun' (thích làm, không có tiền, mở khoá khi xong việc phải làm),
//   slot: 'sang' | 'chieu' | 'toi' | '' , time: "HH:MM", by: true = phải xong trước giờ đó, minutes,
//   perWeek: số lần mỗi tuần (ngày nào trong `days` cũng được), steps: [danh sách con],
//   variants: [nội dung xen kẽ], shared: true = việc chung, một con đánh dấu là tính cho cả nhà }
const isFun = c => c.kind === 'fun';
const isExtra = c => c.kind === 'extra';
const isMust = c => !isFun(c) && !isExtra(c);
// Tiền của một việc. Việc cũ chỉ có số sao thì quy đổi theo STAR_VND.
const choreVnd = c => isFun(c) ? 0 : c.money != null ? Math.max(0, Math.round(Number(c.money) || 0)) : (Number(c.stars) || 1) * STAR_VND;
// done lưu số tiền nhận được. Giá trị nhỏ hơn 100 là dữ liệu cũ tính bằng sao; 0.5 là "đã làm" với việc không có tiền.
const doneVnd = v => { v = Number(v) || 0; return v <= 0 ? 0 : v >= 100 ? v : Number.isInteger(v) ? v * STAR_VND : 0; };
const doneVal = c => choreVnd(c) || 0.5;
// Sổ tài khoản: mục mới ghi amount (đồng), mục cũ ghi delta (sao).
const ledgerVnd = l => l.amount != null ? Number(l.amount) || 0 : (Number(l.delta) || 0) * STAR_VND;
const weekBonusOf = k => k.weekBonus != null ? Math.max(0, Number(k.weekBonus) || 0) : WEEK_BONUS;
const perWeekOf = c => Math.max(0, Math.min(7, Number(c.perWeek) || 0));
const isDone = (d, kid, chore) => (Number(S.done[key(d)]?.[kid]?.[chore]) || 0) > 0;
const stepMask = (d, kid, chore) => Number(S.done[key(d)]?.[kid]?.[chore + '~s']) || 0;
// Số lần đã làm trong tuần chứa ngày d: tính đến hết ngày d, hoặc chỉ những ngày trước d.
function weekCount(kid, c, d, beforeOnly = false) {
  const ws = weekStart(d), dk = key(d); let n = 0;
  for (let i = 0; i < 7; i++) { const x = addDays(ws, i), xk = key(x); if (beforeOnly ? xk >= dk : xk > dk) break; if (isDone(x, kid, c.id)) n++; }
  return n;
}
// Việc "X lần mỗi tuần" hiện mỗi ngày cho tới khi đủ số lần (ngày đã làm thì vẫn hiện).
const choresFor = (kidId, d) => choresList().filter(c => (c.kids || []).includes(kidId) && (c.days || []).includes(d.getDay())
  && (!perWeekOf(c) || isDone(d, kidId, c.id) || weekCount(kidId, c, d, true) < perWeekOf(c)));
// Ngày con dùng phiếu "Một ngày không làm việc nhà": việc phải làm được miễn (làm thì vẫn có tiền).
const skipEntry = (kidId, d) => memoize('skips', () => { const m = {}; for (const l of Object.values(S.ledger)) if (l.skip) m[l.kid + '|' + l.skip] = l; return m; })[kidId + '|' + key(d)] || null;
const skipOn = (kidId, d) => !!skipEntry(kidId, d);
const mustFor = (kidId, d) => skipOn(kidId, d) ? [] : choresFor(kidId, d).filter(isMust);
// Nội dung xen kẽ: lần làm thứ n dùng variants[n % số nội dung].
function variantOf(c, kid, d) {
  const v = (c.variants || []).map(x => String(x).trim()).filter(Boolean); if (!v.length) return '';
  const dk = key(d); let n = 0;
  for (const [k2, day] of Object.entries(S.done)) if (k2 < dk && Number(day?.[kid]?.[c.id]) > 0) n++;
  return v[n % v.length];
}
// Tính lại sau mỗi lần dữ liệu đổi (xoá trong render).
let memo = {};
const memoize = (k, f) => (k in memo ? memo[k] : (memo[k] = f()));
// Tiền kiếm được từ việc nhà, từ ngày a đến ngày b (khoá "YYYY-MM-DD", không bắt buộc).
function earned(kidId, a = '', b = '9999') {
  let s = 0;
  for (const [dk, day] of Object.entries(S.done)) {
    if (dk < a || dk > b) continue;
    const m = day && day[kidId]; if (m) for (const [k2, v] of Object.entries(m)) if (!k2.includes('~')) s += doneVnd(v);
  }
  return s;
}
// Các tuần con làm đủ mọi việc phải làm: [{ ws, amount }]. Tuần hiện tại được tính khi đã đủ.
function weekBonuses(kidId) {
  return memoize('wb' + kidId, () => {
    const k = S.kids[kidId]; if (!k) return [];
    const amt = weekBonusOf(k); if (!amt) return [];
    const first = Object.keys(S.done).filter(dk => S.done[dk]?.[kidId]).sort()[0];
    const start = weekStart(k.since ? parse(k.since) : first ? parse(first) : today()), end = weekStart(today()), out = [];
    for (let ws = start, i = 0; ws <= end && i < 520; ws = addDays(ws, 7), i++) {
      const st = weekStats({ id: kidId, ...k }, ws);
      if (st.possible && st.done >= st.possible) out.push({ ws, amount: amt });
    }
    return out;
  });
}
function balance(kidId) {
  return memoize('bal' + kidId, () => {
    let s = earned(kidId);
    for (const l of Object.values(S.ledger)) if (l.kid === kidId) s += ledgerVnd(l);
    for (const w of weekBonuses(kidId)) s += w.amount;
    return s;
  });
}
const progBox = (n, all, title) => `<div class="prog-box"><div class="prog-t">${title}</div><div class="prog"><div class="bar ${n >= all ? 'full' : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="${all}" aria-valuenow="${n}"><b style="width:${all ? Math.round(n / all * 100) : 0}%"></b></div><span class="lv num ${n >= all ? 'full' : ''}">${n}/${all}</span></div></div>`;
const moneyChip = (k, style = '') => `<span class="stars num ${balance(k.id) < 0 ? 'neg' : ''}" title="Số tiền trong tài khoản" ${style ? `style="${style}"` : ''}><span class="coin" aria-hidden="true">💰</span>${money(balance(k.id))}</span>`;
function weekStats(kid, ws) {
  let possible = 0, done = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(ws, i); for (const c of mustFor(kid.id, d)) if (!perWeekOf(c)) { possible++; if (isDone(d, kid.id, c.id)) done++; } }
  // Việc X lần mỗi tuần tính X lần, không tính theo từng ngày.
  for (const c of choresList()) if (isMust(c) && perWeekOf(c) && (c.kids || []).includes(kid.id)) { const n = perWeekOf(c); possible += n; done += Math.min(n, weekCount(kid.id, c, addDays(ws, 6))); }
  return { possible, done };
}
// Ngày đủ việc: true / false, 'skip' (dùng phiếu nghỉ) hoặc 'none' (không có việc phải làm).
const dayFull = (kidId, d) => { if (skipOn(kidId, d)) return 'skip'; const l = mustFor(kidId, d); return l.length ? l.every(c => isDone(d, kidId, c.id)) : 'none'; };
const kidSince = kidId => { const k = S.kids[kidId]; const first = Object.keys(S.done).filter(dk => S.done[dk]?.[kidId]).sort()[0]; const a = k?.since && (!first || k.since < first) ? k.since : first; return a ? parse(a) : today(); };
// Chuỗi ngày liên tiếp làm đủ việc phải làm (ngày nghỉ, ngày không có việc thì bỏ qua). Hôm nay chưa xong thì chưa làm đứt chuỗi.
function streakOf(kidId) {
  return memoize('st' + kidId, () => {
    const from = kidSince(kidId); let n = 0, d = today();
    if (dayFull(kidId, d) !== true) d = addDays(d, -1);
    for (let i = 0; i < 400 && d >= from; i++, d = addDays(d, -1)) { const f = dayFull(kidId, d); if (f === true) n++; else if (f === false) break; }
    return n;
  });
}
function bestStreak(kidId) {
  return memoize('bs' + kidId, () => {
    let best = 0, n = 0, d = kidSince(kidId); const t = today();
    for (let i = 0; i < 800 && d <= t; i++, d = addDays(d, 1)) { const f = dayFull(kidId, d); if (f === true) best = Math.max(best, ++n); else if (f === false && key(d) !== key(t)) n = 0; }
    return Math.max(best, streakOf(kidId));
  });
}
const streakChip = k => { const n = streakOf(k.id); return n ? `<span class="streak" title="Số ngày liên tiếp làm đủ việc phải làm">🔥 ${n} ngày</span>` : ''; };
const kidName = id => S.kids[id]?.name || 'Bé';
// Màu riêng của con (nền hình đại diện và khung chào trong chế độ cho bé): theo bộ hình (Su vàng, Sa be) nếu dùng bộ gà, ngựa; không thì theo màu đã chọn.
const tintOf = k => { const p = avatarPick(avatarOf(k)); return p ? `var(--tint-${p.set})` : 'var(--t' + ((Number(k.tint) || 0) % 6) + ')'; };
// Ảnh của con (data URL nhỏ, lưu trong dữ liệu của gia đình), không có thì dùng emoji.
const photoOf = k => /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(k?.photo || '') ? k.photo : '';
// Su mặc định là bộ gà, Sa là bộ ngựa (mỗi ngày một kiểu), cho tới khi bố mẹ chọn hình khác trong thông tin của con.
const AV_DEFAULT = { misu: 'set:ga', su: 'set:ga', misa: 'set:ngua', sa: 'set:ngua' };
const avatarOf = k => k?.avatarChosen || isSvgAvatar(k?.avatar) ? (k.avatar || '🙂') : AV_DEFAULT[String(k?.name || '').trim().toLowerCase()] || k?.avatar || '🙂';
// Nội dung bên trong khung tròn cho một giá trị hình đại diện (SVG hoặc emoji).
const avInner = v => { const p = avatarPick(v); return p ? p.svg : esc(v || '🙂'); };
const ava = (k, cls = '') => {
  if (photoOf(k)) return `<span class="ava photo ${cls}" style="background:${tintOf(k)}"><img src="${photoOf(k)}" alt=""></span>`;
  const p = avatarPick(avatarOf(k));
  return p ? `<span class="ava svg ${cls}" style="background:${tintOf(k)}" title="${esc(p.name)}">${p.svg}</span>` : `<span class="ava ${cls}" style="background:${tintOf(k)}">${esc(avatarOf(k))}</span>`;
};
const mini = k => photoOf(k) ? `<img class="mini" src="${photoOf(k)}" alt="">` : avatarPick(avatarOf(k)) ? `<span class="mini">${avInner(avatarOf(k))}</span>` : esc(avatarOf(k));
function choreSummary(c) {
  const sl = SLOTS.find(x => x[0] === choreSlot(c));
  return [isFun(c) ? '🎈 thích làm' : `${isExtra(c) ? '💪 làm thêm' : '⭐ phải làm'} ${money(choreVnd(c))}`, (c.kids || []).map(kidName).map(esc).join(', ') || 'chưa giao cho ai',
    perWeekOf(c) ? `${perWeekOf(c)} lần/tuần (${daysLabel(c.days)})` : daysLabel(c.days),
    choreSlot(c) ? `${sl[2]} ${toMin(c.time) !== null ? (c.by ? 'trước ' : '') + esc(c.time) : sl[1].replace('Buổi ', '').toLowerCase()}` : '',
    Number(c.minutes) ? `${Number(c.minutes)} phút` : '', (c.steps || []).length ? `${c.steps.length} mục con` : '',
    (c.variants || []).length ? `xen kẽ: ${c.variants.map(esc).join(' / ')}` : '', c.shared ? 'việc chung' : ''].filter(Boolean).join(' · ');
}
function daysLabel(days) {
  const s = [...(days || [])].sort();
  if (s.length === 7) return 'mỗi ngày';
  if (s.join() === '1,2,3,4,5') return 'ngày thường';
  if (s.join() === '0,6') return 'cuối tuần';
  if (!s.length) return 'chưa chọn ngày';
  return WEEK_ORDER.filter(d => s.includes(d)).map(d => WDS[d]).join(', ');
}
const modeLabel = k => weekBonusOf(k) ? `làm đủ việc cả tuần được thưởng ${money(weekBonusOf(k))}` : 'không có thưởng đủ tuần';
function ageOf(k, at = today()) {
  if (!k.birthday) return null;
  const b = parse(k.birthday);
  let a = at.getFullYear() - b.getFullYear();
  if (at.getMonth() < b.getMonth() || (at.getMonth() === b.getMonth() && at.getDate() < b.getDate())) a--;
  return a >= 0 ? a : null;
}
const isBirthday = (k, d) => { if (!k.birthday) return false; const b = parse(k.birthday); return b.getDate() === d.getDate() && b.getMonth() === d.getMonth(); };
const bdayChip = (k, d) => isBirthday(k, d) ? `<span class="streak">🎂 Sinh nhật ${ageOf(k, d)} tuổi</span>` : '';

// ---------- thời khoá biểu ----------
const toMin = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const hm = n => pad(Math.floor(n / 60) % 24) + ':' + pad(n % 60);
const durTxt = n => { const h = Math.floor(n / 60), m = n % 60; return h ? `${h} giờ${m ? ` ${m} phút` : ''}` : `${m} phút`; };
const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
const WDN = d => d === 0 ? 'Chủ nhật' : 'Thứ ' + (d + 1);
const tkbOf = kidId => { const t = S.timetables[kidId]; return t && Array.isArray(t.rows) ? t : null; };
const tkbDays = t => (Array.isArray(t.days) && t.days.length ? t.days : [1, 2, 3, 4, 5]).map(Number).sort();
// Các tiết có môn trong một thứ, kèm giờ vào và giờ tan.
function schoolDay(t, wd) {
  if (!t || !tkbDays(t).includes(wd)) return null;
  const list = t.rows.map((r, i) => ({ i, s: r.s, e: r.e, subj: String((r.d || {})[wd] || '').trim() })).filter(x => x.subj);
  if (!list.length) return null;
  return { list, start: list[0].s, end: list[list.length - 1].e, subjects: [...new Set(list.map(x => x.subj))] };
}
// Buổi học tiếp theo sau ngày d, bỏ qua những ngày nghỉ trong Mốc năm học.
function nextSchool(t, d, kidId) {
  for (let i = 1; i <= 31; i++) {
    const x = addDays(d, i), info = kidId && holidayOn(kidId, x) ? null : schoolDay(t, x.getDay());
    if (info) return { date: x, info, label: i === 1 ? 'Ngày mai' : i < 7 ? WDN(x.getDay()) : `${WDN(x.getDay())} ${dm(x)}` };
  }
  return null;
}

// ---------- mốc năm học ----------
// events: { name, icon, kind: exam|holiday|meeting|event, from: "YYYY-MM-DD", to: "YYYY-MM-DD" (không bắt buộc), kids: [] = cả nhà }
const EVENT_KINDS = [['exam', 'Kiểm tra', '📝'], ['holiday', 'Nghỉ học', '🏖️'], ['meeting', 'Họp phụ huynh', '👪'], ['event', 'Sự kiện', '🎉']];
const EVENT_ICONS = ['📝', '🏫', '🎒', '📘', '🌱', '🌸', '🧧', '🎓', '🏆', '👪', '🎉', '🏖️', '⚽', '🎭', '🩺', '📣'];
// Khung thời gian năm học 2026 – 2027 theo hướng dẫn của Bộ GD&ĐT và Sở GD&ĐT Hà Nội (khối 4).
const SAMPLE_YEAR = { label: 'năm học 2026 – 2027', items: [
  { name: 'Khối 4 tập trung, sinh hoạt lớp đầu năm', icon: '🎒', kind: 'event', from: '2026-09-03' },
  { name: 'Lễ khai giảng', icon: '🏫', kind: 'event', from: '2026-09-05' },
  { name: 'Khảo sát đầu năm Tiếng Việt, Toán, Tiếng Anh', icon: '📝', kind: 'exam', from: '2026-09-07', to: '2026-09-11' },
  { name: 'Kiểm tra, khảo sát giữa kì I', icon: '📝', kind: 'exam', from: '2026-10-26', to: '2026-11-01' },
  { name: 'Kiểm tra học kì I', icon: '📝', kind: 'exam', from: '2026-12-14', to: '2026-12-27' },
  { name: 'Kết thúc học kì I', icon: '📘', kind: 'event', from: '2027-01-15' },
  { name: 'Họp phụ huynh cuối kì I', icon: '👪', kind: 'meeting', from: '2027-01-17' },
  { name: 'Bắt đầu chương trình học kì II', icon: '🌱', kind: 'event', from: '2027-01-18' },
  { name: 'Lễ hội chào Xuân 2027', icon: '🌸', kind: 'event', from: '2027-01-27', to: '2027-01-28' },
  { name: 'Nghỉ Tết Nguyên đán', icon: '🧧', kind: 'holiday', from: '2027-02-04', to: '2027-02-22' },
  { name: 'Kiểm tra, khảo sát giữa kì II', icon: '📝', kind: 'exam', from: '2027-03-09', to: '2027-03-10' },
  { name: 'Kiểm tra học kì II', icon: '📝', kind: 'exam', from: '2027-04-19', to: '2027-05-09' },
  { name: 'Kết thúc chương trình học kì II', icon: '🎓', kind: 'event', from: '2027-05-21' },
  { name: 'Họp phụ huynh cuối năm học', icon: '👪', kind: 'meeting', from: '2027-05-23' },
  { name: 'Kết thúc năm học (bế giảng)', icon: '🏆', kind: 'event', from: '2027-05-24', to: '2027-05-30' },
] };
const eventsList = () => Object.entries(S.events || {}).map(([id, e]) => ({ id, ...e, to: e.to && e.to > e.from ? e.to : e.from }))
  .filter(e => e.from).sort((a, b) => a.from.localeCompare(b.from) || String(a.name).localeCompare(String(b.name), 'vi'));
const forKid = (e, kidId) => !(e.kids || []).length || e.kids.includes(kidId);
const eventsOf = kidId => eventsList().filter(e => forKid(e, kidId));
const holidayOn = (kidId, d) => { const dk = key(d); return eventsOf(kidId).find(e => e.kind === 'holiday' && e.from <= dk && dk <= e.to) || null; };
const schoolOn = (kidId, d) => holidayOn(kidId, d) ? null : schoolDay(tkbOf(kidId), d.getDay());
const dmy = d => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
function eventRange(e) {
  const a = parse(e.from), b = parse(e.to);
  if (e.from === e.to) return `${WDN(a.getDay())}, ${dmy(a)}`;
  return a.getFullYear() === b.getFullYear() ? `${dm(a)} – ${dmy(b)}` : `${dmy(a)} – ${dmy(b)}`;
}
const daysTo = dk => Math.round((parse(dk) - today()) / 864e5);
// Trạng thái so với hôm nay: { past, now, txt }.
function eventWhen(e) {
  const tk = key(today()), n = daysTo(e.from);
  if (e.to < tk) return { past: true, txt: 'Đã qua' };
  if (e.from <= tk) return { now: true, txt: e.kind === 'holiday' ? 'Đang nghỉ' : e.from === e.to ? 'Hôm nay' : `Đang diễn ra, còn ${daysTo(e.to) + 1} ngày` };
  return { txt: n === 1 ? 'Ngày mai' : `Còn ${n} ngày` };
}
// Mốc sắp tới cần nhắc ở màn Hôm nay: đang diễn ra, hoặc sắp bắt đầu (kiểm tra báo trước 14 ngày, còn lại 7 ngày).
const eventsSoon = kidId => eventsOf(kidId).filter(e => { const w = eventWhen(e); return !w.past && (w.now || daysTo(e.from) <= (e.kind === 'exam' ? 14 : 7)); });
const eventLines = (k, cls = 'event-line') => eventsSoon(k.id).map(e => `<a class="${cls} ${esc(e.kind)}" href="#lich-hoc" data-act="tkb-go" data-tab="moc" data-kid="${k.id}"><b>${esc(e.icon || '📌')} ${esc(eventWhen(e).txt)}:</b> ${esc(e.name)} <span class="muted">(${esc(eventRange(e))})</span></a>`).join('');
function missingYear() {
  const have = new Set(eventsList().map(e => norm(e.name) + e.from));
  return SAMPLE_YEAR.items.filter(e => !have.has(norm(e.name) + e.from));
}
function eventsCard(kidId) {
  const kids = kidsList(), list = kidId ? eventsOf(kidId) : eventsList(), miss = missingYear();
  const past = list.filter(e => eventWhen(e).past), rest = list.filter(e => !eventWhen(e).past);
  const row = e => {
    const w = eventWhen(e), who = (e.kids || []).length && !kidId ? e.kids.map(kidName).join(', ') : '';
    return `<div class="item event ${w.now ? 'now' : ''} ${w.past ? 'past' : ''}"><span class="ico">${esc(e.icon || '📌')}</span><div class="txt"><div class="t">${esc(e.name)}</div><div class="s num">${esc(eventRange(e))}${who ? ` · ${esc(who)}` : ''}</div></div>
      <div class="acts">${w.past ? '' : `<span class="badge ${w.now ? 'ok' : ''}">${esc(w.txt)}</span>`}<button class="btn ghost sm" data-act="event-form" data-id="${e.id}">Sửa</button></div></div>`;
  };
  let h = `<div class="sec-title">Mốc năm học</div><div class="row"><button class="btn primary" data-act="event-form" data-kid="${kidId || ''}" ${kids.length ? '' : 'disabled'}>Thêm mốc</button>${miss.length && kids.length ? `<button class="btn ghost" data-act="year-form">Thêm ${miss.length} mốc ${SAMPLE_YEAR.label}</button>` : ''}</div>`;
  if (!list.length) return h + `<p class="muted" style="margin:0">Ghi các ngày khai giảng, kiểm tra, nghỉ Tết, họp phụ huynh. App nhắc trước ở màn Hôm nay, và những ngày nghỉ học thì không báo đi học.</p>`;
  h += `<section class="card"><div class="list">${rest.map(row).join('') || '<p class="muted small" style="margin:0">Không còn mốc nào sắp tới.</p>'}</div>`;
  if (past.length) h += `<details class="adv"><summary>Đã qua (${past.length} mốc)</summary><div class="list">${past.map(row).join('')}</div></details>`;
  return h + `</section>`;
}
function eventForm(id, kidPre) {
  const e = id ? S.events[id] : null, kids = kidsList();
  const sel = e ? (e.kids || []) : S.kids[kidPre] ? [kidPre] : [];
  const kind = e?.kind || 'event';
  openModal(`<h2>${e ? 'Sửa mốc' : 'Thêm mốc năm học'}</h2>
  <div class="field"><label for="ename">Tên mốc</label><input id="ename" class="input" maxlength="60" value="${esc(e?.name || '')}" placeholder="Ví dụ: Kiểm tra học kì I"></div>
  <div class="field"><span class="lbl">Loại</span><div class="seg">${EVENT_KINDS.map(([v, l, ic]) => `<label><input type="radio" name="ekind" value="${v}" ${v === kind ? 'checked' : ''}><span>${ic} ${l}</span></label>`).join('')}</div>
    <span class="muted small">Những ngày <b>Nghỉ học</b> app không báo giờ ở trường và soạn cặp. <b>Kiểm tra</b> được nhắc trước 14 ngày, các mốc khác 7 ngày.</span></div>
  <div class="field"><span class="lbl">Biểu tượng</span>${pickGrid('eico', EVENT_ICONS, e?.icon)}</div>
  <div class="row2"><div class="field"><label for="efrom">Từ ngày</label><input id="efrom" class="input num" type="date" value="${esc(e?.from || '')}"></div>
    <div class="field"><label for="eto">Đến ngày (nếu kéo dài)</label><input id="eto" class="input num" type="date" value="${esc(e?.to && e.to !== e.from ? e.to : '')}"></div></div>
  ${kids.length > 1 ? `<div class="field"><span class="lbl">Của con nào</span><div class="seg">${kids.map(k => `<label><input type="checkbox" name="ekid" value="${k.id}" ${sel.includes(k.id) ? 'checked' : ''}><span>${mini(k)} ${esc(k.name)}</span></label>`).join('')}</div>
    <span class="muted small">Không chọn ai thì là mốc chung của cả nhà.</span></div>` : ''}
  <div class="foot">${e ? `<button class="btn danger left" data-act="event-del" data-id="${id}">Xoá</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="event-save" data-id="${id || ''}">Lưu</button></div>`);
}
function yearForm() {
  const kids = kidsList(), miss = missingYear();
  const pre = kids.filter(k => /(^|\D)4(\D|$)/.test(tkbOf(k.id)?.cls || '')).map(k => k.id);
  openModal(`<h2>Mốc ${SAMPLE_YEAR.label}</h2>
  <p class="muted" style="margin:-8px 0 0">Khung thời gian năm học khối 4 theo hướng dẫn của Bộ GD&ĐT và Sở GD&ĐT Hà Nội: ${miss.length} mốc, từ ngày tập trung đến bế giảng. Thêm xong sửa lại tuỳ ý.</p>
  <div class="list">${miss.map(e => `<div class="item"><span class="ico">${e.icon}</span><div class="txt"><div class="t">${esc(e.name)}</div><div class="s num">${esc(eventRange({ ...e, to: e.to || e.from }))}</div></div></div>`).join('')}</div>
  ${kids.length > 1 ? `<div class="field"><span class="lbl">Cho con nào</span><div class="seg">${kids.map(k => `<label><input type="checkbox" name="ykid" value="${k.id}" ${pre.includes(k.id) ? 'checked' : ''}><span>${mini(k)} ${esc(k.name)}</span></label>`).join('')}</div>
    <span class="muted small">Không chọn ai thì là mốc chung của cả nhà.</span></div>` : ''}
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="year-add">Thêm ${miss.length} mốc</button></div>`);
}
// Màu cố định cho mỗi môn, để cùng một môn luôn cùng một màu.
const subjTint = name => { let h = 0; for (const ch of String(name).toLowerCase().trim()) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h % 6; };
const subjChips = list => list.map(s => `<span class="sj-chip sj${subjTint(s)}">${esc(s)}</span>`).join('');
function tkbTable(t, hl = null) {
  const days = tkbDays(t), now = hl !== null ? nowMin() : null, lunch = Number(t.lunch) || 0;
  let h = `<div class="tbl-wrap"><table class="tkb"><colgroup><col style="width:44px"><col style="width:62px">${days.map(() => '<col>').join('')}</colgroup>
    <thead><tr><th>Tiết</th><th>Giờ</th>${days.map(d => `<th class="${d === hl ? 'on' : ''}">${WDN(d)}</th>`).join('')}</tr></thead><tbody>`;
  t.rows.forEach((r, i) => {
    if (i > 0 && i === lunch) h += `<tr class="lunch"><td colspan="${days.length + 2}">🍱 Nghỉ trưa ${esc(t.rows[i - 1].e)} – ${esc(r.s)}</td></tr>`;
    const live = now !== null && toMin(r.s) <= now && now < toMin(r.e);
    h += `<tr><td class="p num">${i + 1}</td><td class="tm num">${esc(r.s)}<br>${esc(r.e)}</td>${days.map(d => {
      const v = String((r.d || {})[d] || '').trim(), col = d === hl ? ' col' : '';
      return v ? `<td class="sj sj${subjTint(v)}${col}${live && col ? ' now' : ''}">${esc(v)}</td>` : `<td class="no${col}"></td>`;
    }).join('')}</tr>`;
  });
  return h + `</tbody></table></div>`;
}
function tkbStats(t) {
  let periods = 0, inClass = 0, atSchool = 0;
  const count = {};
  for (const d of tkbDays(t)) {
    const info = schoolDay(t, d); if (!info) continue;
    atSchool += Math.max(0, toMin(info.end) - toMin(info.start));
    for (const x of info.list) { periods++; inClass += Math.max(0, toMin(x.e) - toMin(x.s)); count[x.subj] = (count[x.subj] || 0) + 1; }
  }
  return { periods, inClass, atSchool, subjects: Object.entries(count).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi')) };
}
// ---------- học thêm ----------
// Mỗi buổi học thêm là một mục riêng: { kid, day: 0..6, s, e, name }.
const lessonsList = () => Object.entries(S.lessons || {}).map(([id, l]) => ({ id, ...l, day: Number(l.day) }))
  .filter(l => S.kids[l.kid] && toMin(l.s) !== null && toMin(l.e) !== null)
  .sort((a, b) => WEEK_ORDER.indexOf(a.day) - WEEK_ORDER.indexOf(b.day) || toMin(a.s) - toMin(b.s) || (S.kids[a.kid].order ?? 0) - (S.kids[b.kid].order ?? 0));
const lessonsOf = kidId => lessonsList().filter(l => l.kid === kidId);
const lessonsOn = (kidId, wd) => lessonsOf(kidId).filter(l => l.day === wd);
const lessonMin = l => Math.max(0, toMin(l.e) - toMin(l.s));
const LESSON_ICONS = [[/bóng rổ/, '🏀'], [/bóng đá/, '⚽'], [/bơi/, '🏊'], [/nhảy|múa|dance/, '💃'], [/piano|đàn|nhạc/, '🎹'], [/vẽ|mĩ thuật|mỹ thuật/, '🎨'],
  [/võ|karate|taekwondo/, '🥋'], [/cờ/, '♟️'], [/nhật/, '🗾'], [/anh|english/, '🔤'], [/toán/, '➗'], [/việt|văn/, '📖']];
const lessonIcon = name => { const n = String(name).toLowerCase(); return (LESSON_ICONS.find(([re]) => re.test(n)) || [0, '📚'])[1]; };
const LESSON_NAMES = ['Tiếng Anh', 'Toán', 'Gia sư Toán', 'Gia sư Tiếng Việt', 'Bóng đá', 'Bóng rổ', 'Nhảy', 'Bơi', 'Piano', 'Vẽ', 'Võ', 'Cờ vua'];
// Đi lại: l.home = true (học ở nhà) | false (đi học bên ngoài) | không có (chưa ghi).
// l.go / l.back: ai đưa đi, ai đón về ("Bố", "Mẹ", "Grab", "Tự đi"...).
const WHO_NAMES = ['Bố', 'Mẹ', 'Ông bà', 'Grab', 'Tự đi'];
// Grab, taxi, tự đi... không phải một người trong nhà phải chạy xe.
const isRide = w => /grab|taxi|xe buýt|xe bus|tự đi|tự về|be\b|xanh/i.test(String(w || ''));
const whoIcon = w => /grab|taxi|be\b|xanh/i.test(w) ? '🚕' : /tự/i.test(w) ? '🚶' : /buýt|bus/i.test(w) ? '🚌' : '🚗';
function tripText(t) {
  const k = kidName(t.l.kid), w = String(t.who || '').trim(), at = t.l.at ? ` (${placeLow(t.l.at)})` : '';
  if (!w) return t.kind === 'go' ? `Chưa có người đưa ${k} đi ${t.l.name}` : `Chưa có người đón ${k} (${t.l.name})`;
  if (/^tự/i.test(w)) return t.kind === 'go' ? `${k} tự đi ${t.l.name}` : `${k} tự về`;
  if (isRide(w)) return t.kind === 'go' ? `${k} đi ${w} tới ${t.l.name}${at}` : `${k} về bằng ${w}`;
  return t.kind === 'go' ? `${w} đưa ${k} đi ${t.l.name}${at}` : `${w} đón ${k} (${t.l.name})`;
}
// Các chuyến đưa đón của những buổi học bên ngoài, xếp theo giờ.
function tripsOf(list) {
  const out = [];
  for (const l of list) if (l.home === false) {
    out.push({ t: toMin(l.s), kind: 'go', who: l.go, l });
    out.push({ t: toMin(l.e), kind: 'back', who: l.back, l });
  }
  return out.sort((a, b) => a.t - b.t || (a.kind === 'back' ? -1 : 1));
}
// Cảnh báo: buổi đi học chưa có người đưa/đón, hoặc một người có hai chuyến cách nhau dưới 20 phút.
function tripWarnings(trips) {
  const out = [];
  for (const t of trips) if (!String(t.who || '').trim()) out.push(tripText(t));
  const people = trips.filter(t => t.who && !isRide(t.who));
  people.forEach((a, i) => people.slice(i + 1).forEach(b => {
    if (a.l.id !== b.l.id && a.who.trim().toLowerCase() === b.who.trim().toLowerCase() && Math.abs(a.t - b.t) < 20)
      out.push(`${a.who} có 2 chuyến sát nhau: ${hm(a.t)} ${tripText(a).replace(a.who + ' ', '')} và ${hm(b.t)} ${tripText(b).replace(b.who + ' ', '')}`);
  }));
  return out;
}
const placeTxt = l => l.home === true ? `🏠 ${esc(placeName(l.at) || 'Ở nhà')}` : l.home === false
  ? `${l.at ? '📍 ' + esc(placeName(l.at)) + ' · ' : ''}${l.go ? whoIcon(l.go) + ' Đi: ' + esc(l.go) : '⚠️ Chưa có người đưa'} · ${l.back ? 'Về: ' + esc(l.back) : '⚠️ chưa có người đón'}` : (l.at ? '📍 ' + esc(placeName(l.at)) : '');
// ---------- các con ở đâu ----------
// stays: id = thứ ("0".."6"), { day: ban ngày ở đâu (bỏ trống = đi học / như buổi tối), night: tối ngủ ở đâu }.
const PLACE_NAMES = ['Nhà bố', '6th Element', 'Nhà ông bà'];
// Tên cũ được hiện bằng tên mới (dữ liệu cũ ghi "Nhà mẹ").
const PLACE_ALIAS = { 'nhà mẹ': '6th Element' };
const placeName = p => { const v = String(p || '').trim(); return PLACE_ALIAS[v.toLowerCase()] || v; };
// Viết thường chữ "nhà" ở giữa câu, giữ nguyên tên riêng ("6th Element").
const placeLow = p => placeName(p).replace(/^nhà(?=\s)/i, 'nhà');
const placeNames = () => [...new Set([...PLACE_NAMES, ...Object.values(S.stays || {}).flatMap(x => [x.day, x.night]), ...lessonsList().map(l => l.at)]
  .map(placeName).filter(Boolean))];
const stayOf = wd => { const x = (S.stays || {})[String(wd)]; return x && (x.day || x.night) ? x : null; };
const hasStays = () => [0, 1, 2, 3, 4, 5, 6].some(stayOf);
const shortPlace = p => placeName(p).replace(/^nhà\s+/i, '').replace(/^./, c => c.toUpperCase());
// Thông tin trong ngày: ban ngày, buổi tối, và có đổi nhà so với tối hôm trước không.
function stayInfo(wd) {
  const x = stayOf(wd); if (!x) return null;
  const prev = stayOf((wd + 6) % 7), night = placeName(x.night), day = placeName(x.day), from = placeName(prev?.night);
  const moved = !!(night && from && from.toLowerCase() !== night.toLowerCase());
  return { day, night, moved, from };
}
// Con đang ở đâu lúc này: tối (từ 17:00) ở chỗ ngủ đêm nay, ban ngày ở chỗ ghi ban ngày, nếu không ghi thì vẫn ở chỗ ngủ đêm qua.
function stayNow(wd) {
  const st = stayInfo(wd); if (!st) return null;
  const evening = nowMin() >= 17 * 60, here = evening ? st.night || st.day : st.day || st.from || st.night;
  return here ? { here, next: !evening && st.night && st.night.toLowerCase() !== here.toLowerCase() ? st.night : '' } : null;
}
// Hôm nay: "📍 Đang ở 6th Element · tối nay về nhà ông bà". Ngày khác: "📍 Ở 6th Element", ngày đổi nhà "🔁 Về nhà ông bà".
function stayLine(wd, isToday = false) {
  const st = stayInfo(wd); if (!st) return '';
  if (isToday) { const n = stayNow(wd); return n ? `📍 Đang ở ${placeLow(n.here)}${n.next ? ` · tối nay về ${placeLow(n.next)}` : ''}` : ''; }
  const where = st.night || st.day; if (!where) return '';
  return `${st.moved ? '🔁 Về' : '📍 Ở'} ${placeLow(where)}${st.day && st.night && st.day.toLowerCase() !== st.night.toLowerCase() ? ` (ban ngày ở ${placeLow(st.day)})` : ''}`;
}
function stayStrip() {
  const wd = today().getDay();
  return `<div class="stay-strip">${WEEK_ORDER.map(d => { const st = stayInfo(d);
    return `<div class="stay ${d === wd ? 'on' : ''} ${st?.moved ? 'moved' : ''}"><b>${WDS[d]}</b><span class="sd">${st?.day ? esc(shortPlace(st.day)) : ''}</span><span class="sn sj${st?.night ? subjTint(st.night) : ''} ${shortPlace(st?.night).length > 6 ? 'long' : ''}">${st?.night ? esc(shortPlace(st.night)) : '—'}</span></div>`; }).join('')}</div>`;
}
function stayForm() {
  const names = placeNames();
  openModal(`<h2>Các con ở đâu</h2><p class="muted" style="margin:-8px 0 0">Mỗi thứ trong tuần, ban ngày và buổi tối các con ở nhà nào. Ban ngày bỏ trống nếu con đi học bình thường.</p>
  <div class="stay-rows"><div></div><span class="lbl">Ban ngày</span><span class="lbl">Buổi tối</span>
  ${WEEK_ORDER.map(d => { const x = (S.stays || {})[String(d)] || {}; return `<b>${WDN(d)}</b>
    <input class="input" list="place-list" maxlength="24" data-sd="${d}" value="${esc(placeName(x.day))}" placeholder="Đi học" aria-label="${WDN(d)} ban ngày">
    <input class="input" list="place-list" maxlength="24" data-sn="${d}" value="${esc(placeName(x.night))}" placeholder="Chưa ghi" aria-label="${WDN(d)} buổi tối">`; }).join('')}</div>
  <datalist id="place-list">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
  <span class="muted small">Gõ vài chữ đầu để chọn: ${names.map(esc).join(', ')}.</span>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="stay-save">Lưu</button></div>`);
}

const lessonChips = list => list.map(l => `<span class="sj-chip sj${subjTint(l.name)}">${lessonIcon(l.name)} ${esc(l.s)} ${esc(l.name)}${l.home === true ? ` · ${esc(l.at ? placeLow(l.at) : 'ở nhà')}` : l.home === false && l.go ? ` · ${whoIcon(l.go)} ${esc(/^tự/i.test(l.go) ? 'tự đi' : isRide(l.go) ? 'đi ' + l.go : l.go + ' đưa')}` : ''}</span>`).join('');

// Dòng ngắn "hôm nay ở trường" cho màn Hôm nay và chế độ cho bé.
function schoolNow(k, d, isToday) {
  const t = tkbOf(k.id); if (!t) return null;
  const info = schoolOn(k.id, d);
  if (info && !(isToday && nowMin() >= toMin(info.end))) return { title: `Ở trường ${info.start} – ${info.end}`, subjects: info.subjects };
  if (!isToday) return null;
  const nx = nextSchool(t, d, k.id);
  return nx ? { title: `Soạn cặp cho ${nx.label === 'Ngày mai' ? 'ngày mai' : nx.label}`, subjects: nx.info.subjects, bag: true } : null;
}

// ---------- dòng thời gian trong ngày ----------
const SLOTS = [['sang', 'Buổi sáng', '🌅'], ['chieu', 'Buổi chiều', '☀️'], ['toi', 'Buổi tối', '🌙'], ['', 'Lúc nào cũng được', '📋']];
const slotAt = m => m < 12 * 60 ? 'sang' : m < 18 * 60 ? 'chieu' : 'toi';
const choreSlot = c => toMin(c.time) !== null ? slotAt(toMin(c.time)) : (c.slot || '');
// Ghép việc nhà, giờ ở trường và học thêm của một con trong ngày d, chia theo buổi.
function dayPlan(kidId, d) {
  const all = choresFor(kidId, d), extras = all.filter(isExtra);
  const items = all.filter(c => !isExtra(c)).map(c => ({ type: 'chore', c, t: toMin(c.time), slot: choreSlot(c) }));
  const t = tkbOf(kidId), info = t && schoolOn(kidId, d);
  if (info) {
    items.push({ type: 'mark', t: toMin(info.start), icon: '🏫', text: `Vào học (${info.list.length} tiết)` });
    items.push({ type: 'mark', t: toMin(info.end), icon: '🏫', text: 'Tan học' });
  }
  for (const l of lessonsOn(kidId, d.getDay())) items.push({ type: 'lesson', l, t: toMin(l.s) });
  for (const x of items) if (x.slot === undefined) x.slot = slotAt(x.t);
  const rank = x => x.t ?? 24 * 60 + (x.type === 'chore' && isFun(x.c) ? 1 : 0);
  const groups = SLOTS.map(([id, label, icon]) => ({ id, label, icon, items: items.filter(x => x.slot === id)
    .sort((a, b) => rank(a) - rank(b) || (a.c?.order ?? 0) - (b.c?.order ?? 0)) })).filter(g => g.items.length);
  // Việc thích làm mở khoá khi xong hết việc phải làm của buổi đó ("Lúc nào cũng được": của cả ngày).
  for (const g of groups) {
    const scope = skipOn(kidId, d) ? [] : (g.id ? g.items : items).filter(x => x.type === 'chore' && isMust(x.c));
    g.open = scope.every(x => isDone(d, kidId, x.c.id));
    g.left = scope.filter(x => !isDone(d, kidId, x.c.id)).length;
    for (const x of g.items) if (x.type === 'chore' && isFun(x.c)) x.locked = !g.open;
  }
  // Việc làm thêm (có tiền, không bắt buộc) xếp riêng ở cuối ngày.
  if (extras.length) groups.push({ id: 'them', extra: true, label: 'Việc làm thêm, làm là có tiền', icon: '💪', open: true, left: 0,
    items: extras.map(c => ({ type: 'chore', c, t: toMin(c.time), slot: 'them' })) });
  return groups;
}
// Con đang ở trường hay đang học thêm vào phút m của ngày d không (trả về tên, hoặc '').
function busyAt(kidId, d, m) {
  if (m === null) return '';
  const l = lessonsOn(kidId, d.getDay()).find(l => toMin(l.s) <= m && m < toMin(l.e));
  if (l) return `học ${l.name} (${l.s} – ${l.e})`;
  const info = schoolOn(kidId, d);
  return info && toMin(info.start) <= m && m < toMin(info.end) ? `ở trường (${info.start} – ${info.end})` : '';
}
function choreMeta(c, kidId, d, isToday) {
  const p = [isFun(c) ? '🎈 Việc thích làm' : `<b class="earn">+${money(choreVnd(c))}</b>`];
  if (toMin(c.time) !== null) p.push(`${c.by ? 'trước ' : ''}${esc(c.time)}`);
  if (Number(c.minutes)) p.push(`${Number(c.minutes)} phút`);
  const n = perWeekOf(c); if (n) p.push(`${weekCount(kidId, c, d)}/${n} lần tuần này`);
  if (c.shared) p.push('👨‍👩‍👧 việc chung');
  const v = variantOf(c, kidId, d); if (v) p.push(`hôm nay: <b>${esc(v)}</b>`);
  if (isToday && c.by && !isDone(d, kidId, c.id) && toMin(c.time) !== null && nowMin() > toMin(c.time)) p.push('<span class="late">⏰ quá giờ</span>');
  const busy = busyAt(kidId, d, toMin(c.time)); if (busy) p.push(`<span class="late">⚠️ lúc ${esc(c.time)} con đang ${esc(busy)}</span>`);
  return p.join(' · ');
}
const markRow = (x, big) => x.type === 'lesson'
  ? `<div class="${big ? 'big-mark' : 'item mark'}"><span class="ico">${lessonIcon(x.l.name)}</span><div class="txt"><div class="t"><span class="num">${esc(x.l.s)} – ${esc(x.l.e)}</span> ${esc(x.l.name)}</div>${placeTxt(x.l) ? `<div class="s">${placeTxt(x.l)}</div>` : ''}</div></div>`
  : `<div class="${big ? 'big-mark' : 'item mark'}"><span class="ico">${x.icon}</span><div class="txt"><div class="t"><span class="num">${hm(x.t)}</span> ${esc(x.text)}</div></div></div>`;

// ---------- rendering ----------
let raf = 0;
const render = () => { memo = {}; cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
function draw() {
  const navHtml = cls => NAV.map(n => `<a href="#${n.id}" class="${cls} ${UI.view === n.id ? 'on' : ''}" ${UI.view === n.id ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${n.svg}</svg><span>${n.label}</span></a>`).join('');
  $('#rail').innerHTML = brand() + navHtml('');
  $('#tabs').innerHTML = navHtml('tab');
  const body = !loaded ? loading() : ({ 'hom-nay': viewToday, 'lich-hoc': viewSchedule, 'tai-khoan': viewAccount, 'bang-gia': viewPrices, 'gia-dinh': viewFamily }[UI.view] || viewToday)();
  $('#app').innerHTML = topbar() + body;
  drawKidMode();
  if (UI.sheet) drawSheet();
  const on = $('#app .tkb th.on');
  if (on) { const w = on.closest('.tbl-wrap'); if (w.scrollWidth > w.clientWidth) w.scrollLeft = Math.max(0, on.offsetLeft - 112); }
}
const brand = () => `<div class="brand"><span class="brand-mark">${STAR}</span>Misa Misu</div>`;
function topbar() {
  let s;
  if (!store || !loaded) s = '<span class="sync wait"><i></i>Đang tải…</span>';
  else if (store.kind === 'local') s = '<span class="sync local"><i></i>Lưu trên máy này</span>';
  else if (stale || !navigator.onLine) s = '<span class="sync wait"><i></i>Đang offline, sẽ đồng bộ sau</span>';
  else s = '<span class="sync"><i></i>Đã đồng bộ</span>';
  return `<div class="topbar">${brand()}${s}</div>`;
}
const loading = () => `<div class="card empty"><div class="big">⏳</div><h2>Đang mở bảng việc nhà…</h2><p class="muted">Danh sách các con, việc nhà và phần thưởng sẽ hiện ở đây.</p></div>`;
function noKids() {
  return `<div class="card empty"><div class="big">👧🧒</div><h2>Bắt đầu với các con</h2>
  <p class="muted">Thêm tên và hình đại diện cho từng con, sau đó giao việc nhà cho các con. Nếu có file sao lưu, vào mục Gia đình để nhập.</p>
  <div class="row" style="justify-content:center;margin-top:10px"><button class="btn primary" data-act="kid-form">Thêm con</button><button class="btn ghost" data-act="seed-form">Nạp lịch gia đình</button></div></div>`;
}

// ---------- bảng tuần (lưới việc × ngày) ----------
const modeSeg = () => `<div class="seg modes"><label><input type="radio" name="tmode" value="day" ${UI.todayMode !== 'week' ? 'checked' : ''}><span>📋 Từng ngày</span></label><label><input type="radio" name="tmode" value="week" ${UI.todayMode === 'week' ? 'checked' : ''}><span>🗓️ Cả tuần</span></label></div>`;
const skipNote = (k, d) => { const e = skipEntry(k.id, d); return e ? `<div class="skip-note">🎟️ ${key(d) === key(today()) ? 'Hôm nay' : 'Ngày này'} ${esc(k.name)} dùng phiếu “Một ngày không làm việc nhà”: việc phải làm được miễn, làm thì vẫn có tiền.</div>` : ''; };
function viewWeekGrid() {
  const kids = kidsList(), t = today(), ws = UI.gridWs || weekStart(t), days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  let h = `<div class="head"><h1>Cả tuần</h1><p>Mỗi việc một dòng, mỗi ngày một cột. Bấm vào ô để đánh dấu đã làm hoặc bỏ dấu.</p></div>${modeSeg()}
  <div class="daynav"><button class="iconbtn" data-act="grid-week" data-n="-7" aria-label="Tuần trước"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>
    <b>Tuần ${dm(ws)} – ${dm(addDays(ws, 6))}</b>
    <button class="iconbtn" data-act="grid-week" data-n="7" aria-label="Tuần sau"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button>
    ${key(ws) === key(weekStart(t)) ? '' : '<button class="chip" style="border:0" data-act="grid-week" data-n="0">Tuần này</button>'}</div>
  <div class="row"><button class="btn primary" data-act="km-open" ${kids.length ? '' : 'disabled'}>Chế độ cho bé</button><button class="btn ghost" data-act="sheet-open" ${kids.length ? '' : 'disabled'}>In kế hoạch tuần</button></div>`;
  if (!kids.length) return h + noKids();
  const so = c => (isExtra(c) ? 1e6 : 0) + SLOTS.findIndex(x => x[0] === choreSlot(c)) * 10000 + (toMin(c.time) ?? 9999);
  for (const k of kids) {
    const cs = choresList().filter(c => (c.kids || []).includes(k.id) && !isFun(c)).sort((a, b) => so(a) - so(b) || (a.order ?? 0) - (b.order ?? 0));
    // Việc làm thêm chỉ hiện khi tuần này có làm, cho bảng gọn.
    const rows = cs.filter(c => isMust(c) || days.some(d => isDone(d, k.id, c.id)));
    const st = weekStats(k, ws), wk = earned(k.id, key(ws), key(addDays(ws, 6)));
    const cell = (c, d, ri) => {
      const on = isDone(d, k.id, c.id), sched = (c.days || []).includes(d.getDay()), fut = d > t, skip = isMust(c) && skipOn(k.id, d);
      const lbl = `${esc(c.name)}, ${WDN(d.getDay())} ${dm(d)}`;
      if (on) return `<td><button class="gc on" data-act="grid-tick" data-kid="${k.id}" data-chore="${c.id}" data-d="${key(d)}" aria-pressed="true" aria-label="Bỏ dấu: ${lbl}">✓</button></td>`;
      if (skip) return `<td><span class="gc skip" title="Dùng phiếu nghỉ">🎟️</span></td>`;
      if (fut) return `<td><span class="gc ${sched ? 'fut' : 'off'}"></span></td>`;
      return `<td><button class="gc ${sched ? '' : 'off'}" data-act="grid-tick" data-kid="${k.id}" data-chore="${c.id}" data-d="${key(d)}" aria-pressed="false" aria-label="Đánh dấu: ${lbl}"></button></td>`;
    };
    const count = c => {
      const n = days.filter(d => isDone(d, k.id, c.id)).length;
      if (isExtra(c)) return `${n} lần`;
      const exp = perWeekOf(c) || days.filter(d => (c.days || []).includes(d.getDay()) && !skipOn(k.id, d)).length;
      return `<span class="${n >= exp ? 'plus' : ''}">${Math.min(n, exp)}/${exp}</span>`;
    };
    const full = d => { const l = mustFor(k.id, d); return d <= t && l.length && l.every(c => isDone(d, k.id, c.id)); };
    h += `<section class="card"><div class="kid-head">${ava(k, 'sm')}<div class="kid-name" style="font-size:20px">${esc(k.name)}</div><span class="muted small" style="margin-left:auto;text-align:right">việc phải làm <b class="num">${st.done}/${st.possible}</b><br>tuần này kiếm <b class="num plus">${money(wk)}</b></span></div>
      ${rows.length ? `<div class="tbl-wrap"><table class="wgrid"><thead><tr><th>Việc</th>${days.map(d => `<th class="${key(d) === key(t) ? 'on' : ''}">${WDS[d.getDay()]}<br><span>${d.getDate()}</span></th>`).join('')}<th>Xong</th></tr></thead><tbody>
      ${rows.map((c, ri) => `${isExtra(c) && (ri === 0 || !isExtra(rows[ri - 1])) ? `<tr class="sep"><td colspan="9">💪 Việc làm thêm</td></tr>` : ''}<tr><td class="nm">${esc(c.icon || '')} ${esc(c.name)}${perWeekOf(c) ? ` <span class="muted">(${perWeekOf(c)} lần)</span>` : ''}</td>${days.map(d => cell(c, d, ri)).join('')}<td class="cnt num">${count(c)}</td></tr>`).join('')}
      <tr class="tot"><td class="nm">⭐ Đủ việc trong ngày</td>${days.map(d => `<td>${full(d) ? '⭐' : skipOn(k.id, d) ? '🎟️' : ''}</td>`).join('')}<td class="cnt num">${days.filter(full).length}</td></tr>
      </tbody></table></div>` : `<p class="muted" style="margin:8px 0 0">Chưa giao việc nào cho ${esc(k.name)}.</p>`}
      ${weekBonusOf(k) && st.possible ? `<div class="muted small" style="margin-top:8px">${st.done >= st.possible ? `🏆 Đủ cả tuần, được thưởng ${money(weekBonusOf(k))}.` : `Còn ${st.possible - st.done} việc phải làm nữa là đủ cả tuần, thưởng ${money(weekBonusOf(k))}.`}</div>` : ''}</section>`;
  }
  return h;
}

// Dải 7 ngày trong tuần: ✓ cả nhà làm đủ, ✗ còn thiếu, vòng tiến độ cho hôm nay.
function weekStrip(sel) {
  const t = today(), ws = weekStart(sel), kids = kidsList();
  const cells = Array.from({ length: 7 }, (_, i) => addDays(ws, i)).map(d => {
    let all = 0, done = 0, any = false;
    for (const k of kids) { const l = mustFor(k.id, d); all += l.length; done += l.filter(c => isDone(d, k.id, c.id)).length; if (l.length) any = true; }
    const isT = key(d) === key(t), pct = all ? Math.round(done / all * 100) : 0;
    const st = d > t ? 'fut' : !any ? 'rest' : done >= all ? 'ok' : isT ? 'now' : 'miss';
    const ic = { ok: '✓', miss: '✕', rest: '·', fut: '', now: '' }[st];
    const lbl = { ok: 'đủ việc', miss: 'còn thiếu việc', rest: 'không có việc', fut: 'chưa tới', now: `xong ${pct}%` }[st];
    return `<button class="wd ${st} ${isT ? 'today' : ''} ${key(d) === key(sel) ? 'on' : ''}" data-act="day-set" data-d="${key(d)}" aria-label="${WD[d.getDay()]} ${dm(d)}: ${lbl}" ${key(d) === key(sel) ? 'aria-current="date"' : ''}>
      <b class="num">${pad(d.getDate())}</b><i class="wd-s" ${st === 'now' ? `style="--p:${pct}%"` : ''}>${ic}</i><span>${WDS[d.getDay()]}</span></button>`;
  }).join('');
  return `<div class="wk">${cells}</div>`;
}
function viewToday() {
  if (UI.todayMode === 'week') return viewWeekGrid();
  const d = UI.date, t = today(), isT = key(d) === key(t), future = d > t;
  const label = `${WD[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}`;
  const kids = kidsList();
  let h = `<div class="head head-row"><div><h1>${isT ? 'Hôm nay' : future ? 'Sắp tới' : 'Ngày ' + dm(d)}</h1><p>${label}${isT ? '' : ' · <button class="linkbtn" data-act="day" data-n="0">Về hôm nay</button>'}</p></div>
    <div class="daynav">
      <button class="iconbtn" data-act="day" data-n="-7" aria-label="Tuần trước"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>
      <button class="iconbtn" data-act="day" data-n="7" aria-label="Tuần sau"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button>
    </div></div>
  ${kids.length ? weekStrip(d) : ''}${modeSeg()}
  <div class="row"><button class="btn primary" data-act="km-open" ${kids.length ? '' : 'disabled'}>Chế độ cho bé</button><button class="btn ghost" data-act="sheet-open" ${kids.length ? '' : 'disabled'}>In kế hoạch tuần</button></div>`;
  if (!kids.length) return h + noKids();
  if (future) h += `<div class="note">Đây là ngày chưa tới, các con chưa thể đóng dấu.</div>`;
  if (stayLine(d.getDay(), isT)) h += `<a class="stay-note ${stayInfo(d.getDay()).moved ? 'moved' : ''}" href="#lich-hoc" data-act="tkb-go" data-kid="all">${esc(stayLine(d.getDay(), isT))}</a>`;
  for (const k of kids) {
    const list = mustFor(k.id, d), plan = dayPlan(k.id, d);
    const n = list.filter(c => isDone(d, k.id, c.id)).length;
    const pct = list.length ? Math.round(n / list.length * 100) : 0;
    h += `<section class="card kid-card"><div class="kid-hero">${ava(k)}<div class="kid-hi"><div class="kid-name">${esc(k.name)}</div><div class="row" style="gap:6px">${streakChip(k)}${bdayChip(k, d)}</div></div><a href="#tai-khoan" class="acct-link" data-act="acct-go" data-kid="${k.id}">${moneyChip(k)}</a></div>`;
    const sc = schoolNow(k, d, isT);
    if (sc) h += `<a class="school-line" href="#lich-hoc" data-act="tkb-go" data-tab="tkb" data-kid="${k.id}"><b>${sc.bag ? '🎒' : '🏫'} ${esc(sc.title)}:</b> ${esc(sc.subjects.join(', '))}</a>`;
    h += eventLines(k) + skipNote(k, d);
    const ts = isT ? tasksSoon(k.id) : [];
    if (ts.length) h += `<div class="today-tasks"><a class="ag-h" href="#lich-hoc" data-act="tkb-go" data-tab="bai-tap" data-kid="${k.id}">📝 Bài cần nộp (${ts.length})</a><div class="list">${ts.map(t => taskRow(t, false)).join('')}</div></div>`;
    if (!plan.length) { h += `<p class="muted" style="margin:12px 0 0">Hôm nay ${esc(k.name)} không có việc nào. Nghỉ ngơi thôi!</p></section>`; continue; }
    if (list.length) h += progBox(n, list.length, n === list.length ? '🎉 Xong hết việc phải làm!' : `⭐ Việc phải làm · còn ${list.length - n} việc`);
    const cur = isT ? slotAt(nowMin()) : null;
    // Mỗi buổi là một khối nền trung tính, nhận ra nhờ tiêu đề; buổi đang diễn ra có viền đậm và nhãn "bây giờ".
    h += `<div class="slots">`;
    for (const g of plan) {
      if (g.extra) {
        const nd = g.items.filter(x => isDone(d, k.id, x.c.id)).length;
        h += `<details class="slot s-them extra-g" data-kid="${k.id}" ${nd || UI.extraOpen[k.id] ? 'open' : ''}><summary class="slot-h extra">${g.icon} ${g.label} <span class="slot-n">${g.items.length} việc${nd ? `, đã làm ${nd}` : ''}</span></summary><div class="list">`;
      } else {
        const mine = g.items.filter(x => x.type === 'chore' && !isFun(x.c)), nd = mine.filter(x => isDone(d, k.id, x.c.id)).length;
        h += `<section class="slot s-${g.id || 'any'} ${g.id && g.id === cur ? 'now' : ''}"><div class="slot-h">${g.icon} ${g.label}${g.id && g.id === cur ? '<span class="nowpill">bây giờ</span>' : ''}${mine.length ? `<span class="slot-n num">${nd}/${mine.length}</span>` : ''}</div><div class="list">`;
      }
      for (const x of g.items) {
        if (x.type !== 'chore') { h += markRow(x); continue; }
        const c = x.c, on = isDone(d, k.id, c.id), steps = (c.steps || []).filter(Boolean), mask = stepMask(d, k.id, c.id);
        const right = isFun(c) ? `<span class="fun-badge ${x.locked ? '' : 'open'}">${x.locked ? '🔒 Chưa mở' : '🎈 Được làm'}</span>`
          : `<button class="stamp ${on ? 'on' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" ${future ? 'disabled' : ''} aria-pressed="${on}" aria-label="${on ? 'Bỏ dấu' : 'Đóng dấu'}: ${esc(c.name)}">${STAR}</button>`;
        h += `<div class="item ${on ? 'done' : ''} ${isFun(c) ? 'fun' + (x.locked ? ' locked' : '') : ''}"><span class="ico">${esc(c.icon || '✅')}</span><div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${choreMeta(c, k.id, d, isT)}</div>
          ${steps.length && !isFun(c) ? `<div class="steps">${steps.map((st, i) => { const ok = on || (mask >> i) & 1; return `<button class="step ${ok ? 'on' : ''}" data-act="step" data-kid="${k.id}" data-chore="${c.id}" data-i="${i}" ${future ? 'disabled' : ''} aria-pressed="${!!ok}">${ok ? '☑' : '☐'} ${esc(st)}</button>`; }).join('')}</div>` : ''}</div>${right}</div>`;
      }
      h += g.extra ? `</div></details>` : `</div></section>`;
    }
    h += `</div></section>`;
  }
  return h;
}

const LEARN_TABS = [['sap-toi', '📅 Sắp tới'], ['bai-tap', '📝 Bài tập'], ['tkb', '🏫 Thời khoá biểu'], ['moc', '🚩 Mốc năm học'], ['hoc-them', '🚗 Học thêm']];
function viewSchedule() {
  const kids = kidsList();
  let h = `<div class="head"><h1>Học tập</h1><p>Lịch ở trường, bài tập, các đợt kiểm tra và học thêm của các con, xếp theo từng ngày.</p></div>`;
  if (!kids.length) return h + noKids();
  // Nhiều con thì mặc định xem cả nhà, để thấy ngay giờ nào cần đưa đón hai nơi.
  const all = kids.length > 1 && (UI.tkbKid === 'all' || !S.kids[UI.tkbKid]);
  const k = all ? null : kids.find(x => x.id === UI.tkbKid) || kids[0];
  const tab = LEARN_TABS.some(x => x[0] === UI.learn) ? UI.learn : 'sap-toi';
  if (kids.length > 1) h += `<div class="seg"><label><input type="radio" name="tkbkid" value="all" ${all ? 'checked' : ''}><span>👨‍👩‍👧 Cả nhà</span></label>${kids.map(x => `<label><input type="radio" name="tkbkid" value="${x.id}" ${x.id === k?.id ? 'checked' : ''}><span>${mini(x)} ${esc(x.name)}</span></label>`).join('')}</div>`;
  h += `<div class="tabbar" role="tablist">${LEARN_TABS.map(([v, l]) => `<button role="tab" aria-selected="${v === tab}" class="${v === tab ? 'on' : ''}" data-act="learn-tab" data-v="${v}">${l}${v === 'bai-tap' && openTasks(k?.id).length ? ` <i class="cnt num">${openTasks(k?.id).length}</i>` : ''}</button>`).join('')}</div>`;
  const ks = all ? kids : [k];
  if (tab === 'sap-toi') return h + viewAgenda(ks);
  if (tab === 'bai-tap') return h + tasksView(ks);
  if (tab === 'moc') return h + eventsCard(all ? null : k.id);
  if (tab === 'tkb') return h + ks.map(x => (all ? `<div class="sec-title">${mini(x)} ${esc(x.name)}</div>` : '') + kidSchedule(x, 'tkb')).join('');
  return h + (all ? familyWeek(kids) : kidSchedule(k, 'lessons'));
}

// ---------- bài tập ----------
// tasks: { kid, title, kind: bt|on|da, subj, due: "YYYY-MM-DD", notes, steps: [{ t, done }], done, doneAt }
const TASK_KINDS = [['bt', 'Bài tập về nhà', '📝'], ['on', 'Ôn kiểm tra', '📖'], ['da', 'Dự án, thuyết trình', '🧪']];
const tasksList = () => Object.entries(S.tasks || {}).map(([id, t]) => ({ id, ...t, steps: Array.isArray(t.steps) ? t.steps : [] }))
  .filter(t => S.kids[t.kid]).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || String(a.title).localeCompare(String(b.title), 'vi'));
const openTasks = kidId => tasksList().filter(t => !t.done && (!kidId || t.kid === kidId));
// Bài cần nhắc ở màn Hôm nay: quá hạn, hạn hôm nay hoặc ngày mai.
const tasksSoon = kidId => openTasks(kidId).filter(t => t.due && daysTo(t.due) <= 1);
// Ngày học tới có môn này (theo thời khoá biểu, bỏ qua ngày nghỉ).
function nextSubjectDay(kidId, subj, from = today()) {
  if (!tkbOf(kidId) || !subj) return null;
  for (let i = 1; i <= 31; i++) { const x = addDays(from, i), info = schoolOn(kidId, x); if (info && info.subjects.some(s => norm(s) === norm(subj))) return x; }
  return null;
}
function dueLabel(dk) {
  const n = daysTo(dk), d = parse(dk);
  if (n < 0) return `quá hạn ${-n} ngày`;
  if (n === 0) return 'hôm nay';
  if (n === 1) return 'ngày mai';
  return n < 7 ? `${WDN(d.getDay())} ${dm(d)}` : `${WDN(d.getDay())} ${dm(d)} (còn ${n} ngày)`;
}
const subjDot = s => s ? `<i class="dot sj${subjTint(s)}"></i>` : '';
function taskRow(t, showKid, big = false) {
  const nd = t.steps.filter(x => x.done).length, over = !t.done && t.due && daysTo(t.due) < 0, kind = TASK_KINDS.find(x => x[0] === t.kind) || TASK_KINDS[0];
  const meta = [t.subj ? `${subjDot(t.subj)}${esc(t.subj)}` : '', t.done ? `xong ${t.doneAt ? dm(parse(t.doneAt)) : ''}` : t.due ? `<span class="${over ? 'late' : ''}">${over ? '' : 'hạn '}${esc(dueLabel(t.due))}</span>` : 'chưa có hạn',
    t.steps.length ? `${nd}/${t.steps.length} bước` : '', showKid ? esc(kidName(t.kid)) : ''].filter(Boolean).join(' · ');
  const steps = !t.done && t.steps.length ? `<div class="steps">${t.steps.map((x, i) => `<button class="step ${x.done ? 'on' : ''}" data-act="task-step" data-id="${t.id}" data-i="${i}" aria-pressed="${!!x.done}">${x.done ? '☑' : '☐'} ${esc(x.t)}</button>`).join('')}</div>` : '';
  return `<div class="${big ? 'big-item task' : 'item task'} ${t.done ? 'done' : ''}"><button class="check ${t.done ? 'on' : ''}" data-act="task-done" data-id="${t.id}" aria-pressed="${!!t.done}" aria-label="${t.done ? 'Chưa xong' : 'Xong'}: ${esc(t.title)}">✓</button>
    <div class="txt"><div class="t">${kind[2]} ${esc(t.title)}</div><div class="s">${meta}</div>${t.notes && !big ? `<div class="s snip">${esc(String(t.notes).slice(0, 120))}</div>` : ''}${steps}</div>
    ${big ? '' : `<div class="acts"><button class="btn ghost sm" data-act="task-form" data-id="${t.id}">Sửa</button></div>`}</div>`;
}
function tasksView(ks) {
  const ids = ks.map(k => k.id), multi = ks.length > 1, tk = key(today());
  const mine = tasksList().filter(t => ids.includes(t.kid)), open = mine.filter(t => !t.done), done = mine.filter(t => t.done);
  let h = `<div class="row"><button class="btn primary" data-act="task-form" data-kid="${multi ? '' : ids[0]}">Thêm bài tập</button>
    <div class="seg"><label><input type="radio" name="tview" value="0" ${UI.taskDone ? '' : 'checked'}><span>Chưa xong <i class="cnt num">${open.length}</i></span></label><label><input type="radio" name="tview" value="1" ${UI.taskDone ? 'checked' : ''}><span>Đã xong</span></label></div></div>`;
  if (UI.taskDone) {
    if (!done.length) return h + `<p class="muted" style="margin:0">Bài tập làm xong sẽ được lưu ở đây.</p>`;
    const list = done.sort((a, b) => String(b.doneAt || '').localeCompare(String(a.doneAt || ''))).slice(0, UI.histAll ? 500 : 40);
    return h + `<section class="card"><div class="list">${list.map(t => taskRow(t, multi)).join('')}</div>${done.length > list.length ? `<div class="row" style="margin-top:8px"><button class="btn quiet sm" data-act="hist-all">Xem thêm ${done.length - list.length} bài</button></div>` : ''}</section>`;
  }
  if (!open.length) return h + `<section class="card empty"><div class="big">📝</div><h2>Không còn bài tập nào phải làm</h2><p class="muted">Ghi bài tập cô giao: môn gì, hạn nộp ngày nào, cần làm mấy bước. App xếp theo hạn nộp và nhắc ở màn Hôm nay.</p></section>`;
  const groups = [['Quá hạn', t => t.due && t.due < tk], ['Hôm nay', t => t.due === tk], ['Ngày mai', t => t.due && daysTo(t.due) === 1],
    ['Tuần này', t => t.due && daysTo(t.due) > 1 && t.due <= key(addDays(weekStart(today()), 6))], ['Sau đó', t => t.due && t.due > key(addDays(weekStart(today()), 6))], ['Chưa có hạn', t => !t.due]];
  // Tiến độ tuần này: bài có hạn trong tuần, đã xong / tổng.
  const ws = key(weekStart(today())), we = key(addDays(weekStart(today()), 6)), wk = mine.filter(t => t.due && t.due >= ws && t.due <= we), wd = wk.filter(t => t.done).length;
  if (wk.length) h += `<section class="card"><div class="muted small" style="font-weight:700;letter-spacing:.04em">BÀI TẬP TUẦN NÀY</div><div class="big-num num">${wd} / ${wk.length} bài đã xong</div><div class="bar ${wd === wk.length ? 'full' : ''}"><b style="width:${Math.round(wd / wk.length * 100)}%"></b></div></section>`;
  for (const [label, f] of groups) {
    const list = open.filter(f); if (!list.length) continue;
    h += `<div class="sec-title ${label === 'Quá hạn' ? 'late' : ''}">${label} <span class="muted small">${list.length} bài</span></div><section class="card"><div class="list">${list.map(t => taskRow(t, multi)).join('')}</div></section>`;
  }
  return h;
}
function taskForm(id, kidPre) {
  const t = id ? S.tasks[id] : null, kids = kidsList();
  const kid = t?.kid || (S.kids[kidPre] ? kidPre : S.kids[UI.tkbKid] ? UI.tkbKid : kids[0]?.id); if (!kid) return;
  const subs = [...new Set(kids.flatMap(k => tkbOf(k.id) ? tkbStats(tkbOf(k.id)).subjects.map(x => x[0]) : []))];
  const kind = t?.kind || 'bt';
  openModal(`<h2>${t ? 'Sửa bài tập' : 'Thêm bài tập'}</h2>
  ${kids.length > 1 ? `<div class="field"><span class="lbl">Con</span><div class="seg">${kids.map(k => `<label><input type="radio" name="tkid" value="${k.id}" ${k.id === kid ? 'checked' : ''}><span>${mini(k)} ${esc(k.name)}</span></label>`).join('')}</div></div>` : `<input type="hidden" name="tkid" value="${kid}">`}
  <div class="field"><label for="ttitle">Bài gì</label><input id="ttitle" class="input" maxlength="80" value="${esc(t?.title || '')}" placeholder="Ví dụ: Bài 3, 4 trang 45 vở bài tập"></div>
  <div class="field"><span class="lbl">Loại</span><div class="seg">${TASK_KINDS.map(([v, l, ic]) => `<label><input type="radio" name="tkind" value="${v}" ${v === kind ? 'checked' : ''}><span>${ic} ${l}</span></label>`).join('')}</div></div>
  <div class="field"><label for="tsubj">Môn</label><input id="tsubj" class="input" list="tsubj-list" maxlength="24" value="${esc(t?.subj || '')}" placeholder="Ví dụ: Toán">
    <datalist id="tsubj-list">${[...new Set([...subs, ...SUBJECTS])].map(x => `<option value="${esc(x)}">`).join('')}</datalist>
    ${subs.length ? `<div class="row">${subs.map(x => `<button class="btn quiet sm" data-act="task-subj" data-v="${esc(x)}">${subjDot(x)}${esc(x)}</button>`).join('')}</div><span class="muted small">Chọn môn thì hạn nộp tự đặt vào buổi học tới của môn đó.</span>` : ''}</div>
  <div class="field"><label for="tdue">Hạn nộp</label><input id="tdue" class="input num" type="date" value="${esc(t?.due || '')}">
    <div class="row"><button class="btn quiet sm" data-act="task-due" data-v="next">Buổi học tới của môn</button><button class="btn quiet sm" data-act="task-due" data-v="1">Ngày mai</button><button class="btn quiet sm" data-act="task-due" data-v="mon">Thứ Hai tới</button><button class="btn quiet sm" data-act="task-due" data-v="">Không có hạn</button></div></div>
  <div class="field"><label for="tsteps">Các bước (mỗi dòng một bước, không bắt buộc)</label><textarea id="tsteps" class="input" rows="3" placeholder="Đọc đề&#10;Làm nháp&#10;Chép vào vở">${esc((t?.steps || []).map(x => x.t).join('\n'))}</textarea></div>
  <div class="field"><label for="tnotes">Ghi chú</label><textarea id="tnotes" class="input" rows="3" maxlength="1000" placeholder="Cô dặn gì, cần mang gì...">${esc(t?.notes || '')}</textarea></div>
  <div class="foot">${t ? `<button class="btn danger left" data-act="task-del" data-id="${id}">Xoá</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="task-save" data-id="${id || ''}">Lưu</button></div>`);
}

// ---------- sắp tới (lịch dạng tuần) ----------
// Những gì có trong ngày d của một con: mốc, giờ ở trường, học thêm, bài phải nộp.
function dayAgenda(kidId, d) {
  const dk = key(d), isT = dk === key(today());
  return {
    events: eventsOf(kidId).filter(e => e.from <= dk && dk <= e.to),
    hol: holidayOn(kidId, d),
    school: schoolOn(kidId, d),
    lessons: lessonsOn(kidId, d.getDay()),
    tasks: tasksList().filter(t => t.kid === kidId && (t.due === dk || (isT && !t.done && t.due && t.due < dk))),
  };
}
function viewAgenda(ks) {
  const t = today(), sel = UI.agDate || t, ws = weekStart(sel), multi = ks.length > 1;
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const dots = d => {
    const a = ks.map(k => dayAgenda(k.id, d)), out = [];
    if (a.some(x => x.events.some(e => e.kind === 'exam'))) out.push('exam');
    else if (a.some(x => x.events.length)) out.push('ev');
    if (a.some(x => x.tasks.some(t => !t.done))) out.push('task');
    if (a.some(x => x.lessons.length)) out.push('lesson');
    return out.map(c => `<i class="ad ${c}"></i>`).join('');
  };
  let h = `<section class="card week-strip"><div class="ws-head"><button class="iconbtn" data-act="ag-week" data-n="-7" aria-label="Tuần trước"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>
    <b>Tháng ${sel.getMonth() + 1}, ${sel.getFullYear()}</b>${key(sel) === key(t) ? '' : '<button class="chip" style="border:0" data-act="ag-day" data-d="">Hôm nay</button>'}
    <button class="iconbtn" data-act="ag-week" data-n="7" aria-label="Tuần sau"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button></div>
    <div class="ws-days">${days.map(d => `<button class="ws-day ${key(d) === key(sel) ? 'on' : ''} ${key(d) === key(t) ? 'today' : ''}" data-act="ag-day" data-d="${key(d)}" aria-pressed="${key(d) === key(sel)}"><span>${WDS[d.getDay()]}</span><b class="num">${d.getDate()}</b><span class="ads">${dots(d)}</span></button>`).join('')}</div>
    <div class="ws-legend muted small"><span><i class="ad exam"></i>Kiểm tra</span><span><i class="ad ev"></i>Mốc</span><span><i class="ad task"></i>Bài phải nộp</span><span><i class="ad lesson"></i>Học thêm</span></div></section>`;
  const dd = key(sel) === key(t) ? 'Hôm nay' : key(sel) === key(addDays(t, 1)) ? 'Ngày mai' : key(sel) === key(addDays(t, -1)) ? 'Hôm qua' : '';
  h += `<div class="sec-title">${dd ? dd + ', ' : ''}${WD[sel.getDay()].toLowerCase().replace(/^./, c => c.toUpperCase())} ${dm(sel)}</div>`;
  for (const k of ks) {
    const a = dayAgenda(k.id, sel);
    let b = '';
    const part = (title, body) => body ? `<div class="ag-sec"><div class="ag-h">${title}</div>${body}</div>` : '';
    b += part('Kiểm tra và mốc', a.events.map(e => `<div class="item event"><span class="ico">${esc(e.icon || '📌')}</span><div class="txt"><div class="t">${esc(e.name)}</div><div class="s">${esc(eventRange(e))}</div></div></div>`).join(''));
    b += part('Ở trường', a.hol ? `<p class="muted small" style="margin:4px 0">Nghỉ: ${esc(a.hol.name)}</p>` : a.school ? `<div class="periods">${a.school.list.map(p => `<div class="period"><span class="num">${esc(p.s)}</span>${subjDot(p.subj)}<span>${esc(p.subj)}</span></div>`).join('')}</div>` : '');
    b += part('Học thêm', a.lessons.map(l => `<div class="period"><span class="num">${esc(l.s)}</span><i class="dot lesson"></i><span>${esc(l.name)}${l.at ? ` <span class="muted small">· ${esc(l.at)}</span>` : ''}</span></div>`).join(''));
    b += part('Bài phải nộp', a.tasks.length ? `<div class="list">${a.tasks.map(x => taskRow(x, false)).join('')}</div>` : '');
    h += `<section class="card">${multi ? `<div class="kid-head">${ava(k, 'sm')}<div class="kid-name" style="font-size:19px">${esc(k.name)}</div></div>` : ''}${b || `<p class="muted" style="margin:${multi ? '8px' : '0'} 0 0">Ngày này ${esc(k.name)} không có lịch học, bài tập hay kiểm tra nào.</p>`}</section>`;
  }
  return h;
}

// part: 'tkb' (ở trường và số giờ mỗi tuần) hoặc 'lessons' (học thêm).
function kidSchedule(k, part) {
  const t = tkbOf(k.id), td = today(), wd = td.getDay(), now = nowMin();
  let h = '';
  if (part === 'lessons') return (kidsList().length === 1 ? staysCard(wd) : '') + kidLessons(k);
  if (!t && lessonsOf(k.id).length) {
    h += `<section class="card"><div class="kid-head"><span class="ico" style="font-size:28px">🏫</span><div class="txt" style="flex:1"><b>Lịch ở trường</b><div class="muted small">Chưa có thời khoá biểu ở trường của ${esc(k.name)}.</div></div><button class="btn ghost sm" data-act="tkb-form" data-kid="${k.id}">Tạo</button></div></section>`;
  } else if (!t) {
    h += `<section class="card empty" style="padding:20px 18px"><div class="big">🏫</div><h2>Chưa có thời khoá biểu ở trường của ${esc(k.name)}</h2>
    <p class="muted">Nhập các tiết học một lần. App sẽ cho biết hôm nay con học những môn gì, và tối nay cần soạn cặp cho môn nào.</p>
    <div class="row" style="justify-content:center;margin-top:10px"><button class="btn primary" data-act="tkb-form" data-kid="${k.id}">Tạo thời khoá biểu</button></div></section>`;
  } else {
    const info = schoolOn(k.id, td), hol = holidayOn(k.id, td);
    let line;
    if (info && now < toMin(info.end)) {
      const cur = info.list.find(x => toMin(x.s) <= now && now < toMin(x.e));
      line = `<div><b>Hôm nay ${esc(k.name)} học ${info.list.length} tiết</b>, ${esc(info.start)} – ${esc(info.end)}.${cur ? ` Đang học: <b>${esc(cur.subj)}</b> (tiết ${cur.i + 1}).` : ''}</div>`;
    } else {
      const nx = nextSchool(t, td, k.id);
      line = nx ? `<div><b>${info ? 'Hôm nay đã tan học.' : hol ? `Hôm nay nghỉ: ${esc(hol.name)}.` : 'Hôm nay không đi học.'}</b> ${esc(nx.label)} có:</div><div class="sj-list">${subjChips(nx.info.subjects)}</div>` : '<div>Chưa có tiết nào trong thời khoá biểu.</div>';
    }
    h += `<section class="card tkb-card"><div class="kid-head">${ava(k, 'sm')}<div><div class="kid-name" style="font-size:21px">${esc(t.cls || k.name)}</div>${t.year ? `<div class="muted small">Năm học ${esc(t.year)}</div>` : ''}</div>
      <div class="acts" style="margin-left:auto"><button class="btn ghost sm" data-act="tkb-form" data-kid="${k.id}">Sửa</button><button class="btn ghost sm" data-act="tkb-print" data-kid="${k.id}">In</button></div></div>
      <div class="tkb-today">${line}</div>
      ${tkbTable(t, info ? wd : null)}</section>`;
  }
  const ls = lessonsOf(k.id);
  return h + weekTotals(k, t, ls);
}
function kidLessons(k) {
  const wd = today().getDay(), ls = lessonsOf(k.id);
  let h = `<div class="sec-title">Học thêm</div><div class="row"><button class="btn primary" data-act="lesson-form" data-kid="${k.id}">Thêm buổi học thêm</button></div>`;
  if (ls.length) {
    h += `<section class="card"><div class="list">${WEEK_ORDER.filter(d => ls.some(l => l.day === d)).map(d =>
      `<div class="day-sep ${d === wd ? 'on' : ''}">${WDN(d)}${d === wd ? ' · hôm nay' : ''}</div>${ls.filter(l => l.day === d).map(l => lessonItem(l)).join('')}`).join('')}</div></section>`;
  } else h += `<p class="muted" style="margin:0">Chưa có buổi học thêm nào. Ví dụ: Tiếng Anh, Thứ 2 từ 17:30 đến 19:30.</p>`;
  return h;
}
function weekTotals(k, t, ls) {
  let h = '';
  const st = t ? tkbStats(t) : { periods: 0, inClass: 0, atSchool: 0, subjects: [] };
  const lm = ls.reduce((a, l) => a + lessonMin(l), 0);
  if (st.periods || ls.length) {
    h += `<div class="sec-title">Mỗi tuần của ${esc(k.name)}</div><div class="tiles">
      ${st.periods ? `<div class="tile"><span class="muted small">Ở trường (${st.periods} tiết)</span><span class="amt num">${durTxt(st.atSchool)}</span></div>` : ''}
      ${ls.length ? `<div class="tile"><span class="muted small">Học thêm (${ls.length} buổi)</span><span class="amt num">${durTxt(lm)}</span></div>` : ''}
      ${st.periods && ls.length ? `<div class="tile"><span class="muted small">Tổng cộng</span><span class="amt num">${durTxt(st.atSchool + lm)}</span></div>` : ''}
    </div>`;
    if (st.periods) h += `<section class="card"><h2 style="font-size:19px">Số tiết mỗi môn ở trường</h2><div class="sj-list">${st.subjects.map(([s, n]) => `<span class="sj-chip sj${subjTint(s)}">${esc(s)} <b class="num">${n}</b></span>`).join('')}</div></section>`;
  }
  return h;
}

function staysCard(wd) {
  return hasStays()
    ? `<section class="card"><div class="kid-head"><h2 style="font-size:19px;flex:1">Các con ở đâu</h2><button class="btn ghost sm" data-act="stay-form">Sửa</button></div>${stayStrip()}<div class="muted small" style="margin-top:4px">Dòng trên: ban ngày (nếu không đi học). Ô màu: buổi tối ngủ ở đâu. Viền đậm: ngày đổi nhà.</div>${stayLine(wd, true) ? `<div class="muted small" style="margin-top:8px">Hôm nay: ${esc(stayLine(wd, true).replace(/^\S+\s/, ''))}</div>` : ''}</section>`
    : `<section class="card"><div class="kid-head"><span style="font-size:26px">🏠</span><div class="txt" style="flex:1"><b>Các con ở đâu</b><div class="muted small">Ghi ngày nào các con ở nhà bố, 6th Element hay nhà ông bà.</div></div><button class="btn ghost sm" data-act="stay-form">Ghi lịch</button></div></section>`;
}
// Cả nhà: lịch học thêm của các con theo từng ngày, kèm lịch đưa đón và cảnh báo.
function familyWeek(kids) {
  const wd = today().getDay(), all = lessonsList();
  let h = staysCard(wd) + `<div class="sec-title">Học thêm</div>`;
  h += `<div class="row"><button class="btn primary" data-act="lesson-form">Thêm buổi học thêm</button></div>`;
  if (!all.length) return h + `<section class="card empty"><div class="big">📚</div><h2>Chưa có lịch học thêm</h2><p class="muted">Thêm các buổi học thêm của từng con, ghi học ở nhà hay đi học và ai đưa đón. App sẽ xếp lịch đưa đón theo từng ngày.</p></section>`;
  const days = WEEK_ORDER.filter(d => all.some(l => l.day === d));
  h += `<div class="tiles">${kids.map(k => { const ls = all.filter(l => l.kid === k.id); return `<div class="tile"><span class="who">${ava(k, 'sm')}${esc(k.name)}</span><span class="amt num">${ls.length ? durTxt(ls.reduce((a, l) => a + lessonMin(l), 0)) : '—'}</span><span class="muted small">${ls.length} buổi học thêm mỗi tuần${ls.some(l => l.home === true) ? `, ${ls.filter(l => l.home === true).length} buổi ở nhà` : ''}</span></div>`; }).join('')}</div>`;
  // Đếm chuyến đưa đón mỗi tuần theo người / phương tiện.
  const trips = tripsOf(all), count = {};
  for (const t of trips) if (t.who) { const w = /^tự/i.test(t.who) ? 'Tự đi' : t.who.trim(); count[w] = (count[w] || 0) + 1; }
  const warnDays = days.filter(d => tripWarnings(tripsOf(all.filter(l => l.day === d))).length);
  if (trips.length) h += `<div class="note">🚗 <b>Đưa đón mỗi tuần:</b> ${Object.entries(count).sort((a, b) => b[1] - a[1]).map(([w, n]) => `${esc(w)} ${n} chuyến`).join(' · ') || 'chưa ghi ai đưa đón'}.${warnDays.length ? ` <b>Cần xem lại:</b> ${warnDays.map(WDN).join(', ')}.` : ''}</div>`;
  h += `<section class="card"><div class="list">${days.map(d => {
    const dl = all.filter(l => l.day === d), tr = tripsOf(dl), warn = tripWarnings(tr);
    const sl = stayLine(d);
    return `<div class="day-sep ${d === wd ? 'on' : ''}">${WDN(d)}${d === wd ? ' · hôm nay' : ''}${sl ? `<span class="stay-chip ${stayInfo(d).moved ? 'moved' : ''}">${esc(sl)}</span>` : ''}</div>${warn.map(c => `<div class="clash">⚠️ ${esc(c)}</div>`).join('')}${dl.map(l => lessonItem(l, true)).join('')}
      ${tr.some(t => t.who) ? `<div class="trips"><b>Đưa đón</b>${tr.filter(t => t.who).map(t => `<div><span class="num">${hm(t.t)}</span> ${whoIcon(t.who)} ${esc(tripText(t))}</div>`).join('')}</div>` : ''}`;
  }).join('')}</div></section>`;
  return h;
}
function lessonItem(l, who = false) {
  const k = S.kids[l.kid] ? { id: l.kid, ...S.kids[l.kid] } : null;
  return `<div class="item">${who && k ? ava(k, 'sm') : `<span class="ico">${lessonIcon(l.name)}</span>`}<div class="txt"><div class="t">${who && k ? `${esc(k.name)} · ` : ''}${esc(l.name)}</div><div class="s num">${esc(l.s)} – ${esc(l.e)} · ${durTxt(lessonMin(l))}</div>${placeTxt(l) ? `<div class="s">${placeTxt(l)}</div>` : ''}</div>
    <div class="acts"><button class="btn ghost sm" data-act="lesson-form" data-id="${l.id}">Sửa</button></div></div>`;
}

// ---------- tài khoản ----------
const LEDGER_KIND = {
  bonus: ['Thưởng', '⭐'], penalty: ['Phạt', '⚠️'], fee: ['Phí sử dụng', '📱'], spend: ['Chi tiêu', '💸'],
  reward: ['Đổi quà', '🎁'], week: ['Thưởng đủ tuần', '🏆'], chores: ['Việc nhà', '🧹'], adjust: ['Khớp số dư', '🏦'],
};
const ACCT_KINDS = [['penalty', '⚠️ Phạt'], ['fee', '📱 Phí sử dụng'], ['bonus', '⭐ Thưởng thêm'], ['spend', '💸 Chi tiêu']];
const priceTag = r => priceKind(r) === 'penalty' ? (r.all ? 'Mất hết tiền' : '−' + money(priceVnd(r)))
  : priceKind(r) === 'fee' ? money(priceVnd(r)) + '/giờ' : money(priceVnd(r));
// Lịch sử tài khoản của một con: sổ tài khoản, thưởng đủ tuần và tiền việc nhà gộp theo ngày.
function statement(kidId) {
  const rows = Object.entries(S.ledger).filter(([, l]) => l.kid === kidId).map(([id, l]) => ({ id, ...l, vnd: ledgerVnd(l), legacy: l.amount == null }));
  for (const w of weekBonuses(kidId)) {
    const end = addDays(w.ws, 6); end.setHours(23, 59);
    rows.push({ kind: 'week', vnd: w.amount, note: `Làm đủ việc phải làm tuần ${dm(w.ws)} – ${dm(addDays(w.ws, 6))}`, at: end.toISOString() });
  }
  for (const dk of Object.keys(S.done)) {
    const v = earned(kidId, dk, dk); if (!v) continue;
    const names = Object.entries(S.done[dk][kidId] || {}).filter(([cid, x]) => !cid.includes('~') && doneVnd(x) > 0).map(([cid]) => S.chores[cid]?.name).filter(Boolean);
    const end = parse(dk); end.setHours(23, 58);
    rows.push({ kind: 'chores', vnd: v, note: `Ngày ${dm(parse(dk))}: ${names.join(', ') || 'việc nhà'}`, at: end.toISOString() });
  }
  return rows.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
function viewAccount() {
  const kids = kidsList(), t = today(), ws = weekStart(t);
  let h = `<div class="head"><h1>Tài khoản</h1><p>Tiền tiêu vặt của các con. Làm việc nhà được cộng tiền; bị phạt, dùng điện thoại hay xem tivi thì trừ tiền.</p></div>`;
  if (!kids.length) return h + noKids();
  const ak = S.kids[UI.acctKid] ? UI.acctKid : kids[0].id, kind = ACCT_KINDS.some(x => x[0] === UI.acctKind) ? UI.acctKind : 'penalty';
  h += `<div class="tiles">${kids.map(k => {
    const st = weekStats(k, ws), wk = earned(k.id, key(ws), key(addDays(ws, 6))), wb = weekBonusOf(k), b = balance(k.id);
    const wbTxt = wb && st.possible ? (st.done >= st.possible ? `🏆 Đủ cả tuần, được thưởng ${money(wb)}` : `Đủ việc cả tuần thưởng ${money(wb)}`) : '';
    return `<button class="tile acct ${k.id === ak ? 'on' : ''}" data-act="acct-kid" data-kid="${k.id}"><span class="who">${ava(k, 'sm')}${esc(k.name)}</span>
      <span class="bal num ${b < 0 ? 'neg' : ''}">${money(b)}</span>
      <span class="muted small">Tuần này kiếm được <b class="num">${money(wk)}</b> · việc phải làm <span class="num">${st.done}/${st.possible}</span></span>
      ${wbTxt ? `<span class="muted small">${wbTxt}</span>` : ''}</button>`;
  }).join('')}</div>
  <div class="row"><button class="btn ghost sm" data-act="bal-form">🏦 Khớp số dư với tài khoản ngân hàng</button></div>`;

  const kidName1 = esc(kidName(ak));
  h += `<section class="card acct-form"><h2>Ghi vào tài khoản</h2>
    ${kids.length > 1 ? `<div class="field"><span class="lbl">Con</span><div class="seg">${kids.map(k => `<label><input type="radio" name="akid" value="${k.id}" ${k.id === ak ? 'checked' : ''}><span>${mini(k)} ${esc(k.name)}</span></label>`).join('')}</div></div>` : ''}
    <div class="seg">${ACCT_KINDS.map(([v, l]) => `<label><input type="radio" name="akind" value="${v}" ${v === kind ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  const presets = list => `<div class="presets">${list.map(r => `<button class="preset ${priceKind(r)}" data-act="acct-preset" data-id="${r.id}"><span class="ico">${esc(r.icon || '•')}</span><span class="t">${esc(r.name)}</span>${r.note ? `<span class="muted small">${esc(r.note)}</span>` : ''}<b class="num">${priceTag(r)}</b></button>`).join('')}</div>`;
  const custom = (label, btn, ph) => `<div class="row2"><div class="field"><label for="aamt">${label}</label><input id="aamt" class="input num" type="number" min="0" step="1000" inputmode="numeric" placeholder="Ví dụ: 10000"></div>
    <div class="field"><label for="anote">Lý do</label><input id="anote" class="input" maxlength="80" placeholder="${ph}"></div></div>
    <div class="row"><button class="btn ${kind === 'bonus' ? 'primary' : 'danger'}" data-act="acct-custom">${btn}</button></div>`;
  if (kind === 'penalty') {
    const ps = pricesList('penalty');
    h += ps.length ? `<p class="muted small" style="margin:0">Bấm vào lỗi để trừ tiền của ${kidName1}. Bấm nhầm thì Huỷ trong lịch sử.</p>${presets(ps)}` : `<p class="muted small" style="margin:0">Chưa có mục phạt nào. Thêm ở trang <a href="#bang-gia">Bảng giá</a>.</p>`;
    h += `<details class="adv"><summary>Phạt số tiền khác</summary>${custom('Số tiền trừ (đồng)', 'Trừ tiền', 'Ví dụ: Làm vỡ cốc')}</details>`;
  } else if (kind === 'fee') {
    const ps = pricesList('fee');
    h += `<div class="field"><label for="ahours">Đã dùng bao lâu (giờ)</label><div class="stepper"><button class="iconbtn" data-act="num-step" data-t="ahours" data-n="-0.5" data-min="0.5" aria-label="Bớt nửa giờ">−</button><input id="ahours" class="input num" type="number" min="0.5" step="0.5" value="1" inputmode="decimal"><button class="iconbtn" data-act="num-step" data-t="ahours" data-n="0.5" data-min="0.5" aria-label="Thêm nửa giờ">+</button></div>
      <span class="muted small">Nửa giờ là 0,5. Tiền trừ = giá mỗi giờ × số giờ.</span></div>`;
    h += ps.length ? presets(ps) : `<p class="muted small" style="margin:0">Chưa có mục phí sử dụng nào. Thêm ở trang <a href="#bang-gia">Bảng giá</a>.</p>`;
  } else if (kind === 'bonus') {
    h += `<p class="muted small" style="margin:0">Tiền việc nhà và thưởng đủ tuần được cộng tự động. Ở đây ghi các khoản thưởng thêm khác.</p>${custom('Số tiền thưởng (đồng)', 'Thưởng tiền', 'Ví dụ: Được điểm 10, giúp bà nấu cơm')}`;
  } else {
    const gs = pricesList('gift');
    h += `<p class="muted small" style="margin:0">Con tiêu tiền trong tài khoản: đổi phiếu thưởng, mua quà hoặc rút tiền mặt.</p>`;
    if (gs.some(r => r.skip)) h += `<div class="field"><label for="askip">Phiếu nghỉ việc nhà dùng cho ngày</label><input id="askip" class="input num" type="date" value="${key(t)}" min="${key(t)}"></div>`;
    if (gs.length) h += presets(gs);
    h += custom('Số tiền chi (đồng)', 'Ghi chi tiêu', 'Ví dụ: Rút tiền mặt, mua truyện');
  }
  h += `</section>`;

  h += goalsCard(ak);
  const rows = statement(ak), shown = rows.slice(0, UI.histAll ? 300 : 30);
  h += `<section class="card hist"><h2>Lịch sử của ${kidName1}</h2>`;
  if (!rows.length) h += `<p class="muted" style="margin:8px 0 0">Mỗi việc nhà được tiền, mỗi lần thưởng, phạt, phí sử dụng hay chi tiêu sẽ được ghi ở đây.</p>`;
  else h += `<div class="list" style="margin-top:6px">${shown.map(l => {
    const plus = l.vnd > 0, dt = l.at ? new Date(l.at) : null, [kt, ki] = LEDGER_KIND[l.kind] || [plus ? 'Thưởng' : 'Trừ tiền', plus ? '⭐' : '⚠️'];
    const time = dt && l.id ? ` · ${dm(dt)} ${pad(dt.getHours())}:${pad(dt.getMinutes())}` : '';
    return `<div class="item"><span class="ico">${esc(l.kind === 'chores' || l.kind === 'week' ? ki : l.icon || ki)}</span><div class="txt"><div class="t">${kt}</div><div class="s">${esc(l.note || '')}${time}${l.legacy ? ` · quy đổi từ ${Math.abs(Number(l.delta) || 0)} sao` : ''}</div></div>
    <div class="acts"><span class="delta num ${plus ? 'plus' : 'minus'}">${signed(l.vnd)}</span>${l.id ? `<button class="btn ghost sm" data-act="ledger-undo" data-id="${l.id}">Huỷ</button>` : ''}</div></div>`;
  }).join('')}</div>${rows.length > shown.length ? `<div class="row" style="margin-top:8px"><button class="btn quiet sm" data-act="hist-all">Xem thêm ${rows.length - shown.length} dòng</button></div>` : ''}`;
  return h + `</section>`;
}

// Khớp số dư: bố mẹ gõ số tiền thật của từng con, app ghi một khoản "Khớp số dư" bằng phần chênh lệch.
function balForm() {
  openModal(`<h2>Khớp số dư</h2><p class="muted" style="margin:-8px 0 0">Gõ số tiền thật đang có của từng con (ví dụ theo tài khoản ngân hàng). App ghi một khoản điều chỉnh bằng phần chênh lệch, lịch sử cũ giữ nguyên. Bỏ trống nếu không đổi.</p>
  ${kidsList().map(k => `<div class="field"><label for="bal-${k.id}">${mini(k)} ${esc(k.name)} <span class="muted small">· trong app: ${money(balance(k.id))}</span></label>
    <input id="bal-${k.id}" class="input num" type="number" step="1" inputmode="numeric" data-bal="${k.id}" placeholder="Ví dụ: ${Math.max(0, balance(k.id))}"></div>`).join('')}
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="bal-save">Lưu số dư</button></div>`);
}

// ---------- mục tiêu tiết kiệm ----------
// goals: { kid, name, icon, price, order, done, doneAt }. Tiền trong tài khoản được chia cho các mục tiêu
// theo thứ tự ưu tiên: mục tiêu đầu tiên đầy rồi mới sang mục tiếp theo.
const GOAL_ICONS = ['🚲', '🛴', '🎮', '📚', '🧸', '🎨', '⚽', '🎧', '👟', '🎒', '🧩', '🏊', '🎁', '✈️', '🐶', '💻'];
const goalsOf = (kidId, done = false) => Object.entries(S.goals || {}).map(([id, g]) => ({ id, ...g, price: Math.max(0, Number(g.price) || 0) }))
  .filter(g => g.kid === kidId && !!g.done === done).sort((a, b) => done ? String(b.doneAt).localeCompare(String(a.doneAt)) : (a.order ?? 0) - (b.order ?? 0));
function goalProgress(kidId) {
  let left = Math.max(0, balance(kidId));
  return goalsOf(kidId).map(g => { const have = Math.min(g.price, left); left -= have; return { ...g, have, need: g.price - have }; });
}
// Trung bình mỗi tuần kiếm được (việc nhà + thưởng đủ tuần), tính trên tối đa 4 tuần trước.
function weeklyRate(kidId) {
  return memoize('rate' + kidId, () => {
    const ws = weekStart(today()), k = S.kids[kidId] || {};
    const first = Object.keys(S.done).filter(dk => S.done[dk]?.[kidId]).sort()[0] || k.since;
    const start = first ? weekStart(parse(first)) : ws, bonus = new Set(weekBonuses(kidId).map(w => key(w.ws)));
    let s = 0, n = 0;
    for (let i = 1; i <= 4; i++) {
      const w = addDays(ws, -7 * i); if (w < start) break;
      s += earned(kidId, key(w), key(addDays(w, 6))) + (bonus.has(key(w)) ? weekBonusOf(k) : 0); n++;
    }
    if (!n) { const d = (today() - ws) / 864e5 + 1; return Math.round(earned(kidId, key(ws), key(today())) * 7 / d); }
    return Math.round(s / n);
  });
}
function earnPlan(kidId, need) {
  if (need <= 0) return 'Đủ tiền rồi! 🎉';
  const rate = weeklyRate(kidId), parts = [];
  if (rate > 0) { const w = Math.ceil(need / rate); parts.push(`khoảng ${w} tuần nữa nếu mỗi tuần kiếm ${money(rate)} như gần đây`); }
  const top = choresList().filter(c => isExtra(c) && (c.kids || []).includes(kidId) && choreVnd(c)).sort((a, b) => choreVnd(b) - choreVnd(a))[0];
  if (top) parts.push(`hoặc làm thêm ${Math.ceil(need / choreVnd(top))} lần “${top.name}”`);
  return `Còn thiếu ${money(need)}${parts.length ? ': ' + parts.join(', ') : ''}.`;
}
// Đồng xu: mỗi xu một mệnh giá, chọn sao cho không quá 40 xu. Tô màu những xu đã để dành được.
function coinUnit(price) { for (const u of [5000, 10000, 20000, 50000, 100000, 200000, 500000]) if (price / u <= 40) return u; return 1000000; }
function coins(g, big = false) {
  const u = coinUnit(g.price), n = Math.ceil(g.price / u), on = Math.floor(g.have / u);
  return `<div class="coins ${big ? 'big' : ''}" aria-label="Đã để dành ${on} trên ${n} xu, mỗi xu ${money(u)}">${Array.from({ length: n }, (_, i) => `<i class="${i < on ? 'on' : ''}"></i>`).join('')}</div>
    <div class="muted small">Mỗi xu là ${money(u)}. Đã tô ${on}/${n} xu.</div>`;
}
function goalsCard(kidId) {
  const gs = goalProgress(kidId), done = goalsOf(kidId, true), name = esc(kidName(kidId));
  let h = `<div class="sec-title">Mục tiêu tiết kiệm của ${name}</div><div class="row"><button class="btn primary" data-act="goal-form" data-kid="${kidId}">Thêm mục tiêu</button></div>`;
  if (!gs.length) h += `<p class="muted" style="margin:0">Con muốn để dành mua gì? Ví dụ: xe đạp 500.000đ. App chia số tiền đang có cho từng mục tiêu theo thứ tự ưu tiên và tính xem còn bao lâu nữa.</p>`;
  gs.forEach((g, i) => {
    const pct = g.price ? Math.round(g.have / g.price * 100) : 0;
    h += `<section class="card goal"><div class="kid-head"><span class="goal-ico">${esc(g.icon || '🎁')}</span><div class="txt" style="flex:1"><div class="muted small">${i === 0 ? 'Mục tiêu số 1' : `Ưu tiên ${i + 1}`}</div><div class="t" style="font-weight:700;font-size:18px">${esc(g.name)}</div></div>
      <span class="amt num">${money(g.price)}</span></div>
      <div class="prog"><div class="bar ${g.need ? '' : 'full'}"><b style="width:${pct}%"></b></div><span class="num">${money(g.have)} · ${pct}%</span></div>
      ${coins(g)}
      <p class="small" style="margin:8px 0 0">${esc(earnPlan(kidId, g.need))}</p>
      <div class="row" style="margin-top:10px">${!g.need ? `<button class="btn primary sm" data-act="goal-buy" data-id="${g.id}">Mua ${esc(g.name)}</button>` : ''}${i > 0 ? `<button class="btn quiet sm" data-act="goal-up" data-id="${g.id}">↑ Ưu tiên hơn</button>` : ''}<button class="btn ghost sm" data-act="goal-form" data-id="${g.id}">Sửa</button></div></section>`;
  });
  if (done.length) h += `<details class="adv"><summary>Đã đạt (${done.length})</summary><div class="list">${done.map(g => `<div class="item"><span class="ico">${esc(g.icon || '🎁')}</span><div class="txt"><div class="t">${esc(g.name)}</div><div class="s">${money(g.price)}${g.doneAt ? ` · mua ngày ${dm(parse(g.doneAt))}` : ''}</div></div><span class="badge ok">Đã đạt 🎉</span></div>`).join('')}</div></details>`;
  return h;
}
function goalForm(id, kidPre) {
  const g = id ? S.goals[id] : null, kids = kidsList();
  const kid = g?.kid || (S.kids[kidPre] ? kidPre : kids[0]?.id); if (!kid) return;
  openModal(`<h2>${g ? 'Sửa mục tiêu' : 'Thêm mục tiêu tiết kiệm'}</h2>
  ${kids.length > 1 ? `<div class="field"><span class="lbl">Của con</span><div class="seg">${kids.map(k => `<label><input type="radio" name="gkid" value="${k.id}" ${k.id === kid ? 'checked' : ''}><span>${mini(k)} ${esc(k.name)}</span></label>`).join('')}</div></div>` : `<input type="hidden" name="gkid" value="${kid}">`}
  <div class="field"><label for="gname">Con muốn để dành mua gì</label><input id="gname" class="input" maxlength="40" value="${esc(g?.name || '')}" placeholder="Ví dụ: Xe đạp mới"></div>
  <div class="field"><span class="lbl">Biểu tượng</span>${pickGrid('gico', GOAL_ICONS, g?.icon)}</div>
  <div class="field"><label for="gprice">Giá (đồng)</label><div class="stepper"><button class="iconbtn" data-act="num-step" data-t="gprice" data-n="-50000" data-min="0" aria-label="Bớt 50.000đ">−</button><input id="gprice" class="input num" type="number" min="0" step="1000" inputmode="numeric" value="${g ? Number(g.price) || 0 : 200000}"><button class="iconbtn" data-act="num-step" data-t="gprice" data-n="50000" data-min="0" aria-label="Thêm 50.000đ">+</button></div></div>
  <div class="foot">${g ? `<button class="btn danger left" data-act="goal-del" data-id="${id}">Xoá</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="goal-save" data-id="${id || ''}">Lưu</button></div>`);
}
function printCoupons() {
  const gs = pricesList('gift');
  printHtml(`<div class="coupon-sheet"><h1>Phiếu thưởng</h1><div class="cs-sub">Cắt ra, con dùng tiền trong tài khoản để đổi</div>
    <div class="cs-grid">${gs.map((r, i) => `<div class="coupon c${i % 3}"><span class="c-ico">${esc(r.icon || '🎁')}</span><div><div class="c-t">${esc(r.name)}</div>${r.note ? `<div class="c-n">${esc(r.note)}</div>` : ''}<div class="c-p">${money(priceVnd(r))}</div></div></div>`).join('')}</div></div>`);
}

// ---------- bảng giá ----------
const norm = v => String(v || '').trim().toLowerCase();
function missingSamples() {
  const cn = new Set(Object.values(S.chores).map(c => norm(c.name))), pn = new Set(Object.values(S.rewards).map(r => norm(r.name)));
  return { chores: SAMPLE_CHORES.filter(c => ![c.name, ...(c.also || [])].some(n => cn.has(norm(n)))), prices: SAMPLE_PRICES.filter(r => !pn.has(norm(r.name))) };
}
function addSamples(kidIds) {
  const m = missingSamples(); let order = Object.keys(S.chores).length;
  m.chores.forEach(({ also, ...c }) => put('chores', uid(), { ...c, kids: kidIds, order: order++ }));
  m.prices.forEach(r => put('rewards', uid(), r));
  return m.chores.length + m.prices.length;
}
function viewPrices() {
  const kids = kidsList(), chores = choresList().filter(c => !isFun(c));
  let h = `<div class="head"><h1>Bảng giá</h1><p>Mỗi việc được bao nhiêu tiền, lỗi nào bị phạt bao nhiêu, dùng điện thoại hay xem tivi mất bao nhiêu. Bố mẹ thêm, sửa, xoá được hết.</p></div>
  <div class="row"><button class="btn primary" data-act="chore-form" ${kids.length ? '' : 'disabled'}>Thêm việc có tiền</button><button class="btn primary" data-act="price-form">Thêm mục phạt, phí, quà</button><button class="btn ghost" data-act="prices-print">In bảng giá</button><button class="btn ghost" data-act="coupons-print" ${pricesList('gift').length ? '' : 'disabled'}>In phiếu thưởng</button></div>`;
  const miss = missingSamples(), n = miss.chores.length + miss.prices.length;
  if (n && kids.length) h += `<div class="note">Có ${n} mục trong bảng mẫu (tiền tiêu vặt, nhiệm vụ tuần, checklist trước khi ngủ, phiếu thưởng) chưa có ở đây${miss.chores.length ? ` (${miss.chores.length} việc, ${miss.prices.length} mục phạt, phí và phiếu thưởng)` : ''}. <button class="btn quiet sm" data-act="seed-prices">Thêm vào</button></div>`;
  const choreRow = c => `<div class="item"><span class="ico">${esc(c.icon || '✅')}</span><div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${esc((c.kids || []).map(kidName).join(', ') || 'chưa giao cho ai')} · ${daysLabel(c.days)}</div></div>
    <span class="delta num">+${money(choreVnd(c))}</span><div class="acts"><button class="btn ghost sm" data-act="chore-form" data-id="${c.id}">Sửa</button></div></div>`;
  const must = chores.filter(isMust), extra = chores.filter(isExtra);
  h += `<div class="sec-title">⭐ Thưởng: việc phải làm</div>`;
  h += `<section class="card"><div class="list">${must.map(choreRow).join('') || '<p class="muted small" style="margin:0">Chưa có việc phải làm nào.</p>'}
    ${kids.map(k => `<div class="item"><span class="ico">🏆</span><div class="txt"><div class="t">Làm đủ việc phải làm cả tuần${kids.length > 1 ? ` · ${esc(k.name)}` : ''}</div><div class="s">Tự cộng vào tài khoản khi xong hết việc phải làm từ Thứ Hai đến Chủ nhật</div></div>
      <span class="delta num">${weekBonusOf(k) ? '+' + money(weekBonusOf(k)) : '—'}</span><div class="acts"><button class="btn ghost sm" data-act="kid-form" data-id="${k.id}">Sửa</button></div></div>`).join('')}</div></section>`;
  h += `<div class="sec-title">💪 Thưởng: việc làm thêm</div><section class="card">${extra.length ? `<div class="list">${extra.map(choreRow).join('')}</div>` : '<p class="muted small" style="margin:0">Việc không bắt buộc, làm lúc nào được tiền lúc đó. Ví dụ: rửa bát, đổ rác.</p>'}</section>`;
  for (const [kind, label, icon] of PRICE_KINDS) {
    const list = pricesList(kind);
    h += `<div class="sec-title">${icon} ${label}</div><section class="card">`;
    h += list.length ? `<div class="list">${list.map(r => `<div class="item"><span class="ico">${esc(r.icon || icon)}</span><div class="txt"><div class="t">${esc(r.name)}</div>${r.all ? '<div class="s">Trừ hết số tiền đang có trong tài khoản</div>' : ''}</div>
      <span class="delta num">${priceTag(r)}</span><div class="acts"><button class="btn ghost sm" data-act="price-form" data-id="${r.id}">Sửa</button></div></div>`).join('')}</div>`
      : `<p class="muted small" style="margin:0">Chưa có mục nào. <button class="btn quiet sm" data-act="price-form" data-kind="${kind}">Thêm</button></p>`;
    h += `</section>`;
  }
  return h;
}
function printPrices() {
  const chores = choresList().filter(c => !isFun(c)), kids = kidsList();
  const cell = (icon, name, val, cls = '') => `<div class="pp-i"><span>${esc(icon)} ${esc(name)}:</span> <b class="${cls}">${esc(val)}</b></div>`;
  const wb = [...new Set(kids.map(weekBonusOf))].filter(Boolean);
  const sec = (title, items) => items.length ? `<h2>${title}</h2><div class="pp-grid">${items.join('')}</div>` : '';
  printHtml(`<div class="price-poster"><h1>Tiền tiêu vặt của ${esc(kids.map(k => k.name).join(', ') || 'các con')}</h1>
    ${sec('Thưởng', chores.map(c => cell(c.icon, c.name, money(choreVnd(c)))))}
    ${wb.length ? `<div class="pp-line">🏆 Làm đủ các việc phải làm cả một tuần: thưởng thêm <b>${wb.map(money).join(' / ')}</b></div>` : ''}
    ${sec('Phạt', pricesList('penalty').map(r => cell(r.icon, r.name, r.all ? 'mất hết tiền' : 'trừ ' + money(priceVnd(r)), 'minus')))}
    ${sec('Phí sử dụng', pricesList('fee').map(r => cell(r.icon, r.name, money(priceVnd(r)) + '/giờ', 'minus')))}
    ${sec('Đổi quà', pricesList('gift').map(r => cell(r.icon, r.name, money(priceVnd(r)))))}</div>`);
}

const inviteLink = () => location.origin + location.pathname + '?gd=' + encodeURIComponent(family);

function viewFamily() {
  const kids = kidsList(), chores = choresList();
  let h = `<div class="head"><h1>Gia đình</h1><p>Cài đặt một lần: các con, việc nhà, sao lưu. Tiền thưởng, phạt và phí sử dụng nằm ở trang <a href="#bang-gia">Bảng giá</a>.</p></div>
  <div class="sec-title">Các con</div><div class="row"><button class="btn primary" data-act="kid-form">Thêm con</button></div>`;
  h += kids.length ? `<section class="card"><div class="list">${kids.map(k => `<div class="item">${ava(k, 'sm')}<div class="txt"><div class="t">${esc(k.name)}</div><div class="s">${ageOf(k) !== null ? `${ageOf(k)} tuổi (sinh ${dm(parse(k.birthday))}/${parse(k.birthday).getFullYear()}) · ` : ''}${modeLabel(k)}</div></div><div class="acts"><button class="btn ghost sm" data-act="kid-form" data-id="${k.id}">Sửa</button></div></div>`).join('')}</div></section>`
    : `<p class="muted" style="margin:0">Chưa có con nào.</p>`;
  h += `<div class="sec-title">Việc nhà</div><div class="row"><button class="btn primary" data-act="chore-form" ${kids.length ? '' : 'disabled'}>Thêm việc</button><button class="btn ghost" data-act="sheet-open" ${kids.length ? '' : 'disabled'}>In kế hoạch tuần</button></div>`;
  if (chores.length) h += `<section class="card"><div class="list">${chores.map(c => `<div class="item"><span class="ico">${esc(c.icon || '✅')}</span><div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${choreSummary(c)}</div></div><div class="acts"><button class="btn ghost sm" data-act="chore-form" data-id="${c.id}">Sửa</button></div></div>`).join('')}</div></section>`;
  else if (kids.length) h += `<section class="card"><p class="muted" style="margin:0 0 10px">Chưa có việc nào. Bắt đầu nhanh với bảng mẫu: ${SAMPLE_CHORES.length} việc có tiền, ${SAMPLE_PRICES.length} mục phạt và phí sử dụng. Sửa lại sau cũng được.</p><button class="btn quiet" data-act="seed">Dùng việc nhà mẫu</button></section>`;
  else h += `<p class="muted" style="margin:0">Chưa có việc nào. Thêm con trước rồi giao việc.</p>`;

  h += `<div class="sec-title">Chia sẻ và sao lưu</div><section class="card" style="display:flex;flex-direction:column;gap:14px">`;
  if (store?.kind === 'firebase') {
    h += `<div class="field"><label for="invite">Link mời người nhà</label>
      <div class="copyrow"><input id="invite" class="input" readonly value="${esc(inviteLink())}"><button class="btn primary sm" data-act="copy-invite">Sao chép</button></div>
      <span class="muted small">Gửi link này cho bố/mẹ hoặc mở trên máy tính bảng của con. Ai có link đều xem và sửa được bảng của nhà mình, nên chỉ gửi cho người trong nhà.</span></div>`;
  } else {
    h += `<div class="note">Dữ liệu đang lưu trên trình duyệt của máy này. Muốn đồng bộ giữa điện thoại của bố, mẹ và máy của con, hãy bật Firebase theo hướng dẫn trong README của repo.</div>`;
  }
  if (getSeedMem()) h += `<div class="note">🔐 Máy này đã nhớ mật khẩu lịch gia đình. Mỗi khi lịch lưu sẵn có bản mới, app tự nạp lúc mở. <button class="btn quiet sm" data-act="seed-forget">Quên mật khẩu</button></div>`;
  h += `<div class="row"><button class="btn ${getSeedMem() ? 'ghost' : 'primary'}" data-act="seed-form">Nạp lịch gia đình</button><button class="btn ghost" data-act="export">Tải bản sao lưu</button><label class="btn ghost file-btn">Nhập từ file sao lưu<input type="file" id="import-file" accept=".json,application/json"></label>
    ${store?.kind === 'firebase' ? '<button class="btn quiet" data-act="leave">Đổi sang gia đình khác</button>' : ''}</div></section>`;
  return h;
}

// ---------- kid mode ----------
function drawKidMode() {
  const el = $('#km');
  el.hidden = !UI.km.on;
  if (!UI.km.on) { el.innerHTML = ''; return; }
  const kids = kidsList(), t = today();
  const hold = `<button class="hold" data-hold="1"><span>Giữ để thoát (bố mẹ)</span></button>`;
  const k = UI.km.kid && S.kids[UI.km.kid] ? kids.find(x => x.id === UI.km.kid) : null;
  if (!k) {
    el.innerHTML = `<div class="wrap"><div class="km-top">${brand()}${hold}</div><div class="head" style="text-align:center"><h1>Ai đang làm việc nhà?</h1><p>Chạm vào tên của con</p></div>
    <div class="who-grid">${kids.map(k => `<button class="who-btn" data-act="km-kid" data-kid="${k.id}">${ava(k)}<b>${esc(k.name)}</b>${moneyChip(k)}</button>`).join('')}</div></div>`;
    return;
  }
  const list = mustFor(k.id, t), n = list.filter(c => isDone(t, k.id, c.id)).length, plan = dayPlan(k.id, t), cur = slotAt(nowMin());
  const sc = schoolNow(k, t, true);
  const kst = stayNow(t.getDay());
  const home = kst ? `<div class="km-school km-home ${kst.next ? 'moved' : ''}"><div class="t">📍 Con đang ở ${esc(placeLow(kst.here))}</div>${kst.next ? `<div class="muted">Tối nay con về ${esc(placeLow(kst.next))}.</div>` : ''}</div>` : '';
  const kts = tasksSoon(k.id), g1 = goalProgress(k.id)[0];
  const goal = g1 ? `<div class="km-goal"><div class="t">${esc(g1.icon || '🎁')} Con đang để dành mua <b>${esc(g1.name)}</b></div>${coins(g1, true)}<div class="muted">${g1.need ? `Còn thiếu ${money(g1.need)}` : 'Đủ tiền rồi! Nhờ bố mẹ mua cho con nhé 🎉'}</div></div>` : '';
  const school = skipNote(k, t) + goal + home + eventLines(k, 'km-event') + (kts.length ? `<div class="km-slot">📝 Bài cần nộp</div>${kts.map(t => taskRow(t, false, true)).join('')}` : '') + (sc ? `<div class="km-school"><div class="t">${sc.bag ? '🎒' : '🏫'} ${esc(sc.title)}</div><div class="sj-list">${subjChips(sc.subjects)}</div></div>` : '');
  const bigChore = (x, g) => {
    const c = x.c, on = isDone(t, k.id, c.id), steps = (c.steps || []).filter(Boolean), mask = stepMask(t, k.id, c.id);
    const sub = `<span class="s">${choreMeta(c, k.id, t, true)}</span>`;
    if (isFun(c)) return `<div class="big-item fun ${x.locked ? 'locked' : 'open'}"><span class="ico">${esc(c.icon || '🎈')}</span><span><span class="t">${esc(c.name)}</span><br>${x.locked ? `<span class="s">Xong ${g.left} việc phải làm${g.id ? ' của ' + g.label.toLowerCase() : ''} là được làm việc này!</span>` : '<span class="s">Mở khoá rồi, con được làm việc này!</span>'}</span><span class="lockic">${x.locked ? '🔒' : '🎈'}</span></div>`;
    if (!steps.length) return `<button class="big-item ${on ? 'done' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" data-km="1" aria-pressed="${on}"><span class="ico">${esc(c.icon || '✅')}</span><span><span class="t">${esc(c.name)}</span><br>${sub}</span><span class="stamp ${on ? 'on' : ''}">${STAR}</span></button>`;
    return `<div class="big-item has-steps ${on ? 'done' : ''}"><div class="big-top"><span class="ico">${esc(c.icon || '✅')}</span><span><span class="t">${esc(c.name)}</span><br>${sub}</span>
      <button class="stamp ${on ? 'on' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" data-km="1" aria-pressed="${on}" aria-label="${on ? 'Bỏ dấu' : 'Xong hết'}: ${esc(c.name)}">${STAR}</button></div>
      <div class="big-steps">${steps.map((st, i) => { const ok = on || (mask >> i) & 1; return `<button class="step ${ok ? 'on' : ''}" data-act="step" data-kid="${k.id}" data-chore="${c.id}" data-i="${i}" data-km="1" aria-pressed="${!!ok}">${ok ? '✅' : '⬜'} ${esc(st)}</button>`; }).join('')}</div></div>`;
  };
  const timeline = plan.map(g => `<div class="km-slot ${g.id === cur ? 'now' : ''} ${g.extra ? 'extra' : ''}">${g.icon} ${g.label}${g.id === cur ? '<span class="nowpill">bây giờ</span>' : ''}</div>`
    + g.items.map(x => x.type === 'chore' ? bigChore(x, g) : markRow(x, true)).join('')).join('');
  const stk = streakOf(k.id), best = bestStreak(k.id), left = list.length - n;
  const bubble = isBirthday(k, t) ? `Chúc mừng sinh nhật ${esc(k.name)}! 🎂` : !list.length ? `Chào ${esc(k.name)}! Hôm nay thảnh thơi nhé!` : left ? `Chào ${esc(k.name)}! Cùng làm việc nào!` : `${esc(k.name)} giỏi quá! 🎉`;
  el.innerHTML = `<div class="wrap"><div class="km-top"><button class="btn quiet" data-act="km-kid" data-kid="">← Đổi bạn</button>${hold}</div>
  <div class="km-hero" style="--tint:${tintOf(k)}"><div class="km-bubble">${bubble}</div>${ava(k)}<div class="km-date">${WD[t.getDay()]}, ${t.getDate()} tháng ${t.getMonth() + 1}</div></div>
  ${list.length ? `<div class="card km-prog">${progBox(n, list.length, left ? `⭐ Hôm nay của ${esc(k.name)} · còn ${left} việc` : '🏆 Xong hết việc hôm nay!')}</div>` : ''}
  <div class="km-stats"><div class="km-stat"><span class="hex">💰</span><div><b class="num ${balance(k.id) < 0 ? 'minus' : ''}">${money(balance(k.id))}</b><span>Tài khoản</span></div></div>
    <div class="km-stat"><span class="hex fire">🔥</span><div><b class="num">${stk} ngày</b><span>${stk ? 'liên tiếp' : 'Làm đủ hôm nay để bắt đầu'}${best > stk ? ` · dài nhất ${best}` : ''}</span></div></div></div>
  ${school}
  ${list.length && n === list.length ? `<div class="cheer">Giỏi quá! Hôm nay con làm xong hết rồi 🎉</div>` : ''}
  <div class="big-list">${list.length || plan.length ? timeline
    : `<div class="card empty"><div class="big">🎈</div><h2>${school ? 'Hôm nay con không có việc nhà nào.' : 'Hôm nay con được nghỉ!'}</h2></div>`}</div></div>`;
}

// ---------- kế hoạch tuần (in ra, mỗi con một trang) ----------
const planWs = () => UI.planNext ? addDays(weekStart(today()), 7) : weekStart(today());
const daysShort = days => { const s = daysLabel(days); return s === 'mỗi ngày' ? '' : ` (${s})`; };
function weekPlan(k) {
  const ws = planWs(), days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const so = c => (toMin(c.time) ?? 9999) + (c.order ?? 0) / 1000;
  const mine = choresList().filter(c => (c.kids || []).includes(k.id) && !isFun(c));
  const must = mine.filter(isMust), extra = mine.filter(isExtra);
  const cols = SLOTS.map(([id, label, icon]) => ({ label, icon, list: must.filter(c => choreSlot(c) === id).sort((a, b) => so(a) - so(b)) })).filter(x => x.list.length);
  const item = c => `<li><span class="bx"></span>${esc(c.icon || '')} ${esc(c.name)}<span class="sm">${toMin(c.time) !== null ? ` ${c.by ? 'trước ' : ''}${esc(c.time)}` : ''}${perWeekOf(c) ? ` · ${perWeekOf(c)} lần/tuần` : esc(daysShort(c.days))}</span>${(c.steps || []).length ? `<div class="sm">${c.steps.map(esc).join(' · ')}</div>` : ''}</li>`;
  const sched = d => {
    const a = dayAgenda(k.id, d), p = [];
    for (const e of a.events) p.push(`${esc(e.icon || '📌')} ${esc(e.name)}`);
    if (a.hol) p.push('Nghỉ học');
    else if (a.school) p.push(`🏫 ${esc(a.school.start)} – ${esc(a.school.end)}`);
    for (const l of a.lessons) p.push(`${lessonIcon(l.name)} ${esc(l.s)} ${esc(l.name)}`);
    for (const t of tasksList().filter(t => t.kid === k.id && t.due === key(d) && !t.done)) p.push(`📝 Nộp: ${esc(t.subj ? t.subj + ' – ' : '')}${esc(t.title)}`);
    return p.map(x => `<div>${x}</div>`).join('');
  };
  const g = goalProgress(k.id)[0];
  return `<section class="wp"><div class="wp-title"><div class="wp-name">Kế hoạch tuần của ${esc(k.name)} ${mini(k)}</div><div class="wp-sub">Tuần ${dmy(ws)} – ${dmy(addDays(ws, 6))}</div></div>
    <div class="wp-cols">${cols.map((c, i) => `<div class="wp-col c${i}"><div class="wp-h">${c.icon} ${esc(c.label)}</div><ul>${c.list.map(item).join('')}</ul></div>`).join('') || '<p>Chưa giao việc nào.</p>'}</div>
    <div class="wp-mid"><div><div class="wp-h2">Việc mỗi ngày</div><table class="wp-grid"><thead><tr><th></th>${days.map(d => `<th>${WDS[d.getDay()]}<br><span>${d.getDate()}</span></th>`).join('')}</tr></thead><tbody>
      ${must.map((c, i) => `<tr><td>${esc(c.name)}</td>${days.map(d => (c.days || []).includes(d.getDay()) ? `<td><span class="bx t${i % 6}"></span></td>` : '<td class="off"></td>').join('')}</tr>`).join('')}</tbody></table></div>
      <div><div class="wp-h2">Lịch tuần</div><div class="wp-sched">${days.map(d => `<div class="wp-day"><b>${WDS[d.getDay()]}</b><div>${sched(d) || '<span class="sm">—</span>'}</div></div>`).join('')}</div></div></div>
    <div class="wp-bot">${extra.length ? `<div><div class="wp-h2">💪 Việc làm thêm có tiền</div><div class="wp-extra">${extra.map(c => `<span>${esc(c.icon || '')} ${esc(c.name)} <b>${money(choreVnd(c))}</b></span>`).join('')}</div></div>` : ''}
      ${g ? `<div><div class="wp-h2">${esc(g.icon || '🎁')} Để dành mua ${esc(g.name)} (${money(g.price)})</div><div class="sm">Tô một xu mỗi khi để dành được ${money(coinUnit(g.price))}</div>${coins(g).replace(/<div class="muted small">.*<\/div>/, '')}</div>` : ''}
      <div><div class="wp-h2">Ghi chú</div><div class="wp-lines"><i></i><i></i><i></i></div></div></div>
  </section>`;
}
function drawSheet() {
  openModal(`<h2>Kế hoạch tuần</h2><p class="muted" style="margin:-8px 0 0">Mỗi con một trang: việc theo buổi sáng, chiều, tối; ô đánh dấu từng ngày; lịch học thêm, kiểm tra, bài phải nộp; mục tiêu tiết kiệm.</p>
  <div class="seg"><label><input type="radio" name="planw" value="0" ${UI.planNext ? '' : 'checked'}><span>Tuần này (${dm(weekStart(today()))})</span></label><label><input type="radio" name="planw" value="1" ${UI.planNext ? 'checked' : ''}><span>Tuần sau (${dm(addDays(weekStart(today()), 7))})</span></label></div>
  <div class="wp-preview">${kidsList().map(weekPlan).join('')}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Đóng</button><button class="btn primary" data-act="print">In ${kidsList().length > 1 ? `${kidsList().length} trang` : 'kế hoạch'}</button></div>`, true, true);
}
function printSheet() { printHtml(`<div class="wp-print">${kidsList().map(weekPlan).join('')}</div>`); }
function printTkb(kidId) {
  const k = S.kids[kidId], t = tkbOf(kidId); if (!k || !t) return;
  const st = tkbStats(t);
  printHtml(`<h1 style="font-family:var(--display);margin:0;text-align:center;font-size:34px">Thời khoá biểu</h1>
    <div style="text-align:center;font-size:18px;margin-bottom:12px">${mini(k)} ${esc(k.name)}${t.cls ? ' · ' + esc(t.cls) : ''}${t.year ? ' · Năm học ' + esc(t.year) : ''}</div>
    ${tkbTable(t)}
    ${st.periods ? `<div style="margin-top:10px;font-size:13px">Mỗi tuần ${st.periods} tiết, ngồi trong lớp ${durTxt(st.inClass)}, ở trường ${durTxt(st.atSchool)}.</div>` : ''}
    ${lessonsOf(kidId).length ? `<h2 style="font-family:var(--display);margin:14px 0 6px;font-size:20px">Học thêm</h2><div class="print-lessons">${WEEK_ORDER.filter(d => lessonsOn(kidId, d).length).map(d => `<div><b>${WDN(d)}</b>${lessonsOn(kidId, d).map(l => `<div>${lessonIcon(l.name)} ${esc(l.s)} – ${esc(l.e)} ${esc(l.name)}</div>`).join('')}</div>`).join('')}</div>` : ''}`, 'landscape');
}
function printHtml(html, cls = '') {
  const pa = $('#print-area');
  pa.className = cls; pa.innerHTML = html;
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  window.print();
  setTimeout(done, 1500);
}

// ---------- modal ----------
function openModal(html, wide, keep) {
  const m = $('#modal');
  // keep: vẽ lại form đang mở (ví dụ đổi ngày), giữ nguyên vị trí cuộn và không nhảy con trỏ.
  const top = keep && !m.hidden ? m.querySelector('.dialog')?.scrollTop || 0 : 0;
  m.innerHTML = `<div class="dialog ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  m.hidden = false;
  if (keep) { m.querySelector('.dialog').scrollTop = top; return; }
  const f = m.querySelector('input:not([type=radio]):not([type=checkbox]),button');
  if (f && !wide) f.focus();
}
function closeModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; UI.sheet = false; }
const pickGrid = (name, list, val) => `<div class="pick" role="radiogroup">${list.map((e, i) => `<label><input type="radio" name="${name}" value="${e}" ${(val ? val === e : i === 0) ? 'checked' : ''} aria-label="${e}"><span>${e}</span></label>`).join('')}</div>`;
const radioVal = n => { const r = document.querySelector(`#modal input[name="${n}"]:checked, #app input[name="${n}"]:checked`); return r ? r.value : null; };

// Cắt ảnh vuông theo mức phóng to và vị trí đã chọn, thu về 320px JPEG (khoảng 20–40KB).
let photoEdit = { img: null, out: undefined };
function photoRender() {
  const img = photoEdit.img; if (!img) return;
  const z = Number($('#pzoom')?.value) || 1, fx = Number($('#px')?.value ?? .5), fy = Number($('#py')?.value ?? .3);
  const side = Math.min(img.naturalWidth, img.naturalHeight) / z, sx = (img.naturalWidth - side) * fx, sy = (img.naturalHeight - side) * fy;
  const c = document.createElement('canvas'); c.width = c.height = 320;
  c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, 320, 320);
  photoEdit.out = c.toDataURL('image/jpeg', .85);
  const pv = $('#modal .photo-prev'); if (pv) pv.innerHTML = `<img src="${photoEdit.out}" alt="">`;
}
function photoLoad(file) {
  if (!file || !/^image\//.test(file.type)) return toast('Hãy chọn một file ảnh nhé.');
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => { photoEdit.img = img; $('#modal .photo-adj').hidden = false; const d = $('#modal [data-act=photo-del]'); if (d) d.hidden = false; photoRender(); URL.revokeObjectURL(url); };
  img.onerror = () => { URL.revokeObjectURL(url); toast('Không mở được ảnh này. Thử ảnh JPG hoặc PNG.'); };
  img.src = url;
}
// Ô chọn hình: bộ gà, bộ ngựa (mỗi ngày một kiểu hoặc một kiểu cố định), rồi tới emoji.
function avatarGrid(val) {
  const opt = (v, inner, label, cls = '') => `<label><input type="radio" name="kava" value="${esc(v)}" ${v === val ? 'checked' : ''} aria-label="${esc(label)}"><span class="${cls}" title="${esc(label)}">${inner}</span></label>`;
  const sets = Object.entries(AVATAR_SETS);
  let h = `<div class="av-group"><span class="av-h">🔀 Mỗi ngày một kiểu</span><div class="pick av">${sets.map(([id, st]) => opt('set:' + id, avInner('set:' + id) + '<i class="av-badge">🔀</i>', `${st.label}, mỗi ngày một kiểu`, 'rot')).join('')}</div></div>`;
  for (const [id, st] of sets) h += `<div class="av-group"><span class="av-h">${st.icon} ${st.label}</span><div class="pick av">${st.items.map((it, i) => opt(`svg:${id}-${i}`, avInner(`svg:${id}-${i}`), it[0])).join('')}</div></div>`;
  h += `<div class="av-group"><span class="av-h">😀 Emoji</span><div class="pick">${AVATARS.map(e => opt(e, e, e)).join('')}</div></div>`;
  if (!val) h = h.replace('name="kava" value="set:ga"', 'name="kava" value="set:ga" checked');
  return h;
}
function kidForm(id) {
  const k = id ? S.kids[id] : null;
  photoEdit = { img: null, out: undefined };
  openModal(`<h2>${k ? 'Sửa thông tin con' : 'Thêm con'}</h2>
  <div class="field"><label for="kname">Tên</label><input id="kname" class="input" maxlength="30" value="${esc(k?.name || '')}" placeholder="Ví dụ: Bin"></div>
  <div class="field"><label for="kbday">Ngày sinh</label><input id="kbday" class="input" type="date" value="${esc(k?.birthday || '')}"></div>
  <div class="field"><span class="lbl">Ảnh của con</span>
    <div class="photo-pick"><span class="ava photo-prev" style="background:${k ? tintOf(k) : 'var(--surface-2)'}">${photoOf(k) ? `<img src="${photoOf(k)}" alt="">` : k ? avInner(avatarOf(k)) : '📷'}</span>
      <div class="col"><div class="row"><label class="btn ghost sm file-btn">📷 Chọn ảnh<input type="file" id="kphoto" accept="image/*"></label><button class="btn quiet sm" data-act="photo-del" ${photoOf(k) ? '' : 'hidden'}>Bỏ ảnh</button></div>
      <div class="photo-adj" hidden><label class="small">🔍 Phóng to<input type="range" id="pzoom" min="1" max="4" step="0.05" value="2"></label><label class="small">↕️ Lên xuống<input type="range" id="py" min="0" max="1" step="0.01" value="0.4"></label><label class="small">↔️ Trái phải<input type="range" id="px" min="0" max="1" step="0.01" value="0.5"></label></div>
      <span class="muted small">Ảnh được thu nhỏ và chỉ lưu trong dữ liệu của gia đình. Không có ảnh thì dùng hình emoji bên dưới.</span></div></div></div>
  <div class="field"><span class="lbl">Hình đại diện</span>${avatarGrid(k ? avatarOf(k) : '')}</div>
  <div class="field"><label for="kwb">Thưởng thêm khi làm đủ việc phải làm cả tuần (đồng)</label><input id="kwb" class="input num" type="number" min="0" step="5000" inputmode="numeric" value="${k ? weekBonusOf(k) : WEEK_BONUS}">
    <span class="muted small">Xong hết việc phải làm từ Thứ Hai đến Chủ nhật thì app tự cộng tiền này vào tài khoản. Để 0 nếu không thưởng.</span></div>
  <div class="foot">${k ? `<button class="btn danger left" data-act="kid-del" data-id="${id}">Xoá</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="kid-save" data-id="${id || ''}">Lưu</button></div>`);
}
function choreForm(id) {
  const c = id ? S.chores[id] : null, kids = kidsList();
  const ck = c ? (c.kids || []) : kids.map(k => k.id), days = c ? (c.days || []) : [0, 1, 2, 3, 4, 5, 6];
  const kind = c ? (isFun(c) ? 'fun' : isExtra(c) ? 'extra' : 'must') : 'must', fun = kind === 'fun', slot = c ? choreSlot(c) : '', pw = c ? perWeekOf(c) : 0;
  const adv = c && (pw || (c.steps || []).length || (c.variants || []).length || c.shared);
  openModal(`<h2>${c ? 'Sửa việc' : 'Thêm việc'}</h2>
  <div class="field"><label for="cname">Tên việc</label><input id="cname" class="input" maxlength="40" value="${esc(c?.name || '')}" placeholder="Ví dụ: Học bài, Gấp quần áo, Xem phim"></div>
  <div class="field"><span class="lbl">Loại việc</span><div class="seg">
    <label><input type="radio" name="ckind" value="must" ${kind === 'must' ? 'checked' : ''}><span>⭐ Việc phải làm</span></label>
    <label><input type="radio" name="ckind" value="extra" ${kind === 'extra' ? 'checked' : ''}><span>💪 Việc làm thêm</span></label>
    <label><input type="radio" name="ckind" value="fun" ${fun ? 'checked' : ''}><span>🎈 Việc thích làm</span></label></div>
    <span class="muted small"><b>Phải làm:</b> tính vào tiến độ mỗi ngày và thưởng đủ tuần. <b>Làm thêm:</b> không bắt buộc, làm lúc nào được tiền lúc đó (rửa bát, đổ rác...). <b>Thích làm:</b> xem phim, chơi Lego..., không có tiền, bị khoá cho đến khi con làm xong việc phải làm của buổi đó.</span></div>
  <div class="field"><span class="lbl">Biểu tượng</span>${pickGrid('cico', CHORE_ICONS, c?.icon)}</div>
  <div class="field cmoney-f" ${fun ? 'hidden' : ''}><label for="cmoney">Được bao nhiêu tiền (đồng)</label><div class="stepper"><button class="iconbtn" data-act="num-step" data-t="cmoney" data-n="-5000" data-min="0" aria-label="Bớt 5.000đ">−</button><input id="cmoney" class="input num" type="number" min="0" step="1000" inputmode="numeric" value="${c ? choreVnd(c) : 5000}"><button class="iconbtn" data-act="num-step" data-t="cmoney" data-n="5000" data-min="0" aria-label="Thêm 5.000đ">+</button></div>
    <div class="row">${[5000, 10000, 15000, 20000].map(v => `<button class="btn quiet sm" data-act="who-fill" data-t="cmoney" data-v="${v}">${money(v)}</button>`).join('')}</div></div>
  <div class="field"><span class="lbl">Buổi</span><div class="seg">${SLOTS.map(([v, label, icon]) => `<label><input type="radio" name="cslot" value="${v}" ${slot === v ? 'checked' : ''}><span>${icon} ${v ? label.replace('Buổi ', '') : label}</span></label>`).join('')}</div></div>
  <div class="row2"><div class="field"><label for="ctime">Giờ (không bắt buộc)</label><input id="ctime" class="input num" type="time" value="${esc(c?.time || '')}"></div>
    <div class="field"><label for="cmin">Làm trong bao lâu (phút)</label><input id="cmin" class="input num" type="number" min="0" max="600" step="5" inputmode="numeric" value="${Number(c?.minutes) || ''}" placeholder="Ví dụ: 30"></div></div>
  <div class="seg"><label><input type="checkbox" id="cby" ${c?.by ? 'checked' : ''}><span>Phải xong trước giờ này (ví dụ: tắm trước 19:00)</span></label></div>
  <div class="field"><span class="lbl">Giao cho</span><div class="seg">${kids.map(k => `<label><input type="checkbox" name="ckid" value="${k.id}" ${ck.includes(k.id) ? 'checked' : ''}><span>${mini(k)} ${esc(k.name)}</span></label>`).join('')}</div></div>
  <div class="field"><span class="lbl">Những ngày</span><div class="seg">${WEEK_ORDER.map(d => `<label><input type="checkbox" name="cday" value="${d}" ${days.includes(d) ? 'checked' : ''}><span>${WDS[d]}</span></label>`).join('')}</div>
    <div class="row"><button class="btn quiet sm" data-act="days" data-v="0,1,2,3,4,5,6">Mỗi ngày</button><button class="btn quiet sm" data-act="days" data-v="1,2,3,4,5">Ngày thường</button><button class="btn quiet sm" data-act="days" data-v="0,6">Cuối tuần</button></div></div>
  <details class="adv" ${adv ? 'open' : ''}><summary>Thêm tuỳ chọn</summary>
    <div class="field"><label for="cpw">Số lần mỗi tuần</label><select id="cpw" class="input">${[0, 1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${pw === n ? 'selected' : ''}>${n ? `${n} lần/tuần, ngày nào cũng được` : 'Mọi ngày đã chọn'}</option>`).join('')}</select>
      <span class="muted small">Ví dụ: đi bộ hoặc chạy 3 buổi mỗi tuần. Việc hiện mỗi ngày cho tới khi đủ số lần.</span></div>
    <div class="field"><label for="csteps">Danh sách con (mỗi dòng một mục)</label><textarea id="csteps" class="input" rows="4" placeholder="Cặp sách đã soạn&#10;Quần áo ngày mai&#10;Bàn học đã gọn&#10;Đánh răng, rửa mặt">${esc((c?.steps || []).join('\n'))}</textarea>
      <span class="muted small">Con tick từng mục. Đủ hết các mục thì việc được tính là xong.</span></div>
    <div class="field"><label for="cvar">Đổi nội dung xen kẽ (cách nhau bằng dấu phẩy)</label><input id="cvar" class="input" maxlength="80" value="${esc((c?.variants || []).join(', '))}" placeholder="Ví dụ: tiếng Việt, tiếng Anh">
      <span class="muted small">Mỗi lần làm đổi sang nội dung tiếp theo. App ghi rõ “hôm nay: tiếng Anh”.</span></div>
    <div class="seg"><label><input type="checkbox" id="cshared" ${c?.shared ? 'checked' : ''}><span>👨‍👩‍👧 Việc chung: một con đánh dấu là tính cho cả nhà</span></label></div>
  </details>
  <div class="foot">${c ? `<button class="btn danger left" data-act="chore-del" data-id="${id}">Xoá</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="chore-save" data-id="${id || ''}">Lưu</button></div>`);
}
function priceForm(id, kindPre) {
  const r = id ? S.rewards[id] : null, kind = r ? priceKind(r) : PRICE_KINDS.some(x => x[0] === kindPre) ? kindPre : 'penalty';
  const icons = [...new Set([...PRICE_ICONS[kind], ...Object.values(PRICE_ICONS).flat()])];
  openModal(`<h2>${r ? 'Sửa mục' : 'Thêm mục'}</h2>
  <div class="field"><span class="lbl">Loại</span><div class="seg">${PRICE_KINDS.map(([v, l, ic]) => `<label><input type="radio" name="pkind" value="${v}" ${v === kind ? 'checked' : ''}><span>${ic} ${l}</span></label>`).join('')}</div>
    <span class="muted small"><b>Phạt:</b> trừ tiền khi con mắc lỗi. <b>Phí sử dụng:</b> trừ tiền theo số giờ dùng điện thoại, tivi... <b>Đổi quà:</b> con dùng tiền trong tài khoản để đổi.</span></div>
  <div class="field"><label for="pname">Tên</label><input id="pname" class="input" maxlength="40" value="${esc(r?.name || '')}" placeholder="Ví dụ: Nổi nóng, Điện thoại, Đi ăn kem"></div>
  <div class="field"><span class="lbl">Biểu tượng</span>${pickGrid('pico', icons, r?.icon)}</div>
  <div class="field"><label for="pprice">Số tiền (đồng). Phí sử dụng thì tính cho mỗi giờ</label><div class="stepper"><button class="iconbtn" data-act="num-step" data-t="pprice" data-n="-5000" data-min="0" aria-label="Bớt 5.000đ">−</button><input id="pprice" class="input num" type="number" min="0" step="1000" inputmode="numeric" value="${r ? priceVnd(r) : 10000}"><button class="iconbtn" data-act="num-step" data-t="pprice" data-n="5000" data-min="0" aria-label="Thêm 5.000đ">+</button></div></div>
  <div class="field pgift-f" ${kind === 'gift' ? '' : 'hidden'}><label for="pnote">Mô tả trên phiếu (không bắt buộc)</label><input id="pnote" class="input" maxlength="70" value="${esc(r?.note || '')}" placeholder="Ví dụ: Con được chọn phim cả nhà xem tối nay"></div>
  <div class="seg pgift-f" ${kind === 'gift' ? '' : 'hidden'}><label><input type="checkbox" id="pskip" ${r?.skip ? 'checked' : ''}><span>Phiếu nghỉ việc nhà: đổi xong thì việc phải làm của ngày đó được miễn</span></label></div>
  <div class="seg pall-f" ${kind === 'penalty' ? '' : 'hidden'}><label><input type="checkbox" id="pall" ${r?.all ? 'checked' : ''}><span>Mất hết tiền trong tài khoản (không tính theo số tiền ở trên)</span></label></div>
  <div class="foot">${r ? `<button class="btn danger left" data-act="price-del" data-id="${id}">Xoá</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="price-save" data-id="${id || ''}">Lưu</button></div>`);
}
// Bản nháp đang sửa, để thêm/bớt tiết hay bật Thứ Bảy không làm mất chữ đã gõ.
let tkbDraft = null;
function tkbForm(kidId, draft) {
  const k = S.kids[kidId]; if (!k) return;
  const saved = tkbOf(kidId);
  if (!draft) {
    draft = saved ? JSON.parse(JSON.stringify(saved))
      : { cls: '', year: '', days: [1, 2, 3, 4, 5], lunch: 4, rows: SAMPLE_PERIODS.map(([s, e]) => ({ s, e, d: {} })) };
    draft.days = tkbDays(draft);
  }
  const days = tkbDays(draft), n = draft.rows.length, lunch = Number(draft.lunch) || 0;
  // Ngày đang nhập môn (không lưu): mặc định là thứ đầu tiên.
  const ed = days.includes(Number(draft.ed)) ? Number(draft.ed) : days[0];
  tkbDraft = { kid: kidId, ...draft, ed };
  const used = Object.values(S.timetables || {}).flatMap(t => (t.rows || []).flatMap(r => Object.values(r.d || {})));
  const subjects = [...new Set([...SUBJECTS, ...used.map(s => String(s).trim()).filter(Boolean)])];
  const filled = d => draft.rows.filter(r => String((r.d || {})[d] || '').trim()).length;
  openModal(`<h2>Thời khoá biểu của ${esc(k.name)}</h2>
  <div class="row2"><div class="field"><label for="tcls">Lớp</label><input id="tcls" class="input" maxlength="20" value="${esc(draft.cls || '')}" placeholder="Ví dụ: Lớp 4A"></div>
    <div class="field"><label for="tyear">Năm học</label><input id="tyear" class="input" maxlength="20" value="${esc(draft.year || '')}" placeholder="Ví dụ: 2026 – 2027"></div></div>
  <div class="row2"><div class="field"><span class="lbl">Ngày học</span><div class="seg"><label><input type="checkbox" id="tsat" ${days.includes(6) ? 'checked' : ''}><span>Học cả Thứ Bảy</span></label></div></div>
    <div class="field"><label for="tlunch">Nghỉ trưa</label><select id="tlunch" class="input">
      <option value="0" ${lunch <= 0 || lunch >= n ? 'selected' : ''}>Không nghỉ trưa</option>
      ${Array.from({ length: Math.max(0, n - 1) }, (_, i) => `<option value="${i + 1}" ${lunch === i + 1 ? 'selected' : ''}>Sau tiết ${i + 1}</option>`).join('')}</select></div></div>
  <div class="field"><span class="lbl">1. Giờ của các tiết</span>
    <table class="tkb-times"><thead><tr><th>Tiết</th><th>Bắt đầu</th><th>Kết thúc</th><th></th></tr></thead><tbody>
    ${draft.rows.map((r, i) => `<tr data-r="${i}"><td class="num"><b>${i + 1}</b></td>
      <td><input class="input num" type="time" data-f="s" value="${esc(r.s || '')}" aria-label="Tiết ${i + 1} bắt đầu"></td>
      <td><input class="input num" type="time" data-f="e" value="${esc(r.e || '')}" aria-label="Tiết ${i + 1} kết thúc"></td>
      <td><button class="iconbtn" data-act="tkb-row-del" data-i="${i}" aria-label="Xoá tiết ${i + 1}" ${n <= 1 ? 'disabled' : ''}>×</button></td></tr>`).join('')}
    </tbody></table>
    <div><button class="btn quiet sm" data-act="tkb-row-add">+ Thêm tiết</button></div></div>
  <div class="field"><span class="lbl">2. Môn học từng ngày</span>
    <div class="seg">${days.map(d => `<label><input type="radio" name="tday" value="${d}" ${d === ed ? 'checked' : ''}><span>${WDN(d)}${filled(d) ? ` <i class="cnt num">${filled(d)}</i>` : ''}</span></label>`).join('')}</div>
    <div class="subj-rows">${draft.rows.map((r, i) => `${i > 0 && i === lunch ? '<div class="subj-lunch">🍱 Nghỉ trưa</div>' : ''}
      <label class="subj-row"><span class="num"><b>Tiết ${i + 1}</b> ${esc(r.s || '')}</span><input class="input" list="subj-list" maxlength="24" data-r="${i}" data-d="${ed}" value="${esc((r.d || {})[ed] || '')}" placeholder="Không có tiết"></label>`).join('')}</div>
    <span class="muted small">Nhập xong ${WDN(ed)} thì chọn ngày tiếp theo. Gõ vài chữ đầu để chọn môn có sẵn.</span></div>
  <datalist id="subj-list">${subjects.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
  <div class="foot">${saved ? `<button class="btn danger left" data-act="tkb-del" data-id="${kidId}">Xoá</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="tkb-save">Lưu</button></div>`, false, !!draft.keep);
}
// Đọc lại những gì đang gõ trong form. Môn của các ngày đang ẩn được giữ nguyên từ bản nháp.
function readTkbForm() {
  const prev = tkbDraft || { rows: [] };
  const rows = [...document.querySelectorAll('#modal tr[data-r]')].map((tr, i) => ({
    s: tr.querySelector('[data-f=s]').value, e: tr.querySelector('[data-f=e]').value, d: { ...((prev.rows[i] || {}).d || {}) },
  }));
  document.querySelectorAll('#modal .subj-row input').forEach(inp => {
    const r = rows[Number(inp.dataset.r)], v = inp.value.trim(); if (!r) return;
    if (v) r.d[inp.dataset.d] = v; else delete r.d[inp.dataset.d];
  });
  return {
    cls: $('#tcls').value.trim(), year: $('#tyear').value.trim(),
    days: $('#tsat').checked ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5],
    lunch: Number($('#tlunch').value) || 0, rows, ed: Number(radioVal('tday')) || prev.ed,
  };
}

const whoNames = () => [...new Set([...WHO_NAMES, ...lessonsList().flatMap(l => [l.go, l.back]).map(w => String(w || '').trim()).filter(Boolean)])];
function lessonForm(id, kidPre) {
  const l = id ? S.lessons[id] : null, kids = kidsList();
  if (!kids.length) return;
  const kid = l?.kid || (S.kids[kidPre] ? kidPre : (S.kids[UI.tkbKid] ? UI.tkbKid : kids[0].id));
  const names = [...new Set([...lessonsList().map(x => x.name), ...LESSON_NAMES])];
  const day = l ? Number(l.day) : null;
  openModal(`<h2>${l ? 'Sửa buổi học thêm' : 'Thêm buổi học thêm'}</h2>
  <div class="field"><span class="lbl">Con</span><div class="seg">${kids.map(k => `<label><input type="radio" name="lkid" value="${k.id}" ${k.id === kid ? 'checked' : ''}><span>${mini(k)} ${esc(k.name)}</span></label>`).join('')}</div></div>
  <div class="field"><label for="lname">Học gì</label><input id="lname" class="input" list="lesson-list" maxlength="40" value="${esc(l?.name || '')}" placeholder="Ví dụ: Tiếng Anh cô Huyền">
    <datalist id="lesson-list">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist></div>
  <div class="field"><span class="lbl">${l ? 'Ngày' : 'Những ngày (cùng giờ)'}</span><div class="seg">${WEEK_ORDER.map(d => `<label><input type="${l ? 'radio' : 'checkbox'}" name="lday" value="${d}" ${d === day ? 'checked' : ''}><span>${WDS[d]}</span></label>`).join('')}</div></div>
  <div class="row2"><div class="field"><label for="ls">Từ</label><input id="ls" class="input num" type="time" value="${esc(l?.s || '17:30')}"></div>
    <div class="field"><label for="le">Đến</label><input id="le" class="input num" type="time" value="${esc(l?.e || '19:30')}"></div></div>
  <div class="field"><span class="lbl">Có phải đi lại không</span><div class="seg">
    <label><input type="radio" name="lwhere" value="home" ${l?.home === true ? 'checked' : ''}><span>🏠 Học ngay tại nhà con đang ở</span></label>
    <label><input type="radio" name="lwhere" value="out" ${l?.home === false ? 'checked' : ''}><span>🚗 Phải đưa đón</span></label></div></div>
  <div class="field"><label for="lat">Học ở đâu (không bắt buộc)</label><input id="lat" class="input" list="place-list" maxlength="30" value="${esc(placeName(l?.at))}" placeholder="Ví dụ: 6th Element, CLB bóng rổ">
    <datalist id="place-list">${placeNames().map(n => `<option value="${esc(n)}">`).join('')}</datalist></div>
  <div class="lgo" ${l?.home === false ? '' : 'hidden'}>${[['lgo', 'Ai đưa đi', l?.go], ['lback', 'Ai đón về', l?.back]].map(([fid, lbl, v]) => `<div class="field"><label for="${fid}">${lbl}</label>
    <input id="${fid}" class="input" list="who-list" maxlength="20" value="${esc(v || '')}" placeholder="Ví dụ: Bố, Grab">
    <div class="row">${whoNames().map(w => `<button class="btn quiet sm" data-act="who-fill" data-t="${fid}" data-v="${esc(w)}">${whoIcon(w)} ${esc(w)}</button>`).join('')}</div></div>`).join('')}
    <datalist id="who-list">${whoNames().map(w => `<option value="${esc(w)}">`).join('')}</datalist></div>
  ${l ? '' : '<span class="muted small">Cùng một lớp mà mỗi ngày học một giờ khác nhau, hoặc mỗi ngày một người đưa đón khác nhau, thì thêm từng ngày một.</span>'}
  <div class="foot">${l ? `<button class="btn danger left" data-act="lesson-del" data-id="${id}">Xoá</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="lesson-save" data-id="${id || ''}">Lưu</button></div>`);
}

// ---------- backup ----------
function exportBackup() {
  const data = { app: 'be-cham-ngoan', version: 1, exportedAt: new Date().toISOString(), data: S };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'misa-misu-sao-luu-' + key(today()) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
// Con trong file nhập mà trùng tên với con đã có (khác mã) thì gộp vào con đó,
// không tạo thêm một con nữa. Đổi mã con ở mọi nhóm dữ liệu trong file. Trả về tên các con đã gộp.
function matchKidsByName(data) {
  const byName = {};
  for (const [id, k] of Object.entries(S.kids)) byName[norm(k.name)] ??= id;
  const map = {};
  for (const [id, k] of Object.entries(data.kids)) if (!S.kids[id] && byName[norm(k.name)]) map[id] = byName[norm(k.name)];
  if (!Object.keys(map).length) return [];
  const m = id => map[id] || id;
  for (const id of Object.keys(map)) delete data.kids[id]; // giữ thông tin con đang có
  for (const c of Object.values(data.chores || {})) if (Array.isArray(c.kids)) c.kids = c.kids.map(m);
  for (const day of Object.values(data.done || {})) for (const id of Object.keys(day || {})) if (map[id]) { day[map[id]] = { ...(day[map[id]] || {}), ...day[id] }; delete day[id]; }
  for (const l of Object.values(data.ledger || {})) if (l) l.kid = m(l.kid);
  for (const l of Object.values(data.lessons || {})) if (l) l.kid = m(l.kid);
  for (const t of Object.values(data.tasks || {})) if (t) t.kid = m(t.kid);
  for (const g of Object.values(data.goals || {})) if (g) g.kid = m(g.kid);
  for (const ev of Object.values(data.events || {})) if (ev && Array.isArray(ev.kids)) ev.kids = ev.kids.map(m);
  if (data.paid) data.paid = Object.fromEntries(Object.entries(data.paid).map(([id, p]) => { const [kid, w] = id.split('_'); return [m(kid) + '_' + w, { ...p, kid: m(p.kid) }]; }));
  if (data.timetables) data.timetables = Object.fromEntries(Object.entries(data.timetables).map(([id, t]) => [m(id), t]));
  return [...new Set(Object.values(map))].map(kidName);
}
async function importBackup(file) {
  try {
    await importData(JSON.parse(await file.text()));
  } catch (e) {
    console.error(e);
    toast('File này không phải bản sao lưu của Misa Misu.');
  }
}
async function importData(j, quiet = false) {
  {
    const data = j && j.data;
    if (!data || typeof data !== 'object' || !data.kids) throw new Error('bad');
    const matched = matchKidsByName(data);
    await store.importAll(data);
    const n = Object.keys(data.kids).length, parts = [];
    if (n) parts.push(`${n} con mới`);
    if (matched.length) parts.push(`gộp vào ${matched.join(', ')}`);
    for (const [c, label] of [['chores', 'việc nhà'], ['timetables', 'thời khoá biểu'], ['lessons', 'buổi học thêm'], ['stays', 'ngày trong lịch ở nhà nào'], ['events', 'mốc năm học'], ['tasks', 'bài tập'], ['goals', 'mục tiêu tiết kiệm']]) { const m = Object.keys(data[c] || {}).length; if (m) parts.push(`${m} ${label}`); }
    if (!quiet) toast(`Đã nhập: ${parts.join(', ') || 'không có gì mới'}.`);
  }
}

// ---------- lịch gia đình mã hoá ----------
// data/gia-dinh.enc.json là một bản sao lưu đã mã hoá (AES-GCM, khoá sinh từ mật khẩu bằng PBKDF2-SHA256),
// để repo công khai mà người ngoài không đọc được. Tạo file bằng tools/ma-hoa.mjs.
const SEED_URL = 'data/gia-dinh.enc.json';
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
// Nhớ mật khẩu trên máy này để tự nạp lịch mới mỗi khi file mã hoá đổi (mỗi lần mã hoá có salt/iv mới).
const SEED_KEY = 'be-cham-ngoan-seed';
const getSeedMem = () => { try { return JSON.parse(localStorage.getItem(SEED_KEY) || 'null'); } catch (e) { return null; } };
const setSeedMem = v => { try { v ? localStorage.setItem(SEED_KEY, JSON.stringify(v)) : localStorage.removeItem(SEED_KEY); } catch (e) {} };
const seedVer = f => f.salt + '.' + f.iv;
async function fetchSeed() {
  const r = await fetch(SEED_URL, { cache: 'no-store' });
  if (!r.ok) throw Object.assign(new Error('missing'), { code: 'missing' });
  return r.json();
}
async function decryptSeed(pass, f) {
  f = f || await fetchSeed();
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(f.salt), iterations: f.iter }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  let plain;
  try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(f.iv) }, key, b64(f.ct)); }
  catch (e) { throw Object.assign(new Error('wrong'), { code: 'wrong' }); }
  return { json: JSON.parse(new TextDecoder().decode(plain)), ver: seedVer(f) };
}
// Lúc mở app: nếu máy này đã nhớ mật khẩu và lịch lưu sẵn có bản mới thì tự nạp.
let seedChecked = false;
async function autoSeed() {
  if (seedChecked) return; seedChecked = true;
  const mem = getSeedMem(); if (!mem?.pass || !crypto?.subtle) return;
  try {
    const f = await fetchSeed();
    if (seedVer(f) === mem.ver) return;
    const { json, ver } = await decryptSeed(mem.pass, f);
    await importData(json, true);
    setSeedMem({ ...mem, ver });
    toast('Đã tự nạp lịch gia đình bản mới.');
  } catch (e) {
    if (e.code === 'wrong') { setSeedMem(null); toast('Lịch gia đình đã đổi mật khẩu. Vào Gia đình để nạp lại.'); }
    else console.warn('Không tự nạp được lịch gia đình', e);
  }
}
function seedForm() {
  openModal(`<h2>Nạp lịch gia đình</h2>
  <p class="muted" style="margin:-8px 0 0">Lịch của các con được lưu sẵn trong app dưới dạng mã hoá. Gõ mật khẩu gia đình để nạp vào máy này. Dữ liệu được gộp vào bảng hiện có, không xoá gì.</p>
  <div class="field"><label for="seedpass">Mật khẩu</label><input id="seedpass" class="input" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false"></div>
  <div class="seg"><label><input type="checkbox" id="seedmem" checked><span>Nhớ trên máy này, tự nạp khi lịch có bản mới</span></label></div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="seed-load">Nạp lịch</button></div>`);
}

// Đánh dấu / bỏ dấu một việc. Việc chung thì tính cho mọi con được giao việc đó trong ngày.
// Xong việc phải làm cuối cùng của buổi thì báo mở khoá việc thích làm.
function markChore(d, kid, cid, on) {
  const ch = S.chores[cid]; if (!ch || isFun(ch)) return;
  memo = {};
  const who = ch.shared ? (ch.kids || []).filter(x => S.kids[x] && choresFor(x, d).some(c => c.id === cid)) : [kid];
  if (!who.includes(kid)) who.push(kid);
  let msg = null;
  if (on) {
    const list = mustFor(kid, d), left = list.filter(c => c.id !== cid && !isDone(d, kid, c.id)).length;
    const g = dayPlan(kid, d).find(g => g.items.some(x => x.c?.id === cid));
    const funs = g ? g.items.filter(x => x.type === 'chore' && isFun(x.c) && x.locked).map(x => x.c.name) : [];
    const gLeft = g ? g.items.filter(x => x.type === 'chore' && isMust(x.c) && x.c.id !== cid && !isDone(d, kid, x.c.id)).length : 1;
    const earn = choreVnd(ch) ? ` +${money(choreVnd(ch))}` : '';
    if (isExtra(ch)) msg = `${kidName(kid)} làm thêm “${ch.name}”${earn} 💪`;
    else if (!left && list.some(c => c.id === cid)) {
      confetti();
      if (key(d) === key(today())) { const got = earned(kid, key(d), key(d)) + choreVnd(ch); setTimeout(() => celebrate(kid, got), 450); }
      else msg = `${kidName(kid)} làm xong hết việc phải làm rồi! 🎉${earn}`;
    }
    else if (g?.id && !gLeft && funs.length) { confetti(); msg = `🎈 Mở khoá: ${funs.join(', ')}!`; }
    if (ch.shared && who.length > 1) msg = msg || `Đã tính cho ${who.map(kidName).join(', ')}.${earn}`;
    msg = msg || (earn ? `${kidName(kid)}${earn} 💰` : null);
  }
  const steps = (ch.steps || []).filter(Boolean);
  for (const x of who) {
    setDone(key(d), x, cid, on ? doneVal(ch) : 0);
    if (steps.length) setDone(key(d), x, cid + '~s', on ? (1 << steps.length) - 1 : 0);
  }
  if (msg) toast(msg);
}

// ---------- actions ----------
let toastT = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2800); }
// Màn chúc mừng khi con làm xong hết việc phải làm hôm nay.
function celebrate(kidId, got) {
  const k = S.kids[kidId]; if (!k) return;
  memo = {};
  document.querySelector('.celebrate')?.remove();
  const n = streakOf(kidId), st = weekStats({ id: kidId, ...k }, weekStart(today())), wb = weekBonusOf(k);
  const el = document.createElement('div'); el.className = 'celebrate'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'cel-h');
  el.innerHTML = `<div class="cel-burst" aria-hidden="true"></div><div class="cel-box">
    <div class="cel-ava">${ava({ ...k, id: kidId })}<span class="cel-sp s1">✨</span><span class="cel-sp s2">⭐</span><span class="cel-sp s3">✨</span></div>
    <div class="cel-coin"><span class="coin3d" aria-hidden="true"></span><b class="num">+${money(got)}</b></div>
    <h2 id="cel-h">Giỏi quá! ${esc(k.name)} đã xong hết việc hôm nay 🎉</h2>
    <div class="cel-cards"><div class="km-stat"><span class="hex fire">🔥</span><div><b class="num">${n} ngày liên tiếp</b><span>Dài nhất: ${Math.max(n, bestStreak(kidId))} ngày</span></div></div>
      ${wb && st.possible ? `<div class="km-stat"><span class="hex">🏆</span><div><b class="num">${st.done}/${st.possible} việc tuần này</b><span>${st.done >= st.possible ? `Đủ cả tuần! Thưởng ${money(wb)}` : `Đủ tuần được thưởng ${money(wb)}`}</span></div></div>` : ''}</div>
    <button class="btn go" data-cel-close>Tuyệt vời!</button></div>`;
  document.body.appendChild(el);
  confetti();
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 250); document.removeEventListener('keydown', esc1); };
  const esc1 = e => { if (e.key === 'Escape') close(); };
  el.addEventListener('click', e => { if (e.target.closest('[data-cel-close]') || e.target === el || e.target.classList.contains('cel-burst')) close(); });
  document.addEventListener('keydown', esc1);
  el.querySelector('[data-cel-close]').focus();
}
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['#FFC633', '#22B85C', '#FF6B6B', '#4DA8FF', '#B07CFF', '#FF9F2E'];
  for (let i = 0; i < 60; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = cols[i % cols.length]; s.style.animationDelay = Math.random() * 0.5 + 's'; s.style.animationDuration = 1.2 + Math.random() + 's'; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
}
const confirmArm = {};
function armed(btn, label) {
  const k = btn.dataset.act + btn.dataset.id;
  if (confirmArm[k]) return true;
  confirmArm[k] = 1; btn.textContent = label; setTimeout(() => { delete confirmArm[k]; }, 4000); return false;
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, id = b.dataset.id;
  if (a === 'close') return closeModal();
  if (a === 'day-set') { UI.date = parse(b.dataset.d); return render(); }
  if (a === 'day') { const n = Number(b.dataset.n); UI.date = n === 0 ? today() : addDays(UI.date, n); return render(); }
  if (a === 'tick') {
    const d = b.dataset.km ? today() : UI.date, kid = b.dataset.kid; if (!S.chores[b.dataset.chore]) return;
    const on = isDone(d, kid, b.dataset.chore);
    const st = b.classList.contains('stamp') ? b : b.querySelector('.stamp');
    if (!on && st) st.classList.add('on', 'pop');
    return markChore(d, kid, b.dataset.chore, !on);
  }
  if (a === 'step') {
    const d = b.dataset.km ? today() : UI.date, kid = b.dataset.kid, cid = b.dataset.chore, ch = S.chores[cid]; if (!ch) return;
    const steps = (ch.steps || []).filter(Boolean), all = (1 << steps.length) - 1;
    let mask = isDone(d, kid, cid) ? all : stepMask(d, kid, cid);
    mask ^= 1 << Number(b.dataset.i);
    b.classList.toggle('on', !!((mask >> Number(b.dataset.i)) & 1));
    if (mask === all) return markChore(d, kid, cid, true);
    if (isDone(d, kid, cid)) setDone(key(d), kid, cid, 0);
    setDone(key(d), kid, cid + '~s', mask);
    return;
  }
  if (a === 'tkb-go') { UI.tkbKid = b.dataset.kid; if (b.dataset.tab) UI.learn = b.dataset.tab; return; } // link tự chuyển sang #lich-hoc
  if (a === 'grid-week') { const n = Number(b.dataset.n); UI.gridWs = n ? addDays(UI.gridWs || weekStart(today()), n) : null; return render(); }
  if (a === 'grid-tick') { const d = parse(b.dataset.d), cid = b.dataset.chore; if (!S.chores[cid] || d > today()) return; return markChore(d, b.dataset.kid, cid, !isDone(d, b.dataset.kid, cid)); }
  if (a === 'learn-tab') { UI.learn = b.dataset.v; UI.histAll = false; return render(); }
  if (a === 'ag-day') { UI.agDate = b.dataset.d ? parse(b.dataset.d) : null; return render(); }
  if (a === 'ag-week') { UI.agDate = addDays(UI.agDate || today(), Number(b.dataset.n)); return render(); }
  if (a === 'task-form') return taskForm(id, b.dataset.kid);
  if (a === 'task-subj') {
    $('#tsubj').value = b.dataset.v;
    const nx = nextSubjectDay(radioVal('tkid') || document.querySelector('#modal input[name=tkid]')?.value, b.dataset.v);
    if (nx && !$('#tdue').value) $('#tdue').value = key(nx);
    return toast(nx ? `Buổi ${b.dataset.v} tới: ${WDN(nx.getDay())} ${dm(nx)}.` : `Không thấy ${b.dataset.v} trong thời khoá biểu.`);
  }
  if (a === 'task-due') {
    const v = b.dataset.v, t = today(), kid = radioVal('tkid') || document.querySelector('#modal input[name=tkid]')?.value;
    let d = null;
    if (v === 'next') { d = nextSubjectDay(kid, $('#tsubj').value.trim()); if (!d) return toast($('#tsubj').value.trim() ? 'Không thấy môn này trong thời khoá biểu.' : 'Chọn môn trước nhé.'); }
    else if (v === '1') d = addDays(t, 1);
    else if (v === 'mon') d = addDays(weekStart(t), 7);
    $('#tdue').value = d ? key(d) : ''; return;
  }
  if (a === 'task-save') {
    const title = $('#ttitle').value.trim(); if (!title) { $('#ttitle').focus(); return toast('Nhập tên bài nhé.'); }
    const kid = radioVal('tkid') || document.querySelector('#modal input[name=tkid]')?.value; if (!S.kids[kid]) return;
    const old = id ? S.tasks[id] : null, prev = old?.steps || [];
    const steps = $('#tsteps').value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 15).map(x => ({ t: x, done: !!prev.find(p => p.t === x)?.done }));
    const data = { kid, title, kind: radioVal('tkind') || 'bt', subj: $('#tsubj').value.trim(), due: $('#tdue').value || '', notes: $('#tnotes').value.trim(), steps,
      done: !!old?.done, doneAt: old?.doneAt || '' };
    closeModal(); put('tasks', id || uid(), data); UI.learn = UI.view === 'lich-hoc' ? 'bai-tap' : UI.learn;
    return toast(data.due ? `Đã lưu. Hạn nộp: ${dueLabel(data.due)}.` : 'Đã lưu bài tập.');
  }
  if (a === 'task-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('tasks', id); return toast('Đã xoá bài tập.'); }
  if (a === 'task-done') {
    const t = S.tasks[id]; if (!t) return;
    const on = !t.done;
    put('tasks', id, { ...t, done: on, doneAt: on ? key(today()) : '', steps: (t.steps || []).map(x => ({ ...x, done: on ? true : x.done })) });
    if (on) { const left = openTasks(t.kid).filter(x => x.id !== id && x.due && daysTo(x.due) <= 1).length; if (!left) confetti(); return toast(left ? `Xong “${t.title}”. Còn ${left} bài cần nộp sớm.` : `Xong “${t.title}”! 🎉`); }
    return;
  }
  if (a === 'task-step') {
    const t = S.tasks[id]; if (!t) return;
    const steps = (t.steps || []).map((x, i) => i === Number(b.dataset.i) ? { ...x, done: !x.done } : x), all = steps.every(x => x.done);
    put('tasks', id, { ...t, steps, done: all, doneAt: all ? key(today()) : '' });
    if (all) { confetti(); toast(`Xong hết các bước của “${t.title}”!`); }
    return;
  }
  if (a === 'tkb-form') return tkbForm(b.dataset.kid);
  if (a === 'tkb-print') return printTkb(b.dataset.kid);
  if (a === 'tkb-row-add' || a === 'tkb-row-del') {
    const f = readTkbForm(), rows = f.rows;
    if (a === 'tkb-row-add') {
      const last = rows[rows.length - 1], ls = toMin(last?.s), le = toMin(last?.e);
      const len = ls !== null && le !== null && le > ls ? le - ls : 35, s = le !== null ? le + 10 : 7 * 60 + 30;
      rows.push({ s: hm(Math.min(s, 23 * 60)), e: hm(Math.min(s + len, 23 * 60 + 59)), d: {} });
    } else {
      const i = Number(b.dataset.i); rows.splice(i, 1);
      if (f.lunch > i) f.lunch--;
    }
    if (f.lunch >= rows.length) f.lunch = 0;
    return tkbForm(tkbDraft.kid, { ...f, keep: true });
  }
  if (a === 'tkb-save') {
    const kidId = tkbDraft?.kid; if (!kidId || !S.kids[kidId]) return closeModal();
    const f = readTkbForm();
    for (let i = 0; i < f.rows.length; i++) {
      const s = toMin(f.rows[i].s), e = toMin(f.rows[i].e);
      if (s === null || e === null) return toast(`Tiết ${i + 1}: nhập đủ giờ bắt đầu và kết thúc.`);
      if (e <= s) return toast(`Tiết ${i + 1}: giờ kết thúc phải sau giờ bắt đầu.`);
    }
    const lunchRow = f.lunch > 0 ? f.rows[f.lunch] : null;
    f.rows.sort((x, y) => toMin(x.s) - toMin(y.s));
    f.lunch = lunchRow ? f.rows.indexOf(lunchRow) : 0;
    // Chỉ giữ môn của những ngày đang học.
    f.rows = f.rows.map(r => ({ s: r.s, e: r.e, d: Object.fromEntries(Object.entries(r.d).filter(([d]) => f.days.includes(Number(d)))) }));
    delete f.ed;
    closeModal(); put('timetables', kidId, f); UI.tkbKid = kidId;
    return toast(`Đã lưu thời khoá biểu của ${kidName(kidId)}.`);
  }
  if (a === 'tkb-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('timetables', id); return toast('Đã xoá thời khoá biểu.'); }
  if (a === 'lesson-form') return lessonForm(id, b.dataset.kid);
  if (a === 'lesson-save') {
    const name = $('#lname').value.trim(); if (!name) { $('#lname').focus(); return toast('Nhập tên lớp học thêm nhé.'); }
    const kid = radioVal('lkid'), days = [...document.querySelectorAll('#modal input[name=lday]:checked')].map(x => Number(x.value));
    const ls = $('#ls').value, le = $('#le').value;
    if (!kid || !S.kids[kid]) return toast('Chọn con nhé.');
    if (!days.length) return toast('Chọn ít nhất một ngày.');
    if (toMin(ls) === null || toMin(le) === null) return toast('Nhập đủ giờ bắt đầu và kết thúc.');
    if (toMin(le) <= toMin(ls)) return toast('Giờ kết thúc phải sau giờ bắt đầu.');
    const where = radioVal('lwhere'), trip = {}, at = $('#lat').value.trim();
    if (at) trip.at = at;
    if (where === 'home') trip.home = true;
    if (where === 'out') Object.assign(trip, { home: false, go: $('#lgo').value.trim(), back: $('#lback').value.trim() });
    closeModal();
    if (id) put('lessons', id, { kid, day: days[0], s: ls, e: le, name, ...trip });
    else days.forEach(d => put('lessons', uid(), { kid, day: d, s: ls, e: le, name, ...trip }));
    return toast(id ? 'Đã lưu.' : `Đã thêm ${days.length} buổi học thêm cho ${kidName(kid)}.`);
  }
  if (a === 'seed-form') return seedForm();
  if (a === 'seed-forget') { setSeedMem(null); render(); return toast('Máy này không còn nhớ mật khẩu.'); }
  if (a === 'seed-load') {
    const pass = $('#seedpass').value.trim().toLowerCase(); if (!pass) { $('#seedpass').focus(); return toast('Nhập mật khẩu nhé.'); }
    if (!crypto?.subtle) return toast('Trình duyệt này không giải mã được. Mở app bằng đường dẫn https.');
    b.disabled = true; b.textContent = 'Đang mở…';
    const mem = $('#seedmem').checked;
    decryptSeed(pass).then(async ({ json, ver }) => { closeModal(); setSeedMem(mem ? { pass, ver } : null); seedChecked = true; await importData(json); confetti(); render(); })
      .catch(e => {
        b.disabled = false; b.textContent = 'Nạp lịch';
        toast(e.code === 'wrong' ? 'Sai mật khẩu. Thử lại nhé.' : e.code === 'missing' ? 'App chưa có lịch gia đình nào được lưu sẵn.' : 'Không nạp được. Kiểm tra mạng rồi thử lại.');
        if (e.code === 'wrong') { $('#seedpass').select(); }
        if (!['wrong', 'missing'].includes(e.code)) console.error(e);
      });
    return;
  }
  if (a === 'event-form') return eventForm(id, b.dataset.kid);
  if (a === 'year-form') return yearForm();
  if (a === 'event-save') {
    const name = $('#ename').value.trim(); if (!name) { $('#ename').focus(); return toast('Nhập tên mốc nhé.'); }
    const from = $('#efrom').value, to = $('#eto').value;
    if (!from) { $('#efrom').focus(); return toast('Chọn ngày nhé.'); }
    if (to && to < from) return toast('Ngày kết thúc phải sau ngày bắt đầu.');
    const data = { name, icon: radioVal('eico') || '📌', kind: radioVal('ekind') || 'event', from, kids: [...document.querySelectorAll('#modal input[name=ekid]:checked')].map(x => x.value) };
    if (to && to > from) data.to = to;
    closeModal(); put('events', id || uid(), data); return toast('Đã lưu mốc.');
  }
  if (a === 'event-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('events', id); return toast('Đã xoá mốc.'); }
  if (a === 'year-add') {
    const kids = [...document.querySelectorAll('#modal input[name=ykid]:checked')].map(x => x.value), miss = missingYear();
    miss.forEach(e => put('events', uid(), { ...e, kids }));
    closeModal(); return toast(`Đã thêm ${miss.length} mốc ${SAMPLE_YEAR.label}.`);
  }
  if (a === 'stay-form') return stayForm();
  if (a === 'stay-save') {
    for (const d of [0, 1, 2, 3, 4, 5, 6]) {
      const day = $(`#modal [data-sd="${d}"]`).value.trim(), night = $(`#modal [data-sn="${d}"]`).value.trim();
      if (day || night) put('stays', String(d), { day, night }); else if ((S.stays || {})[String(d)]) del('stays', String(d));
    }
    closeModal(); return toast('Đã lưu lịch các con ở đâu.');
  }
  if (a === 'who-fill') { const i = $('#' + b.dataset.t); if (i) i.value = b.dataset.v; return; }
  if (a === 'lesson-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('lessons', id); return toast('Đã xoá buổi học thêm.'); }
  if (a === 'km-open') { const ks = kidsList(); UI.km = { on: true, kid: ks.length === 1 ? ks[0].id : null }; return render(); }
  if (a === 'km-kid') { UI.km.kid = b.dataset.kid || null; return render(); }
  if (a === 'sheet-open') { UI.sheet = true; return render(); }
  if (a === 'print') return printSheet();
  if (a === 'kid-form') return kidForm(id);
  if (a === 'photo-del') { photoEdit = { img: null, out: '' }; const pv = $('#modal .photo-prev'); if (pv) pv.innerHTML = avInner(radioVal('kava')); b.hidden = true; $('#modal .photo-adj').hidden = true; return; }
  if (a === 'chore-form') return choreForm(id);
  if (a === 'price-form') return priceForm(id, b.dataset.kind);
  if (a === 'prices-print') return printPrices();
  if (a === 'coupons-print') return printCoupons();
  if (a === 'goal-form') return goalForm(id, b.dataset.kid);
  if (a === 'goal-save') {
    const name = $('#gname').value.trim(); if (!name) { $('#gname').focus(); return toast('Nhập tên mục tiêu nhé.'); }
    const kid = radioVal('gkid') || document.querySelector('#modal input[name=gkid]')?.value; if (!S.kids[kid]) return;
    const price = Math.max(0, Math.round(Number($('#gprice').value) || 0)); if (!price) { $('#gprice').focus(); return toast('Nhập giá nhé.'); }
    const old = id ? S.goals[id] : null;
    const icon = radioVal('gico') || '🎁';
    closeModal(); put('goals', id || uid(), { ...(old || {}), kid, name, icon, price, order: old ? (old.order ?? 0) : Date.now(), done: !!old?.done });
    UI.acctKid = kid; return toast('Đã lưu mục tiêu.');
  }
  if (a === 'goal-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('goals', id); return toast('Đã xoá mục tiêu.'); }
  if (a === 'goal-up') {
    const g = S.goals[id]; if (!g) return;
    const list = goalsOf(g.kid), i = list.findIndex(x => x.id === id); if (i <= 0) return;
    list.forEach((x, j) => { const o = j === i - 1 ? i : j === i ? i - 1 : j; if ((x.order ?? 0) !== o) { const { id: gid, ...rest } = x; put('goals', gid, { ...S.goals[gid], order: o }); } });
    return;
  }
  if (a === 'goal-buy') {
    const g = S.goals[id]; if (!g) return;
    const p = Number(g.price) || 0, bal = balance(g.kid); if (bal < p) return toast(`Còn thiếu ${money(p - bal)}.`);
    if (!armed(b, `Bấm lần nữa: trừ ${money(p)}`)) return;
    put('ledger', uid(), { kid: g.kid, amount: -p, kind: 'spend', note: `Mua ${g.name} (mục tiêu tiết kiệm)`, icon: g.icon || '🎁', at: new Date().toISOString() });
    put('goals', id, { ...g, done: true, doneAt: key(today()) });
    confetti(); return toast(`${kidName(g.kid)} đã đạt mục tiêu “${g.name}”! 🎉`);
  }
  if (a === 'num-step') { const i = $('#' + b.dataset.t), min = b.dataset.min != null ? Number(b.dataset.min) : 1; i.value = Math.max(min, Math.round(((Number(i.value) || 0) + Number(b.dataset.n)) * 100) / 100); return; }
  if (a === 'acct-go' || a === 'acct-kid') { UI.acctKid = b.dataset.kid; UI.histAll = false; if (a === 'acct-kid') render(); return; }
  if (a === 'hist-all') { UI.histAll = true; return render(); }
  if (a === 'days') { const v = b.dataset.v.split(','); document.querySelectorAll('#modal input[name=cday]').forEach(x => (x.checked = v.includes(x.value))); return; }
  if (a === 'export') return exportBackup();
  if (a === 'copy-invite') {
    const inp = $('#invite');
    const fallback = () => { inp.select(); toast('Đã chọn link, bấm giữ để sao chép.'); };
    if (navigator.clipboard) navigator.clipboard.writeText(inp.value).then(() => toast('Đã sao chép link mời.'), fallback); else fallback();
    return;
  }
  if (a === 'leave') {
    if (!armed(b, 'Bấm lần nữa để rời')) return;
    setFamily(null); location.href = location.pathname; return;
  }
  if (a === 'seed') {
    const kidIds = kidsList().map(k => k.id);
    addSamples(kidIds);
    return toast('Đã thêm việc nhà và bảng giá mẫu.');
  }
  if (a === 'seed-prices') {
    const n = addSamples(kidsList().map(k => k.id));
    return toast(n ? `Đã thêm ${n} mục mẫu. Sửa lại tuỳ ý nhé.` : 'Đã có đủ các mục mẫu.');
  }

  if (a === 'kid-save') {
    const name = $('#kname').value.trim(); if (!name) { $('#kname').focus(); return toast('Nhập tên của con nhé.'); }
    const old = id ? S.kids[id] : null;
    const data = {
      ...(old || {}), name, birthday: $('#kbday').value || '', avatar: radioVal('kava') || '🙂', avatarChosen: true,
      weekBonus: Math.max(0, Math.round(Number($('#kwb').value) || 0)),
      tint: old ? (old.tint ?? 0) : Object.keys(S.kids).length % 6, order: old ? (old.order ?? 0) : Object.keys(S.kids).length,
      since: old?.since || key(today()),
    };
    if (photoEdit.out !== undefined) { if (photoEdit.out) data.photo = photoEdit.out; else delete data.photo; }
    closeModal(); put('kids', id || uid(), data); return toast(old ? 'Đã lưu.' : `Đã thêm ${name}.`);
  }
  if (a === 'kid-del') {
    if (!armed(b, 'Bấm lần nữa để xoá')) return;
    closeModal(); del('kids', id);
    if (S.timetables[id]) del('timetables', id);
    for (const l of Object.entries(S.lessons || {})) if (l[1].kid === id) del('lessons', l[0]);
    for (const [tid, t] of Object.entries(S.tasks || {})) if (t.kid === id) del('tasks', tid);
    for (const [gid, g] of Object.entries(S.goals || {})) if (g.kid === id) del('goals', gid);
    for (const [eid, ev] of Object.entries(S.events || {})) if ((ev.kids || []).includes(id)) put('events', eid, { ...ev, kids: ev.kids.filter(x => x !== id) });
    for (const c of choresList()) if ((c.kids || []).includes(id)) { const { id: cid, ...rest } = c; put('chores', cid, { ...rest, kids: rest.kids.filter(x => x !== id) }); }
    return toast('Đã xoá.');
  }
  if (a === 'chore-save') {
    const name = $('#cname').value.trim(); if (!name) { $('#cname').focus(); return toast('Nhập tên việc nhé.'); }
    const kids = [...document.querySelectorAll('#modal input[name=ckid]:checked')].map(x => x.value);
    const days = [...document.querySelectorAll('#modal input[name=cday]:checked')].map(x => Number(x.value));
    if (!kids.length) return toast('Chọn ít nhất một con.');
    if (!days.length) return toast('Chọn ít nhất một ngày.');
    const old = id ? S.chores[id] : null, time = $('#ctime').value;
    const kind = ['fun', 'extra'].includes(radioVal('ckind')) ? radioVal('ckind') : 'must';
    const data = { name, icon: radioVal('cico') || '✅', money: kind === 'fun' ? 0 : Math.max(0, Math.round(Number($('#cmoney').value) || 0)), kids, days, order: old ? (old.order ?? 0) : Object.keys(S.chores).length,
      kind, slot: radioVal('cslot') || '' };
    if (toMin(time) !== null) { data.time = time; if ($('#cby').checked) data.by = true; }
    const mins = Math.round(Number($('#cmin').value) || 0); if (mins > 0) data.minutes = mins;
    const pw = Number($('#cpw').value) || 0; if (pw) data.perWeek = Math.min(pw, days.length);
    const steps = $('#csteps').value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 12); if (steps.length) data.steps = steps;
    const variants = $('#cvar').value.split(',').map(x => x.trim()).filter(Boolean).slice(0, 7); if (variants.length > 1) data.variants = variants;
    if ($('#cshared').checked) data.shared = true;
    closeModal(); put('chores', id || uid(), data);
    return toast('Đã lưu việc.');
  }
  if (a === 'chore-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('chores', id); return toast('Đã xoá việc.'); }
  if (a === 'price-save') {
    const name = $('#pname').value.trim(); if (!name) { $('#pname').focus(); return toast('Nhập tên nhé.'); }
    const kind = PRICE_KINDS.some(x => x[0] === radioVal('pkind')) ? radioVal('pkind') : 'penalty';
    const data = { name, icon: radioVal('pico') || '•', kind, price: Math.max(0, Math.round(Number($('#pprice').value) || 0)) };
    if (kind === 'penalty' && $('#pall').checked) data.all = true;
    if (kind === 'gift') { const nt = $('#pnote').value.trim(); if (nt) data.note = nt; if ($('#pskip').checked) data.skip = true; }
    if (!data.price && !data.all) { $('#pprice').focus(); return toast('Nhập số tiền nhé.'); }
    closeModal(); put('rewards', id || uid(), data);
    return toast('Đã lưu.');
  }
  if (a === 'price-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('rewards', id); return toast('Đã xoá.'); }
  if (a === 'acct-preset' || a === 'acct-custom') {
    const kid = radioVal('akid') || (S.kids[UI.acctKid] ? UI.acctKid : kidsList()[0]?.id); if (!kid || !S.kids[kid]) return;
    UI.acctKid = kid;
    const bal = balance(kid), at = new Date().toISOString(), who = kidName(kid);
    let e;
    if (a === 'acct-preset') {
      const r = S.rewards[id]; if (!r) return;
      const k = priceKind(r), p = priceVnd(r);
      if (k === 'penalty' && r.all) {
        if (bal <= 0) return toast(`Tài khoản của ${who} đang ${money(bal)}, không còn gì để trừ.`);
        if (!armed(b, `Bấm lần nữa: ${who} mất ${money(bal)}`)) return;
        e = { amount: -bal, kind: 'penalty', note: r.name + ' (mất hết tiền)' };
      } else if (k === 'penalty') e = { amount: -p, kind: 'penalty', note: r.name };
      else if (k === 'fee') {
        const hrs = Math.max(0.25, Math.round((Number($('#ahours')?.value) || 1) * 100) / 100);
        e = { amount: -Math.round(p * hrs), kind: 'fee', note: `${r.name} ${String(hrs).replace('.', ',')} giờ`, qty: hrs };
      } else {
        if (bal < p) return toast(`${who} còn thiếu ${money(p - bal)} để đổi “${r.name}”.`);
        e = { amount: -p, kind: 'reward', note: r.name };
        if (r.skip) {
          const sd = $('#askip')?.value || key(today()), d = parse(sd);
          if (skipOn(kid, d)) return toast(`${who} đã dùng phiếu nghỉ cho ${WDN(d.getDay())} ${dm(d)} rồi.`);
          e.skip = sd; e.note = `${r.name} (${WDN(d.getDay())} ${dm(d)})`;
        }
      }
      e.icon = r.icon || '';
    } else {
      const kind = UI.acctKind, n = Math.max(0, Math.round(Number($('#aamt').value) || 0)), note = $('#anote').value.trim();
      if (!n) { $('#aamt').focus(); return toast('Nhập số tiền nhé.'); }
      if (kind === 'spend' && bal < n) return toast(`${who} chỉ còn ${money(bal)}, chưa đủ để chi ${money(n)}.`);
      e = { amount: kind === 'bonus' ? n : -n, kind: kind === 'bonus' ? 'bonus' : kind === 'spend' ? 'spend' : 'penalty',
        note: note || (kind === 'bonus' ? 'Thưởng thêm' : kind === 'spend' ? 'Chi tiêu' : 'Phạt') };
    }
    put('ledger', uid(), { kid, ...e, at });
    if (e.amount > 0) confetti();
    return toast(`${e.amount > 0 ? 'Đã cộng' : 'Đã trừ'} ${money(Math.abs(e.amount))} ${e.amount > 0 ? 'vào' : 'của'} ${who} (${e.note}). Còn ${money(bal + e.amount)}.`);
  }
  if (a === 'bal-form') return balForm();
  if (a === 'bal-save') {
    const at = new Date().toISOString(), done = [];
    for (const inp of document.querySelectorAll('#modal [data-bal]')) {
      const kid = inp.dataset.bal, v = inp.value.trim(); if (!v || !S.kids[kid]) continue;
      const target = Math.round(Number(v)); if (!Number.isFinite(target)) { inp.focus(); return toast('Số tiền chưa đúng.'); }
      const diff = target - balance(kid); if (!diff) continue;
      put('ledger', uid(), { kid, amount: diff, kind: 'adjust', icon: '🏦', note: `Khớp với tài khoản ngân hàng: ${money(target)}`, at });
      done.push(`${kidName(kid)} ${money(target)}`);
    }
    closeModal();
    return toast(done.length ? `Đã khớp số dư: ${done.join(', ')}.` : 'Số dư đã đúng, không cần đổi.');
  }
  if (a === 'ledger-undo') { if (!armed(b, 'Chắc chưa?')) return; del('ledger', id); return toast('Đã huỷ mục này.'); }
});
document.addEventListener('change', e => {
  if (e.target.name === 'akid') { UI.acctKid = e.target.value; UI.histAll = false; render(); }
  if (e.target.name === 'akind') { UI.acctKind = e.target.value; render(); }
  if (e.target.name === 'planw') { UI.planNext = e.target.value === '1'; drawSheet(); }
  if (e.target.name === 'tmode') { UI.todayMode = e.target.value; render(); }
  if (e.target.name === 'tview') { UI.taskDone = e.target.value === '1'; UI.histAll = false; render(); }
  if (e.target.name === 'ckind') { const f = $('#modal .cmoney-f'); if (f) f.hidden = e.target.value === 'fun'; }
  if (e.target.name === 'pkind') { const f = $('#modal .pall-f'); if (f) f.hidden = e.target.value !== 'penalty'; document.querySelectorAll('#modal .pgift-f').forEach(x => (x.hidden = e.target.value !== 'gift')); }
  if (e.target.name === 'lwhere') { const g = $('#modal .lgo'); if (g) g.hidden = e.target.value !== 'out'; }
  if (e.target.name === 'tkbkid') { UI.tkbKid = e.target.value; render(); }
  if ((e.target.id === 'tsat' || e.target.id === 'tlunch' || e.target.name === 'tday') && tkbDraft && !$('#modal').hidden) tkbForm(tkbDraft.kid, { ...readTkbForm(), keep: true });
  if (e.target.id === 'import-file' && e.target.files[0]) importBackup(e.target.files[0]);
  if (e.target.id === 'kphoto' && e.target.files[0]) photoLoad(e.target.files[0]);
  if (e.target.name === 'kava' && !photoEdit.img && !(photoEdit.out ?? photoOf(S.kids[$('#modal [data-act=kid-save]')?.dataset.id]))) { const pv = $('#modal .photo-prev'); if (pv) pv.innerHTML = avInner(e.target.value); }
});
document.addEventListener('input', e => { if (['pzoom', 'px', 'py'].includes(e.target.id)) photoRender(); });
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('toggle', e => { if (e.target.classList?.contains('extra-g')) UI.extraOpen[e.target.dataset.kid] = e.target.open; }, true);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
  if (e.key === 'Enter' && e.target.id === 'seedpass') $('#modal [data-act="seed-load"]')?.click();
});

// Giữ nút để thoát chế độ cho bé
let holdT = 0;
document.addEventListener('pointerdown', e => {
  const h = e.target.closest('[data-hold]'); if (!h) return;
  h.classList.add('holding');
  holdT = setTimeout(() => { UI.km = { on: false, kid: null }; render(); }, 1200);
});
const cancelHold = () => { clearTimeout(holdT); document.querySelectorAll('.hold.holding').forEach(x => x.classList.remove('holding')); };
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => document.addEventListener(t, cancelHold, true));

// Điều hướng bằng #hash
const viewOf = h => { h = NAV_ALIAS[h] || h; return NAV.some(n => n.id === h) ? h : 'hom-nay'; };
function route() { UI.view = viewOf(location.hash.slice(1)); render(); window.scrollTo(0, 0); }
window.addEventListener('hashchange', route);
window.addEventListener('online', render);
window.addEventListener('offline', render);

// Sang ngày mới khi app để mở qua đêm (ví dụ trên máy tính bảng)
let lastDay = key(today());
setInterval(() => { const k = key(today()); if (k !== lastDay) { if (key(UI.date) === lastDay) UI.date = today(); lastDay = k; render(); } }, 60000);

// ---------- family setup (Firebase) ----------
function newFamilyCode() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const r = crypto.getRandomValues(new Uint8Array(20));
  const s = [...r].map(x => abc[x % abc.length]).join('');
  return s.match(/.{5}/g).join('-');
}
const cleanCode = v => String(v || '').trim().toLowerCase().replace(/^.*[?&]gd=/, '').replace(/[^a-z0-9-]/g, '');
function showSetup(err) {
  $('#shell').hidden = true; $('#tabs').hidden = true;
  const el = $('#setup'); el.hidden = false;
  el.innerHTML = `<div class="setup"><div class="card">${brand()}
    <h1>Mở bảng việc nhà của gia đình</h1>
    <p class="muted" style="margin:0">Máy đầu tiên tạo gia đình mới. Các máy khác mở bằng link mời hoặc nhập mã gia đình.</p>
    ${err ? `<div class="note">${esc(err)}</div>` : ''}
    <button class="btn primary" data-setup="new">Tạo gia đình mới</button>
    <div class="or">hoặc</div>
    <div class="field"><label for="famcode">Mã gia đình</label><input id="famcode" class="input" placeholder="xxxxx-xxxxx-xxxxx-xxxxx" autocomplete="off" autocapitalize="off"></div>
    <button class="btn ghost" data-setup="join">Vào gia đình</button>
  </div></div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-setup]'); if (!b) return;
  if (b.dataset.setup === 'new') { family = newFamilyCode(); }
  else {
    const c = cleanCode($('#famcode').value);
    if (c.length < 20) return toast('Mã gia đình chưa đúng. Hãy dán cả link mời hoặc mã 23 ký tự.');
    family = c;
  }
  setFamily(family);
  $('#setup').hidden = true; $('#shell').hidden = false; $('#tabs').hidden = false;
  startFirebase();
});

async function startFirebase() {
  render();
  try {
    store = await firebaseStore(firebaseConfig, family, (data, meta) => {
      S = data; loaded = true; stale = !!meta.fromCache; render(); autoSeed();
    }, (type, err) => {
      console.error(err);
      if (err?.code === 'permission-denied') toast('Firestore từ chối truy cập. Kiểm tra Rules trong README.');
      stale = true; loaded = true; render();
    });
    store.start();
    setTimeout(() => { if (!loaded) { loaded = true; stale = true; render(); } }, 10000);
  } catch (err) {
    console.error(err);
    const c = err?.code || '';
    const msg = c.includes('operation-not-allowed') || c.includes('admin-restricted')
      ? 'Firebase chưa bật đăng nhập Ẩn danh (Anonymous). Vào Firebase Console → Authentication → Sign-in method để bật.'
      : c.includes('api-key') ? 'apiKey trong js/config.js chưa đúng.'
      : 'Không kết nối được Firebase. Kiểm tra mạng và file js/config.js.';
    showSetup(msg);
  }
}

// ---------- boot ----------
UI.view = viewOf(location.hash.slice(1));
if (firebaseConfig) {
  const q = new URLSearchParams(location.search).get('gd');
  if (q && cleanCode(q).length >= 20) {
    setFamily(cleanCode(q));
    history.replaceState(null, '', location.pathname + location.hash);
  }
  family = getFamily();
  if (family) startFirebase(); else showSetup();
} else {
  store = localStore((data) => { S = data; loaded = true; render(); });
  store.start();
  autoSeed();
}
