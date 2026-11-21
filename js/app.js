import { firebaseConfig } from './config.js';
import { COLS, localStore, firebaseStore } from './store.js';
import { AVATAR_SETS, avatarPick, isSvgAvatar } from './avatars.js';
import { autoIcons, icon, iconify, iconSvg } from './icons.js';

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
const CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
// Mũi tên ở cuối dòng: bấm vào bất kỳ chỗ nào trên dòng là mở form sửa (kiểu danh sách iOS).
const editBtn = (act, id, name = '') => RO ? '' : `<button class="edit" data-act="${act}" data-id="${id}" aria-label="Sửa${name ? ': ' + esc(name) : ''}">${CHEV}</button>`;
// Công tắc bật/tắt cho một lựa chọn đơn.
const toggle = (id, label, on, cls = '', attr = '') => `<label class="toggle ${cls}" ${attr}><span>${label}</span><input type="checkbox" id="${id}" ${on ? 'checked' : ''}></label>`;
// ---------- form dạng nhóm thẻ: mỗi dòng một nhãn bên trái và giá trị bên phải ----------
// Một dòng: nhãn (kèm dòng giải thích nhỏ) bên trái, giá trị bên phải. cls 'col': giá trị nằm dưới nhãn, rộng hết dòng.
const frow = (label, right, { sub = '', id = '', cls = '', hidden = false, subId = '' } = {}) => `<div class="fr ${cls}" ${hidden ? 'hidden' : ''}><div class="fl">${id ? `<label for="${id}">${label}</label>` : `<span class="lbl">${label}</span>`}${sub || subId ? `<span class="fs" ${subId ? `id="${subId}"` : ''}>${sub}</span>` : ''}</div>${right}</div>`;
// Giá trị dạng viên: bấm vào là mở danh sách chọn của máy.
const pillSel = (id, opts, val, cls = '') => `<select id="${id}" class="pillsel ${cls}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
// Ô số dạng viên, có đơn vị; step > 0 thì thêm nút − và +.
const pillNum = (id, val, { step = 0, unit = 'đ', attr = '', ph = '' } = {}) => `<div class="pillnum">${step ? `<button data-act="num-step" data-t="${id}" data-n="${-step}" data-min="0" aria-label="Bớt ${step.toLocaleString('vi-VN')}">−</button>` : ''}<input id="${id}" class="num" type="number" inputmode="numeric" value="${val}" placeholder="${ph}" ${attr}><span>${unit}</span>${step ? `<button data-act="num-step" data-t="${id}" data-n="${step}" data-min="0" aria-label="Thêm ${step.toLocaleString('vi-VN')}">+</button>` : ''}</div>`;
// Thẻ trên cùng của form: tên thật to; nếu có bộ biểu tượng thì hình đang chọn nằm bên phải, bấm để đổi.
const titleCard = (id, val, ph, { max = 40, icoName = '', icons = [], ico = '', attr = '' } = {}) => {
  const cur = ico || icons[0] || '';
  return `<div class="fg f-title"><div class="ft"><input id="${id}" class="input ft-input" maxlength="${max}" value="${esc(val || '')}" placeholder="${ph}" aria-label="${ph}" autocomplete="off" ${attr}>
    ${icoName ? `<button class="ico-btn" data-act="ico-toggle" aria-expanded="false" aria-label="Chọn biểu tượng"><span class="ico-now">${icon(cur)}</span></button>` : ''}</div>
    ${icoName ? `<div class="ico-pick" hidden>${pickGrid(icoName, icons.includes(cur) ? icons : [cur, ...icons], cur)}</div>` : ''}</div>`;
};
// Dòng chọn con: một con (radio) hoặc nhiều con (checkbox). Nhà đông con thì các viên xuống dòng dưới nhãn.
const kidRow = (label, name, type, sel, sub = '') => { const kids = kidsList();
  return frow(label, `<div class="seg kids">${kids.map(k => `<label><input type="${type}" name="${name}" value="${k.id}" ${sel.includes(k.id) ? 'checked' : ''}><span>${mini(k)} ${esc(k.name)}</span></label>`).join('')}</div>`, { sub, cls: kids.length > 2 ? 'col' : '' }); };
const formFoot = (delAct, id, saveAct, saveLabel = 'Lưu', delLabel = 'Xoá') => `<div class="foot">${delAct ? `<button class="btn danger left" data-act="${delAct}" data-id="${id}">${delLabel}</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="${saveAct}" data-id="${id || ''}">${saveLabel}</button></div>`;
const AVATARS = ['🐔', '🐓', '🐣', '🐤', '🐥', '🐴', '🐎', '🦓', '🎠', '🦊', '🐯', '🐼', '🐨', '🦁', '🐸', '🐵', '🦄', '🐲', '🦖', '🐰', '🐱', '🐶', '🐧', '🐳', '🦋'];
const CHORE_ICONS = ['🛏️', '🪥', '🧸', '🍽️', '🪴', '📚', '🎒', '👕', '🧹', '🧽', '🗑️', '📦', '🛋️', '🧦', '👟', '🧺', '🛁', '🥢', '🐶', '🐟', '🍚', '✏️', '🎹', '🏃', '🪢', '🏫', '🎧', '🪑', '🤝', '🌙', '🎬', '🎮', '📺', '🧩', '🗣️'];
const PRICE_ICONS = {
  gift: ['🎁', '🎟️', '🍿', '🌙', '🧹', '🥞', '👫', '🍰', '🎬', '🎮', '🍦', '🧋', '🍕', '🧁', '📖', '🎡', '🛝', '🚲', '🏊'],
  penalty: ['😤', '🐢', '🤐', '🙉', '📢', '⚠️', '🙅', '🥊', '📵'],
  fee: ['📱', '📺', '🎮', '💻', '🎧'],
  merit: ['👏', '⭐', '💯', '🥈', '🏆', '🏅', '🥇', '🎖️', '📝', '📖', '🎤', '🎨', '⚽'],
};
// Các loại mục trong Bảng giá (nhóm "rewards"): thành tích ở trường (con tự báo, bố mẹ duyệt), phạt, phí sử dụng theo giờ, đổi quà.
const PRICE_KINDS = [['merit', 'Thành tích', '🏅'], ['penalty', 'Phạt', '⚠️'], ['fee', 'Phí sử dụng', '📱'], ['gift', 'Đổi quà', '🎁']];
const NAV = [
  { id: 'hom-nay', label: 'Hôm nay', ic: 'checklist' },
  { id: 'lich-hoc', label: 'Học tập', ic: 'calendar' },
  { id: 'tai-khoan', label: 'Tài khoản', ic: 'piggy' },
  { id: 'bang-gia', label: 'Bảng giá', ic: 'tag' },
  { id: 'gia-dinh', label: 'Gia đình', ic: 'family' },
];
// Link cũ (#phan-thuong, #tien-tieu-vat) mở trang mới tương ứng.
const NAV_ALIAS = { 'phan-thuong': 'bang-gia', 'tien-tieu-vat': 'tai-khoan' };
// Bảng thưởng phạt mẫu, dùng cho gia đình mới hoặc thêm vào bảng đang có. Bản 2 (11/2026) theo bảng gia đình đã chốt.
// kind 'must': việc phải làm mỗi ngày. kind 'extra': việc làm thêm, làm thì được tiền, không bắt buộc.
// Việc mỗi ngày (kind 'must') có money = 0 là việc BẮT BUỘC: không cộng tiền từng lần, ngày nào làm đủ hết thì ngày đó được thưởng.
// Việc mỗi ngày có tiền (money > 0): làm lần nào cộng tiền lần đó, không tính vào thưởng làm đủ việc.
const DAILY = [0, 1, 2, 3, 4, 5, 6];
const SAMPLE_CHORES = [
  // claim: việc ai làm trước thì tính, hai con cùng làm thì chia đôi tiền.
  // also: tên cũ của cùng việc, nhà nào đã có thì không thêm lại; bấm "Cập nhật bảng giá" thì được đổi sang tên mới.
  { name: 'Gấp chăn, dọn giường', also: ['Dọn giường', 'Gấp chăn'], icon: '🛏️', money: 0, days: DAILY, slot: 'sang', claim: true },
  { name: 'Không kén ăn', icon: '🍚', money: 0, days: DAILY },
  { name: 'Tự giác hoàn thành bài tập', icon: '✏️', money: 0, days: [1, 2, 3, 4, 5], slot: 'toi' },
  { name: 'Hoàn thành bài tập ở lớp', icon: '🏫', money: 0, days: [1, 2, 3, 4, 5], slot: 'toi' },
  { name: 'Tự chuẩn bị, cất cặp', icon: '🎒', money: 0, days: [1, 2, 3, 4, 5], slot: 'toi' },
  { name: 'Dọn bàn học', icon: '🪑', money: 0, days: DAILY, slot: 'toi' },
  // prep: chỉ hiện vào tối trước ngày con có buổi học thêm. ver: mục mới của bản này.
  { name: 'Chuẩn bị sách vở cho buổi học thêm hôm sau', icon: '🎒', money: 0, days: DAILY, slot: 'toi', prep: true, ver: 2 },
  { name: 'Đánh răng, rửa mặt', also: ['Đánh răng rửa mặt', 'Đánh răng'], icon: '🪥', money: 0, days: DAILY, slot: 'sang' },
  { name: 'Tập thể dục ít nhất 15 phút', also: ['Nhảy dây mỗi ngày', 'Nhảy dây'], icon: '🏃', money: 15000, days: DAILY, slot: 'chieu', minutes: 15 },
  { name: 'Đọc sách 30 phút', also: ['Đọc sách'], icon: '📚', money: 10000, days: DAILY, minutes: 30 },
  { name: 'Checklist trước khi đi ngủ', also: ['Chuẩn bị trước khi ngủ'], icon: '🌙', money: 5000, days: DAILY, slot: 'toi',
    steps: ['Cặp sách đã chuẩn bị', 'Quần áo ngày mai đã chuẩn bị', 'Bàn học đã gọn', 'Sách đã cất đúng chỗ', 'Việc ngày hôm nay đã hoàn thành', 'Đã đánh răng, rửa mặt', 'Đã tráng bình nước'] },
  // Việc nhà cần làm mỗi ngày: nằm trong lịch từng buổi, làm thì được tiền, không tính vào thưởng làm đủ việc.
  { name: 'Thu quần áo', icon: '👕', money: 5000, days: DAILY, slot: 'chieu', claim: true },
  { name: 'Sắp xếp giày dép', icon: '👟', money: 3000, days: DAILY, slot: 'chieu' },
  { name: 'Xếp bát vào máy', also: ['Rửa bát'], icon: '🍽️', money: 10000, days: DAILY, slot: 'toi', claim: true },
  { name: 'Lau bàn', icon: '🧽', money: 2000, days: DAILY, slot: 'toi', claim: true },
  { name: 'Đổ rác', icon: '🗑️', money: 3000, days: DAILY, slot: 'toi', claim: true },
  { name: 'Phơi quần áo', icon: '🧺', money: 7000, days: DAILY, slot: 'toi', claim: true },
  { name: 'Dọn sofa, dọn bàn', also: ['Dọn sofa'], icon: '🛋️', money: 5000, days: DAILY, slot: 'toi', claim: true },
  { name: 'Hút bụi', also: ['Quét nhà'], icon: '🧹', money: 10000, kind: 'extra', claim: true },
  { name: 'Lau nhà', icon: '🧽', money: 10000, kind: 'extra', claim: true },
  { name: 'Nhận bưu kiện', icon: '📦', money: 3000, kind: 'extra', claim: true },
  { name: 'Chủ động giúp bố mẹ', icon: '🤝', money: 5000, kind: 'extra' },
  { name: 'Xem phim hoặc chơi Lego', icon: '🎬', money: 0, kind: 'fun', days: DAILY, slot: 'toi', minutes: 30 },
].map(c => ({ days: DAILY, kind: 'must', slot: '', ...c }));
// Việc có trong bảng mẫu cũ, bản 2 đã bỏ. Bấm "Cập nhật bảng giá" thì xoá khỏi bảng (tiền các ngày đã làm giữ nguyên).
const RETIRED_CHORES = ['Đọc Raz-Kids, nghe audio', 'Đi bộ hoặc chạy ngoài trời', 'Đi bộ/chạy ngoài trời', 'Cất đồ chơi', 'Giặt tất'];
const SKIP_NOTE_OLD = 'Nghỉ hết việc phải làm trong một ngày, vẫn giữ thưởng đủ tuần';
const SAMPLE_PRICES = [
  { name: 'Nổi nóng', icon: '😤', kind: 'penalty', price: 10000 },
  { name: 'Trì hoãn', icon: '🐢', kind: 'penalty', price: 10000 },
  { name: 'Nói tục', icon: '🤐', kind: 'penalty', price: 10000 },
  { name: 'Cãi lời', icon: '🙉', kind: 'penalty', price: 10000 },
  // week: mất hết tiền được thưởng trong tuần (tiền để dành từ các tuần trước giữ nguyên).
  { name: 'Đánh nhau', also: ['Réo “mẹ” trong lúc làm việc'], icon: '🥊', kind: 'penalty', price: 0, week: true },
  { name: 'Nói dối, không trung thực', also: ['Nói dối'], icon: '🙅', kind: 'penalty', price: 0, week: true, ver: 2 },
  { name: 'Điện thoại', icon: '📱', kind: 'fee', price: 25000 },
  { name: 'Tivi', icon: '📺', kind: 'fee', price: 25000 },
  // Phiếu thưởng: con dùng tiền trong tài khoản để đổi (giá 0 là miễn phí). skip: miễn việc phải làm của một ngày.
  { name: 'Mời bạn đến chơi', icon: '👫', kind: 'gift', price: 0, note: 'Mời một bạn đến nhà chơi' },
  { name: 'Chọn món ăn sáng', icon: '🥞', kind: 'gift', price: 5000, note: 'Con chọn món ăn sáng mình thích nhất' },
  { name: 'Chọn phim tối nay', icon: '🍿', kind: 'gift', price: 10000, note: 'Con được chọn phim cả nhà xem tối nay' },
  { name: 'Món tráng miệng', icon: '🍰', kind: 'gift', price: 10000, note: 'Một món tráng miệng con thích sau bữa tối' },
  { name: 'Thức khuya thêm 30 phút', icon: '🌙', kind: 'gift', price: 20000, note: 'Đi ngủ muộn hơn 30 phút, một tối' },
  { name: 'Một ngày không làm việc nhà', icon: '🧹', kind: 'gift', price: 20000, skip: true, note: 'Nghỉ hết việc phải làm trong một ngày, không làm đứt chuỗi ngày' },
];
// Thành tích ở trường: con tự báo khi có (nút + ở màn của con), nằm chờ tới khi bố mẹ duyệt mới cộng tiền.
// Nhà nào cũng có sẵn 5 mục này (xem autoAdds), sửa hay thêm bớt ở trang Bảng giá.
const SAMPLE_MERITS = [
  { name: 'Được cô khen', icon: '👏', price: 5000 },
  { name: 'Được 9', icon: '⭐', price: 10000 },
  { name: 'Được 10', icon: '💯', price: 20000 },
  { name: 'Thi được 9', icon: '🥈', price: 25000 },
  { name: 'Thi được 10', icon: '🏆', price: 50000 },
];
// Thưởng mỗi ngày con làm đủ mọi việc phải làm (con mới thêm, hoặc khi chuyển từ thưởng đủ tuần sang).
const DAY_BONUS = 15000;
// Cách cũ: thưởng khi làm đủ mọi việc phải làm cả một tuần (Thứ Hai đến Chủ nhật). Con chưa chuyển sang thưởng theo ngày vẫn tính như vậy.
const WEEK_BONUS = 35000;
// Con cũ chưa ghi mức thưởng tuần thì vẫn tính theo mức mặc định trước đây, để số dư không tự đổi.
const WEEK_BONUS_OLD = 25000;
// Bản của bảng mẫu. Con chưa ghi bản này (k.tableVer) thì trang Bảng giá gợi ý cập nhật một lần.
// k.tableFull: nhà này đã được thêm đủ việc và mục giá của bản đó (xem autoFill).
const TABLE_VER = 2;
// Số dư thật của từng con lúc chốt bảng bản 2 (21/11/2026), theo tên. "Cập nhật bảng giá" điền sẵn để khớp số dư, sửa được trước khi áp dụng.
const TABLE_BALANCES = { su: 875000, misu: 875000, sa: 703270, misa: 703270 };
const TABLE_BAL_DATE = '21/11';
// Trước đây app tính bằng sao. Dữ liệu cũ (sao) được quy đổi: 1 sao = 5.000đ.
const STAR_VND = 5000;

// Môn học gợi ý khi nhập thời khoá biểu (tiểu học và THCS).
const SUBJECTS = ['Toán', 'Tiếng Việt', 'Ngữ văn', 'Tiếng Anh', 'Khoa học', 'KHTN', 'Lịch sử và Địa lí', 'Đạo đức', 'GDCD', 'Âm nhạc', 'Mĩ thuật',
  'Tin học', 'Công nghệ', 'Giáo dục thể chất', 'Bơi', 'Hoạt động trải nghiệm', 'Sinh hoạt dưới cờ', 'Sinh hoạt lớp', 'Tự học'];
// Thời khoá biểu mẫu: 7 tiết, nghỉ trưa sau tiết 4, Thứ Hai đến Thứ Sáu.
const SAMPLE_PERIODS = [['08:00', '08:35'], ['08:45', '09:20'], ['09:40', '10:15'], ['10:25', '11:00'], ['14:10', '14:45'], ['14:55', '15:30'], ['15:40', '16:15']];
// Thời khoá biểu có sẵn của từng con, năm học 2026 – 2027. Bản lớp 4A của Su là bản học kì I. Mỗi dòng của `subj` là một tiết, các cột từ Thứ Hai đến Thứ Sáu.
// Chỉ gợi ý cho con có tên trong `kids`.
const SAMPLE_TKBS = [
  { kids: ['su', 'misu'], cls: 'Lớp 4A', year: '2026 – 2027', days: [1, 2, 3, 4, 5], lunch: 4, times: SAMPLE_PERIODS, subj: [
    ['SHĐT', 'Toán', 'Mĩ thuật', 'GDTC', 'GDTC'],
    ['HĐTN', 'Âm nhạc', 'Toán', 'LS-ĐL', 'Tiếng Anh'],
    ['Toán', 'Tiếng Anh', 'Tiếng Việt', 'Tiếng Anh', 'Toán'],
    ['LS-ĐL', 'Khoa học', 'HSTN', 'Toán', 'Tiếng Anh TC'],
    ['Tiếng Việt', 'Tiếng Việt', 'Tin học', 'Tiếng Việt', 'Tiếng Việt TC'],
    ['Toán TC', 'Tiếng Việt', 'Tiếng Việt', 'Tiếng Việt', 'HSTN'],
    ['Tiếng Anh', 'Đạo đức', 'Công nghệ', 'Khoa học', 'SHS'],
  ] },
  { kids: ['sa', 'misa'], cls: 'Lớp 7A', year: '2026 – 2027', days: [1, 2, 3, 4, 5], lunch: 4,
    times: [['07:30', '08:15'], ['08:20', '09:05'], ['09:25', '10:10'], ['10:15', '11:00'], ['13:45', '14:30'], ['14:35', '15:20'], ['15:25', '16:10']], subj: [
    ['Sinh hoạt Đội', 'Thể dục', 'Anh', 'Nhạc', 'Sử'],
    ['HĐTN', 'Thể dục', 'Anh TC', 'GDĐP', 'Địa'],
    ['Toán', 'Mĩ thuật', 'Công nghệ', 'KHTN Vật sống', 'Tự học'],
    ['Toán', 'Sử', 'KHTN Chất', 'KHTN Vật sống', 'Tự học'],
    ['Văn', 'Anh', 'Văn', 'Toán', 'Toán TC'],
    ['KHTN Năng lượng', 'Anh', 'Văn', 'Văn', 'Kĩ năng sống'],
    ['GDCD', 'Tin', 'Toán', 'Văn TC', 'Sinh hoạt lớp'],
  ] },
];

// ---------- state ----------
let S = Object.fromEntries(COLS.map(c => [c, {}]));
const UI = { view: 'hom-nay', date: today(), acctKid: null, acctKind: 'penalty', histAll: false, slotOpen: {}, learn: 'sap-toi', todayMode: 'day', todayKid: null, secOpen: {}, gridWs: null, planNext: false, agDate: null, taskDone: false, tkbKid: null, tkbDay: null, km: { on: false, kid: null }, sheet: false };
let store = null, loaded = false, stale = false, family = null;
// Đang vẽ cho con xem (mục Học tập ở màn của con): các nút thêm, sửa không hiện.
let RO = false;
const FAMILY_KEY = 'be-cham-ngoan-family';
const getFamily = () => { try { return localStorage.getItem(FAMILY_KEY); } catch (e) { return null; } };
const setFamily = v => { try { v ? localStorage.setItem(FAMILY_KEY, v) : localStorage.removeItem(FAMILY_KEY); } catch (e) {} };
// Máy này của ai, nhớ theo từng gia đình: 'parent' (bố mẹ) hoặc mã của một con. Chỉ có tác dụng khi nhà đã đặt mã PIN bố mẹ.
const ROLE_KEY = 'be-cham-ngoan-role';
const roleMap = () => { try { return JSON.parse(localStorage.getItem(ROLE_KEY) || '{}') || {}; } catch (e) { return {}; } };
const getRole = () => roleMap()[family || 'local'] || null;
const setRole = v => { try { const m = roleMap(); if (v) m[family || 'local'] = v; else delete m[family || 'local']; localStorage.setItem(ROLE_KEY, JSON.stringify(m)); } catch (e) {} };

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
// Bảng giá: { name, icon, kind: 'gift' | 'penalty' | 'fee', price (đồng; phí sử dụng là đồng/giờ; quà giá 0 là miễn phí),
//   all: true = phạt mất hết tiền đang có, week: true = phạt mất hết tiền được thưởng trong tuần }.
// Mục cũ chỉ có cost (sao) và không có kind là đổi quà.
const priceKind = r => ['penalty', 'fee', 'merit'].includes(r.kind) ? r.kind : 'gift';
const priceVnd = r => r.price != null ? Math.max(0, Number(r.price) || 0) : (Number(r.cost) || 0) * STAR_VND;
const pricesList = kind => Object.entries(S.rewards).map(([id, r]) => ({ id, ...r })).filter(r => !kind || priceKind(r) === kind)
  .sort((a, b) => (a.all ? 2 : a.week ? 1 : 0) - (b.all ? 2 : b.week ? 1 : 0) || priceVnd(a) - priceVnd(b) || String(a.name).localeCompare(String(b.name), 'vi'));
// Việc nhà: { name, icon, money (đồng), kids, days, order,
//   kind: 'must' (phải làm, có tiền) | 'extra' (làm thêm, có tiền, không bắt buộc)
//         | 'fun' (thích làm, không có tiền, mở khoá khi xong việc phải làm),
//   slot: 'sang' | 'chieu' | 'toi' | '' , time: "HH:MM", by: true = phải xong trước giờ đó, minutes,
//   perWeek: số lần mỗi tuần (ngày nào trong `days` cũng được), steps: [danh sách con],
//   variants: [nội dung xen kẽ], shared: true = việc chung, một con đánh dấu là tính cho cả nhà,
//   prep: true = chỉ hiện vào hôm trước ngày con có buổi học thêm (chuẩn bị sách vở, nộp bài tập), prep: 'school' = chỉ hiện vào hôm trước ngày con đi học,
//   imp: true = việc quan trọng, có nhãn Quan trọng ở màn Hôm nay và màn của con,
//   claim: true = ai làm trước thì tính: một con làm thì con kia không phải làm nữa, cùng làm thì tính cả hai và chia đều tiền }
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
const weekBonusOf = k => k.weekBonus != null ? Math.max(0, Number(k.weekBonus) || 0) : WEEK_BONUS_OLD;
// Thưởng theo ngày: k.dayFrom là thứ Hai của tuần bắt đầu thưởng theo ngày, k.dayBonus là số tiền mỗi ngày đủ việc.
// Các tuần trước k.dayFrom (và con chưa có k.dayFrom) vẫn tính thưởng đủ tuần như cũ, để số dư đã có không đổi.
const isDaily = k => !!k?.dayFrom;
const dayBonusOf = k => Math.max(0, Number(k?.dayBonus) || 0);
// Thưởng của ngày dk. k.dbLog ghi mỗi lần đổi số tiền: [{ from: ngày bắt đầu áp dụng, amount, prev }], các ngày đã qua giữ nguyên.
function dayBonusAt(k, dk) {
  if (!k?.dayFrom || dk < k.dayFrom) return 0;
  const log = Array.isArray(k.dbLog) ? k.dbLog : [];
  let amt = log.length ? log[0].prev : dayBonusOf(k);
  for (const e of log) if (e.from <= dk) amt = e.amount;
  return Math.max(0, Number(amt) || 0);
}
// Số tiền thưởng đang áp dụng của con (theo ngày hoặc theo tuần), và câu mô tả dùng trong các dòng giải thích.
const bonusOf = k => isDaily(k) ? dayBonusOf(k) : weekBonusOf(k);
const bonusRule = k => !bonusOf(k) ? '' : isDaily(k) ? `ngày nào làm đủ việc thì thưởng ${money(bonusOf(k))}` : `làm đủ cả tuần thì thưởng ${money(bonusOf(k))}`;
const bonusRules = kids => [...new Set(kids.map(bonusRule))].filter(Boolean).join(' / ');
// Việc bắt buộc mỗi ngày: không cộng tiền từng lần, quyết định thưởng làm đủ việc (theo ngày hoặc cả tuần).
const isWeekly = c => isMust(c) && !choreVnd(c);
// c.weeklyFrom: thứ Hai của tuần việc này bắt đầu là việc bắt buộc (khi chuyển từ "tiền từng lần" sang), để các tuần trước giữ nguyên cách tính cũ.
// Việc mới thêm (c.since) cũng chỉ là việc bắt buộc từ tuần được thêm.
const weeklyIn = (c, wk) => isWeekly(c) && (!c.weeklyFrom || c.weeklyFrom <= wk) && (!c.since || key(weekStart(parse(c.since))) <= wk);
// Trong tuần wk con này có việc bắt buộc nào không. Nhà chưa có (dữ liệu cũ) thì mọi việc mỗi ngày đều tính là phải làm, như trước đây.
const hasWeekly = (kidId, wk) => memoize('hw' + kidId + wk, () => choresList().some(c => (c.kids || []).includes(kidId) && weeklyIn(c, wk)));
const reqIn = (c, kidId, wk) => isMust(c) && (!hasWeekly(kidId, wk) || weeklyIn(c, wk));
// c.since: ngày thêm việc. Trước ngày đó việc này chưa có, để thêm việc mới không làm hỏng chuỗi ngày và thưởng của các tuần đã qua.
const onDay = (c, d) => (c.days || []).includes(d.getDay()) && (!c.since || key(d) >= c.since);
// Thưởng đủ tuần của tuần bắt đầu ngày wsKey. k.wbLog ghi mỗi lần đổi số tiền: [{ from: thứ Hai của tuần bắt đầu áp dụng, amount, prev }],
// để đổi mức thưởng thì chỉ tính từ tuần đó, các tuần đã qua giữ nguyên.
function weekBonusAt(k, wsKey) {
  const log = Array.isArray(k.wbLog) ? k.wbLog : [];
  let amt = log.length ? log[0].prev : weekBonusOf(k);
  for (const e of log) if (e.from <= wsKey) amt = e.amount;
  return Math.max(0, Number(amt) || 0);
}
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
// Việc chỉ có vào hôm trước (c.prep). true: hôm sau con có buổi học thêm. 'school': hôm sau con đi học
// (theo thời khoá biểu, trừ ngày nghỉ trong Mốc năm học; chưa nhập thời khoá biểu thì tính Thứ Hai đến Thứ Sáu).
const schoolTomorrow = (kidId, d) => { const x = addDays(d, 1); return tkbOf(kidId) ? !!schoolOn(kidId, x) : !holidayOn(kidId, x) && x.getDay() >= 1 && x.getDay() <= 5; };
const prepFor = (c, kidId, d) => !c.prep || (c.prep === 'school' ? schoolTomorrow(kidId, d) : lessonsOn(kidId, addDays(d, 1).getDay()).length > 0);
// Phạt tăng nặng (r.again): lần đầu trong tuần trừ r.price, từ lần thứ hai trong cùng tuần (Thứ Hai đến Chủ nhật) trừ r.again.
// Mỗi lần phạt ghi mã mục (ledger.rid) để đếm.
const penaltyTimes = (rid, kidId, d = today()) => { const a = key(weekStart(d)), b = key(addDays(weekStart(d), 6)); return Object.values(S.ledger).filter(l => l.kid === kidId && l.rid === rid && l.at && key(new Date(l.at)) >= a && key(new Date(l.at)) <= b).length; };
const againVnd = r => r.kind === 'penalty' && !r.all && !r.week ? Math.max(0, Math.round(Number(r.again) || 0)) : 0;
const penaltyVnd = (r, kidId) => againVnd(r) && penaltyTimes(r.id, kidId) > 0 ? againVnd(r) : priceVnd(r);
const choresFor = (kidId, d) => choresList().filter(c => (c.kids || []).includes(kidId) && onDay(c, d) && prepFor(c, kidId, d)
  && (!perWeekOf(c) || isDone(d, kidId, c.id) || weekCount(kidId, c, d, true) < perWeekOf(c)));
// Ngày con dùng phiếu "Một ngày không làm việc nhà": việc phải làm được miễn (làm thì vẫn có tiền).
const skipEntry = (kidId, d) => memoize('skips', () => { const m = {}; for (const l of Object.values(S.ledger)) if (l.skip) m[l.kid + '|' + l.skip] = l; return m; })[kidId + '|' + key(d)] || null;
const skipOn = (kidId, d) => !!skipEntry(kidId, d);
// Việc ai làm trước thì tính (c.claim): mỗi ngày là một việc của cả nhà. claimers: các con đã làm trong ngày d;
// takenBy: những con khác đã làm khi con này chưa làm; claimVal: tiền mỗi con nhận khi n con cùng làm.
const claimers = (c, d) => c.claim ? (c.kids || []).filter(x => S.kids[x] && isDone(d, x, c.id)) : [];
const takenBy = (c, kidId, d) => c.claim && !isDone(d, kidId, c.id) ? claimers(c, d).filter(x => x !== kidId) : [];
const claimVal = (c, n) => n > 1 && choreVnd(c) ? Math.max(100, Math.round(choreVnd(c) / n)) : doneVal(c);
// Việc phải làm (bắt buộc) của con trong ngày d: tính vào tiến độ ngày, chuỗi ngày và thưởng làm đủ việc.
// Việc "ai làm trước thì tính" đã có con khác làm thì con này không phải làm nữa.
const mustFor = (kidId, d) => { if (skipOn(kidId, d)) return []; const wk = key(weekStart(d)); return choresFor(kidId, d).filter(c => reqIn(c, kidId, wk) && !takenBy(c, kidId, d).length); };
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
    const first = Object.keys(S.done).filter(dk => S.done[dk]?.[kidId]).sort()[0];
    const start = weekStart(k.since ? parse(k.since) : first ? parse(first) : today()), end = weekStart(today()), out = [];
    for (let ws = start, i = 0; ws <= end && i < 520; ws = addDays(ws, 7), i++) {
      const st = weekStats({ id: kidId, ...k }, ws);
      if (k.dayFrom && key(ws) >= k.dayFrom) break;
      const amt = weekBonusAt(k, key(ws));
      if (amt && st.possible && st.done >= st.possible) out.push({ ws, amount: amt });
    }
    return out;
  });
}
// Các ngày con làm đủ mọi việc phải làm, từ khi thưởng theo ngày: [{ d, dk, amount }]. Hôm nay được tính khi đã đủ.
function dayBonuses(kidId) {
  return memoize('db' + kidId, () => {
    const k = S.kids[kidId]; if (!k?.dayFrom) return [];
    const from = kidSince(kidId), start = parse(k.dayFrom) > from ? parse(k.dayFrom) : from, end = today(), out = [];
    for (let d = start, i = 0; d <= end && i < 3660; d = addDays(d, 1), i++) {
      const amt = dayBonusAt(k, key(d));
      if (amt && dayFull(kidId, d) === true) out.push({ d, dk: key(d), amount: amt });
    }
    return out;
  });
}
// Các mục thành tích con được báo. Nhà chưa từng được thêm sẵn (máy bố mẹ chưa mở bản này) thì dùng tạm bảng mẫu.
const meritSeeded = () => !!S.paid?.caidat?.merit;
const meritList = () => { const l = pricesList('merit'); return l.length || meritSeeded() ? l : SAMPLE_MERITS.map((m, i) => ({ id: 'merit-' + (i + 1), kind: 'merit', ...m })); };
// Thành tích con đã báo, đang chờ bố mẹ duyệt. Nằm trong sổ tài khoản với amount = 0 (chưa tính vào số dư, cả với máy chưa cập nhật app),
// số tiền sẽ cộng ghi ở ask. Duyệt: amount = ask, bỏ pending. Không duyệt: xoá.
const pendingList = kidId => Object.entries(S.ledger).filter(([, l]) => l.pending && S.kids[l.kid] && (!kidId || l.kid === kidId)).map(([id, l]) => ({ id, ...l })).sort((a, b) => String(a.at).localeCompare(String(b.at)));
// Tiền thưởng ngày đủ việc từ ngày a đến ngày b (khoá "YYYY-MM-DD").
const dayBonusIn = (kidId, a = '', b = '9999') => dayBonuses(kidId).reduce((s, x) => s + (x.dk >= a && x.dk <= b ? x.amount : 0), 0);
// Tiền con được thưởng trong tuần chứa ngày d, tính tới hết ngày d: tiền việc nhà, thưởng ngày đủ việc, thưởng thêm,
// trừ phần đã bị phạt "mất tiền thưởng của tuần" trước đó (ledger.wipe = thứ Hai của tuần).
function weekGain(kidId, d = today()) {
  const a = key(weekStart(d)), b = key(d);
  let s = earned(kidId, a, b) + dayBonusIn(kidId, a, b);
  for (const l of Object.values(S.ledger)) {
    if (l.kid !== kidId) continue;
    if (l.wipe === a) s += ledgerVnd(l);
    else if (l.kind === 'bonus' && l.at) { const lk = key(new Date(l.at)); if (lk >= a && lk <= b) s += ledgerVnd(l); }
  }
  return Math.max(0, s);
}
function balance(kidId) {
  return memoize('bal' + kidId, () => {
    let s = earned(kidId);
    for (const l of Object.values(S.ledger)) if (l.kid === kidId) s += ledgerVnd(l);
    for (const w of weekBonuses(kidId)) s += w.amount;
    for (const x of dayBonuses(kidId)) s += x.amount;
    return s;
  });
}
const moneyChip = (k, style = '') => `<span class="stars num ${balance(k.id) < 0 ? 'neg' : ''}" title="Số tiền trong tài khoản" ${style ? `style="${style}"` : ''}>${money(balance(k.id))}</span>`;
function weekStats(kid, ws) {
  let possible = 0, done = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(ws, i); for (const c of mustFor(kid.id, d)) if (!perWeekOf(c)) { possible++; if (isDone(d, kid.id, c.id)) done++; } }
  // Việc X lần mỗi tuần tính X lần, không tính theo từng ngày.
  for (const c of choresList()) if (perWeekOf(c) && (c.kids || []).includes(kid.id) && reqIn(c, kid.id, key(ws)) && (!c.since || c.since <= key(addDays(ws, 6)))) { const n = perWeekOf(c); possible += n; done += Math.min(n, weekCount(kid.id, c, addDays(ws, 6))); }
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
const streakChip = k => { const n = streakOf(k.id); return n ? `<span class="streak" title="Số ngày liên tiếp làm đủ việc phải làm">🔥 ${n} ngày liên tiếp</span>` : ''; };
const kidName = id => S.kids[id]?.name || 'Bé';
// Màu nền thẻ của con: theo bộ hình (Su vàng, Sa be) nếu dùng bộ gà, ngựa; không thì theo màu đã chọn.
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
  return [isFun(c) || isWeekly(c) ? '' : money(choreVnd(c)), (c.kids || []).map(kidName).map(esc).join(', ') || 'chưa giao cho ai',
    perWeekOf(c) ? `${perWeekOf(c)} lần/tuần (${daysLabel(c.days)})` : daysLabel(c.days),
    choreSlot(c) ? `${toMin(c.time) !== null ? (c.by ? 'trước ' : '') + esc(c.time) : sl[1].replace('Buổi ', '').toLowerCase()}` : '',
    Number(c.minutes) ? `${Number(c.minutes)} phút` : '', (c.steps || []).length ? `${c.steps.length} mục con` : '',
    (c.variants || []).length ? `xen kẽ: ${c.variants.map(esc).join(' / ')}` : '', c.shared ? 'việc chung' : '', c.claim ? 'ai làm trước thì tính' : '', c.prep === 'school' ? 'chỉ khi hôm sau đi học' : c.prep ? 'tối trước buổi học thêm' : '', c.imp ? 'quan trọng' : ''].filter(Boolean).join(' · ');
}
function daysLabel(days) {
  const s = [...(days || [])].sort();
  if (s.length === 7) return 'mỗi ngày';
  if (s.join() === '1,2,3,4,5') return 'ngày thường';
  if (s.join() === '0,6') return 'cuối tuần';
  if (!s.length) return 'chưa chọn ngày';
  return WEEK_ORDER.filter(d => s.includes(d)).map(d => WDS[d]).join(', ');
}
const modeLabel = k => isDaily(k) ? (dayBonusOf(k) ? `mỗi ngày làm đủ việc được thưởng ${money(dayBonusOf(k))}` : 'không có thưởng ngày đủ việc') : weekBonusOf(k) ? `làm đủ việc cả tuần được thưởng ${money(weekBonusOf(k))}` : 'không có thưởng đủ tuần';
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
// Thời khoá biểu có sẵn của con này (theo tên), không có thì null.
const tkbOffer = k => (k && SAMPLE_TKBS.find(sp => sp.kids.includes(String(k.name || '').trim().toLowerCase()))) || null;
const sampleTkb = sp => sp ? { cls: sp.cls, year: sp.year, days: [...sp.days], lunch: sp.lunch,
  rows: sp.times.map(([s, e], i) => ({ s, e, d: Object.fromEntries(sp.days.map((d, j) => [d, sp.subj[i][j]])) })) } : undefined;
