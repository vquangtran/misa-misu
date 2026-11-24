// Màn Quy định: nơi duy nhất thêm, sửa, xoá việc nhà (bốn loại) và mục giá (thành tích, phạt, phí sử dụng, phiếu thưởng); bảng mẫu.
import { icon } from './icons.js';
import { DAILY, daysLabel, DOWN, esc, key, money, norm, printHtml, slug, toast, today, toMin, uid, WDS, WEEK_ORDER, weekStart } from './chung.js';
import { TABLE_BAL_DATE, TABLE_BALANCES } from './nha-minh.js';
import { againVnd, balance, bonusRules, choresList, choreSlot, choreVnd, clearMemo, DAY_BONUS, dayBonusOf, del, FEE_UNIT, isDaily, isExtra, isFun,
  isMust, isWeekly, kidName, kidsList, perWeekOf, placeLow, placeName, placeNames, priceKind, pricesList, priceVnd, put, S, SLOTS, stepText,
  WEEK_BONUS, weekBonusOf } from './du-lieu.js';
import { addBtn, blankAdd, editBtn, moreBtn, pillBar, plusBtn, secHead, secIsOpen, suggest } from './giao-dien.js';
import { DAY_SETS, daySet, formFoot, frow, kidRow, openModal, pickGrid, pillNum, pillSel, titleCard, toggle } from './form.js';

// ---------- biểu tượng, loại mục giá ----------
const CHORE_ICONS = ['🛏️', '🪥', '🧸', '🍽️', '🪴', '📚', '🎒', '👕', '🧹', '🧽', '🗑️', '📦', '🛋️', '🧦', '👟', '🧺', '🛁', '🥢', '🐶', '🐟', '🍚', '✏️', '🎹', '🏃', '🪢', '🏫', '🎧', '🪑', '🤝', '🌙', '🎬', '🎮', '📺', '🧩', '🗣️', '💧'];
const PRICE_ICONS = {
  gift: ['🎁', '🎟️', '🍿', '🌙', '🧹', '🥞', '👫', '🍰', '🎬', '🎮', '🍦', '🧋', '🍕', '🧁', '📖', '🎡', '🛝', '🚲', '🏊'],
  penalty: ['😤', '🐢', '🤐', '🙉', '📢', '⚠️', '🙅', '🥊', '📵'],
  fee: ['📱', '📺', '🎮', '💻', '🎧'],
  merit: ['👏', '⭐', '💯', '🥈', '🏆', '🏅', '🥇', '🎖️', '📝', '📖', '🎤', '🎨', '⚽'],
};
// Các loại mục giá trong trang Quy định (nhóm "rewards"): thành tích học tập, ở trường và ở lớp học thêm (con tự báo, bố mẹ duyệt), phạt, phí sử dụng theo giờ, phiếu thưởng.
export const PRICE_KINDS = [['merit', 'Thành tích', '🏅'], ['penalty', 'Phạt', '⚠️'], ['fee', 'Phí sử dụng', '📱'], ['gift', 'Phiếu thưởng', '🎁']];

// ---------- bảng mẫu ----------
// Bảng thưởng phạt mẫu, dùng cho gia đình mới hoặc thêm vào bảng đang có. Bản 2 (11/2026) theo bảng gia đình đã chốt.
// kind 'must': việc phải làm mỗi ngày. kind 'extra': việc làm thêm, làm thì được tiền, không bắt buộc.
// Việc mỗi ngày (kind 'must') có money = 0 là việc BẮT BUỘC: không cộng tiền từng lần, ngày nào làm đủ hết thì ngày đó được thưởng.
// Việc được thưởng (việc mỗi ngày có money > 0): làm lần nào cộng tiền lần đó, không tính vào thưởng làm đủ việc.
// Việc thích làm mặc định của mỗi con.
export const FUN_DEFAULT = 'Chơi game hoặc dùng iPad/điện thoại 15 phút';
// Việc được thưởng uống đủ nước mỗi ngày (cả ngày, không theo buổi), 5.000đ mỗi ngày. Nhà đang dùng được thêm một lần
// (cờ water; cờ water5k đổi việc đã thêm từ việc phải làm sang việc được thưởng, xem autoAdds trong mot-lan.js).
export const WATER_CHORE = { name: 'Uống đủ 1200ml nước lọc', also: ['Uống đủ nước', 'Uống nước', 'Uống đủ 1200ml nước'], icon: '💧', money: 5000,
  steps: ['Hết chai thứ nhất (600ml)', 'Hết chai thứ hai (600ml)'] };
