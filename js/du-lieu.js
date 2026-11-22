// Lõi của app: trạng thái (dữ liệu S, UI, nơi lưu), ghi dữ liệu, máy của ai, tính tiền, thưởng, chuỗi ngày, và phần dữ liệu của
// lịch (thời khoá biểu, mốc năm học, học thêm, các con ở đâu, các buổi trong ngày). Không import màn nào.
// Biến trạng thái là biến let: module khác đọc được giá trị mới nhất nhưng không gán lại được, nên đổi bằng các hàm set… ở đây.
import { COLS } from './store.js';
import { addDays, dm, key, money, nowMin, parse, toast, today, toMin, WDN, WEEK_ORDER, weekStart } from './chung.js';
import { PLACE_ALIAS, PLACE_NAMES } from './nha-minh.js';

// ---------- mức thưởng ----------
// Thưởng mỗi ngày con làm đủ mọi việc phải làm (con mới thêm, hoặc khi chuyển từ thưởng đủ tuần sang).
export const DAY_BONUS = 15000;
// Cách cũ: thưởng khi làm đủ mọi việc phải làm cả một tuần (Thứ Hai đến Chủ nhật). Con chưa chuyển sang thưởng theo ngày vẫn tính như vậy.
export const WEEK_BONUS = 35000;
// Con cũ chưa ghi mức thưởng tuần thì vẫn tính theo mức mặc định trước đây, để số dư không tự đổi.
const WEEK_BONUS_OLD = 25000;
// Trước đây app tính bằng sao. Dữ liệu cũ (sao) được quy đổi: 1 sao = 5.000đ.
const STAR_VND = 5000;

// ---------- trạng thái ----------
export let S = Object.fromEntries(COLS.map(c => [c, {}]));
export const UI = { view: 'hom-nay', date: today(), acctKid: null, acctKind: 'penalty', histAll: false, slotOpen: {}, learn: 'sap-toi', todayMode: 'day', todayKid: null, secOpen: {}, gridWs: null, planNext: false, agDate: null, taskDone: false, tkbKid: null, tkbDay: null, km: { on: false, kid: null }, sheet: false };
export let store = null, loaded = false, stale = false, family = null;
// Module khác không gán lại được biến của module này: đổi S, store, loaded, stale, family (mã gia đình), RO bằng các hàm dưới đây.
export const setData = v => { S = v; }, setStore = v => { store = v; }, setLoaded = v => { loaded = v; }, setStale = v => { stale = v; }, setFamilyCode = v => { family = v; };
// Đang vẽ cho con xem (mục Học tập ở màn của con): các nút thêm, sửa không hiện.
export let RO = false;
export const setRO = v => { RO = v; };
// Mã lớp, khi máy này đang mở bằng link của cô (màn của cô, ?lop=…).
export let TEACH = null;
export const setTeach = v => { TEACH = v; };
export const FAMILY_KEY = 'be-cham-ngoan-family';
export const getFamily = () => { try { return localStorage.getItem(FAMILY_KEY); } catch (e) { return null; } };
export const setFamily = v => { try { v ? localStorage.setItem(FAMILY_KEY, v) : localStorage.removeItem(FAMILY_KEY); } catch (e) {} };
// Máy này của ai, nhớ theo từng gia đình: 'parent' (bố mẹ) hoặc mã của một con. Chỉ có tác dụng khi nhà đã đặt mã PIN bố mẹ.
const ROLE_KEY = 'be-cham-ngoan-role';
const roleMap = () => { try { return JSON.parse(localStorage.getItem(ROLE_KEY) || '{}') || {}; } catch (e) { return {}; } };
export const getRole = () => roleMap()[family || 'local'] || null;
export const setRole = v => { try { const m = roleMap(); if (v) m[family || 'local'] = v; else delete m[family || 'local']; localStorage.setItem(ROLE_KEY, JSON.stringify(m)); } catch (e) {} };

export function writeErr(e) {
  const c = e && e.code;
  if (c === 'permission-denied') toast('Không có quyền lưu. Kiểm tra Firestore Rules (xem README).');
  else if (c === 'resource-exhausted') toast('Đã hết hạn mức miễn phí hôm nay của Firebase.');
  else toast('Chưa lưu được. Kiểm tra mạng rồi thử lại.');
  console.error(e);
}
// Ghi không chờ: Firestore tự lưu tạm khi mất mạng và gửi lại sau.
export const put = (col, id, data) => { Promise.resolve(store.put(col, id, data)).catch(writeErr); };
export const del = (col, id) => { Promise.resolve(store.del(col, id)).catch(writeErr); };
export const setDone = (d, kid, chore, val) => { Promise.resolve(store.setDone(d, kid, chore, val)).catch(writeErr); };

