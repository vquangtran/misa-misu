// Điểm vào của app (index.html nạp file này): vẽ khung và các màn, điều hướng bằng #hash, mở dữ liệu của gia đình
// (Firebase hoặc trên trình duyệt), màn mở đầu khi chưa có gia đình, màn của cô.
import { firebaseConfig } from './config.js';
import { autoIcons, iconSvg } from './icons.js';
import { firebaseStore, localStore } from './store.js';
import { $, esc, key, newFamilyCode, nowMin, toast, today } from './chung.js';
import { deviceRole, family, FAMILY_KEY, getFamily, getRole, keepFamilyInUrl, loaded, render, setData, setDraw, setFamily, setFamilyCode, setLoaded,
  setRole, setStale, setStore, setTeach, slotAt, stale, store, TEACH, UI } from './du-lieu.js';
import { brand, loading } from './giao-dien.js';
import { viewSchedule } from './hoc-tap.js';
import { drawTeacher, getLop, openClass, setLop, syncClasses } from './so-hoc.js';
import { drawSheet, viewToday } from './hom-nay.js';
import { viewAccount } from './tai-khoan.js';
import { viewPrices } from './quy-dinh.js';
import { autoSeed, viewFamily } from './gia-dinh.js';
import { drawKidMode } from './man-con.js';
import { autoAdds, autoFill } from './mot-lan.js';
import './thao-tac.js';

// ---------- vẽ khung và các màn ----------
// Năm tab, mỗi tab trả lời một câu hỏi (xem CLAUDE.md): Hôm nay con cần làm gì; các con học gì, nộp gì, ai đưa đón;
// con có bao nhiêu tiền, vì sao; nhà mình có việc gì, thưởng phạt thế nào; cài đặt của cả nhà.
const NAV = [
  { id: 'hom-nay', label: 'Hôm nay', ic: 'checklist' },
  { id: 'lich-hoc', label: 'Học tập', ic: 'calendar' },
  { id: 'tai-khoan', label: 'Tài khoản', ic: 'piggy' },
  { id: 'quy-dinh', label: 'Quy định', ic: 'tag' },
  { id: 'gia-dinh', label: 'Gia đình', ic: 'family' },
];
// Link cũ (#bang-gia, #phan-thuong, #tien-tieu-vat) mở trang mới tương ứng.
const NAV_ALIAS = { 'bang-gia': 'quy-dinh', 'phan-thuong': 'quy-dinh', 'tien-tieu-vat': 'tai-khoan' };
function draw() {
  if (TEACH) return drawTeacher();
  const navHtml = cls => NAV.map(n => `<a href="#${n.id}" class="${cls} ${UI.view === n.id ? 'on' : ''}" ${UI.view === n.id ? 'aria-current="page"' : ''}>${iconSvg(n.ic)}<span>${n.label}</span></a>`).join('');
  $('#rail').innerHTML = brand() + navHtml('');
  $('#tabs').innerHTML = navHtml('tab');
  const body = !loaded ? loading() : deviceRole() !== 'parent' ? '' : ({ 'hom-nay': viewToday, 'lich-hoc': viewSchedule, 'tai-khoan': viewAccount, 'quy-dinh': viewPrices, 'gia-dinh': viewFamily }[UI.view] || viewToday)();
  // Máy của con (hoặc máy chưa chọn là của ai): không vẽ phần của bố mẹ bên dưới.
  $('#app').innerHTML = deviceRole() === 'parent' ? topbar() + body : '';
  $('#app').classList.toggle('wide', loaded && deviceRole() === 'parent' && UI.view === 'hom-nay' && UI.todayMode !== 'week' && !!UI.todayTwo);
  drawKidMode();
  if (UI.sheet) drawSheet();
  const tb = $('#app .tabbar .on') || $('#km .tabbar .on'); if (tb) tb.parentElement.scrollLeft = Math.max(0, tb.offsetLeft - 60);
}
function topbar() {
  let s;
  // Chỉ hiện khi có điều cần báo (đang tải, mất mạng). Bình thường không chiếm chỗ; trạng thái lưu nằm ở mục Gia đình.
  if (!store || !loaded) s = 'Đang tải…';
  else if (store.kind !== 'local' && (stale || !navigator.onLine)) s = 'Đang offline, sẽ đồng bộ sau';
  else return '';
  return `<div class="topbar"><span class="sync wait"><i></i>${s}</span></div>`;
}