export const SAMPLE_CHORES = [
  // claim: việc ai làm trước thì tính, hai con cùng làm thì chia đôi tiền.
  // also: tên cũ của cùng việc, nhà nào đã có thì không thêm lại; bấm "Cập nhật theo bảng mẫu" thì được đổi sang tên mới.
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
  // unlock: đọc sách xong thì việc thích làm mới mở khoá.
  // readLog: bấm xong thì con ghi đã đọc gì, bao nhiêu trang.
  { name: 'Đọc sách 30 phút', also: ['Đọc sách'], icon: '📚', money: 10000, days: DAILY, minutes: 30, unlock: true, readLog: true },
  // Hai mục con: mỗi chai con mang đi học 600ml, uống hết hai chai là đủ.
  { ...WATER_CHORE, steps: WATER_CHORE.steps.slice(), days: DAILY },
  { name: 'Checklist trước khi đi ngủ', also: ['Chuẩn bị trước khi ngủ'], icon: '🌙', money: 5000, days: DAILY, slot: 'toi',
    steps: ['Cặp sách đã chuẩn bị', 'Quần áo ngày mai đã chuẩn bị', 'Bàn học đã gọn', 'Sách đã cất đúng chỗ', 'Đã đánh răng, rửa mặt', 'Đã tráng bình nước (mai đi học)'] },
  // Việc nhà cần làm mỗi ngày: nằm trong lịch từng buổi, làm thì được tiền, không tính vào thưởng làm đủ việc.
  { name: 'Thu quần áo', icon: '👕', money: 5000, days: DAILY, slot: 'chieu', claim: true },
  { name: 'Sắp xếp giày dép', icon: '👟', money: 3000, days: DAILY, slot: 'chieu' },
  { name: 'Xếp bát vào máy', also: ['Rửa bát'], icon: '🍽️', money: 10000, days: DAILY, slot: 'toi', claim: true },
  { name: 'Lau bàn', icon: '🧽', money: 2000, days: DAILY, slot: 'toi', claim: true },
  { name: 'Đổ rác', icon: '🗑️', money: 3000, days: DAILY, slot: 'toi', claim: true },
  { name: 'Phơi quần áo', icon: '🧺', money: 7000, days: DAILY, slot: 'toi', claim: true },
  { name: 'Dọn sofa, dọn bàn', also: ['Dọn sofa'], icon: '🛋️', money: 5000, days: DAILY, slot: 'toi', claim: true },
  { name: 'Hút bụi', also: ['Quét nhà'], icon: '🧹', money: 10000, kind: 'extra', claim: true, place: '6th Element' },
  { name: 'Lau nhà', icon: '🧽', money: 10000, kind: 'extra', claim: true },
  { name: 'Nhận bưu kiện', icon: '📦', money: 3000, kind: 'extra', claim: true },
  { name: 'Chủ động giúp bố mẹ', icon: '🤝', money: 5000, kind: 'extra' },
  { name: FUN_DEFAULT, also: ['Xem phim hoặc chơi Lego'], icon: '🎮', money: 0, kind: 'fun', days: DAILY, slot: 'toi', minutes: 15 },
].map(c => ({ days: DAILY, kind: 'must', slot: '', ...c }));
// Việc có trong bảng mẫu cũ, bản 2 đã bỏ. Bấm "Cập nhật theo bảng mẫu" thì xoá khỏi bảng (tiền các ngày đã làm giữ nguyên).
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
  { name: 'Xem TV', also: ['Tivi'], icon: '📺', kind: 'fee', price: 25000 },
  { name: 'Chơi game', icon: '🎮', kind: 'fee', price: 25000 },
  // Phiếu thưởng: con dùng tiền trong tài khoản để đổi (giá 0 là miễn phí). skip: miễn việc phải làm của một ngày.
  { name: 'Mời bạn đến chơi', icon: '👫', kind: 'gift', price: 0, note: 'Mời một bạn đến nhà chơi' },
  { name: 'Chọn món ăn sáng', icon: '🥞', kind: 'gift', price: 5000, note: 'Con chọn món ăn sáng mình thích nhất' },
  { name: 'Chọn phim tối nay', icon: '🍿', kind: 'gift', price: 10000, note: 'Con được chọn phim cả nhà xem tối nay' },
  { name: 'Món tráng miệng', icon: '🍰', kind: 'gift', price: 10000, note: 'Một món tráng miệng con thích sau bữa tối' },
  { name: 'Thức khuya thêm 30 phút', icon: '🌙', kind: 'gift', price: 20000, note: 'Đi ngủ muộn hơn 30 phút, một tối' },
  { name: 'Một ngày không làm việc nhà', icon: '🧹', kind: 'gift', price: 20000, skip: true, note: 'Nghỉ hết việc phải làm trong một ngày, không làm đứt chuỗi ngày' },
];
// Thành tích học tập (ở trường và ở lớp học thêm tính như nhau): con tự báo khi có (nút + ở màn của con), nằm chờ tới khi bố mẹ duyệt mới cộng tiền.
// Nhà nào cũng có sẵn 5 mục này (xem autoAdds trong mot-lan.js), sửa hay thêm bớt ở trang Quy định.
export const SAMPLE_MERITS = [
  { name: 'Được cô khen', icon: '👏', price: 5000 },
  { name: 'Được 9', icon: '⭐', price: 10000 },
  { name: 'Được 10', icon: '💯', price: 20000 },
  { name: 'Thi được 9', icon: '🥈', price: 25000 },
  { name: 'Thi được 10', icon: '🏆', price: 50000 },
];
// Bản của bảng mẫu. Con chưa ghi bản này (k.tableVer) thì trang Quy định gợi ý cập nhật một lần.
// k.tableFull: nhà này đã được thêm đủ việc và mục giá của bản đó (xem autoFill trong mot-lan.js).
export const TABLE_VER = 2;