// ---------- việc nhà, tiền, thưởng, chuỗi ngày ----------
export const kidsList = () => Object.entries(S.kids).map(([id, k]) => ({ id, ...k })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.name).localeCompare(String(b.name), 'vi'));
export const choresList = () => Object.entries(S.chores).map(([id, c]) => ({ id, ...c })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.name).localeCompare(String(b.name), 'vi'));
// Mục giá (trang Quy định): { name, icon, kind: 'merit' | 'gift' | 'penalty' | 'fee', price (đồng; phí sử dụng là đồng/giờ; phiếu thưởng giá 0 là miễn phí),
//   all: true = phạt mất hết tiền đang có, week: true = phạt mất hết tiền được thưởng trong tuần }.
// Mục cũ chỉ có cost (sao) và không có kind là phiếu thưởng.
export const priceKind = r => ['penalty', 'fee', 'merit'].includes(r.kind) ? r.kind : 'gift';
export const priceVnd = r => r.price != null ? Math.max(0, Number(r.price) || 0) : (Number(r.cost) || 0) * STAR_VND;
export const pricesList = kind => Object.entries(S.rewards).map(([id, r]) => ({ id, ...r })).filter(r => !kind || priceKind(r) === kind)
  .sort((a, b) => (a.all ? 2 : a.week ? 1 : 0) - (b.all ? 2 : b.week ? 1 : 0) || priceVnd(a) - priceVnd(b) || String(a.name).localeCompare(String(b.name), 'vi'));