const sampleLabel = sp => `${sp.cls} · ${sp.year}`;
// Giờ và môn của từng tiết, để biết bản đang nhập đã giống thời khoá biểu có sẵn chưa.
const tkbSig = t => JSON.stringify((t.rows || []).map(r => [r.s, r.e, ...tkbDays(t).map(d => String((r.d || {})[d] || '').trim())]));
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
const isSoon = e => { const w = eventWhen(e); return !w.past && (w.now || daysTo(e.from) <= (e.kind === 'exam' ? 14 : 7)); };
const eventsSoon = kidId => eventsOf(kidId).filter(isSoon);
// Ngày viết ngắn cho dòng nhắc: "T5 19/11" hoặc "21/11 – 25/11".
const eventShort = e => { const a = parse(e.from), b = parse(e.to); return e.from === e.to ? `${WDS[a.getDay()]} ${dm(a)}` : `${dm(a)} – ${dm(b)}`; };
const eventLine = (e, cls, kid) => `<a class="${cls} ${esc(e.kind)}" href="#lich-hoc" data-act="tkb-go" data-tab="moc" data-kid="${kid}"><b>${esc(e.icon || '📌')} ${esc(eventWhen(e).txt)}:</b> ${esc(e.name)} <span class="muted">(${esc(cls === 'km-event' ? eventRange(e) : eventShort(e))})</span></a>`;
// own: chỉ lấy mốc ghi riêng cho con này (mốc chung cả nhà đã hiện một lần ở đầu màn Hôm nay).
const eventLines = (k, cls = 'event-line', own = false) => eventsSoon(k.id).filter(e => !own || (e.kids || []).length).map(e => eventLine(e, cls, k.id)).join('');
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
      <div class="acts">${w.past ? '' : `<span class="badge ${w.now ? 'ok' : ''}">${esc(w.txt)}</span>`}${editBtn('event-form', e.id, e.name)}</div></div>`;
  };
  const kidAttr = `data-kid="${kidId || ''}"`;
  let h = miss.length && kids.length && !RO ? suggest(`Có sẵn ${miss.length} mốc ${SAMPLE_YEAR.label}`, 'Khai giảng, các đợt kiểm tra, nghỉ Tết, họp phụ huynh, bế giảng.', 'Xem và thêm', 'year-form') : '';
  h += `<div class="slots"><section class="slot tn3">${secHead('📌', 'Sắp tới', { cnt: rest.length || '', add: addBtn('event-form', 'Thêm mốc năm học', kidAttr) })}${rest.length ? `<div class="slot-list list">${rest.map(row).join('')}</div>` : blankAdd('Ghi ngày kiểm tra, nghỉ Tết, họp phụ huynh', 'event-form', kidAttr, 'Chưa có mốc nào sắp tới')}</section>`;
  if (past.length) h += `<section class="slot">${secHead('', 'Đã qua', { cnt: past.length, key: 'moc-past', closed: true })}${secIsOpen('moc-past', true) ? `<div class="slot-list list">${past.map(row).join('')}</div>` : ''}</section>`;
  return h + `</div>${list.length || RO ? '' : '<p class="foot-note">App nhắc trước ở màn Hôm nay; những ngày nghỉ học thì không báo giờ ở trường.</p>'}`;
}
const EVENT_HELP = { exam: 'App nhắc trước 14 ngày', holiday: 'Những ngày này app không báo giờ ở trường và soạn cặp', meeting: 'App nhắc trước 7 ngày', event: 'App nhắc trước 7 ngày' };
function eventForm(id, kidPre) {
  const e = id ? S.events[id] : null, kids = kidsList();
  const sel = e ? (e.kids || []) : S.kids[kidPre] ? [kidPre] : [];
  const kind = e?.kind || 'event';
  openModal(`<h2>${e ? 'Sửa mốc' : 'Thêm mốc năm học'}</h2>
  ${titleCard('ename', e?.name, 'Tên mốc', { max: 60, icoName: 'eico', icons: EVENT_ICONS, ico: e?.icon || EVENT_KINDS.find(x => x[0] === kind)[2], attr: e ? '' : 'data-new="1"' })}
  <div class="fg">
    ${frow('Loại', pillSel('ekind', EVENT_KINDS.map(([v, l]) => [v, l]), kind), { id: 'ekind', sub: EVENT_HELP[kind], subId: 'ekind-help' })}
    ${frow('Từ ngày', `<input id="efrom" class="pillin num" type="date" value="${esc(e?.from || '')}">`, { id: 'efrom' })}
    ${frow('Đến ngày', `<input id="eto" class="pillin num" type="date" value="${esc(e?.to && e.to !== e.from ? e.to : '')}">`, { id: 'eto', sub: 'Bỏ trống nếu chỉ một ngày' })}
    ${kids.length > 1 ? kidRow('Của con nào', 'ekid', 'checkbox', sel, 'Không chọn ai thì là mốc chung của cả nhà') : ''}
  </div>
  ${formFoot(e ? 'event-del' : '', id, 'event-save')}`);
}
function yearForm() {
  const kids = kidsList(), miss = missingYear();
  const pre = kids.filter(k => /(^|\D)4(\D|$)/.test(tkbOf(k.id)?.cls || '')).map(k => k.id);
  openModal(`<h2>Mốc ${SAMPLE_YEAR.label}</h2>
  <p class="muted small lead">Khung thời gian năm học khối 4 theo hướng dẫn của Bộ GD&ĐT và Sở GD&ĐT Hà Nội: ${miss.length} mốc, từ ngày tập trung đến bế giảng. Thêm xong sửa lại tuỳ ý.</p>
  ${kids.length > 1 ? `<div class="fg">${kidRow('Cho con nào', 'ykid', 'checkbox', pre, 'Không chọn ai thì là mốc chung của cả nhà')}</div>` : ''}
  <div class="fg"><div class="list">${miss.map(e => `<div class="item"><span class="ico">${e.icon}</span><div class="txt"><div class="t">${esc(e.name)}</div><div class="s num">${esc(eventRange({ ...e, to: e.to || e.from }))}</div></div></div>`).join('')}</div></div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="year-add">Thêm ${miss.length} mốc</button></div>`);
}
// Màu cố định cho mỗi môn, để cùng một môn luôn cùng một màu.
const subjTint = name => { let h = 0; for (const ch of String(name).toLowerCase().trim()) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h % 6; };
const subjChips = list => list.map(s => `<span class="sj-chip sj${subjTint(s)}">${esc(s)}</span>`).join('');
// Bảng lưới cả tuần, chỉ dùng khi in.
function tkbTable(t) {
  const days = tkbDays(t), lunch = Number(t.lunch) || 0;
  let h = `<div class="tbl-wrap"><table class="tkb"><colgroup><col style="width:44px"><col style="width:62px">${days.map(() => '<col>').join('')}</colgroup>
    <thead><tr><th>Tiết</th><th>Giờ</th>${days.map(d => `<th>${WDN(d)}</th>`).join('')}</tr></thead><tbody>`;
  t.rows.forEach((r, i) => {
    if (i > 0 && i === lunch) h += `<tr class="lunch"><td colspan="${days.length + 2}">🍱 Nghỉ trưa ${esc(t.rows[i - 1].e)} – ${esc(r.s)}</td></tr>`;
    h += `<tr><td class="p num">${i + 1}</td><td class="tm num">${esc(r.s)}<br>${esc(r.e)}</td>${days.map(d => {
      const v = String((r.d || {})[d] || '').trim();
      return v ? `<td class="sj sj${subjTint(v)}">${esc(v)}</td>` : `<td class="no"></td>`;
    }).join('')}</tr>`;
  });
  return h + `</tbody></table></div>`;
}
// Thứ đang xem ở tab Thời khoá biểu. Chưa chọn thì là buổi học tới, để soạn cặp: Thứ Bảy, Chủ nhật hiện Thứ Hai, Thứ Hai hiện Thứ Ba.
// Thứ tự chọn thì lấy ngày gần nhất rơi vào thứ đó, tính cả hôm nay.
function tkbDayOf(k, t) {
  const days = tkbDays(t), td = today(), nx = nextSchool(t, td, k.id);
  const picked = days.includes(UI.tkbDay);
  const wd = picked ? UI.tkbDay : nx ? nx.date.getDay() : days[0];
  const date = !picked && nx ? nx.date : addDays(td, (wd - td.getDay() + 7) % 7);
  return { wd, date, isNext: !!nx && key(nx.date) === key(date) };
}
// Một ngày: thanh gạt chọn thứ, rồi mỗi tiết một dòng (số tiết, giờ, môn).
function tkbDayView(k, t) {
  const days = tkbDays(t), td = today(), { wd, date, isNext } = tkbDayOf(k, t), lunch = Number(t.lunch) || 0;
  const isT = key(date) === key(td), hol = holidayOn(k.id, date), info = hol ? null : schoolDay(t, wd), now = isT ? nowMin() : null;
  const dd = isT ? 'Hôm nay' : key(date) === key(addDays(td, 1)) ? 'Ngày mai' : '';
  const span = info ? `${info.list.length} tiết, ${esc(info.start)} – ${esc(info.end)}` : '';
  const sub = hol ? `Nghỉ học: ${esc(hol.name)}` : !info ? 'Không có tiết nào' : isT && now >= toMin(info.end) ? `Đã tan học · ${span}` : isNext ? `🎒 Soạn cặp cho buổi này · ${span}` : span;
  const rows = info ? t.rows.map((r, i) => {
    const v = String((r.d || {})[wd] || '').trim(), live = now !== null && toMin(r.s) <= now && now < toMin(r.e);
    return `${i > 0 && i === lunch ? `<div class="td-lunch">🍱 Nghỉ trưa <span class="num">${esc(t.rows[i - 1].e)} – ${esc(r.s)}</span></div>` : ''}
      <div class="td-row ${v ? '' : 'no'} ${live && v ? 'now' : ''}"><b class="td-n num">${i + 1}</b><span class="td-t num">${esc(r.s)}<br>${esc(r.e)}</span><span class="td-s ${v ? 'sj' + subjTint(v) : ''}">${v ? esc(v) : 'Không có tiết'}${live && v ? '<i>Đang học</i>' : ''}</span></div>`;
  }).join('') : '';
  return `<div class="tkb-days" role="tablist" aria-label="Chọn thứ">${days.map(d => `<button role="tab" aria-selected="${d === wd}" class="${d === wd ? 'on' : ''} ${d === td.getDay() ? 'today' : ''}" data-act="tkb-day" data-d="${d}">${days.length > 5 ? WDS[d] : WDN(d)}</button>`).join('')}</div>
    <div class="td-head"><b class="kid-sum-t">${dd ? `${dd}, ${WD[wd].toLowerCase()}` : WD[wd]} ${dm(date)}</b><span class="muted small">${sub}</span></div>
    ${rows ? `<div class="td-list">${rows}</div>` : ''}`;
}
// Cả tuần: mỗi thứ một dòng, buổi sáng ở trên, buổi chiều ở dưới; các tiết liền nhau cùng môn gộp lại (Toán ×2). Bấm một thứ để xem ngày đó.
function tkbWeek(k, t) {
  const days = tkbDays(t), td = today().getDay(), { wd } = tkbDayOf(k, t), lunch = Number(t.lunch) || 0;
  const chips = list => {
    const out = [];
    for (const x of list) { const last = out[out.length - 1]; if (last && last.subj === x.subj && last.to === x.i - 1) { last.n++; last.to = x.i; } else out.push({ subj: x.subj, n: 1, to: x.i }); }
    return out.map(x => `<span class="sj-chip sj${subjTint(x.subj)}">${esc(x.subj)}${x.n > 1 ? ` <b class="num">×${x.n}</b>` : ''}</span>`).join('');
  };
  return `<section class="slot">${secHead('', 'Cả tuần')}<div class="slot-list tkb-week" style="--n:${days.length}">${days.map(d => {
    const info = schoolDay(t, d), am = info ? info.list.filter(x => !lunch || x.i < lunch) : [], pm = info && lunch ? info.list.filter(x => x.i >= lunch) : [];
    return `<button class="twd ${d === wd ? 'on' : ''} ${d === td ? 'today' : ''}" data-act="tkb-day" data-d="${d}" data-kid="${k.id}" aria-label="Xem ${WD[d]}">
      <span class="twd-d"><b>${WDN(d)}</b>${info ? `<span class="num">${esc(info.start)} – ${esc(info.end)}</span>` : ''}${d === td ? '<span class="twd-now">hôm nay</span>' : ''}</span>
      <span class="twd-s">${info ? `${am.length ? `<span class="sj-list">${chips(am)}</span>` : ''}${pm.length ? `<span class="sj-list pm">${chips(pm)}</span>` : ''}` : '<span class="muted small">Không có tiết</span>'}</span></button>`;
  }).join('')}</div></section>`;
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
  openModal(`<h2>Các con ở đâu</h2><p class="muted small lead">Mỗi thứ trong tuần, ban ngày và buổi tối các con ở nhà nào. Ban ngày bỏ trống nếu con đi học bình thường.</p>
  <div class="fg f-pad"><div class="stay-rows"><div></div><span class="lbl">Ban ngày</span><span class="lbl">Buổi tối</span>
  ${WEEK_ORDER.map(d => { const x = (S.stays || {})[String(d)] || {}; return `<b>${WDN(d)}</b>
    <input class="input" list="place-list" maxlength="24" data-sd="${d}" value="${esc(placeName(x.day))}" placeholder="Đi học" aria-label="${WDN(d)} ban ngày">
    <input class="input" list="place-list" maxlength="24" data-sn="${d}" value="${esc(placeName(x.night))}" placeholder="Chưa ghi" aria-label="${WDN(d)} buổi tối">`; }).join('')}</div>
  <datalist id="place-list">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
  <span class="fs">Gõ vài chữ đầu để chọn: ${names.map(esc).join(', ')}.</span></div>
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
const SLOTS = [['sang', 'Buổi sáng', '🌅'], ['chieu', 'Buổi chiều', '☀️'], ['toi', 'Buổi tối', '🌙'], ['', 'Lúc nào cũng được', '🕒']];
const slotAt = m => m < 12 * 60 ? 'sang' : m < 18 * 60 ? 'chieu' : 'toi';
// Buổi nào mở sẵn ở màn Hôm nay. Xem hôm nay (cur = buổi đang diễn ra): chỉ mở buổi đó, các buổi khác thu gọn còn nhãn và số việc;
// "Lúc nào cũng được" mở khi còn việc chưa xong hoặc có việc thích làm; việc làm thêm mở khi đã có làm.
// Xem ngày khác (cur = null) thì mở những buổi còn việc chưa xong. Bấm nhãn để mở, đóng; lựa chọn đó giữ tới khi sang buổi khác.
const slotOpenDefault = (g, cur, full, nd, hasFun) => g.extra ? nd > 0 : cur && g.id ? g.id === cur : !full || hasFun;
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
  const req = new Set(mustFor(kidId, d).map(c => c.id));
  for (const g of groups) {
    const scope = (g.id ? g.items : items).filter(x => x.type === 'chore' && req.has(x.c.id));
    g.open = scope.every(x => isDone(d, kidId, x.c.id));
    g.left = scope.filter(x => !isDone(d, kidId, x.c.id)).length;
    for (const x of g.items) if (x.type === 'chore' && isFun(x.c)) x.locked = !g.open;
  }
  // Việc làm thêm (có tiền, không bắt buộc) xếp riêng ở cuối ngày.
  if (extras.length) groups.push({ id: 'them', extra: true, label: 'Việc làm thêm', icon: '💪', open: true, left: 0,
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
  const got = c.claim && isDone(d, kidId, c.id) ? doneVnd(S.done[key(d)]?.[kidId]?.[c.id]) : choreVnd(c);
  const p = [c.imp ? '<b class="imp">Quan trọng</b>' : '', isFun(c) ? 'Việc thích làm' : isWeekly(c) ? '' : `<b class="earn">+${money(got)}</b>`].filter(Boolean);
  if (toMin(c.time) !== null) p.push(`${c.by ? 'trước ' : ''}${esc(c.time)}`);
  if (Number(c.minutes)) p.push(`${Number(c.minutes)} phút`);
  const n = perWeekOf(c); if (n) p.push(`${weekCount(kidId, c, d)}/${n} lần tuần này`);
  if (c.shared) p.push('👨‍👩‍👧 việc chung');
  if (c.prep === 'school') p.push(`${isToday ? 'mai' : 'hôm sau'} đi học`);
  else if (c.prep) { const ls = lessonsOn(kidId, addDays(d, 1).getDay()).map(l => esc(l.name)).filter(Boolean); if (ls.length) p.push(`${isToday ? 'mai' : 'hôm sau'} học ${ls.join(', ')}`); }
  if (c.claim && (c.kids || []).length > 1) {
    const mine = isDone(d, kidId, c.id), others = claimers(c, d).filter(x => x !== kidId).map(kidName).map(esc).join(', ');
    p.push(others ? (mine ? `🙌 làm cùng ${others}${choreVnd(c) ? ', chia đều tiền' : ''}` : `🙋 ${others} đã làm${choreVnd(c) ? ' · làm cùng thì chia đều tiền' : ''}`) : mine ? '' : 'ai làm trước thì tính');
  }
  const v = variantOf(c, kidId, d); if (v) p.push(`hôm nay: <b>${esc(v)}</b>`);
  if (isToday && c.by && !isDone(d, kidId, c.id) && toMin(c.time) !== null && nowMin() > toMin(c.time)) p.push('<span class="late">⏰ quá giờ</span>');
  const busy = busyAt(kidId, d, toMin(c.time)); if (busy) p.push(`<span class="late">⚠️ lúc ${esc(c.time)} con đang ${esc(busy)}</span>`);
  return p.filter(Boolean).join(' · ');
}
const markRow = (x, big) => x.type === 'lesson'
  ? `<div class="${big ? 'big-mark' : 'item mark'}"><span class="ico">${lessonIcon(x.l.name)}</span><div class="txt"><div class="t"><span class="num">${esc(x.l.s)} – ${esc(x.l.e)}</span> ${esc(x.l.name)}</div>${placeTxt(x.l) ? `<div class="s">${placeTxt(x.l)}</div>` : ''}</div></div>`
  : `<div class="${big ? 'big-mark' : 'item mark'}"><span class="ico">${x.icon}</span><div class="txt"><div class="t"><span class="num">${hm(x.t)}</span> ${esc(x.text)}</div></div></div>`;

// ---------- rendering ----------
let raf = 0;
const render = () => { memo = {}; cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
function draw() {
  const navHtml = cls => NAV.map(n => `<a href="#${n.id}" class="${cls} ${UI.view === n.id ? 'on' : ''}" ${UI.view === n.id ? 'aria-current="page"' : ''}>${iconSvg(n.ic)}<span>${n.label}</span></a>`).join('');
  $('#rail').innerHTML = brand() + navHtml('');
  $('#tabs').innerHTML = navHtml('tab');
  const body = !loaded ? loading() : deviceRole() !== 'parent' ? '' : ({ 'hom-nay': viewToday, 'lich-hoc': viewSchedule, 'tai-khoan': viewAccount, 'bang-gia': viewPrices, 'gia-dinh': viewFamily }[UI.view] || viewToday)();
  // Máy của con (hoặc máy chưa chọn là của ai): không vẽ phần của bố mẹ bên dưới.
  $('#app').innerHTML = deviceRole() === 'parent' ? topbar() + body : '';
  drawKidMode();
  if (UI.sheet) drawSheet();
  const tb = $('#app .tabbar .on') || $('#km .tabbar .on'); if (tb) tb.parentElement.scrollLeft = Math.max(0, tb.offsetLeft - 60);
}
const brand = () => `<div class="brand"><span class="brand-mark">${STAR}</span>Misa Misu</div>`;
function topbar() {
  let s;
  // Chỉ hiện khi có điều cần báo (đang tải, mất mạng). Bình thường không chiếm chỗ; trạng thái lưu nằm ở mục Gia đình.
  if (!store || !loaded) s = 'Đang tải…';
  else if (store.kind !== 'local' && (stale || !navigator.onLine)) s = 'Đang offline, sẽ đồng bộ sau';
  else return '';
  return `<div class="topbar"><span class="sync wait"><i></i>${s}</span></div>`;
}
const loading = () => `<div class="card empty"><div class="big">⏳</div><h2>Đang mở bảng việc nhà…</h2><p class="muted">Danh sách các con, việc nhà và phần thưởng sẽ hiện ở đây.</p></div>`;
function noKids() {
  return `<div class="card empty"><div class="big">👧🧒</div><h2>Bắt đầu với các con</h2>
  <p class="muted">Thêm tên và hình đại diện cho từng con, sau đó giao việc nhà cho các con. Nếu có file sao lưu, vào mục Gia đình để nhập.</p>
  <div class="row" style="justify-content:center;margin-top:10px"><button class="btn primary" data-act="kid-form">Thêm con</button><button class="btn ghost" data-act="seed-form">Nạp lịch gia đình</button></div></div>`;
}

// ---------- bảng tuần (lưới việc × ngày) ----------
// Nút tròn nhỏ: dấu cộng, ba chấm, mũi tên xuống.
const PLUS = '<svg class="gl" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const DOTS = '<svg class="gl dots" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
const DOWN = '<svg class="chev down" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const PREV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>', NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
const skipNote = (k, d) => { const e = skipEntry(k.id, d); return e ? `<div class="skip-note">🎟️ ${key(d) === key(today()) ? 'Hôm nay' : 'Ngày này'} ${esc(k.name)} dùng phiếu “Một ngày không làm việc nhà”: việc phải làm được miễn, làm thì vẫn có tiền.</div>` : ''; };
function viewWeekGrid() {
  const kids = kidsList(), t = today(), ws = UI.gridWs || weekStart(t), days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  let h = `<div class="head"><button class="linkbtn back" data-act="today-mode" data-v="day">${PREV}Từng ngày</button><h1>Cả tuần</h1><p>Bấm vào ô để đánh dấu hoặc bỏ dấu.</p></div>
  <div class="daynav"><button class="iconbtn" data-act="grid-week" data-n="-7" aria-label="Tuần trước">${PREV}</button>
    <b>${dm(ws)} – ${dm(addDays(ws, 6))}</b>
    <button class="iconbtn" data-act="grid-week" data-n="7" aria-label="Tuần sau">${NEXT}</button>
    ${key(ws) === key(weekStart(t)) ? '' : '<button class="chip" data-act="grid-week" data-n="0">Tuần này</button>'}
    <button class="btn quiet sm push" data-act="sheet-open" ${kids.length ? '' : 'disabled'}>In kế hoạch tuần</button></div>`;
  if (!kids.length) return h + noKids();
  const so = c => (isExtra(c) ? 1e6 : 0) + SLOTS.findIndex(x => x[0] === choreSlot(c)) * 10000 + (toMin(c.time) ?? 9999);
  for (const k of kids) {
    const cs = choresList().filter(c => (c.kids || []).includes(k.id) && !isFun(c)).sort((a, b) => so(a) - so(b) || (a.order ?? 0) - (b.order ?? 0));
    // Việc làm thêm chỉ hiện khi tuần này có làm, cho bảng gọn.
    const rows = cs.filter(c => isMust(c) || days.some(d => isDone(d, k.id, c.id)));
    const st = weekStats(k, ws), dbw = dayBonusIn(k.id, key(ws), key(addDays(ws, 6))), wk = earned(k.id, key(ws), key(addDays(ws, 6))) + dbw;
    const cell = (c, d, ri) => {
      const on = isDone(d, k.id, c.id), sched = onDay(c, d), fut = d > t, skip = reqIn(c, k.id, key(ws)) && skipOn(k.id, d);
      const lbl = `${esc(c.name)}, ${WDN(d.getDay())} ${dm(d)}`;
      if (on) return `<td><button class="gc on" data-act="grid-tick" data-kid="${k.id}" data-chore="${c.id}" data-d="${key(d)}" aria-pressed="true" aria-label="Bỏ dấu: ${lbl}">✓</button></td>`;
      if (skip) return `<td><span class="gc skip" title="Dùng phiếu nghỉ">🎟️</span></td>`;
      if (fut) return `<td><span class="gc ${sched ? 'fut' : 'off'}"></span></td>`;
      return `<td><button class="gc ${sched ? '' : 'off'}" data-act="grid-tick" data-kid="${k.id}" data-chore="${c.id}" data-d="${key(d)}" aria-pressed="false" aria-label="Đánh dấu: ${lbl}"></button></td>`;
    };
    const count = c => {
      const n = days.filter(d => isDone(d, k.id, c.id)).length;
      if (isExtra(c)) return `${n} lần`;
      const exp = perWeekOf(c) || days.filter(d => onDay(c, d) && prepFor(c, k.id, d) && !(reqIn(c, k.id, key(ws)) && skipOn(k.id, d))).length;
      return `<span class="${n >= exp ? 'plus' : ''}">${Math.min(n, exp)}/${exp}</span>`;
    };
    const full = d => { const l = mustFor(k.id, d); return d <= t && l.length && l.every(c => isDone(d, k.id, c.id)); };
    h += `<section class="card"><div class="kid-head">${ava(k, 'sm')}<div class="kid-name">${esc(k.name)}</div><span class="muted small" style="margin-left:auto;text-align:right">việc phải làm <b class="num">${st.done}/${st.possible}</b><br>tuần này kiếm <b class="num plus">${money(wk)}</b></span></div>
      ${rows.length ? `<div class="tbl-wrap"><table class="wgrid"><thead><tr><th>Việc</th>${days.map(d => `<th class="${key(d) === key(t) ? 'on' : ''}">${WDS[d.getDay()]}<br><span>${d.getDate()}</span></th>`).join('')}<th>Xong</th></tr></thead><tbody>
      ${rows.map((c, ri) => `${isExtra(c) && (ri === 0 || !isExtra(rows[ri - 1])) ? `<tr class="sep"><td colspan="9">Việc làm thêm</td></tr>` : ''}<tr><td class="nm">${esc(c.icon || '')} ${esc(c.name)}${perWeekOf(c) ? ` <span class="muted">(${perWeekOf(c)} lần)</span>` : ''}</td>${days.map(d => cell(c, d, ri)).join('')}<td class="cnt num">${count(c)}</td></tr>`).join('')}
      <tr class="tot"><td class="nm">Đủ việc trong ngày</td>${days.map(d => `<td>${full(d) ? '⭐' : skipOn(k.id, d) ? '🎟️' : ''}</td>`).join('')}<td class="cnt num">${days.filter(full).length}</td></tr>
      </tbody></table></div>` : `<p class="muted" style="margin:8px 0 0">Chưa giao việc nào cho ${esc(k.name)}.</p>`}
      ${isDaily(k) ? (dayBonusOf(k) && st.possible ? `<div class="muted small" style="margin-top:8px">⭐ Mỗi ngày đủ việc thưởng ${money(dayBonusOf(k))}.${dbw ? ` Tuần này ${days.filter(full).length} ngày đủ việc, được thưởng ${money(dbw)}.` : ''}</div>` : '')
        : weekBonusOf(k) && st.possible ? `<div class="muted small" style="margin-top:8px">${st.done >= st.possible ? `🏆 Đủ cả tuần, được thưởng ${money(weekBonusOf(k))}.` : `Còn ${st.possible - st.done} việc phải làm nữa là đủ cả tuần, thưởng ${money(weekBonusOf(k))}.`}</div>` : ''}</section>`;
  }
  return h;
}

// Dải 7 ngày trong tuần của con đang xem: ✓ làm đủ, ✗ còn thiếu, vòng tiến độ cho hôm nay. Những ngày trước khi con bắt đầu dùng app không tính là thiếu.
// Điện thoại: vuốt ngang để sang tuần khác. Máy tính: hai mũi tên ở hai đầu.
function weekStrip(sel, kid) {
  const t = today(), ws = weekStart(sel), kids = kid ? [kid] : kidsList();
  const cells = Array.from({ length: 7 }, (_, i) => addDays(ws, i)).map(d => {
    let all = 0, done = 0, any = false;
    for (const k of kids) { if (d < kidSince(k.id)) continue; const l = mustFor(k.id, d); all += l.length; done += l.filter(c => isDone(d, k.id, c.id)).length; if (l.length) any = true; }
    const isT = key(d) === key(t), pct = all ? Math.round(done / all * 100) : 0;
    const st = d > t ? 'fut' : !any ? 'rest' : done >= all ? 'ok' : isT ? 'now' : 'miss';
    const ic = { ok: '✓', miss: '✕', rest: '', fut: '', now: '' }[st];
    const lbl = { ok: 'đủ việc', miss: 'còn thiếu việc', rest: 'không có việc', fut: 'chưa tới', now: `xong ${pct}%` }[st];
    return `<button class="wd ${st} ${isT ? 'today' : ''} ${key(d) === key(sel) ? 'on' : ''}" data-act="day-set" data-d="${key(d)}" aria-label="${WD[d.getDay()]} ${dm(d)}: ${lbl}" ${key(d) === key(sel) ? 'aria-current="date"' : ''}>
      <span>${WDS[d.getDay()]}</span><b class="num">${d.getDate()}</b><i class="wd-s" ${st === 'now' ? `style="--p:${pct}%"` : ''}>${ic}</i></button>`;
  }).join('');
  return `<div class="wk-row"><button class="wk-arrow" data-act="day" data-n="-7" aria-label="Tuần trước">${PREV}</button><div class="wk" data-swipe="week">${cells}</div><button class="wk-arrow" data-act="day" data-n="7" aria-label="Tuần sau">${NEXT}</button></div>`;
}
// Màn Hôm nay xem từng con một: chọn con ở hàng trên cùng, máy nhớ lần chọn gần nhất.
const TODAY_KID = 'misa-misu-today-kid';
function todayKid(kids = kidsList()) {
  if (!S.kids[UI.todayKid]) { let v = null; try { v = localStorage.getItem(TODAY_KID); } catch (e) {} UI.todayKid = S.kids[v] ? v : kids[0]?.id || null; }
  return kids.find(k => k.id === UI.todayKid) || kids[0] || null;
}
// ---------- phần dùng chung của các màn ----------
// Hàng chọn con: mỗi con một viên (kèm một con số nhỏ nếu có), all = thêm viên "Cả nhà".
const kidTabs = (kids, cur, act, badge, all) => `<div class="kid-tabs">${all ? `<button class="kid-tab all ${cur === 'all' ? 'on' : ''}" data-act="${act}" data-kid="all" ${cur === 'all' ? 'aria-current="true"' : ''}>${icon('👪')}<b>Cả nhà</b></button>` : ''}${kids.map(k => `<button class="kid-tab ${k.id === cur ? 'on' : ''}" data-act="${act}" data-kid="${k.id}" ${k.id === cur ? 'aria-current="true"' : ''}>${ava(k, 'sm')}<b>${esc(k.name)}</b>${badge ? badge(k) : ''}</button>`).join('')}</div>`;
// Cụm nút góc phải: ⋯ (những việc ít dùng) và + (thêm mới).
const pillBar = (...btns) => `<div class="pillbar">${btns.join('')}</div>`;
const moreBtn = (act, label) => `<button data-act="${act}" aria-label="${label}">${DOTS}</button>`;
const plusBtn = (label, off) => `<button class="add" data-act="page-add" aria-label="${label}" ${off ? 'disabled' : ''}>${PLUS}</button>`;
// Tiêu đề nhóm dạng nhãn màu. key: bấm nhãn để gập, mở (máy nhớ trong UI.secOpen; closed = mặc định gập). add, side: nút bên phải.
const secIsOpen = (key, closed) => !key || (UI.secOpen[key] ?? !closed);
function secHead(ic, label, { cnt = '', key = '', closed = false, add = '', side = '' } = {}) {
  const inner = `${ic}<span>${label}</span>${cnt !== '' ? `<i class="num">${cnt}</i>` : ''}`;
  return `<div class="slot-h">${key ? `<button class="slot-pill" data-act="sec-toggle" data-key="${key}" aria-expanded="${secIsOpen(key, closed)}">${inner}${DOWN}</button>` : `<span class="slot-pill">${inner}</span>`}${side}${add}</div>`;
}
const addBtn = (act, label, attr = '') => RO ? '' : `<button class="mini-add" data-act="${act}" ${attr} aria-label="${label}">${PLUS}</button>`;
// Chỗ chưa có gì: ô nét đứt, bấm để thêm ngay tại chỗ. ro: câu hiện cho con (chỉ xem, không có nút thêm).
const blankAdd = (text, act, attr = '', ro = '') => RO ? `<div class="slot-blank ro"><span>${ro || text}</span></div>` : `<button class="slot-blank" data-act="${act}" ${attr}><span>${text}</span>${PLUS}</button>`;
// Thanh tiến độ có mốc. Đếm việc (tới 12 việc): mỗi việc một nét rời, xong việc nào sáng nét đó. Số lớn hơn hoặc phần trăm: thanh liền có khe mảnh ở 25, 50, 75%.
function bar(done, total, attr = '') {
  const seg = Number.isInteger(total) && total > 1 && total <= 12, p = total > 0 ? Math.max(0, Math.min(1, done / total)) : 0;
  if (seg) return `<div class="bar seg" ${attr}>${Array.from({ length: total }, (_, i) => `<i${i < done ? ' class="on"' : ''}></i>`).join('')}</div>`;
  return `<div class="bar ${total > 12 ? 'q' : ''}" ${attr}><b style="width:${+(p * 100).toFixed(2)}%"></b></div>`;
}
const barCount = (n, total) => bar(n, total, `role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${n}"`);
// Một dòng gợi ý có nút bấm (bảng mẫu, mốc năm học mẫu...).
const suggest = (title, text, btn, act) => `<section class="suggest"><div><b>${title}</b><span>${text}</span></div><button class="btn primary sm" data-act="${act}">${btn}</button></section>`;
// Tên của một con làm tiêu đề nhỏ (khi xem cả nhà).
const kidChip = k => `<div class="slot-h"><span class="kid-chip">${ava(k, 'sm')}${esc(k.name)}</span></div>`;
// Sheet liệt kê vài lựa chọn (menu ⋯ và nút + của các màn).
const menuRow = (attr, ic, t, sub = '', off = false) => `<button class="item nav" ${attr} ${off ? 'disabled' : ''}><span class="ico">${ic}</span><span class="txt"><span class="t">${t}</span>${sub ? `<span class="s">${sub}</span>` : ''}</span>${CHEV}</button>`;
const menuSheet = (title, rows) => openModal(`<h2>${title}</h2><div class="fg"><div class="list menu">${rows.join('')}</div></div><div class="foot"><button class="btn quiet" data-act="close">Đóng</button></div>`);

// Hàng trên cùng của màn Hôm nay: các con (kèm số việc đã xong trong ngày đang xem) bên trái, nút ⋯ và + bên phải.
function todayTop(kids, cur, d) {
  const badge = k => { const l = mustFor(k.id, d), n = l.filter(c => isDone(d, k.id, c.id)).length, full = l.length > 0 && n === l.length; return l.length ? `<i class="num ${full ? 'full' : ''}">${full ? '✓' : `${n}/${l.length}`}</i>` : ''; };
  return `<div class="tbar">${kidTabs(kids, cur?.id, 'today-kid', badge)}${pillBar(moreBtn('today-menu', 'Xem cả tuần, chế độ cho bé, in'), `<button class="add" data-act="quick-add" aria-label="Thêm việc" ${kids.length ? '' : 'disabled'}>${PLUS}</button>`)}</div>`;
}
const SLOT_ASK = { sang: 'Buổi sáng con làm gì?', chieu: 'Buổi chiều có việc gì?', toi: 'Buổi tối làm gì trước khi ngủ?', '': 'Việc làm lúc nào cũng được' };
function viewToday() {
  if (UI.todayMode === 'week') return viewWeekGrid();
  const d = UI.date, t = today(), isT = key(d) === key(t), future = d > t;
  const kids = kidsList(), k = todayKid(kids);
  const dateTxt = `${isT ? WD[d.getDay()] + ', ' : ''}${d.getDate()} tháng ${d.getMonth() + 1}${d.getFullYear() !== t.getFullYear() ? ' ' + d.getFullYear() : ''}`;
  let h = `${todayTop(kids, k, d)}
  <div class="day-head"><h1>${isT ? 'Hôm nay' : WD[d.getDay()]}</h1><div class="day-side"><label class="day-pick"><span>${dateTxt}</span>${CHEV}<input type="date" id="day-pick" value="${key(d)}" aria-label="Chọn ngày"></label>${isT ? '' : '<button class="linkbtn" data-act="day" data-n="0">Về hôm nay</button>'}</div></div>
  ${k ? weekStrip(d, k) : ''}`;
  if (!k) return h + noKids();
  h += pendingCard();
  if (future) h += `<p class="foot-note">Ngày này chưa tới nên chưa đánh dấu được.</p>`;
  const list = mustFor(k.id, d), plan = dayPlan(k.id, d);
  const n = list.filter(c => isDone(d, k.id, c.id)).length, left = list.length - n;
  // Một dòng tóm tắt: còn mấy việc, chuỗi ngày, số dư (bấm sang Tài khoản).
  h += `<section class="kid-sum" style="--tint:${tintOf(k)}"><div class="kid-sum-row"><b class="kid-sum-t">${!list.length ? 'Không có việc phải làm' : left ? `Còn ${left} việc phải làm` : 'Xong hết việc phải làm 🎉'}</b><a href="#tai-khoan" class="acct-link" data-act="acct-go" data-kid="${k.id}" aria-label="Tài khoản của ${esc(k.name)}">${moneyChip(k)}${CHEV}</a></div>
    ${list.length ? `${barCount(n, list.length)}` : ''}
    ${streakChip(k) || bdayChip(k, d) ? `<div class="kid-sub">${streakChip(k)}${bdayChip(k, d)}</div>` : ''}</section>`;
  // Các dòng nhắc gom vào một khối: con đang ở đâu, giờ ở trường, mốc sắp tới, phiếu nghỉ.
  const st = stayLine(d.getDay(), isT), sc = schoolNow(k, d, isT);
  let notes = st ? `<div class="stay-note ${stayInfo(d.getDay()).moved ? 'moved' : ''}">${esc(st)}</div>` : '';
  if (sc) notes += `<a class="school-line" href="#lich-hoc" data-act="tkb-go" data-tab="tkb" data-kid="${k.id}" data-wd="${sc.bag ? '' : d.getDay()}"><b>${sc.bag ? '🎒' : '🏫'} ${esc(sc.title)}:</b> ${esc(sc.subjects.join(', '))}</a>`;
  notes += eventLines(k) + skipNote(k, d);
  if (notes) h += `<div class="notes">${notes}</div>`;
  // Nhà chưa có việc nào: một dòng gợi ý bảng mẫu, gọn để các ô thêm việc vẫn nằm ngay bên dưới.
  if (!Object.keys(S.chores).length) h += `<section class="suggest"><div><b>Chưa biết bắt đầu từ đâu?</b><span>Bảng mẫu có sẵn ${SAMPLE_CHORES.length} việc, kèm mục phạt, phí sử dụng và phiếu thưởng. Thêm xong sửa lại tuỳ ý.</span></div><button class="btn primary sm" data-act="seed">Dùng bảng mẫu</button></section>`;
  h += `<div class="slots">`;
  // Bài cần nộp: cùng kiểu với các buổi, nằm trước để thấy ngay.
  const ts = isT ? tasksSoon(k.id) : [];
  if (ts.length) h += `<section class="slot s-task"><div class="slot-h"><a class="slot-pill" href="#lich-hoc" data-act="tkb-go" data-tab="bai-tap" data-kid="${k.id}">📝<span>Bài cần nộp</span><i class="num">${ts.length}</i>${CHEV}</a></div><div class="slot-list list">${ts.map(x => taskRow(x, false, 'mini')).join('')}</div></section>`;
  const cur = isT ? slotAt(nowMin()) : null, canAdd = d >= t;
  // Luôn đủ bốn buổi (từ hôm nay trở đi): buổi chưa có việc hiện ô trống có dấu + để thêm ngay tại chỗ.
  const groups = SLOTS.map(([id, label, icon]) => plan.find(g => !g.extra && g.id === id) || { id, label, icon, items: [], blank: true }).filter(g => !g.blank || canAdd);
  const extra = plan.find(g => g.extra); if (extra) groups.push(extra);
  for (const g of groups) {
    // Mỗi buổi mở/đóng được, mặc định theo slotOpenDefault: hôm nay chỉ mở buổi đang diễn ra.
    const sk = `${key(d)}|${k.id}|${g.id}|${cur || ''}`, isNow = !g.extra && g.id && g.id === cur;
    const mine = g.items.filter(x => x.type === 'chore' && !isFun(x.c)), nd = mine.filter(x => isDone(d, k.id, x.c.id) || takenBy(x.c, k.id, d).length).length;
    const full = !g.extra && mine.length > 0 && nd === mine.length, hasFun = g.items.some(x => x.type === 'chore' && isFun(x.c));
    const open = UI.slotOpen[sk] ?? slotOpenDefault(g, cur, full, nd, hasFun);
    const cnt = g.extra ? `${nd ? `${nd}/` : ''}${g.items.length}` : mine.length ? `${full ? '✓ ' : ''}${nd}/${mine.length}` : g.blank ? '0' : '';
    const add = !canAdd ? '' : g.extra ? `<button class="mini-add" data-act="chore-form" data-kind="extra" aria-label="Thêm việc làm thêm">${PLUS}</button>`
      : `<button class="mini-add" data-act="quick-add" data-slot="${g.id}" aria-label="Thêm việc: ${g.label}">${PLUS}</button>`;
    h += `<section class="slot s-${g.extra ? 'them' : g.id || 'any'} ${isNow ? 'now' : ''} ${full ? 'full' : ''}" data-slot="${sk}"><div class="slot-h"><button class="slot-pill" data-act="slot-toggle" data-slot="${sk}" aria-expanded="${!!open}">${g.icon}<span>${g.label}</span>${cnt ? `<i class="num">${cnt}</i>` : ''}${DOWN}</button>${isNow ? '<span class="nowpill">Bây giờ</span>' : ''}${g.blank && open ? '' : add}</div>`;
    if (open && g.blank) h += `<button class="slot-blank" data-act="quick-add" data-slot="${g.id}"><span>${SLOT_ASK[g.id]}</span>${PLUS}</button>`;
    else if (open) {
      h += `<div class="slot-list list">`;
      for (const x of g.items) {
        if (x.type !== 'chore') { h += markRow(x); continue; }
        const c = x.c, on = isDone(d, k.id, c.id), steps = (c.steps || []).filter(Boolean), mask = stepMask(d, k.id, c.id);
        const right = isFun(c) ? `<span class="fun-badge ${x.locked ? '' : 'open'}">${x.locked ? '🔒 Chưa mở' : 'Được làm'}</span>`
          : `<button class="stamp ${on ? 'on' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" ${future ? 'disabled' : ''} aria-pressed="${on}" aria-label="${on ? 'Bỏ dấu' : 'Đóng dấu'}: ${esc(c.name)}">${STAR}</button>`;
        h += `<div class="item ${on ? 'done' : takenBy(c, k.id, d).length ? 'taken' : ''} ${isFun(c) ? 'fun' + (x.locked ? ' locked' : '') : ''}"><span class="ico">${esc(c.icon || '✅')}</span><div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${choreMeta(c, k.id, d, isT)}</div>
          ${steps.length && !isFun(c) ? `<div class="steps">${steps.map((st, i) => { const ok = on || (mask >> i) & 1; return `<button class="step ${ok ? 'on' : ''}" data-act="step" data-kid="${k.id}" data-chore="${c.id}" data-i="${i}" ${future ? 'disabled' : ''} aria-pressed="${!!ok}">${esc(st)}</button>`; }).join('')}</div>` : ''}</div>${right}</div>`;
      }
      h += `</div>`;
    }
    h += `</section>`;
  }
  h += `</div>`;
  return h;
}
// Menu ⋯ của màn Hôm nay: những cách xem ít dùng hơn, để màn chính chỉ còn việc cần làm.
function todayMenu() {
  const off = !kidsList().length;
  menuSheet('Hôm nay', [menuRow('data-act="today-mode" data-v="week"', '✅', 'Xem cả tuần', 'Mỗi việc một dòng, mỗi ngày một cột', off),
    menuRow('data-act="km-open"', '🙂', 'Chế độ cho bé', 'Chữ và nút to để con tự đánh dấu', off),
    menuRow('data-act="sheet-open"', '🖨️', 'In kế hoạch tuần', 'Mỗi con một trang A4 dán bàn học', off),
    `<a class="item nav" href="#gia-dinh" data-act="close"><span class="ico">✏️</span><span class="txt"><span class="t">Sửa danh sách việc nhà</span><span class="s">Đổi tên, ngày, buổi, tiền thưởng của từng việc</span></span>${CHEV}</a>`]);
}
// Nút + ở góc phải của mỗi màn: thêm thứ thuộc về màn đó. Chỉ có một thứ thì mở thẳng form, nhiều thứ thì hỏi.
function pageAdd() {
  const kids = kidsList(); if (!kids.length) return kidForm();
  const v = UI.view;
  if (v === 'lich-hoc') {
    const kid = S.kids[UI.tkbKid] ? UI.tkbKid : '', tab = UI.learn;
    if (tab === 'bai-tap') return taskForm(null, kid);
    if (tab === 'moc') return eventForm(null, kid);
    if (tab === 'hoc-them') return lessonForm(null, kid);
    if (tab === 'tkb') { const ks = kid ? [S.kids[kid] && { id: kid, ...S.kids[kid] }] : kids; const pre = k => !tkbOf(k.id) && tkbOffer(k); return ks.length === 1 ? tkbForm(ks[0].id, pre(ks[0]) ? sampleTkb(tkbOffer(ks[0])) : undefined) : menuSheet('Thời khoá biểu của ai?', ks.map(k => menuRow(`data-act="tkb-form" ${pre(k) ? 'data-sample="1"' : ''} data-kid="${k.id}"`, '🏫', esc(k.name), tkbOf(k.id) ? 'Sửa thời khoá biểu' : pre(k) ? `Có sẵn ${esc(sampleLabel(tkbOffer(k)))}` : 'Chưa có, tạo mới'))); }
    return menuSheet('Thêm vào Học tập', [menuRow(`data-act="task-form" data-kid="${kid}"`, '📝', 'Bài tập', 'Bài cô giao, hạn nộp, các bước'),
      menuRow(`data-act="lesson-form" data-kid="${kid}"`, '📚', 'Buổi học thêm', 'Học gì, ngày nào, ai đưa đón'), menuRow(`data-act="event-form" data-kid="${kid}"`, '📌', 'Mốc năm học', 'Kiểm tra, nghỉ học, họp phụ huynh')]);
  }
  if (v === 'tai-khoan') {
    const ak = S.kids[UI.acctKid] ? UI.acctKid : kids[0].id, nm = esc(kidName(ak));
    return menuSheet(`Thêm cho ${nm}`, [menuRow('data-act="acct-mode" data-v="bonus"', '⭐', 'Thưởng thêm', 'Cộng một khoản ngoài việc nhà'), menuRow('data-act="acct-mode" data-v="spend"', '💸', 'Chi tiêu', 'Con tiêu tiền, rút tiền mặt'),
      menuRow(`data-act="goal-form" data-kid="${ak}"`, '🎁', 'Mục tiêu tiết kiệm', 'Con muốn để dành mua gì')]);
  }
  if (v === 'bang-gia') return menuSheet('Thêm vào Bảng giá', [menuRow('data-act="chore-form" data-kind="week"', '⭐', 'Việc bắt buộc mỗi ngày', 'Không cộng tiền từng lần, làm đủ thì thưởng'), menuRow('data-act="chore-form" data-kind="each"', '💰', 'Việc mỗi ngày có tiền', 'Làm lần nào cộng tiền lần đó'),
    menuRow('data-act="chore-form" data-kind="extra"', '💪', 'Việc làm thêm', 'Không bắt buộc'), ...PRICE_KINDS.map(([k, l, ic]) => menuRow(`data-act="price-form" data-kind="${k}"`, ic, l, PRICE_HELP[k]))]);
  if (v === 'gia-dinh') return menuSheet('Thêm vào Gia đình', [menuRow('data-act="kid-form"', '🙂', 'Thêm con', 'Tên, ngày sinh, hình đại diện'), menuRow('data-act="chore-form"', '🧹', 'Thêm việc nhà', 'Giao việc theo ngày cho các con')]);
}

// ---------- thêm việc nhanh ----------
// Chỉ một ô gõ tên việc và vài lựa chọn bấm để đổi; còn lại lấy mặc định. Muốn chỉnh kỹ thì bấm ⋯ để mở form đầy đủ.
let QA = null;
const QA_PAY = [[5000, '+5.000đ mỗi lần'], [10000, '+10.000đ mỗi lần'], [0, 'Bắt buộc, đủ việc thì thưởng']];
const qaReps = () => { const wd = UI.date.getDay(); return [[DAILY, 'Mỗi ngày'], [[1, 2, 3, 4, 5], 'Ngày thường'], [[0, 6], 'Cuối tuần'], [[wd], `${WDN(wd)} hằng tuần`]]; };
function qaWho() {
  const kids = kidsList(), k = todayKid(kids); if (!k) return [];
  return [[[k.id], k.name], ...(kids.length > 1 ? [[kids.map(x => x.id), 'Cả nhà']] : []), ...kids.filter(x => x.id !== k.id).map(x => [[x.id], x.name])];
}
function qaChips() {
  const sl = SLOTS.find(x => x[0] === QA.slot) || SLOTS[3], rep = qaReps()[QA.rep], who = qaWho()[QA.who], pay = QA_PAY[QA.pay];
  const chip = (f, ic, txt, cls = '') => `<button class="qa-chip ${cls}" data-act="qa-cycle" data-f="${f}">${ic}<span>${esc(txt)}</span></button>`;
  return chip('slot', sl[2], sl[0] ? sl[1] : 'Lúc nào cũng được', 's-' + (sl[0] || 'any')) + chip('rep', '🔁', rep[1])
    + (qaWho().length > 1 ? chip('who', who[0].length > 1 ? '👪' : mini(S.kids[who[0][0]] ? { id: who[0][0], ...S.kids[who[0][0]] } : {}), who[1]) : '')
    + chip('pay', pay[0] ? '💰' : '⭐', pay[1]) + `<button class="qa-chip more" data-act="qa-more" aria-label="Mở form đầy đủ">${DOTS}</button>`;
}
// Đoán biểu tượng theo tên việc, để thêm nhanh không phải chọn.
const ICON_GUESS = [[/nhảy dây/, '🪢'], [/giường|chăn/, '🛏️'], [/răng|rửa mặt/, '🪥'], [/đồ chơi|lego/, '🧸'], [/bát|chén|dọn mâm/, '🍽️'], [/cây|tưới/, '🪴'], [/cặp/, '🎒'], [/quần áo|gấp áo/, '👕'], [/quét/, '🧹'], [/lau/, '🧽'],
  [/rác/, '🗑️'], [/tắm|gội/, '🛁'], [/đàn|piano/, '🎹'], [/chạy|đi bộ|thể dục|bơi/, '🏃'], [/nghe/, '🎧'], [/sách|đọc|truyện/, '📚'], [/bài|học|viết|toán/, '✏️'], [/bàn/, '🪑'], [/ngủ/, '🌙'], [/phim/, '🎬'], [/tivi|tv/, '📺'],
  [/game|chơi/, '🎮'], [/giày|dép/, '👟'], [/tất|vớ/, '🧦'], [/chó|mèo/, '🐶'], [/cá/, '🐟'], [/cơm|ăn/, '🍚'], [/giúp/, '🤝'], [/phơi|giặt/, '🧺']];
const guessIcon = name => (ICON_GUESS.find(([rx]) => rx.test(String(name).toLowerCase())) || [0, '✅'])[1];
function quickAdd(slot) {
  if (!kidsList().length) return kidForm();
  QA = { slot: SLOTS.some(x => x[0] === slot) ? slot : key(UI.date) === key(today()) ? slotAt(nowMin()) : '', rep: 0, who: 0, pay: 0 };
  openModal(`<div class="qa"><div class="qa-row"><input id="qname" class="qa-input" maxlength="40" placeholder="Thêm một việc thôi" autocomplete="off" enterkeyhint="done" aria-label="Tên việc"><button class="qa-go" data-act="qa-save" aria-label="Thêm việc">${PLUS}</button></div>
    <div class="qa-chips" id="qa-chips">${qaChips()}</div></div>`);
  $('#qname').focus();
}
// Các lựa chọn đang có trong ô thêm nhanh, đổi sang dạng dữ liệu của một việc.
const qaData = () => ({ name: $('#qname')?.value.trim() || '', slot: QA.slot, days: qaReps()[QA.rep][0], kids: qaWho()[QA.who][0], money: QA_PAY[QA.pay][0] });

const LEARN_TABS = [['sap-toi', 'Sắp tới'], ['bai-tap', 'Bài tập'], ['tkb', 'Thời khoá biểu'], ['moc', 'Mốc năm học'], ['hoc-them', 'Học thêm']];
function viewSchedule() {
  const kids = kidsList();
  if (!kids.length) return `<div class="day-head"><h1>Học tập</h1></div>` + noKids();
  // Nhiều con thì mặc định xem cả nhà, để thấy ngay giờ nào cần đưa đón hai nơi.
  const all = kids.length > 1 && (UI.tkbKid === 'all' || !S.kids[UI.tkbKid]);
  const k = all ? null : kids.find(x => x.id === UI.tkbKid) || kids[0];
  return `<div class="tbar">${kidTabs(kids, all ? 'all' : k.id, 'learn-kid', null, kids.length > 1)}${pillBar(plusBtn('Thêm bài tập, buổi học thêm, mốc năm học'))}</div>` + learnPage(all ? kids : [k], all);
}
// Tiêu đề, 5 tab và nội dung của màn Học tập. Máy của con dùng lại phần này cho riêng con đó, ở chế độ chỉ xem (RO).
function learnPage(ks, all) {
  const k = all ? null : ks[0];
  const tab = LEARN_TABS.some(x => x[0] === UI.learn) ? UI.learn : 'sap-toi';
  const t = today(), sel = UI.agDate || t;
  const h = `<div class="day-head"><h1>Học tập</h1>${tab === 'sap-toi' ? `<div class="day-side"><label class="day-pick"><span>Tháng ${sel.getMonth() + 1}, ${sel.getFullYear()}</span>${CHEV}<input type="date" id="ag-pick" value="${key(sel)}" aria-label="Chọn ngày"></label>${key(sel) === key(t) ? '' : '<button class="linkbtn" data-act="ag-day" data-d="">Về hôm nay</button>'}</div>` : ''}</div>
  <div class="tabbar" role="tablist">${LEARN_TABS.map(([v, l]) => `<button role="tab" aria-selected="${v === tab}" class="${v === tab ? 'on' : ''}" data-act="learn-tab" data-v="${v}">${l}${v === 'bai-tap' && openTasks(k?.id).length ? ` <i class="cnt num">${openTasks(k?.id).length}</i>` : ''}</button>`).join('')}</div>`;
  if (tab === 'sap-toi') return h + viewAgenda(ks);
  if (tab === 'bai-tap') return h + tasksView(ks);
  if (tab === 'moc') return h + eventsCard(all ? null : k.id);
  if (tab === 'tkb') return h + ks.map(x => (all ? kidChip(x) : '') + kidSchedule(x, 'tkb')).join('');
  return h + (all ? familyWeek(ks) : kidSchedule(k, 'lessons'));
}

// ---------- bài tập ----------
// tasks: { kid, title, kind: bt|on|da, subj, due: "YYYY-MM-DD", notes, steps: [{ t, done }], done, doneAt }
const TASK_KINDS = [['bt', 'Bài tập', '📝'], ['on', 'Ôn kiểm tra', '📖'], ['da', 'Dự án', '🧪']];
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
function taskRow(t, showKid, mode = '') {
  const big = mode === 'big', bare = big || mode === 'mini';
  const nd = t.steps.filter(x => x.done).length, over = !t.done && t.due && daysTo(t.due) < 0, kind = TASK_KINDS.find(x => x[0] === t.kind) || TASK_KINDS[0];
  const meta = [t.subj ? `${subjDot(t.subj)}${esc(t.subj)}` : '', t.done ? `xong ${t.doneAt ? dm(parse(t.doneAt)) : ''}` : t.due ? `<span class="${over ? 'late' : ''}">${over ? '' : 'hạn '}${esc(dueLabel(t.due))}</span>` : 'chưa có hạn',
    t.steps.length ? `${nd}/${t.steps.length} bước` : '', showKid ? esc(kidName(t.kid)) : ''].filter(Boolean).join(' · ');
  const steps = !t.done && t.steps.length ? `<div class="steps">${t.steps.map((x, i) => `<button class="step ${x.done ? 'on' : ''}" data-act="task-step" data-id="${t.id}" data-i="${i}" aria-pressed="${!!x.done}">${esc(x.t)}</button>`).join('')}</div>` : '';
  return `<div class="${big ? 'big-item task' : 'item task'} ${t.done ? 'done' : ''}"><button class="check ${t.done ? 'on' : ''}" data-act="task-done" data-id="${t.id}" aria-pressed="${!!t.done}" aria-label="${t.done ? 'Chưa xong' : 'Xong'}: ${esc(t.title)}">✓</button>
    <div class="txt"><div class="t">${kind[2]} ${esc(t.title)}</div><div class="s">${meta}</div>${t.notes && !bare ? `<div class="s snip">${esc(String(t.notes).slice(0, 120))}</div>` : ''}${steps}</div>
    ${bare || RO ? '' : `<div class="acts">${editBtn('task-form', t.id, t.title)}</div>`}</div>`;
}
function tasksView(ks) {
  const ids = ks.map(k => k.id), multi = ks.length > 1, tk = key(today()), kidAttr = `data-kid="${multi ? '' : ids[0]}"`;
  const mine = tasksList().filter(t => ids.includes(t.kid)), open = mine.filter(t => !t.done), done = mine.filter(t => t.done);
  let h = `<div class="seg modes"><label><input type="radio" name="tview" value="0" ${UI.taskDone ? '' : 'checked'}><span>Chưa xong${open.length ? ` (${open.length})` : ''}</span></label><label><input type="radio" name="tview" value="1" ${UI.taskDone ? 'checked' : ''}><span>Đã xong</span></label></div>`;
  if (UI.taskDone) {
    if (!done.length) return h + `<p class="foot-note">Bài tập làm xong sẽ được lưu ở đây.</p>`;
    const list = done.sort((a, b) => String(b.doneAt || '').localeCompare(String(a.doneAt || ''))).slice(0, UI.histAll ? 500 : 40);
    return h + `<div class="slot-list list">${list.map(t => taskRow(t, multi)).join('')}</div>${done.length > list.length ? `<div class="row"><button class="btn quiet sm" data-act="hist-all">Xem thêm ${done.length - list.length} bài</button></div>` : ''}`;
  }
  if (!open.length) return h + (RO ? `<p class="foot-note">Con không còn bài nào phải làm 🎉</p>` : blankAdd('Ghi bài cô giao: môn gì, hạn nộp ngày nào', 'task-form', kidAttr) + `<p class="foot-note">Không còn bài nào phải làm. App xếp bài theo hạn nộp và nhắc ở màn Hôm nay.</p>`);
  const groups = [['Quá hạn', t => t.due && t.due < tk, 's-late'], ['Hôm nay', t => t.due === tk, 'tn3'], ['Ngày mai', t => t.due && daysTo(t.due) === 1, 'tn0'],
    ['Tuần này', t => t.due && daysTo(t.due) > 1 && t.due <= key(addDays(weekStart(today()), 6)), 'tn4'], ['Sau đó', t => t.due && t.due > key(addDays(weekStart(today()), 6)), ''], ['Chưa có hạn', t => !t.due, '']];
  // Tiến độ tuần này: bài có hạn trong tuần, đã xong / tổng.
  const ws = key(weekStart(today())), we = key(addDays(weekStart(today()), 6)), wk = mine.filter(t => t.due && t.due >= ws && t.due <= we), wd = wk.filter(t => t.done).length;
  if (wk.length) h += `<section class="kid-sum"><div class="kid-sum-row"><b class="kid-sum-t">Tuần này xong ${wd}/${wk.length} bài</b></div>${barCount(wd, wk.length)}</section>`;
  h += `<div class="slots">`;
  for (const [label, f, tint] of groups) {
    const list = open.filter(f); if (!list.length) continue;
    h += `<section class="slot ${tint}">${secHead('', label, { cnt: list.length })}<div class="slot-list list">${list.map(t => taskRow(t, multi)).join('')}</div></section>`;
  }
  return h + `</div>`;
}
function taskForm(id, kidPre) {
  const t = id ? S.tasks[id] : null, kids = kidsList();
  const kid = t?.kid || (S.kids[kidPre] ? kidPre : S.kids[UI.tkbKid] ? UI.tkbKid : kids[0]?.id); if (!kid) return;
  const subs = [...new Set(kids.flatMap(k => tkbOf(k.id) ? tkbStats(tkbOf(k.id)).subjects.map(x => x[0]) : []))];
  const kind = t?.kind || 'bt';
  openModal(`<h2>${t ? 'Sửa bài tập' : 'Thêm bài tập'}</h2>
  ${titleCard('ttitle', t?.title, 'Bài gì?', { max: 80 })}
  <div class="fg">
    ${kids.length > 1 ? kidRow('Con', 'tkid', 'radio', [kid]) : `<input type="hidden" name="tkid" value="${kid}">`}
    ${frow('Loại', pillSel('tkind', TASK_KINDS.map(([v, l]) => [v, l]), kind), { id: 'tkind' })}
    <div class="fr col">${frow('Môn', `<input id="tsubj" class="pillin txt" list="tsubj-list" maxlength="24" value="${esc(t?.subj || '')}" placeholder="Toán">`, { id: 'tsubj', cls: 'in' })}
      <datalist id="tsubj-list">${[...new Set([...subs, ...SUBJECTS])].map(x => `<option value="${esc(x)}">`).join('')}</datalist>
      ${subs.length ? `<div class="row">${subs.map(x => `<button class="btn quiet sm" data-act="task-subj" data-v="${esc(x)}">${subjDot(x)}${esc(x)}</button>`).join('')}</div><span class="fs">Chọn môn thì hạn nộp tự đặt vào buổi học tới của môn đó.</span>` : ''}</div>
    <div class="fr col">${frow('Hạn nộp', `<input id="tdue" class="pillin num" type="date" value="${esc(t?.due || '')}">`, { id: 'tdue', cls: 'in' })}
      <div class="row"><button class="btn quiet sm" data-act="task-due" data-v="next">Buổi học tới của môn</button><button class="btn quiet sm" data-act="task-due" data-v="1">Ngày mai</button><button class="btn quiet sm" data-act="task-due" data-v="mon">Thứ Hai tới</button><button class="btn quiet sm" data-act="task-due" data-v="">Không có hạn</button></div></div>
  </div>
  <div class="fg">${frow('Các bước', `<textarea id="tsteps" class="input" rows="3" placeholder="Đọc đề&#10;Làm nháp&#10;Chép vào vở">${esc((t?.steps || []).map(x => x.t).join('\n'))}</textarea>`, { id: 'tsteps', cls: 'col', sub: 'Mỗi dòng một bước. Con tick từng bước.' })}</div>
  <div class="fg">${frow('Ghi chú', `<textarea id="tnotes" class="input" rows="3" maxlength="1000" placeholder="Cô dặn gì, cần mang gì...">${esc(t?.notes || '')}</textarea>`, { id: 'tnotes', cls: 'col' })}</div>
  ${formFoot(t ? 'task-del' : '', id, 'task-save')}`);
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
  // Dải 7 ngày cùng kiểu với màn Hôm nay; chấm màu bên dưới cho biết ngày đó có gì.
  let h = `<div class="wk-row"><button class="wk-arrow" data-act="ag-week" data-n="-7" aria-label="Tuần trước">${PREV}</button>
    <div class="wk" data-swipe="ag">${days.map(d => `<button class="wd ${key(d) === key(sel) ? 'on' : ''} ${key(d) === key(t) ? 'today' : ''}" data-act="ag-day" data-d="${key(d)}" aria-label="${WD[d.getDay()]} ${dm(d)}" ${key(d) === key(sel) ? 'aria-current="date"' : ''}><span>${WDS[d.getDay()]}</span><b class="num">${d.getDate()}</b><span class="ads">${dots(d)}</span></button>`).join('')}</div>
    <button class="wk-arrow" data-act="ag-week" data-n="7" aria-label="Tuần sau">${NEXT}</button></div>
    <div class="ws-legend muted small"><span><i class="ad exam"></i>Kiểm tra</span><span><i class="ad ev"></i>Mốc</span><span><i class="ad task"></i>Bài phải nộp</span><span><i class="ad lesson"></i>Học thêm</span></div>`;
  const dd = key(sel) === key(t) ? 'Hôm nay' : key(sel) === key(addDays(t, 1)) ? 'Ngày mai' : key(sel) === key(addDays(t, -1)) ? 'Hôm qua' : '';
  h += `<b class="kid-sum-t">${dd ? dd + ', ' : ''}${dd ? WD[sel.getDay()].toLowerCase() : WD[sel.getDay()]} ${dm(sel)}</b><div class="slots">`;
  for (const k of ks) {
    const a = dayAgenda(k.id, sel);
    let b = '';
    const part = (title, body) => body ? `<div class="ag-sec"><div class="cap">${title}</div>${body}</div>` : '';
    b += part('Kiểm tra và mốc', a.events.map(e => `<div class="item event"><span class="ico">${esc(e.icon || '📌')}</span><div class="txt"><div class="t">${esc(e.name)}</div><div class="s">${esc(eventRange(e))}</div></div></div>`).join(''));
    b += part('Ở trường', a.hol ? `<p class="muted small" style="margin:4px 0">Nghỉ: ${esc(a.hol.name)}</p>` : a.school ? `<div class="periods">${a.school.list.map(p => `<div class="period"><span class="num">${esc(p.s)}</span>${subjDot(p.subj)}<span>${esc(p.subj)}</span></div>`).join('')}</div>` : '');
    b += part('Học thêm', a.lessons.map(l => `<div class="period"><span class="num">${esc(l.s)}</span><i class="dot lesson"></i><span>${esc(l.name)}${l.at ? ` <span class="muted small">· ${esc(l.at)}</span>` : ''}</span></div>`).join(''));
    b += part('Bài phải nộp', a.tasks.length ? `<div class="list">${a.tasks.map(x => taskRow(x, false)).join('')}</div>` : '');
    h += `<section class="slot">${multi ? kidChip(k) : ''}${b ? `<div class="slot-list pad">${b}</div>` : RO ? `<div class="slot-blank ro"><span>Ngày này con không có lịch học, bài tập hay kiểm tra</span></div>` : `<button class="slot-blank" data-act="page-add"><span>Ngày này ${esc(k.name)} không có lịch học, bài tập hay kiểm tra</span>${PLUS}</button>`}</section>`;
  }
  return h + `</div>`;
}

// part: 'tkb' (ở trường và số giờ mỗi tuần) hoặc 'lessons' (học thêm).
function kidSchedule(k, part) {
  const t = tkbOf(k.id), wd = today().getDay();
  let h = '';
  // Máy của con: luôn kèm lịch ở nhà nào (bên bố mẹ, nhà nhiều con thì lịch này nằm ở tab Cả nhà).
  if (part === 'lessons') return `<div class="slots">${(RO ? hasStays() : kidsList().length === 1) ? staysCard(wd) : ''}${kidLessons(k)}</div>`;
  if (!t && RO) {
    h += `<section class="card empty" style="padding:20px 18px"><div class="big">🏫</div><h2>Chưa có thời khoá biểu ở trường</h2><p class="muted">Nhờ bố mẹ nhập thời khoá biểu, con sẽ xem được hôm nào học môn gì.</p></section>`;
  } else if (!t && lessonsOf(k.id).length) {
    h += `<section class="card"><div class="kid-head"><span class="ico" style="font-size:28px">🏫</span><div class="txt" style="flex:1"><b>Lịch ở trường</b><div class="muted small">${tkbOffer(k) ? `Có sẵn thời khoá biểu ${esc(sampleLabel(tkbOffer(k)))} của ${esc(k.name)}, bấm Dùng rồi Lưu.` : `Chưa có thời khoá biểu ở trường của ${esc(k.name)}.`}</div></div><button class="btn ${tkbOffer(k) ? 'primary' : 'quiet'} sm" data-act="tkb-form" ${tkbOffer(k) ? 'data-sample="1"' : ''} data-kid="${k.id}">${tkbOffer(k) ? 'Dùng' : 'Tạo'}</button></div></section>`;
  } else if (!t) {
    h += `<section class="card empty" style="padding:20px 18px"><div class="big">🏫</div><h2>Chưa có thời khoá biểu ở trường của ${esc(k.name)}</h2>
    <p class="muted">Nhập các tiết học một lần. App sẽ cho biết hôm nay con học những môn gì, và tối nay cần soạn cặp cho môn nào.</p>
    <div class="row" style="justify-content:center;margin-top:10px">${tkbOffer(k) ? `<button class="btn primary" data-act="tkb-form" data-sample="1" data-kid="${k.id}">Dùng ${esc(sampleLabel(tkbOffer(k)))}</button><button class="btn quiet" data-act="tkb-form" data-kid="${k.id}">Tự nhập</button>` : `<button class="btn primary" data-act="tkb-form" data-kid="${k.id}">Tạo thời khoá biểu</button>`}</div></section>`;
  } else {
    h += `<section class="card tkb-card" data-tkb="${k.id}"><div class="kid-head">${ava(k, 'sm')}<div><div class="kid-name">${esc(t.cls || k.name)}</div>${t.year ? `<div class="muted small">Năm học ${esc(t.year)}</div>` : ''}</div>
      ${RO ? '' : `<div class="acts" style="margin-left:auto"><button class="linkbtn" data-act="tkb-print" data-kid="${k.id}">In</button><button class="linkbtn" data-act="tkb-form" data-kid="${k.id}">Sửa</button></div>`}</div>
      ${tkbDayView(k, t)}</section>${tkbWeek(k, t)}`;
  }
  const ls = lessonsOf(k.id);
  return h + weekTotals(k, t, ls);
}
function kidLessons(k) {
  const wd = today().getDay(), ls = lessonsOf(k.id);
  return `<section class="slot tn1">${secHead('📚', 'Học thêm', { cnt: ls.length || '', add: addBtn('lesson-form', 'Thêm buổi học thêm', `data-kid="${k.id}"`) })}${ls.length
    ? `<div class="slot-list list">${WEEK_ORDER.filter(d => ls.some(l => l.day === d)).map(d => `<div class="day-sep ${d === wd ? 'on' : ''}">${WDN(d)}${d === wd ? ' · hôm nay' : ''}</div>${ls.filter(l => l.day === d).map(l => lessonItem(l)).join('')}`).join('')}</div>`
    : blankAdd('Ví dụ: Tiếng Anh, Thứ 2 từ 17:30 đến 19:30', 'lesson-form', `data-kid="${k.id}"`, 'Con chưa có buổi học thêm nào')}</section>`;
}
function weekTotals(k, t, ls) {
  let h = '';
  const st = t ? tkbStats(t) : { periods: 0, inClass: 0, atSchool: 0, subjects: [] };
  const lm = ls.reduce((a, l) => a + lessonMin(l), 0);
  if (st.periods || ls.length) {
    h += `<section class="slot">${secHead('', `Mỗi tuần của ${esc(k.name)}`)}<div class="tiles">
      ${st.periods ? `<div class="tile"><span class="muted small">Ở trường (${st.periods} tiết)</span><span class="amt num">${durTxt(st.atSchool)}</span></div>` : ''}
      ${ls.length ? `<div class="tile"><span class="muted small">Học thêm (${ls.length} buổi)</span><span class="amt num">${durTxt(lm)}</span></div>` : ''}
      ${st.periods && ls.length ? `<div class="tile"><span class="muted small">Tổng cộng</span><span class="amt num">${durTxt(st.atSchool + lm)}</span></div>` : ''}
    </div></section>`;
    if (st.periods) h += `<section class="slot">${secHead('', 'Số tiết mỗi môn ở trường')}<div class="slot-list pad"><div class="sj-list">${st.subjects.map(([s, n]) => `<span class="sj-chip sj${subjTint(s)}">${esc(s)} <b class="num">${n}</b></span>`).join('')}</div></div></section>`;
  }
  return h;
}

function staysCard(wd) {
  const head = secHead('🏠', 'Các con ở đâu', { side: hasStays() && !RO ? '<button class="linkbtn" data-act="stay-form">Sửa</button>' : '' });
  return `<section class="slot tn4">${head}${hasStays()
    ? `<div class="slot-list pad">${stayStrip()}<div class="muted small" style="margin-top:6px">Dòng trên: ban ngày (nếu không đi học). Ô màu: buổi tối ngủ ở đâu. Viền đậm: ngày đổi nhà.${stayLine(wd, true) ? ` <b>Hôm nay:</b> ${esc(stayLine(wd, true).replace(/^\S+\s/, '').toLowerCase())}.` : ''}</div></div>`
    : blankAdd('Ghi ngày nào các con ở nhà bố, 6th Element hay nhà ông bà', 'stay-form')}</section>`;
}
// Cả nhà: lịch học thêm của các con theo từng ngày, kèm lịch đưa đón và cảnh báo.
function familyWeek(kids) {
  const wd = today().getDay(), all = lessonsList();
  let h = `<div class="slots">${staysCard(wd)}<section class="slot tn1">${secHead('📚', 'Học thêm', { cnt: all.length || '', add: addBtn('lesson-form', 'Thêm buổi học thêm') })}`;
  if (!all.length) return h + blankAdd('Thêm buổi học thêm của từng con, ghi ai đưa đón', 'lesson-form') + `</section></div><p class="foot-note">App xếp lịch đưa đón theo từng ngày và báo khi hai chuyến sát giờ nhau.</p>`;
  const days = WEEK_ORDER.filter(d => all.some(l => l.day === d));
  h += `<div class="tiles">${kids.map(k => { const ls = all.filter(l => l.kid === k.id); return `<div class="tile"><span class="who">${ava(k, 'sm')}${esc(k.name)}</span><span class="amt num">${ls.length ? durTxt(ls.reduce((a, l) => a + lessonMin(l), 0)) : '—'}</span><span class="muted small">${ls.length} buổi học thêm mỗi tuần${ls.some(l => l.home === true) ? `, ${ls.filter(l => l.home === true).length} buổi ở nhà` : ''}</span></div>`; }).join('')}</div>`;
  // Đếm chuyến đưa đón mỗi tuần theo người / phương tiện.
  const trips = tripsOf(all), count = {};
  for (const t of trips) if (t.who) { const w = /^tự/i.test(t.who) ? 'Tự đi' : t.who.trim(); count[w] = (count[w] || 0) + 1; }
  const warnDays = days.filter(d => tripWarnings(tripsOf(all.filter(l => l.day === d))).length);
  if (trips.length) h += `<div class="note"><b>Đưa đón mỗi tuần:</b> ${Object.entries(count).sort((a, b) => b[1] - a[1]).map(([w, n]) => `${esc(w)} ${n} chuyến`).join(' · ') || 'chưa ghi ai đưa đón'}.${warnDays.length ? ` <b>Cần xem lại:</b> ${warnDays.map(WDN).join(', ')}.` : ''}</div>`;
  h += `<div class="slot-list list">${days.map(d => {
    const dl = all.filter(l => l.day === d), tr = tripsOf(dl), warn = tripWarnings(tr);
    const sl = stayLine(d);
    return `<div class="day-sep ${d === wd ? 'on' : ''}">${WDN(d)}${d === wd ? ' · hôm nay' : ''}${sl ? `<span class="stay-chip ${stayInfo(d).moved ? 'moved' : ''}">${esc(sl)}</span>` : ''}</div>${warn.map(c => `<div class="clash">⚠️ ${esc(c)}</div>`).join('')}${dl.map(l => lessonItem(l, true)).join('')}
      ${tr.some(t => t.who) ? `<div class="trips"><b>Đưa đón</b>${tr.filter(t => t.who).map(t => `<div><span class="num">${hm(t.t)}</span> ${whoIcon(t.who)} ${esc(tripText(t))}</div>`).join('')}</div>` : ''}`;
  }).join('')}</div></section></div>`;
  return h;
}
function lessonItem(l, who = false) {
  const k = S.kids[l.kid] ? { id: l.kid, ...S.kids[l.kid] } : null;
  return `<div class="item">${who && k ? ava(k, 'sm') : `<span class="ico">${lessonIcon(l.name)}</span>`}<div class="txt"><div class="t">${who && k ? `${esc(k.name)} · ` : ''}${esc(l.name)}</div><div class="s num">${esc(l.s)} – ${esc(l.e)} · ${durTxt(lessonMin(l))}</div>${placeTxt(l) ? `<div class="s">${placeTxt(l)}</div>` : ''}</div>
    <div class="acts">${editBtn('lesson-form', l.id, l.name)}</div></div>`;
}

// ---------- tài khoản ----------
const LEDGER_KIND = {
  bonus: ['Thưởng', '⭐'], penalty: ['Phạt', '⚠️'], fee: ['Phí sử dụng', '📱'], spend: ['Chi tiêu', '💸'],
  reward: ['Đổi quà', '🎁'], week: ['Thưởng đủ tuần', '🏆'], day: ['Thưởng ngày đủ việc', '⭐'], chores: ['Việc nhà', '🧹'], adjust: ['Khớp số dư', '🏦'],
};
const ACCT_KINDS = [['penalty', 'Phạt'], ['fee', 'Phí'], ['bonus', 'Thưởng'], ['spend', 'Chi tiêu']];
const giftTagOf = (kind, vnd) => kind === 'gift' && !vnd ? 'miễn phí' : money(vnd) + (kind === 'fee' ? '/giờ' : '');
const giftTag = r => priceVnd(r) ? money(priceVnd(r)) : 'Miễn phí';
const priceTag = r => priceKind(r) === 'merit' ? '+' + money(priceVnd(r)) : priceKind(r) === 'penalty' ? (r.all ? 'Mất hết tiền' : r.week ? 'Mất tiền thưởng tuần' : '−' + money(priceVnd(r)))
  : priceKind(r) === 'fee' ? money(priceVnd(r)) + '/giờ' : giftTag(r);
// Lịch sử tài khoản của một con: sổ tài khoản, thưởng làm đủ việc (theo ngày hoặc cả tuần) và tiền việc nhà gộp theo ngày.
function statement(kidId) {
  const rows = Object.entries(S.ledger).filter(([, l]) => l.kid === kidId && !l.pending).map(([id, l]) => ({ id, ...l, vnd: ledgerVnd(l), legacy: l.amount == null }));
  for (const w of weekBonuses(kidId)) {
    const end = addDays(w.ws, 6); end.setHours(23, 59);
    rows.push({ kind: 'week', vnd: w.amount, note: `Làm đủ việc phải làm tuần ${dm(w.ws)} – ${dm(addDays(w.ws, 6))}`, at: end.toISOString() });
  }
  for (const x of dayBonuses(kidId)) {
    const end = new Date(x.d); end.setHours(23, 59);
    rows.push({ kind: 'day', vnd: x.amount, note: `Làm đủ việc phải làm ${WDN(x.d.getDay())} ${dm(x.d)}`, at: end.toISOString() });
  }
  for (const dk of Object.keys(S.done)) {
    const v = earned(kidId, dk, dk); if (!v) continue;
    const names = Object.entries(S.done[dk][kidId] || {}).filter(([cid, x]) => !cid.includes('~') && doneVnd(x) > 0).map(([cid]) => S.chores[cid]?.name).filter(Boolean);
    const end = parse(dk); end.setHours(23, 58);
    rows.push({ kind: 'chores', vnd: v, note: `Ngày ${dm(parse(dk))} · ${names.length ? `${names.length} việc: ${names.join(', ')}` : 'việc nhà'}`, at: end.toISOString() });
  }
  return rows.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
// Số tiền viết gọn cho viên chọn con: 120.000đ là "120k", 12.500đ là "12,5k".
const kShort = n => (n < 0 ? '−' : '') + (Math.abs(n) / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'k';
// Hai con số đầu màn Tài khoản: đang có bao nhiêu (kèm mục tiêu tiết kiệm số 1) và tuần này kiếm được bao nhiêu.
function acctStats(k) {
  const ak = k.id, ws = weekStart(today()), st = weekStats(k, ws), we = key(addDays(ws, 6)), dbw = dayBonusIn(ak, key(ws), we), wk = earned(ak, key(ws), we) + dbw, wb = weekBonusOf(k), bal = balance(ak);
  const fullDays = dayBonuses(ak).filter(x => x.dk >= key(ws)).length;
  const bonusNote = isDaily(k) ? (dayBonusOf(k) ? (fullDays ? ` · ⭐ ${fullDays} ngày đủ việc +${money(dbw)}` : ` · ngày đủ việc +${money(dayBonusOf(k))}`) : '') : wb ? (st.done >= st.possible ? ` · 🏆 thưởng ${money(wb)}` : ` · đủ tuần +${money(wb)}`) : '';
  const g = goalProgress(ak)[0], gp = g && g.price ? Math.min(100, Math.round(g.have / g.price * 100)) : 0, sn = streakOf(ak);
  return `<section class="stat2"><div class="stat"><b class="stat-n num ${bal < 0 ? 'neg' : ''}">${money(bal)}</b><span class="cap">Đang có</span>
      ${g ? `${bar(g.have, g.price)}<span class="stat-c">${esc(g.icon || '🎁')} ${esc(g.name)} · ${gp}%</span>` : `<span class="stat-c">${sn ? `🔥 ${sn} ngày liên tiếp` : 'Chưa có mục tiêu tiết kiệm'}</span>`}</div>
    <div class="stat"><b class="stat-n num ${wk ? 'plus' : ''}">+${money(wk)}</b><span class="cap">Tuần này</span>
      ${st.possible ? `${barCount(st.done, st.possible)}<span class="stat-c"><span class="num">${st.done}/${st.possible}</span> việc phải làm${bonusNote}</span>` : '<span class="stat-c">Chưa có việc phải làm</span>'}</div></section>`;
}
function viewAccount() {
  const kids = kidsList(), t = today(), ws = weekStart(t);
  if (!kids.length) return `<div class="day-head"><h1>Tài khoản</h1></div>` + noKids();
  const ak = UI.acctKid = S.kids[UI.acctKid] ? UI.acctKid : todayKid(kids).id, kind = ACCT_KINDS.some(x => x[0] === UI.acctKind) ? UI.acctKind : 'penalty';
  const k = kids.find(x => x.id === ak);
  let h = `<div class="tbar">${kidTabs(kids, ak, 'acct-kid', x => `<i class="num ${balance(x.id) < 0 ? 'neg' : ''}">${kShort(balance(x.id))}</i>`)}${pillBar(moreBtn('acct-menu', 'Khớp số dư, bảng giá'), plusBtn('Thưởng thêm, chi tiêu, mục tiêu tiết kiệm'))}</div>
  <div class="day-head"><h1>Tài khoản</h1></div>${acctStats(k)}`;

  const kidName1 = esc(kidName(ak));
  h += `<div class="slots">${pendingCard(ak)}<section class="slot">${secHead('✏️', `Ghi cho ${kidName1}`)}<div class="acct-form">
    <div class="seg modes">${ACCT_KINDS.map(([v, l]) => `<label><input type="radio" name="akind" value="${v}" ${v === kind ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  const presets = list => `<div class="presets">${list.map(r => `<button class="preset ${priceKind(r)}" data-act="acct-preset" data-id="${r.id}"><span class="ico">${esc(r.icon || '•')}</span><span class="t">${esc(r.name)}</span>${r.note ? `<span class="muted small">${esc(r.note)}</span>` : ''}${againVnd(r) ? `<span class="muted small">lần ${penaltyTimes(r.id, ak) + 1} trong tuần</span>` : ''}<b class="num">${againVnd(r) ? '−' + money(penaltyVnd(r, ak)) : priceTag(r)}</b></button>`).join('')}</div>`;
  const custom = (label, btn, ph) => `<div class="row2"><div class="field"><label for="aamt">${label}</label><input id="aamt" class="input num" type="number" min="0" step="1000" inputmode="numeric" placeholder="Ví dụ: 10000"></div>
    <div class="field"><label for="anote">Lý do</label><input id="anote" class="input" maxlength="80" placeholder="${ph}"></div></div>
    <div class="row"><button class="btn ${kind === 'bonus' ? 'primary' : 'danger'}" data-act="acct-custom">${btn}</button></div>`;
  if (kind === 'penalty') {
    const ps = pricesList('penalty');
    h += ps.length ? `<p class="muted small" style="margin:0">Bấm vào lỗi để trừ tiền của ${kidName1}. Bấm nhầm thì bấm Hoàn tác ngay sau đó, hoặc Huỷ trong lịch sử.</p>${presets(ps)}` : `<p class="muted small" style="margin:0">Chưa có mục phạt nào. Thêm ở trang <a href="#bang-gia">Bảng giá</a>.</p>`;
    h += `<details class="adv"><summary>Phạt số tiền khác</summary>${custom('Số tiền trừ (đồng)', 'Trừ tiền', 'Ví dụ: Làm vỡ cốc')}</details>`;
  } else if (kind === 'fee') {
    const ps = pricesList('fee');
    h += `<div class="field"><label for="ahours">Đã dùng bao lâu (giờ)</label><div class="stepper"><button class="iconbtn" data-act="num-step" data-t="ahours" data-n="-0.5" data-min="0.5" aria-label="Bớt nửa giờ">−</button><input id="ahours" class="input num" type="number" min="0.5" step="0.5" value="1" inputmode="decimal"><button class="iconbtn" data-act="num-step" data-t="ahours" data-n="0.5" data-min="0.5" aria-label="Thêm nửa giờ">+</button></div>
      <span class="muted small">Nửa giờ là 0,5. Tiền trừ = giá mỗi giờ × số giờ.</span></div>`;
    h += ps.length ? presets(ps) : `<p class="muted small" style="margin:0">Chưa có mục phí sử dụng nào. Thêm ở trang <a href="#bang-gia">Bảng giá</a>.</p>`;
  } else if (kind === 'bonus') {
    h += `<p class="muted small" style="margin:0">Tiền việc nhà và tiền thưởng làm đủ việc được cộng tự động. Ở đây ghi các khoản thưởng thêm khác.</p>${pricesList('merit').length ? presets(pricesList('merit')) : ''}${custom('Số tiền thưởng (đồng)', 'Thưởng tiền', 'Ví dụ: Được điểm 10, giúp bà nấu cơm')}`;
  } else {
    const gs = pricesList('gift');
    h += `<p class="muted small" style="margin:0">Con tiêu tiền trong tài khoản: đổi phiếu thưởng, mua quà hoặc rút tiền mặt.</p>`;
    if (gs.length) h += presets(gs);
    h += custom('Số tiền chi (đồng)', 'Ghi chi tiêu', 'Ví dụ: Rút tiền mặt, mua truyện');
  }
  h += `</div></section>`;

  return h + goalsCard(ak) + histSection(ak) + `</div>`;
}
// Lịch sử tài khoản của một con. Chỉ xem (máy của con) thì không có nút Huỷ.
function histSection(kidId) {
  const rows = statement(kidId), shown = rows.slice(0, UI.histAll ? 300 : 30);
  let h = `<section class="slot">${secHead('🧾', 'Lịch sử', { cnt: rows.length || '', key: 'acct-hist' })}`;
  if (!secIsOpen('acct-hist')) return h + `</section>`;
  if (!rows.length) h += `<p class="foot-note" style="margin:0 6px">${RO ? 'Tiền việc nhà, tiền thưởng, phạt, phí sử dụng và chi tiêu của con sẽ hiện ở đây.' : 'Mỗi việc nhà được tiền, mỗi lần thưởng, phạt, phí sử dụng hay chi tiêu sẽ được ghi ở đây.'}</p>`;
  else h += `<div class="slot-list list hist">${shown.map(l => {
    const plus = l.vnd > 0, dt = l.at ? new Date(l.at) : null, [kt, ki] = LEDGER_KIND[l.kind] || [plus ? 'Thưởng' : 'Trừ tiền', plus ? '⭐' : '⚠️'];
    const time = dt && l.id ? ` · ${dm(dt)} ${pad(dt.getHours())}:${pad(dt.getMinutes())}` : '';
    return `<div class="item"><span class="ico">${esc(['chores', 'week', 'day'].includes(l.kind) ? ki : l.icon || ki)}</span><div class="txt"><div class="t">${kt}</div><div class="s">${esc(l.note || '')}${time}${l.legacy ? ` · quy đổi từ ${Math.abs(Number(l.delta) || 0)} sao` : ''}</div></div>
    <div class="acts"><span class="delta num ${plus ? 'plus' : 'minus'}">${signed(l.vnd)}</span>${l.id && !RO ? `<button class="linkbtn undo" data-act="ledger-undo" data-id="${l.id}">Huỷ</button>` : ''}</div></div>`;
  }).join('')}</div>${rows.length > shown.length ? `<div class="row"><button class="btn quiet sm" data-act="hist-all">Xem thêm ${rows.length - shown.length} dòng</button></div>` : ''}`;
  return h + `</section>`;
}

// Thành tích con báo, chờ bố mẹ duyệt. Chưa duyệt thì chưa tính vào số dư.
function pendingCard(kidId) {
  const list = pendingList(kidId); if (!list.length) return '';
  return `<section class="slot tn3">${secHead('🏅', 'Chờ bố mẹ duyệt', { cnt: list.length })}<div class="slot-list list">${list.map(l => {
    const dt = new Date(l.at);
    return `<div class="item pend"><span class="ico">${esc(l.icon || '🏅')}</span><div class="txt"><div class="t">${esc(l.note || 'Thành tích')}</div><div class="s">${esc(kidName(l.kid))} báo ${WDN(dt.getDay())} ${dm(dt)} · <b class="num plus">+${money(l.ask)}</b></div></div>
      <div class="acts"><button class="linkbtn undo" data-act="merit-no" data-id="${l.id}">Không</button><button class="btn primary sm" data-act="merit-ok" data-id="${l.id}">Duyệt</button></div></div>`;
  }).join('')}</div></section>`;
}
// Con báo thành tích: chọn một mục có sẵn, ghi thêm môn nếu muốn, rồi gửi bố mẹ duyệt.
function meritSheet(kidId) {
  if (!S.kids[kidId]) return;
  openModal(`<h2>Con đạt được gì?</h2><p class="muted small lead">Chọn một mục rồi gửi. Bố mẹ xem và duyệt thì tiền mới vào tài khoản của con.</p>
  <div class="fg"><div class="list menu">${meritList().map(r => `<button class="item nav" data-act="merit-pick" data-id="${r.id}" data-kid="${kidId}"><span class="ico">${esc(r.icon || '🏅')}</span><span class="txt"><span class="t">${esc(r.name)}</span><span class="s"><b class="num plus">+${money(priceVnd(r))}</b></span></span>${CHEV}</button>`).join('')}</div></div>
  <div class="foot"><button class="btn quiet" data-act="close">Đóng</button></div>`);
}
function meritForm(kidId, rid) {
  const r = meritList().find(x => x.id === rid); if (!r || !S.kids[kidId]) return;
  openModal(`<h2>${esc(r.icon || '🏅')} ${esc(r.name)}</h2><p class="muted small lead">Bố mẹ duyệt thì con được cộng <b class="num plus">+${money(priceVnd(r))}</b>.</p>
  <div class="fg">${frow('Môn gì, bài gì?', `<input id="mnote" class="input" maxlength="60" placeholder="Ví dụ: Toán, bài kiểm tra 15 phút">`, { id: 'mnote', cls: 'col', sub: 'Không bắt buộc, ghi để bố mẹ dễ xem' })}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="merit-ask" data-id="${rid}" data-kid="${kidId}">Gửi bố mẹ duyệt</button></div>`);
}
// Phiếu nghỉ việc nhà: hỏi con muốn nghỉ ngày nào rồi mới trừ tiền.
function skipForm(rid, kidId) {
  const r = S.rewards[rid]; if (!r) return;
  openModal(`<h2>${esc(r.icon || '🎟️')} ${esc(r.name)}</h2>
  <p class="muted small lead">${esc(kidName(kidId))} đổi phiếu này mất ${money(priceVnd(r))}. Việc phải làm của ngày được chọn được miễn${isDaily(S.kids[kidId]) ? ', chuỗi ngày không bị đứt. Ngày nghỉ không có thưởng ngày đủ việc' : ', vẫn giữ thưởng đủ tuần'}.</p>
  <div class="fg">${frow('Nghỉ ngày nào', `<input id="askip" class="pillin num" type="date" value="${key(today())}" min="${key(today())}">`, { id: 'askip' })}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="acct-preset" data-id="${rid}" data-go="1">Đổi phiếu</button></div>`);
}

// Khớp số dư: bố mẹ gõ số tiền thật của từng con, app ghi một khoản "Khớp số dư" bằng phần chênh lệch.
function balForm() {
  openModal(`<h2>Khớp số dư</h2><p class="muted small lead">Gõ số tiền thật đang có của từng con (ví dụ theo tài khoản ngân hàng). App ghi một khoản điều chỉnh bằng phần chênh lệch, lịch sử cũ giữ nguyên. Bỏ trống nếu không đổi.</p>
  <div class="fg">${kidsList().map(k => frow(`${mini(k)} ${esc(k.name)}`, pillNum(`bal-${k.id}`, '', { attr: `step="1" data-bal="${k.id}"`, ph: Math.max(0, balance(k.id)) }), { id: `bal-${k.id}`, sub: `Trong app: ${money(balance(k.id))}` })).join('')}</div>
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
// Trung bình mỗi tuần kiếm được (việc nhà + thưởng làm đủ việc), tính trên tối đa 4 tuần trước.
function weeklyRate(kidId) {
  return memoize('rate' + kidId, () => {
    const ws = weekStart(today()), k = S.kids[kidId] || {};
    const first = Object.keys(S.done).filter(dk => S.done[dk]?.[kidId]).sort()[0] || k.since;
    const start = first ? weekStart(parse(first)) : ws, bonus = Object.fromEntries(weekBonuses(kidId).map(w => [key(w.ws), w.amount]));
    let s = 0, n = 0;
    for (let i = 1; i <= 4; i++) {
      const w = addDays(ws, -7 * i); if (w < start) break;
      s += earned(kidId, key(w), key(addDays(w, 6))) + (bonus[key(w)] || 0) + dayBonusIn(kidId, key(w), key(addDays(w, 6))); n++;
    }
    if (!n) { const d = (today() - ws) / 864e5 + 1; return Math.round((earned(kidId, key(ws), key(today())) + dayBonusIn(kidId, key(ws), key(today()))) * 7 / d); }
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
  return `<div class="coins ${big ? 'big' : ''}" aria-label="Đã để dành ${on} trên ${n} xu, mỗi xu ${money(u)}">${Array.from({ length: n }, (_, i) => `<i class="${i < on ? 'on sj' + (i % 6) : ''}"></i>`).join('')}</div>
    <div class="muted small">Mỗi xu là ${money(u)}. Đã tô ${on}/${n} xu.</div>`;
}
function goalsCard(kidId) {
  const gs = goalProgress(kidId), done = goalsOf(kidId, true), kidAttr = `data-kid="${kidId}"`;
  let h = `<section class="slot tn3">${secHead('🎁', 'Mục tiêu tiết kiệm', { cnt: gs.length || '', add: addBtn('goal-form', 'Thêm mục tiêu tiết kiệm', kidAttr) })}`;
  if (!gs.length) h += blankAdd('Con muốn để dành mua gì? Ví dụ: xe đạp 500.000đ', 'goal-form', kidAttr, 'Con chưa có mục tiêu tiết kiệm. Muốn để dành mua gì thì nói với bố mẹ nhé');
  gs.forEach((g, i) => {
    const pct = g.price ? Math.round(g.have / g.price * 100) : 0;
    h += `<div class="card goal"><div class="kid-head"><span class="goal-ico">${esc(g.icon || '🎁')}</span><div class="txt" style="flex:1"><div class="muted small">${i === 0 ? 'Mục tiêu số 1' : `Ưu tiên ${i + 1}`}</div><div class="t goal-t">${esc(g.name)}</div></div>
      <span class="amt num">${money(g.price)}</span></div>
      <div class="prog">${bar(g.have, g.price)}<span class="num">${money(g.have)} · ${pct}%</span></div>
      ${coins(g)}
      <p class="small" style="margin:8px 0 0">${esc(earnPlan(kidId, g.need))}</p>
      ${RO ? '' : `<div class="row" style="margin-top:10px">${!g.need ? `<button class="btn primary sm" data-act="goal-buy" data-id="${g.id}">Mua ${esc(g.name)}</button>` : ''}${i > 0 ? `<button class="btn quiet sm" data-act="goal-up" data-id="${g.id}">↑ Ưu tiên hơn</button>` : ''}<button class="btn quiet sm" data-act="goal-form" data-id="${g.id}">Sửa</button></div>`}</div>`;
  });
  h += `</section>`;
  if (done.length) h += `<section class="slot">${secHead('', 'Đã đạt', { cnt: done.length, key: 'goal-done', closed: true })}${secIsOpen('goal-done', true) ? `<div class="slot-list list">${done.map(g => `<div class="item"><span class="ico">${esc(g.icon || '🎁')}</span><div class="txt"><div class="t">${esc(g.name)}</div><div class="s">${money(g.price)}${g.doneAt ? ` · mua ngày ${dm(parse(g.doneAt))}` : ''}</div></div><span class="badge ok">Đã đạt 🎉</span></div>`).join('')}</div>` : ''}</section>`;
  return h;
}
function goalForm(id, kidPre) {
  const g = id ? S.goals[id] : null, kids = kidsList();
  const kid = g?.kid || (S.kids[kidPre] ? kidPre : kids[0]?.id); if (!kid) return;
  openModal(`<h2>${g ? 'Sửa mục tiêu' : 'Thêm mục tiêu'}</h2>
  ${titleCard('gname', g?.name, 'Con muốn mua gì?', { icoName: 'gico', icons: GOAL_ICONS, ico: g?.icon })}
  <div class="fg">
    ${kids.length > 1 ? kidRow('Của con', 'gkid', 'radio', [kid]) : `<input type="hidden" name="gkid" value="${kid}">`}
    ${frow('Giá', pillNum('gprice', g ? Number(g.price) || 0 : 200000, { step: 50000, attr: 'min="0" step="1000"' }), { id: 'gprice' })}
  </div>
  ${formFoot(g ? 'goal-del' : '', id, 'goal-save')}`);
}
function printCoupons() {
  const gs = pricesList('gift');
  printHtml(`<div class="coupon-sheet"><h1>Phiếu thưởng</h1><div class="cs-sub">Cắt ra, con dùng tiền trong tài khoản để đổi</div>
    <div class="cs-grid">${gs.map((r, i) => `<div class="coupon c${i % 3}"><span class="c-ico">${esc(r.icon || '🎁')}</span><div><div class="c-t">${esc(r.name)}</div>${r.note ? `<div class="c-n">${esc(r.note)}</div>` : ''}<div class="c-p">${giftTag(r)}</div></div></div>`).join('')}</div></div>`);
}

// ---------- bảng giá ----------
const norm = v => String(v || '').trim().toLowerCase();
function missingSamples() {
  const cn = new Set(Object.values(S.chores).map(c => norm(c.name))), pn = new Set(Object.values(S.rewards).map(r => norm(r.name)));
  return { chores: SAMPLE_CHORES.filter(c => ![c.name, ...(c.also || [])].some(n => cn.has(norm(n)))), prices: SAMPLE_PRICES.filter(r => ![r.name, ...(r.also || [])].some(n => pn.has(norm(n)))) };
}
function addSamples(kidIds) {
  const m = missingSamples(); let order = Object.keys(S.chores).length;
  m.chores.forEach(({ also, ver, ...c }) => put('chores', uid(), { ...c, kids: kidIds, order: order++, since: key(today()) }));
  m.prices.forEach(({ also, ver, ...r }) => put('rewards', uid(), r));
  return m.chores.length + m.prices.length;
}
// Việc và mục giá có trong bảng mẫu mà nhà mình chưa có (tính cả tên cũ). Việc giao cho mọi con, bắt đầu từ hôm nay.
// Mã cố định theo tên, để hai máy cùng thêm một lúc không sinh ra hai việc trùng nhau.
// Thứ tự: chen vào cạnh việc của bảng mà nhà mình đã có, để trong mỗi buổi các việc vẫn theo thứ tự của bảng.
const slug = v => norm(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function sampleAdds() {
  const kids = kidsList(), chores = choresList(), prices = pricesList(), ops = [];
  const SL = { sang: 'buổi sáng', chieu: 'buổi chiều', toi: 'buổi tối', '': 'lúc nào cũng được' };
  const hit = (list, m) => list.find(x => [m.name, ...(m.also || [])].some(y => norm(y) === norm(x.name)));
  const have = SAMPLE_CHORES.map(m => hit(chores, m)), order = [];
  let last = null, step = 0;
  SAMPLE_CHORES.forEach((m, i) => {
    if (have[i]) { last = have[i].order ?? 0; step = 0; return; }
    if (last !== null) return (order[i] = last + ++step / 1000);
    const j = have.findIndex((x, n) => n > i && x);
    order[i] = j < 0 ? chores.length + i : (have[j].order ?? 0) - (j - i) / 1000;
  });
  SAMPLE_CHORES.forEach(({ also, ver, ...m }, i) => {
    const nid = 'mau-' + slug(m.name); if (have[i] || S.chores[nid]) return;
    ops.push({ col: 'chores', nid, add: { ...m, kids: kids.map(k => k.id), order: order[i], since: key(today()) }, ico: m.icon, t: `Thêm việc “${m.name}”`,
      s: [isFun(m) ? 'việc thích làm' : isWeekly(m) ? 'việc bắt buộc' : isExtra(m) ? `việc làm thêm, ${money(m.money)}` : `${money(m.money)} mỗi lần`, isExtra(m) ? '' : SL[m.slot], m.prep ? 'chỉ hiện vào tối trước ngày có học thêm' : ''].filter(Boolean).join(' · ') });
  });
  for (const { also, ver, ...m } of SAMPLE_PRICES) {
    const nid = 'gia-' + slug(m.name); if (hit(prices, { ...m, also }) || S.rewards[nid]) continue;
    ops.push({ col: 'rewards', nid, add: m, ico: m.icon, t: `Thêm ${m.kind === 'penalty' ? 'lỗi' : 'mục'} “${m.name}”`, s: m.week ? 'mất hết tiền được thưởng trong tuần' : m.all ? 'mất hết tiền đang có' : giftTagOf(m.kind, m.price) });
  }
  return ops;
}
// Nhà đã dùng bảng bản này (mọi con đã thưởng theo ngày) mà lịch từng ngày còn thiếu việc của bảng: tự thêm một lần lúc mở app.
// Lần cập nhật bản 2 trước đây chỉ thêm mục mới của bản, nên nhà chưa có việc nào thì các buổi vẫn trống.
// Chỉ làm một lần cho mỗi nhà (k.tableFull): sau đó bố mẹ xoá việc nào thì việc đó không tự quay lại.
let fillChecked = false;
function autoFill() {
  if (fillChecked || !loaded || stale) return;
  const kids = kidsList(); if (!kids.length) return;
  fillChecked = true;
  const ver = k => Number(k.tableVer) || 0, full = k => Number(k.tableFull) || 0;
  if (!kids.every(k => ver(k) >= TABLE_VER && isDaily(k)) || kids.every(k => full(k) >= TABLE_VER)) return;
  const adds = sampleAdds();
  for (const o of adds) put(o.col, o.nid, o.add);
  for (const k of kids) put('kids', k.id, { ...S.kids[k.id], tableFull: TABLE_VER });
  const nc = adds.filter(o => o.col === 'chores').length, np = adds.length - nc; if (!adds.length) return;
  toast([nc ? `Đã đưa ${nc} việc của bảng vào lịch từng ngày` : '', np ? `${nc ? 'thêm' : 'Đã thêm'} ${np} mục vào bảng giá` : ''].filter(Boolean).join(', ') + '.',
    () => { for (const o of adds) del(o.col, o.nid); toast('Đã hoàn tác, lịch như trước.'); });
}
// Những thứ app tự thêm một lần cho mỗi nhà, từ máy của bố mẹ (đánh dấu ở cài đặt của gia đình để không thêm lại sau khi bố mẹ sửa, xoá).
// Mã mục cố định nên hai máy cùng thêm cũng không bị trùng. Cờ ghi chung một lần để lần ghi sau không đè mất cờ trước.
//   merit: 5 mục thành tích ở trường trong Bảng giá.
//   hw: hai việc quan trọng về bài tập về nhà (hôm sau có học thêm, hôm sau đi học) và mục phạt Thiếu BTVN (lần 2 trong tuần phạt nặng hơn).
const HW_CHORES = [
  ['hw-lesson', { name: 'Nộp BTVN cho buổi học thêm hôm sau', icon: '📝', prep: true }],
  ['hw-school', { name: 'Hoàn thành BTVN trên lớp', icon: '📚', prep: 'school' }],
];
const HW_PENALTY = ['pen-hw', { name: 'Thiếu BTVN', icon: '📕', kind: 'penalty', price: 25000, again: 50000 }];
let addsChecked = false;
function autoAdds() {
  if (addsChecked || !loaded || stale || deviceRole() !== 'parent' || !kidsList().length) return;
  addsChecked = true;
  const set = S.paid[SETTINGS_ID] || {}, flags = {};
  if (!set.merit) {
    if (!pricesList('merit').length) SAMPLE_MERITS.forEach((m, i) => put('rewards', 'merit-' + (i + 1), { ...m, kind: 'merit' }));
    flags.merit = 1;
  }
  if (!set.hw) {
    const kids = kidsList().map(k => k.id), have = new Set(choresList().map(c => norm(c.name)));
    let order = Object.keys(S.chores).length, n = 0;
    for (const [id, c] of HW_CHORES) if (!S.chores[id] && !have.has(norm(c.name))) { put('chores', id, { money: 0, kind: 'must', kids, days: DAILY, slot: 'toi', imp: true, since: key(today()), order: order++, ...c }); n++; }
    const pen = !S.rewards[HW_PENALTY[0]] && !pricesList('penalty').some(r => norm(r.name) === norm(HW_PENALTY[1].name));
    if (pen) put('rewards', HW_PENALTY[0], HW_PENALTY[1]);
    flags.hw = 1;
    if (n || pen) toast(`Đã thêm ${[n ? `${n} việc quan trọng về BTVN` : '', pen ? 'mục phạt Thiếu BTVN' : ''].filter(Boolean).join(' và ')}. Sửa ở Bảng giá.`);
  }
  if (Object.keys(flags).length) put('paid', SETTINGS_ID, { ...set, ...flags });
}
// Cập nhật bảng giá một lần theo bảng mẫu bản mới: những gì sẽ đổi trong dữ liệu đang dùng.
// Chỉ đụng tới mục trùng tên với bảng mẫu (tên mới hoặc tên cũ); mục gia đình tự thêm thì giữ nguyên. Việc và mục giá còn thiếu thì thêm đủ.
// Trả về null khi không có gì để đổi, hoặc các con đã ghi bản này (đã áp dụng hoặc đã bỏ qua).
function tableUpdate() {
  const kids = kidsList(); if (!kids.length || kids.every(k => (Number(k.tableVer) || 0) >= TABLE_VER)) return null;
  const ops = [], wk = key(weekStart(today())), hit = (list, n) => list.find(x => [x.name, ...(x.also || [])].some(y => norm(y) === n));
  for (const k of kids) if (!isDaily(k)) ops.push({ col: 'kids', id: k.id, ico: '⭐', next: { dayBonus: DAY_BONUS, dayFrom: wk },
    t: `Thưởng theo ngày cho ${k.name}`, s: `Ngày nào đủ việc thưởng ${money(DAY_BONUS)}, thay cho ${weekBonusOf(k) ? `thưởng đủ tuần ${money(weekBonusOf(k))}` : 'thưởng đủ tuần'}. Tính từ Thứ Hai tuần này` });
  const chores = choresList(), cnames = new Set(chores.map(c => norm(c.name)));
  for (const c of chores) {
    const n = norm(c.name);
    if (RETIRED_CHORES.some(x => norm(x) === n)) { ops.push({ col: 'chores', id: c.id, ico: c.icon || '🗑️', del: true, t: `Bỏ việc “${c.name}”`, s: 'Tiền các ngày đã làm giữ nguyên' }); continue; }
    const m = hit(SAMPLE_CHORES, n); if (!m) continue;
    const next = {}, notes = [];
    if (norm(m.name) !== n && !cnames.has(norm(m.name))) { Object.assign(next, { name: m.name, icon: m.icon }); if (m.minutes) next.minutes = m.minutes; notes.push(`đổi tên thành “${m.name}”`); }
    if (m.money > 0 && !isFun(c) && choreVnd(c) > 0 && choreVnd(c) !== m.money) { next.money = m.money; notes.push(`${money(choreVnd(c))} thành ${money(m.money)}`); }
    const SL = { sang: 'buổi sáng', chieu: 'buổi chiều', toi: 'buổi tối', '': 'lúc nào cũng được' };
    if (m.kind === 'must' && m.money > 0 && isExtra(c)) { Object.assign(next, { kind: 'must', days: m.days, slot: m.slot, since: key(today()) }); notes.push(`đưa vào danh sách mỗi ngày, ${SL[m.slot]}`); }
    else if (m.kind === 'must' && isMust(c) && toMin(c.time) === null && (c.slot || '') !== m.slot) { next.slot = m.slot; notes.push(`chuyển sang ${SL[m.slot]}`); }
    if (m.claim && !c.claim && !c.shared) { next.claim = true; notes.push('ai làm trước thì tính, cùng làm thì chia đều tiền'); }
    const more = (m.steps || []).filter(x => (c.steps || []).length && !(c.steps || []).some(y => norm(y) === norm(x)));
    if (more.length) { next.steps = [...c.steps, ...more]; notes.push(`thêm bước “${more.join('”, “')}”`); }
    if (notes.length) ops.push({ col: 'chores', id: c.id, ico: next.icon || c.icon || '✅', next, t: c.name, s: notes.join(' · ') });
  }
  const prices = pricesList(), pnames = new Set(prices.map(r => norm(r.name)));
  for (const r of prices) {
    const n = norm(r.name), m = hit(SAMPLE_PRICES, n); if (!m || priceKind(r) !== m.kind) continue;
    const next = {}, notes = [];
    if (norm(m.name) !== n && !pnames.has(norm(m.name))) { Object.assign(next, { name: m.name, icon: m.icon }); notes.push(`đổi tên thành “${m.name}”`); }
    if (!!r.all !== !!m.all || !!r.week !== !!m.week) { Object.assign(next, { all: !!m.all, week: !!m.week, price: m.price }); notes.push(m.week ? 'mất hết tiền được thưởng trong tuần, thay cho mất hết tiền đang có' : m.all ? 'mất hết tiền đang có' : `trừ ${money(m.price)}`); }
    else if (!m.all && !m.week && priceVnd(r) !== m.price) { next.price = m.price; notes.push(`${giftTagOf(priceKind(r), priceVnd(r))} thành ${giftTagOf(m.kind, m.price)}`); }
    if (m.skip && r.note === SKIP_NOTE_OLD) next.note = m.note;
    if (notes.length) ops.push({ col: 'rewards', id: r.id, ico: next.icon || r.icon || '🏷️', next, t: r.name, s: notes.join(' · ') });
  }
  // Việc và mục giá của bảng mà nhà mình chưa có: thêm đủ, để lịch từng ngày có sẵn việc.
  ops.push(...sampleAdds());
  const bals = kids.filter(k => (Number(k.tableVer) || 0) < TABLE_VER && TABLE_BALANCES[norm(k.name)] != null).map(k => ({ kid: k.id, name: k.name, target: TABLE_BALANCES[norm(k.name)] }));
  return ops.length ? { ops, kids, bals } : null;
}
function tableUpdateForm() {
  const u = tableUpdate(); if (!u) return toast('Bảng giá đã là bản mới.');
  openModal(`<h2>Cập nhật bảng giá</h2><p class="muted small lead">Bấm Áp dụng để đổi ${u.ops.length} mục dưới đây trong bảng của nhà mình. Việc và mục giá nhà mình tự thêm thì giữ nguyên, tiền các ngày đã qua không đổi. Áp dụng xong vẫn bấm Hoàn tác được.</p>
  <div class="fg"><div class="list">${u.ops.map(o => `<div class="item"><span class="ico">${esc(o.ico)}</span><div class="txt"><div class="t">${esc(o.t)}</div><div class="s">${esc(o.s)}</div></div></div>`).join('')}</div></div>
  ${u.bals.length ? `<div class="fg">${u.bals.map(x => frow(`Số dư của ${esc(x.name)}`, pillNum(`tb-${x.kid}`, x.target, { attr: `step="1" data-tb="${x.kid}"` }), { id: `tb-${x.kid}`, sub: `Số bố mẹ chốt ngày ${TABLE_BAL_DATE}. Trong app đang là ${money(balance(x.kid))}. Từ đó tới nay đã khác thì sửa lại, bỏ trống nếu không muốn đổi` })).join('')}</div>` : ''}
  <div class="foot"><button class="btn danger left" data-act="table-skip">Không dùng bản này</button><button class="btn quiet" data-act="close">Để sau</button><button class="btn primary" data-act="table-apply">Áp dụng</button></div>`);
}
// Ghi các thay đổi của tableUpdate (apply = false thì chỉ ghi là đã xem bản này). Trả về hàm hoàn tác.
// bals: [{ kid, target }] số dư cần khớp sau khi đổi, ghi bằng một khoản "Khớp số dư" cho phần chênh lệch.
function tableUpdateRun(apply, bals = []) {
  const u = tableUpdate(); if (!u) return null;
  const raw = { kids: S.kids, chores: S.chores, rewards: S.rewards }, before = [], added = [], kidNext = {};
  // Ghi xong thì sửa luôn bản đang giữ trong máy, để số dư bên dưới tính theo dữ liệu mới mà không phải chờ đồng bộ.
  const save = (col, id, data) => { if (!raw[col][id]) return; before.push([col, id, { ...raw[col][id] }]); if (data) { put(col, id, data); raw[col][id] = data; } else { del(col, id); delete raw[col][id]; } };
  if (apply) for (const o of u.ops) {
    if (o.col === 'kids') { kidNext[o.id] = o.next; continue; }
    if (o.add) { const nid = o.nid || uid(); if (raw[o.col][nid]) continue; added.push([o.col, nid]); put(o.col, nid, o.add); raw[o.col][nid] = o.add; continue; }
    if (o.del) { save(o.col, o.id, null); continue; }
    const data = { ...raw[o.col][o.id], ...o.next };
    for (const f of ['all', 'week']) if (data[f] === false) delete data[f];
    save(o.col, o.id, data);
  }
  for (const k of u.kids) save('kids', k.id, { ...raw.kids[k.id], ...(kidNext[k.id] || {}), tableVer: TABLE_VER, tableFull: TABLE_VER });
  if (apply && bals.length) {
    memo = {}; const at = new Date().toISOString();
    for (const x of bals) {
      const diff = S.kids[x.kid] ? x.target - balance(x.kid) : 0; if (!diff) continue;
      const lid = uid(); added.push(['ledger', lid]);
      put('ledger', lid, { kid: x.kid, amount: diff, kind: 'adjust', icon: '🏦', note: `Khớp số dư khi cập nhật bảng giá: ${money(x.target)}`, at });
    }
    memo = {};
  }
  return () => { for (const [col, id, old] of before) put(col, id, old); for (const [col, id] of added) del(col, id); };
}
// Tiêu đề nhóm kèm nút thêm ngay tại chỗ: thêm đúng loại đang xem, không phải chọn lại loại trong form.
// Việc đang có tiền từng lần mà trùng tên với việc bắt buộc mỗi ngày trong bảng mẫu (gấp chăn, không kén ăn, bài tập, cất cặp, dọn bàn học, đánh răng...).
function weeklyCandidates() {
  const names = new Set(SAMPLE_CHORES.filter(isWeekly).flatMap(c => [c.name, ...(c.also || [])]).map(norm));
  return choresList().filter(c => isMust(c) && !isWeekly(c) && names.has(norm(c.name)));
}
function viewPrices() {
  const kids = kidsList(), chores = choresList().filter(c => !isFun(c)), off = !kids.length;
  let h = `<div class="day-head tools"><h1>Bảng giá</h1>${pillBar(moreBtn('price-menu', 'In bảng giá, in phiếu thưởng'), plusBtn('Thêm việc, phạt, phí, quà', off))}</div>`;
  const miss = missingSamples(), n = miss.chores.length + miss.prices.length;
  const upd = tableUpdate(), allDaily = kids.length > 0 && kids.every(isDaily);
  if (upd) h += suggest('Bảng giá có bản mới', `${upd.ops.length} thay đổi${upd.ops.some(o => o.col === 'kids') ? ', trong đó có thưởng theo ngày thay cho thưởng đủ tuần' : ''}. Xem trước rồi mới áp dụng.`, 'Xem thay đổi', 'table-update');
  if (n && kids.length) h += suggest(`Bảng mẫu còn ${n} mục chưa có ở đây`, miss.chores.length ? `${miss.chores.length} việc, ${miss.prices.length} mục phạt, phí và phiếu thưởng.` : 'Các mục phạt, phí sử dụng và phiếu thưởng.', 'Thêm vào', 'seed-prices');
  // Số tiền nằm ngay dưới tên, để tên việc không bị ép thành nhiều dòng trên màn hình hẹp.
  const who = c => `${esc((c.kids || []).map(kidName).join(', ') || 'chưa giao cho ai')} · ${perWeekOf(c) ? `${perWeekOf(c)} lần/tuần` : daysLabel(c.days)}`;
  const choreRow = c => `<div class="item"><span class="ico">${esc(c.icon || '✅')}</span><div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${isWeekly(c) ? '' : `<b class="num plus">+${money(choreVnd(c))}</b> · `}${who(c)}</div></div>
    <div class="acts">${editBtn('chore-form', c.id, c.name)}</div></div>`;
  const must = chores.filter(isMust), weekly = must.filter(isWeekly), each = must.filter(c => !isWeekly(c)), extra = chores.filter(isExtra);
  // Việc bắt buộc mỗi ngày: không tính tiền từng lần, làm đủ thì được thưởng (theo ngày, hoặc cả tuần với con chưa chuyển).
  const cand = weeklyCandidates();
  if (!weekly.length && cand.length) h += suggest('Chuyển sang việc bắt buộc mỗi ngày?', `${cand.map(c => esc(c.name)).join(', ')}: không cộng tiền từng lần nữa, ${allDaily ? bonusRules(kids) || 'làm đủ việc thì thưởng' : `làm đủ tất cả các ngày thì cuối tuần thưởng ${money(WEEK_BONUS)} mỗi con`}.`, `Chuyển ${cand.length} việc`, 'weekly-convert');
  // Mỗi nhóm một nhãn màu, bấm nhãn để gập lại khi chỉ muốn xem nhóm khác.
  const sec = (key, tint, ic, label, cnt, addAttr, body, note = '') => `<section class="slot ${tint}">${secHead(ic, label, { cnt, key, add: off ? '' : addBtn(addAttr[0], `Thêm: ${label}`, `data-kind="${addAttr[1]}"`) })}${secIsOpen(key) ? body + (note ? `<p class="foot-note" style="margin:0 6px">${note}</p>` : '') : ''}</section>`;
  const bonusRows = kids.map(k => isDaily(k) ? `<div class="item"><span class="ico">⭐</span><div class="txt"><div class="t">Mỗi ngày làm đủ việc${kids.length > 1 ? ` · ${esc(k.name)}` : ''}</div><div class="s"><b class="num ${dayBonusOf(k) ? 'plus' : ''}">${dayBonusOf(k) ? '+' + money(dayBonusOf(k)) : 'Không thưởng'}</b> · tự cộng khi xong việc phải làm cuối cùng trong ngày</div></div>
      <div class="acts">${editBtn('kid-form', k.id, 'thưởng ngày đủ việc của ' + k.name)}</div></div>` : `<div class="item"><span class="ico">🏆</span><div class="txt"><div class="t">Làm đủ tất cả các ngày trong tuần${kids.length > 1 ? ` · ${esc(k.name)}` : ''}</div><div class="s"><b class="num ${weekBonusOf(k) ? 'plus' : ''}">${weekBonusOf(k) ? '+' + money(weekBonusOf(k)) : 'Không thưởng'}</b> · tự cộng vào cuối tuần</div></div>
      <div class="acts">${editBtn('kid-form', k.id, 'thưởng đủ tuần của ' + k.name)}</div></div>`).join('');
  h += `<div class="slots">`;
  h += sec('bg-week', 'tn3', '⭐', 'Việc bắt buộc mỗi ngày', weekly.length || '', ['chore-form', 'week'], kids.length || weekly.length ? `<div class="slot-list list">${bonusRows}${weekly.map(choreRow).join('')}</div>` : blankAdd('Thêm con trước rồi giao việc', 'kid-form'),
    weekly.length ? (allDaily ? 'Không cộng tiền từng lần. Ngày nào làm đủ hết thì ngày đó được thưởng.' : 'Không cộng tiền từng lần. Làm đủ tất cả các ngày thì cuối tuần được thưởng.') : kids.length ? `Chưa có việc bắt buộc nào, nên ${allDaily ? 'thưởng ngày đủ việc' : 'thưởng đủ tuần'} đang tính theo tất cả việc mỗi ngày bên dưới. Mở một việc, chọn Cách thưởng là Bắt buộc mỗi ngày để đưa việc đó lên đây.` : '');
  if (each.length) h += sec('bg-each', 'tn1', '💰', 'Việc mỗi ngày có tiền', each.length, ['chore-form', 'each'], `<div class="slot-list list">${each.map(choreRow).join('')}</div>`, weekly.length ? 'Làm lần nào cộng tiền lần đó. Không tính vào thưởng làm đủ việc.' : '');
  h += sec('bg-extra', 'tn4', '💪', 'Việc làm thêm', extra.length || '', ['chore-form', 'extra'], extra.length ? `<div class="slot-list list">${extra.map(choreRow).join('')}</div>` : off ? '' : blankAdd('Việc không bắt buộc, làm lúc nào được tiền lúc đó', 'chore-form', 'data-kind="extra"'));
  const EMPTY = { merit: 'Con tự báo, bố mẹ duyệt mới cộng tiền. Ví dụ: được điểm 10', penalty: 'Lỗi nào thì bị trừ tiền. Ví dụ: nổi nóng, trì hoãn', fee: 'Dùng điện thoại, xem tivi mất bao nhiêu tiền mỗi giờ', gift: 'Con dùng tiền để đổi. Ví dụ: chọn phim tối nay' }, TINT = { merit: 'tn3', penalty: 's-late', fee: 'tn2', gift: 'tn5' };
  for (const [kind, label, ic] of PRICE_KINDS) {
    const list = pricesList(kind);
    h += `<section class="slot ${TINT[kind]}">${secHead(ic, label, { cnt: list.length || '', key: 'bg-' + kind, add: addBtn('price-form', `Thêm: ${label}`, `data-kind="${kind}"`) })}${!secIsOpen('bg-' + kind) ? '' : list.length
      ? `<div class="slot-list list">${list.map(r => `<div class="item"><span class="ico">${esc(r.icon || ic)}</span><div class="txt"><div class="t">${esc(r.name)}</div><div class="s"><b class="num ${kind === 'gift' ? '' : kind === 'merit' ? 'plus' : 'minus'}">${priceTag(r)}</b>${againVnd(r) ? ` · từ lần 2 trong tuần −${money(againVnd(r))}` : r.all ? ' · trừ hết số tiền đang có' : r.week ? ' · tiền việc nhà và tiền thưởng từ Thứ Hai tới lúc phạt' : r.skip ? ' · miễn việc phải làm một ngày' : ''}</div></div>
      <div class="acts">${editBtn('price-form', r.id, r.name)}</div></div>`).join('')}</div>${kind === 'merit' ? '<p class="foot-note" style="margin:0 6px">Con tự báo ở màn của con khi đạt được. Bố mẹ duyệt thì mới cộng tiền.</p>' : ''}` : blankAdd(EMPTY[kind], 'price-form', `data-kind="${kind}"`)}</section>`;
  }
  return h + `</div>`;
}
function printPrices() {
  const chores = choresList().filter(c => !isFun(c)), kids = kidsList();
  const cell = (icon, name, val, cls = '') => `<div class="pp-i"><span>${esc(icon)} ${esc(name)}:</span> <b class="${cls}">${esc(val)}</b></div>`;
  const rules = bonusRules(kids);
  const sec = (title, items) => items.length ? `<h2>${title}</h2><div class="pp-grid">${items.join('')}</div>` : '';
  printHtml(`<div class="price-poster"><h1>Tiền tiêu vặt của ${esc(kids.map(k => k.name).join(', ') || 'các con')}</h1>
    ${sec('Thưởng', chores.filter(c => !isWeekly(c)).map(c => cell(c.icon, c.name, money(choreVnd(c)))))}
    ${chores.some(isWeekly) ? `<h2>Việc bắt buộc mỗi ngày${rules ? `: ${rules}` : ''}</h2><div class="pp-line">${chores.filter(isWeekly).map(c => `${esc(c.icon || '')} ${esc(c.name)}`).join(' · ')}</div>` : ''}
    ${rules && !chores.some(isWeekly) ? `<div class="pp-line">🏆 Việc phải làm: <b>${rules}</b></div>` : ''}
    ${sec('Thành tích ở trường (con báo, bố mẹ duyệt)', meritList().map(r => cell(r.icon, r.name, '+' + money(priceVnd(r)))))}
    ${sec('Phạt', pricesList('penalty').map(r => cell(r.icon, r.name, r.all ? 'mất hết tiền' : r.week ? 'mất tiền thưởng của tuần' : 'trừ ' + money(priceVnd(r)) + (againVnd(r) ? `, từ lần 2 trong tuần ${money(againVnd(r))}` : ''), 'minus')))}
    ${sec('Phí sử dụng', pricesList('fee').map(r => cell(r.icon, r.name, money(priceVnd(r)) + '/giờ', 'minus')))}
    ${sec('Đổi quà', pricesList('gift').map(r => cell(r.icon, r.name, giftTag(r))))}</div>`);
}

const inviteLink = () => location.origin + location.pathname + '?gd=' + encodeURIComponent(family);

function viewFamily() {
  const kids = kidsList(), chores = choresList();
  let h = `<div class="day-head tools"><h1>Gia đình</h1>${pillBar(plusBtn('Thêm con hoặc việc nhà'))}</div><div class="slots">
  <section class="slot tn0">${secHead('👪', 'Các con', { cnt: kids.length || '', add: addBtn('kid-form', 'Thêm con') })}${kids.length
    ? `<div class="slot-list list">${kids.map(k => `<div class="item">${ava(k, 'sm')}<div class="txt"><div class="t">${esc(k.name)}</div><div class="s">${ageOf(k) !== null ? `${ageOf(k)} tuổi (sinh ${dm(parse(k.birthday))}/${parse(k.birthday).getFullYear()}) · ` : ''}${modeLabel(k)}</div></div><div class="acts">${editBtn('kid-form', k.id, k.name)}</div></div>`).join('')}</div>`
    : blankAdd('Thêm tên và hình đại diện cho từng con', 'kid-form')}</section>`;
  const choreItem = c => `<div class="item"><span class="ico">${esc(c.icon || '✅')}</span><div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${choreSummary(c)}</div></div><div class="acts">${editBtn('chore-form', c.id, c.name)}</div></div>`;
  // Việc nhà chia theo loại, mỗi loại một nhãn màu gập mở được.
  const GROUPS = [['gd-week', 'tn3', '⭐', 'Việc bắt buộc mỗi ngày', isWeekly, 'week'], ['gd-each', 'tn1', '💰', 'Việc mỗi ngày có tiền', c => isMust(c) && !isWeekly(c), 'each'], ['gd-extra', 'tn4', '💪', 'Việc làm thêm', isExtra, 'extra'], ['gd-fun', 'tn2', '🎬', 'Việc thích làm', isFun, 'fun']];
  if (chores.length) for (const [key, tint, ic, label, f, kind] of GROUPS) {
    const l = chores.filter(f); if (!l.length) continue;
    h += `<section class="slot ${tint}">${secHead(ic, label, { cnt: l.length, key, add: addBtn('chore-form', `Thêm: ${label}`, `data-kind="${kind}"`) })}${secIsOpen(key) ? `<div class="slot-list list">${l.map(choreItem).join('')}</div>` : ''}</section>`;
  } else h += `<section class="slot tn3">${secHead('🧹', 'Việc nhà')}${kids.length ? blankAdd('Thêm việc đầu tiên cho các con', 'chore-form') : '<p class="foot-note" style="margin:0 6px">Thêm con trước rồi giao việc.</p>'}</section>`;
  h += `</div>`;
  if (!chores.length && kids.length) h += suggest('Chưa biết bắt đầu từ đâu?', `Bảng mẫu có sẵn ${SAMPLE_CHORES.length} việc, ${SAMPLE_PRICES.length} mục phạt, phí sử dụng và phiếu thưởng. Thêm xong sửa lại tuỳ ý.`, 'Dùng bảng mẫu', 'seed');
  if (chores.length) h += `<p class="foot-note">Phạt, phí sử dụng và quà nằm ở <a href="#bang-gia">Bảng giá</a>.</p>`;
  if (kids.length) h += `<div class="slot-list list"><button class="item nav" data-act="sheet-open"><span class="ico">🖨️</span><span class="txt"><span class="t">In kế hoạch tuần</span><span class="s">Mỗi con một trang A4</span></span>${CHEV}</button></div>`;

  h += roleSection();
  h += `<section class="slot">${secHead('🔐', 'Chia sẻ và sao lưu')}<div class="card stack">`;
  if (store?.kind === 'firebase') {
    h += `<div class="field"><label for="invite">Link mời người nhà</label>
      <div class="copyrow"><input id="invite" class="input" readonly value="${esc(inviteLink())}"><button class="btn primary sm" data-act="copy-invite">Sao chép</button></div>
      <span class="muted small">${pinHash() ? 'Link cho bố, mẹ: máy mới mở link sẽ được hỏi là máy của ai, chọn bố mẹ thì nhập mã PIN. Máy của con thì dùng link riêng ở mục Máy của con.' : 'Gửi link này cho bố/mẹ hoặc mở trên máy tính bảng của con. Ai có link đều xem và sửa được bảng của nhà mình, nên chỉ gửi cho người trong nhà. Muốn máy của con chỉ thấy phần của con thì đặt mã PIN ở mục Máy của con.'}</span></div>`;
  } else {
    h += `<div class="note">Dữ liệu đang lưu trên trình duyệt của máy này. Muốn đồng bộ giữa điện thoại của bố, mẹ và máy của con, hãy bật Firebase theo hướng dẫn trong README của repo.</div>`;
  }
  if (getSeedMem()) h += `<div class="note">🔐 Máy này đã nhớ mật khẩu lịch gia đình. Mỗi khi lịch lưu sẵn có bản mới, app tự nạp lúc mở. <button class="btn quiet sm" data-act="seed-forget">Quên mật khẩu</button></div>`;
  h += `<div class="list"><button class="item nav" data-act="seed-form"><span class="ico">🔐</span><span class="txt"><span class="t">Nạp lịch gia đình</span><span class="s">Lịch lưu sẵn, mở bằng mật khẩu gia đình</span></span>${CHEV}</button>
    <button class="item nav" data-act="export"><span class="ico">⬇️</span><span class="txt"><span class="t">Tải bản sao lưu</span></span>${CHEV}</button>
    <label class="item nav file-btn"><span class="ico">⬆️</span><span class="txt"><span class="t">Nhập từ file sao lưu</span></span>${CHEV}<input type="file" id="import-file" accept=".json,application/json"></label>
    ${store?.kind === 'firebase' ? `<button class="item nav" data-act="leave"><span class="ico">🔁</span><span class="txt"><span class="t">Đổi sang gia đình khác</span></span>${CHEV}</button>` : ''}</div></div></section>`;
  return h;
}

// ---------- máy của ai: bố mẹ hay con ----------
// Nhà đặt mã PIN bố mẹ thì mỗi máy phải chọn một lần: máy của bố mẹ (nhập PIN, thấy và sửa mọi thứ) hay máy của một con
// (chỉ thấy phần của con đó, kiểu Chế độ cho bé, không thêm, sửa, xoá được gì). Mã PIN lưu dạng băm trong nhóm `paid`
// (nhóm cũ không còn dùng, đã có sẵn trong Rules nên không phải dán lại Rules).
// Đây là khoá ở giao diện: ai có mã gia đình vẫn đọc được dữ liệu trên Firestore, nên không thay cho việc giữ kín link mời.
const SETTINGS_ID = 'caidat';
const pinHash = () => S.paid?.[SETTINGS_ID]?.pin || null;
async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('misa-misu:' + pin));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
}
// 'parent': toàn quyền. Mã của một con: máy của con đó. 'ask': nhà có PIN mà máy này chưa chọn. 'wait': máy của con, đang chờ dữ liệu.
function deviceRole() {
  const r = getRole(), kid = r && r !== 'parent';
  if (!loaded) return kid ? 'wait' : 'parent';
  if (!pinHash()) return kid && stale ? 'wait' : 'parent';
  if (r === 'parent') return 'parent';
  return kid && S.kids[r] ? r : 'ask';
}
const kidLink = id => inviteLink() + '&con=' + encodeURIComponent(id);
// Việc máy của con được làm: đánh dấu việc, bài tập của chính mình, gập mở các buổi, và xin vào phần bố mẹ.
// Thêm các nút chỉ để xem ở mục Học tập: đổi tab, chọn ngày, chọn thứ, mở nhóm đã qua.
const KID_ACTS = new Set(['close', 'tick', 'step', 'slot-toggle', 'task-done', 'task-step', 'role-kid', 'role-kid-ok', 'role-parent', 'pin-ok',
  'tkb-go', 'learn-tab', 'tkb-day', 'ag-day', 'ag-week', 'hist-all', 'sec-toggle', 'merit-open', 'merit-pick', 'merit-ask', 'merit-cancel', 'km-acct']);
function kidMay(a, b) {
  const r = deviceRole(); if (r === 'parent') return true;
  if (!KID_ACTS.has(a)) return false;
  if (a === 'tick' || a === 'step') return b.dataset.kid === r;
  if (a === 'task-done' || a === 'task-step') return S.tasks[b.dataset.id]?.kid === r;
  if (a === 'role-kid' || a === 'role-kid-ok') return r === 'ask';
  // Thành tích: con chỉ báo cho chính mình và chỉ huỷ mục của mình đang chờ duyệt. Duyệt là việc của bố mẹ.
  if (a === 'merit-open' || a === 'merit-pick' || a === 'merit-ask') return b.dataset.kid === r;
  if (a === 'merit-cancel') { const l = S.ledger[b.dataset.id]; return !!l && !!l.pending && l.kid === r; }
  return true;
}
// mode 'unlock': nhập PIN để máy này thành máy của bố mẹ. mode 'set': đặt hoặc đổi PIN (chỉ máy của bố mẹ).
function pinForm(mode) {
  const set = mode === 'set';
  openModal(`<h2>${set ? (pinHash() ? 'Đổi mã PIN' : 'Đặt mã PIN bố mẹ') : 'Bố mẹ'}</h2>
  <p class="muted small lead">${set ? 'Từ 4 đến 8 chữ số. Có mã PIN rồi thì máy nào cũng phải chọn một lần: máy của bố mẹ (nhập mã này) hay máy của một con. Đừng cho các con biết mã.' : 'Nhập mã PIN của bố mẹ để máy này thấy và sửa được mọi thứ.'}</p>
  <div class="fg">${frow('Mã PIN', `<input id="pin" class="pillin txt num" type="${set ? 'text' : 'password'}" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" placeholder="••••">`, { id: 'pin' })}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="pin-ok" data-mode="${set ? 'set' : 'unlock'}">${set ? 'Lưu' : 'Mở'}</button></div>`);
}
function roleKidForm(id, fromParent) {
  const k = S.kids[id]; if (!k) return;
  openModal(`<h2>Máy của ${esc(k.name)}</h2>
  <p class="muted small lead">${fromParent ? `Máy này sẽ chỉ còn thấy phần của ${esc(k.name)}: việc hôm nay, bài cần nộp, tiền đang có. Không thêm, sửa, xoá được gì.` : `Con là ${esc(k.name)} phải không? Máy này sẽ chỉ hiện phần của con.`} Muốn đổi lại phải có mã PIN của bố mẹ.</p>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="role-kid-ok" data-kid="${id}">Đúng rồi</button></div>`);
}
// Mục "Máy của con" trong trang Gia đình.
function roleSection() {
  const kids = kidsList(); if (!kids.length) return '';
  let h = `<section class="slot">${secHead('🔒', 'Máy của con')}<div class="card stack">`;
  if (!pinHash()) {
    h += `<div class="note">Hiện giờ ai mở app cũng thấy và sửa được như bố mẹ. Đặt mã PIN bố mẹ để máy của con chỉ thấy phần của con.</div>
      <div class="list">${menuRow('data-act="pin-set"', '🔑', 'Đặt mã PIN bố mẹ', 'Sau đó mỗi máy chọn một lần: bố mẹ hay con nào')}</div>`;
  } else {
    h += `<div class="note">Máy này là máy của bố mẹ. Máy khác mở app sẽ được hỏi là máy của ai; chọn bố mẹ thì phải nhập mã PIN.</div><div class="list">`;
    for (const k of kids) {
      if (store?.kind === 'firebase') h += menuRow(`data-act="copy-kid-link" data-kid="${k.id}"`, '🔗', `Sao chép link cho máy của ${esc(k.name)}`, `Mở link này trên máy của ${esc(k.name)} là vào thẳng phần của con`);
      h += menuRow(`data-act="role-kid" data-kid="${k.id}"`, '📱', `Dùng máy này cho ${esc(k.name)}`, 'Khoá máy đang cầm vào phần của con');
    }
    h += `${menuRow('data-act="pin-set"', '🔑', 'Đổi mã PIN')}<button class="item nav" data-act="pin-clear"><span class="ico">🔓</span><span class="txt"><span class="t">Bỏ mã PIN</span><span class="s">Mọi máy lại thấy và sửa được như bố mẹ</span></span>${CHEV}</button></div>`;
  }
  return h + `</div></section>`;
}

// Thành tích ở trường trên màn của con: những mục con đã báo đang chờ duyệt, và nút + để báo mục mới.
function meritSection(k) {
  const pend = pendingList(k.id);
  return meritList().length ? `<section class="slot tn3">${secHead('🏅', 'Thành tích ở trường', { cnt: pend.length || '' })}
    ${pend.length ? `<div class="slot-list list">${pend.map(l => `<div class="item pend"><span class="ico">${esc(l.icon || '🏅')}</span><div class="txt"><div class="t">${esc(l.note || 'Thành tích')}</div><div class="s">⏳ Chờ bố mẹ duyệt · ${dm(new Date(l.at))}</div></div>
      <div class="acts col"><span class="delta num wait">+${money(l.ask)}</span><button class="linkbtn undo" data-act="merit-cancel" data-id="${l.id}">Huỷ</button></div></div>`).join('')}</div>` : ''}
    <button class="slot-blank" data-act="merit-open" data-kid="${k.id}"><span>Được cô khen, được điểm 9, điểm 10? Bấm để báo bố mẹ</span>${PLUS}</button></section>` : '';
}
// Tin mới trên tab Hôm nay của con: hôm nay, hôm qua bị trừ tiền vì gì (phạt, phí sử dụng) và thành tích nào bố mẹ vừa duyệt. Bấm để sang tab Tài khoản.
function kmNews(k, t) {
  const tk = key(t), yk = key(addDays(t, -1)), day = iso => { const dk = iso ? key(new Date(iso)) : ''; return dk === tk ? 'Hôm nay' : dk === yk ? 'Hôm qua' : ''; };
  const mine = Object.values(S.ledger).filter(l => l.kid === k.id && !l.pending).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const cuts = mine.filter(l => ['penalty', 'fee'].includes(l.kind) && ledgerVnd(l) < 0 && day(l.at)), oks = mine.filter(l => day(l.okAt) && ledgerVnd(l) > 0);
  const card = (cls, title, list, when) => list.length ? `<button class="km-news ${cls}" data-act="km-acct"><b>${title}</b>${list.map(l => `<span>${day(when(l))} · ${esc(l.note || '')} <i class="num">${signed(ledgerVnd(l))}</i></span>`).join('')}${CHEV}</button>` : '';
  return card('cut', `⚠️ Con bị trừ ${money(-cuts.reduce((a, l) => a + ledgerVnd(l), 0))}`, cuts, l => l.at) + card('ok', `🏅 Bố mẹ đã duyệt, con được cộng ${money(oks.reduce((a, l) => a + ledgerVnd(l), 0))}`, oks, l => l.okAt);
}
// Bảng phạt và phí cho con xem (lấy từ Bảng giá của bố mẹ): lỗi nào bị trừ bao nhiêu, dùng gì mất bao nhiêu mỗi giờ, để con biết mà tránh.
function kidRules() {
  const row = (r, ic, tag, sub) => `<div class="item"><span class="ico">${esc(r.icon || ic)}</span><div class="txt"><div class="t">${esc(r.name)}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div><div class="acts"><span class="delta num minus">${tag}</span></div></div>`;
  const ps = pricesList('penalty'), fs = pricesList('fee');
  return (ps.length ? `<section class="slot s-late">${secHead('⚠️', 'Lỗi bị phạt', { cnt: ps.length, key: 'kr-pen' })}${secIsOpen('kr-pen') ? `<div class="slot-list list">${ps.map(r => row(r, '⚠️', r.all ? 'Mất hết tiền' : r.week ? 'Mất thưởng tuần' : '−' + money(priceVnd(r)),
    r.all ? 'Trừ hết số tiền con đang có' : r.week ? 'Mất tiền việc nhà và tiền thưởng từ Thứ Hai tới lúc bị phạt' : againVnd(r) ? `Từ lần 2 trong tuần: <b class="num minus">−${money(againVnd(r))}</b>` : '')).join('')}</div><p class="foot-note" style="margin:0 6px">Mỗi lần mắc lỗi là bị trừ một lần.</p>` : ''}</section>` : '')
    + (fs.length ? `<section class="slot tn2">${secHead('📱', 'Phí sử dụng', { cnt: fs.length, key: 'kr-fee' })}${secIsOpen('kr-fee') ? `<div class="slot-list list">${fs.map(r => row(r, '📱', '−' + money(priceVnd(r)) + '/giờ', '')).join('')}</div><p class="foot-note" style="margin:0 6px">Dùng bao lâu trừ bấy nhiêu, nửa giờ trừ một nửa.</p>` : ''}</section>` : '');
}
// Tab Tài khoản của con: đang có bao nhiêu, bảng phạt và phí, mục tiêu tiết kiệm và toàn bộ lịch sử cộng trừ (kể cả các lần bị phạt), chỉ xem.
function kidAcct(k) {
  return `<div class="day-head"><h1>Tài khoản</h1></div>${acctStats(k)}<div class="slots">${kidRules()}${meritSection(k)}${goalsCard(k.id)}${histSection(k.id)}</div>`;
}
// ---------- kid mode ----------
function drawKidMode() {
  const el = $('#km'), role = deviceRole(), lock = role !== 'parent';
  document.body.classList.toggle('locked', lock);
  el.hidden = !lock && !UI.km.on;
  if (el.hidden) { el.innerHTML = ''; return; }
  el.classList.remove('plain');
  const kids = kidsList(), t = today();
  if (role === 'wait') { el.innerHTML = `<div class="wrap">${loading()}</div>`; return; }
  if (role === 'ask') {
    // Nhà có mã PIN mà máy này chưa chọn: hỏi một lần. Không hiện tiền hay việc của ai, để con không xem được phần của nhau.
    el.innerHTML = `<div class="wrap"><div class="km-top"><span></span></div><div class="day-head"><h1>Máy này của ai?</h1></div>
    <div class="who-grid">${kids.map(x => `<button class="who-btn" data-act="role-kid" data-kid="${x.id}">${ava(x)}<b>${esc(x.name)}</b></button>`).join('')}</div>
    <button class="btn ghost role-parent" data-act="role-parent">🔒 Bố mẹ</button>
    <p class="foot-note center">Chỉ chọn một lần. Máy của con chỉ hiện phần của con; muốn đổi phải có mã PIN của bố mẹ.</p></div>`;
    return;
  }
  const hold = lock ? `<button class="hold" data-act="role-parent"><span>🔒 Bố mẹ</span></button>` : `<button class="hold" data-hold="1"><span>Giữ để thoát</span></button>`;
  const kmKid = lock ? role : UI.km.kid;
  const k = kmKid && S.kids[kmKid] ? kids.find(x => x.id === kmKid) : null;
  if (!k) {
    // Chọn bạn nào: mỗi con một thẻ to, kèm hôm nay còn mấy việc và số dư.
    const who = x => { const l = mustFor(x.id, t), n = l.filter(c => isDone(t, x.id, c.id)).length; return `<button class="who-btn" data-act="km-kid" data-kid="${x.id}">${ava(x)}<b>${esc(x.name)}</b><span class="who-s ${l.length && n === l.length ? 'full' : ''}">${!l.length ? 'Hôm nay được nghỉ' : n === l.length ? '✓ Xong hết rồi' : `Còn ${l.length - n} việc`}</span>${moneyChip(x)}</button>`; };
    el.innerHTML = `<div class="wrap"><div class="km-top"><span></span>${hold}</div><div class="day-head"><h1>Ai đang làm việc nhà?</h1></div>
    <div class="who-grid">${kids.map(who).join('')}</div></div>`;
    return;
  }
  // Ba tab của con: việc hôm nay, Học tập (thời khoá biểu, bài tập, mốc năm học, học thêm) và Tài khoản (số dư, lịch sử cộng trừ). Hai tab sau là của riêng con, chỉ xem.
  const tab = ['learn', 'acct'].includes(UI.kmTab) ? UI.kmTab : 'today';
  const top = `<div class="km-top">${kids.length > 1 && !lock ? `<button class="linkbtn back" data-act="km-kid" data-kid="">${PREV}Đổi bạn</button>` : '<span></span>'}${hold}</div>
  <div class="seg modes km-tabs" role="tablist" aria-label="Chọn màn">${[['today', '☀️ Hôm nay'], ['learn', '📚 Học tập'], ['acct', '💰 Tài khoản']].map(([v, l]) => `<label><input type="radio" name="kmtab" value="${v}" ${v === tab ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  el.classList.toggle('plain', tab !== 'today');
  if (tab !== 'today') {
    RO = true;
    try { el.innerHTML = `<div class="wrap">${top}${tab === 'learn' ? learnPage([k], false) : kidAcct(k)}</div>`; } finally { RO = false; }
    return;
  }
  const list = mustFor(k.id, t), n = list.filter(c => isDone(t, k.id, c.id)).length, plan = dayPlan(k.id, t), cur = slotAt(nowMin());
  const sc = schoolNow(k, t, true);
  const kst = stayNow(t.getDay());
  const kts = tasksSoon(k.id), g1 = goalProgress(k.id)[0];
  const goal = g1 ? `<div class="km-goal"><div class="t">${esc(g1.icon || '🎁')} Con đang để dành mua <b>${esc(g1.name)}</b></div>${coins(g1, true)}<div class="muted">${g1.need ? `Còn thiếu ${money(g1.need)}` : 'Đủ tiền rồi! Nhờ bố mẹ mua cho con nhé 🎉'}</div></div>` : '';
  // Trên danh sách việc: những gì con phải làm hôm nay (bài cần nộp, soạn cặp). Dưới danh sách: mốc sắp tới và mục tiêu tiết kiệm.
  const school = (kts.length ? `<section class="slot s-task">${secHead('📝', 'Bài cần nộp', { cnt: kts.length })}<div class="big-list">${kts.map(t => taskRow(t, false, 'big')).join('')}</div></section>` : '')
    + (sc ? `<section class="slot tn4">${secHead(sc.bag ? '🎒' : '🏫', esc(sc.title))}<div class="slot-list pad"><div class="sj-list">${subjChips(sc.subjects)}</div></div></section>` : '');
  const after = eventLines(k, 'km-event') + goal;
  const merit = meritSection(k);
  const bigChore = (x, g) => {
    const c = x.c, on = isDone(t, k.id, c.id), steps = (c.steps || []).filter(Boolean), mask = stepMask(t, k.id, c.id);
    const sub = `<span class="s">${choreMeta(c, k.id, t, true)}</span>`;
    if (isFun(c)) return `<div class="big-item fun ${x.locked ? 'locked' : 'open'}"><span class="ico">${esc(c.icon || '🎈')}</span><span><span class="t">${esc(c.name)}</span><br>${x.locked ? `<span class="s">Xong ${g.left} việc phải làm${g.id ? ' của ' + g.label.toLowerCase() : ''} là được làm việc này!</span>` : '<span class="s">Mở khoá rồi, con được làm việc này!</span>'}</span><span class="lockic">${x.locked ? '🔒' : ''}</span></div>`;
    if (!steps.length) return `<button class="big-item ${on ? 'done' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" data-km="1" aria-pressed="${on}"><span class="ico">${esc(c.icon || '✅')}</span><span><span class="t">${esc(c.name)}</span><br>${sub}</span><span class="stamp ${on ? 'on' : ''}">${STAR}</span></button>`;
    return `<div class="big-item has-steps ${on ? 'done' : ''}"><div class="big-top"><span class="ico">${esc(c.icon || '✅')}</span><span><span class="t">${esc(c.name)}</span><br>${sub}</span>
      <button class="stamp ${on ? 'on' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" data-km="1" aria-pressed="${on}" aria-label="${on ? 'Bỏ dấu' : 'Xong hết'}: ${esc(c.name)}">${STAR}</button></div>
      <div class="big-steps">${steps.map((st, i) => { const ok = on || (mask >> i) & 1; return `<button class="step ${ok ? 'on' : ''}" data-act="step" data-kid="${k.id}" data-chore="${c.id}" data-i="${i}" data-km="1" aria-pressed="${!!ok}">${esc(st)}</button>`; }).join('')}</div></div>`;
  };
  // Mỗi buổi một nhãn màu như màn Hôm nay, chữ và nút to hơn. Chỉ buổi đang diễn ra mở sẵn (xem slotOpenDefault); bấm nhãn để mở buổi khác.
  const timeline = plan.map(g => {
    const sk = `km|${key(t)}|${k.id}|${g.id}|${cur}`, isNow = !g.extra && g.id && g.id === cur;
    const mine = g.items.filter(x => x.type === 'chore' && !isFun(x.c)), nd = mine.filter(x => isDone(t, k.id, x.c.id) || takenBy(x.c, k.id, t).length).length;
    const full = !g.extra && mine.length > 0 && nd === mine.length, hasFun = g.items.some(x => x.type === 'chore' && isFun(x.c));
    const open = UI.slotOpen[sk] ?? slotOpenDefault(g, cur, full, nd, hasFun);
    const cnt = g.extra ? `${nd ? `${nd}/` : ''}${g.items.length}` : mine.length ? `${full ? '✓ ' : ''}${nd}/${mine.length}` : '';
    return `<section class="slot s-${g.extra ? 'them' : g.id || 'any'} ${full ? 'full' : ''}" data-slot="${sk}"><div class="slot-h"><button class="slot-pill" data-act="slot-toggle" data-slot="${sk}" aria-expanded="${!!open}">${g.icon}<span>${g.label}</span>${cnt ? `<i class="num">${cnt}</i>` : ''}${DOWN}</button>${isNow ? '<span class="nowpill">Bây giờ</span>' : ''}</div>
      ${open ? `<div class="big-list">${g.items.map(x => x.type === 'chore' ? bigChore(x, g) : markRow(x, true)).join('')}</div>` : ''}</section>`;
  }).join('');
  const stk = streakOf(k.id), left = list.length - n;
  const wst = weekStats(k, weekStart(t)), wb = weekBonusOf(k);
  const db = dayBonusAt(k, key(t)), nFull = dayBonuses(k.id).filter(x => x.dk >= key(weekStart(t))).length;
  const weekLine = isDaily(k) ? (db && list.length ? `<div class="km-week">${dayFull(k.id, t) === true ? `⭐ Hôm nay đủ việc rồi! Con được thưởng ${money(db)}` : `Làm đủ việc hôm nay được thưởng ${money(db)}`}${nFull ? ` · tuần này <span class="num">${nFull}</span> ngày đủ việc` : ''}</div>` : '')
    : wb && wst.possible ? `<div class="km-week">${wst.done >= wst.possible ? `🏆 Đủ việc cả tuần rồi! Con được thưởng ${money(wb)}` : `Tuần này <span class="num">${wst.done}/${wst.possible}</span> việc · làm đủ cả tuần được thưởng ${money(wb)}`}</div>` : '';
  const bubble = isBirthday(k, t) ? `Chúc mừng sinh nhật ${esc(k.name)}! 🎂` : !list.length ? `Chào ${esc(k.name)}! Hôm nay thảnh thơi nhé!` : left ? `Chào ${esc(k.name)}! Cùng làm việc nào!` : `${esc(k.name)} giỏi quá! 🎉`;
  // Đầu màn gọn trong một thẻ: hình của con, lời chào, rồi tiền đang có, chuỗi ngày và con đang ở đâu.
  el.innerHTML = `<div class="wrap">${top}
  <div class="km-hero" style="--tint:${tintOf(k)}">${ava(k)}<div class="km-hi"><div class="km-date">${WD[t.getDay()]}, ${t.getDate()} tháng ${t.getMonth() + 1}</div><div class="km-bubble">${bubble}</div>
    <div class="km-chips"><span class="km-chip num ${balance(k.id) < 0 ? 'minus' : ''}">💰 ${money(balance(k.id))}</span>${stk ? `<span class="km-chip num">🔥 ${stk} ngày</span>` : ''}${kst ? `<span class="km-chip ${kst.next ? 'moved' : ''}">📍 ${esc(shortPlace(kst.here))}${kst.next ? ` · tối về ${esc(placeLow(kst.next))}` : ''}</span>` : ''}</div></div></div>
  ${list.length ? `<section class="kid-sum km-sum"><div class="kid-sum-row"><b class="kid-sum-t">${left ? `Hôm nay còn ${left} việc` : 'Xong hết việc hôm nay 🎉'}</b><span class="lv num ${left ? '' : 'full'}">${n}/${list.length}</span></div>
    ${barCount(n, list.length)}${weekLine}</section>` : ''}
  ${kmNews(k, t)}${skipNote(k, t)}
  <div class="slots">${school}${list.length || plan.length ? timeline
    : `<div class="card empty"><div class="big">🎈</div><h2>${school ? 'Hôm nay con không có việc nhà nào.' : 'Hôm nay con được nghỉ!'}</h2></div>`}${merit}</div>
  ${after}</div>`;
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
  openModal(`<h2>Kế hoạch tuần</h2><p class="muted small lead">Mỗi con một trang: việc theo buổi sáng, chiều, tối; ô đánh dấu từng ngày; lịch học thêm, kiểm tra, bài phải nộp; mục tiêu tiết kiệm.</p>
  <div class="seg modes"><label><input type="radio" name="planw" value="0" ${UI.planNext ? '' : 'checked'}><span>Tuần này (${dm(weekStart(today()))})</span></label><label><input type="radio" name="planw" value="1" ${UI.planNext ? 'checked' : ''}><span>Tuần sau (${dm(addDays(weekStart(today()), 7))})</span></label></div>
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
  pa.className = cls; pa.innerHTML = html; iconify(pa); // thay emoji ngay, vì window.print() chặn trang trước khi autoIcons kịp chạy
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
  m.innerHTML = `<div class="dialog ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
  const dlg = m.querySelector('.dialog'), h2 = dlg.querySelector(':scope > h2'), foot = dlg.querySelector(':scope > .foot');
  // Thanh trên cùng như sheet của iOS: Huỷ bên trái, tên form ở giữa, nút chính (Lưu) bên phải, luôn trong tầm mắt dù form dài.
  // Nút Xoá ở lại cuối form.
  if (h2 && foot) {
    const bar = document.createElement('div'); bar.className = 'sheet-bar';
    const side = b => b || document.createElement('span');
    bar.append(side(foot.querySelector('[data-act=close]')), h2, side(foot.querySelector('.btn.primary')));
    dlg.prepend(bar);
    if (!foot.children.length) foot.remove();
  }
  m.hidden = false;
  if (keep) { dlg.scrollTop = top; return; }
  modalDirty = false;
  // Form thêm mới thì đặt con trỏ vào ô đầu tiên. Form sửa không bật bàn phím che mất nội dung.
  const f = dlg.querySelector('input.input:not([type=date]):not([type=time]):not([type=number])');
  if (f && !f.value && !wide) f.focus(); else dlg.focus();
  dlg.querySelectorAll('.pick input:checked').forEach(x => { const sp = x.nextElementSibling, box = x.closest('.pick'); if (sp && box.scrollWidth > box.clientWidth) box.scrollLeft = Math.max(0, sp.offsetLeft - box.clientWidth / 2); });
}
function closeModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; UI.sheet = false; modalDirty = false; }
// Form đã gõ hoặc chọn gì đó thì bấm ra ngoài / phím Esc không đóng, tránh mất công nhập. Muốn bỏ thì bấm Huỷ.
let modalDirty = false;
function dismissModal() {
  if (modalDirty && !UI.sheet && !$('#modal .qa')) return toast('Chưa lưu. Bấm Lưu để giữ, hoặc Huỷ để bỏ.');
  closeModal();
}
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
  let h = `<div class="av-group"><span class="av-h">Mỗi ngày một kiểu</span><div class="pick av">${sets.map(([id, st]) => opt('set:' + id, avInner('set:' + id) + `<i class="av-badge">${icon('🔀')}</i>`, `${st.label}, mỗi ngày một kiểu`, 'rot')).join('')}</div></div>`;
  for (const [id, st] of sets) h += `<div class="av-group"><span class="av-h">${st.label}</span><div class="pick av">${st.items.map((it, i) => opt(`svg:${id}-${i}`, avInner(`svg:${id}-${i}`), it[0])).join('')}</div></div>`;
  h += `<div class="av-group"><span class="av-h">Emoji</span><div class="pick" data-noic>${AVATARS.map(e => opt(e, e, e)).join('')}</div></div>`;
  if (!val) h = h.replace('name="kava" value="set:ga"', 'name="kava" value="set:ga" checked');
  return h;
}
function kidForm(id) {
  const k = id ? S.kids[id] : null;
  photoEdit = { img: null, out: undefined };
  openModal(`<h2>${k ? 'Sửa thông tin con' : 'Thêm con'}</h2>
  ${titleCard('kname', k?.name, 'Tên của con', { max: 30 })}
  <div class="fg">
    ${frow('Ngày sinh', `<input id="kbday" class="pillin num" type="date" value="${esc(k?.birthday || '')}">`, { id: 'kbday' })}
    ${!k || isDaily(k) ? frow('Thưởng ngày đủ việc', pillNum('kdb', k ? dayBonusOf(k) : DAY_BONUS, { step: 5000, attr: 'min="0" step="1000"' }), { id: 'kdb', sub: `Ngày nào con xong hết việc phải làm thì app tự cộng tiền này. Để 0 nếu không thưởng.${k ? ' Đổi số tiền thì tính từ hôm nay.' : ''}` })
      : frow('Thưởng đủ tuần', pillNum('kwb', weekBonusOf(k), { step: 5000, attr: 'min="0" step="5000"' }), { id: 'kwb', sub: 'Xong hết việc phải làm từ Thứ Hai đến Chủ nhật thì app tự cộng tiền này. Để 0 nếu không thưởng. Đổi số tiền thì tính từ tuần này.' })
        + `<div class="fr">${toggle('kday', `Chuyển sang thưởng theo ngày <span class="fs">Ngày nào đủ việc thì thưởng ${money(DAY_BONUS)}, thay cho thưởng đủ tuần. Tính từ Thứ Hai tuần này, các tuần trước giữ nguyên</span>`, false)}</div>`}
  </div>
  <div class="fg"><div class="fr col"><div class="fl"><span class="lbl">Ảnh của con</span><span class="fs">Ảnh được thu nhỏ và chỉ lưu trong dữ liệu của gia đình. Không có ảnh thì dùng hình đại diện bên dưới.</span></div>
    <div class="photo-pick"><span class="ava photo-prev" style="background:${k ? tintOf(k) : 'var(--t3)'}">${photoOf(k) ? `<img src="${photoOf(k)}" alt="">` : k ? avInner(avatarOf(k)) : icon('📷')}</span>
      <div class="col"><div class="row"><label class="btn quiet sm file-btn">Chọn ảnh<input type="file" id="kphoto" accept="image/*"></label><button class="btn quiet sm" data-act="photo-del" ${photoOf(k) ? '' : 'hidden'}>Bỏ ảnh</button></div>
      <div class="photo-adj" hidden><label class="small">Phóng to<input type="range" id="pzoom" min="1" max="4" step="0.05" value="2"></label><label class="small">Lên xuống<input type="range" id="py" min="0" max="1" step="0.01" value="0.4"></label><label class="small">Trái phải<input type="range" id="px" min="0" max="1" step="0.01" value="0.5"></label></div></div></div></div></div>
  <div class="fg"><div class="fr col"><div class="fl"><span class="lbl">Hình đại diện</span></div><div>${avatarGrid(k ? avatarOf(k) : '')}</div></div></div>
  ${formFoot(k ? 'kid-del' : '', id, 'kid-save')}`);
}
// ---------- form việc nhà: các nhóm thẻ, mỗi dòng một nhãn bên trái và giá trị bên phải ----------
const KIND_HELP = {
  must: 'Nằm trong lịch mỗi ngày của con',
  extra: 'Không bắt buộc, làm lúc nào được tiền lúc đó',
  fun: 'Không có tiền, mở khoá khi xong việc phải làm của buổi',
};
// wbs: câu mô tả cách thưởng của các con (bonusRules), ví dụ "ngày nào làm đủ việc thì thưởng 15.000đ".
const payHelp = (pay, wbs) => pay === 'week' ? `Không cộng tiền từng lần${wbs ? ', ' + wbs : ', làm đủ việc thì thưởng'}` : 'Làm lần nào cộng tiền lần đó, không tính vào thưởng làm đủ việc';
const DAY_SETS = [['0,1,2,3,4,5,6', 'Mỗi ngày'], ['1,2,3,4,5', 'Ngày thường'], ['0,6', 'Cuối tuần']];
const daySet = days => { const k = [...days].map(Number).sort().join(); return DAY_SETS.some(x => x[0] === k) ? k : 'custom'; };
// pre: những gì đã gõ và chọn ở ô thêm nhanh ({ name, slot, days, kids, money }), điền sẵn vào form thêm mới.
function choreForm(id, kindPre, pre) {
  const c = id ? S.chores[id] : null, kids = kidsList();
  const ck = c ? (c.kids || []) : pre?.kids || kids.map(k => k.id), days = c ? (c.days || []) : pre?.days || [0, 1, 2, 3, 4, 5, 6];
  const kind = c ? (isFun(c) ? 'fun' : isExtra(c) ? 'extra' : 'must') : ['extra', 'fun'].includes(kindPre) ? kindPre : 'must', fun = kind === 'fun', slot = c ? choreSlot(c) : pre?.slot || '', pw = c ? perWeekOf(c) : 0;
  // Việc mỗi ngày: bắt buộc (làm đủ thì thưởng) hoặc có tiền từng lần. Việc mới mặc định có tiền từng lần, trừ khi thêm từ nhóm việc bắt buộc.
  const pay = c ? (isWeekly(c) ? 'week' : 'each') : kindPre === 'week' || pre?.money === 0 ? 'week' : 'each';
  const wbs = bonusRules(kids);
  const adv = c && (pw || (c.variants || []).length || c.shared || c.claim || c.prep || c.imp || toMin(c.time) !== null || Number(c.minutes));
  const ico = c?.icon || (pre?.name && CHORE_ICONS.includes(guessIcon(pre.name)) ? guessIcon(pre.name) : CHORE_ICONS[0]);
  openModal(`<h2>${c ? 'Sửa việc' : 'Thêm việc'}</h2>
  <div class="fg f-title"><div class="ft"><input id="cname" class="input ft-input" maxlength="40" value="${esc(c?.name || pre?.name || '')}" placeholder="Tên việc" aria-label="Tên việc" autocomplete="off" data-wbs="${esc(wbs)}" ${c ? '' : 'data-new="1"'}>
      <button class="ico-btn" data-act="ico-toggle" aria-expanded="false" aria-label="Chọn biểu tượng"><span class="ico-now">${icon(ico)}</span></button></div>
    <div class="ico-pick" hidden>${pickGrid('cico', CHORE_ICONS.includes(ico) ? CHORE_ICONS : [ico, ...CHORE_ICONS], ico)}</div></div>
  <div class="fg">
    ${frow('Loại việc', pillSel('ckind', [['must', 'Mỗi ngày'], ['extra', 'Làm thêm'], ['fun', 'Thích làm']], kind), { id: 'ckind', sub: KIND_HELP[kind], subId: 'ckind-help' })}
    ${frow('Cách thưởng', pillSel('cpay', [['each', 'Tiền từng lần'], ['week', 'Bắt buộc mỗi ngày']], pay), { id: 'cpay', cls: 'cpay-f', hidden: kind !== 'must', sub: payHelp(pay, wbs), subId: 'cpay-help' })}
    ${frow('Tiền mỗi lần', `<div class="pillnum"><button data-act="num-step" data-t="cmoney" data-n="-5000" data-min="0" aria-label="Bớt 5.000đ">−</button><input id="cmoney" class="num" type="number" min="0" step="1000" inputmode="numeric" value="${c && choreVnd(c) ? choreVnd(c) : pre?.money || 5000}"><span>đ</span><button data-act="num-step" data-t="cmoney" data-n="5000" data-min="0" aria-label="Thêm 5.000đ">+</button></div>`, { id: 'cmoney', cls: 'cmoney-f', hidden: fun || (kind === 'must' && pay === 'week') })}
    ${frow('Buổi', pillSel('cslot', SLOTS.map(([v, label]) => [v, label]), slot, 's-' + (slot || 'any')), { id: 'cslot' })}
    <div class="fr col">${frow('Lặp lại', pillSel('cdays', [...DAY_SETS, ['custom', 'Chọn ngày']], daySet(days)), { id: 'cdays', cls: 'in' })}
      <div class="seg days7">${WEEK_ORDER.map(d => `<label><input type="checkbox" name="cday" value="${d}" ${days.includes(d) ? 'checked' : ''}><span>${WDS[d]}</span></label>`).join('')}</div></div>
    ${kidRow('Giao cho', 'ckid', 'checkbox', ck)}
  </div>
  <div class="fg"><div class="fr col"><div class="fl"><label for="csteps">Danh sách con</label><span class="fs">Mỗi dòng một mục. Con tick đủ các mục thì việc được tính là xong.</span></div>
    <textarea id="csteps" class="input f-area" rows="3" placeholder="Cặp sách đã soạn&#10;Quần áo ngày mai&#10;Bàn học đã gọn">${esc((c?.steps || []).join('\n'))}</textarea></div></div>
  <details class="fg f-adv" ${adv ? 'open' : ''}><summary class="fr"><div class="fl"><span class="lbl">Thêm tuỳ chọn</span><span class="fs">Giờ, số phút, số lần mỗi tuần, việc chung</span></div>${DOWN}</summary>
    ${frow('Giờ', `<input id="ctime" class="pillin num" type="time" value="${esc(c?.time || '')}">`, { id: 'ctime', sub: 'Có giờ thì việc tự xếp vào buổi theo giờ đó' })}
    <div class="fr">${toggle('cby', 'Phải xong trước giờ này <span class="fs">Ví dụ: tắm trước 19:00, quá giờ thì app báo</span>', c?.by)}</div>
    ${frow('Làm trong bao lâu', `<div class="pillnum"><input id="cmin" class="num" type="number" min="0" max="600" step="5" inputmode="numeric" value="${Number(c?.minutes) || ''}" placeholder="0"><span>phút</span></div>`, { id: 'cmin' })}
    ${frow('Số lần mỗi tuần', pillSel('cpw', [0, 1, 2, 3, 4, 5, 6].map(n => [n, n ? `${n} lần mỗi tuần` : 'Mọi ngày đã chọn']), pw), { id: 'cpw', sub: 'Ví dụ: chạy bộ 3 buổi, ngày nào cũng được' })}
    <div class="fr">${toggle('cimp', 'Việc quan trọng <span class="fs">Gắn nhãn Quan trọng ở màn Hôm nay và màn của con</span>', c?.imp)}</div>
    <div class="fr">${toggle('cprep', 'Chỉ khi hôm sau có học thêm <span class="fs">Chỉ hiện vào hôm trước ngày con có buổi học thêm: chuẩn bị sách vở, nộp bài tập</span>', c?.prep && c.prep !== 'school')}</div>
    <div class="fr">${toggle('cprepsch', 'Chỉ khi hôm sau đi học <span class="fs">Chỉ hiện vào hôm trước ngày con đi học, theo thời khoá biểu và ngày nghỉ</span>', c?.prep === 'school')}</div>
    <div class="fr">${toggle('cclaim', 'Ai làm trước thì tính <span class="fs">Một con làm thì con kia không phải làm nữa. Cùng làm thì tính cả hai, chia đều tiền</span>', c?.claim)}</div>
    <div class="fr">${toggle('cshared', 'Việc chung <span class="fs">Một con đánh dấu là tính cho cả nhà</span>', c?.shared && !c?.claim)}</div>
    <div class="fr col"><div class="fl"><label for="cvar">Đổi nội dung xen kẽ</label><span class="fs">Cách nhau bằng dấu phẩy. Mỗi lần làm đổi sang nội dung tiếp theo, app ghi “hôm nay: tiếng Anh”.</span></div>
      <input id="cvar" class="input f-area" maxlength="80" value="${esc((c?.variants || []).join(', '))}" placeholder="Ví dụ: tiếng Việt, tiếng Anh"></div>
  </details>
  <div class="foot">${c ? `<button class="btn danger left" data-act="chore-del" data-id="${id}">Xoá việc này</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="chore-save" data-id="${id || ''}">Lưu</button></div>`);
}
const PRICE_HELP = { merit: 'Con tự báo khi đạt được, bố mẹ duyệt thì mới cộng tiền', penalty: 'Trừ tiền khi con mắc lỗi', fee: 'Trừ tiền theo số giờ dùng điện thoại, tivi…', gift: 'Con dùng tiền trong tài khoản để đổi' }, PRICE_FEE = 'Tính cho mỗi giờ sử dụng';
function priceForm(id, kindPre) {
  const r = id ? S.rewards[id] : null, kind = r ? priceKind(r) : PRICE_KINDS.some(x => x[0] === kindPre) ? kindPre : 'penalty';
  const icons = [...new Set([...PRICE_ICONS[kind], ...Object.values(PRICE_ICONS).flat()])];
  openModal(`<h2>${r ? 'Sửa mục' : 'Thêm mục'}</h2>
  ${titleCard('pname', r?.name, 'Tên mục', { icoName: 'pico', icons, ico: r?.icon })}
  <div class="fg">
    ${frow('Loại', pillSel('pkind', PRICE_KINDS.map(([v, l]) => [v, l]), kind), { id: 'pkind', sub: PRICE_HELP[kind], subId: 'pkind-help' })}
    ${frow('Số tiền', pillNum('pprice', r ? priceVnd(r) : 10000, { step: 5000, attr: 'min="0" step="1000"' }), { id: 'pprice', sub: kind === 'fee' ? PRICE_FEE : '', subId: 'pprice-help' })}
    ${frow('Từ lần 2 trong tuần', pillNum('pagain', r ? againVnd(r) : 0, { step: 5000, attr: 'min="0" step="1000"' }), { id: 'pagain', cls: 'pall-f', hidden: kind !== 'penalty', sub: 'Mắc lại trong cùng tuần thì phạt mức này. Để 0 nếu lần nào cũng như nhau' })}
    <div class="fr pall-f" ${kind === 'penalty' ? '' : 'hidden'}>${toggle('pweek', 'Mất hết tiền được thưởng trong tuần <span class="fs">Tiền việc nhà và tiền thưởng từ Thứ Hai tới lúc phạt. Tiền để dành từ các tuần trước giữ nguyên</span>', r?.week && !r?.all)}</div>
    <div class="fr pall-f" ${kind === 'penalty' ? '' : 'hidden'}>${toggle('pall', 'Mất hết tiền trong tài khoản <span class="fs">Không tính theo số tiền ở trên</span>', r?.all)}</div>
    <div class="fr pgift-f" ${kind === 'gift' ? '' : 'hidden'}>${toggle('pskip', 'Phiếu nghỉ việc nhà <span class="fs">Đổi xong thì việc phải làm của ngày đó được miễn</span>', r?.skip)}</div>
    ${frow('Mô tả trên phiếu', `<input id="pnote" class="input" maxlength="70" value="${esc(r?.note || '')}" placeholder="Ví dụ: Con được chọn phim cả nhà xem tối nay">`, { id: 'pnote', cls: 'col pgift-f', hidden: kind !== 'gift' })}
  </div>
  ${formFoot(r ? 'price-del' : '', id, 'price-save')}`);
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
  const offer = tkbOffer(k) && tkbSig(draft) !== tkbSig(sampleTkb(tkbOffer(k)));
  openModal(`<h2>Thời khoá biểu của ${esc(k.name)}</h2>
  <div class="fg">
    ${frow('Lớp', `<input id="tcls" class="pillin txt" maxlength="20" value="${esc(draft.cls || '')}" placeholder="Lớp 4A">`, { id: 'tcls' })}
    ${frow('Năm học', `<input id="tyear" class="pillin txt" maxlength="20" value="${esc(draft.year || '')}" placeholder="2026 – 2027">`, { id: 'tyear' })}
    <div class="fr">${toggle('tsat', 'Học cả Thứ Bảy', days.includes(6))}</div>
    ${frow('Nghỉ trưa', pillSel('tlunch', [[0, 'Không nghỉ trưa'], ...Array.from({ length: Math.max(0, n - 1) }, (_, i) => [i + 1, `Sau tiết ${i + 1}`])], lunch <= 0 || lunch >= n ? 0 : lunch), { id: 'tlunch' })}
  </div>
  <div class="fg"><div class="fr col"><div class="fl"><span class="lbl">1. Giờ của các tiết</span></div>
    <table class="tkb-times"><thead><tr><th>Tiết</th><th>Bắt đầu</th><th>Kết thúc</th><th></th></tr></thead><tbody>
    ${draft.rows.map((r, i) => `<tr data-r="${i}"><td class="num"><b>${i + 1}</b></td>
      <td><input class="input num" type="time" data-f="s" value="${esc(r.s || '')}" aria-label="Tiết ${i + 1} bắt đầu"></td>
      <td><input class="input num" type="time" data-f="e" value="${esc(r.e || '')}" aria-label="Tiết ${i + 1} kết thúc"></td>
      <td><button class="iconbtn del" data-act="tkb-row-del" data-i="${i}" aria-label="Xoá tiết ${i + 1}" ${n <= 1 ? 'disabled' : ''}>×</button></td></tr>`).join('')}
    </tbody></table>
    <div class="row"><button class="btn quiet sm" data-act="tkb-row-add">+ Thêm tiết</button></div></div></div>
  ${offer ? suggest(`Có sẵn ${esc(sampleLabel(tkbOffer(k)))}`, `Giờ và môn của ${tkbOffer(k).times.length} tiết, Thứ Hai đến Thứ Sáu. Điền xong vẫn sửa được.`, 'Điền sẵn', 'tkb-sample') : ''}
  <div class="fg"><div class="fr col"><div class="fl"><span class="lbl">2. Môn học từng ngày</span><span class="fs">Nhập xong ${WDN(ed)} thì chọn ngày tiếp theo. Gõ vài chữ đầu để chọn môn có sẵn.</span></div>
    <div class="seg">${days.map(d => `<label><input type="radio" name="tday" value="${d}" ${d === ed ? 'checked' : ''}><span>${WDN(d)}${filled(d) ? ` <i class="cnt num">${filled(d)}</i>` : ''}</span></label>`).join('')}</div>
    <div class="subj-rows">${draft.rows.map((r, i) => `${i > 0 && i === lunch ? '<div class="subj-lunch">🍱 Nghỉ trưa</div>' : ''}
      <label class="subj-row"><span class="num"><b>Tiết ${i + 1}</b> ${esc(r.s || '')}</span><input class="input" list="subj-list" maxlength="24" data-r="${i}" data-d="${ed}" value="${esc((r.d || {})[ed] || '')}" placeholder="Không có tiết"></label>`).join('')}</div></div></div>
  <datalist id="subj-list">${subjects.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
  ${formFoot(saved ? 'tkb-del' : '', kidId, 'tkb-save', 'Lưu', 'Xoá thời khoá biểu')}`, false, !!draft.keep);
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
  const where = l?.home === true ? 'home' : l?.home === false ? 'out' : '';
  openModal(`<h2>${l ? 'Sửa buổi học thêm' : 'Thêm buổi học thêm'}</h2>
  ${titleCard('lname', l?.name, 'Học gì?', { attr: 'list="lesson-list"' })}
  <datalist id="lesson-list">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
  <div class="fg">
    ${kidRow('Con', 'lkid', 'radio', [kid])}
    <div class="fr col"><div class="fl"><span class="lbl">${l ? 'Ngày' : 'Những ngày'}</span>${l ? '' : '<span class="fs">Các ngày học cùng giờ. Mỗi ngày một giờ hoặc một người đưa đón khác nhau thì thêm từng ngày một.</span>'}</div>
      <div class="seg days7">${WEEK_ORDER.map(d => `<label><input type="${l ? 'radio' : 'checkbox'}" name="lday" value="${d}" ${d === day ? 'checked' : ''}><span>${WDS[d]}</span></label>`).join('')}</div></div>
    ${frow('Từ', `<input id="ls" class="pillin num" type="time" value="${esc(l?.s || '17:30')}">`, { id: 'ls' })}
    ${frow('Đến', `<input id="le" class="pillin num" type="time" value="${esc(l?.e || '19:30')}">`, { id: 'le' })}
  </div>
  <div class="fg">
    ${frow('Đi lại', pillSel('lwhere', [['', 'Chưa ghi'], ['home', 'Học tại nhà'], ['out', 'Phải đưa đón']], where), { id: 'lwhere', sub: 'Học tại nhà: học ngay ở nhà con đang ở hôm đó' })}
    ${frow('Học ở đâu', `<input id="lat" class="input" list="place-list" maxlength="30" value="${esc(placeName(l?.at))}" placeholder="Ví dụ: 6th Element, CLB bóng rổ">`, { id: 'lat', cls: 'col' })}
    <datalist id="place-list">${placeNames().map(n => `<option value="${esc(n)}">`).join('')}</datalist>
  </div>
  <div class="fg lgo" ${where === 'out' ? '' : 'hidden'}>${[['lgo', 'Ai đưa đi', l?.go], ['lback', 'Ai đón về', l?.back]].map(([fid, lbl, v]) => `<div class="fr col">${frow(lbl, `<input id="${fid}" class="pillin txt" list="who-list" maxlength="20" value="${esc(v || '')}" placeholder="Bố, Grab…">`, { id: fid, cls: 'in' })}
    <div class="row">${whoNames().map(w => `<button class="btn quiet sm" data-act="who-fill" data-t="${fid}" data-v="${esc(w)}">${esc(w)}</button>`).join('')}</div></div>`).join('')}
    <datalist id="who-list">${whoNames().map(w => `<option value="${esc(w)}">`).join('')}</datalist></div>
  ${formFoot(l ? 'lesson-del' : '', id, 'lesson-save')}`);
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
  if (data.paid) data.paid = Object.fromEntries(Object.entries(data.paid).filter(([id]) => id !== SETTINGS_ID).map(([id, p]) => { const [kid, w] = id.split('_'); return [m(kid) + '_' + w, { ...p, kid: m(p.kid) }]; }));
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
  <p class="muted small lead">Lịch của các con được lưu sẵn trong app dưới dạng mã hoá. Gõ mật khẩu gia đình để nạp vào máy này. Dữ liệu được gộp vào bảng hiện có, không xoá gì.</p>
  <div class="fg">
    ${frow('Mật khẩu', `<input id="seedpass" class="input" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false">`, { id: 'seedpass', cls: 'col' })}
    <div class="fr">${toggle('seedmem', 'Nhớ trên máy này <span class="fs">Tự nạp khi lịch có bản mới</span>', true)}</div>
  </div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="seed-load">Nạp lịch</button></div>`);
}

// Đánh dấu / bỏ dấu một việc. Việc chung thì tính cho mọi con được giao việc đó trong ngày.
// Việc ai làm trước thì tính: chỉ tính cho con vừa đánh dấu; có con khác cũng đã làm thì chia đều tiền cho những con đã làm.
// Xong việc phải làm cuối cùng của buổi thì báo mở khoá việc thích làm.
function markChore(d, kid, cid, on) {
  const ch = S.chores[cid]; if (!ch || isFun(ch)) return;
  memo = {};
  const who = ch.shared && !ch.claim ? (ch.kids || []).filter(x => S.kids[x] && choresFor(x, d).some(c => c.id === cid)) : [kid];
  if (!who.includes(kid)) who.push(kid);
  let msg = null;
  if (on) {
    const list = mustFor(kid, d), left = list.filter(c => c.id !== cid && !isDone(d, kid, c.id)).length;
    const g = dayPlan(kid, d).find(g => g.items.some(x => x.c?.id === cid));
    const funs = g ? g.items.filter(x => x.type === 'chore' && isFun(x.c) && x.locked).map(x => x.c.name) : [];
    const gLeft = g ? g.items.filter(x => x.type === 'chore' && list.some(c => c.id === x.c.id) && x.c.id !== cid && !isDone(d, kid, x.c.id)).length : 1;
    const mates = ch.claim ? claimers({ id: cid, ...ch }, d).filter(x => x !== kid) : [], gain = ch.claim ? doneVnd(claimVal(ch, mates.length + 1)) : choreVnd(ch);
    const earn = gain ? ` +${money(gain)}` : '';
    if (isExtra(ch)) msg = `${kidName(kid)} làm thêm “${ch.name}”${earn} 💪`;
    else if (!left && list.some(c => c.id === cid)) {
      confetti();
      const db = dayBonusAt(S.kids[kid], key(d));
      if (key(d) === key(today())) { const got = earned(kid, key(d), key(d)) + gain + db; setTimeout(() => celebrate(kid, got), 450); }
      else msg = `${kidName(kid)} làm xong hết việc phải làm rồi! 🎉${earn}${db ? ` Thưởng ngày đủ việc +${money(db)} ⭐` : ''}`;
    }
    else if (g?.id && !gLeft && funs.length) { confetti(); msg = `🎈 Mở khoá: ${funs.join(', ')}!`; }
    if (ch.shared && who.length > 1) msg = msg || `Đã tính cho ${who.map(kidName).join(', ')}.${earn}`;
    if (mates.length && !isExtra(ch)) msg = msg || `${kidName(kid)} làm cùng ${mates.map(kidName).join(', ')}.${gain ? ` Mỗi bạn +${money(gain)}` : ''}`;
    else if (mates.length) msg = `${kidName(kid)} làm cùng ${mates.map(kidName).join(', ')} “${ch.name}”.${gain ? ` Mỗi bạn +${money(gain)}` : ''} 💪`;
    msg = msg || (earn ? `${kidName(kid)}${earn} 💰` : null);
    if (!msg && list.some(c => c.id === cid) && isDaily(S.kids[kid])) {
      const db = dayBonusAt(S.kids[kid], key(d));
      if (db) msg = `${kidName(kid)}: còn ${left} việc nữa là đủ việc ${key(d) === key(today()) ? 'hôm nay' : 'ngày ' + dm(d)}, thưởng ${money(db)} ⭐`;
    } else if (!msg && list.some(c => c.id === cid) && S.kids[kid] && weekBonusOf(S.kids[kid])) {
      const st = weekStats({ id: kid, ...S.kids[kid] }, weekStart(d)), n = Math.min(st.possible, st.done + 1);
      msg = n >= st.possible ? `${kidName(kid)} đủ việc cả tuần rồi! Thưởng ${money(weekBonusAt(S.kids[kid], key(weekStart(d))))} 🏆` : `${kidName(kid)}: tuần này ${n}/${st.possible} việc, đủ tuần thưởng ${money(weekBonusOf(S.kids[kid]))} 🏆`;
    }
  }
  const steps = (ch.steps || []).filter(Boolean);
  // Việc ai làm trước thì tính: chia lại tiền cho những con đã làm (kể cả khi một con bỏ dấu).
  const doers = ch.claim ? [...claimers({ id: cid, ...ch }, d).filter(x => x !== kid), ...(on ? [kid] : [])] : [];
  for (const x of doers) if (x !== kid) setDone(key(d), x, cid, claimVal(ch, doers.length));
  for (const x of who) {
    setDone(key(d), x, cid, on ? (ch.claim ? claimVal(ch, doers.length) : doneVal(ch)) : 0);
    if (steps.length) setDone(key(d), x, cid + '~s', on ? (1 << steps.length) - 1 : 0);
  }
  if (msg) toast(msg);
}

// ---------- actions ----------
let toastT = 0;
// undo: hàm hoàn tác. Có thì thông báo kèm nút Hoàn tác và ở lại lâu hơn.
function toast(msg, undo) {
  const t = $('#toast'); t.textContent = msg; t.classList.toggle('has-act', !!undo);
  if (undo) { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Hoàn tác'; b.onclick = () => { t.hidden = true; undo(); }; t.appendChild(b); }
  t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), undo ? 7000 : 2800);
}
// Màn chúc mừng khi con làm xong hết việc phải làm hôm nay.
function celebrate(kidId, got) {
  const k = S.kids[kidId]; if (!k) return;
  memo = {};
  document.querySelector('.celebrate')?.remove();
  const n = streakOf(kidId), st = weekStats({ id: kidId, ...k }, weekStart(today())), wb = weekBonusOf(k), db = dayBonusAt(k, key(today()));
  const el = document.createElement('div'); el.className = 'celebrate'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'cel-h');
  el.innerHTML = `<div class="cel-burst" aria-hidden="true"></div><div class="cel-box">
    <div class="cel-ava">${ava({ ...k, id: kidId })}<span class="cel-sp s1">✨</span><span class="cel-sp s2">⭐</span><span class="cel-sp s3">✨</span></div>
    ${got ? `<div class="cel-coin"><span class="coin3d" aria-hidden="true"></span><b class="num">+${money(got)}</b></div>` : ''}
    <h2 id="cel-h">Giỏi quá! ${esc(k.name)} đã xong hết việc hôm nay 🎉</h2>
    <div class="cel-cards"><div class="cel-row"><span>🔥 Chuỗi ngày</span><b class="num">${n} ngày</b></div>
      ${isDaily(k) ? (db ? `<div class="cel-row"><span>⭐ Thưởng ngày đủ việc</span><b class="num">+${money(db)}</b></div>` : '')
        : wb && st.possible ? `<div class="cel-row"><span>🏆 ${st.done >= st.possible ? `Đủ cả tuần, thưởng ${money(wb)}` : `Đủ tuần thưởng ${money(wb)}`}</span><b class="num">${st.done}/${st.possible}</b></div>` : ''}</div>
    <button class="btn primary go" data-cel-close>Tuyệt vời!</button></div>`;
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
  if (!kidMay(a, b)) return;
  if (a === 'close') return closeModal();
  if (a === 'role-parent') return pinForm('unlock');
  if (a === 'pin-set') return pinForm('set');
  if (a === 'role-kid') return roleKidForm(b.dataset.kid, deviceRole() === 'parent');
  if (a === 'role-kid-ok') { if (!S.kids[b.dataset.kid]) return; setRole(b.dataset.kid); UI.km = { on: false, kid: null }; closeModal(); keepFamilyInUrl(); window.scrollTo(0, 0); return render(); }
  if (a === 'pin-ok') {
    const pin = ($('#pin')?.value || '').trim(), set = b.dataset.mode === 'set';
    if (!/^\d{4,8}$/.test(pin)) return toast('Mã PIN gồm 4 đến 8 chữ số.');
    if (set && deviceRole() !== 'parent') return;
    hashPin(pin).then(h => {
      if (set) { put('paid', SETTINGS_ID, { ...(S.paid[SETTINGS_ID] || {}), pin: h }); setRole('parent'); closeModal(); render(); return toast('Đã đặt mã PIN. Máy này là máy của bố mẹ.'); }
      if (h !== pinHash()) { const i = $('#pin'); if (i) { i.value = ''; i.focus(); } return toast('Mã PIN chưa đúng.'); }
      setRole('parent'); closeModal(); keepFamilyInUrl(); render(); toast('Máy này là máy của bố mẹ.');
    }).catch(() => toast('Máy này không kiểm tra được mã PIN.'));
    return;
  }
  if (a === 'pin-clear') {
    if (!armed(b, 'Bấm lần nữa để bỏ mã PIN')) return;
    const { pin, ...rest } = S.paid[SETTINGS_ID] || {};
    Object.keys(rest).length ? put('paid', SETTINGS_ID, rest) : del('paid', SETTINGS_ID);
    return toast('Đã bỏ mã PIN. Mọi máy lại thấy như bố mẹ.');
  }
  if (a === 'copy-kid-link') {
    const k = S.kids[b.dataset.kid], link = kidLink(b.dataset.kid); if (!k) return;
    const fallback = () => openModal(`<h2>Link cho máy của ${esc(k.name)}</h2><div class="fg"><input class="input" readonly value="${esc(link)}" onfocus="this.select()"></div><div class="foot"><button class="btn primary" data-act="close">Xong</button></div>`);
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => toast(`Đã sao chép link cho máy của ${k.name}.`), fallback); else fallback();
    return;
  }
  if (a === 'day-set') { UI.date = parse(b.dataset.d); return render(); }
  if (a === 'day') { const n = Number(b.dataset.n); UI.date = n === 0 ? today() : addDays(UI.date, n); return render(); }
  if (a === 'tick') {
    const d = b.dataset.km ? today() : UI.date, kid = b.dataset.kid; if (!S.chores[b.dataset.chore]) return;
    const on = isDone(d, kid, b.dataset.chore);
    const sl = b.closest('.slot[data-slot]'); if (sl) UI.slotOpen[sl.dataset.slot] = true;
    const st = b.classList.contains('stamp') ? b : b.querySelector('.stamp');
    if (!on && st) st.classList.add('on', 'pop');
    return markChore(d, kid, b.dataset.chore, !on);
  }
  if (a === 'step') {
    const d = b.dataset.km ? today() : UI.date, kid = b.dataset.kid, cid = b.dataset.chore, ch = S.chores[cid]; if (!ch) return;
    const steps = (ch.steps || []).filter(Boolean), all = (1 << steps.length) - 1;
    const sl = b.closest('.slot[data-slot]'); if (sl) UI.slotOpen[sl.dataset.slot] = true;
    let mask = isDone(d, kid, cid) ? all : stepMask(d, kid, cid);
    mask ^= 1 << Number(b.dataset.i);
    b.classList.toggle('on', !!((mask >> Number(b.dataset.i)) & 1));
    if (mask === all) return markChore(d, kid, cid, true);
    if (isDone(d, kid, cid)) setDone(key(d), kid, cid, 0);
    setDone(key(d), kid, cid + '~s', mask);
    return;
  }
  if (a === 'tkb-go' && !$('#km').hidden) { e.preventDefault(); UI.kmTab = 'learn'; if (b.dataset.tab) UI.learn = b.dataset.tab; UI.tkbDay = b.dataset.wd ? Number(b.dataset.wd) : null; $('#km').scrollTop = 0; return render(); }
  if (a === 'tkb-go') { UI.tkbKid = b.dataset.kid; if (b.dataset.tab) UI.learn = b.dataset.tab; UI.tkbDay = b.dataset.wd ? Number(b.dataset.wd) : null; return; } // link tự chuyển sang #lich-hoc
  if (a === 'grid-week') { const n = Number(b.dataset.n); UI.gridWs = n ? addDays(UI.gridWs || weekStart(today()), n) : null; return render(); }
  if (a === 'grid-tick') { const d = parse(b.dataset.d), cid = b.dataset.chore; if (!S.chores[cid] || d > today()) return; return markChore(d, b.dataset.kid, cid, !isDone(d, b.dataset.kid, cid)); }
  if (a === 'learn-tab') { UI.learn = b.dataset.v; UI.histAll = false; UI.tkbDay = null; return render(); }
  if (a === 'tkb-day') {
    UI.tkbDay = Number(b.dataset.d); render();
    // Bấm ở bản cả tuần thì cuộn lên thẻ của ngày vừa chọn.
    if (b.dataset.kid) requestAnimationFrame(() => document.querySelector(`[data-tkb="${b.dataset.kid}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    return;
  }
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
    const data = { kid, title, kind: $('#tkind').value || 'bt', subj: $('#tsubj').value.trim(), due: $('#tdue').value || '', notes: $('#tnotes').value.trim(), steps,
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
  if (a === 'tkb-form') return tkbForm(b.dataset.kid, b.dataset.sample ? sampleTkb(tkbOffer(S.kids[b.dataset.kid])) : undefined);
  if (a === 'tkb-sample') { const sp = tkbDraft && tkbOffer(S.kids[tkbDraft.kid]); if (!sp) return; tkbForm(tkbDraft.kid, { ...sampleTkb(sp), keep: true }); return toast(`Đã điền ${sampleLabel(sp)}. Xem lại rồi bấm Lưu.`); }
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
    const where = $('#lwhere').value, trip = {}, at = $('#lat').value.trim();
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
    const data = { name, icon: radioVal('eico') || '📌', kind: $('#ekind').value || 'event', from, kids: [...document.querySelectorAll('#modal input[name=ekid]:checked')].map(x => x.value) };
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
  if (a === 'km-open') { closeModal(); const ks = kidsList(); UI.km = { on: true, kid: ks.length === 1 ? ks[0].id : null }; UI.kmTab = 'today'; return render(); }
  if (a === 'km-kid') { UI.km.kid = b.dataset.kid || null; UI.kmTab = 'today'; return render(); }
  if (a === 'sheet-open') { UI.sheet = true; return render(); }
  if (a === 'print') return printSheet();
  if (a === 'kid-form') return kidForm(id);
  if (a === 'photo-del') { photoEdit = { img: null, out: '' }; const pv = $('#modal .photo-prev'); if (pv) pv.innerHTML = avInner(radioVal('kava')); b.hidden = true; $('#modal .photo-adj').hidden = true; return; }
  if (a === 'chore-form') return choreForm(id, b.dataset.kind);
  // Chọn con ở màn Hôm nay hay Tài khoản thì màn kia cũng theo con đó.
  if (a === 'today-kid' || a === 'acct-kid') { UI.todayKid = UI.acctKid = b.dataset.kid; UI.histAll = false; try { localStorage.setItem(TODAY_KID, UI.todayKid); } catch (err) {} return render(); }
  if (a === 'learn-kid') { UI.tkbKid = b.dataset.kid; return render(); }
  if (a === 'sec-toggle') { UI.secOpen[b.dataset.key] = b.getAttribute('aria-expanded') !== 'true'; return render(); }
  if (a === 'page-add') return pageAdd();
  if (a === 'acct-menu') return menuSheet('Tài khoản', [menuRow('data-act="bal-form"', '🏦', 'Khớp số dư', 'Gõ số tiền thật theo tài khoản ngân hàng'),
    `<a class="item nav" href="#bang-gia" data-act="close"><span class="ico">🎁</span><span class="txt"><span class="t">Sửa bảng giá</span><span class="s">Mục phạt, phí sử dụng, phiếu thưởng</span></span>${CHEV}</a>`]);
  if (a === 'acct-mode') { closeModal(); UI.acctKind = b.dataset.v; render(); return setTimeout(() => { const i = $('#aamt'); if (i) { i.scrollIntoView({ block: 'center' }); i.focus({ preventScroll: true }); } }, 80); }
  if (a === 'price-menu') return menuSheet('Bảng giá', [menuRow('data-act="prices-print"', '🖨️', 'In bảng giá', 'Một tờ để dán tủ lạnh'), menuRow('data-act="coupons-print"', '🎟️', 'In phiếu thưởng', 'Tờ phiếu cắt rời', !pricesList('gift').length)]);
  if (a === 'today-menu') return todayMenu();
  if (a === 'today-mode') { closeModal(); UI.todayMode = b.dataset.v === 'week' ? 'week' : 'day'; render(); return window.scrollTo(0, 0); }
  if (a === 'slot-toggle') { UI.slotOpen[b.dataset.slot] = b.getAttribute('aria-expanded') !== 'true'; return render(); }
  if (a === 'quick-add') return quickAdd(b.dataset.slot);
  if (a === 'qa-cycle') {
    const f = b.dataset.f, n = { slot: SLOTS.length, rep: qaReps().length, who: qaWho().length, pay: QA_PAY.length }[f]; if (!QA || !n) return;
    if (f === 'slot') QA.slot = SLOTS[(SLOTS.findIndex(x => x[0] === QA.slot) + 1) % n][0]; else QA[f] = (QA[f] + 1) % n;
    const had = document.activeElement === b;
    $('#qa-chips').innerHTML = qaChips(); if (had) $(`#qa-chips [data-f="${f}"]`)?.focus({ preventScroll: true }); return;
  }
  if (a === 'qa-more') { if (!QA) return; const q = qaData(); choreForm(null, '', q); modalDirty = !!q.name; return; }
  if (a === 'qa-save') {
    if (!QA) return;
    const q = qaData(); if (!q.name) { $('#qname').focus(); return toast('Gõ tên việc nhé.'); }
    const cid = uid(), sl = SLOTS.find(x => x[0] === q.slot);
    put('chores', cid, { name: q.name, icon: guessIcon(q.name), money: q.money, kids: q.kids, days: q.days, order: Object.keys(S.chores).length, kind: 'must', slot: q.slot, since: key(today()) });
    closeModal();
    return toast(`Đã thêm “${q.name}” vào ${sl[0] ? sl[1].toLowerCase() : 'mục lúc nào cũng được'}.`, () => { del('chores', cid); toast('Đã bỏ việc vừa thêm.'); });
  }
  if (a === 'price-form') return priceForm(id, b.dataset.kind);
  if (a === 'prices-print') { closeModal(); return printPrices(); }
  if (a === 'coupons-print') { closeModal(); return printCoupons(); }
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
  if (a === 'acct-go') { UI.acctKid = b.dataset.kid; UI.histAll = false; return; }
  if (a === 'hist-all') { UI.histAll = true; return render(); }
  if (a === 'ico-toggle') { const pk = $('#modal .ico-pick'), open = pk.hidden; pk.hidden = !open; b.setAttribute('aria-expanded', open); if (open) pk.querySelector('input:checked')?.focus({ preventScroll: true }); return; }
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
  if (a === 'weekly-convert') {
    const cand = weeklyCandidates(), wk = key(weekStart(today())); if (!cand.length) return;
    for (const { id: cid, ...c } of cand) put('chores', cid, { ...c, money: 0, weeklyFrom: wk });
    for (const k of kidsList()) if (!isDaily(k) && weekBonusOf(k) !== WEEK_BONUS) {
      const { id: kid, ...rest } = k, log = Array.isArray(k.wbLog) ? k.wbLog : [], same = log.find(e => e.from === wk);
      put('kids', kid, { ...rest, weekBonus: WEEK_BONUS, wbLog: [...log.filter(e => e.from !== wk), { from: wk, amount: WEEK_BONUS, prev: same ? same.prev : weekBonusOf(k) }].sort((x, y) => x.from.localeCompare(y.from)) });
    }
    return toast(`Đã chuyển ${cand.length} việc sang bắt buộc mỗi ngày.${kidsList().every(isDaily) ? '' : ` Làm đủ cả tuần thưởng ${money(WEEK_BONUS)}.`}`);
  }
  if (a === 'table-update') return tableUpdateForm();
  if (a === 'table-apply' || a === 'table-skip') {
    if (a === 'table-skip' && !armed(b, 'Bấm lần nữa để bỏ qua')) return;
    const bals = a === 'table-apply' ? [...document.querySelectorAll('#modal [data-tb]')].filter(i => i.value.trim() !== '' && Number.isFinite(Number(i.value))).map(i => ({ kid: i.dataset.tb, target: Math.round(Number(i.value)) })) : [];
    const n = tableUpdate()?.ops.length || 0, undo = tableUpdateRun(a === 'table-apply', bals);
    closeModal(); if (!undo) return;
    return toast(a === 'table-apply' ? `Đã cập nhật bảng giá: ${n} thay đổi${bals.length ? ', đã khớp số dư' : ''}.` : 'Đã bỏ qua bản này, bảng giá giữ nguyên.', () => { undo(); toast('Đã hoàn tác, bảng giá như trước.'); });
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
      tint: old ? (old.tint ?? 0) : Object.keys(S.kids).length % 6, order: old ? (old.order ?? 0) : Object.keys(S.kids).length,
      since: old?.since || key(today()),
    };
    const amt = sel => Math.max(0, Math.round(Number($(sel)?.value) || 0));
    if (!old) Object.assign(data, { dayBonus: amt('#kdb'), dayFrom: key(weekStart(today())), tableVer: TABLE_VER, tableFull: TABLE_VER });
    else if (isDaily(old)) {
      data.dayBonus = amt('#kdb');
      if (dayBonusOf(old) !== data.dayBonus) {
        const from = key(today()), log = Array.isArray(old.dbLog) ? old.dbLog : [], same = log.find(e => e.from === from);
        data.dbLog = [...log.filter(e => e.from !== from), { from, amount: data.dayBonus, prev: same ? same.prev : dayBonusOf(old) }].sort((x, y) => x.from.localeCompare(y.from));
      }
    } else {
      data.weekBonus = amt('#kwb');
      if (weekBonusOf(old) !== data.weekBonus) {
        const from = key(weekStart(today())), log = Array.isArray(old.wbLog) ? old.wbLog : [], same = log.find(e => e.from === from);
        data.wbLog = [...log.filter(e => e.from !== from), { from, amount: data.weekBonus, prev: same ? same.prev : weekBonusOf(old) }].sort((x, y) => x.from.localeCompare(y.from));
      }
      // Chuyển sang thưởng theo ngày: tính từ Thứ Hai tuần này, tuần này không còn thưởng đủ tuần.
      if ($('#kday')?.checked) Object.assign(data, { dayBonus: DAY_BONUS, dayFrom: key(weekStart(today())) });
    }
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
    const kind = ['fun', 'extra'].includes($('#ckind').value) ? $('#ckind').value : 'must';
    const data = { name, icon: radioVal('cico') || '✅', money: kind === 'fun' || (kind === 'must' && $('#cpay').value === 'week') ? 0 : Math.max(0, Math.round(Number($('#cmoney').value) || 0)), kids, days, order: old ? (old.order ?? 0) : Object.keys(S.chores).length,
      kind, slot: $('#cslot').value || '' };
    // Việc mới chỉ tính từ hôm nay. Việc đang có tiền chuyển sang bắt buộc thì tính từ tuần này.
    if (!old) data.since = key(today()); else if (old.since) data.since = old.since;
    if (kind === 'must' && !data.money) { if (old && !isWeekly(old)) data.weeklyFrom = key(weekStart(today())); else if (old?.weeklyFrom) data.weeklyFrom = old.weeklyFrom; }
    if (toMin(time) !== null) { data.time = time; if ($('#cby').checked) data.by = true; }
    const mins = Math.round(Number($('#cmin').value) || 0); if (mins > 0) data.minutes = mins;
    const pw = Number($('#cpw').value) || 0; if (pw) data.perWeek = Math.min(pw, days.length);
    const steps = $('#csteps').value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 12); if (steps.length) data.steps = steps;
    const variants = $('#cvar').value.split(',').map(x => x.trim()).filter(Boolean).slice(0, 7); if (variants.length > 1) data.variants = variants;
    if ($('#cclaim').checked) data.claim = true; else if ($('#cshared').checked) data.shared = true;
    if ($('#cprepsch').checked) data.prep = 'school'; else if ($('#cprep').checked) data.prep = true;
    if ($('#cimp').checked) data.imp = true;
    closeModal(); put('chores', id || uid(), data);
    return toast('Đã lưu việc.');
  }
  if (a === 'chore-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('chores', id); return toast('Đã xoá việc.'); }
  if (a === 'price-save') {
    const name = $('#pname').value.trim(); if (!name) { $('#pname').focus(); return toast('Nhập tên nhé.'); }
    const kind = PRICE_KINDS.some(x => x[0] === $('#pkind').value) ? $('#pkind').value : 'penalty';
    const data = { name, icon: radioVal('pico') || '•', kind, price: Math.max(0, Math.round(Number($('#pprice').value) || 0)) };
    if (kind === 'penalty' && $('#pall').checked) data.all = true;
    else if (kind === 'penalty' && $('#pweek').checked) data.week = true;
    else if (kind === 'penalty') { const ag = Math.max(0, Math.round(Number($('#pagain').value) || 0)); if (ag) data.again = ag; }
    if (kind === 'gift') { const nt = $('#pnote').value.trim(); if (nt) data.note = nt; if ($('#pskip').checked) data.skip = true; }
    if (!data.price && !data.all && !data.week && kind !== 'gift') { $('#pprice').focus(); return toast('Nhập số tiền nhé.'); }
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
      } else if (k === 'penalty' && r.week) {
        const g = weekGain(kid);
        if (g <= 0) return toast(`Tuần này ${who} chưa được thưởng đồng nào, không có gì để trừ.`);
        if (!armed(b, `Bấm lần nữa: ${who} mất ${money(g)}`)) return;
        e = { amount: -g, kind: 'penalty', note: r.name + ' (mất tiền thưởng của tuần)', wipe: key(weekStart(today())) };
      } else if (k === 'penalty' && againVnd(r)) { const n = penaltyTimes(id, kid); e = { amount: -(n ? againVnd(r) : p), kind: 'penalty', note: `${r.name} (lần ${n + 1} trong tuần)`, rid: id }; }
      else if (k === 'penalty') e = { amount: -p, kind: 'penalty', note: r.name };
      else if (k === 'merit') e = { amount: p, kind: 'bonus', note: r.name };
      else if (k === 'fee') {
        const hrs = Math.max(0.25, Math.round((Number($('#ahours')?.value) || 1) * 100) / 100);
        e = { amount: -Math.round(p * hrs), kind: 'fee', note: `${r.name} ${String(hrs).replace('.', ',')} giờ`, qty: hrs };
      } else {
        if (bal < p) return toast(`${who} còn thiếu ${money(p - bal)} để đổi “${r.name}”.`);
        e = { amount: p ? -p : 0, kind: 'reward', note: r.name };
        if (r.skip) {
          if (!b.dataset.go) return skipForm(id, kid);
          const sd = $('#askip')?.value || key(today()), d = parse(sd);
          if (skipOn(kid, d)) return toast(`${who} đã dùng phiếu nghỉ cho ${WDN(d.getDay())} ${dm(d)} rồi.`);
          e.skip = sd; e.note = `${r.name} (${WDN(d.getDay())} ${dm(d)})`;
          closeModal();
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
    const lid = uid();
    put('ledger', lid, { kid, ...e, at });
    if (e.amount > 0) confetti();
    if (a === 'acct-custom') { $('#aamt').value = ''; $('#anote').value = ''; }
    return toast(e.amount ? `${e.amount > 0 ? 'Đã cộng' : 'Đã trừ'} ${money(Math.abs(e.amount))} ${e.amount > 0 ? 'vào' : 'của'} ${who} (${e.note}). Còn ${money(bal + e.amount)}.` : `Đã đổi “${e.note}” cho ${who}, miễn phí.`,
      () => { del('ledger', lid); toast(`Đã hoàn tác. ${who} vẫn còn ${money(bal)}.`); });
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
  if (a === 'km-acct') { UI.kmTab = 'acct'; UI.histAll = false; UI.secOpen['acct-hist'] = true; $('#km').scrollTop = 0; return render(); }
  if (a === 'merit-open') return meritSheet(b.dataset.kid);
  if (a === 'merit-pick') return meritForm(b.dataset.kid, id);
  if (a === 'merit-ask') {
    const kid = b.dataset.kid, r = meritList().find(x => x.id === id); if (!r || !S.kids[kid]) return;
    const extra = ($('#mnote')?.value || '').trim(), vnd = priceVnd(r);
    closeModal();
    put('ledger', uid(), { kid, amount: 0, ask: vnd, kind: 'bonus', note: r.name + (extra ? ` (${extra})` : ''), icon: r.icon || '🏅', at: new Date().toISOString(), pending: true });
    return toast(`Đã gửi “${r.name}”. Bố mẹ duyệt thì con được +${money(vnd)}.`);
  }
  if (a === 'merit-cancel') { const l = S.ledger[id]; if (!l?.pending || !armed(b, 'Chắc chưa?')) return; del('ledger', id); return toast('Đã huỷ mục này.'); }
  if (a === 'merit-ok' || a === 'merit-no') {
    const l = S.ledger[id]; if (!l?.pending) return;
    const who = kidName(l.kid), vnd = Math.max(0, Math.round(Number(l.ask) || 0)), back = () => { put('ledger', id, l); toast('Đã hoàn tác, mục này lại chờ duyệt.'); };
    if (a === 'merit-no') { del('ledger', id); return toast(`Không duyệt “${l.note}” của ${who}.`, back); }
    const { pending, ask, ...rest } = l, bal = balance(l.kid);
    put('ledger', id, { ...rest, amount: vnd, okAt: new Date().toISOString() });
    confetti();
    return toast(`Đã duyệt: cộng ${money(vnd)} cho ${who} (${l.note}). Còn ${money(bal + vnd)}.`, back);
  }
  if (a === 'ledger-undo') { if (!armed(b, 'Chắc chưa?')) return; del('ledger', id); return toast('Đã huỷ mục này.'); }
});
document.addEventListener('change', e => {
  if (e.target.name === 'akind') { UI.acctKind = e.target.value; render(); }
  if (e.target.name === 'planw') { UI.planNext = e.target.value === '1'; drawSheet(); }
  if (e.target.id === 'day-pick' && e.target.value) { UI.date = parse(e.target.value); render(); }
  if (e.target.id === 'ag-pick' && e.target.value) { UI.agDate = parse(e.target.value); render(); }
  if (e.target.name === 'kmtab') { UI.kmTab = e.target.value; UI.histAll = false; $('#km').scrollTop = 0; render(); }
  if (e.target.name === 'tview') { UI.taskDone = e.target.value === '1'; UI.histAll = false; render(); }
  if (e.target.id === 'ckind' || e.target.id === 'cpay') {
    const kind = $('#ckind').value, pay = $('#cpay').value, f = $('#modal .cmoney-f'), pf = $('#modal .cpay-f');
    pf.hidden = kind !== 'must';
    f.hidden = kind === 'fun' || (kind === 'must' && pay === 'week');
    $('#ckind-help').textContent = KIND_HELP[kind] || '';
    $('#cpay-help').textContent = payHelp(pay, $('#cname').dataset.wbs);
  }
  if (e.target.id === 'cslot') e.target.className = 'pillsel s-' + (e.target.value || 'any');
  // Lặp lại: chọn sẵn một nhóm ngày, hoặc bấm từng thứ bên dưới.
  if (e.target.id === 'cdays' && e.target.value !== 'custom') { const v = e.target.value.split(','); document.querySelectorAll('#modal input[name=cday]').forEach(x => (x.checked = v.includes(x.value))); }
  if (e.target.name === 'cday') $('#cdays').value = daySet([...document.querySelectorAll('#modal input[name=cday]:checked')].map(x => x.value));
  if (e.target.closest('.ico-pick')) { const n = $('#modal .ft-input'); delete n.dataset.new; $('#modal .ico-now').innerHTML = icon(e.target.value); $('#modal .ico-pick').hidden = true; $('#modal .ico-btn').setAttribute('aria-expanded', 'false'); }
  if (e.target.id === 'pkind') { const v = e.target.value; document.querySelectorAll('#modal .pall-f').forEach(x => (x.hidden = v !== 'penalty')); document.querySelectorAll('#modal .pgift-f').forEach(x => (x.hidden = v !== 'gift')); $('#pkind-help').textContent = PRICE_HELP[v] || ''; $('#pprice-help').textContent = v === 'fee' ? PRICE_FEE : ''; }
  // Mốc mới: đổi loại thì biểu tượng đổi theo, cho tới khi bố mẹ tự chọn một hình.
  if (e.target.id === 'ekind') {
    $('#ekind-help').textContent = EVENT_HELP[e.target.value] || '';
    const ic = EVENT_KINDS.find(x => x[0] === e.target.value)?.[2], r = $('#ename').dataset.new && [...document.querySelectorAll('#modal input[name=eico]')].find(x => x.value === ic);
    if (r) { r.checked = true; $('#modal .ico-now').innerHTML = icon(ic); }
  }
  if (e.target.id === 'lwhere') { const g = $('#modal .lgo'); if (g) g.hidden = e.target.value !== 'out'; }
  if ((e.target.id === 'tsat' || e.target.id === 'tlunch' || e.target.name === 'tday') && tkbDraft && !$('#modal').hidden) tkbForm(tkbDraft.kid, { ...readTkbForm(), keep: true });
  if (e.target.id === 'import-file' && e.target.files[0]) importBackup(e.target.files[0]);
  if (e.target.id === 'kphoto' && e.target.files[0]) photoLoad(e.target.files[0]);
  if (e.target.name === 'kava' && !photoEdit.img && !(photoEdit.out ?? photoOf(S.kids[$('#modal [data-act=kid-save]')?.dataset.id]))) { const pv = $('#modal .photo-prev'); if (pv) pv.innerHTML = avInner(e.target.value); }
});
document.addEventListener('input', e => {
  if (['pzoom', 'px', 'py'].includes(e.target.id)) photoRender();
  // Việc mới: biểu tượng tự đổi theo tên đang gõ, cho tới khi bố mẹ tự chọn một hình.
  if (e.target.id === 'cname' && e.target.dataset.new) {
    const g = guessIcon(e.target.value), r = g !== '✅' && [...document.querySelectorAll('#modal input[name=cico]')].find(x => x.value === g);
    if (r && !r.checked) { r.checked = true; $('#modal .ico-now').innerHTML = icon(g); }
  }
});
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') dismissModal(); else if (e.target.closest('button:not([data-act=close])')) modalDirty = true; });
$('#modal').addEventListener('input', () => { modalDirty = true; });
$('#modal').addEventListener('change', () => { modalDirty = true; });
// Ô thêm nhanh: Enter là thêm. Bấm các lựa chọn thì con trỏ vẫn ở ô gõ, bàn phím không bị đóng.
document.addEventListener('mousedown', e => { if (e.target.closest('.qa-chip, .qa-go') && document.activeElement?.id === 'qname') e.preventDefault(); });
// Bấm vào ngày tháng ở đầu màn Hôm nay thì mở ô chọn ngày của máy.
document.addEventListener('click', e => { if (e.target.matches?.('.day-pick input')) { try { e.target.showPicker(); } catch (err) {} } });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'qname') { e.preventDefault(); $('#modal [data-act="qa-save"]')?.click(); } });
// Dải tuần ở màn Hôm nay: vuốt ngang để sang tuần trước / tuần sau.
let swipe = null;
document.addEventListener('touchstart', e => { const w = e.target.closest('[data-swipe]'), p = e.touches[0]; swipe = w && e.touches.length === 1 ? { x: p.clientX, y: p.clientY, ag: w.dataset.swipe === 'ag' } : null; }, { passive: true });
document.addEventListener('touchend', e => {
  if (!swipe) return;
  const p = e.changedTouches[0], dx = p.clientX - swipe.x, dy = p.clientY - swipe.y, ag = swipe.ag; swipe = null;
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) { const n = dx < 0 ? 7 : -7; if (ag) UI.agDate = addDays(UI.agDate || today(), n); else UI.date = addDays(UI.date, n); render(); }
}, { passive: true });
// Bàn phím điện thoại che mất sheet nằm sát đáy: đẩy ô thêm nhanh lên trên bàn phím.
if (window.visualViewport) {
  const vv = window.visualViewport, kb = () => document.documentElement.style.setProperty('--kb', Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) + 'px');
  vv.addEventListener('resize', kb); vv.addEventListener('scroll', kb);
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#modal').hidden) dismissModal();
  if (e.key === 'Enter' && e.target.id === 'seedpass') $('#modal [data-act="seed-load"]')?.click();
  if (e.key === 'Enter' && e.target.id === 'pin') $('#modal [data-act="pin-ok"]')?.click();
});

// Giữ nút để thoát chế độ cho bé
let holdT = 0;
document.addEventListener('pointerdown', e => {
  const h = e.target.closest('[data-hold]'); if (!h || deviceRole() !== 'parent') return;
  h.classList.add('holding');
  holdT = setTimeout(() => { UI.km = { on: false, kid: null }; render(); }, 1200);
});
const cancelHold = () => { clearTimeout(holdT); document.querySelectorAll('.hold.holding').forEach(x => x.classList.remove('holding')); };
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => document.addEventListener(t, cancelHold, true));

// Điều hướng bằng #hash
const viewOf = h => { h = NAV_ALIAS[h] || h; return NAV.some(n => n.id === h) ? h : 'hom-nay'; };
function route() { UI.view = viewOf(location.hash.slice(1)); if (UI.view !== 'lich-hoc') UI.tkbDay = null; render(); window.scrollTo(0, 0); }
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

// ---------- family setup (Firebase) ----------
function newFamilyCode() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const r = crypto.getRandomValues(new Uint8Array(20));
  const s = [...r].map(x => abc[x % abc.length]).join('');
  return s.match(/.{5}/g).join('-');
}
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
  if (b.dataset.setup === 'new') { family = newFamilyCode(); }
  else {
    const inv = parseInvite($('#famcode').value);
    if (inv.code.length < 20) return toast('Mã gia đình chưa đúng. Hãy dán cả link mời hoặc mã 23 ký tự.');
    family = inv.code; con = inv.con;
  }
  setFamily(family);
  // Dán link riêng của một con: máy chưa chọn là của ai thì thành máy của con đó, như khi mở thẳng link.
  if (con && !getRole()) setRole(con);
  $('#setup').hidden = true; $('#shell').hidden = false; $('#tabs').hidden = false;
  startFirebase();
});