// ---------- mục thành tích, tóm tắt một việc, nhãn giá ----------
// Các mục thành tích con được báo. Nhà chưa từng được thêm sẵn (máy bố mẹ chưa mở bản này) thì dùng tạm bảng mẫu.
const meritSeeded = () => !!S.paid?.caidat?.merit;
export const meritList = () => { const l = pricesList('merit'); return l.length || meritSeeded() ? l : SAMPLE_MERITS.map((m, i) => ({ id: 'merit-' + (i + 1), kind: 'merit', ...m })); };
// Tóm tắt một việc ở trang Quy định: giao cho ai, ngày nào, buổi hoặc giờ, các tuỳ chọn. Số tiền ghi riêng ở đầu dòng.
function choreSummary(c) {
  const sl = SLOTS.find(x => x[0] === choreSlot(c));
  return [(c.kids || []).map(kidName).map(esc).join(', ') || 'chưa giao cho ai',
    perWeekOf(c) ? `${perWeekOf(c)} lần/tuần (${daysLabel(c.days)})` : daysLabel(c.days),
    choreSlot(c) ? `${toMin(c.time) !== null ? (c.by ? 'trước ' : '') + esc(c.time) : sl[1].replace('Buổi ', '').toLowerCase()}` : '',
    Number(c.minutes) ? `${Number(c.minutes)} phút` : '', (c.steps || []).length ? `${c.steps.length} mục con` : '',
    (c.variants || []).length ? `xen kẽ: ${c.variants.map(esc).join(' / ')}` : '', c.shared ? 'việc chung' : '', c.claim ? 'ai làm trước thì tính' : '', c.prep === 'school' ? 'chỉ khi hôm sau đi học' : c.prep ? 'tối trước buổi học thêm' : '',
    c.imp ? '<span class="late">quan trọng</span>' : '', c.unlock && !isFun(c) ? 'xong mới mở khoá việc thích làm' : '', c.readLog && !isFun(c) ? 'ghi đã đọc gì, bao nhiêu trang' : '', c.place ? `chỉ ở ${esc(placeLow(c.place))}` : ''].filter(Boolean).join(' · ');
}
// Đoán biểu tượng theo tên việc, để thêm nhanh không phải chọn.
const ICON_GUESS = [[/nhảy dây/, '🪢'], [/uống|nước lọc/, '💧'], [/giường|chăn/, '🛏️'], [/răng|rửa mặt/, '🪥'], [/đồ chơi|lego/, '🧸'], [/bát|chén|dọn mâm/, '🍽️'], [/cây|tưới/, '🪴'], [/cặp/, '🎒'], [/quần áo|gấp áo/, '👕'], [/quét/, '🧹'], [/lau/, '🧽'],
  [/rác/, '🗑️'], [/tắm|gội/, '🛁'], [/đàn|piano/, '🎹'], [/chạy|đi bộ|thể dục|bơi/, '🏃'], [/nghe/, '🎧'], [/sách|đọc|truyện/, '📚'], [/bài|học|viết|toán/, '✏️'], [/bàn/, '🪑'], [/ngủ/, '🌙'], [/phim/, '🎬'], [/tivi|tv/, '📺'],
  [/game|chơi/, '🎮'], [/giày|dép/, '👟'], [/tất|vớ/, '🧦'], [/chó|mèo/, '🐶'], [/cá/, '🐟'], [/cơm|ăn/, '🍚'], [/giúp/, '🤝'], [/phơi|giặt/, '🧺']];
export const guessIcon = name => (ICON_GUESS.find(([rx]) => rx.test(String(name).toLowerCase())) || [0, '✅'])[1];
const giftTagOf = (kind, vnd) => kind === 'gift' && !vnd ? 'miễn phí' : money(vnd) + (kind === 'fee' ? FEE_UNIT : '');
const giftTag = r => priceVnd(r) ? money(priceVnd(r)) : 'Miễn phí';
export const priceTag = r => priceKind(r) === 'merit' ? '+' + money(priceVnd(r)) : priceKind(r) === 'penalty' ? (r.all ? 'Mất hết tiền' : r.week ? 'Mất tiền thưởng tuần' : '−' + money(priceVnd(r)))
  : priceKind(r) === 'fee' ? money(priceVnd(r)) + FEE_UNIT : giftTag(r);