// ---------- điều hướng bằng #hash ----------
const viewOf = h => { h = NAV_ALIAS[h] || h; return NAV.some(n => n.id === h) ? h : 'hom-nay'; };
// Địa chỉ trong app: #<tab>; riêng trang sổ học của một cô là #lich-hoc/so/<mã sổ>.
function parseHash() {
  const [v, sub, arg] = location.hash.slice(1).split('/'), view = viewOf(v);
  let so = null; if (view === 'lich-hoc' && sub === 'so' && arg) try { so = decodeURIComponent(arg); } catch (e) {}
  return { view, so };
}
function route() { const r = parseHash(); UI.view = r.view; UI.so = r.so; if (!r.so) UI.soBack = null; if (UI.view !== 'lich-hoc') UI.tkbDay = null; render(); window.scrollTo(0, 0); }
window.addEventListener('hashchange', route);
window.addEventListener('online', render);
window.addEventListener('offline', render);

// Sang ngày mới khi app để mở qua đêm (ví dụ trên máy tính bảng). Sang buổi khác (12:00, 18:00) thì vẽ lại để buổi mới mở ra, buổi cũ thu gọn.
let lastDay = key(today()), lastSlot = slotAt(nowMin());
setInterval(() => {
  const k = key(today()), sl = slotAt(nowMin());
  if (k !== lastDay) { if (key(UI.date) === lastDay) UI.date = today(); lastDay = k; lastSlot = sl; return render(); }
  if (sl !== lastSlot) { lastSlot = sl; if ($('#modal').hidden) render(); }
}, 60000);