// iPhone/iPad: app trên màn hình chính có bộ nhớ riêng, tách khỏi Safari, nên phải mang mã gia đình (và mã của con,
// nếu là máy của con) theo địa chỉ mở app. Giữ ?gd=...&con=... trên thanh địa chỉ; iOS không được nạp manifest
// (xem phần boot) nên "Thêm vào MH chính" lưu đúng địa chỉ đang hiện và biểu tượng mở thẳng vào gia đình, đúng phần của con.
function keepFamilyInUrl() {
  if (!family) return;
  const r = getRole(), url = location.origin + location.pathname + '?gd=' + encodeURIComponent(family) + (r && r !== 'parent' ? '&con=' + encodeURIComponent(r) : '');
  if (location.origin + location.pathname + location.search !== url) history.replaceState(null, '', url + location.hash);
}

async function startFirebase() {
  keepFamilyInUrl();
  render();
  try {
    store = await firebaseStore(firebaseConfig, family, (data, meta) => {
      S = data; loaded = true; stale = !!meta.fromCache; render(); autoSeed(); autoFill(); autoAdds();
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
// Manifest chỉ nạp ngoài iOS. Trên iPhone/iPad, Safari đọc manifest ngay lúc mở trang và dùng start_url cố định trong đó ("./")
// khi Thêm vào MH chính, làm rơi mất ?gd=...&con=...; không có manifest thì iOS lưu đúng địa chỉ đang hiện.
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (!IOS) document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'manifest', href: 'manifest.webmanifest' }));
autoIcons(); // emoji có hình trong js/icons.js được thay bằng hình vẽ 3D ở mọi chỗ app vẽ ra
UI.view = viewOf(location.hash.slice(1));
if (firebaseConfig) {
  const q = new URLSearchParams(location.search).get('gd');
  if (q && cleanCode(q).length >= 20) setFamily(cleanCode(q));
  family = getFamily();
  // Bản trước dán link riêng của con (...&con=...) vào màn mở đầu thì mã của con dính luôn vào mã gia đình, thành một gia đình trống: tách lại.
  const glued = /^([a-z0-9]{5}(?:-[a-z0-9]{5}){3})con([a-z0-9-]{1,40})$/.exec(family || '');
  if (glued) { setFamily(family = glued[1]); if (!getRole()) setRole(glued[2]); }
  // Link riêng của một con (?gd=...&con=...): máy chưa chọn là của ai thì thành máy của con đó. Máy đã chọn rồi thì giữ nguyên.
  const con = new URLSearchParams(location.search).get('con');
  if (family && con && /^[\w-]{1,40}$/.test(con) && !getRole()) setRole(con);
  if (family) startFirebase(); else showSetup();
} else {
  store = localStore((data) => { S = data; loaded = true; render(); autoFill(); autoAdds(); });
  store.start();
  autoSeed();
}
