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

// ---------- state ----------
let S = Object.fromEntries(COLS.map(c => [c, {}]));
const UI = { view: 'hom-nay', date: today(), bonusKid: null, km: { on: false, kid: null }, sheet: false };
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

// ---------- rendering ----------
let raf = 0;
const render = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
function draw() {
  const navHtml = cls => NAV.map(n => `<a href="#${n.id}" class="${cls} ${UI.view === n.id ? 'on' : ''}" ${UI.view === n.id ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${n.svg}</svg><span>${n.label}</span></a>`).join('');
  $('#rail').innerHTML = brand() + navHtml('');
  $('#tabs').innerHTML = navHtml('tab');
  const body = !loaded ? loading() : ({ 'hom-nay': viewToday, 'phan-thuong': viewRewards, 'tien-tieu-vat': viewAllowance, 'gia-dinh': viewFamily }[UI.view] || viewToday)();
  $('#app').innerHTML = topbar() + body;
  drawKidMode();
  if (UI.sheet) drawSheet();
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
  el.innerHTML = `<div class="wrap"><div class="km-top"><button class="btn quiet" data-act="km-kid" data-kid="">← Đổi bạn</button>${hold}</div>
  <div class="kid-head">${ava(k)}<div><div class="kid-name" style="font-size:32px">${isBirthday(k, t) ? `Chúc mừng sinh nhật ${esc(k.name)}! 🎂` : `Chào ${esc(k.name)}!`}</div><div class="muted">${WD[t.getDay()]}, ${t.getDate()} tháng ${t.getMonth() + 1}</div></div><span class="stars num" style="margin-left:auto;font-size:30px">${STAR}${balance(k.id)}</span></div>
  ${list.length ? `<div class="prog"><div class="bar ${n === list.length ? 'full' : ''}"><b style="width:${Math.round(n / list.length * 100)}%"></b></div><span class="num">${n} / ${list.length}</span></div>` : ''}
  ${list.length && n === list.length ? `<div class="cheer">Giỏi quá! Hôm nay con làm xong hết rồi 🎉</div>` : ''}
  <div class="big-list">${list.length ? list.map(c => { const on = isDone(t, k.id, c.id); return `<button class="big-item ${on ? 'done' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" data-km="1" aria-pressed="${on}"><span class="ico">${esc(c.icon || '✅')}</span><span><span class="t">${esc(c.name)}</span><br><span class="s">${c.stars || 1} sao</span></span><span class="stamp ${on ? 'on' : ''}">${STAR}</span></button>`; }).join('')
    : `<div class="card empty"><div class="big">🎈</div><h2>Hôm nay con được nghỉ!</h2></div>`}</div></div>`;
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
  $('#print-area').innerHTML = `<h1 style="font-family:var(--display);margin:0">Bé Chăm Ngoan</h1><div>Tuần ${dm(ws)} – ${dm(addDays(ws, 6))} · Đánh dấu ô khi làm xong việc</div>${sheetTables()}`;
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  window.print();
  setTimeout(done, 1500);
}

// ---------- modal ----------
function openModal(html, wide) {
  const m = $('#modal');
  m.innerHTML = `<div class="dialog ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  m.hidden = false;
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
async function importBackup(file) {
  try {
    const j = JSON.parse(await file.text());
    const data = j && j.data;
    if (!data || typeof data !== 'object' || !data.kids) throw new Error('bad');
    await store.importAll(data);
    toast(`Đã nhập ${Object.keys(data.kids).length} con, ${Object.keys(data.chores || {}).length} việc nhà.`);
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