// Việc nhà: { name, icon, money (đồng), kids, days, order,
//   kind: 'must' (phải làm, có tiền) | 'extra' (làm thêm, có tiền, không bắt buộc)
//         | 'fun' (thích làm, không có tiền, mở khoá khi xong việc phải làm),
//   slot: 'sang' | 'chieu' | 'toi' | '' , time: "HH:MM", by: true = phải xong trước giờ đó, minutes,
//   perWeek: số lần mỗi tuần (ngày nào trong `days` cũng được), steps: [danh sách con],
//   variants: [nội dung xen kẽ], shared: true = việc chung, một con đánh dấu là tính cho cả nhà,
//   prep: true = chỉ hiện vào hôm trước ngày con có buổi học thêm (chuẩn bị sách vở, nộp bài tập), prep: 'school' = chỉ hiện vào hôm trước ngày con đi học,
//   place: tên nơi = chỉ hiện vào ngày các con ở đó (theo lịch Các con ở đâu), ví dụ hút bụi chỉ ở 6th Element,
//   unlock: true = việc mở khoá: phải xong việc này trong ngày thì việc thích làm mới mở (ví dụ đọc sách 30 phút),
//   imp: true = việc quan trọng, xếp vào nhóm Việc quan trọng ở đầu mỗi buổi (màn Hôm nay và màn của con),
//   claim: true = ai làm trước thì tính: một con làm thì con kia không phải làm nữa, cùng làm thì tính cả hai và chia đều tiền }
export const isFun = c => c.kind === 'fun';
export const isExtra = c => c.kind === 'extra';
export const isMust = c => !isFun(c) && !isExtra(c);
// Tiền của một việc. Việc cũ chỉ có số sao thì quy đổi theo STAR_VND.
export const choreVnd = c => isFun(c) ? 0 : c.money != null ? Math.max(0, Math.round(Number(c.money) || 0)) : (Number(c.stars) || 1) * STAR_VND;
// done lưu số tiền nhận được. Giá trị nhỏ hơn 100 là dữ liệu cũ tính bằng sao; 0.5 là "đã làm" với việc không có tiền.
export const doneVnd = v => { v = Number(v) || 0; return v <= 0 ? 0 : v >= 100 ? v : Number.isInteger(v) ? v * STAR_VND : 0; };
export const doneVal = c => choreVnd(c) || 0.5;
// Sổ tài khoản: mục mới ghi amount (đồng), mục cũ ghi delta (sao).
export const ledgerVnd = l => l.amount != null ? Number(l.amount) || 0 : (Number(l.delta) || 0) * STAR_VND;
export const weekBonusOf = k => k.weekBonus != null ? Math.max(0, Number(k.weekBonus) || 0) : WEEK_BONUS_OLD;
// Thưởng theo ngày: k.dayFrom là thứ Hai của tuần bắt đầu thưởng theo ngày, k.dayBonus là số tiền mỗi ngày đủ việc.
// Các tuần trước k.dayFrom (và con chưa có k.dayFrom) vẫn tính thưởng đủ tuần như cũ, để số dư đã có không đổi.
export const isDaily = k => !!k?.dayFrom;
export const dayBonusOf = k => Math.max(0, Number(k?.dayBonus) || 0);
// Thưởng của ngày dk. k.dbLog ghi mỗi lần đổi số tiền: [{ from: ngày bắt đầu áp dụng, amount, prev }], các ngày đã qua giữ nguyên.
export function dayBonusAt(k, dk) {
  if (!k?.dayFrom || dk < k.dayFrom) return 0;
  const log = Array.isArray(k.dbLog) ? k.dbLog : [];
  let amt = log.length ? log[0].prev : dayBonusOf(k);
  for (const e of log) if (e.from <= dk) amt = e.amount;
  return Math.max(0, Number(amt) || 0);
}
// Số tiền thưởng đang áp dụng của con (theo ngày hoặc theo tuần), và câu mô tả dùng trong các dòng giải thích.
const bonusOf = k => isDaily(k) ? dayBonusOf(k) : weekBonusOf(k);
const bonusRule = k => !bonusOf(k) ? '' : isDaily(k) ? `ngày nào làm đủ việc thì thưởng ${money(bonusOf(k))}` : `làm đủ cả tuần thì thưởng ${money(bonusOf(k))}`;
export const bonusRules = kids => [...new Set(kids.map(bonusRule))].filter(Boolean).join(' / ');
// Việc phải làm (kind 'must', money 0): không cộng tiền từng lần, quyết định thưởng làm đủ việc (theo ngày hoặc cả tuần).
export const isWeekly = c => isMust(c) && !choreVnd(c);
// c.weeklyFrom: thứ Hai của tuần việc này bắt đầu là việc phải làm (khi chuyển từ việc được thưởng sang), để các tuần trước giữ nguyên cách tính cũ.
// Việc mới thêm (c.since) cũng chỉ là việc phải làm từ tuần được thêm.
const weeklyIn = (c, wk) => isWeekly(c) && (!c.weeklyFrom || c.weeklyFrom <= wk) && (!c.since || key(weekStart(parse(c.since))) <= wk);
// Trong tuần wk con này có việc phải làm (money 0) nào không. Nhà chưa có (dữ liệu cũ) thì mọi việc mỗi ngày đều tính là phải làm, như trước đây.
const hasWeekly = (kidId, wk) => memoize('hw' + kidId + wk, () => choresList().some(c => (c.kids || []).includes(kidId) && weeklyIn(c, wk)));
export const reqIn = (c, kidId, wk) => isMust(c) && (!hasWeekly(kidId, wk) || weeklyIn(c, wk));
// c.since: ngày thêm việc. Trước ngày đó việc này chưa có, để thêm việc mới không làm hỏng chuỗi ngày và thưởng của các tuần đã qua.
export const onDay = (c, d) => (c.days || []).includes(d.getDay()) && (!c.since || key(d) >= c.since);
// Thưởng đủ tuần của tuần bắt đầu ngày wsKey. k.wbLog ghi mỗi lần đổi số tiền: [{ from: thứ Hai của tuần bắt đầu áp dụng, amount, prev }],
// để đổi mức thưởng thì chỉ tính từ tuần đó, các tuần đã qua giữ nguyên.
export function weekBonusAt(k, wsKey) {
  const log = Array.isArray(k.wbLog) ? k.wbLog : [];
  let amt = log.length ? log[0].prev : weekBonusOf(k);
  for (const e of log) if (e.from <= wsKey) amt = e.amount;
  return Math.max(0, Number(amt) || 0);
}
export const perWeekOf = c => Math.max(0, Math.min(7, Number(c.perWeek) || 0));
export const isDone = (d, kid, chore) => (Number(S.done[key(d)]?.[kid]?.[chore]) || 0) > 0;
export const stepMask = (d, kid, chore) => Number(S.done[key(d)]?.[kid]?.[chore + '~s']) || 0;
// Số lần đã làm trong tuần chứa ngày d: tính đến hết ngày d, hoặc chỉ những ngày trước d.
export function weekCount(kid, c, d, beforeOnly = false) {
  const ws = weekStart(d), dk = key(d); let n = 0;
  for (let i = 0; i < 7; i++) { const x = addDays(ws, i), xk = key(x); if (beforeOnly ? xk >= dk : xk > dk) break; if (isDone(x, kid, c.id)) n++; }
  return n;
}
// Việc "X lần mỗi tuần" hiện mỗi ngày cho tới khi đủ số lần (ngày đã làm thì vẫn hiện).
// Việc chỉ có vào hôm trước (c.prep). true: hôm sau con có buổi học thêm. 'school': hôm sau con đi học
// (theo thời khoá biểu, trừ ngày nghỉ trong Mốc năm học; chưa nhập thời khoá biểu thì tính Thứ Hai đến Thứ Sáu).
const schoolTomorrow = (kidId, d) => { const x = addDays(d, 1); return tkbOf(kidId) ? !!schoolOn(kidId, x) : !holidayOn(kidId, x) && x.getDay() >= 1 && x.getDay() <= 5; };
export const prepFor = (c, kidId, d) => !c.prep || (c.prep === 'school' ? schoolTomorrow(kidId, d) : lessonsOn(kidId, addDays(d, 1).getDay()).length > 0);
// Mục con chỉ áp dụng khi hôm sau đi học: dòng kết thúc bằng "(mai đi học)". Hôm sau không đi học thì mục đó không hiện và không phải tick.
const STEP_SCHOOL = /\s*\((?:khi\s+)?(?:mai|hôm sau)\s+đi học\)\s*$/i;
export const stepText = x => String(x).replace(STEP_SCHOOL, '').trim();
// Các mục con của việc c mà con phải tick trong ngày d. t: chữ hiện ra, i: vị trí trong c.steps (cũng là bit trong mặt nạ đã tick, nên không đổi khi có mục bị ẩn).
export const stepsOf = (c, kidId, d) => (c.steps || []).filter(Boolean).map((x, i) => ({ t: stepText(x), i, school: STEP_SCHOOL.test(x) })).filter(x => x.t && (!x.school || schoolTomorrow(kidId, d)));
export const stepsAll = list => list.reduce((m, x) => m | (1 << x.i), 0);
// Phạt tăng nặng (r.again): lần đầu trong tuần trừ r.price, từ lần thứ hai trong cùng tuần (Thứ Hai đến Chủ nhật) trừ r.again.
// Mỗi lần phạt ghi mã mục (ledger.rid) để đếm.
export const penaltyTimes = (rid, kidId, d = today()) => { const a = key(weekStart(d)), b = key(addDays(weekStart(d), 6)); return Object.values(S.ledger).filter(l => l.kid === kidId && l.rid === rid && l.at && key(new Date(l.at)) >= a && key(new Date(l.at)) <= b).length; };
export const againVnd = r => r.kind === 'penalty' && !r.all && !r.week ? Math.max(0, Math.round(Number(r.again) || 0)) : 0;
export const penaltyVnd = (r, kidId) => againVnd(r) && penaltyTimes(r.id, kidId) > 0 ? againVnd(r) : priceVnd(r);
export const choresFor = (kidId, d) => choresList().filter(c => (c.kids || []).includes(kidId) && onDay(c, d) && prepFor(c, kidId, d) && placeOk(c, d)
  && (!perWeekOf(c) || isDone(d, kidId, c.id) || weekCount(kidId, c, d, true) < perWeekOf(c)));