// ---------- thêm theo bảng mẫu, cập nhật theo bảng mẫu ----------
function missingSamples() {
  const cn = new Set(Object.values(S.chores).map(c => norm(c.name))), pn = new Set(Object.values(S.rewards).map(r => norm(r.name)));
  return { chores: SAMPLE_CHORES.filter(c => ![c.name, ...(c.also || [])].some(n => cn.has(norm(n)))), prices: SAMPLE_PRICES.filter(r => ![r.name, ...(r.also || [])].some(n => pn.has(norm(n)))) };
}
export function addSamples(kidIds) {
  const m = missingSamples(); let order = Object.keys(S.chores).length;
  m.chores.forEach(({ also, ver, ...c }) => put('chores', uid(), { ...c, kids: kidIds, order: order++, since: key(today()) }));
  m.prices.forEach(({ also, ver, ...r }) => put('rewards', uid(), r));
  return m.chores.length + m.prices.length;
}
// Việc và mục giá có trong bảng mẫu mà nhà mình chưa có (tính cả tên cũ). Việc giao cho mọi con, bắt đầu từ hôm nay.
// Mã cố định theo tên, để hai máy cùng thêm một lúc không sinh ra hai việc trùng nhau.
// Thứ tự: chen vào cạnh việc của bảng mà nhà mình đã có, để trong mỗi buổi các việc vẫn theo thứ tự của bảng.
export function sampleAdds() {
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
      s: [isFun(m) ? 'việc thích làm' : isWeekly(m) ? 'việc phải làm' : isExtra(m) ? `việc làm thêm, ${money(m.money)}` : `${money(m.money)} mỗi lần`, isExtra(m) ? '' : SL[m.slot], m.prep ? 'chỉ hiện vào tối trước ngày có học thêm' : ''].filter(Boolean).join(' · ') });
  });
  for (const { also, ver, ...m } of SAMPLE_PRICES) {
    const nid = 'gia-' + slug(m.name); if (hit(prices, { ...m, also }) || S.rewards[nid]) continue;
    ops.push({ col: 'rewards', nid, add: m, ico: m.icon, t: `Thêm ${m.kind === 'penalty' ? 'lỗi' : 'mục'} “${m.name}”`, s: m.week ? 'mất hết tiền được thưởng trong tuần' : m.all ? 'mất hết tiền đang có' : giftTagOf(m.kind, m.price) });
  }
  return ops;
}
// Hai việc quan trọng về bài tập về nhà và mục phạt Thiếu BTVN: app thêm sẵn một lần cho mỗi nhà (autoAdds trong mot-lan.js), máy bố mẹ
// cũng dùng mục phạt này để tự trừ tiền khi cô báo thiếu BTVN (hwPenSync trong so-hoc.js).
export const HW_CHORES = [
  ['hw-lesson', { name: 'Nộp BTVN cho buổi học thêm hôm sau', icon: '📝', prep: true }],
  ['hw-school', { name: 'Hoàn thành BTVN trên lớp', icon: '📚', prep: 'school' }],
];
export const HW_PENALTY = ['pen-hw', { name: 'Thiếu BTVN', icon: '📕', kind: 'penalty', price: 25000, again: 50000 }];
// Cập nhật quy định một lần theo bảng mẫu bản mới: những gì sẽ đổi trong dữ liệu đang dùng.
// Chỉ đụng tới mục trùng tên với bảng mẫu (tên mới hoặc tên cũ); mục gia đình tự thêm thì giữ nguyên. Việc và mục giá còn thiếu thì thêm đủ.
// Trả về null khi không có gì để đổi, hoặc các con đã ghi bản này (đã áp dụng hoặc đã bỏ qua).
export function tableUpdate() {
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
    const more = (m.steps || []).filter(x => (c.steps || []).length && !(c.steps || []).some(y => norm(stepText(y)) === norm(stepText(x))));
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
export function tableUpdateForm() {
  const u = tableUpdate(); if (!u) return toast('Quy định đã theo bảng mẫu mới nhất.');
  openModal(`<h2>Cập nhật theo bảng mẫu</h2><p class="muted small lead">Bấm Áp dụng để đổi ${u.ops.length} mục dưới đây trong bảng của nhà mình. Việc và mục giá nhà mình tự thêm thì giữ nguyên, tiền các ngày đã qua không đổi. Áp dụng xong vẫn bấm Hoàn tác được.</p>
  <div class="fg"><div class="list">${u.ops.map(o => `<div class="item"><span class="ico">${esc(o.ico)}</span><div class="txt"><div class="t">${esc(o.t)}</div><div class="s">${esc(o.s)}</div></div></div>`).join('')}</div></div>
  ${u.bals.length ? `<div class="fg">${u.bals.map(x => frow(`Số dư của ${esc(x.name)}`, pillNum(`tb-${x.kid}`, x.target, { attr: `step="1" data-tb="${x.kid}"` }), { id: `tb-${x.kid}`, sub: `Số bố mẹ chốt ngày ${TABLE_BAL_DATE}. Trong app đang là ${money(balance(x.kid))}. Từ đó tới nay đã khác thì sửa lại, bỏ trống nếu không muốn đổi` })).join('')}</div>` : ''}
  <div class="foot"><button class="btn danger left" data-act="table-skip">Không dùng bản này</button><button class="btn quiet" data-act="close">Để sau</button><button class="btn primary" data-act="table-apply">Áp dụng</button></div>`);
}
// Ghi các thay đổi của tableUpdate (apply = false thì chỉ ghi là đã xem bản này). Trả về hàm hoàn tác.
// bals: [{ kid, target }] số dư cần khớp sau khi đổi, ghi bằng một khoản "Khớp số dư" cho phần chênh lệch.
export function tableUpdateRun(apply, bals = []) {
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
    clearMemo(); const at = new Date().toISOString();
    for (const x of bals) {
      const diff = S.kids[x.kid] ? x.target - balance(x.kid) : 0; if (!diff) continue;
      const lid = uid(); added.push(['ledger', lid]);
      put('ledger', lid, { kid: x.kid, amount: diff, kind: 'adjust', icon: '🏦', note: `Khớp số dư khi cập nhật theo bảng mẫu: ${money(x.target)}`, at });
    }
    clearMemo();
  }
  return () => { for (const [col, id, old] of before) put(col, id, old); for (const [col, id] of added) del(col, id); };
}
// Việc đang có tiền từng lần mà trùng tên với việc phải làm trong bảng mẫu (gấp chăn, không kén ăn, bài tập, cất cặp, dọn bàn học, đánh răng...).
export function weeklyCandidates() {
  const names = new Set(SAMPLE_CHORES.filter(isWeekly).flatMap(c => [c.name, ...(c.also || [])]).map(norm));
  return choresList().filter(c => isMust(c) && !isWeekly(c) && names.has(norm(c.name)));
}

