// Mảnh giao diện dùng chung của các màn: hình của con, tiêu đề nhóm, thanh tiến độ, hàng chọn con, nút ⋯ và +, ô trống để thêm.
import { avatarPick, isSvgAvatar } from './avatars.js';
import { icon } from './icons.js';
import { CHEV, DOTS, DOWN, esc, money, PLUS, STAR } from './chung.js';
import { AV_DEFAULT } from './nha-minh.js';
import { balance, RO, UI } from './du-lieu.js';

// Mũi tên ở cuối dòng: bấm vào bất kỳ chỗ nào trên dòng là mở form sửa (kiểu danh sách iOS).
export const editBtn = (act, id, name = '') => RO ? '' : `<button class="edit" data-act="${act}" data-id="${id}" aria-label="Sửa${name ? ': ' + esc(name) : ''}">${CHEV}</button>`;
export const moneyChip = (k, style = '') => `<span class="stars num ${balance(k.id) < 0 ? 'neg' : ''}" title="Số tiền trong tài khoản" ${style ? `style="${style}"` : ''}>${money(balance(k.id))}</span>`;
// Màu nền thẻ của con: theo bộ hình (Su vàng, Sa be) nếu dùng bộ gà, ngựa; không thì theo màu đã chọn.
export const tintOf = k => { const p = avatarPick(avatarOf(k)); return p ? `var(--tint-${p.set})` : 'var(--t' + ((Number(k.tint) || 0) % 6) + ')'; };
// Ảnh của con (data URL nhỏ, lưu trong dữ liệu của gia đình), không có thì dùng emoji.
export const photoOf = k => /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(k?.photo || '') ? k.photo : '';
export const avatarOf = k => k?.avatarChosen || isSvgAvatar(k?.avatar) ? (k.avatar || '🙂') : AV_DEFAULT[String(k?.name || '').trim().toLowerCase()] || k?.avatar || '🙂';
// Nội dung bên trong khung tròn cho một giá trị hình đại diện (SVG hoặc emoji).
export const avInner = v => { const p = avatarPick(v); return p ? p.svg : esc(v || '🙂'); };
export const ava = (k, cls = '') => {
  if (photoOf(k)) return `<span class="ava photo ${cls}" style="background:${tintOf(k)}"><img src="${photoOf(k)}" alt=""></span>`;
  const p = avatarPick(avatarOf(k));
  return p ? `<span class="ava svg ${cls}" style="background:${tintOf(k)}" title="${esc(p.name)}">${p.svg}</span>` : `<span class="ava ${cls}" style="background:${tintOf(k)}">${esc(avatarOf(k))}</span>`;
};
export const mini = k => photoOf(k) ? `<img class="mini" src="${photoOf(k)}" alt="">` : avatarPick(avatarOf(k)) ? `<span class="mini">${avInner(avatarOf(k))}</span>` : esc(avatarOf(k));
// Màu cố định cho mỗi môn, để cùng một môn luôn cùng một màu.
export const subjTint = name => { let h = 0; for (const ch of String(name).toLowerCase().trim()) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h % 6; };
export const subjChips = list => list.map(s => `<span class="sj-chip sj${subjTint(s)}">${esc(s)}</span>`).join('');
const LESSON_ICONS = [[/bóng rổ/, '🏀'], [/bóng đá/, '⚽'], [/bơi/, '🏊'], [/nhảy|múa|dance/, '💃'], [/piano|đàn|nhạc/, '🎹'], [/vẽ|mĩ thuật|mỹ thuật/, '🎨'],
  [/võ|karate|taekwondo/, '🥋'], [/cờ/, '♟️'], [/nhật/, '🗾'], [/anh|english/, '🔤'], [/toán/, '➗'], [/việt|văn/, '📖']];
