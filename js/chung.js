// Hàm dùng chung, không phụ thuộc dữ liệu của gia đình: ngày giờ, tiền, chữ, mã ngẫu nhiên, hình SVG nhỏ, thông báo (toast), pháo giấy, in.
import { iconify } from './icons.js';

// ---------- helpers ----------
export const $ = (s, r = document) => r.querySelector(s);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const WD = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export const WDS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
// Mọi ngày trong tuần (CN = 0 … T7 = 6).
export const DAILY = [0, 1, 2, 3, 4, 5, 6];
export const pad = n => String(n).padStart(2, '0');
export const key = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parse = k => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
export const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
export const weekStart = d => addDays(d, -((d.getDay() + 6) % 7));
export const dm = d => d.getDate() + '/' + (d.getMonth() + 1);
export const money = n => (Number(n) < 0 ? '−' : '') + Math.abs(Math.round(Number(n) || 0)).toLocaleString('vi-VN') + 'đ';
export const signed = n => (Number(n) > 0 ? '+' : '') + money(n);
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
// Chữ để so sánh: bỏ khoảng trắng hai đầu, viết thường. slug: viết liền không dấu, nối bằng gạch ngang (làm mã cố định theo tên).
export const norm = v => String(v || '').trim().toLowerCase();
export const slug = v => norm(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.85 5.9 6.5.85-4.75 4.5 1.2 6.45L12 17.2l-5.8 3.1 1.2-6.45L2.65 9.35l6.5-.85z"/></svg>';
export const CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
export function daysLabel(days) {
  const s = [...(days || [])].sort();
  if (s.length === 7) return 'mỗi ngày';
  if (s.join() === '1,2,3,4,5') return 'ngày thường';
  if (s.join() === '0,6') return 'cuối tuần';
  if (!s.length) return 'chưa chọn ngày';
  return WEEK_ORDER.filter(d => s.includes(d)).map(d => WDS[d]).join(', ');
}

// ---------- thời khoá biểu ----------
export const toMin = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
export const hm = n => pad(Math.floor(n / 60) % 24) + ':' + pad(n % 60);
export const durTxt = n => { const h = Math.floor(n / 60), m = n % 60; return h ? `${h} giờ${m ? ` ${m} phút` : ''}` : `${m} phút`; };
export const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
export const WDN = d => d === 0 ? 'Chủ nhật' : 'Thứ ' + (d + 1);
export const dmy = d => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
export const daysTo = dk => Math.round((parse(dk) - today()) / 864e5);

// ---------- bảng tuần (lưới việc × ngày) ----------
// Nút tròn nhỏ: dấu cộng, ba chấm, mũi tên xuống.
export const PLUS = '<svg class="gl" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
export const DOTS = '<svg class="gl dots" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
export const DOWN = '<svg class="chev down" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
export const PREV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>', NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
export function dueLabel(dk) {
  const n = daysTo(dk), d = parse(dk);
  if (n < 0) return `quá hạn ${-n} ngày`;
  if (n === 0) return 'hôm nay';
  if (n === 1) return 'ngày mai';
  return n < 7 ? `${WDN(d.getDay())} ${dm(d)}` : `${WDN(d.getDay())} ${dm(d)} (còn ${n} ngày)`;
}
export const dateTxt = dk => { const d = parse(dk); return `${WDN(d.getDay())} ${dm(d)}`; };
export const monthTxt = mk => mk ? `Tháng ${Number(mk.slice(5, 7))}, ${mk.slice(0, 4)}` : 'Chưa có ngày';
export const daysBetween = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);
export const pad2 = n => String(n).padStart(2, '0');
export function printHtml(html, cls = '') {
  const pa = $('#print-area');
  pa.className = cls; pa.innerHTML = html; iconify(pa); // thay emoji ngay, vì window.print() chặn trang trước khi autoIcons kịp chạy
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  window.print();
  setTimeout(done, 1500);
}

// ---------- actions ----------
let toastT = 0;
// undo: hàm hoàn tác. Có thì thông báo kèm nút Hoàn tác và ở lại lâu hơn.
export function toast(msg, undo) {
  const t = $('#toast'); t.textContent = msg; t.classList.toggle('has-act', !!undo);
  if (undo) { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Hoàn tác'; b.onclick = () => { t.hidden = true; undo(); }; t.appendChild(b); }
  t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), undo ? 7000 : 2800);
}
export function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['#FFC633', '#22B85C', '#FF6B6B', '#4DA8FF', '#B07CFF', '#FF9F2E'];
  for (let i = 0; i < 60; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = cols[i % cols.length]; s.style.animationDelay = Math.random() * 0.5 + 's'; s.style.animationDuration = 1.2 + Math.random() + 's'; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
}

// ---------- family setup (Firebase) ----------
export function newFamilyCode() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const r = crypto.getRandomValues(new Uint8Array(20));
  const s = [...r].map(x => abc[x % abc.length]).join('');
  return s.match(/.{5}/g).join('-');
}
