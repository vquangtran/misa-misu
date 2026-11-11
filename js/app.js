import { firebaseConfig } from './config.js';
import { COLS, localStore, firebaseStore } from './store.js';

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
const money = n => Math.round(Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.85 5.9 6.5.85-4.75 4.5 1.2 6.45L12 17.2l-5.8 3.1 1.2-6.45L2.65 9.35l6.5-.85z"/></svg>';
const AVATARS = ['🦊', '🐯', '🐼', '🐨', '🦁', '🐸', '🐵', '🦄', '🐲', '🦖', '🐰', '🐱', '🐶', '🐧', '🐳', '🦋'];
const CHORE_ICONS = ['🛏️', '🪥', '🧸', '🍽️', '🪴', '📚', '🎒', '👕', '🧹', '🗑️', '🛁', '🥢', '🐶', '🐟', '🧺', '🍚', '✏️', '🎹'];
const REWARD_ICONS = ['🎬', '🎮', '🌙', '🍦', '🎡', '🧁', '📺', '🛝', '🎁', '🍕', '🧋', '📖', '🚲', '🏊'];
const NAV = [
  { id: 'hom-nay', label: 'Hôm nay', svg: '<path d="M20 6 9 17l-5-5"/>' },
  { id: 'lich-hoc', label: 'Lịch học', svg: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>' },
  { id: 'phan-thuong', label: 'Phần thưởng', svg: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>' },
  { id: 'tien-tieu-vat', label: 'Tiền tiêu vặt', svg: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.2"/><path d="M6 12h.01M18 12h.01"/>' },
  { id: 'gia-dinh', label: 'Gia đình', svg: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>' },
];
// Việc nhà và phần thưởng mẫu, dùng khi gia đình mới chưa có gì.
const SAMPLE_CHORES = [
  { name: 'Gấp chăn, xếp gối', icon: '🛏️', stars: 1, days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Đánh răng sáng và tối', icon: '🪥', stars: 1, days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Soạn và cất cặp sách', icon: '🎒', stars: 1, days: [0, 1, 2, 3, 4] },
  { name: 'Đọc sách 20 phút', icon: '📚', stars: 2, days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Tưới cây', icon: '🪴', stars: 1, days: [0, 6] },
];
const SAMPLE_REWARDS = [
  { name: 'Chọn phim tối thứ Bảy', icon: '🎬', cost: 10 },
  { name: '30 phút chơi game', icon: '🎮', cost: 15 },
  { name: 'Thức khuya thêm 30 phút', icon: '🌙', cost: 20 },
  { name: 'Đi ăn kem', icon: '🍦', cost: 25 },
  { name: 'Đi công viên nước', icon: '🏊', cost: 60 },
];

// Môn học gợi ý khi nhập thời khoá biểu (tiểu học và THCS).
const SUBJECTS = ['Toán', 'Tiếng Việt', 'Ngữ văn', 'Tiếng Anh', 'Khoa học', 'KHTN', 'Lịch sử và Địa lí', 'Đạo đức', 'GDCD', 'Âm nhạc', 'Mĩ thuật',
  'Tin học', 'Công nghệ', 'Giáo dục thể chất', 'Bơi', 'Hoạt động trải nghiệm', 'Sinh hoạt dưới cờ', 'Sinh hoạt lớp', 'Tự học'];
// Thời khoá biểu mẫu: 7 tiết, nghỉ trưa sau tiết 4, Thứ Hai đến Thứ Sáu.
const SAMPLE_PERIODS = [['08:00', '08:35'], ['08:45', '09:20'], ['09:40', '10:15'], ['10:25', '11:00'], ['14:10', '14:45'], ['14:55', '15:30'], ['15:40', '16:15']];

// ---------- state ----------
let S = Object.fromEntries(COLS.map(c => [c, {}]));
const UI = { view: 'hom-nay', date: today(), bonusKid: null, tkbKid: null, km: { on: false, kid: null }, sheet: false };
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
const rewardsList = () => Object.entries(S.rewards).map(([id, r]) => ({ id, ...r })).sort((a, b) => (Number(a.cost) || 0) - (Number(b.cost) || 0));
const choresFor = (kidId, d) => choresList().filter(c => (c.kids || []).includes(kidId) && (c.days || []).includes(d.getDay()));
const isDone = (d, kid, chore) => (Number(S.done[key(d)]?.[kid]?.[chore]) || 0) > 0;
function balance(kidId) {
  let s = 0;
  for (const day of Object.values(S.done)) { const m = day && day[kidId]; if (m) for (const v of Object.values(m)) s += Number(v) || 0; }
  for (const l of Object.values(S.ledger)) if (l.kid === kidId) s += Number(l.delta) || 0;
  return s;
}
function weekStats(kid, ws) {
  let possible = 0, done = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(ws, i); for (const c of choresFor(kid.id, d)) { possible++; if (isDone(d, kid.id, c.id)) done++; } }
  return { possible, done };
}
function weekAmount(kid, ws) {
  const a = Number(kid.allowance) || 0;
  if (kid.mode === 'fixed') return a;
  const { possible, done } = weekStats(kid, ws);
  return possible ? Math.round(a * done / possible / 500) * 500 : 0;
}
const kidName = id => S.kids[id]?.name || 'Bé';
const tintOf = k => 'var(--t' + ((Number(k.tint) || 0) % 6) + ')';
const ava = (k, cls = '') => `<span class="ava ${cls}" style="background:${tintOf(k)}">${esc(k.avatar || '🙂')}</span>`;
function daysLabel(days) {
  const s = [...(days || [])].sort();
  if (s.length === 7) return 'mỗi ngày';
  if (s.join() === '1,2,3,4,5') return 'ngày thường';
  if (s.join() === '0,6') return 'cuối tuần';
  if (!s.length) return 'chưa chọn ngày';
  return WEEK_ORDER.filter(d => s.includes(d)).map(d => WDS[d]).join(', ');
}
const modeLabel = k => `${money(k.allowance)} mỗi tuần, ${k.mode === 'fixed' ? 'luôn được nhận' : 'tính theo việc đã làm'}`;
function ageOf(k, at = today()) {
  if (!k.birthday) return null;
  const b = parse(k.birthday);
  let a = at.getFullYear() - b.getFullYear();
  if (at.getMonth() < b.getMonth() || (at.getMonth() === b.getMonth() && at.getDate() < b.getDate())) a--;
  return a >= 0 ? a : null;
}
const isBirthday = (k, d) => { if (!k.birthday) return false; const b = parse(k.birthday); return b.getDate() === d.getDate() && b.getMonth() === d.getMonth(); };
const bdayChip = (k, d) => isBirthday(k, d) ? `<span class="chip" style="background:var(--star-soft);color:var(--ink)">🎂 Sinh nhật ${ageOf(k, d)} tuổi</span>` : '';

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
// Buổi học tiếp theo sau ngày d (trong vòng 7 ngày).
function nextSchool(t, d) {
  for (let i = 1; i <= 7; i++) { const x = addDays(d, i), info = schoolDay(t, x.getDay()); if (info) return { date: x, info, label: i === 1 ? 'Ngày mai' : WDN(x.getDay()) }; }
  return null;
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
  const k = kidName(t.l.kid), w = String(t.who || '').trim();
  if (!w) return t.kind === 'go' ? `Chưa có người đưa ${k} đi ${t.l.name}` : `Chưa có người đón ${k} (${t.l.name})`;
  if (/^tự/i.test(w)) return t.kind === 'go' ? `${k} tự đi ${t.l.name}` : `${k} tự về`;
  if (isRide(w)) return t.kind === 'go' ? `${k} đi ${w} tới ${t.l.name}` : `${k} về bằng ${w}`;
  return t.kind === 'go' ? `${w} đưa ${k} đi ${t.l.name}` : `${w} đón ${k} (${t.l.name})`;
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
const placeTxt = l => l.home === true ? '🏠 Ở nhà' : l.home === false
  ? `${l.go ? whoIcon(l.go) + ' Đi: ' + esc(l.go) : '⚠️ Chưa có người đưa'} · ${l.back ? 'Về: ' + esc(l.back) : '⚠️ chưa có người đón'}` : '';
const lessonChips = list => list.map(l => `<span class="sj-chip sj${subjTint(l.name)}">${lessonIcon(l.name)} ${esc(l.s)} ${esc(l.name)}${l.home === true ? ' · ở nhà' : l.home === false && l.go ? ` · ${whoIcon(l.go)} ${esc(/^tự/i.test(l.go) ? 'tự đi' : isRide(l.go) ? 'đi ' + l.go : l.go + ' đưa')}` : ''}</span>`).join('');

// Dòng ngắn "hôm nay ở trường" cho màn Hôm nay và chế độ cho bé.
function schoolNow(k, d, isToday) {
  const t = tkbOf(k.id); if (!t) return null;
  const info = schoolDay(t, d.getDay());
  if (info && !(isToday && nowMin() >= toMin(info.end))) return { title: `Ở trường ${info.start} – ${info.end}`, subjects: info.subjects };
  if (!isToday) return null;
  const nx = nextSchool(t, d);
  return nx ? { title: `Soạn cặp cho ${nx.label === 'Ngày mai' ? 'ngày mai' : nx.label}`, subjects: nx.info.subjects, bag: true } : null;
}

// ---------- rendering ----------
let raf = 0;
const render = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
function draw() {
  const navHtml = cls => NAV.map(n => `<a href="#${n.id}" class="${cls} ${UI.view === n.id ? 'on' : ''}" ${UI.view === n.id ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${n.svg}</svg><span>${n.label}</span></a>`).join('');
  $('#rail').innerHTML = brand() + navHtml('');
  $('#tabs').innerHTML = navHtml('tab');
  const body = !loaded ? loading() : ({ 'hom-nay': viewToday, 'lich-hoc': viewSchedule, 'phan-thuong': viewRewards, 'tien-tieu-vat': viewAllowance, 'gia-dinh': viewFamily }[UI.view] || viewToday)();
  $('#app').innerHTML = topbar() + body;
  drawKidMode();
  if (UI.sheet) drawSheet();
  const on = $('#app .tkb th.on');
  if (on) { const w = on.closest('.tbl-wrap'); if (w.scrollWidth > w.clientWidth) w.scrollLeft = Math.max(0, on.offsetLeft - 112); }
}
const brand = () => `<div class="brand"><span class="brand-mark">${STAR}</span>Bé Chăm Ngoan</div>`;
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
  <div class="row" style="justify-content:center;margin-top:10px"><button class="btn primary" data-act="kid-form">Thêm con</button></div></div>`;
}

function viewToday() {
  const d = UI.date, t = today(), isT = key(d) === key(t), future = d > t;
  const label = `${WD[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}`;
  const kids = kidsList();
  let h = `<div class="head"><h1>${isT ? 'Việc hôm nay' : future ? 'Việc sắp tới' : 'Việc ngày ' + dm(d)}</h1></div>
  <div class="row" style="justify-content:space-between">
    <div class="daynav">
      <button class="iconbtn" data-act="day" data-n="-1" aria-label="Ngày trước"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>
      <b>${label}</b>
      <button class="iconbtn" data-act="day" data-n="1" aria-label="Ngày sau"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button>
      ${isT ? '' : '<button class="chip" style="border:0" data-act="day" data-n="0">Về hôm nay</button>'}
    </div>
  </div>
  <div class="row"><button class="btn primary" data-act="km-open" ${kids.length ? '' : 'disabled'}>Chế độ cho bé</button><button class="btn ghost" data-act="sheet-open" ${kids.length ? '' : 'disabled'}>Bảng dán tủ lạnh</button></div>`;
  if (!kids.length) return h + noKids();
  if (future) h += `<div class="note">Đây là ngày chưa tới, các con chưa thể đóng dấu.</div>`;
  for (const k of kids) {
    const list = choresFor(k.id, d);
    const n = list.filter(c => isDone(d, k.id, c.id)).length;
    const pct = list.length ? Math.round(n / list.length * 100) : 0;
    h += `<section class="card"><div class="kid-head">${ava(k)}<div class="kid-name">${esc(k.name)}</div>${bdayChip(k, d)}<span class="stars num" title="Số sao hiện có">${STAR}${balance(k.id)}</span></div>`;
    const sc = schoolNow(k, d, isT);
    if (sc) h += `<a class="school-line" href="#lich-hoc" data-act="tkb-go" data-kid="${k.id}"><b>${sc.bag ? '🎒' : '🏫'} ${esc(sc.title)}:</b> ${esc(sc.subjects.join(', '))}</a>`;
    const lt = lessonsOn(k.id, d.getDay());
    if (lt.length) h += `<a class="school-line" href="#lich-hoc" data-act="tkb-go" data-kid="${k.id}"><b>📚 Học thêm:</b> ${lt.map(l => `${esc(l.name)} ${esc(l.s)} – ${esc(l.e)}${l.home === true ? ' (ở nhà)' : l.home === false ? ` (${l.go ? 'đi: ' + esc(l.go) : 'chưa có người đưa'}, ${l.back ? 'về: ' + esc(l.back) : 'chưa có người đón'})` : ''}`).join(', ')}</a>`;
    if (!list.length) { h += `<p class="muted" style="margin:12px 0 0">Hôm nay ${esc(k.name)} không có việc nào. Nghỉ ngơi thôi!</p></section>`; continue; }
    h += `<div class="prog"><div class="bar ${n === list.length ? 'full' : ''}"><b style="width:${pct}%"></b></div><span class="num">${n} / ${list.length} việc xong</span></div><div class="list">`;
    for (const c of list) {
      const on = isDone(d, k.id, c.id);
      h += `<div class="item ${on ? 'done' : ''}"><span class="ico">${esc(c.icon || '✅')}</span><div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${c.stars || 1} sao</div></div>
      <button class="stamp ${on ? 'on' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" ${future ? 'disabled' : ''} aria-pressed="${on}" aria-label="${on ? 'Bỏ dấu' : 'Đóng dấu'}: ${esc(c.name)}">${STAR}</button></div>`;
    }
    h += `</div></section>`;
  }
  return h;
}

function viewSchedule() {
  const kids = kidsList();
  let h = `<div class="head"><h1>Lịch học</h1><p>Lịch ở trường và lịch học thêm, phần chiếm nhiều thời gian nhất trong tuần của các con.</p></div>`;
  if (!kids.length) return h + noKids();
  // Nhiều con thì mặc định xem cả nhà, để thấy ngay giờ nào cần đưa đón hai nơi.
  const all = kids.length > 1 && (UI.tkbKid === 'all' || !S.kids[UI.tkbKid]);
  const k = all ? null : kids.find(x => x.id === UI.tkbKid) || kids[0];
  if (kids.length > 1) h += `<div class="seg"><label><input type="radio" name="tkbkid" value="all" ${all ? 'checked' : ''}><span>👨‍👩‍👧 Cả nhà</span></label>${kids.map(x => `<label><input type="radio" name="tkbkid" value="${x.id}" ${x.id === k?.id ? 'checked' : ''}><span>${esc(x.avatar)} ${esc(x.name)}</span></label>`).join('')}</div>`;
  return h + (all ? familyWeek(kids) : kidSchedule(k));
}

function kidSchedule(k) {
  const t = tkbOf(k.id), td = today(), wd = td.getDay(), now = nowMin();
  let h = '';
  if (!t && lessonsOf(k.id).length) {
    h += `<section class="card"><div class="kid-head"><span class="ico" style="font-size:28px">🏫</span><div class="txt" style="flex:1"><b>Lịch ở trường</b><div class="muted small">Chưa có thời khoá biểu ở trường của ${esc(k.name)}.</div></div><button class="btn ghost sm" data-act="tkb-form" data-kid="${k.id}">Tạo</button></div></section>`;
  } else if (!t) {
    h += `<section class="card empty" style="padding:20px 18px"><div class="big">🏫</div><h2>Chưa có thời khoá biểu ở trường của ${esc(k.name)}</h2>
    <p class="muted">Nhập các tiết học một lần. App sẽ cho biết hôm nay con học những môn gì, và tối nay cần soạn cặp cho môn nào.</p>
    <div class="row" style="justify-content:center;margin-top:10px"><button class="btn primary" data-act="tkb-form" data-kid="${k.id}">Tạo thời khoá biểu</button></div></section>`;
  } else {
    const info = schoolDay(t, wd);
    let line;
    if (info && now < toMin(info.end)) {
      const cur = info.list.find(x => toMin(x.s) <= now && now < toMin(x.e));
      line = `<div><b>Hôm nay ${esc(k.name)} học ${info.list.length} tiết</b>, ${esc(info.start)} – ${esc(info.end)}.${cur ? ` Đang học: <b>${esc(cur.subj)}</b> (tiết ${cur.i + 1}).` : ''}</div>`;
    } else {
      const nx = nextSchool(t, td);
      line = nx ? `<div><b>${info ? 'Hôm nay đã tan học.' : 'Hôm nay không đi học.'}</b> ${esc(nx.label)} có:</div><div class="sj-list">${subjChips(nx.info.subjects)}</div>` : '<div>Chưa có tiết nào trong thời khoá biểu.</div>';
    }
    h += `<section class="card tkb-card"><div class="kid-head">${ava(k, 'sm')}<div><div class="kid-name" style="font-size:21px">${esc(t.cls || k.name)}</div>${t.year ? `<div class="muted small">Năm học ${esc(t.year)}</div>` : ''}</div>
      <div class="acts" style="margin-left:auto"><button class="btn ghost sm" data-act="tkb-form" data-kid="${k.id}">Sửa</button><button class="btn ghost sm" data-act="tkb-print" data-kid="${k.id}">In</button></div></div>
      <div class="tkb-today">${line}</div>
      ${tkbTable(t, info ? wd : null)}</section>`;
  }
  // Học thêm
  const ls = lessonsOf(k.id);
  h += `<div class="sec-title">Học thêm</div><div class="row"><button class="btn primary" data-act="lesson-form" data-kid="${k.id}">Thêm buổi học thêm</button></div>`;
  if (ls.length) {
    h += `<section class="card"><div class="list">${WEEK_ORDER.filter(d => ls.some(l => l.day === d)).map(d =>
      `<div class="day-sep ${d === wd ? 'on' : ''}">${WDN(d)}${d === wd ? ' · hôm nay' : ''}</div>${ls.filter(l => l.day === d).map(l => lessonItem(l)).join('')}`).join('')}</div></section>`;
  } else h += `<p class="muted" style="margin:0">Chưa có buổi học thêm nào. Ví dụ: Tiếng Anh, Thứ 2 từ 17:30 đến 19:30.</p>`;
  // Thống kê tuần
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

// Cả nhà: lịch học thêm của các con theo từng ngày, kèm lịch đưa đón và cảnh báo.
function familyWeek(kids) {
  const wd = today().getDay(), all = lessonsList();
  let h = `<div class="row"><button class="btn primary" data-act="lesson-form">Thêm buổi học thêm</button></div>`;
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
    return `<div class="day-sep ${d === wd ? 'on' : ''}">${WDN(d)}${d === wd ? ' · hôm nay' : ''}</div>${warn.map(c => `<div class="clash">⚠️ ${esc(c)}</div>`).join('')}${dl.map(l => lessonItem(l, true)).join('')}
      ${tr.some(t => t.who) ? `<div class="trips"><b>Đưa đón</b>${tr.filter(t => t.who).map(t => `<div><span class="num">${hm(t.t)}</span> ${whoIcon(t.who)} ${esc(tripText(t))}</div>`).join('')}</div>` : ''}`;
  }).join('')}</div></section>`;
  return h;
}
function lessonItem(l, who = false) {
  const k = S.kids[l.kid] ? { id: l.kid, ...S.kids[l.kid] } : null;
  return `<div class="item">${who && k ? ava(k, 'sm') : `<span class="ico">${lessonIcon(l.name)}</span>`}<div class="txt"><div class="t">${who && k ? `${esc(k.name)} · ` : ''}${esc(l.name)}</div><div class="s num">${esc(l.s)} – ${esc(l.e)} · ${durTxt(lessonMin(l))}</div>${placeTxt(l) ? `<div class="s">${placeTxt(l)}</div>` : ''}</div>
    <div class="acts"><button class="btn ghost sm" data-act="lesson-form" data-id="${l.id}">Sửa</button></div></div>`;
}

function viewRewards() {
  const kids = kidsList();
  let h = `<div class="head"><h1>Phần thưởng</h1><p>Các con đổi sao lấy phần thưởng do bố mẹ chọn.</p></div>`;
  if (!kids.length) return h + noKids();
  h += `<div class="tiles">${kids.map(k => `<div class="tile"><span class="who">${ava(k, 'sm')}${esc(k.name)}</span><span class="stars num">${STAR}${balance(k.id)}</span></div>`).join('')}</div>
  <div class="row"><button class="btn primary" data-act="reward-form">Thêm phần thưởng</button></div>`;
  const rs = rewardsList();
  h += `<section class="card">`;
  if (!rs.length) h += `<p class="muted" style="margin:0">Chưa có phần thưởng nào. Ví dụ: “Đi ăn kem” đổi 25 sao.</p>`;
  else h += `<div class="list">${rs.map(r => `<div class="item"><span class="ico">${esc(r.icon || '🎁')}</span><div class="txt"><div class="t">${esc(r.name)}</div><div class="s num">${r.cost} sao</div></div>
    <div class="acts"><button class="btn primary sm" data-act="trade" data-id="${r.id}">Đổi sao</button><button class="btn ghost sm" data-act="reward-form" data-id="${r.id}">Sửa</button></div></div>`).join('')}</div>`;
  h += `</section>`;
  const bk = S.kids[UI.bonusKid] ? UI.bonusKid : kids[0].id;
  h += `<section class="card" style="display:flex;flex-direction:column;gap:14px"><h2>Thưởng thêm hoặc trừ sao</h2>
    <div class="field"><span class="lbl">Con</span><div class="seg">${kids.map(k => `<label><input type="radio" name="bkid" value="${k.id}" ${k.id === bk ? 'checked' : ''}><span>${esc(k.avatar)} ${esc(k.name)}</span></label>`).join('')}</div></div>
    <div class="field"><label for="bamt">Số sao</label><div class="stepper"><button class="iconbtn" data-act="step" data-t="bamt" data-n="-1" aria-label="Bớt">−</button><input id="bamt" class="input num" type="number" min="1" max="100" value="2" inputmode="numeric"><button class="iconbtn" data-act="step" data-t="bamt" data-n="1" aria-label="Thêm">+</button></div></div>
    <div class="field"><label for="breason">Lý do</label><input id="breason" class="input" maxlength="80" placeholder="Ví dụ: Tự giác giúp mẹ nấu cơm"></div>
    <div class="row"><button class="btn primary" data-act="bonus" data-sign="1">Thưởng sao</button><button class="btn danger" data-act="bonus" data-sign="-1">Trừ sao</button></div>
  </section>`;
  const hist = Object.entries(S.ledger).map(([id, l]) => ({ id, ...l })).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 25);
  h += `<section class="card hist"><h2>Lịch sử</h2>`;
  if (!hist.length) h += `<p class="muted" style="margin:8px 0 0">Mỗi lần đổi quà, thưởng hay trừ sao sẽ được ghi ở đây.</p>`;
  else h += `<div class="list" style="margin-top:6px">${hist.map(l => {
    const plus = (Number(l.delta) || 0) > 0, dt = l.at ? new Date(l.at) : null;
    const kindTxt = l.kind === 'reward' ? 'Đổi quà' : plus ? 'Thưởng' : 'Trừ sao';
    return `<div class="item"><span class="ico">${l.kind === 'reward' ? esc(l.icon || '🎁') : plus ? '⭐' : '⚠️'}</span><div class="txt"><div class="t">${esc(kidName(l.kid))} · ${kindTxt}</div><div class="s">${esc(l.note || '')}${dt ? ` · ${dm(dt)} ${pad(dt.getHours())}:${pad(dt.getMinutes())}` : ''}</div></div>
    <div class="acts"><span class="delta num ${plus ? 'plus' : 'minus'}">${plus ? '+' : ''}${l.delta}</span><button class="btn ghost sm" data-act="ledger-undo" data-id="${l.id}">Huỷ</button></div></div>`;
  }).join('')}</div>`;
  return h + `</section>`;
}

function viewAllowance() {
  const kids = kidsList(), t = today(), ws0 = weekStart(t);
  let h = `<div class="head"><h1>Tiền tiêu vặt</h1><p>Mỗi tuần (Thứ Hai đến Chủ nhật) kết thúc sẽ hiện số tiền cần trả. Bấm “Đã trả” khi bố mẹ đưa tiền cho con.</p></div>`;
  if (!kids.length) return h + noKids();
  for (const k of kids) {
    const start = weekStart(k.since ? parse(k.since) : t);
    const weeks = [];
    for (let ws = addDays(ws0, -7), i = 0; ws >= start && i < 8; ws = addDays(ws, -7), i++) weeks.push(ws);
    let owed = 0;
    const rows = weeks.map(ws => {
      const p = S.paid[k.id + '_' + key(ws)], amt = p ? Number(p.amount) || 0 : weekAmount(k, ws);
      if (!p) owed += amt;
      return `<div class="item"><div class="txt"><div class="t">Tuần ${dm(ws)} – ${dm(addDays(ws, 6))}</div><div class="s">${p ? 'Đã trả ngày ' + dm(parse(p.paidAt)) : 'Chưa trả'}</div></div>
      <div class="acts"><span class="amt num">${money(amt)}</span>${p ? `<button class="btn ghost sm" data-act="unpay" data-kid="${k.id}" data-w="${key(ws)}">Hoàn tác</button>` : `<button class="btn primary sm" data-act="pay" data-kid="${k.id}" data-w="${key(ws)}" data-a="${amt}">Đã trả</button>`}</div></div>`;
    }).join('');
    const st = weekStats(k, ws0);
    h += `<section class="card"><div class="kid-head">${ava(k, 'sm')}<div class="kid-name" style="font-size:21px">${esc(k.name)}</div><span class="badge ${owed ? 'owe' : 'ok'} num">${owed ? 'Còn nợ ' + money(owed) : 'Đã trả đủ'}</span></div>
    <p class="muted" style="margin:6px 0 4px">${modeLabel(k)}</p><div class="list">
    <div class="item"><div class="txt"><div class="t">Tuần này (${dm(ws0)} – ${dm(addDays(ws0, 6))})</div><div class="s num">Tính đến hôm nay${k.mode === 'fixed' ? '' : ` · đã xong ${st.done}/${st.possible} việc`}</div></div><span class="amt num">${money(weekAmount(k, ws0))}</span></div>
    ${rows || `<div class="item"><p class="muted small" style="margin:0">Tuần đầu tiên sẽ hiện ở đây sau Chủ nhật.</p></div>`}
    </div></section>`;
  }
  return h;
}

const inviteLink = () => location.origin + location.pathname + '?gd=' + encodeURIComponent(family);

function viewFamily() {
  const kids = kidsList(), chores = choresList();
  let h = `<div class="head"><h1>Gia đình</h1><p>Cài đặt một lần: các con, việc nhà và tiền tiêu vặt.</p></div>
  <div class="sec-title">Các con</div><div class="row"><button class="btn primary" data-act="kid-form">Thêm con</button></div>`;
  h += kids.length ? `<section class="card"><div class="list">${kids.map(k => `<div class="item">${ava(k, 'sm')}<div class="txt"><div class="t">${esc(k.name)}</div><div class="s">${ageOf(k) !== null ? `${ageOf(k)} tuổi (sinh ${dm(parse(k.birthday))}/${parse(k.birthday).getFullYear()}) · ` : ''}${modeLabel(k)}</div></div><div class="acts"><button class="btn ghost sm" data-act="kid-form" data-id="${k.id}">Sửa</button></div></div>`).join('')}</div></section>`
    : `<p class="muted" style="margin:0">Chưa có con nào.</p>`;
  h += `<div class="sec-title">Việc nhà</div><div class="row"><button class="btn primary" data-act="chore-form" ${kids.length ? '' : 'disabled'}>Thêm việc</button><button class="btn ghost" data-act="sheet-open" ${kids.length ? '' : 'disabled'}>Bảng dán tủ lạnh</button></div>`;
  if (chores.length) h += `<section class="card"><div class="list">${chores.map(c => `<div class="item"><span class="ico">${esc(c.icon || '✅')}</span><div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${c.stars || 1} sao · ${(c.kids || []).map(kidName).map(esc).join(', ') || 'chưa giao cho ai'} · ${daysLabel(c.days)}</div></div><div class="acts"><button class="btn ghost sm" data-act="chore-form" data-id="${c.id}">Sửa</button></div></div>`).join('')}</div></section>`;
  else if (kids.length) h += `<section class="card"><p class="muted" style="margin:0 0 10px">Chưa có việc nào. Bắt đầu nhanh với ${SAMPLE_CHORES.length} việc và ${SAMPLE_REWARDS.length} phần thưởng mẫu, sửa lại sau cũng được.</p><button class="btn quiet" data-act="seed">Dùng việc nhà mẫu</button></section>`;
  else h += `<p class="muted" style="margin:0">Chưa có việc nào. Thêm con trước rồi giao việc.</p>`;

  h += `<div class="sec-title">Chia sẻ và sao lưu</div><section class="card" style="display:flex;flex-direction:column;gap:14px">`;
  if (store?.kind === 'firebase') {
    h += `<div class="field"><label for="invite">Link mời người nhà</label>
      <div class="copyrow"><input id="invite" class="input" readonly value="${esc(inviteLink())}"><button class="btn primary sm" data-act="copy-invite">Sao chép</button></div>
      <span class="muted small">Gửi link này cho bố/mẹ hoặc mở trên máy tính bảng của con. Ai có link đều xem và sửa được bảng của nhà mình, nên chỉ gửi cho người trong nhà.</span></div>`;
  } else {
    h += `<div class="note">Dữ liệu đang lưu trên trình duyệt của máy này. Muốn đồng bộ giữa điện thoại của bố, mẹ và máy của con, hãy bật Firebase theo hướng dẫn trong README của repo.</div>`;
  }
  h += `<div class="row"><button class="btn ghost" data-act="export">Tải bản sao lưu</button><label class="btn ghost file-btn">Nhập từ file sao lưu<input type="file" id="import-file" accept=".json,application/json"></label>
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
    <div class="who-grid">${kids.map(k => `<button class="who-btn" data-act="km-kid" data-kid="${k.id}">${ava(k)}<b>${esc(k.name)}</b><span class="stars num">${STAR}${balance(k.id)}</span></button>`).join('')}</div></div>`;
    return;
  }
  const list = choresFor(k.id, t), n = list.filter(c => isDone(t, k.id, c.id)).length;
  const sc = schoolNow(k, t, true);
  const lt = lessonsOn(k.id, t.getDay()).filter(l => toMin(l.e) > nowMin());
  const school = (sc ? `<div class="km-school"><div class="t">${sc.bag ? '🎒' : '🏫'} ${esc(sc.title)}</div><div class="sj-list">${subjChips(sc.subjects)}</div></div>` : '')
    + (lt.length ? `<div class="km-school"><div class="t">📚 Học thêm hôm nay</div><div class="sj-list">${lessonChips(lt)}</div></div>` : '');
  el.innerHTML = `<div class="wrap"><div class="km-top"><button class="btn quiet" data-act="km-kid" data-kid="">← Đổi bạn</button>${hold}</div>
  <div class="kid-head">${ava(k)}<div><div class="kid-name" style="font-size:32px">${isBirthday(k, t) ? `Chúc mừng sinh nhật ${esc(k.name)}! 🎂` : `Chào ${esc(k.name)}!`}</div><div class="muted">${WD[t.getDay()]}, ${t.getDate()} tháng ${t.getMonth() + 1}</div></div><span class="stars num" style="margin-left:auto;font-size:30px">${STAR}${balance(k.id)}</span></div>
  ${list.length ? `<div class="prog"><div class="bar ${n === list.length ? 'full' : ''}"><b style="width:${Math.round(n / list.length * 100)}%"></b></div><span class="num">${n} / ${list.length}</span></div>` : ''}
  ${school}
  ${list.length && n === list.length ? `<div class="cheer">Giỏi quá! Hôm nay con làm xong hết rồi 🎉</div>` : ''}
  <div class="big-list">${list.length ? list.map(c => { const on = isDone(t, k.id, c.id); return `<button class="big-item ${on ? 'done' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" data-km="1" aria-pressed="${on}"><span class="ico">${esc(c.icon || '✅')}</span><span><span class="t">${esc(c.name)}</span><br><span class="s">${c.stars || 1} sao</span></span><span class="stamp ${on ? 'on' : ''}">${STAR}</span></button>`; }).join('')
    : `<div class="card empty"><div class="big">🎈</div><h2>${school ? 'Hôm nay con không có việc nhà nào.' : 'Hôm nay con được nghỉ!'}</h2></div>`}</div></div>`;
}

// ---------- printable sheet ----------
function sheetTables() {
  const ws = weekStart(today());
  return kidsList().map(k => {
    const cs = choresList().filter(c => (c.kids || []).includes(k.id));
    return `<h3 style="margin:18px 0 8px;font-size:20px">${esc(k.avatar)} ${esc(k.name)}</h3>
    <div class="tbl-wrap"><table class="ptable"><thead><tr><th>Việc</th>${WEEK_ORDER.map((d, i) => `<th>${WDS[d]}<br><span style="font-weight:400;font-size:12px">${dm(addDays(ws, i))}</span></th>`).join('')}</tr></thead><tbody>
    ${cs.length ? cs.map(c => `<tr><td>${esc(c.icon || '')} ${esc(c.name)} <span style="opacity:.6">(${c.stars || 1}★)</span></td>${WEEK_ORDER.map(d => (c.days || []).includes(d) ? '<td><span class="box"></span></td>' : '<td class="off"></td>').join('')}</tr>`).join('')
      : '<tr><td colspan="8">Chưa có việc nào.</td></tr>'}
    </tbody></table></div>`;
  }).join('');
}
function drawSheet() {
  const ws = weekStart(today());
  openModal(`<h2>Bảng dán tủ lạnh</h2><p class="muted" style="margin:-8px 0 0">Tuần ${dm(ws)} – ${dm(addDays(ws, 6))}. Ô trống là ngày có việc, con tự đánh dấu khi làm xong.</p>
  <div>${sheetTables()}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Đóng</button><button class="btn primary" data-act="print">In bảng</button></div>`, true);
}
function printSheet() {
  const ws = weekStart(today());
  printHtml(`<h1 style="font-family:var(--display);margin:0">Bé Chăm Ngoan</h1><div>Tuần ${dm(ws)} – ${dm(addDays(ws, 6))} · Đánh dấu ô khi làm xong việc</div>${sheetTables()}`);
}
function printTkb(kidId) {
  const k = S.kids[kidId], t = tkbOf(kidId); if (!k || !t) return;
  const st = tkbStats(t);
  printHtml(`<h1 style="font-family:var(--display);margin:0;text-align:center;font-size:34px">Thời khoá biểu</h1>
    <div style="text-align:center;font-size:18px;margin-bottom:12px">${esc(k.avatar)} ${esc(k.name)}${t.cls ? ' · ' + esc(t.cls) : ''}${t.year ? ' · Năm học ' + esc(t.year) : ''}</div>
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

function kidForm(id) {
  const k = id ? S.kids[id] : null;
  openModal(`<h2>${k ? 'Sửa thông tin con' : 'Thêm con'}</h2>
  <div class="field"><label for="kname">Tên</label><input id="kname" class="input" maxlength="30" value="${esc(k?.name || '')}" placeholder="Ví dụ: Bin"></div>
  <div class="field"><label for="kbday">Ngày sinh</label><input id="kbday" class="input" type="date" value="${esc(k?.birthday || '')}"></div>
  <div class="field"><span class="lbl">Hình đại diện</span>${pickGrid('kava', AVATARS, k?.avatar)}</div>
  <div class="field"><label for="kallow">Tiền tiêu vặt mỗi tuần (đồng)</label><input id="kallow" class="input num" type="number" min="0" step="1000" inputmode="numeric" value="${k ? (Number(k.allowance) || 0) : 30000}"></div>
  <div class="field"><span class="lbl">Cách tính</span><div class="seg">
    <label><input type="radio" name="kmode" value="chores" ${k?.mode !== 'fixed' ? 'checked' : ''}><span>Theo việc đã làm</span></label>
    <label><input type="radio" name="kmode" value="fixed" ${k?.mode === 'fixed' ? 'checked' : ''}><span>Luôn được nhận đủ</span></label></div>
    <span class="muted small">“Theo việc đã làm”: làm 8/10 việc trong tuần thì nhận 80% tiền.</span></div>
  <div class="foot">${k ? `<button class="btn danger left" data-act="kid-del" data-id="${id}">Xoá</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="kid-save" data-id="${id || ''}">Lưu</button></div>`);
}
function choreForm(id) {
  const c = id ? S.chores[id] : null, kids = kidsList();
  const ck = c ? (c.kids || []) : kids.map(k => k.id), days = c ? (c.days || []) : [0, 1, 2, 3, 4, 5, 6];
  openModal(`<h2>${c ? 'Sửa việc' : 'Thêm việc nhà'}</h2>
  <div class="field"><label for="cname">Tên việc</label><input id="cname" class="input" maxlength="40" value="${esc(c?.name || '')}" placeholder="Ví dụ: Gấp quần áo"></div>
  <div class="field"><span class="lbl">Biểu tượng</span>${pickGrid('cico', CHORE_ICONS, c?.icon)}</div>
  <div class="field"><span class="lbl">Số sao nhận được</span><div class="seg">${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="cstars" value="${n}" ${(c?.stars || 1) === n ? 'checked' : ''}><span>${n} ★</span></label>`).join('')}</div></div>
  <div class="field"><span class="lbl">Giao cho</span><div class="seg">${kids.map(k => `<label><input type="checkbox" name="ckid" value="${k.id}" ${ck.includes(k.id) ? 'checked' : ''}><span>${esc(k.avatar)} ${esc(k.name)}</span></label>`).join('')}</div></div>
  <div class="field"><span class="lbl">Những ngày</span><div class="seg">${WEEK_ORDER.map(d => `<label><input type="checkbox" name="cday" value="${d}" ${days.includes(d) ? 'checked' : ''}><span>${WDS[d]}</span></label>`).join('')}</div>
    <div class="row"><button class="btn quiet sm" data-act="days" data-v="0,1,2,3,4,5,6">Mỗi ngày</button><button class="btn quiet sm" data-act="days" data-v="1,2,3,4,5">Ngày thường</button><button class="btn quiet sm" data-act="days" data-v="0,6">Cuối tuần</button></div></div>
  <div class="foot">${c ? `<button class="btn danger left" data-act="chore-del" data-id="${id}">Xoá</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="chore-save" data-id="${id || ''}">Lưu</button></div>`);
}
function rewardForm(id) {
  const r = id ? S.rewards[id] : null;
  openModal(`<h2>${r ? 'Sửa phần thưởng' : 'Thêm phần thưởng'}</h2>
  <div class="field"><label for="rname">Phần thưởng</label><input id="rname" class="input" maxlength="40" value="${esc(r?.name || '')}" placeholder="Ví dụ: Đi ăn kem"></div>
  <div class="field"><span class="lbl">Biểu tượng</span>${pickGrid('rico', REWARD_ICONS, r?.icon)}</div>
  <div class="field"><label for="rcost">Cần bao nhiêu sao</label><div class="stepper"><button class="iconbtn" data-act="step" data-t="rcost" data-n="-5" aria-label="Bớt 5">−</button><input id="rcost" class="input num" type="number" min="1" max="999" value="${r?.cost || 10}" inputmode="numeric"><button class="iconbtn" data-act="step" data-t="rcost" data-n="5" aria-label="Thêm 5">+</button></div></div>
  <div class="foot">${r ? `<button class="btn danger left" data-act="reward-del" data-id="${id}">Xoá</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="reward-save" data-id="${id || ''}">Lưu</button></div>`);
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
  <div class="field"><span class="lbl">Con</span><div class="seg">${kids.map(k => `<label><input type="radio" name="lkid" value="${k.id}" ${k.id === kid ? 'checked' : ''}><span>${esc(k.avatar)} ${esc(k.name)}</span></label>`).join('')}</div></div>
  <div class="field"><label for="lname">Học gì</label><input id="lname" class="input" list="lesson-list" maxlength="40" value="${esc(l?.name || '')}" placeholder="Ví dụ: Tiếng Anh cô Huyền">
    <datalist id="lesson-list">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist></div>
  <div class="field"><span class="lbl">${l ? 'Ngày' : 'Những ngày (cùng giờ)'}</span><div class="seg">${WEEK_ORDER.map(d => `<label><input type="${l ? 'radio' : 'checkbox'}" name="lday" value="${d}" ${d === day ? 'checked' : ''}><span>${WDS[d]}</span></label>`).join('')}</div></div>
  <div class="row2"><div class="field"><label for="ls">Từ</label><input id="ls" class="input num" type="time" value="${esc(l?.s || '17:30')}"></div>
    <div class="field"><label for="le">Đến</label><input id="le" class="input num" type="time" value="${esc(l?.e || '19:30')}"></div></div>
  <div class="field"><span class="lbl">Học ở đâu</span><div class="seg">
    <label><input type="radio" name="lwhere" value="home" ${l?.home === true ? 'checked' : ''}><span>🏠 Ở nhà</span></label>
    <label><input type="radio" name="lwhere" value="out" ${l?.home === false ? 'checked' : ''}><span>🚗 Đi học bên ngoài</span></label></div></div>
  <div class="lgo" ${l?.home === false ? '' : 'hidden'}>${[['lgo', 'Ai đưa đi', l?.go], ['lback', 'Ai đón về', l?.back]].map(([fid, lbl, v]) => `<div class="field"><label for="${fid}">${lbl}</label>
    <input id="${fid}" class="input" list="who-list" maxlength="20" value="${esc(v || '')}" placeholder="Ví dụ: Bố, Grab">
    <div class="row">${whoNames().map(w => `<button class="btn quiet sm" data-act="who-fill" data-t="${fid}" data-v="${esc(w)}">${whoIcon(w)} ${esc(w)}</button>`).join('')}</div></div>`).join('')}
    <datalist id="who-list">${whoNames().map(w => `<option value="${esc(w)}">`).join('')}</datalist></div>
  ${l ? '' : '<span class="muted small">Cùng một lớp mà mỗi ngày học một giờ khác nhau, hoặc mỗi ngày một người đưa đón khác nhau, thì thêm từng ngày một.</span>'}
  <div class="foot">${l ? `<button class="btn danger left" data-act="lesson-del" data-id="${id}">Xoá</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="lesson-save" data-id="${id || ''}">Lưu</button></div>`);
}

function tradeForm(id) {
  const r = S.rewards[id]; if (!r) return;
  openModal(`<h2>${esc(r.icon)} ${esc(r.name)}</h2><p class="muted" style="margin:-8px 0 0">Cần ${r.cost} sao. Con nào muốn đổi?</p>
  <div class="list">${kidsList().map(k => { const b = balance(k.id), ok = b >= r.cost; return `<div class="item">${ava(k, 'sm')}<div class="txt"><div class="t">${esc(k.name)}</div><div class="s num">Đang có ${b} sao${ok ? '' : ` · còn thiếu ${r.cost - b} sao`}</div></div><button class="btn primary sm" data-act="trade-do" data-id="${id}" data-kid="${k.id}" ${ok ? '' : 'disabled'}>Đổi</button></div>`; }).join('')}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Đóng</button></div>`);
}

// ---------- backup ----------
function exportBackup() {
  const data = { app: 'be-cham-ngoan', version: 1, exportedAt: new Date().toISOString(), data: S };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'be-cham-ngoan-sao-luu-' + key(today()) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
// Con trong file nhập mà trùng tên với con đã có (khác mã) thì gộp vào con đó,
// không tạo thêm một con nữa. Đổi mã con ở mọi nhóm dữ liệu trong file. Trả về tên các con đã gộp.
function matchKidsByName(data) {
  const norm = v => String(v || '').trim().toLowerCase();
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
  if (data.paid) data.paid = Object.fromEntries(Object.entries(data.paid).map(([id, p]) => { const [kid, w] = id.split('_'); return [m(kid) + '_' + w, { ...p, kid: m(p.kid) }]; }));
  if (data.timetables) data.timetables = Object.fromEntries(Object.entries(data.timetables).map(([id, t]) => [m(id), t]));
  return [...new Set(Object.values(map))].map(kidName);
}
async function importBackup(file) {
  try {
    const j = JSON.parse(await file.text());
    const data = j && j.data;
    if (!data || typeof data !== 'object' || !data.kids) throw new Error('bad');
    const matched = matchKidsByName(data);
    await store.importAll(data);
    const n = Object.keys(data.kids).length, parts = [];
    if (n) parts.push(`${n} con mới`);
    if (matched.length) parts.push(`gộp vào ${matched.join(', ')}`);
    for (const [c, label] of [['chores', 'việc nhà'], ['timetables', 'thời khoá biểu'], ['lessons', 'buổi học thêm']]) { const m = Object.keys(data[c] || {}).length; if (m) parts.push(`${m} ${label}`); }
    toast(`Đã nhập: ${parts.join(', ') || 'không có gì mới'}.`);
  } catch (e) {
    console.error(e);
    toast('File này không phải bản sao lưu của Bé Chăm Ngoan.');
  }
}

// ---------- actions ----------
let toastT = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2800); }
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['var(--star)', 'var(--accent)', 'var(--good)', 'var(--bad)', 'var(--t4)'];
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
  if (a === 'day') { const n = Number(b.dataset.n); UI.date = n === 0 ? today() : addDays(UI.date, n); return render(); }
  if (a === 'tick') {
    const d = b.dataset.km ? today() : UI.date, kid = b.dataset.kid, ch = S.chores[b.dataset.chore]; if (!ch) return;
    const on = isDone(d, kid, b.dataset.chore);
    const list = choresFor(kid, d), n = list.filter(c => isDone(d, kid, c.id)).length;
    const st = b.classList.contains('stamp') ? b : b.querySelector('.stamp');
    if (!on && st) st.classList.add('on', 'pop');
    setDone(key(d), kid, b.dataset.chore, on ? 0 : (Number(ch.stars) || 1));
    if (!on && n + 1 === list.length) { confetti(); toast(`${kidName(kid)} làm xong hết việc rồi! 🎉`); }
    return;
  }
  if (a === 'tkb-go') { UI.tkbKid = b.dataset.kid; return; } // link tự chuyển sang #lich-hoc
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
    const where = radioVal('lwhere'), trip = {};
    if (where === 'home') trip.home = true;
    if (where === 'out') Object.assign(trip, { home: false, go: $('#lgo').value.trim(), back: $('#lback').value.trim() });
    closeModal();
    if (id) put('lessons', id, { kid, day: days[0], s: ls, e: le, name, ...trip });
    else days.forEach(d => put('lessons', uid(), { kid, day: d, s: ls, e: le, name, ...trip }));
    return toast(id ? 'Đã lưu.' : `Đã thêm ${days.length} buổi học thêm cho ${kidName(kid)}.`);
  }
  if (a === 'who-fill') { const i = $('#' + b.dataset.t); if (i) i.value = b.dataset.v; return; }
  if (a === 'lesson-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('lessons', id); return toast('Đã xoá buổi học thêm.'); }
  if (a === 'km-open') { const ks = kidsList(); UI.km = { on: true, kid: ks.length === 1 ? ks[0].id : null }; return render(); }
  if (a === 'km-kid') { UI.km.kid = b.dataset.kid || null; return render(); }
  if (a === 'sheet-open') { UI.sheet = true; return render(); }
  if (a === 'print') return printSheet();
  if (a === 'kid-form') return kidForm(id);
  if (a === 'chore-form') return choreForm(id);
  if (a === 'reward-form') return rewardForm(id);
  if (a === 'trade') return tradeForm(id);
  if (a === 'step') { const i = $('#' + b.dataset.t); i.value = Math.max(1, (Number(i.value) || 0) + Number(b.dataset.n)); return; }
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
    SAMPLE_CHORES.forEach((c, i) => put('chores', uid(), { ...c, kids: kidIds, order: i }));
    if (!Object.keys(S.rewards).length) SAMPLE_REWARDS.forEach(r => put('rewards', uid(), r));
    return toast('Đã thêm việc nhà mẫu.');
  }

  if (a === 'kid-save') {
    const name = $('#kname').value.trim(); if (!name) { $('#kname').focus(); return toast('Nhập tên của con nhé.'); }
    const old = id ? S.kids[id] : null;
    const data = {
      name, birthday: $('#kbday').value || '', avatar: radioVal('kava') || '🙂',
      allowance: Math.max(0, Math.round(Number($('#kallow').value) || 0)), mode: radioVal('kmode') || 'chores',
      tint: old ? (old.tint ?? 0) : Object.keys(S.kids).length % 6, order: old ? (old.order ?? 0) : Object.keys(S.kids).length,
      since: old?.since || key(today()),
    };
    closeModal(); put('kids', id || uid(), data); return toast(old ? 'Đã lưu.' : `Đã thêm ${name}.`);
  }
  if (a === 'kid-del') {
    if (!armed(b, 'Bấm lần nữa để xoá')) return;
    closeModal(); del('kids', id);
    if (S.timetables[id]) del('timetables', id);
    for (const l of Object.entries(S.lessons || {})) if (l[1].kid === id) del('lessons', l[0]);
    for (const c of choresList()) if ((c.kids || []).includes(id)) { const { id: cid, ...rest } = c; put('chores', cid, { ...rest, kids: rest.kids.filter(x => x !== id) }); }
    return toast('Đã xoá.');
  }
  if (a === 'chore-save') {
    const name = $('#cname').value.trim(); if (!name) { $('#cname').focus(); return toast('Nhập tên việc nhé.'); }
    const kids = [...document.querySelectorAll('#modal input[name=ckid]:checked')].map(x => x.value);
    const days = [...document.querySelectorAll('#modal input[name=cday]:checked')].map(x => Number(x.value));
    if (!kids.length) return toast('Chọn ít nhất một con.');
    if (!days.length) return toast('Chọn ít nhất một ngày.');
    const old = id ? S.chores[id] : null;
    closeModal(); put('chores', id || uid(), { name, icon: radioVal('cico') || '✅', stars: Number(radioVal('cstars')) || 1, kids, days, order: old ? (old.order ?? 0) : Object.keys(S.chores).length });
    return toast('Đã lưu việc.');
  }
  if (a === 'chore-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('chores', id); return toast('Đã xoá việc.'); }
  if (a === 'reward-save') {
    const name = $('#rname').value.trim(); if (!name) { $('#rname').focus(); return toast('Nhập tên phần thưởng nhé.'); }
    closeModal(); put('rewards', id || uid(), { name, icon: radioVal('rico') || '🎁', cost: Math.max(1, Math.round(Number($('#rcost').value) || 1)) });
    return toast('Đã lưu phần thưởng.');
  }
  if (a === 'reward-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('rewards', id); return toast('Đã xoá.'); }
  if (a === 'trade-do') {
    const r = S.rewards[id], kid = b.dataset.kid; if (!r || balance(kid) < r.cost) return;
    closeModal(); put('ledger', uid(), { kid, delta: -Number(r.cost), kind: 'reward', note: r.name, icon: r.icon, at: new Date().toISOString() });
    confetti(); return toast(`${kidName(kid)} đã đổi “${r.name}”.`);
  }
  if (a === 'bonus') {
    const kid = radioVal('bkid'), n = Math.max(1, Math.round(Number($('#bamt').value) || 0)), sign = Number(b.dataset.sign);
    if (!kid) return;
    UI.bonusKid = kid;
    const note = $('#breason').value.trim() || (sign > 0 ? 'Thưởng thêm' : 'Trừ sao');
    put('ledger', uid(), { kid, delta: sign * n, kind: sign > 0 ? 'bonus' : 'penalty', note, at: new Date().toISOString() });
    return toast(sign > 0 ? `Đã thưởng ${n} sao cho ${kidName(kid)}.` : `Đã trừ ${n} sao của ${kidName(kid)}.`);
  }
  if (a === 'ledger-undo') { if (!armed(b, 'Chắc chưa?')) return; del('ledger', id); return toast('Đã huỷ mục này.'); }
  if (a === 'pay') { put('paid', b.dataset.kid + '_' + b.dataset.w, { kid: b.dataset.kid, week: b.dataset.w, amount: Number(b.dataset.a) || 0, paidAt: key(today()) }); return toast('Đã ghi là đã trả.'); }
  if (a === 'unpay') { del('paid', b.dataset.kid + '_' + b.dataset.w); return toast('Đã hoàn tác.'); }
});
document.addEventListener('change', e => {
  if (e.target.name === 'bkid') UI.bonusKid = e.target.value;
  if (e.target.name === 'lwhere') { const g = $('#modal .lgo'); if (g) g.hidden = e.target.value !== 'out'; }
  if (e.target.name === 'tkbkid') { UI.tkbKid = e.target.value; render(); }
  if ((e.target.id === 'tsat' || e.target.id === 'tlunch' || e.target.name === 'tday') && tkbDraft && !$('#modal').hidden) tkbForm(tkbDraft.kid, { ...readTkbForm(), keep: true });
  if (e.target.id === 'import-file' && e.target.files[0]) importBackup(e.target.files[0]);
});
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

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
function route() { const h = location.hash.slice(1); UI.view = NAV.some(n => n.id === h) ? h : 'hom-nay'; render(); window.scrollTo(0, 0); }
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
      S = data; loaded = true; stale = !!meta.fromCache; render();
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
UI.view = NAV.some(n => n.id === location.hash.slice(1)) ? location.hash.slice(1) : 'hom-nay';
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
}