// ---------- màn Quy định ----------
// Trang Quy định: nơi duy nhất thêm, sửa, xoá việc nhà (bốn loại) và các mục giá (thành tích, phạt, phí sử dụng, phiếu thưởng).
// Màn khác chỉ hiện và dẫn sang đây. Tiêu đề mỗi nhóm có nút thêm ngay tại chỗ: thêm đúng loại đang xem, không phải chọn lại loại trong form.
export function viewPrices() {
  const kids = kidsList(), chores = choresList(), off = !kids.length;
  let h = `<div class="day-head tools"><h1>Quy định</h1>${pillBar(moreBtn('price-menu', 'In bảng giá, phiếu thưởng, kế hoạch tuần'), plusBtn('Thêm việc nhà, thành tích, phạt, phí, phiếu thưởng', off))}</div>`;
  const miss = missingSamples(), n = miss.chores.length + miss.prices.length;
  const upd = tableUpdate(), allDaily = kids.length > 0 && kids.every(isDaily);
  if (upd) h += suggest('Bảng mẫu có bản mới', `${upd.ops.length} thay đổi${upd.ops.some(o => o.col === 'kids') ? ', trong đó có thưởng theo ngày thay cho thưởng đủ tuần' : ''}. Xem trước rồi mới áp dụng.`, 'Xem thay đổi', 'table-update');
  if (n && kids.length) h += suggest(`Bảng mẫu còn ${n} mục chưa có ở đây`, miss.chores.length ? `${miss.chores.length} việc, ${miss.prices.length} mục phạt, phí và phiếu thưởng.` : 'Các mục phạt, phí sử dụng và phiếu thưởng.', 'Thêm vào', 'seed-prices');
  // Số tiền nằm ngay dưới tên, để tên việc không bị ép thành nhiều dòng trên màn hình hẹp.
  const choreRow = c => `<div class="item"><span class="ico">${esc(c.icon || '✅')}</span><div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${isWeekly(c) || isFun(c) ? '' : `<b class="num plus">+${money(choreVnd(c))}</b> · `}${choreSummary(c)}</div></div>
    <div class="acts">${editBtn('chore-form', c.id, c.name)}</div></div>`;
  const weekly = chores.filter(c => choreKindOf(c) === 'week'), each = chores.filter(c => choreKindOf(c) === 'each'), extra = chores.filter(isExtra), fun = chores.filter(isFun);
  // Việc phải làm: không tính tiền từng lần, làm đủ thì được thưởng (theo ngày, hoặc cả tuần với con chưa chuyển).
  const cand = weeklyCandidates();
  if (!weekly.length && cand.length) h += suggest('Chuyển sang việc phải làm?', `${cand.map(c => esc(c.name)).join(', ')}: không cộng tiền từng lần nữa, ${allDaily ? bonusRules(kids) || 'làm đủ việc thì thưởng' : `làm đủ tất cả các ngày thì cuối tuần thưởng ${money(WEEK_BONUS)} mỗi con`}.`, `Chuyển ${cand.length} việc`, 'weekly-convert');
  // Mỗi nhóm một nhãn màu, bấm nhãn để gập lại khi chỉ muốn xem nhóm khác. Nút + của nhóm thêm đúng loại đó.
  const sec = (key, tint, kind, cnt, body, note = '') => { const [, label, ic] = CHORE_KINDS.find(x => x[0] === kind);
    return `<section class="slot ${tint}">${secHead(ic, label, { cnt, key, add: off ? '' : addBtn('chore-form', `Thêm: ${label}`, `data-kind="${kind}"`) })}${secIsOpen(key) ? body + (note ? `<p class="foot-note" style="margin:0 6px">${note}</p>` : '') : ''}</section>`; };
  const list = (l, empty) => l.length ? `<div class="slot-list list">${l.map(choreRow).join('')}</div>` : off ? '' : blankAdd(empty[0], 'chore-form', `data-kind="${empty[1]}"`);
  const bonusRows = kids.map(k => isDaily(k) ? `<div class="item"><span class="ico">⭐</span><div class="txt"><div class="t">Mỗi ngày làm đủ việc${kids.length > 1 ? ` · ${esc(k.name)}` : ''}</div><div class="s"><b class="num ${dayBonusOf(k) ? 'plus' : ''}">${dayBonusOf(k) ? '+' + money(dayBonusOf(k)) : 'Không thưởng'}</b> · tự cộng khi xong việc phải làm cuối cùng trong ngày</div></div>
      <div class="acts">${editBtn('kid-form', k.id, 'thưởng ngày đủ việc của ' + k.name)}</div></div>` : `<div class="item"><span class="ico">🏆</span><div class="txt"><div class="t">Làm đủ tất cả các ngày trong tuần${kids.length > 1 ? ` · ${esc(k.name)}` : ''}</div><div class="s"><b class="num ${weekBonusOf(k) ? 'plus' : ''}">${weekBonusOf(k) ? '+' + money(weekBonusOf(k)) : 'Không thưởng'}</b> · tự cộng vào cuối tuần</div></div>
      <div class="acts">${editBtn('kid-form', k.id, 'thưởng đủ tuần của ' + k.name)}</div></div>`).join('');
  h += `<div class="slots">`;
  h += sec('bg-week', 'tn3', 'week', weekly.length || '', kids.length || weekly.length ? `<div class="slot-list list">${bonusRows}${weekly.map(choreRow).join('')}</div>` : blankAdd('Thêm con trước rồi giao việc', 'kid-form'),
    weekly.length ? (allDaily ? 'Không cộng tiền từng lần. Ngày nào làm đủ hết thì ngày đó được thưởng. Việc ghi “quan trọng” nằm đầu mỗi buổi ở màn Hôm nay.' : 'Không cộng tiền từng lần. Làm đủ tất cả các ngày thì cuối tuần được thưởng.') : kids.length ? `Chưa có việc phải làm nào, nên ${allDaily ? 'thưởng ngày đủ việc' : 'thưởng đủ tuần'} đang tính theo tất cả việc mỗi ngày bên dưới. Mở một việc, chọn Loại việc là Việc phải làm để đưa việc đó lên đây.` : '');
  h += sec('bg-each', 'tn1', 'each', each.length || '', list(each, ['Việc nằm trong lịch mỗi ngày, làm lần nào cộng tiền lần đó', 'each']), each.length && weekly.length ? 'Làm lần nào cộng tiền lần đó. Không tính vào thưởng làm đủ việc.' : '');
  h += sec('bg-extra', 'tn4', 'extra', extra.length || '', list(extra, ['Việc không bắt buộc, làm lúc nào được tiền lúc đó', 'extra']));
  h += sec('bg-fun', 'tn2', 'fun', fun.length || '', list(fun, ['Con thích làm gì khi xong việc? Ví dụ: chơi game 15 phút', 'fun']), fun.length ? 'Không có tiền. Mở khoá khi xong việc phải làm của buổi đó và các việc mở khoá (ví dụ đọc sách 30 phút). Con xin thêm, xin sửa ở màn của con, bố mẹ duyệt ở màn Hôm nay.' : '');
  const EMPTY = { merit: 'Con tự báo, bố mẹ duyệt mới cộng tiền. Ví dụ: được điểm 10 ở trường hay ở lớp học thêm', penalty: 'Lỗi nào thì bị trừ tiền. Ví dụ: nổi nóng, trì hoãn', fee: 'Dùng điện thoại, xem tivi mất bao nhiêu tiền mỗi 30 phút', gift: 'Con dùng tiền để đổi. Ví dụ: chọn phim tối nay' }, TINT = { merit: 'tn3', penalty: 's-late', fee: 'tn2', gift: 'tn5' };
  for (const [kind, label, ic] of PRICE_KINDS) {
    const list = pricesList(kind);
    h += `<section class="slot ${TINT[kind]}">${secHead(ic, label, { cnt: list.length || '', key: 'bg-' + kind, add: addBtn('price-form', `Thêm: ${label}`, `data-kind="${kind}"`) })}${!secIsOpen('bg-' + kind) ? '' : list.length
      ? `<div class="slot-list list">${list.map(r => `<div class="item"><span class="ico">${esc(r.icon || ic)}</span><div class="txt"><div class="t">${esc(r.name)}</div><div class="s"><b class="num ${kind === 'gift' ? '' : kind === 'merit' ? 'plus' : 'minus'}">${priceTag(r)}</b>${againVnd(r) ? ` · từ lần 2 trong tuần −${money(againVnd(r))}` : r.all ? ' · trừ hết số tiền đang có' : r.week ? ' · tiền việc nhà và tiền thưởng từ Thứ Hai tới lúc phạt' : r.skip ? ' · miễn việc phải làm một ngày' : ''}</div></div>
      <div class="acts">${editBtn('price-form', r.id, r.name)}</div></div>`).join('')}</div>${kind === 'merit' ? '<p class="foot-note" style="margin:0 6px">Ở trường hay ở lớp học thêm đều tính như nhau. Con tự báo ở màn của con khi đạt được, bố mẹ duyệt thì mới cộng tiền.</p>' : ''}` : blankAdd(EMPTY[kind], 'price-form', `data-kind="${kind}"`)}</section>`;
  }
  return h + `</div>`;
}
export function printPrices() {
  const chores = choresList().filter(c => !isFun(c)), kids = kidsList();
  const cell = (icon, name, val, cls = '') => `<div class="pp-i"><span>${esc(icon)} ${esc(name)}:</span> <b class="${cls}">${esc(val)}</b></div>`;
  const rules = bonusRules(kids);
  const sec = (title, items) => items.length ? `<h2>${title}</h2><div class="pp-grid">${items.join('')}</div>` : '';
  printHtml(`<div class="price-poster"><h1>Tiền tiêu vặt của ${esc(kids.map(k => k.name).join(', ') || 'các con')}</h1>
    ${sec('Thưởng', chores.filter(c => !isWeekly(c)).map(c => cell(c.icon, c.name, money(choreVnd(c)))))}
    ${chores.some(isWeekly) ? `<h2>Việc phải làm${rules ? `: ${rules}` : ''}</h2><div class="pp-line">${chores.filter(isWeekly).map(c => `${esc(c.icon || '')} ${esc(c.name)}`).join(' · ')}</div>` : ''}
    ${rules && !chores.some(isWeekly) ? `<div class="pp-line">🏆 Việc phải làm: <b>${rules}</b></div>` : ''}
    ${sec('Thành tích học tập, ở trường và học thêm (con báo, bố mẹ duyệt)', meritList().map(r => cell(r.icon, r.name, '+' + money(priceVnd(r)))))}
    ${sec('Phạt', pricesList('penalty').map(r => cell(r.icon, r.name, r.all ? 'mất hết tiền' : r.week ? 'mất tiền thưởng của tuần' : 'trừ ' + money(priceVnd(r)) + (againVnd(r) ? `, từ lần 2 trong tuần ${money(againVnd(r))}` : ''), 'minus')))}
    ${sec('Phí sử dụng', pricesList('fee').map(r => cell(r.icon, r.name, money(priceVnd(r)) + FEE_UNIT, 'minus')))}
    ${sec('Phiếu thưởng', pricesList('gift').map(r => cell(r.icon, r.name, giftTag(r))))}</div>`);
}
export function printCoupons() {
  const gs = pricesList('gift');
  printHtml(`<div class="coupon-sheet"><h1>Phiếu thưởng</h1><div class="cs-sub">Cắt ra, con dùng tiền trong tài khoản để đổi</div>
    <div class="cs-grid">${gs.map((r, i) => `<div class="coupon c${i % 3}"><span class="c-ico">${esc(r.icon || '🎁')}</span><div><div class="c-t">${esc(r.name)}</div>${r.note ? `<div class="c-n">${esc(r.note)}</div>` : ''}<div class="c-p">${giftTag(r)}</div></div></div>`).join('')}</div></div>`);
}