export const lessonIcon = name => { const n = String(name).toLowerCase(); return (LESSON_ICONS.find(([re]) => re.test(n)) || [0, '📚'])[1]; };
export const brand = () => `<div class="brand"><span class="brand-mark">${STAR}</span>Misa Misu</div>`;
export const loading = () => `<div class="card empty"><div class="big">⏳</div><h2>Đang mở bảng việc nhà…</h2><p class="muted">Danh sách các con, việc nhà và phần thưởng sẽ hiện ở đây.</p></div>`;
export function noKids() {
  return `<div class="card empty"><div class="big">👧🧒</div><h2>Bắt đầu với các con</h2>
  <p class="muted">Thêm tên và hình đại diện cho từng con, sau đó giao việc nhà cho các con. Nếu có file sao lưu, vào mục Gia đình để nhập.</p>
  <div class="row" style="justify-content:center;margin-top:10px"><button class="btn primary" data-act="kid-form">Thêm con</button><button class="btn ghost" data-act="seed-form">Nạp lịch gia đình</button></div></div>`;
}
// ---------- phần dùng chung của các màn ----------
// Hàng chọn con: mỗi con một viên (kèm một con số nhỏ nếu có), all = thêm viên "Cả nhà".
export const kidTabs = (kids, cur, act, badge, all) => `<div class="kid-tabs">${all ? `<button class="kid-tab all ${cur === 'all' ? 'on' : ''}" data-act="${act}" data-kid="all" ${cur === 'all' ? 'aria-current="true"' : ''}>${icon('👪')}<b>Cả nhà</b></button>` : ''}${kids.map(k => `<button class="kid-tab ${k.id === cur ? 'on' : ''}" data-act="${act}" data-kid="${k.id}" ${k.id === cur ? 'aria-current="true"' : ''}>${ava(k, 'sm')}<b>${esc(k.name)}</b>${badge ? badge(k) : ''}</button>`).join('')}</div>`;
// Cụm nút góc phải: ⋯ (những việc ít dùng) và + (thêm mới).
export const pillBar = (...btns) => `<div class="pillbar">${btns.join('')}</div>`;
export const moreBtn = (act, label) => `<button data-act="${act}" aria-label="${label}">${DOTS}</button>`;
export const plusBtn = (label, off) => `<button class="add" data-act="page-add" aria-label="${label}" ${off ? 'disabled' : ''}>${PLUS}</button>`;
// Tiêu đề nhóm. key: bấm tiêu đề để gập, mở (máy nhớ trong UI.secOpen; closed = mặc định gập). add, side: nút bên phải.
// sub: nhóm con nằm dưới một tiêu đề lớn (các tháng của Buổi học, các trạng thái của Bài tập) thì là nhãn nhỏ viết hoa, không tranh chỗ với tiêu đề lớn.
export const secIsOpen = (key, closed) => !key || (UI.secOpen[key] ?? !closed);
export function secHead(ic, label, { cnt = '', key = '', closed = false, add = '', side = '', sub = false } = {}) {
  const inner = `${ic}<span>${label}</span>${cnt !== '' ? `<i class="num">${cnt}</i>` : ''}`;
  return `<div class="slot-h ${sub ? 'sub' : ''}">${key ? `<button class="slot-pill" data-act="sec-toggle" data-key="${key}" aria-expanded="${secIsOpen(key, closed)}">${inner}${DOWN}</button>` : `<span class="slot-pill">${inner}</span>`}${side}${add}</div>`;
}
export const addBtn = (act, label, attr = '') => RO ? '' : `<button class="mini-add" data-act="${act}" ${attr} aria-label="${label}">${PLUS}</button>`;
// Chỗ chưa có gì: ô nét đứt, bấm để thêm ngay tại chỗ. ro: câu hiện cho con (chỉ xem, không có nút thêm).
export const blankAdd = (text, act, attr = '', ro = '') => RO ? `<div class="slot-blank ro"><span>${ro || text}</span></div>` : `<button class="slot-blank" data-act="${act}" ${attr}><span>${text}</span>${PLUS}</button>`;
// Thanh tiến độ có mốc. Đếm việc (tới 12 việc): mỗi việc một nét rời, xong việc nào sáng nét đó. Số lớn hơn hoặc phần trăm: thanh liền có khe mảnh ở 25, 50, 75%.
export function bar(done, total, attr = '') {
  const seg = Number.isInteger(total) && total > 1 && total <= 12, p = total > 0 ? Math.max(0, Math.min(1, done / total)) : 0;
  if (seg) return `<div class="bar seg" ${attr}>${Array.from({ length: total }, (_, i) => `<i${i < done ? ' class="on"' : ''}></i>`).join('')}</div>`;
  return `<div class="bar ${total > 12 ? 'q' : ''}" ${attr}><b style="width:${+(p * 100).toFixed(2)}%"></b></div>`;
}
export const barCount = (n, total) => bar(n, total, `role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${n}"`);
// Một dòng gợi ý có nút bấm (bảng mẫu, mốc năm học mẫu...).
export const suggest = (title, text, btn, act) => `<section class="suggest"><div><b>${title}</b><span>${text}</span></div><button class="btn primary sm" data-act="${act}">${btn}</button></section>`;
// Tên của một con làm tiêu đề nhỏ (khi xem cả nhà).
export const kidChip = k => `<div class="slot-h"><span class="kid-chip">${ava(k, 'sm')}${esc(k.name)}</span></div>`;
export const subjDot = s => s ? `<i class="dot sj${subjTint(s)}"></i>` : '';