// ---------- màn mở đầu, mở gia đình trên Firebase ----------
const cleanCode = v => String(v || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
// Tách mã gia đình và mã của con (nếu là link riêng của một con, ...?gd=...&con=...) từ thứ được dán vào: cả link hoặc chỉ mã.
function parseInvite(v) {
  const s = String(v || '').trim(), gd = /[?&]gd=([^&#\s]*)/i.exec(s), con = /[?&]con=([\w-]{1,40})(?![\w-])/i.exec(s);
  return { code: cleanCode(gd ? gd[1] : s), con: gd && con ? con[1] : null };
}
function showSetup(err) {
  $('#shell').hidden = true; $('#tabs').hidden = true;
  const el = $('#setup'); el.hidden = false;
  el.innerHTML = `<div class="setup"><div class="card">${brand()}
    <h1>Mở bảng việc nhà của gia đình</h1>
    <p class="muted" style="margin:0">Nhà đã có gia đình trên máy khác thì dán link mời vào đây. Chỉ máy đầu tiên mới tạo gia đình mới.</p>
    ${err ? `<div class="note">${esc(err)}</div>` : ''}
    ${navigator.clipboard?.readText ? `<button class="btn primary" data-setup="paste">Dán link mời</button>` : ''}
    <div class="field"><label for="famcode">Link mời hoặc mã gia đình</label><input id="famcode" class="input" placeholder="xxxxx-xxxxx-xxxxx-xxxxx" autocomplete="off" autocapitalize="off"></div>
    <button class="btn ${navigator.clipboard?.readText ? 'ghost' : 'primary'}" data-setup="join">Vào gia đình</button>
    <div class="or">hoặc</div>
    <button class="btn ghost" data-setup="new">Tạo gia đình mới</button>
  </div></div>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-setup]'); if (!b) return;
  if (b.dataset.setup === 'paste') {
    try { $('#famcode').value = await navigator.clipboard.readText(); }
    catch (err) { return toast('Không đọc được bộ nhớ tạm. Bấm giữ vào ô bên dưới rồi chọn Dán.'); }
  }
  let con = null;
  if (b.dataset.setup === 'new') { setFamilyCode(newFamilyCode()); }
  else {
    const inv = parseInvite($('#famcode').value);
    if (inv.code.length < 20) return toast('Mã gia đình chưa đúng. Hãy dán cả link mời hoặc mã 23 ký tự.');
    setFamilyCode(inv.code); con = inv.con;
  }
  setFamily(family);
  // Dán link riêng của một con: máy chưa chọn là của ai thì thành máy của con đó, như khi mở thẳng link.
  if (con && !getRole()) setRole(con);
  $('#setup').hidden = true; $('#shell').hidden = false; $('#tabs').hidden = false;
  startFirebase();
});

async function startFirebase() {
  keepFamilyInUrl();
  render();
  try {
    setStore(await firebaseStore(firebaseConfig, family, (data, meta) => {
      setData(data); setLoaded(true); setStale(!!meta.fromCache); render(); autoSeed(); autoFill(); autoAdds(); syncClasses();
    }, (type, err) => {
      console.error(err);
      if (err?.code === 'permission-denied') toast('Firestore từ chối truy cập. Kiểm tra Rules trong README.');
      setStale(true); setLoaded(true); render();
    }));
    store.start();
    setTimeout(() => { if (!loaded) { setLoaded(true); setStale(true); render(); } }, 10000);
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

// ---------- khởi động ----------
// Manifest chỉ nạp ngoài iOS. Trên iPhone/iPad, Safari đọc manifest ngay lúc mở trang và dùng start_url cố định trong đó ("./")
// khi Thêm vào MH chính, làm rơi mất ?gd=...&con=...; không có manifest thì iOS lưu đúng địa chỉ đang hiện.
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (!IOS) document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'manifest', href: 'manifest.webmanifest' }));
autoIcons(); // emoji có hình trong js/icons.js được thay bằng hình vẽ 3D ở mọi chỗ app vẽ ra
setDraw(draw);
{ const r = parseHash(); UI.view = r.view; UI.so = r.so; }
// Link riêng của cô (…?lop=<mã lớp>): máy này chỉ mở sổ học của lớp đó, không mở phần của gia đình.
// Máy nhớ mã lớp để biểu tượng trên màn hình chính (mở không kèm ?lop=) vẫn vào đúng sổ, trừ khi máy này cũng là máy của nhà.
const QS = new URLSearchParams(location.search), qLop = cleanCode(QS.get('lop')), okLop = v => /^[a-z0-9]{5}(-[a-z0-9]{5}){3}$/.test(v || '');
const hasHome = () => { try { return !!(localStorage.getItem(FAMILY_KEY) || localStorage.getItem('be-cham-ngoan-v1')); } catch (e) { return false; } };
if (okLop(qLop)) setLop(qLop);
setTeach(okLop(qLop) ? qLop : !QS.get('gd') && !hasHome() && okLop(getLop()) ? getLop() : null);
if (TEACH) {
  if (!okLop(qLop)) history.replaceState(null, '', location.pathname + '?lop=' + encodeURIComponent(TEACH));
  openClass(TEACH);
  render();
} else if (firebaseConfig) {
  const q = new URLSearchParams(location.search).get('gd');
  if (q && cleanCode(q).length >= 20) setFamily(cleanCode(q));
  setFamilyCode(getFamily());
  // Bản trước dán link riêng của con (...&con=...) vào màn mở đầu thì mã của con dính luôn vào mã gia đình, thành một gia đình trống: tách lại.
  const glued = /^([a-z0-9]{5}(?:-[a-z0-9]{5}){3})con([a-z0-9-]{1,40})$/.exec(family || '');
  if (glued) { setFamilyCode(glued[1]); setFamily(family); if (!getRole()) setRole(glued[2]); }
  // Link riêng của một con (?gd=...&con=...): máy chưa chọn là của ai thì thành máy của con đó. Máy đã chọn rồi thì giữ nguyên.
  const con = new URLSearchParams(location.search).get('con');
  if (family && con && /^[\w-]{1,40}$/.test(con) && !getRole()) setRole(con);
  if (family) startFirebase(); else showSetup();
} else {
  setStore(localStore((data) => { setData(data); setLoaded(true); render(); autoFill(); autoAdds(); syncClasses(); }));
  store.start();
  autoSeed();
}