// ---------- form việc nhà và form mục giá ----------
// Bốn loại việc nhà, cùng một tên ở mọi màn, form và bản in (bảng tên gọi trong CLAUDE.md). Dữ liệu vẫn lưu bằng kind và money:
//   week: Việc phải làm (kind 'must', money 0) · each: Việc được thưởng (kind 'must', money > 0) · extra: Việc làm thêm · fun: Việc thích làm.
export const CHORE_KINDS = [['week', 'Việc phải làm', '⭐'], ['each', 'Việc được thưởng', '💰'], ['extra', 'Việc làm thêm', '💪'], ['fun', 'Việc thích làm', '🎬']];
export const CHORE_KIND_SUB = { week: 'Không cộng tiền từng lần, làm đủ thì được thưởng', each: 'Nằm trong lịch mỗi ngày, làm lần nào cộng tiền lần đó', extra: 'Không bắt buộc, làm lúc nào được tiền lúc đó', fun: 'Không có tiền, mở khoá khi xong việc phải làm' };
const choreKindOf = c => isFun(c) ? 'fun' : isExtra(c) ? 'extra' : isWeekly(c) ? 'week' : 'each';
// Dòng giải thích dưới ô Loại việc. wbs: câu mô tả cách thưởng của các con (bonusRules), ví dụ "ngày nào làm đủ việc thì thưởng 15.000đ".
export const kindHelp = (kind, wbs) => ({
  week: `Nằm trong lịch mỗi ngày. Không cộng tiền từng lần${wbs ? ', ' + wbs : ', làm đủ việc thì thưởng'}`,
  each: 'Nằm trong lịch mỗi ngày. Làm lần nào cộng tiền lần đó, không tính vào thưởng làm đủ việc',
  extra: 'Không bắt buộc, không xếp vào buổi nào, làm lúc nào được tiền lúc đó',
  fun: 'Không có tiền, mở khoá khi xong việc phải làm của buổi và việc mở khoá (đọc sách 30 phút)',
}[kind] || '');
// pre: những gì đã gõ và chọn ở ô thêm nhanh ({ name, slot, days, kids, money }), điền sẵn vào form thêm mới.
export function choreForm(id, kindPre, pre) {
  const c = id ? S.chores[id] : null, kids = kidsList();
  const ck = c ? (c.kids || []) : pre?.kids || kids.map(k => k.id), days = c ? (c.days || []) : pre?.days || [0, 1, 2, 3, 4, 5, 6];
  // Việc mới mặc định là Việc được thưởng, trừ khi thêm từ nút + của một nhóm (kindPre) hoặc từ ô thêm nhanh (pre.money = 0 là Việc phải làm).
  const kind = c ? choreKindOf(c) : CHORE_KINDS.some(x => x[0] === kindPre) ? kindPre : pre ? (pre.money === 0 ? 'week' : 'each') : 'each';
  const slot = c ? choreSlot(c) : pre?.slot || '', pw = c ? perWeekOf(c) : 0;
  const wbs = bonusRules(kids);
  const adv = c && (pw || (c.variants || []).length || c.shared || c.claim || c.prep || c.imp || c.unlock || c.readLog || c.place || toMin(c.time) !== null || Number(c.minutes));
  const ico = c?.icon || (pre?.name && CHORE_ICONS.includes(guessIcon(pre.name)) ? guessIcon(pre.name) : CHORE_ICONS[0]);
  openModal(`<h2>${c ? 'Sửa việc' : 'Thêm việc'}</h2>
  <div class="fg f-title"><div class="ft"><input id="cname" class="input ft-input" maxlength="40" value="${esc(c?.name || pre?.name || '')}" placeholder="Tên việc" aria-label="Tên việc" autocomplete="off" data-wbs="${esc(wbs)}" ${c ? '' : 'data-new="1"'}>
      <button class="ico-btn" data-act="ico-toggle" aria-expanded="false" aria-label="Chọn biểu tượng"><span class="ico-now">${icon(ico)}</span></button></div>
    <div class="ico-pick" hidden>${pickGrid('cico', CHORE_ICONS.includes(ico) ? CHORE_ICONS : [ico, ...CHORE_ICONS], ico)}</div></div>
  <div class="fg">
    ${frow('Loại việc', pillSel('ckind', CHORE_KINDS.map(([v, l]) => [v, l]), kind), { id: 'ckind', sub: kindHelp(kind, wbs), subId: 'ckind-help' })}
    ${frow('Tiền mỗi lần', `<div class="pillnum"><button data-act="num-step" data-t="cmoney" data-n="-5000" data-min="0" aria-label="Bớt 5.000đ">−</button><input id="cmoney" class="num" type="number" min="0" step="1000" inputmode="numeric" value="${c && choreVnd(c) ? choreVnd(c) : pre?.money || 5000}"><span>đ</span><button data-act="num-step" data-t="cmoney" data-n="5000" data-min="0" aria-label="Thêm 5.000đ">+</button></div>`, { id: 'cmoney', cls: 'cmoney-f', hidden: kind === 'fun' || kind === 'week' })}
    ${frow('Buổi', pillSel('cslot', SLOTS.map(([v, label]) => [v, label]), slot, 's-' + (slot || 'any')), { id: 'cslot' })}
    <div class="fr col">${frow('Lặp lại', pillSel('cdays', [...DAY_SETS, ['custom', 'Chọn ngày']], daySet(days)), { id: 'cdays', cls: 'in' })}
      <div class="seg days7">${WEEK_ORDER.map(d => `<label><input type="checkbox" name="cday" value="${d}" ${days.includes(d) ? 'checked' : ''}><span>${WDS[d]}</span></label>`).join('')}</div></div>
    ${kidRow('Giao cho', 'ckid', 'checkbox', ck)}
  </div>
  <div class="fg"><div class="fr col"><div class="fl"><label for="csteps">Danh sách con</label><span class="fs">Mỗi dòng một mục. Con tick đủ các mục thì việc được tính là xong. Mục nào chỉ cần khi hôm sau đi học thì ghi thêm “(mai đi học)” ở cuối dòng: tối trước ngày nghỉ mục đó tự ẩn.</span></div>
    <textarea id="csteps" class="input f-area" rows="3" placeholder="Cặp sách đã soạn&#10;Quần áo ngày mai&#10;Bàn học đã gọn">${esc((c?.steps || []).join('\n'))}</textarea></div></div>
  <details class="fg f-adv" ${adv ? 'open' : ''}><summary class="fr"><div class="fl"><span class="lbl">Thêm tuỳ chọn</span><span class="fs">Giờ, số phút, nơi làm, số lần mỗi tuần, việc chung, ghi đã đọc gì</span></div>${DOWN}</summary>
    ${frow('Giờ', `<input id="ctime" class="pillin num" type="time" value="${esc(c?.time || '')}">`, { id: 'ctime', sub: 'Có giờ thì việc tự xếp vào buổi theo giờ đó' })}
    <div class="fr">${toggle('cby', 'Phải xong trước giờ này <span class="fs">Ví dụ: tắm trước 19:00, quá giờ thì app báo</span>', c?.by)}</div>
    ${frow('Làm trong bao lâu', `<div class="pillnum"><input id="cmin" class="num" type="number" min="0" max="600" step="5" inputmode="numeric" value="${Number(c?.minutes) || ''}" placeholder="0"><span>phút</span></div>`, { id: 'cmin' })}
    ${frow('Chỉ làm ở', `<input id="cplace" class="input" list="cplace-list" maxlength="24" value="${esc(placeName(c?.place))}" placeholder="Ở đâu cũng được"><datalist id="cplace-list">${placeNames().map(n => `<option value="${esc(n)}">`).join('')}</datalist>`, { id: 'cplace', cls: 'col', sub: 'Chỉ hiện vào ngày các con ở đó, theo lịch Các con ở đâu. Ví dụ: hút bụi chỉ ở 6th Element' })}
    ${frow('Số lần mỗi tuần', pillSel('cpw', [0, 1, 2, 3, 4, 5, 6].map(n => [n, n ? `${n} lần mỗi tuần` : 'Mọi ngày đã chọn']), pw), { id: 'cpw', sub: 'Ví dụ: chạy bộ 3 buổi, ngày nào cũng được' })}
    <div class="fr">${toggle('cimp', 'Việc quan trọng <span class="fs">Xếp vào nhóm Việc quan trọng, nằm đầu mỗi buổi ở màn Hôm nay và màn của con</span>', c?.imp)}</div>
    <div class="fr">${toggle('cread', 'Hỏi con đã đọc gì, bao nhiêu trang <span class="fs">Bấm xong thì con ghi tên sách và số trang, ghi rồi mới được tính</span>', c?.readLog)}</div>
    <div class="fr">${toggle('cunlock', 'Xong việc này mới mở khoá việc thích làm <span class="fs">Ví dụ: đọc sách 30 phút xong mới được chơi game, dùng iPad</span>', c?.unlock)}</div>
    <div class="fr">${toggle('cprep', 'Chỉ khi hôm sau có học thêm <span class="fs">Chỉ hiện vào hôm trước ngày con có buổi học thêm: chuẩn bị sách vở, nộp bài tập</span>', c?.prep && c.prep !== 'school')}</div>
    <div class="fr">${toggle('cprepsch', 'Chỉ khi hôm sau đi học <span class="fs">Chỉ hiện vào hôm trước ngày con đi học, theo thời khoá biểu và ngày nghỉ</span>', c?.prep === 'school')}</div>
    <div class="fr">${toggle('cclaim', 'Ai làm trước thì tính <span class="fs">Một con làm thì con kia không phải làm nữa. Cùng làm thì tính cả hai, chia đều tiền</span>', c?.claim)}</div>
    <div class="fr">${toggle('cshared', 'Việc chung <span class="fs">Một con đánh dấu là tính cho cả nhà</span>', c?.shared && !c?.claim)}</div>
    <div class="fr col"><div class="fl"><label for="cvar">Đổi nội dung xen kẽ</label><span class="fs">Cách nhau bằng dấu phẩy. Mỗi lần làm đổi sang nội dung tiếp theo, app ghi “hôm nay: tiếng Anh”.</span></div>
      <input id="cvar" class="input f-area" maxlength="80" value="${esc((c?.variants || []).join(', '))}" placeholder="Ví dụ: tiếng Việt, tiếng Anh"></div>
  </details>
  <div class="foot">${c ? `<button class="btn danger left" data-act="chore-del" data-id="${id}">Xoá việc này</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="chore-save" data-id="${id || ''}">Lưu</button></div>`);
}
export const PRICE_HELP = { merit: 'Con tự báo khi đạt được, bố mẹ duyệt thì mới cộng tiền', penalty: 'Trừ tiền khi con mắc lỗi', fee: 'Trừ tiền theo thời gian dùng điện thoại, tivi…', gift: 'Con dùng tiền trong tài khoản để đổi' }, PRICE_FEE = 'Tính cho mỗi 30 phút sử dụng';
export function priceForm(id, kindPre) {
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