// Ngày con dùng phiếu "Một ngày không làm việc nhà": việc phải làm được miễn (làm thì vẫn có tiền).
export const skipEntry = (kidId, d) => memoize('skips', () => { const m = {}; for (const l of Object.values(S.ledger)) if (l.skip) m[l.kid + '|' + l.skip] = l; return m; })[kidId + '|' + key(d)] || null;
export const skipOn = (kidId, d) => !!skipEntry(kidId, d);
// Việc ai làm trước thì tính (c.claim): mỗi ngày là một việc của cả nhà. claimers: các con đã làm trong ngày d;
// takenBy: những con khác đã làm khi con này chưa làm; claimVal: tiền mỗi con nhận khi n con cùng làm.
export const claimers = (c, d) => c.claim ? (c.kids || []).filter(x => S.kids[x] && isDone(d, x, c.id)) : [];
export const takenBy = (c, kidId, d) => c.claim && !isDone(d, kidId, c.id) ? claimers(c, d).filter(x => x !== kidId) : [];
export const claimVal = (c, n) => n > 1 && choreVnd(c) ? Math.max(100, Math.round(choreVnd(c) / n)) : doneVal(c);
// Việc phải làm (bắt buộc) của con trong ngày d: tính vào tiến độ ngày, chuỗi ngày và thưởng làm đủ việc.
// Việc "ai làm trước thì tính" đã có con khác làm thì con này không phải làm nữa.
export const mustFor = (kidId, d) => { if (skipOn(kidId, d)) return []; const wk = key(weekStart(d)); return choresFor(kidId, d).filter(c => reqIn(c, kidId, wk) && !takenBy(c, kidId, d).length); };
// Nội dung xen kẽ: lần làm thứ n dùng variants[n % số nội dung].
export function variantOf(c, kid, d) {
  const v = (c.variants || []).map(x => String(x).trim()).filter(Boolean); if (!v.length) return '';
  const dk = key(d); let n = 0;
  for (const [k2, day] of Object.entries(S.done)) if (k2 < dk && Number(day?.[kid]?.[c.id]) > 0) n++;
  return v[n % v.length];
}
// Tính lại sau mỗi lần dữ liệu đổi (xoá trong render).
let memo = {};
export const memoize = (k, f) => (k in memo ? memo[k] : (memo[k] = f()));
export const clearMemo = () => { memo = {}; };
// Tiền kiếm được từ việc nhà, từ ngày a đến ngày b (khoá "YYYY-MM-DD", không bắt buộc).
export function earned(kidId, a = '', b = '9999') {
  let s = 0;
  for (const [dk, day] of Object.entries(S.done)) {
    if (dk < a || dk > b) continue;
    const m = day && day[kidId]; if (m) for (const [k2, v] of Object.entries(m)) if (!k2.includes('~')) s += doneVnd(v);
  }
  return s;
}
// Các tuần con làm đủ mọi việc phải làm: [{ ws, amount }]. Tuần hiện tại được tính khi đã đủ.
export function weekBonuses(kidId) {
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
export function dayBonuses(kidId) {
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
export const slotName = v => (SLOTS.find(x => x[0] === (v || '')) || SLOTS[3])[1];
// Tiền thưởng ngày đủ việc từ ngày a đến ngày b (khoá "YYYY-MM-DD").
export const dayBonusIn = (kidId, a = '', b = '9999') => dayBonuses(kidId).reduce((s, x) => s + (x.dk >= a && x.dk <= b ? x.amount : 0), 0);
// Tiền con được thưởng trong tuần chứa ngày d, tính tới hết ngày d: tiền việc nhà, thưởng ngày đủ việc, thưởng thêm,
// trừ phần đã bị phạt "mất tiền thưởng của tuần" trước đó (ledger.wipe = thứ Hai của tuần).
export function weekGain(kidId, d = today()) {
  const a = key(weekStart(d)), b = key(d);
  let s = earned(kidId, a, b) + dayBonusIn(kidId, a, b);
  for (const l of Object.values(S.ledger)) {
    if (l.kid !== kidId) continue;
    if (l.wipe === a) s += ledgerVnd(l);
    else if (l.kind === 'bonus' && l.at) { const lk = key(new Date(l.at)); if (lk >= a && lk <= b) s += ledgerVnd(l); }
  }
  return Math.max(0, s);
}
export function balance(kidId) {
  return memoize('bal' + kidId, () => {
    let s = earned(kidId);
    for (const l of Object.values(S.ledger)) if (l.kid === kidId) s += ledgerVnd(l);
    for (const w of weekBonuses(kidId)) s += w.amount;
    for (const x of dayBonuses(kidId)) s += x.amount;
    return s;
  });
}
export function weekStats(kid, ws) {
  let possible = 0, done = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(ws, i); for (const c of mustFor(kid.id, d)) if (!perWeekOf(c)) { possible++; if (isDone(d, kid.id, c.id)) done++; } }
  // Việc X lần mỗi tuần tính X lần, không tính theo từng ngày.
  for (const c of choresList()) if (perWeekOf(c) && (c.kids || []).includes(kid.id) && reqIn(c, kid.id, key(ws)) && (!c.since || c.since <= key(addDays(ws, 6)))) { const n = perWeekOf(c); possible += n; done += Math.min(n, weekCount(kid.id, c, addDays(ws, 6))); }
  return { possible, done };
}
// Ngày đủ việc: true / false, 'skip' (dùng phiếu nghỉ) hoặc 'none' (không có việc phải làm).
export const dayFull = (kidId, d) => { if (skipOn(kidId, d)) return 'skip'; const l = mustFor(kidId, d); return l.length ? l.every(c => isDone(d, kidId, c.id)) : 'none'; };
export const kidSince = kidId => { const k = S.kids[kidId]; const first = Object.keys(S.done).filter(dk => S.done[dk]?.[kidId]).sort()[0]; const a = k?.since && (!first || k.since < first) ? k.since : first; return a ? parse(a) : today(); };
// Chuỗi ngày liên tiếp làm đủ việc phải làm (ngày nghỉ, ngày không có việc thì bỏ qua). Hôm nay chưa xong thì chưa làm đứt chuỗi.
export function streakOf(kidId) {
  return memoize('st' + kidId, () => {
    const from = kidSince(kidId); let n = 0, d = today();
    if (dayFull(kidId, d) !== true) d = addDays(d, -1);
    for (let i = 0; i < 400 && d >= from; i++, d = addDays(d, -1)) { const f = dayFull(kidId, d); if (f === true) n++; else if (f === false) break; }
    return n;
  });
}
export const kidName = id => S.kids[id]?.name || 'Bé';
export const modeLabel = k => isDaily(k) ? (dayBonusOf(k) ? `mỗi ngày làm đủ việc được thưởng ${money(dayBonusOf(k))}` : 'không có thưởng ngày đủ việc') : weekBonusOf(k) ? `làm đủ việc cả tuần được thưởng ${money(weekBonusOf(k))}` : 'không có thưởng đủ tuần';
export function ageOf(k, at = today()) {
  if (!k.birthday) return null;
  const b = parse(k.birthday);
  let a = at.getFullYear() - b.getFullYear();
  if (at.getMonth() < b.getMonth() || (at.getMonth() === b.getMonth() && at.getDate() < b.getDate())) a--;
  return a >= 0 ? a : null;
}
export const isBirthday = (k, d) => { if (!k.birthday) return false; const b = parse(k.birthday); return b.getDate() === d.getDate() && b.getMonth() === d.getMonth(); };

// ---------- thời khoá biểu và mốc năm học ----------
export const tkbOf = kidId => { const t = S.timetables[kidId]; return t && Array.isArray(t.rows) ? t : null; };
export const tkbDays = t => (Array.isArray(t.days) && t.days.length ? t.days : [1, 2, 3, 4, 5]).map(Number).sort();
// Các tiết có môn trong một thứ, kèm giờ vào và giờ tan.
export function schoolDay(t, wd) {
  if (!t || !tkbDays(t).includes(wd)) return null;
  const list = t.rows.map((r, i) => ({ i, s: r.s, e: r.e, subj: String((r.d || {})[wd] || '').trim() })).filter(x => x.subj);
  if (!list.length) return null;
  return { list, start: list[0].s, end: list[list.length - 1].e, subjects: [...new Set(list.map(x => x.subj))] };
}
// Buổi học tiếp theo sau ngày d, bỏ qua những ngày nghỉ trong Mốc năm học.
export function nextSchool(t, d, kidId) {
  for (let i = 1; i <= 31; i++) {
    const x = addDays(d, i), info = kidId && holidayOn(kidId, x) ? null : schoolDay(t, x.getDay());
    if (info) return { date: x, info, label: i === 1 ? 'Ngày mai' : i < 7 ? WDN(x.getDay()) : `${WDN(x.getDay())} ${dm(x)}` };
  }
  return null;
}
export const eventsList = () => Object.entries(S.events || {}).map(([id, e]) => ({ id, ...e, to: e.to && e.to > e.from ? e.to : e.from }))
  .filter(e => e.from).sort((a, b) => a.from.localeCompare(b.from) || String(a.name).localeCompare(String(b.name), 'vi'));
const forKid = (e, kidId) => !(e.kids || []).length || e.kids.includes(kidId);
export const eventsOf = kidId => eventsList().filter(e => forKid(e, kidId));
export const holidayOn = (kidId, d) => { const dk = key(d); return eventsOf(kidId).find(e => e.kind === 'holiday' && e.from <= dk && dk <= e.to) || null; };
export const schoolOn = (kidId, d) => holidayOn(kidId, d) ? null : schoolDay(tkbOf(kidId), d.getDay());

// ---------- học thêm ----------
// Mỗi buổi học thêm là một mục riêng: { kid, day: 0..6, s, e, name }.
export const lessonsList = () => Object.entries(S.lessons || {}).map(([id, l]) => ({ id, ...l, day: Number(l.day) }))
  .filter(l => S.kids[l.kid] && toMin(l.s) !== null && toMin(l.e) !== null)
  .sort((a, b) => WEEK_ORDER.indexOf(a.day) - WEEK_ORDER.indexOf(b.day) || toMin(a.s) - toMin(b.s) || (S.kids[a.kid].order ?? 0) - (S.kids[b.kid].order ?? 0));
export const lessonsOf = kidId => lessonsList().filter(l => l.kid === kidId);
export const lessonsOn = (kidId, wd) => lessonsOf(kidId).filter(l => l.day === wd);
export const lessonMin = l => Math.max(0, toMin(l.e) - toMin(l.s));

// ---------- các con ở đâu ----------
// stays: id = thứ ("0".."6"), { day: ban ngày ở đâu (bỏ trống = đi học / như buổi tối), night: tối ngủ ở đâu }.
export const placeName = p => { const v = String(p || '').normalize('NFC').trim().replace(/\s+/g, ' '); return (PLACE_ALIAS.find(([re]) => re.test(v)) || [, v])[1]; };
// Viết thường chữ "nhà" ở giữa câu, giữ nguyên tên riêng ("6th Element").
export const placeLow = p => placeName(p).replace(/^nhà(?=\s)/i, 'nhà');
export const placeNames = () => [...new Set([...PLACE_NAMES, ...Object.values(S.stays || {}).flatMap(x => [x.day, x.night]), ...lessonsList().map(l => l.at)]
  .map(placeName).filter(Boolean))];
// Những nơi các con ở trong ngày d: buổi sáng (chỗ ngủ đêm qua, hoặc chỗ ghi ban ngày) và buổi tối. Chưa ghi lịch thì trả về [].
const placesOn = d => { const st = stayInfo(d.getDay()); return st ? [...new Set([st.day || st.from, st.night].filter(Boolean).map(x => x.toLowerCase()))] : []; };
// Việc chỉ làm ở một nơi (c.place): chỉ hiện vào ngày các con ở đó. Ngày chưa ghi các con ở đâu thì vẫn hiện.
const placeOk = (c, d) => { const p = placeName(c.place).toLowerCase(), on = p ? placesOn(d) : []; return !p || !on.length || on.includes(p); };
const stayOf = wd => { const x = (S.stays || {})[String(wd)]; return x && (x.day || x.night) ? x : null; };
export const hasStays = () => [0, 1, 2, 3, 4, 5, 6].some(stayOf);
export const shortPlace = p => placeName(p).replace(/^nhà\s+/i, '').replace(/^./, c => c.toUpperCase());
// Thông tin trong ngày: ban ngày, buổi tối, và có đổi nhà so với tối hôm trước không.
export function stayInfo(wd) {
  const x = stayOf(wd); if (!x) return null;
  const prev = stayOf((wd + 6) % 7), night = placeName(x.night), day = placeName(x.day), from = placeName(prev?.night);
  const moved = !!(night && from && from.toLowerCase() !== night.toLowerCase());
  return { day, night, moved, from };
}
// Con đang ở đâu lúc này: tối (từ 17:00) ở chỗ ngủ đêm nay, ban ngày ở chỗ ghi ban ngày, nếu không ghi thì vẫn ở chỗ ngủ đêm qua.
export function stayNow(wd) {
  const st = stayInfo(wd); if (!st) return null;
  const evening = nowMin() >= 17 * 60, here = evening ? st.night || st.day : st.day || st.from || st.night;
  return here ? { here, next: !evening && st.night && st.night.toLowerCase() !== here.toLowerCase() ? st.night : '' } : null;
}
// Hôm nay: "📍 Đang ở 6th Element · tối nay về nhà ông bà". Ngày khác: "📍 Ở 6th Element", ngày đổi nhà "🔁 Về nhà ông bà".
export function stayLine(wd, isToday = false) {
  const st = stayInfo(wd); if (!st) return '';
  if (isToday) { const n = stayNow(wd); return n ? `📍 Đang ở ${placeLow(n.here)}${n.next ? ` · tối nay về ${placeLow(n.next)}` : ''}` : ''; }
  const where = st.night || st.day; if (!where) return '';
  return `${st.moved ? '🔁 Về' : '📍 Ở'} ${placeLow(where)}${st.day && st.night && st.day.toLowerCase() !== st.night.toLowerCase() ? ` (ban ngày ở ${placeLow(st.day)})` : ''}`;
}

// ---------- dòng thời gian trong ngày ----------
export const SLOTS = [['sang', 'Buổi sáng', '🌅'], ['chieu', 'Buổi chiều', '☀️'], ['toi', 'Buổi tối', '🌙'], ['', 'Lúc nào cũng được', '🕒']];
export const slotAt = m => m < 12 * 60 ? 'sang' : m < 18 * 60 ? 'chieu' : 'toi';
export const choreSlot = c => toMin(c.time) !== null ? slotAt(toMin(c.time)) : (c.slot || '');

// ---------- vẽ lại màn hình, con đang xem ----------
let raf = 0;
// Hàm vẽ cả màn hình do phần khởi động đặt (setDraw), để phần lõi không phải import các màn.
let drawFn = () => {};
export const setDraw = f => { drawFn = f; };
export const render = () => { memo = {}; cancelAnimationFrame(raf); raf = requestAnimationFrame(drawFn); };
// Màn Hôm nay xem từng con một: chọn con ở hàng trên cùng, máy nhớ lần chọn gần nhất.
export const TODAY_KID = 'misa-misu-today-kid';
export function todayKid(kids = kidsList()) {
  if (!S.kids[UI.todayKid]) { let v = null; try { v = localStorage.getItem(TODAY_KID); } catch (e) {} UI.todayKid = S.kids[v] ? v : kids[0]?.id || null; }
  return kids.find(k => k.id === UI.todayKid) || kids[0] || null;
}

// ---------- máy của ai: bố mẹ hay con ----------
// Nhà đặt mã PIN bố mẹ thì mỗi máy phải chọn một lần: máy của bố mẹ (nhập PIN, thấy và sửa mọi thứ) hay máy của một con
// (chỉ thấy phần của con đó, kiểu Chế độ cho bé, không thêm, sửa, xoá được gì). Mã PIN lưu dạng băm trong nhóm `paid`
// (nhóm cũ không còn dùng, đã có sẵn trong Rules nên không phải dán lại Rules).
// Đây là khoá ở giao diện: ai có mã gia đình vẫn đọc được dữ liệu trên Firestore, nên không thay cho việc giữ kín link mời.
export const SETTINGS_ID = 'caidat';
export const pinHash = () => S.paid?.[SETTINGS_ID]?.pin || null;
// 'parent': toàn quyền. Mã của một con: máy của con đó. 'ask': nhà có PIN mà máy này chưa chọn. 'wait': máy của con, đang chờ dữ liệu.
export function deviceRole() {
  const r = getRole(), kid = r && r !== 'parent';
  if (!loaded) return kid ? 'wait' : 'parent';
  if (!pinHash()) return kid && stale ? 'wait' : 'parent';
  if (r === 'parent') return 'parent';
  return kid && S.kids[r] ? r : 'ask';
}

// iPhone/iPad: app trên màn hình chính có bộ nhớ riêng, tách khỏi Safari, nên phải mang mã gia đình (và mã của con,
// nếu là máy của con) theo địa chỉ mở app. Giữ ?gd=...&con=... trên thanh địa chỉ; iOS không được nạp manifest
// (xem phần khởi động trong app.js) nên "Thêm vào MH chính" lưu đúng địa chỉ đang hiện và biểu tượng mở thẳng vào gia đình, đúng phần của con.
export function keepFamilyInUrl() {
  if (!family) return;
  const r = getRole(), url = location.origin + location.pathname + '?gd=' + encodeURIComponent(family) + (r && r !== 'parent' ? '&con=' + encodeURIComponent(r) : '');
  if (location.origin + location.pathname + location.search !== url) history.replaceState(null, '', url + location.hash);
}
