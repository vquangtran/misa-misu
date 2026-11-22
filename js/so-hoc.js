// Sổ học của cô: danh sách sổ của nhà, trang sổ học, học phí, bài cô giao, màn của cô (?lop=), file đính kèm, nhập từ file Excel.
import { firebaseConfig } from './config.js';
import { icon, iconify, iconSvg } from './icons.js';
import { firebaseClass, localClass } from './store.js';
import { excelDate, readXlsx } from './xlsx.js';
import { $, addDays, CHEV, dateTxt, daysBetween, daysTo, dm, DOWN, dueLabel, durTxt, esc, key, money, monthTxt, norm, pad, parse, PLUS, PREV,
  printHtml, toast, today, toMin, uid, WDS } from './chung.js';
import { FIXED_SCHED, isSuTV, SU_TV_BOOK } from './nha-minh.js';
import { againVnd, del, deviceRole, kidName, kidsList, lessonsList, lessonsOf, loaded, penaltyTimes, pricesList, priceVnd, put, render, RO, S, stale,
  TEACH, UI, writeErr } from './du-lieu.js';
import { addBtn, ava, barCount, blankAdd, brand, lessonIcon, moreBtn, pillBar, secHead, secIsOpen, subjDot } from './giao-dien.js';
import { closeModal, formFoot, frow, kidRow, onCloseModal, openModal, pillNum, pillSel, titleCard, toggle } from './form.js';
import { HW_PENALTY } from './quy-dinh.js';

// ---------- sổ học của cô ----------
// Mỗi cô dạy thêm có một sổ học riêng cho một con, một môn. Bố mẹ tạo sổ ở Học tập → Học thêm rồi gửi link riêng cho cô.
// Cô mở link (…?lop=<mã lớp>) là vào thẳng màn của cô: ghi từng buổi học (nội dung, nhận xét, tài liệu), giao bài tập kèm file,
// nhận bài và cho điểm. Máy của cô chỉ biết mã lớp nên không đọc được gì khác của gia đình (xem js/store.js).
// Bài cô giao tự hiện trong phần Bài tập của con (tab Bài tập, màn Hôm nay, máy của con); con tick xong thì cô thấy ngay.
export const CLS = {};     // mã lớp → { st: nơi lưu, data: { info, sessions, tasks }, loaded, err }
const LOP_KEY = 'misa-misu-lop';
export const getLop = () => { try { return localStorage.getItem(LOP_KEY); } catch (e) { return null; } };
export const setLop = v => { try { localStorage.setItem(LOP_KEY, v); } catch (e) {} };
const emptySo = () => ({ info: {}, sessions: {}, tasks: {} });
export const soOf = code => CLS[code]?.data || emptySo();
// Lịch cố định của sổ theo tên con và môn (FIXED_SCHED ở nha-minh.js), không có thì null.
export const fixedFor = (kidNm, subj) => FIXED_SCHED.find(f => f.kids.includes(norm(kidNm)) && norm(subj) === f.subj) || null;
// Thứ và giờ học của sổ: lịch cố định có ghi giờ thì theo lịch cố định (giờ cô dạy do nhà báo, đúng nhất);
// không thì theo lịch học thêm nhà đã ghi; chưa có nữa thì theo các thứ trong lịch cố định.
const schedSlots = info => { const f = fixedFor(info?.student, info?.name);
  const fixed = (f?.dur || []).map((m, day) => m ? { day, s: f.time?.[day]?.[0] || '', e: f.time?.[day]?.[1] || '' } : null).filter(Boolean);
  return f?.time ? fixed : info?.days?.length ? info.days : fixed; };
// Màn của cô đọc thông tin lớp (có student): sổ chưa được máy bố mẹ ghi dur thì vẫn dùng thời lượng theo lịch cố định.
const durOf = x => Array.isArray(x?.dur) ? [0, 1, 2, 3, 4, 5, 6].map(i => Math.max(0, Math.round(Number(x.dur[i]) || 0)))
  : x?.student && fixedFor(x.student, x.name) ? fixedFor(x.student, x.name).dur.slice() : [0, 0, 0, 0, 0, 0, 0];
// Danh sách sổ học của nhà, lưu trong nhóm `paid` với id "lop-…" (nhóm này đã có trong Rules).
export const classesList = () => Object.entries(S.paid || {}).filter(([id, c]) => id.startsWith('lop-') && c && c.code && S.kids[c.kid]).map(([id, c]) => ({ id, ...c }))
  .sort((a, b) => (S.kids[a.kid].order ?? 0) - (S.kids[b.kid].order ?? 0) || String(a.at || '').localeCompare(String(b.at || '')) || String(a.name).localeCompare(String(b.name), 'vi'));
export const classesOf = kidId => classesList().filter(c => c.kid === kidId);
// Buổi học thêm của con trùng môn với sổ (ví dụ sổ "Toán" và buổi "Gia sư Toán"): lấy lịch để đặt hạn nộp vào buổi tới.
export const classLessons = c => lessonsOf(c.kid).filter(l => { const a = norm(l.name), b = norm(c.name); return a && b && (a.includes(b) || b.includes(a)); });
const classSubj = c => classLessons(c)[0]?.name || c.name;
// Gợi ý tạo sổ từ các buổi học thêm đã ghi: mỗi môn của mỗi con chưa có sổ là một nút, bấm là mở form đã điền sẵn môn và con.
const classOffers = ks => ks.flatMap(k => [...new Set(lessonsOf(k.id).map(l => String(l.name || '').trim()).filter(Boolean))]
  .filter(n => !classesOf(k.id).some(c => classLessons(c).some(l => norm(l.name) === norm(n)))).map(n => ({ kid: k.id, name: n }))).slice(0, 8);
// Màn của cô đọc thông tin lớp (có student). Sổ Tiếng Việt của Su chưa được máy bố mẹ ghi tên sổ (book chưa có) thì vẫn hiện tên mới.
export const bookName = c => String(c?.book || '').trim() || (c?.book === undefined && c?.student && isSuTV(c.student, c.name) ? SU_TV_BOOK : `Nhật ký học ${c?.name || ''}`.trim());
export const classTitle = c => `${bookName(c)}${c.teacher ? ' · ' + c.teacher : ''}`;
const teacherLink = code => location.origin + location.pathname + '?lop=' + encodeURIComponent(code);
// Học phí do bố mẹ ghi ở sổ: fee (đồng), feeBy 'buoi' = mỗi buổi, 'gio' = mỗi giờ; feeOn: mức riêng cho buổi Online (0 = như buổi thường).
// Chép sang sổ để màn của cô tính cùng một con số.
// feeOff: tạm ẩn cả phần học phí của sổ này (bảng số buổi và học phí theo tháng), ở màn của cô, phần bố mẹ xem và bản in.
export const feeOf = x => ({ fee: Math.max(0, Math.round(Number(x?.fee) || 0)), on: Math.max(0, Math.round(Number(x?.feeOn) || 0)), by: x?.feeBy === 'gio' ? 'gio' : 'buoi', off: !!x?.feeOff });
// Học phí của một buổi: buổi cô ghi là Online thì tính mức Online (nếu có), còn lại tính mức thường.
const sessFee = (f, s) => { const rate = s.mode === 'on' && f.on ? f.on : f.fee; return f.by === 'gio' ? rate * (Number(s.mins) || 0) / 60 : rate; };
const feeTxt = f => { const u = f.by === 'gio' ? 'giờ' : 'buổi'; return !f.off && (f.fee || f.on) ? (f.on ? `${money(f.fee)} mỗi ${u} Offline, ${money(f.on)} mỗi ${u} Online` : `${money(f.fee)} mỗi ${u}`) : ''; };
const classInfo = c => ({ name: c.name, book: String(c.book || '').trim(), teacher: c.teacher || '', student: kidName(c.kid), fee: feeOf(c).fee, feeOn: feeOf(c).on, feeBy: feeOf(c).by, feeOff: feeOf(c).off, days: classLessons(c).map(l => ({ day: Number(l.day) || 0, s: l.s || '', e: l.e || '' })).sort((a, b) => a.day - b.day || String(a.s).localeCompare(String(b.s))), dur: durOf(c) });

// Việc làm thêm mỗi khi một sổ có dữ liệu (sửa dữ liệu một lần trong js/mot-lan.js), thêm vào bằng onSoData.
const soHooks = [];
export const onSoData = f => { soHooks.push(f); };
export function openClass(code) {
  if (CLS[code]) return CLS[code];
  const c = CLS[code] = { st: null, data: emptySo(), loaded: false, stale: false, err: null };
  const onData = (d, meta) => { if (CLS[code] !== c) return; c.data = d; c.loaded = true; c.stale = !!meta.fromCache; render(); classHeal(code); hwPenSync(code); for (const f of soHooks) f(code); };
  const fail = err => { if (CLS[code] !== c) return; console.error(err); c.err = err; c.loaded = true; render(); };
  (firebaseConfig ? firebaseClass(firebaseConfig, 'lop-' + code, onData, fail) : Promise.resolve(localClass('lop-' + code, onData)))
    .then(st => { if (CLS[code] !== c) return; c.st = st; st.start(); }).catch(fail);
  setTimeout(() => { if (CLS[code] === c && !c.loaded) { c.loaded = true; c.stale = true; render(); } }, 10000);
  return c;
}
// Máy của nhà: mở sổ của các lớp đang có, đóng sổ của lớp đã xoá.
export function syncClasses() {
  if (TEACH) return;
  const want = new Set(classesList().map(c => c.code));
  for (const code of want) { openClass(code); classHeal(code); hwPenSync(code); for (const f of soHooks) f(code); }
  for (const code of Object.keys(CLS)) if (!want.has(code)) { CLS[code].st?.stop(); delete CLS[code]; }
}
// Tên môn, tên cô, tên con và lịch học trong sổ là do nhà ghi. Máy của bố mẹ thấy lệch (đổi tên con, đổi lịch học thêm) thì ghi lại.
const HEALED = {};           // mã lớp → thông tin lớp đã ghi lần gần nhất (xem classHeal)
export const CLS_GONE = new Set();   // sổ đang bị xoá: không ghi lại thông tin lớp nữa
function classHeal(code) {
  if (TEACH || CLS_GONE.has(code) || !loaded || stale || deviceRole() !== 'parent') return;
  const c = classesList().find(x => x.code === code), k = CLS[code];
  if (!c || !k || !k.loaded || k.stale || k.err || !k.st) return;
  const want = classInfo(c), have = k.data.info.lop, ws = JSON.stringify(want);
  // Firestore trả các trường của một mục theo thứ tự bảng chữ cái, khác thứ tự lúc ghi, nên từng buổi trong days phải dựng lại đúng thứ tự mới so được.
  // So lệch thứ tự thì lần nào cũng thấy "khác", ghi lại, nhận về, lại ghi: vòng lặp làm app vẽ lại liên tục, không bấm được gì và đốt hết hạn mức ghi.
  const days = (Array.isArray(have?.days) ? have.days : []).map(d => ({ day: Number(d?.day) || 0, s: d?.s || '', e: d?.e || '' }));
  if (have && ws === JSON.stringify({ name: have.name, book: String(have.book || '').trim(), teacher: have.teacher || '', student: have.student, fee: feeOf(have).fee, feeOn: feeOf(have).on, feeBy: feeOf(have).by, feeOff: feeOf(have).off, days, dur: durOf({ dur: have.dur }) })) return;
  // Chốt chặn: cùng một nội dung chỉ ghi một lần. Ghi rồi mà dữ liệu nhận về vẫn khác thì không ghi nữa, để không bao giờ lặp.
  if (HEALED[code] === ws) return;
  HEALED[code] = ws; clsPut(code, 'info', 'lop', want);
}
// Cô tick bài tập buổi trước là Thiếu hoặc Không làm: máy của bố mẹ tự trừ tiền của con theo mục phạt Thiếu BTVN (lần 2 trong tuần phạt nặng hơn).
// Mỗi bài phạt một lần: mã khoản phạt cố định theo sổ và bài (hai máy cùng ghi vẫn chỉ ra một khoản), bài đã phạt được đánh dấu trong sổ (hwPen)
// nên bố mẹ Huỷ khoản phạt trong lịch sử thì app không phạt lại. Cô đổi lại thành Hoàn thành thì khoản phạt được xoá.
const HW_PEN_SEEN = new Set();   // "mã lớp~mã bài~tình trạng" đã xử lý trên máy này, chờ dữ liệu ghi xong quay về
let hwPenBusy = false;            // ghi vào kho trên máy gọi lại hàm này ngay lập tức: chặn để không tính lặp
function hwPenSync(code) {
  if (hwPenBusy || TEACH || !loaded || stale || deviceRole() !== 'parent') return;
  const c = classesList().find(x => x.code === code), k = CLS[code];
  if (!c || !k || !k.loaded || k.stale || k.err) return;
  const pr = S.rewards[HW_PENALTY[0]]?.kind === 'penalty' ? { id: HW_PENALTY[0], ...S.rewards[HW_PENALTY[0]] } : pricesList('penalty').find(r => norm(r.name) === norm(HW_PENALTY[1].name));
  const marks = { ...(c.hwPen || {}) }, ops = [], fined = [];
  let n = pr ? penaltyTimes(pr.id, c.kid) : 0;
  for (const t of hwList(k.data)) {
    const miss = !!(t.got && t.chk && t.chk !== 'du'), lid = `hw-${code}-${t.id}`, seen = `${code}~${t.id}~${miss ? 1 : 0}`;
    if (miss === !!marks[t.id] || HW_PEN_SEEN.has(seen)) continue;
    if (miss) {
      if (!pr || pr.all || pr.week || S.ledger[lid]) continue;
      const amt = againVnd(pr) && n ? againVnd(pr) : priceVnd(pr), no = n + 1;
      ops.push(() => put('ledger', lid, { kid: c.kid, amount: -amt, kind: 'penalty', icon: pr.icon || '📕', note: `${pr.name}${againVnd(pr) ? ` (lần ${no} trong tuần)` : ''}: ${t.title} · ${CHK[t.chk]} · ${c.teacher || c.name}`, rid: pr.id, at: new Date().toISOString() }));
      marks[t.id] = 1; n++; fined.push(amt);
    } else { if (S.ledger[lid]) ops.push(() => del('ledger', lid)); delete marks[t.id]; }
    HW_PEN_SEEN.add(seen);
  }
  if (!ops.length && JSON.stringify(marks) === JSON.stringify(c.hwPen || {})) return;
  const { id, ...rest } = c;
  hwPenBusy = true;
  try { ops.forEach(f => f()); put('paid', id, { ...rest, hwPen: marks }); } finally { hwPenBusy = false; }
  if (fined.length) toast(`${c.teacher || 'Cô'} báo ${kidName(c.kid)} thiếu BTVN: đã trừ ${money(fined.reduce((a, x) => a + x, 0))} theo mục phạt ${pr.name}.`);
}
// Ghi vào sổ: sửa luôn bản đang giữ trên máy để màn hình đổi ngay, rồi mới gửi đi.
function clsWrite(code, op, col, id, data) {
  const k = CLS[code];
  if (!k || !k.st) { toast('Sổ học đang mở, thử lại sau giây lát.'); return false; }
  const cur = k.data[col] || (k.data[col] = {});
  if (op === 'del') delete cur[id]; else cur[id] = op === 'patch' ? { ...(cur[id] || {}), ...data } : data;
  Promise.resolve(op === 'del' ? k.st.del(col, id) : k.st[op](col, id, data)).catch(writeErr);
  render();
  return true;
}
export const clsPut = (code, col, id, data) => clsWrite(code, 'put', col, id, data);
export const clsPatch = (code, col, id, data) => clsWrite(code, 'patch', col, id, data);
export const clsDel = (code, col, id) => clsWrite(code, 'del', col, id);

// Sổ học do người ngoài nhà (cô, hoặc ai đó có link của cô) ghi, nên đọc ra là lọc lại: mã chỉ gồm chữ và số, ngày đúng dạng,
// danh sách file và các bước đúng kiểu. Nhờ vậy dữ liệu lạ trong sổ không chen được gì vào trang của nhà.
export const okId = v => typeof v === 'string' && /^[\w-]{1,40}$/.test(v), okDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '';
export const cleanFiles = l => (Array.isArray(l) ? l : []).filter(f => f && okId(f.id)).slice(0, 10).map(f => ({ id: f.id, n: Math.min(20, Math.max(1, Math.round(Number(f.n)) || 1)), name: String(f.name || 'file').slice(0, 120), type: String(f.type || '').slice(0, 100), size: Math.max(0, Number(f.size) || 0) }));
export const cleanSteps = l => (Array.isArray(l) ? l : []).filter(x => x && typeof x.t === 'string' && x.t).slice(0, 15).map(x => ({ t: x.t.slice(0, 200), done: !!x.done }));
// Buổi học xếp theo ngày, buổi chưa có ngày (kế hoạch) nằm cuối; số buổi đếm theo thứ tự đó.
export function sessList(d) {
  return Object.entries(d.sessions || {}).filter(([id, s]) => okId(id) && s).map(([id, s]) => ({ id, ...s, topic: String(s.topic || ''), date: okDate(s.date), files: cleanFiles(s.files) })).filter(s => s.topic || s.date || s.content)
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || String(a.at || '').localeCompare(String(b.at || ''))).map((s, i) => ({ ...s, no: i + 1 }));
}
export const hwList = d => Object.entries(d.tasks || {}).filter(([id, t]) => okId(id) && t).map(([id, t]) => ({ id, ...t, title: String(t.title || ''), due: okDate(t.due), doneAt: okDate(t.doneAt), gotAt: okDate(t.gotAt),
  session: okId(t.session) ? t.session : '', sub: cleanFiles(t.sub), subAt: okDate(t.subAt), chk: CHK[t.chk] ? t.chk : '', chkBy: okId(t.chkBy) ? t.chkBy : '', score: String(t.score || '').slice(0, 30), steps: cleanSteps(t.steps), files: cleanFiles(t.files) })).filter(t => t.title)
  .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || String(a.at || '').localeCompare(String(b.at || '')));
const SESS_MODES = [['', 'Chưa ghi'], ['off', 'Offline'], ['on', 'Online']];
// Tên buổi học lấy theo ngày học, cô không phải gõ tên. Buổi ghi từ bản trước có tên riêng (topic) thì vẫn giữ tên đó.
export const sessDayTitle = dk => dk ? `Buổi học ngày ${dm(parse(dk))}/${dk.slice(0, 4)}` : 'Buổi học chưa có ngày';
const sessName = s => s.topic || (s.date ? dateTxt(s.date) : 'Chưa có ngày');
const sessMeta = s => [s.topic ? (s.date ? dateTxt(s.date) : 'chưa có ngày') : '', (SESS_MODES.find(x => x[0] === s.mode && x[0]) || [])[1], Number(s.mins) ? durTxt(Number(s.mins)) : ''].filter(Boolean).join(' · ');
// Bài cô giao đang ở bước nào: cô đã nhận (kèm điểm), con báo đã làm xong, quá hạn, hay mới giao.
export function hwState(t) {
  if (t.got) return { k: 'got', txt: `${t.chk ? CHK[t.chk].toLowerCase() : 'cô đã nhận'}${t.score ? ' · ' + t.score : ''}` };
  if (t.done) return { k: 'done', txt: `con báo đã xong${t.doneAt ? ' ' + dm(parse(t.doneAt)) : ''}` };
  if (t.due && daysTo(t.due) < 0) return { k: 'late', txt: `quá hạn ${-daysTo(t.due)} ngày` };
  return { k: 'open', txt: t.due ? `hạn ${dueLabel(t.due)}` : 'chưa có hạn' };
}
// Ngày học tới của lớp: theo lịch học thêm nhà đã ghi, không có thì lấy buổi kế hoạch gần nhất đã có ngày.
// Hạn nộp bài giao trong buổi ngày dk: buổi học tới sau ngày đó theo lịch học thêm; đã qua thì lấy buổi học tới tính từ hôm nay.
export function hwDueAfter(d, dk) {
  const days = schedSlots(d.info.lop).map(x => Number(x.day)), base = dk ? parse(dk) : today();
  for (let i = 1; days.length && i <= 14; i++) { const x = addDays(base, i); if (days.includes(x.getDay())) return key(x) > key(today()) ? x : nextClassDay(d); }
  return nextClassDay(d);
}
export function nextClassDay(d) {
  const days = schedSlots(d.info.lop).map(x => Number(x.day)), t = today();
  for (let i = 1; days.length && i <= 14; i++) if (days.includes(addDays(t, i).getDay())) return addDays(t, i);
  const nx = sessList(d).find(s => s.date && s.date > key(t));
  return nx ? parse(nx.date) : null;
}
// Bài cô giao, đổi sang dạng bài tập của nhà để hiện chung với bài bố mẹ và con tự ghi. id "L~<mã lớp>~<mã bài>".
// hwFrom (do nhà ghi ở sổ): bài có hạn nộp trước ngày này không hiện ở phần của con và màn Hôm nay (vẫn còn trong sổ của cô),
// để bài cũ nhập từ file không hiện quá hạn. Sổ Tiếng Việt của Su: chỉ tính bài từ ngày 22/11/2026.
export const classTasks = () => classesList().flatMap(c => hwList(soOf(c.code)).filter(t => !c.hwFrom || !t.due || t.due >= c.hwFrom).map(t => ({ id: `L~${c.code}~${t.id}`, kid: c.kid, title: t.title, kind: 'bt', subj: classSubj(c), due: t.due || '', notes: t.notes || '',
  steps: t.steps, done: !!(t.done || t.got), doneAt: t.doneAt || t.gotAt || '', cls: c, hw: t })));

// ----- file đính kèm -----
// File nằm trong sổ của lớp, cắt khúc (xem js/store.js). Ảnh được thu nhỏ trước khi tải lên.
const FILE_MAX = 8 * 1024 * 1024;
const fileSize = n => n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const fileIcon = f => /^image\//.test(f.type) ? '🖼️' : /pdf/.test(f.type) ? '📕' : /word|document|text/.test(f.type) ? '📘' : /sheet|excel|csv/.test(f.type) ? '📊' : /presentation|powerpoint/.test(f.type) ? '📙' : '📎';
// Chỉ nhận link http(s), mỗi dòng (hoặc cách nhau bằng dấu cách) một link.
export const linkList = v => (Array.isArray(v) ? v : String(v || '').split(/\s+/)).map(x => String(x).trim()).filter(x => /^https?:\/\/\S+$/i.test(x)).slice(0, 10);
const linkHost = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
const fileAttr = (code, f) => `data-code="${esc(code)}" data-fid="${esc(f.id)}" data-n="${Number(f.n) || 1}" data-name="${esc(f.name)}" data-type="${esc(f.type || '')}" data-size="${Number(f.size) || 0}"`;
function attView(code, files, links) {
  const fs = cleanFiles(files), ls = linkList(links);
  return fs.length || ls.length ? `<div class="atts">${fs.map(f => `<button class="att" data-act="file-open" ${fileAttr(code, f)}>${fileIcon(f)}<span>${esc(f.name)}</span><i class="num">${fileSize(f.size)}</i></button>`).join('')}${ls.map(u => `<a class="att" href="${esc(u)}" target="_blank" rel="noopener noreferrer">🔗<span>${esc(linkHost(u))}</span></a>`).join('')}</div>` : '';
}
// Loại file được mở ngay trong trình duyệt. Loại khác chỉ cho tải về, để một file lạ không chạy được trong trang của app.
const FILE_SHOW = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
// Bài con nộp: ảnh hiện thu nhỏ (bấm để xem to), file khác hiện như đính kèm. canDel: còn bỏ được file (cô chưa nhận bài).
// Ảnh vẽ vào <canvas> sau khi mở form (loadThumbs), nên HTML của form không đổi theo ảnh. Ảnh đã tải giữ trong phiên để vẽ lại form không tải lại.
const THUMB = new Map(), THUMB_BUSY = new Set();   // mã file → ImageBitmap; file đang tải
const isImg = f => FILE_SHOW.includes(f.type) && f.type.startsWith('image/');
function subFiles(code, tid, files, canDel) {
  const imgs = files.filter(isImg), rest = files.filter(f => !isImg(f));
  const del = f => canDel ? `<button class="att-x" data-act="sub-del" data-id="${esc(tid)}" data-fid="${esc(f.id)}" aria-label="Bỏ file: ${esc(f.name)}">×</button>` : '';
  return (imgs.length ? `<div class="sub-thumbs">${imgs.map((f, i) => `<div class="sub-thumb"><button class="sub-img" data-act="file-open" ${fileAttr(code, f)} aria-label="Xem ảnh ${i + 1}: ${esc(f.name)}"><canvas width="240" height="240" data-thumb="${esc(code)}" data-fid="${esc(f.id)}" data-n="${Number(f.n) || 1}" data-type="${esc(f.type)}"></canvas><i class="num">${i + 1}</i></button>${del(f)}</div>`).join('')}</div>` : '')
    + (rest.length ? `<div class="atts">${rest.map(f => `<div class="att-row"><button class="att" data-act="file-open" ${fileAttr(code, f)}>${fileIcon(f)}<span>${esc(f.name)}</span><i class="num">${fileSize(f.size)}</i></button>${del(f)}</div>`).join('')}</div>` : '');
}
// Vẽ ảnh thu nhỏ (cắt vuông giữa ảnh) vào các canvas của bài con nộp đang hiện.
function loadThumbs() {
  const draw = (cv, bmp) => { const s = Math.min(bmp.width, bmp.height), cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, cv.width, cv.height); };
  for (const cv of document.querySelectorAll('#modal canvas[data-thumb]')) {
    const id = cv.dataset.fid, st = CLS[cv.dataset.thumb]?.st;
    if (THUMB.has(id)) { draw(cv, THUMB.get(id)); continue; }
    if (!st || !window.createImageBitmap || THUMB_BUSY.has(id)) continue;
    THUMB_BUSY.add(id);
    st.getFile(id, Number(cv.dataset.n) || 1).then(parts => createImageBitmap(new Blob(parts, { type: cv.dataset.type })))
      .then(bmp => { THUMB.set(id, bmp); for (const x of document.querySelectorAll(`#modal canvas[data-thumb][data-fid="${id}"]`)) draw(x, bmp); })
      .catch(e => console.error(e)).finally(() => THUMB_BUSY.delete(id));
  }
}
export async function fileOpen(code, f) {
  const st = CLS[code]?.st; if (!st) return toast('Sổ học đang mở, thử lại sau giây lát.');
  toast('Đang tải file…');
  let url;
  try {
    const type = FILE_SHOW.includes(f.type) ? f.type : 'application/octet-stream';
    url = URL.createObjectURL(new Blob(await st.getFile(f.id, f.n), { type }));
    const img = type.startsWith('image/'), el = document.createElement('div');
    el.className = 'fv'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', f.name);
    el.innerHTML = `<div class="fv-bar"><b>${esc(f.name)}</b><a class="btn quiet sm" href="${url}" download="${esc(f.name)}">Tải về</a>${type === 'application/pdf' ? `<a class="btn quiet sm" href="${url}" target="_blank" rel="noopener">Mở</a>` : ''}<button class="btn primary sm" data-fv="close">Đóng</button></div>
      <div class="fv-body">${img ? `<img src="${url}" alt="${esc(f.name)}">` : `<div class="card empty"><div class="big">${fileIcon(f)}</div><h2>${esc(f.name)}</h2><p class="muted">${fileSize(f.size)} · bấm Tải về để lưu vào máy${type === 'application/pdf' ? ', hoặc Mở để xem ngay' : ''}.</p></div>`}</div>`;
    const close = () => { el.remove(); URL.revokeObjectURL(url); document.removeEventListener('keydown', onKey, true); };
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    el.addEventListener('click', e => { if (e.target === el || e.target.closest('[data-fv]') || e.target.classList.contains('fv-body')) close(); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(el); iconify(el);
    $('#toast').hidden = true;
  } catch (e) {
    console.error(e); if (url) URL.revokeObjectURL(url);
    toast(e?.code === 'not-found' ? 'File này không còn nữa.' : 'Chưa tải được file. Kiểm tra mạng rồi thử lại.');
  }
}
// Ảnh chụp bằng điện thoại thường 3–5 MB: thu về cạnh dài 2000px, JPEG, còn vài trăm KB mà vẫn đọc rõ chữ.
async function shrinkImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400 * 1024 || !window.createImageBitmap) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }), sc = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc);
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(bmp, 0, 0, cv.width, cv.height);
    const blob = await new Promise(ok => cv.toBlob(ok, 'image/jpeg', 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.(png|webp|jpe?g)$/i, '') + '.jpg', { type: 'image/jpeg' });
  } catch (e) { return file; }
}
// Form đang mở giữ danh sách file ở đây. added: file vừa tải lên trong lần mở form này (bấm Huỷ thì xoá lại).
export let ATT = null;
function attStart(code, files) { ATT = { code, files: cleanFiles(files), added: [], busy: 0 }; }
function attHtml() {
  const a = ATT; if (!a) return '';
  return `${a.files.map(f => `<div class="att-row"><button class="att" data-act="file-open" ${fileAttr(a.code, f)}>${fileIcon(f)}<span>${esc(f.name)}</span><i class="num">${fileSize(f.size)}</i></button><button class="att-x" data-act="att-del" data-fid="${esc(f.id)}" aria-label="Bỏ file: ${esc(f.name)}">×</button></div>`).join('')}
    ${a.busy ? `<div class="att-busy" role="status">Đang tải lên ${a.busy} file…</div>` : ''}
    <label class="btn quiet sm file-btn">${PLUS} Thêm file hoặc ảnh<input type="file" id="att-file" multiple></label>`;
}
const attBox = () => `<div id="att-box" class="att-box">${attHtml()}</div>`;
export const attDraw = () => { const el = $('#att-box'); if (el && ATT) { el.innerHTML = attHtml(); iconify(el); } };
export async function attAdd(list) {
  const a = ATT, st = a && CLS[a.code]?.st; if (!a || !st) return;
  if (!navigator.onLine && st.kind !== 'local') return toast('Cần có mạng để tải file lên.');
  for (const raw of [...list].slice(0, 10)) {
    if (a.files.length + a.busy >= 10) { toast('Mỗi bài tối đa 10 file.'); break; }
    a.busy++; attDraw();
    try {
      const file = await shrinkImage(raw);
      if (file.size > FILE_MAX) { toast(`“${raw.name}” nặng ${fileSize(file.size)}, quá ${fileSize(FILE_MAX)}. Hãy dán link Google Drive thay cho file.`); continue; }
      const id = uid(), u8 = new Uint8Array(await file.arrayBuffer());
      const f = { id, n: await st.putFile(id, u8), name: String(file.name || 'file').slice(0, 120), type: file.type || '', size: u8.length };
      // Form đã đóng trong lúc đang tải: bỏ file vừa tải.
      if (ATT === a) { a.files.push(f); a.added.push(f); } else Promise.resolve(st.delFile(f.id, f.n)).catch(() => {});
    } catch (e) {
      console.error(e);
      toast(e?.code === 'resource-exhausted' ? 'Hết chỗ lưu file. Hãy dán link Google Drive thay cho file.' : e?.code === 'permission-denied' ? 'Không có quyền lưu file. Kiểm tra Firestore Rules (xem README).' : `Chưa tải lên được “${raw.name}”. Kiểm tra mạng rồi thử lại.`);
    } finally { a.busy--; if (ATT === a) attDraw(); }
  }
}
// Lưu form: trả về danh sách file cuối cùng, xoá khỏi sổ những file đã bị bỏ.
export function attTake(old) {
  const a = ATT; ATT = null; if (!a) return cleanFiles(old);
  const keep = new Set(a.files.map(f => f.id)), st = CLS[a.code]?.st;
  for (const f of [...cleanFiles(old), ...a.added]) if (!keep.has(f.id)) Promise.resolve(st?.delFile(f.id, f.n)).catch(() => {});
  return a.files;
}
// Lấy danh sách file của form đang mở và bỏ khỏi form (xoá buổi, xoá bài).
export function attClear() { const a = ATT; ATT = null; return a; }
// Đóng form mà không lưu: xoá những file vừa tải lên.
function attCancel() {
  const a = ATT; ATT = null; if (!a) return;
  for (const f of a.added) Promise.resolve(CLS[a.code]?.st?.delFile(f.id, f.n)).catch(() => {});
}
onCloseModal(attCancel);
export const delFiles = (code, files) => { for (const f of cleanFiles(files)) Promise.resolve(CLS[code]?.st?.delFile(f.id, f.n)).catch(() => {}); };

// ----- hiển thị sổ: dùng chung cho màn của cô và phần bố mẹ xem -----
// mode 'edit': màn của cô, bấm vào dòng để sửa. mode 'view': bố mẹ xem, bài tập bấm để mở chi tiết.
function hwLine(code, t, mode) {
  const st = hwState(t);
  return `<div class="hw-line"><span class="hw-t">📝 ${esc(t.title)}</span> <span class="hw-st ${t.got && t.chk ? { ok: 'got', wait: 'done', owe: 'late' }[chkKind(t.chk)] : st.k}">${esc(st.txt)}</span>${t.review ? `<div class="hw-rv">${esc(t.review)}</div>` : ''}</div>`;
}
// Một buổi trong danh sách: gọn một dòng (tên buổi, ngày, hình thức, thời lượng, tóm tắt), bấm vào thì xổ ra chi tiết ngay tại chỗ
// (nội dung, nhận xét, sách, mục tiêu buổi sau, bài tập, tài liệu); màn của cô có thêm nút Sửa. Máy nhớ buổi nào đang mở (UI.secOpen).
function sessRow(code, s, hws, mode, inNeed) {
  const edit = mode === 'edit', k = `ss-${code}-${s.id}`, open = !!UI.secOpen[k], att = attView(code, s.files, s.links);
  // Chi tiết khi mở: mỗi mục một khối, nhãn nhỏ ở trên, nội dung ở dưới. Nội dung học dạng "Lý thuyết: …" thì tách nhãn ra cho dễ đọc.
  const field = (label, html) => html ? `<div class="sb-f"><div class="sb-l">${label}</div><div class="sb-v">${html}</div></div>` : '';
  const contentHtml = String(s.content || '').split('\n').map(x => x.trim()).filter(Boolean).map(x => { const m = /^([^:]{2,32}):\s*(.+)$/.exec(x); return m ? `<div class="sb-line"><span class="sb-k">${esc(m[1])}</span> ${esc(m[2])}</div>` : `<div class="sb-line">${esc(x)}</div>`; }).join('');
  const body = [field('Nội dung học', contentHtml), field('Nhận xét học sinh', s.note ? esc(s.note) : ''), field('Bài tập về nhà', hws.map(t => hwLine(code, t, mode)).join('')),
    field('Sách, nguồn tham khảo', s.src ? esc(s.src) : ''), field('Mục tiêu buổi sau', s.next ? esc(s.next) : ''), field('Slide, tài liệu', att)].join('');
  const sum = [hws.length ? `${hws.length} bài tập` : '', s.note ? 'có nhận xét' : '', att ? 'có tài liệu' : ''].filter(Boolean).join(' · ');
  // Nhãn Thiếu nhận xét chỉ hiện trong mục Cần điền, danh sách theo tháng giữ gọn.
  // Trong mục Cần điền: ghi rõ cô cần ghi thêm gì cho buổi này.
  const lack = [!String(s.content || '').trim() && 'nội dung học', !String(s.note || '').trim() && 'nhận xét học sinh', !hws.length && 'bài tập về nhà'].filter(Boolean);
  const needTxt = !inNeed ? '' : s.state === 'plan' ? `Buổi này đã qua: chuyển sang Đã học${lack.length ? ` và ghi ${lack.join(', ')}` : ''}. Hôm đó nghỉ thì xoá buổi hoặc đổi ngày.` : lack.length ? `Cần ghi: ${lack.join(', ')}.` : '';
  const badge = s.state === 'plan' ? (s.date && s.date < key(today()) ? '<span class="badge owe">Cần điền</span>' : '<span class="badge wait">Chưa học</span>') : '';
  return `<div class="item sess tap ${s.state === 'plan' ? 'plan' : ''} ${open ? 'open' : ''}" ${inNeed && edit ? `data-act="sess-form" data-id="${s.id}"` : `data-act="sess-toggle" data-key="${k}" aria-expanded="${open}"`} role="button" tabindex="0"><span class="ico">${s.state === 'plan' ? '🗓️' : '📖'}</span><div class="txt"><div class="t">Buổi ${s.no} · ${esc(sessName(s))}</div><div class="s">${esc([sessMeta(s), sum].filter(Boolean).join(' · '))}</div>${needTxt ? `<div class="s need-txt">${esc(needTxt)}</div>` : ''}
</div>
    <div class="acts">${badge}<span class="sess-chev">${inNeed && edit ? CHEV : DOWN}</span></div>
    <div class="sess-body" data-act="none" ${open && !inNeed ? '' : 'hidden'}>${body || '<div class="sb-v muted">Buổi này chưa ghi nội dung.</div>'}${edit ? `<button class="btn sm so-edit" data-act="sess-form" data-id="${s.id}">✏️ Sửa buổi này</button>` : ''}</div></div>`;
}
const HW_BADGE = { got: 'ok', done: 'wait', late: 'owe', open: '' };
const hwBadgeHtml = t => { const st = hwState(t); if (!t.got && t.done && cleanFiles(t.sub).length) return `<span class="badge wait">Đã nộp ${cleanFiles(t.sub).length} file</span>`; return `<span class="badge ${st.k === 'got' && t.chk ? chkKind(t.chk) : HW_BADGE[st.k]}">${esc(st.k === 'got' ? (t.chk ? CHK[t.chk] : 'Cô đã nhận') + (t.score ? ' · ' + t.score : '') : st.k === 'done' ? 'Chờ cô nhận' : st.k === 'late' ? st.txt : 'Đang làm')}</span>`; };
// grouped: dòng nằm trong nhóm đã mang tên trạng thái (Đang làm, Chờ cô nhận, Cô đã nhận) thì không lặp lại nhãn đó; nhãn có tin riêng (quá hạn, đã nộp file, kết quả, điểm) vẫn hiện.
function hwRow(code, t, d, mode, grouped) {
  const st = hwState(t), s = t.session ? sessList(d).find(x => x.id === t.session) : null, nd = t.steps.filter(x => x.done).length;
  const meta = [t.due ? `hạn ${dm(parse(t.due))}` : 'chưa có hạn', s ? `buổi ${s.no}` : '', t.steps.length ? `${nd}/${t.steps.length} bước` : ''].filter(Boolean).join(' · ');
  const act = mode === 'edit' ? `data-act="hw-form" data-id="${t.id}"` : `data-act="hw-view" data-id="L~${code}~${t.id}"`;
  const plain = grouped && !(!t.got && t.done && cleanFiles(t.sub).length) && (st.k === 'open' || st.k === 'done' || (st.k === 'got' && !t.chk && !t.score));
  return `<div class="item sess"><span class="ico">📝</span><div class="txt"><div class="t">${esc(t.title)}</div><div class="s">${meta}</div>${t.notes ? `<div class="s snip">${esc(String(t.notes).slice(0, 160))}</div>` : ''}
    ${t.review ? `<div class="s cmt"><b>Nhận xét bài làm:</b> ${esc(t.review)}</div>` : ''}${attView(code, t.files, t.links)}${t.sub.length ? `<div class="s sub-l"><b>Bài con nộp${t.subAt ? ' ' + dm(parse(t.subAt)) : ''}:</b></div>${attView(code, t.sub)}` : ''}</div>
    <div class="acts">${plain ? '' : hwBadgeHtml(t)}<button class="edit" ${act} aria-label="${mode === 'edit' ? 'Sửa' : 'Xem'}: ${esc(t.title)}">${CHEV}</button></div></div>`;
}
const sessMonths = ss => [...new Set(ss.map(s => (s.date || '').slice(0, 7)))].sort().reverse();
export function soStats(d) {
  const ss = sessList(d), done = ss.filter(s => s.state !== 'plan' && s.date), mk = key(today()).slice(0, 7), hw = hwList(d);
  return { ss, done, month: done.filter(s => s.date.startsWith(mk)).length, mins: done.reduce((a, s) => a + (Number(s.mins) || 0), 0), hw, got: hw.filter(t => t.got).length, wait: hw.filter(t => t.done && !t.got).length, open: hw.filter(t => !t.done && !t.got).length };
}
// Tài khoản nhận học phí do cô tự ghi (info/bank): { bank, number, holder, note }. Bố mẹ xem để chuyển khoản.
const bankOf = d => { const b = d.info?.bank || {}, t = (v, n) => String(v || '').trim().slice(0, n); return { bank: t(b.bank, 40), number: t(b.number, 30), holder: t(b.holder, 60), note: t(b.note, 200) }; };
// Các tháng bố mẹ đã xác nhận chuyển khoản học phí (info/paid): { "YYYY-MM": { at: ngày xác nhận, amount } }. Bố mẹ bấm, cô chỉ xem.
export const paidOf = d => Object.fromEntries(Object.entries(d.info?.paid || {}).filter(([mk, v]) => /^\d{4}-\d{2}$/.test(mk) && v && okDate(v.at)).map(([mk, v]) => [mk, { at: v.at, amount: Math.max(0, Number(v.amount) || 0) }]));
// Số buổi đã dạy, tổng thời lượng và học phí của từng tháng (tháng mới nhất ở trên). Chỉ tính buổi Đã học có ngày.
// on: số buổi Online, unk: số buổi chưa ghi Offline hay Online (tính theo mức thường).
export function soFees(d, f) {
  const done = sessList(d).filter(s => s.state !== 'plan' && s.date);
  return sessMonths(done).map(mk => { const l = done.filter(s => s.date.startsWith(mk));
    return { mk, n: l.length, on: l.filter(s => s.mode === 'on').length, unk: l.filter(s => s.mode !== 'on' && s.mode !== 'off').length, mins: l.reduce((a, s) => a + (Number(s.mins) || 0), 0), amount: Math.round(l.reduce((a, s) => a + sessFee(f, s), 0)) }; });
}
// cls: sổ của nhà (phần bố mẹ xem), có thì mỗi tháng có nút xác nhận đã chuyển khoản. Màn của cô (không có cls) chỉ xem tình trạng.
function feeSection(d, f, cls) {
  const rows = soFees(d, f), has = f.fee || f.on, unk = f.on ? rows.reduce((a, r) => a + r.unk, 0) : 0, paid = paidOf(d); if (!rows.length || f.off) return '';
  const pay = r => { const p = paid[r.mk];
    if (p) return `<span class="fee-ok">✓ ${cls ? 'Đã đóng' : 'Phụ huynh đã chuyển'} ${dm(parse(p.at))}</span>${cls ? `<button class="linkbtn undo" data-act="fee-unpaid" data-id="${cls.id}" data-mk="${r.mk}">Huỷ</button>` : ''}`;
    return cls ? `<span class="muted small">Chưa đóng</span><button class="btn quiet sm" data-act="fee-paid" data-id="${cls.id}" data-mk="${r.mk}" data-amount="${r.amount}">Xác nhận đã chuyển</button>` : '<span class="muted small">Chưa đóng</span>'; };
  return `<section class="slot tn3">${secHead('💰', 'Số buổi và học phí theo tháng')}<div class="slot-list list">${rows.map(r => `<div class="item fee-row"><span class="ico">🗓️</span><div class="txt"><div class="t">${monthTxt(r.mk)}</div><div class="s"><b class="num">${r.n} buổi</b>${f.on ? ` · ${r.n - r.on} Offline, ${r.on} Online` : ''}${r.mins ? ` · ${durTxt(r.mins)}` : ''}</div></div><div class="acts col">${has ? `<span class="delta num">${money(r.amount)}</span>` : ''}${pay(r)}</div></div>`).join('')}</div>
    <p class="foot-note">${has ? `Học phí ${feeTxt(f)}, tính theo các buổi cô ghi là Đã học.${unk ? ` Có ${unk} buổi chưa ghi Offline hay Online, đang tính theo mức Offline.` : ''}` : cls ? 'Muốn app tính luôn học phí thì bấm Sửa ở trên rồi ghi học phí mỗi buổi hoặc mỗi giờ.' : 'Số buổi tính theo các buổi cô ghi là Đã học. Phụ huynh ghi mức học phí thì app tính luôn số tiền mỗi tháng.'}${cls ? ' Chuyển khoản xong thì bấm Xác nhận đã chuyển, cô sẽ thấy ngay.' : ' Phụ huynh chuyển khoản xong sẽ bấm xác nhận ở đây.'}</p></section>`;
}
// Tài khoản nhận học phí. Màn của cô (edit): bấm để ghi, sửa. Phần bố mẹ xem (clsId): nút sao chép số tài khoản,
// bố mẹ cũng ghi, sửa được (ví dụ chép từ mã QR cô gửi qua Zalo).
function bankSection(d, edit, teacher, clsId = '') {
  const b = bankOf(d), has = b.number || b.bank || b.holder;
  const head = secHead('🏦', 'Tài khoản nhận học phí');
  if (!has) return `<section class="slot tn4">${head}${edit ? `<button class="slot-blank" data-act="bank-form"><span>Ghi ngân hàng và số tài khoản để phụ huynh chuyển khoản học phí</span>${PLUS}</button>` : `<button class="slot-blank" data-act="bank-form" data-id="${clsId}"><span>${esc(teacher || 'Cô')} chưa ghi số tài khoản. Bấm để ghi tài khoản cô gửi (ngân hàng, số tài khoản, chủ tài khoản)</span>${PLUS}</button>`}</section>`;
  return `<section class="slot tn4">${head}<div class="slot-list list"><div class="item"><span class="ico">🏦</span><div class="txt"><div class="t">${esc(b.bank || 'Ngân hàng')}${b.number ? ` · <span class="num">${esc(b.number)}</span>` : ''}</div>${b.holder ? `<div class="s">${esc(b.holder)}</div>` : ''}${b.note ? `<div class="s so-p">${esc(b.note)}</div>` : ''}</div>
    <div class="acts">${edit ? `<button class="edit" data-act="bank-form" aria-label="Sửa tài khoản">${CHEV}</button>` : `${b.number ? `<button class="btn quiet sm" data-act="cls-copy" data-link="${esc(b.number)}" data-msg="Đã sao chép số tài khoản.">Sao chép số</button>` : ''}<button class="edit" data-act="bank-form" data-id="${clsId}" aria-label="Sửa tài khoản">${CHEV}</button>`}</div></div></div></section>`;
}
const BANKS = ['Vietcombank', 'VietinBank', 'BIDV', 'Agribank', 'Techcombank', 'MB Bank', 'ACB', 'VPBank', 'TPBank', 'Sacombank', 'VIB', 'HDBank', 'SHB', 'MSB', 'OCB', 'SeABank', 'Eximbank', 'LPBank', 'Nam A Bank', 'Cake', 'Timo'];
export function bankForm(clsId) {
  const code = clsId ? classesList().find(x => x.id === clsId)?.code : TEACH; if (!code) return;
  const b = bankOf(soOf(code));
  openModal(`<h2>Tài khoản nhận học phí</h2>
  <div class="fg">
    ${frow('Ngân hàng', `<input id="bbank" class="pillin txt" list="bank-list" maxlength="40" value="${esc(b.bank)}" placeholder="Vietcombank">`, { id: 'bbank' })}
    <datalist id="bank-list">${BANKS.map(x => `<option value="${x}">`).join('')}</datalist>
    ${frow('Số tài khoản', `<input id="bnumber" class="pillin txt num" inputmode="numeric" maxlength="30" autocomplete="off" value="${esc(b.number)}" placeholder="0123456789">`, { id: 'bnumber' })}
    ${frow('Chủ tài khoản', `<input id="bholder" class="pillin txt" maxlength="60" autocomplete="off" value="${esc(b.holder)}" placeholder="NGUYEN THI A">`, { id: 'bholder' })}
  </div>
  <div class="fg">${frow('Ghi chú', `<textarea id="bnote" class="input" rows="2" maxlength="200" placeholder="Ví dụ: nội dung chuyển khoản ghi tên con và tháng">${esc(b.note)}</textarea>`, { id: 'bnote', cls: 'col', sub: clsId ? 'Cô cũng thấy thông tin này ở tab Báo cáo và sửa lại được.' : 'Phụ huynh thấy thông tin này khi xem sổ. Cô sửa lại lúc nào cũng được.' })}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="bank-save" data-id="${clsId || ''}">Lưu</button></div>`);
  $('#modal .dialog')?.focus();
}
// Thẻ tóm tắt đầu sổ, cùng kiểu thẻ ở màn Tài khoản: bên trái số buổi tháng này (kèm học phí), bên phải bài tập cô đã nhận (kèm thanh tiến độ).
const soTiles = (st, f, d) => { const cur = soFees(d, f).find(r => r.mk === key(today()).slice(0, 7)), fee = cur && (f.fee || f.on) && !f.off;
  return `<section class="stat2"><div class="stat"><b class="stat-n num">${st.month} buổi</b><span class="cap">Tháng ${today().getMonth() + 1}</span>
      <span class="stat-c">${fee ? `học phí <b class="num">${money(cur.amount)}</b> · ${paidOf(d)[key(today()).slice(0, 7)] ? 'đã đóng' : 'chưa đóng'}` : cur && cur.mins ? durTxt(cur.mins) : st.month ? '' : 'Chưa có buổi đã học trong tháng'}</span></div>
    <div class="stat"><b class="stat-n num ${st.hw.length && st.got === st.hw.length ? 'plus' : ''}">${st.got}/${st.hw.length}</b><span class="cap">Bài tập cô đã nhận</span>
      ${st.hw.length ? `${barCount(st.got, st.hw.length)}<span class="stat-c">${[st.wait ? `${st.wait} bài chờ cô nhận` : '', st.open ? `${st.open} bài đang làm` : ''].filter(Boolean).join(' · ') || 'Đã nhận hết'}</span>` : '<span class="stat-c">Chưa giao bài tập</span>'}</div></section>`; };
// Buổi cần điền: ngày có lịch học (theo lịch học thêm của nhà) đã qua mà cô chưa ghi buổi nào, và buổi ghi trước (Chưa học) mà ngày đã qua.
// Tính từ buổi đã học đầu tiên trong sổ (sổ mới chưa có buổi nào thì không nhắc), tối đa 60 ngày gần nhất; hôm nay chỉ tính khi đã qua giờ học.
// Buổi học ngoài lịch (đổi lịch, học bù) bù cho ngày có lịch gần nhất trong vòng 3 ngày. Ngày cô bấm Nghỉ (info/off) thì không nhắc nữa.
export const offOf = d => Object.fromEntries(Object.entries(d.info?.off || {}).filter(([k, v]) => okDate(k) && v));
export function soMissing(d) {
  const info = d.info?.lop || {}, slots = schedSlots(info), wds = [...new Set(slots.map(x => Number(x.day)))], ss = sessList(d), tk = key(today());
  const stale = ss.filter(s => s.state === 'plan' && s.date && s.date < tk);
  // Buổi đã học trong 14 ngày gần đây mà cô chưa ghi nhận xét học sinh.
  // Buổi nhập từ file (xl) coi như đã ghi xong, trừ buổi cần cô ghi thêm (fill: buổi kế hoạch trong file mà thật ra đã học).
  const blank = ss.filter(s => s.state !== 'plan' && s.date && s.date <= tk && s.date >= key(addDays(today(), -14)) && !String(s.note || '').trim() && (!s.xl || s.fill));
  stale.push(...blank);
  const first = ss.find(s => s.state !== 'plan' && s.date)?.date;
  if (!wds.length || !first) return { miss: [], stale, n: stale.length };
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes(), off = offOf(d), have = new Set(ss.map(s => s.date).filter(Boolean));
  let miss = [];
  for (let i = 60; i >= 0; i--) {
    const x = addDays(today(), -i), dk = key(x); if (dk < first || !wds.includes(x.getDay())) continue;
    if (i === 0 && !slots.some(sl => Number(sl.day) === x.getDay() && (toMin(sl.e) ?? toMin(sl.s) ?? 1440) <= nowMin)) continue;
    if (!have.has(dk) && !off[dk]) miss.push(dk);
  }
  for (const s of ss.filter(s => s.date && !wds.includes(parse(s.date).getDay()))) {
    let best = -1, gap = 4; miss.forEach((dk, j) => { const g = Math.abs(daysBetween(dk, s.date)); if (g < gap) { gap = g; best = j; } });
    if (best >= 0) miss.splice(best, 1);
  }
  return { miss, stale, n: miss.length + stale.length };
}
// Các buổi theo tháng, tháng mới nhất ở trên, mỗi tháng đếm số buổi đã học (để tính học phí).
// Màn của cô (edit): buổi ghi trước (Chưa học) gom vào mục Sắp tới; các tháng đã qua gập lại, chỉ mở sẵn tháng mới nhất. Bấm vào buổi để xem chi tiết.
function soMonths(code, d, mode) {
  const all = sessList(d), hws = hwList(d), edit = mode === 'edit', ss = all.filter(s => s.state !== 'plan'), plan = edit ? all.filter(s => s.state === 'plan') : [];
  const row = s => sessRow(code, s, hws.filter(t => t.session === s.id), mode), months = sessMonths(ss);
  const mi = edit ? soMissing(d) : { miss: [], stale: [] }, staleIds = new Set(mi.stale.map(x => x.id));
  const slotTxt = dk => schedSlots(d.info?.lop).filter(x => Number(x.day) === parse(dk).getDay()).map(x => [x.s, x.e].filter(Boolean).join(' – ')).join(', ');
  const missRow = dk => `<div class="item tap" data-act="sess-form" data-d="${dk}" role="button" tabindex="0"><span class="ico">📝</span><div class="txt"><div class="t">${esc(dateTxt(dk))} · chưa ghi buổi học</div><div class="s">${esc(slotTxt(dk) ? 'lịch học ' + slotTxt(dk) : '')}</div><div class="s need-txt">Cần ghi: nội dung học, nhận xét học sinh, bài tập về nhà. Hôm đó nghỉ thì bấm Nghỉ.</div></div>
    <div class="acts"><button class="btn quiet sm" data-act="so-off" data-d="${dk}">Nghỉ</button><span class="badge owe">Cần điền</span></div></div>`;
  const need = edit && (mi.miss.length || mi.stale.length) ? `<section class="slot so-need">${secHead('⚠️', 'Cần điền', { cnt: mi.miss.length + mi.stale.length })}<div class="slot-list list">${[...mi.miss.map(dk => ({ dk, h: missRow(dk) })), ...mi.stale.map(s => ({ dk: s.date, h: sessRow(code, s, hws.filter(t => t.session === s.id), mode, true) }))].sort((a, b) => b.dk.localeCompare(a.dk)).map(x => x.h).join('')}</div>
    <p class="foot-note">Buổi đã qua mà cô chưa ghi đủ. Bấm vào dòng để mở form ghi buổi đó.</p></section>` : '';
  plan.splice(0, plan.length, ...plan.filter(s => !staleIds.has(s.id)));
  // Sắp tới: chỉ hiện các buổi trong tháng này (tháng này hết buổi thì hiện 2 buổi kế tiếp), bấm Xem thêm để hiện hết.
  const mk = key(today()).slice(0, 7), soon = plan.filter(s => s.date && s.date.slice(0, 7) === mk), first = soon.length ? soon : plan.slice(0, 2), showAll = !!UI.secOpen['so-plan-all'];
  const shown = showAll ? plan : first, more = plan.length - first.length;
  return need + (plan.length ? `<section class="slot tn0">${secHead('🗓️', 'Sắp tới', { cnt: plan.length })}<div class="slot-list list">${shown.map(row).join('')}</div>
    ${more > 0 ? `<button class="linkbtn so-more" data-act="so-plan-more">${showAll ? 'Thu gọn' : `Xem thêm ${more} buổi`}</button>` : ''}</section>` : '')
    + months.map((mk, i) => { const l = ss.filter(s => (s.date || '').slice(0, 7) === mk).reverse(), key = edit ? 'so-m-' + (mk || 'none') : '';
      return `<section class="slot">${!edit && i === 0 ? secHead('📒', 'Các buổi đã học', { cnt: ss.length }) : ''}${secHead('', monthTxt(mk), { cnt: `${l.length} buổi`, key, closed: i > 0, sub: true })}${secIsOpen(key, i > 0) ? `<div class="slot-list list">${l.map(row).join('')}</div>` : ''}</section>`; }).join('');
}
// ----- nhập sổ từ file Excel theo dõi tiến độ -----
// Mẫu file: mỗi hàng một buổi, hàng tiêu đề có các cột Buổi, Hình thức, Thời lượng (phút), Ngày học, Chuyên đề / mục tiêu, Lý thuyết / đọc hiểu,
// Thực hành trên lớp, Bài tập về nhà, SGK / nguồn tham khảo, Trạng thái, Điểm bài tập, Nhận xét BTVN, BTVN (Đã nộp / Đã giao / Chưa giao),
// Nhận xét học viên, Link slide, Mục tiêu buổi sau. Thiếu cột nào thì bỏ qua cột đó.
// Buổi Đã học có ngày → buổi Đã học; còn lại là buổi kế hoạch (Chưa học), tên buổi là chuyên đề. BTVN Đã giao / Đã nộp → một bài tập gắn với buổi,
// hạn nộp là buổi sau; Đã nộp thì coi như cô đã nhận, kèm điểm và nhận xét. Buổi đã có trong sổ (cùng ngày, hoặc đã nhập trước) được giữ nguyên.
let SO_IMPORT = null;
const cellTxt = v => v == null ? '' : String(v).replace(/\r/g, '').trim();
function xlDay(v) {
  if (typeof v === 'number' && v > 20000) { const d = excelDate(v); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(cellTxt(v)); return m ? okDate(`${m[3]}-${pad(m[2])}-${pad(m[1])}`) : '';
}
// Điểm "7/10" bị Excel tự đổi thành ngày 10/7 (kiểu tháng/ngày): đổi lại thành chữ như lúc gõ.
const xlScore = v => { if (typeof v === 'number' && v > 20000) { const d = excelDate(v); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; } return cellTxt(v); };
export function parseSoRows(rows) {
  const hi = rows.findIndex(r => r && r.some(x => norm(x).startsWith('buổi')) && r.some(x => norm(x).includes('ngày học')));
  if (hi < 0) return null;
  const H = rows[hi].map(x => norm(x)), col = (...keys) => H.findIndex(h => keys.some(k => typeof k === 'function' ? k(h) : h.includes(k)));
  const C = { no: col(h => h.startsWith('buổi')), mode: col('hình thức'), mins: col('thời lượng'), date: col('ngày học'), topic: col('chuyên đề'), theory: col('lý thuyết'), practice: col('thực hành'),
    hw: col('bài tập về nhà'), src: col('sgk', 'nguồn'), state: col('trạng thái'), score: col('điểm'), hwRv: col('nhận xét btvn', 'nhận xét bài'), hwSt: col(h => h === 'btvn'),
    note: col('nhận xét học'), link: col('link'), next: col('mục tiêu buổi sau') };
  const get = (r, k) => C[k] >= 0 ? r[C[k]] : null, t0 = Date.now();
  const list = rows.slice(hi + 1).filter(r => r && cellTxt(get(r, 'no'))).map((r, i) => {
    const no = Number((/\d+/.exec(cellTxt(get(r, 'no'))) || [])[0]) || i + 1, date = xlDay(get(r, 'date')), done = norm(get(r, 'state')).startsWith('đã') && !!date;
    return { no, i, date, done, mode: /online/i.test(cellTxt(get(r, 'mode'))) ? 'on' : /offline/i.test(cellTxt(get(r, 'mode'))) ? 'off' : '', mins: Math.max(0, Math.round(Number(get(r, 'mins')) || 0)),
      topic: cellTxt(get(r, 'topic')).replace(/\s+/g, ' ').slice(0, 300), theory: cellTxt(get(r, 'theory')), practice: cellTxt(get(r, 'practice')), hw: cellTxt(get(r, 'hw')), src: cellTxt(get(r, 'src')).slice(0, 200),
      score: xlScore(get(r, 'score')), hwRv: cellTxt(get(r, 'hwRv')), hwSt: norm(get(r, 'hwSt')), note: cellTxt(get(r, 'note')), link: cellTxt(get(r, 'link')), next: cellTxt(get(r, 'next')).slice(0, 300) };
  });
  const sessions = [], tasks = [];
  list.forEach((x, k) => {
    const sid = `xl-${x.no}`, hasTask = x.hw && (x.hwSt.includes('đã nộp') || x.hwSt.includes('đã giao')), scoreOk = /\d/.test(x.score);
    const lines = [x.theory && `Lý thuyết / đọc hiểu: ${x.theory}`, x.practice && `Thực hành trên lớp: ${x.practice}`,
      !hasTask && x.hw && `Bài tập về nhà${x.done ? '' : ' dự kiến'}: ${x.hw}`, !hasTask && (x.score || x.hwRv) && [x.score && `Điểm: ${x.score}`, x.hwRv && `Nhận xét: ${x.hwRv}`].filter(Boolean).join('. ')].filter(Boolean);
    sessions.push({ id: sid, date: x.date, data: { date: x.date, state: x.done ? 'done' : 'plan', mode: x.mode, mins: x.mins, topic: x.topic, content: lines.join('\n').slice(0, 2000), src: x.src,
      note: x.note.slice(0, 2000), next: x.next, links: linkList(x.link), files: [], at: new Date(t0 + x.i).toISOString(), xl: 1 } });
    if (!hasTask) return;
    const due = list.slice(k + 1).find(y => y.date)?.date || '', got = x.hwSt.includes('đã nộp');
    tasks.push({ id: `xl-h${x.no}`, data: { title: x.hw.replace(/\s+/g, ' ').slice(0, 300), notes: '', due, session: sid, steps: [], links: [], files: [], at: new Date(t0 + x.i).toISOString(),
      ...(got ? { got: true, gotAt: due || x.date, score: scoreOk ? x.score.slice(0, 30) : '' } : {}), review: [!scoreOk && x.score, x.hwRv].filter(Boolean).join('. ').slice(0, 2000) } });
  });
  return { sessions, tasks };
}
export function soImportPick(clsId) {
  const code = clsId ? classesList().find(x => x.id === clsId)?.code : TEACH; if (!code) return;
  if (!window.DecompressionStream) return toast('Trình duyệt này chưa đọc được file Excel. Cập nhật trình duyệt rồi thử lại nhé.');
  const inp = Object.assign(document.createElement('input'), { type: 'file', accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  inp.onchange = async () => {
    const f = inp.files?.[0]; if (!f) return;
    let parsed = null;
    try { parsed = parseSoRows(await readXlsx(f)); } catch (e) { console.error(e); }
    if (!parsed || !parsed.sessions.length) return toast('Không đọc được buổi học nào trong file này. File cần có hàng tiêu đề với cột Buổi và Ngày học.');
    SO_IMPORT = soImportPlan(code, clsId, parsed);
    const { sessions: fresh, tasks, months } = SO_IMPORT;
    const done = fresh.filter(x => x.data.state === 'done').length;
    openModal(`<h2>Nhập từ file Excel</h2>
    <p class="muted small lead">${esc(f.name)}</p>
    <div class="fg">${frow('Buổi đã học', `<span class="fv-val num">${done}</span>`)}${frow('Buổi kế hoạch', `<span class="fv-val num">${fresh.length - done}</span>`)}${frow('Bài tập về nhà', `<span class="fv-val num">${tasks.length}</span>`)}
      ${parsed.sessions.length > fresh.length ? frow('Bỏ qua', `<span class="fv-val num">${parsed.sessions.length - fresh.length}</span>`, { sub: 'Buổi đã có trong sổ (cùng ngày hoặc đã nhập trước), giữ nguyên' }) : ''}</div>
    ${months.length ? `<div class="fg"><div class="fr">${toggle('so-imp-paid', `Đánh dấu đã đóng học phí ${months.map(m => 'tháng ' + Number(m.slice(5))).join(', ')} <span class="fs">Tháng này (tháng ${today().getMonth() + 1}) vẫn để chưa đóng</span>`, true)}</div></div>` : ''}
    <p class="muted small lead">Bài tập Đã nộp được tính là cô đã nhận, kèm điểm và nhận xét. Bài nhập từ file không bị trừ tiền phạt.</p>
    <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="so-import-go"${fresh.length ? '' : ' disabled'}>Nhập ${fresh.length} buổi</button></div>`);
  };
  inp.click();
}
// Những gì sẽ nhập: bỏ buổi đã có trong sổ (cùng mã hoặc cùng ngày) và bài của các buổi đó; các tháng trước tháng này có buổi đã học (để đánh dấu đã đóng học phí).
export function soImportPlan(code, clsId, parsed) {
  const d = soOf(code), dates = new Set(sessList(d).map(x => x.date).filter(Boolean));
  const fresh = parsed.sessions.filter(x => !d.sessions[x.id] && !(x.date && dates.has(x.date))), keep = new Set(fresh.map(x => x.id));
  const tasks = parsed.tasks.filter(t => !d.tasks[t.id] && keep.has(t.data.session));
  const c = clsId ? classesList().find(x => x.id === clsId) : null, mk = key(today()).slice(0, 7);
  const months = c && !feeOf(c).off ? [...new Set(fresh.filter(x => x.data.state === 'done' && x.date.slice(0, 7) < mk).map(x => x.date.slice(0, 7)))].sort() : [];
  return { code, clsId, sessions: fresh, tasks, months };
}
export function soImportGo() {
  const x = SO_IMPORT; if (!x) return; SO_IMPORT = null;
  const paid = x.months.length && $('#so-imp-paid')?.checked;
  if (!soImportApply(x, paid)) return;
  closeModal();
  toast(`Đã nhập ${x.sessions.length} buổi và ${x.tasks.length} bài tập vào sổ.${paid ? ` Đã đánh dấu đóng học phí ${x.months.map(m => 'tháng ' + Number(m.slice(5))).join(', ')}.` : ''}`);
}
// Học phí đóng vào cuối tháng hoặc đầu tháng sau: tháng nhập từ file coi như đóng ngày 1 của tháng sau (tháng 10 → 1/11).
const monthAfter = mk => { const [y, m] = mk.split('-').map(Number); return m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`; };
export function soImportApply(x, paid) {
  for (const s of x.sessions) if (!clsPut(x.code, 'sessions', s.id, s.data)) return false;
  for (const t of x.tasks) clsPut(x.code, 'tasks', t.id, t.data);
  // Bài cũ trong file đã qua hạn: chỉ hiện ở phần của con các bài có hạn từ hôm nay trở đi.
  const cx = x.clsId && classesList().find(y => y.id === x.clsId);
  if (cx && !cx.hwFrom && x.tasks.length) { const { id, ...o } = cx; put('paid', id, { ...o, hwFrom: key(today()) }); }
  if (paid) {
    const c = classesList().find(y => y.id === x.clsId), fees = soFees(soOf(x.code), feeOf(c)), next = { ...paidOf(soOf(x.code)) };
    for (const mk of x.months) if (!next[mk]) next[mk] = { at: monthAfter(mk), amount: fees.find(r => r.mk === mk)?.amount || 0 };
    clsPut(x.code, 'info', 'paid', next);
  }
  return true;
}
// Chi tiết một buổi (màn của cô, chỉ xem): mọi thứ cô đã ghi, bài giao trong buổi và kết quả bài tập buổi trước cô đã tick. Có nút Sửa.
export function sessView(id) {
  const d = soOf(TEACH), s = sessList(d).find(x => x.id === id); if (!s) return;
  const hws = hwList(d), mine = hws.filter(t => t.session === id), chk = hws.filter(t => t.chkBy === id);
  const para = (label, v) => v ? `<div class="fg">${frow(label, `<div class="so-p">${esc(v)}</div>`, { cls: 'col' })}</div>` : '';
  const hwItem = t => `<div class="item"><span class="ico">📝</span><div class="txt"><div class="t">${esc(t.title)}</div><div class="s">${esc([t.due ? `hạn ${dm(parse(t.due))}` : '', t.steps.length ? `${t.steps.filter(x => x.done).length}/${t.steps.length} bước` : ''].filter(Boolean).join(' · '))}</div>${t.review ? `<div class="s cmt"><b>Nhận xét bài làm:</b> ${esc(t.review)}</div>` : ''}${attView(TEACH, t.files, t.links)}</div><div class="acts">${hwBadgeHtml(t)}</div></div>`;
  openModal(`<h2>Buổi ${s.no}</h2>
  <div class="fg f-title"><div class="ft"><div class="hw-title">${esc(s.topic || sessDayTitle(s.date))}</div></div></div>
  <div class="fg">${frow('Ngày học', `<span class="fv-val">${esc(s.date ? dateTxt(s.date) : 'Chưa có ngày')}</span>`)}
    ${frow('Trạng thái', `<span class="fv-val">${s.state === 'plan' ? '<span class="badge wait">Chưa học</span>' : 'Đã học'}</span>`)}
    ${s.mode ? frow('Hình thức', `<span class="fv-val">${esc((SESS_MODES.find(x => x[0] === s.mode) || [])[1] || '')}</span>`) : ''}
    ${Number(s.mins) ? frow('Thời lượng', `<span class="fv-val">${esc(durTxt(Number(s.mins)))}</span>`) : ''}</div>
  ${para('Nội dung học', s.content)}${para('Nhận xét học sinh', s.note)}
  ${mine.length ? `<p class="fg-cap">Bài tập về nhà</p><div class="slot-list list">${mine.map(hwItem).join('')}</div>` : ''}
  ${chk.length ? `<p class="fg-cap">Bài tập buổi trước</p><div class="slot-list list">${chk.map(hwItem).join('')}</div>` : ''}
  ${para('Sách, nguồn tham khảo', s.src)}${para('Mục tiêu buổi sau', s.next)}
  ${attView(TEACH, s.files, s.links) ? `<div class="fg">${frow('Slide, tài liệu', attView(TEACH, s.files, s.links), { cls: 'col', sub: 'Bấm để mở' })}</div>` : ''}
  <div class="foot"><button class="btn quiet" data-act="close">Đóng</button><button class="btn primary" data-act="sess-form" data-id="${s.id}">Sửa</button></div>`);
}
export function printSo(code, title, student, teacher, f) {
  const d = soOf(code), fees = soFees(d, f).reverse(), paid = paidOf(d), ss = sessList(d).filter(s => s.state !== 'plan' && s.date), hws = hwList(d), free = hws.filter(t => !ss.some(s => s.id === t.session));
  const hwCell = l => l.map(t => `<div>${esc(t.title)}${t.due ? ` (hạn ${dm(parse(t.due))})` : ''}</div>`).join(''), rvCell = l => l.map(t => `<div>${esc([hwState(t).txt, t.review].filter(Boolean).join('. '))}</div>`).join('');
  printHtml(`<h1 style="font-family:var(--display);margin:0;font-size:28px">${esc(title)}</h1>
    <div style="font-size:14px;margin:2px 0 10px">Học sinh: ${esc(student)}${teacher ? ' · ' + esc(teacher) : ''} · đã học ${ss.length} buổi · in ngày ${dm(today())}/${today().getFullYear()}</div>
    ${f.off ? '' : `<table class="ptable so-table so-fee"><thead><tr><th>Tháng</th><th>Số buổi</th><th>Thời lượng</th>${f.fee || f.on ? `<th>Học phí (${esc(feeTxt(f))})</th>` : ''}<th>Đã đóng</th></tr></thead><tbody>
      ${fees.map(r => `<tr><td>${monthTxt(r.mk)}</td><td class="num">${r.n}${f.on ? ` (${r.n - r.on} Offline, ${r.on} Online)` : ''}</td><td class="num">${r.mins ? durTxt(r.mins) : ''}</td>${f.fee || f.on ? `<td class="num">${money(r.amount)}</td>` : ''}<td class="num">${paid[r.mk] ? '✓ ' + dm(parse(paid[r.mk].at)) : ''}</td></tr>`).join('')}
      <tr><td><b>Tổng</b></td><td class="num"><b>${fees.reduce((a, r) => a + r.n, 0)}</b></td><td class="num">${durTxt(fees.reduce((a, r) => a + r.mins, 0))}</td>${f.fee || f.on ? `<td class="num"><b>${money(fees.reduce((a, r) => a + r.amount, 0))}</b></td>` : ''}<td></td></tr></tbody></table>`}
    ${sessMonths(ss).reverse().map(mk => { const l = ss.filter(s => s.date.startsWith(mk));
      return `<h2 style="font-family:var(--display);margin:12px 0 4px;font-size:17px">${monthTxt(mk)} · ${l.length} buổi</h2><table class="ptable so-table"><thead><tr><th>Buổi</th><th>Ngày</th><th>Nội dung</th><th>Nhận xét</th><th>Bài tập về nhà</th><th>Kết quả bài tập</th></tr></thead><tbody>
      ${l.map(s => { const h = hws.filter(t => t.session === s.id); return `<tr><td class="num">${s.no}</td><td class="num">${dm(parse(s.date))}</td><td><b>${esc(s.topic || '')}</b>${s.content ? `<div>${esc(s.content)}</div>` : ''}</td><td>${esc(s.note || '')}${s.next ? `<div><i>Buổi sau: ${esc(s.next)}</i></div>` : ''}</td><td>${hwCell(h)}</td><td>${rvCell(h)}</td></tr>`; }).join('')}</tbody></table>`; }).join('')}
    ${free.length ? `<h2 style="font-family:var(--display);margin:12px 0 4px;font-size:17px">Bài tập khác</h2><table class="ptable so-table"><thead><tr><th>Bài tập</th><th>Kết quả</th></tr></thead><tbody>${free.map(t => `<tr><td>${hwCell([t])}</td><td>${rvCell([t])}</td></tr>`).join('')}</tbody></table>` : ''}`, 'landscape');
}

// ----- màn của cô -----
// Thẻ tên ở đầu form của cô: nội dung buổi học và tên bài thường dài nên là ô nhiều dòng, tự cao theo chữ.
const longTitle = (id, val, ph) => `<div class="fg f-title"><div class="ft"><textarea id="${id}" class="input ft-input ft-long" rows="1" maxlength="300" placeholder="${ph}" aria-label="${ph}">${esc(val || '')}</textarea></div></div>`;
export const growTitle = el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } };
// Form mới thì đặt con trỏ vào ô tên; form sửa thì không bật bàn phím.
const teachFocus = (id, isNew) => { growTitle($('#' + id)); (isNew ? $('#' + id) : $('#modal .dialog'))?.focus(); };
// Màn của cô dùng cùng khung với màn của nhà: máy tính có thanh bên trái (logo và ba mục), điện thoại có thanh tab nổi ở đáy,
// đầu trang là thẻ tên học sinh và nút + tròn để thêm buổi học hoặc giao bài.
const T_TABS = [['buoi', 'Buổi học', 'book'], ['bai', 'Bài tập', 'pencil'], ['bao-cao', 'Báo cáo', 'memo']];
export function drawTeacher() {
  document.body.classList.remove('locked');
  const km = $('#km'); km.hidden = true; km.innerHTML = '';
  $('#shell').hidden = false;
  const c = CLS[TEACH], d = soOf(TEACH), info = d.info.lop;
  // Lỗi từ máy chủ (ví dụ bị từ chối quyền) thì nói rõ, khác với mất mạng thật: dễ biết vì sao sổ trống.
  const errTxt = c?.err ? (String(c.err.code || '').includes('permission') ? 'Máy chủ không cho đọc sổ này. Nhờ phụ huynh gửi lại link.' : `Chưa kết nối được máy chủ${c.err.code ? ` (${c.err.code})` : ''}. Tải lại trang thử nhé.`) : '';
  const sync = errTxt ? `<div class="topbar"><span class="sync wait"><i></i>${esc(errTxt)}</span></div>`
    : c?.loaded && (c.stale || !navigator.onLine) && c.st?.kind !== 'local' ? `<div class="topbar"><span class="sync wait"><i></i>${navigator.onLine ? 'Đang kết nối máy chủ, chưa có dữ liệu mới nhất' : 'Đang offline, sẽ đồng bộ sau'}</span></div>` : '';
  const shell = (nav, body) => { $('#rail').innerHTML = brand() + nav(''); $('#tabs').innerHTML = nav('tab'); $('#tabs').hidden = !info; $('#app').innerHTML = sync + body; };
  const head = (h1, add) => `<div class="tbar"><div class="kid-tabs"><span class="kid-tab on">${icon('📒')}<b>${esc(info?.student || 'Sổ học')}</b></span></div>${add ? pillBar(add) : ''}</div><div class="day-head"><h1>${h1}</h1></div>`;
  if (!c || !c.loaded) return shell(() => '', `${head('Đang mở sổ học…')}<div class="card empty"><div class="big">⏳</div><h2>Đang mở sổ học…</h2></div>`);
  if (!info) return shell(() => '', `${head(c.err || c.stale ? 'Chưa mở được sổ học' : 'Không tìm thấy sổ học')}<div class="card empty"><div class="big">📒</div><h2>${c.err || c.stale ? 'Chưa mở được sổ học' : 'Không tìm thấy sổ học này'}</h2>
      <p class="muted">${c.err || c.stale ? 'Kiểm tra mạng rồi mở lại link.' : 'Link có thể đã cũ hoặc sổ đã bị xoá. Cô nhờ phụ huynh gửi lại link nhé.'}</p></div>`);
  document.title = `${bookName(info)} · ${info.student}`;
  const st = soStats(d), tab = T_TABS.some(x => x[0] === UI.tTab) ? UI.tTab : 'buoi', need = soMissing(d).n;
  const days = schedSlots(info).map(x => `${WDS[x.day]}${x.s ? ' ' + x.s : ''}`).join(', ');
  const nav = cls => T_TABS.map(([v, l, ic]) => `<a href="#${v}" class="${cls} ${v === tab ? 'on' : ''}" data-act="t-tab" data-v="${v}" ${v === tab ? 'aria-current="page"' : ''}>${iconSvg(ic)}<span>${l}${v === 'bai' && st.wait ? ` <i class="cnt num">${st.wait}</i>` : v === 'buoi' && need ? ` <i class="cnt num late">${need}</i>` : ''}</span></a>`).join('');
  const add = tab === 'buoi' ? `<button class="add" data-act="sess-form" aria-label="Ghi buổi học">${PLUS}</button>` : tab === 'bai' ? `<button class="add" data-act="sess-form" aria-label="Ghi buổi học và giao bài tập">${PLUS}</button>`
    : moreBtn('t-menu', 'In báo cáo, nhập từ file Excel');
  // Bài con mới nộp (có ảnh, file) mà cô chưa nhận: thẻ báo ở đầu mọi tab, bấm sang tab Bài tập.
  const fresh = st.hw.filter(t => !t.got && t.done && t.sub.length);
  const newCard = fresh.length && tab !== 'bai' ? `<button class="so-new" data-act="t-tab" data-v="bai"><span class="ico">📥</span><span class="txt"><b>Có ${fresh.length} bài mới nộp</b><span>${esc(fresh.slice(0, 3).map(t => `${t.title} (${t.sub.length} file)`).join(', '))}${fresh.length > 3 ? '…' : ''}</span></span>${CHEV}</button>` : '';
  let h = `${head(esc(bookName(info)), add)}${newCard}
    <p class="so-sub">Học sinh: <b>${esc(info.student)}</b>${info.teacher ? ` · ${esc(info.teacher)}` : ''}${days ? ` · lịch học ${esc(days)}` : ''}</p>${soTiles(st, feeOf(info), d)}`;
  if (tab === 'buoi') {
    h += `<section class="slot">${secHead('📒', 'Buổi học', { cnt: st.ss.length || '', add: `<button class="mini-add has-txt" data-act="sess-form">${PLUS}<span>Thêm buổi</span></button>` })}${st.ss.length ? '' : blankAdd('Ghi buổi học: hôm nay học gì, nhận xét, bài tập về nhà', 'sess-form')}</section>`;
    h += st.ss.length ? `<div class="slots">${soMonths(TEACH, d, 'edit')}</div>` : `<p class="foot-note" style="margin-top:0">Mỗi buổi cô ghi nội dung, nhận xét và giao bài tập. Phụ huynh xem được ngay, bài tập tự hiện trên máy của ${esc(info.student)}.</p>`;
  } else if (tab === 'bai') {
    // Bài tập giao kèm từng buổi học (form Ghi buổi học), tab này chỉ để xem, nhận bài và cho điểm.
    h += `<section class="slot">${secHead('✏️', 'Bài tập', { cnt: st.hw.length || '' })}${st.hw.length ? '' : blankAdd('Bài tập giao kèm buổi học: bấm để ghi buổi học và giao bài', 'sess-form')}</section>`;
    const groups = [['Con báo đã làm xong, chờ cô nhận', t => t.done && !t.got, 'tn3', ''], ['Đang làm', t => !t.done && !t.got, 'tn0', ''], ['Cô đã nhận', t => t.got, '', 'so-got']];
    h += st.hw.length ? `<div class="slots">${groups.map(([label, f, tint, k]) => { const l = st.hw.filter(f); if (k) l.reverse();
      return l.length ? `<section class="slot ${tint}">${secHead('', label, { cnt: l.length, key: k, closed: l.length > 5, sub: true })}${secIsOpen(k, l.length > 5) ? `<div class="slot-list list">${l.map(t => hwRow(TEACH, t, d, 'edit', true)).join('')}</div>` : ''}</section>` : ''; }).join('')}</div>`
      : `<p class="foot-note" style="margin-top:0">Bài cô giao hiện ngay trong mục Bài tập trên máy của ${esc(info.student)}, kèm file cô đính kèm. Con tick làm xong thì cô thấy ở đây.</p>`;
  } else {
    h += (st.done.length ? `<div class="slots">${feeSection(d, feeOf(info), null)}${bankSection(d, true)}${soMonths(TEACH, d, 'view')}</div>` : `<p class="foot-note" style="margin-top:0">Báo cáo theo tháng (số buổi đã dạy để tính học phí, nội dung, nhận xét, bài tập) sẽ hiện ở đây sau buổi học đầu tiên. Phụ huynh xem được đúng phần này.</p><div class="slots">${bankSection(d, true)}</div>`);
  }
  shell(nav, h);
}
// Ô ghi từng nhiệm vụ của bài tập về nhà: mỗi ô một bài, nút Thêm nhiệm vụ thêm ô mới.
export const hwRowInput = n => `<textarea class="input hw-in grow" rows="1" maxlength="300" placeholder="Nhiệm vụ ${n}" aria-label="Nhiệm vụ ${n}"></textarea>`;
// Kiểm tra bài tập buổi trước: Hoàn thành, Thiếu (kèm mức thiếu) hoặc Không làm.
export const CHK = { du: 'Hoàn thành', 'thieu-it': 'Thiếu ít', 'thieu-nua': 'Thiếu một nửa', 'thieu-nhieu': 'Thiếu nhiều', khong: 'Không làm' };
const chkKind = c => c === 'du' ? 'ok' : c === 'khong' ? 'owe' : c ? 'wait' : '';
function hwCheckRow(t) {
  const c = t.chk || '', main = c.startsWith('thieu') ? 'thieu' : c, lv = main === 'thieu' ? c : 'thieu-it';
  return `<div class="fr col hw-chk"><div class="fl"><span class="lbl">${esc(t.title)}</span><span class="fs">${esc([t.due ? `hạn ${dm(parse(t.due))}` : '', t.done ? 'con báo đã xong' : ''].filter(Boolean).join(' · '))}</span></div>
    ${segPick('chk-' + t.id, [['du', 'Hoàn thành'], ['thieu', 'Thiếu'], ['khong', 'Không làm']], main)}
    <div class="hw-lv" ${main === 'thieu' ? '' : 'hidden'}><span class="muted small">Mức thiếu</span>${segPick('lv-' + t.id, [['thieu-it', 'Ít'], ['thieu-nua', 'Một nửa'], ['thieu-nhieu', 'Nhiều']], lv)}</div></div>`;
}
// Hai, ba lựa chọn thì hiện hết ra, bấm vào để chọn (thay cho ô chọn thả xuống).
const segPick = (name, opts, val) => `<div class="seg modes seg-pick">${opts.map(([v, l]) => `<label><input type="radio" name="${name}" value="${esc(v)}" ${String(v) === String(val) ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div>`;
// Thời lượng và hình thức mặc định của buổi học ngày dk: thời lượng theo thứ nhà đã ghi (dur), không có thì theo lịch học thêm của thứ đó,
// rồi như buổi gần nhất cùng thứ, rồi như buổi trước. Hình thức như buổi gần nhất cùng thứ (lớp có buổi Online, Offline cố định theo thứ), rồi như buổi trước.
export function sessDefaults(d, dk) {
  const info = d.info.lop || {}, wd = parse(dk || key(today())).getDay(), ss = sessList(d).filter(x => x.state !== 'plan' && x.date), last = ss[ss.length - 1];
  const same = ss.filter(x => parse(x.date).getDay() === wd), slot = schedSlots(info).find(x => Number(x.day) === wd);
  const slotMin = slot && slot.s && slot.e ? Math.max(0, toMin(slot.e) - toMin(slot.s)) : 0;
  const fixed = info.student ? fixedFor(info.student, info.name)?.mode[wd] || '' : '';
  return { mins: durOf(info)[wd] || slotMin || Number(same[same.length - 1]?.mins) || Number(last?.mins) || 90, mode: fixed || (same.filter(x => x.mode).pop() || last)?.mode || 'off', sure: !!fixed || same.some(x => x.mode) };
}
export function sessForm(id, preDate) {
  if (id && !okId(id)) return;
  const d = soOf(TEACH), s = id ? d.sessions[id] : null, ss = sessList(d), last = ss.filter(x => x.state !== 'plan').pop(), info = d.info.lop || {};
  const day0 = okDate(preDate) || key(today()), hws = id ? hwList(d).filter(t => t.session === id) : [], def = sessDefaults(d, day0);
  const mins = s ? Number(s.mins) || 0 : def.mins, sdk = s ? okDate(s.date) : day0, due0 = hwDueAfter(d, sdk), dueDef = due0 ? key(due0) : '';
  // Bài tập buổi trước để cô tick: bài chưa kiểm tra của buổi liền trước, hoặc đã tới hạn; bài cô đã tick ở buổi này thì hiện lại để sửa.
  const prev = ss.filter(x => x.id !== id && x.state !== 'plan' && x.date && (!sdk || x.date < sdk)).pop();
  const prevHw = hwList(d).filter(t => t.session !== (id || '~') && (t.chkBy ? t.chkBy === id : !t.got && ((prev && t.session === prev.id) || (t.due && sdk && t.due <= sdk))));
  attStart(TEACH, s?.files);
  openModal(`<h2>${s ? `Buổi ${ss.find(x => x.id === id)?.no || ''}` : 'Ghi buổi học'}</h2>
  <div class="fg f-title"><div class="ft"><div class="hw-title" id="stitle">${esc(s?.topic || sessDayTitle(sdk))}</div></div></div>
  <div class="fg">
    ${frow('Ngày học', `<input id="sdate" class="pillin num" type="date" value="${esc(sdk)}">`, { id: 'sdate' })}
    ${frow('Trạng thái', segPick('sstate', [['done', 'Đã học'], ['plan', 'Chưa học']], s?.state || 'done'))}
    ${frow('Hình thức', segPick('smode', SESS_MODES.filter(x => x[0]), s ? s.mode || '' : def.mode), { sub: feeOf(info).on ? 'Học phí buổi Online và Offline khác nhau, cô chọn đúng hình thức nhé' : '' })}
    ${frow('Thời lượng', pillNum('smins', mins, { step: 15, unit: 'phút' }), { id: 'smins' })}
  </div>
  <p class="fg-cap">Cô cần ghi</p>
  <div class="fg">${frow('Nội dung học', `<textarea id="scontent" class="input" rows="3" maxlength="2000" placeholder="Hôm nay học gì?">${esc(s?.content || '')}</textarea>`, { id: 'scontent', cls: 'col' })}
    ${frow('Nhận xét học sinh', `<textarea id="snote" class="input" rows="3" maxlength="2000" placeholder="Con học thế nào, cần chú ý gì…">${esc(s?.note || '')}</textarea>`, { id: 'snote', cls: 'col', sub: 'Chỉ phụ huynh xem được.' })}
    <div class="fr col"><div class="fl"><span class="lbl">Bài tập về nhà</span></div>
      ${hws.length ? `<div class="list menu">${hws.map(t => `<button class="item nav" data-act="sess-save" data-id="${id}" data-hw="${t.id}"><span class="ico">📝</span><span class="txt"><span class="t">${esc(t.title)}</span><span class="s">${esc(hwState(t).txt)}</span></span>${CHEV}</button>`).join('')}</div>` : ''}
      <div class="hw-rows" id="shw-list" data-base="${hws.length}">${hws.length ? '' : hwRowInput(1)}</div>
      <button class="linkbtn hw-add" data-act="hw-row-add">${PLUS}Thêm nhiệm vụ</button></div>
    ${frow('Hạn nộp', `<input id="shdue" class="pillin num" type="date" value="${esc(dueDef)}">`, { id: 'shdue', sub: 'Mặc định là buổi học tới' })}
    <div class="fr"><button class="btn quiet sm" data-act="sess-save" data-id="${id || ''}" data-hw="new">📎 Đính kèm file (nếu có)</button></div></div>
  ${prevHw.length ? `<p class="fg-cap">Bài tập buổi trước</p>
  <div class="fg">${prevHw.map(t => hwCheckRow(t)).join('')}</div><p class="foot-note" style="margin:-8px 6px 0">Chọn Thiếu hoặc Không làm thì con bị trừ tiền theo mục phạt Thiếu BTVN của nhà.</p>` : ''}
  <p class="fg-cap">Thêm nếu cần (không bắt buộc)</p>
  <div class="fg">${frow('Sách, nguồn tham khảo', `<input id="ssrc" class="input" maxlength="200" value="${esc(s?.src || '')}" placeholder="Ví dụ: SGK tập 1, bài 1–4">`, { id: 'ssrc', cls: 'col' })}
    ${frow('Mục tiêu buổi sau', `<input id="snext" class="input" maxlength="300" value="${esc(s?.next || '')}" placeholder="Ví dụ: chữa bài tập, sang chuyên đề mới">`, { id: 'snext', cls: 'col' })}
    ${frow('Slide, tài liệu', attBox(), { cls: 'col', sub: 'File hoặc ảnh, mỗi file tối đa 8 MB' })}
    ${frow('Link', `<textarea id="slinks" class="input" rows="2" maxlength="2000" placeholder="https://…">${esc(linkList(s?.links).join('\n'))}</textarea>`, { id: 'slinks', cls: 'col', sub: 'Canva, Google Drive… mỗi dòng một link' })}</div>
  ${formFoot(s ? 'sess-del' : '', id, 'sess-save')}`);
  $('#modal .dialog')?.focus();
}
export function hwForm(id, sessPre) {
  if (id && !okId(id)) return;
  const d = soOf(TEACH), t = id ? d.tasks[id] : null, ss = sessList(d).reverse(), nx = nextClassDay(d);
  const sess = t ? t.session || '' : sessPre || '';
  attStart(TEACH, t?.files);
  openModal(`<h2>${t ? 'Bài tập' : 'Giao bài tập'}</h2>
  ${longTitle('htitle', t?.title, 'Bài gì?')}
  <div class="fg">
    <div class="fr col">${frow('Hạn nộp', `<input id="hdue" class="pillin num" type="date" value="${esc(t ? okDate(t.due) : nx ? key(nx) : '')}">`, { id: 'hdue', cls: 'in' })}
      <div class="row"><button class="btn quiet sm" data-act="hw-due" data-v="next">Buổi học tới</button><button class="btn quiet sm" data-act="hw-due" data-v="1">Ngày mai</button><button class="btn quiet sm" data-act="hw-due" data-v="7">Một tuần nữa</button><button class="btn quiet sm" data-act="hw-due" data-v="">Không có hạn</button></div></div>
    ${ss.length ? frow('Của buổi', pillSel('hsess', [['', 'Không gắn buổi'], ...ss.map(s => [s.id, `Buổi ${s.no}${s.date ? ' · ' + dm(parse(s.date)) : ''}`])], ss.some(s => s.id === sess) ? sess : ''), { id: 'hsess' }) : ''}
  </div>
  <div class="fg">${frow('Hướng dẫn', `<textarea id="hnotes" class="input" rows="3" maxlength="2000" placeholder="Làm vào vở nào, trang mấy, cần chú ý gì…">${esc(t?.notes || '')}</textarea>`, { id: 'hnotes', cls: 'col' })}
    ${frow('Các bước', `<textarea id="hsteps" class="input" rows="2" placeholder="Ôn lại lý thuyết&#10;Làm phiếu bài tập">${esc(cleanSteps(t?.steps).map(x => x.t).join('\n'))}</textarea>`, { id: 'hsteps', cls: 'col', sub: 'Không bắt buộc. Mỗi dòng một bước, con tick từng bước.' })}</div>
  <div class="fg">${frow('Đính kèm', attBox(), { cls: 'col', sub: 'Phiếu bài tập, ảnh chụp đề… con mở được ngay trong bài. Mỗi file tối đa 8 MB.' })}
    ${frow('Link', `<textarea id="hlinks" class="input" rows="2" maxlength="2000" placeholder="https://…">${esc(linkList(t?.links).join('\n'))}</textarea>`, { id: 'hlinks', cls: 'col', sub: 'Canva, Google Drive… mỗi dòng một link' })}</div>
  ${t && cleanFiles(t.sub).length ? `<div class="fg">${frow('Bài con nộp', subFiles(TEACH, id, cleanFiles(t.sub), false) + `<div class="row"><button class="btn quiet sm" data-act="sub-dl" data-id="${esc(id)}">⬇️ Tải tất cả ${cleanFiles(t.sub).length} file về máy</button></div>`, { cls: 'col', sub: `${cleanFiles(t.sub).length} file${okDate(t.subAt) ? ' · nộp ngày ' + dm(parse(t.subAt)) : ''} · bấm vào file để xem` })}</div>` : ''}
  ${t ? `<div class="fg">${frow('Nhận bài', segPick('hgot', [['0', 'Chưa nhận'], ['1', 'Đã nhận']], t.got ? '1' : '0'), { sub: cleanFiles(t.sub).length && t.done ? `Con đã nộp ${cleanFiles(t.sub).length} file${okDate(t.subAt) ? ' ngày ' + dm(parse(t.subAt)) : ''}. Xem xong thì chọn Đã nhận` : cleanFiles(t.sub).length ? `Con đã tải lên ${cleanFiles(t.sub).length} file nhưng chưa bấm Nộp bài` : t.done ? `Con báo đã làm xong${okDate(t.doneAt) ? ' ngày ' + dm(parse(t.doneAt)) : ''}` : 'Con chưa báo làm xong. Ghi điểm thì bài tự tính là đã nhận' })}
    ${frow('Điểm', `<input id="hscore" class="pillin txt" maxlength="30" value="${esc(t.score || '')}" placeholder="9/10">`, { id: 'hscore' })}
    ${frow('Nhận xét bài làm', `<textarea id="hreview" class="input" rows="3" maxlength="2000" placeholder="Con làm tốt phần nào, cần sửa gì…">${esc(t.review || '')}</textarea>`, { id: 'hreview', cls: 'col', sub: 'Con và phụ huynh đều đọc được' })}</div>` : ''}
  ${formFoot(t ? 'hw-del' : '', id, 'hw-save', t ? 'Lưu' : 'Giao bài')}`);
  teachFocus('htitle', !t);
  loadThumbs();
}

// ----- phần của nhà: danh sách sổ, tạo sổ, gửi link cho cô, xem sổ -----
export function classesSection(ks) {
  if (RO) return '';
  const ids = ks.map(k => k.id), list = classesList().filter(c => ids.includes(c.kid)), multi = ks.length > 1, kidAttr = `data-kid="${multi ? '' : ids[0]}"`;
  const offers = classOffers(ks);
  const item = c => { const k = CLS[c.code], st = soStats(soOf(c.code)), last = st.done[st.done.length - 1];
    const sub = !k || !k.loaded ? 'Đang mở sổ…' : !st.ss.length && !st.hw.length ? `Sổ còn trống${feeTxt(feeOf(c)) ? ' · ' + feeTxt(feeOf(c)) : ''}. Gửi link cho cô để cô bắt đầu ghi.`
      : [`${st.done.length} buổi đã học`, last ? `gần nhất ${dateTxt(last.date)}` : '', st.open ? `${st.open} bài đang làm` : '', st.wait ? `${st.wait} bài chờ cô nhận` : '', soMissing(soOf(c.code)).n ? `${soMissing(soOf(c.code)).n} buổi cô chưa ghi` : ''].filter(Boolean).join(' · ');
    return `<button class="item nav" data-act="cls-open" data-id="${c.id}">${multi ? ava({ id: c.kid, ...S.kids[c.kid] }, 'sm') : `<span class="ico">${lessonIcon(c.name) === '📚' ? '📒' : lessonIcon(c.name)}</span>`}<span class="txt"><span class="t">${multi ? esc(kidName(c.kid)) + ' · ' : ''}${esc(classTitle(c))}</span><span class="s">${esc(sub)}</span></span>${CHEV}</button>`; };
  return feeSummary(list, multi) + `<section class="slot tn2">${secHead('📒', 'Sổ học của cô', { cnt: list.length || '', side: list.length ? `<button class="linkbtn so-links" data-act="cls-links" ${kidAttr}>Link cho các cô</button>` : '', add: addBtn('cls-form', 'Thêm sổ học cho một cô', kidAttr) })}
    ${list.length ? `<div class="slot-list list">${list.map(item).join('')}</div>` : blankAdd('Mời cô ghi sổ học và giao bài: tạo sổ rồi gửi link cho cô', 'cls-form', kidAttr)}
    ${offers.length ? `<div class="row so-offers"><span class="muted small">Tạo sổ cho buổi học thêm:</span>${offers.map(o => `<button class="btn quiet sm" data-act="cls-form" data-kid="${o.kid}" data-name="${esc(o.name)}">${PLUS}${esc(o.name)}${multi ? ` · ${esc(kidName(o.kid))}` : ''}</button>`).join('')}</div>` : ''}
    ${list.length ? '' : '<p class="foot-note">Mỗi cô một link riêng, cô chỉ thấy sổ học của lớp mình. Bài cô giao tự hiện trong Bài tập của con.</p>'}</section>`;
}
export function classForm(id, kidPre, namePre) {
  const c = id ? S.paid[id] : null, kids = kidsList(); if (!kids.length) return;
  const kid = c?.kid || (S.kids[kidPre] ? kidPre : S.kids[UI.tkbKid] ? UI.tkbKid : kids[0].id);
  const names = [...new Set([...lessonsList().map(l => String(l.name || '').trim()).filter(Boolean), 'Toán', 'Tiếng Việt', 'Ngữ văn', 'Tiếng Anh'])];
  openModal(`<h2>${c ? 'Sửa sổ học' : 'Sổ học của cô'}</h2>
  ${titleCard('clname', c?.name || namePre, 'Môn gì?', { attr: 'list="cl-list"' })}
  <datalist id="cl-list">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
  <div class="fg">
    ${kids.length > 1 ? kidRow('Con', 'clkid', 'radio', [kid]) : `<input type="hidden" name="clkid" value="${kid}">`}
    ${frow('Tên cô', `<input id="clteacher" class="pillin txt" maxlength="30" value="${esc(c?.teacher || '')}" placeholder="Cô Lan">`, { id: 'clteacher' })}
    ${frow('Tên sổ', `<input id="clbook" class="pillin txt" maxlength="40" value="${esc(c?.book || '')}" placeholder="Nhật ký học ${esc(c?.name || namePre || 'Toán')}">`, { id: 'clbook', sub: 'Không bắt buộc. Để trống thì gọi là Nhật ký học và tên môn.' })}
  </div>
  <div class="fg">
    ${frow('Học phí', pillNum('clfee', feeOf(c).fee || '', { step: 10000, ph: '0' }), { id: 'clfee', sub: 'Không bắt buộc. App đếm số buổi cô đã dạy mỗi tháng rồi nhân ra học phí; cô cũng thấy con số này.' })}
    ${frow('Buổi Online', pillNum('clfeeon', feeOf(c).on || '', { step: 5000, ph: '0' }), { id: 'clfeeon', sub: 'Chỉ ghi khi buổi Online có mức khác. App tính theo hình thức cô ghi ở từng buổi.' })}
    ${frow('Tính theo', pillSel('clfeeby', [['buoi', 'Mỗi buổi'], ['gio', 'Mỗi giờ']], feeOf(c).by), { id: 'clfeeby' })}
    <div class="fr">${toggle('clfeeshow', 'Hiện phần học phí <span class="fs">Bảng số buổi và học phí theo tháng, ở màn của cô và phần bố mẹ xem. Tắt để tạm ẩn</span>', !feeOf(c).off)}</div>
  </div>
  <p class="muted small lead">Lưu xong app tạo một link riêng cho cô. Cô mở link là ghi được buổi học, nhận xét và giao bài tập; cô không thấy việc nhà, tiền hay phần khác của gia đình. Đặt tên môn trùng với buổi học thêm (ví dụ Toán) thì hạn nộp bài tự đặt vào buổi học tới.</p>
  ${formFoot(c ? 'cls-del' : '', id, 'cls-save', 'Lưu', 'Xoá sổ')}`);
}
export function classLinkSheet(id, c = classesList().find(x => x.id === id)) {
  if (!c) return;
  openModal(`<h2>Link cho ${esc(c.teacher || 'cô')}</h2>
  <p class="muted small lead">Gửi link này cho ${esc(c.teacher || 'cô')} qua Zalo. Cô mở link trên điện thoại hoặc máy tính là vào thẳng ${esc(c.book ? c.book : 'sổ học ' + c.name)} của ${esc(kidName(c.kid))}, không cần đăng ký hay mật khẩu. Link này là chìa khoá của sổ, chỉ gửi cho cô.</p>
  <div class="fg"><div class="fr col"><div class="copyrow"><input class="input" id="cl-link" readonly value="${esc(teacherLink(c.code))}" onfocus="this.select()"><button class="btn primary sm" data-act="cls-copy" data-id="${c.id}">Sao chép</button></div></div></div>
  <div class="foot"><button class="btn quiet" data-act="close">Xong</button></div>`);
}
// Link của tất cả các cô trong một chỗ: sao chép từng link, hoặc cả danh sách để lưu lại.
export function classLinksSheet(kidId) {
  const list = classesList().filter(c => !kidId || c.kid === kidId); if (!list.length) return;
  const all = list.map(c => `${c.teacher || 'Cô'} – ${c.name} của ${kidName(c.kid)}:\n${teacherLink(c.code)}`).join('\n\n');
  openModal(`<h2>Link cho các cô</h2>
  <p class="muted small lead">Mỗi cô một link riêng. Gửi đúng link cho từng cô qua Zalo: cô mở là vào thẳng sổ học của lớp mình, không cần đăng ký hay mật khẩu. Link là chìa khoá của sổ, đừng gửi nhầm cô.</p>
  <div class="fg">${list.map(c => `<div class="fr col"><div class="fl"><span class="lbl">${esc(c.teacher || 'Cô')} · ${esc(c.name)} của ${esc(kidName(c.kid))}</span></div>
    <div class="copyrow"><input class="input" readonly value="${esc(teacherLink(c.code))}" onfocus="this.select()" aria-label="Link của ${esc(c.teacher || 'cô')}"><button class="btn primary sm" data-act="cls-copy" data-link="${esc(teacherLink(c.code))}" data-who="${esc(c.teacher || 'cô')}">Sao chép</button></div></div>`).join('')}</div>
  ${list.length > 1 ? `<div class="row"><button class="btn quiet sm" data-act="cls-copy" data-link="${esc(all)}" data-who="">Sao chép cả ${list.length} link kèm tên cô</button></div>` : ''}
  <div class="foot"><button class="btn quiet" data-act="close">Xong</button></div>`);
}
// Học phí của tất cả các cô, ở đầu mục Sổ học (Học tập › Học thêm): các tháng đã qua mà bố mẹ chưa xác nhận chuyển khoản, bấm Đã chuyển
// ngay tại đây (kèm nút sao chép số tài khoản của cô), và học phí tháng này đến nay. Sổ tạm ẩn học phí hoặc chưa ghi học phí thì không tính.
function feeSummary(list, multi) {
  const mk = key(today()).slice(0, 7), due = [], cur = [];
  for (const c of list) {
    const f = feeOf(c); if (f.off || !(f.fee || f.on)) continue;
    const d = soOf(c.code), fees = soFees(d, f), paid = paidOf(d), who = `${c.teacher || 'Cô'} · ${c.name}${multi ? ` · ${kidName(c.kid)}` : ''}`;
    for (const r of fees.filter(r => r.mk < mk && !paid[r.mk]).reverse()) due.push({ c, r, who, b: bankOf(d) });
    const now = fees.find(r => r.mk === mk); if (now) cur.push({ c, r: now, who, paid: paid[mk] });
  }
  if (!due.length && !cur.length) return '';
  const ico = c => lessonIcon(c.name) === '📚' ? '📒' : lessonIcon(c.name);
  // Số tiền nằm trong dòng mô tả, hai nút ở hàng dưới: tên cô và môn không bị ép hẹp, hai nút vừa một hàng trên điện thoại.
  const dueRow = ({ c, r, who, b }) => `<div class="item fee-row"><span class="ico">${ico(c)}</span><div class="txt"><div class="t">${esc(who)}</div><div class="s"><span class="late">${monthTxt(r.mk)} chưa đóng</span> · <span class="num">${r.n} buổi</span> · <b class="num">${money(r.amount)}</b></div>
    <div class="row" style="margin-top:8px">${b.number ? `<button class="btn quiet sm" data-act="cls-copy" data-link="${esc(b.number)}" data-msg="Đã sao chép số tài khoản của ${esc(c.teacher || 'cô')}.">Sao chép STK</button>` : ''}<button class="btn primary sm" data-act="fee-paid" data-id="${c.id}" data-mk="${r.mk}" data-amount="${r.amount}">Đã chuyển</button></div></div></div>`;
  const curRow = ({ c, r, who, paid }) => `<div class="item fee-row"><span class="ico">${ico(c)}</span><div class="txt"><div class="t">${esc(who)}</div><div class="s"><span class="num">${r.n} buổi</span>${r.mins ? ` · ${durTxt(r.mins)}` : ''}${paid ? ` · <span class="fee-ok">✓ đã đóng ${dm(parse(paid.at))}</span>` : ''}</div></div><div class="acts col"><span class="delta num">${money(r.amount)}</span></div></div>`;
  const total = cur.reduce((a, x) => a + x.r.amount, 0);
  return `<section class="slot tn3">${secHead('💰', 'Học phí')}
    ${due.length ? `${secHead('', 'Chưa đóng', { cnt: due.length, sub: true })}<div class="slot-list list">${due.map(dueRow).join('')}</div>` : ''}
    ${cur.length ? `${secHead('', `${monthTxt(mk)} đến nay`, { cnt: money(total), sub: true })}<div class="slot-list list">${cur.map(curRow).join('')}</div>` : ''}
    <p class="foot-note" style="margin:0 6px">${due.length ? 'Chuyển khoản xong thì bấm Đã chuyển, cô thấy ngay.' : 'Không có tháng nào chưa đóng.'} Học phí tính theo các buổi cô ghi là Đã học. Bấm vào một sổ bên dưới để xem từng tháng.</p></section>`;
}
// Trang sổ học của một cô (phần bố mẹ xem, #lich-hoc/so/<mã sổ>), mở từ Học tập › Học thêm hoặc từ màn Hôm nay. Nút quay lại ở góc trái.
// Sửa sổ, ghi tài khoản của cô, xem bài tập mở form nổi trên trang, đóng form là về đúng trang này. In, nhập Excel, sửa sổ nằm trong menu ⋯.
export function soPage(c) {
  const k = CLS[c.code], d = soOf(c.code), st = soStats(d), free = st.hw.filter(t => !st.ss.some(s => s.id === t.session && s.state !== 'plan'));
  const back = String(UI.soBack || '').startsWith('#hom-nay') ? 'Hôm nay' : 'Học thêm';
  return `<div class="tbar"><button class="linkbtn back" data-act="so-back">${PREV}${back}</button><span style="flex:1"></span>${pillBar(moreBtn('so-menu', 'In, nhập từ Excel, sửa sổ'))}</div>
  <div class="day-head"><h1>${esc(bookName(c))}</h1></div>
  <div class="row">${ava({ id: c.kid, ...S.kids[c.kid] }, 'sm')}<span><b>${esc(kidName(c.kid))}</b>${c.teacher ? ` · ${esc(c.teacher)}` : ''}</span><span style="flex:1"></span><button class="btn primary sm" data-act="cls-link" data-id="${c.id}">🔗 Link cho cô</button></div>
  ${!k || !k.loaded ? '<p class="muted">Đang mở sổ…</p>' : k.err ? '<div class="note">Chưa mở được sổ học. Kiểm tra mạng rồi thử lại.</div>'
    : !st.ss.length && !st.hw.length ? `<div class="card empty"><div class="big">📒</div><h2>Sổ còn trống</h2><p class="muted">Gửi link cho ${esc(c.teacher || 'cô')}. Cô ghi buổi học và giao bài thì hiện ngay ở đây.</p></div><div class="slots">${bankSection(d, false, c.teacher, c.id)}</div>`
    : `${soTiles(st, feeOf(c), d)}<div class="slots">${feeSection(d, feeOf(c), c)}${bankSection(d, false, c.teacher, c.id)}${free.length ? `<section class="slot tn0">${secHead('', 'Bài tập', { cnt: free.length })}<div class="slot-list list">${free.map(t => hwRow(c.code, t, d, 'view')).join('')}</div></section>` : ''}${soMonths(c.code, d, 'view')}</div>`}`;
}
// Bài cô giao, mở từ phần Bài tập của nhà hoặc máy của con: hướng dẫn, file đính kèm, điểm và nhận xét của cô. Chỉ xem, tick xong ở ngoài danh sách.
// Nhờ bố mẹ in file cô gửi (máy của con): tải sẵn các file khi mở bài, bấm Nhờ bố mẹ in thì mở bảng chia sẻ của điện thoại
// (có file và lời nhắn sẵn) để con chọn Zalo rồi chọn bố hoặc mẹ. Trang web không mở thẳng được khung chat Zalo của một người kèm file.
// File phải tải xong trước khi bấm: điện thoại chỉ mở bảng chia sẻ ngay trong lúc bấm.
const PRINT_FILES = {};   // mã bài → { files: [File], at } hoặc { busy: true }
async function printPrefetch(tid, code, files) {
  if (PRINT_FILES[tid]?.files || PRINT_FILES[tid]?.busy) return;
  const st = CLS[code]?.st; if (!st) return;
  PRINT_FILES[tid] = { busy: true };
  try {
    const out = [];
    for (const f of cleanFiles(files)) out.push(new File(await st.getFile(f.id, f.n), f.name, { type: f.type || 'application/octet-stream' }));
    PRINT_FILES[tid] = { files: out };
  } catch (e) { console.error(e); delete PRINT_FILES[tid]; }
}
export function printAsk(tid, who = 'bố mẹ') {
  const t = classTasks().find(x => x.id === tid); if (!t || !t.cls) return;
  const w = t.hw, c = t.cls, got = PRINT_FILES[tid]?.files;
  const links = linkList(w.links);
  // Máy của bố mẹ (Gửi file in): lời nhắn chỉ ghi bài gì, bố mẹ tự chọn người nhận.
  if (who === 'send') {
    const txt = `In giúp bài “${w.title}” của ${kidName(t.kid)} (${c.name}${c.teacher ? ' · ' + c.teacher : ''}${w.due ? `, hạn ${dateTxt(w.due)}` : ''}).${links.length ? '\n' + links.join('\n') : ''}`;
    if (!got) { printPrefetch(tid, c.code, w.files); return toast('Đang tải file, bấm lại sau vài giây nhé.'); }
    if (navigator.canShare && navigator.canShare({ files: got })) { navigator.share({ files: got, title: w.title, text: txt }).then(() => toast('Đã gửi file.'), e => { if (e?.name !== 'AbortError') printFallback(got, txt, 'người nhận'); }); return; }
    return printFallback(got, txt, 'người nhận');
  }
  // Máy của con (Nhờ bố mẹ in): lời nhắn ngắn, file gửi kèm. Bài có link thì ghi link ở dòng dưới để mẹ mở được.
  const text = `Mẹ in hộ con với ạ${links.length ? '\n' + links.join('\n') : ''}`;
  if (!got) { printPrefetch(tid, c.code, w.files); return toast('Đang tải file, bấm lại sau vài giây nhé.'); }
  if (navigator.canShare && navigator.canShare({ files: got })) {
    navigator.share({ files: got, title: w.title, text }).then(() => toast(`Đã gửi cho ${who}.`), e => { if (e?.name !== 'AbortError') printFallback(got, text, who); });
    return;
  }
  printFallback(got, text, who);
}
// Máy không chia sẻ được file (máy tính): tải file về và chép sẵn lời nhắn để con dán vào Zalo.
function printFallback(files, text, who) {
  for (const f of files) { const u = URL.createObjectURL(f), a = Object.assign(document.createElement('a'), { href: u, download: f.name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000); }
  const done = () => toast(`Đã tải file về máy và chép lời nhắn. Mở Zalo, gửi file và dán lời nhắn cho ${who} nhé.`);
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => toast(`Đã tải file về máy. Mở Zalo gửi file cho ${who} nhé.`)); else done();
}
// Nộp bài: con (hoặc bố mẹ nộp hộ) chụp ảnh bài làm hay chọn file ảnh, PDF. Ảnh tự thu nhỏ, lưu vào sổ của cô (task.sub).
// Tải file lên chưa phải là nộp: con chụp đủ các trang rồi bấm Nộp bài (task-done) thì bài mới tính là đã nộp (done), cô mới thấy bài mới nộp.
// Đã nộp rồi vẫn nộp thêm được. Cô chưa nhận bài thì xoá được file nộp nhầm.
const SUB_BUSY = {};   // mã bài → số file đang tải lên
function subSection(tid, code, w) {
  const files = cleanFiles(w.sub), busy = SUB_BUSY[tid] || 0;
  if (w.got && !files.length) return '';
  return `<div class="fg"><div class="fr col"><div class="fl"><span class="lbl">Nộp bài</span><span class="fs">${!files.length ? 'Chụp ảnh từng trang bài làm hoặc chọn ảnh, file PDF. Đủ hết các trang thì bấm nút Nộp bài.'
      : w.done ? `Đã nộp ${files.length} file${okDate(w.subAt) ? ' ngày ' + dm(parse(w.subAt)) : ''}. Cô xem được ngay.` : `Đã tải lên ${files.length} file, <b>chưa nộp</b>. Còn trang nào thì chụp thêm, đủ rồi bấm nút Nộp bài.`}</span></div>
    ${subFiles(code, tid, files, !w.got)}
    ${busy ? `<div class="att-busy" role="status">Đang nộp ${busy} file…</div>` : ''}
    ${w.got ? '' : `<label class="btn ${files.length ? 'quiet' : 'primary'} sm file-btn sub-btn">📷 ${files.length ? 'Thêm ảnh hoặc file' : 'Chụp ảnh hoặc chọn file'}<input type="file" id="sub-file" data-tid="${esc(tid)}" accept="image/*,application/pdf" multiple></label>`}</div></div>`;
}
export const subMay = t => !!t && (deviceRole() === 'parent' || t.kid === deviceRole());
export async function subAdd(tid, list) {
  const t = classTasks().find(x => x.id === tid); if (!t || !t.cls || !subMay(t)) return;
  const code = t.cls.code, st = CLS[code]?.st; if (!st) return toast('Sổ học đang mở, thử lại sau giây lát.');
  if (t.hw.got) return toast('Cô đã nhận bài này rồi.');
  if (!navigator.onLine && st.kind !== 'local') return toast('Cần có mạng để nộp bài.');
  const added = [];
  for (const raw of [...list].slice(0, 10)) {
    SUB_BUSY[tid] = (SUB_BUSY[tid] || 0) + 1; if (!$('#modal').hidden) hwView(tid);
    try {
      const file = await shrinkImage(raw);
      if (file.size > FILE_MAX) { toast(`“${raw.name}” nặng ${fileSize(file.size)}, quá ${fileSize(FILE_MAX)}.`); continue; }
      const id = uid(), u8 = new Uint8Array(await file.arrayBuffer());
      added.push({ id, n: await st.putFile(id, u8), name: String(file.name || 'anh.jpg').slice(0, 120), type: file.type || '', size: u8.length });
    } catch (e) { console.error(e); toast(`Chưa nộp được “${raw.name}”. Kiểm tra mạng rồi thử lại.`); }
    finally { SUB_BUSY[tid]--; }
  }
  if (!added.length) { if (!$('#modal').hidden) hwView(tid); return; }
  const cur = soOf(code).tasks[t.hw.id] || {}, sub = [...cleanFiles(cur.sub), ...added].slice(0, 20);
  if (!clsPatch(code, 'tasks', t.hw.id, { sub, subAt: key(today()) })) return;
  if (!$('#modal').hidden) hwView(tid);
  toast(cur.done ? `Đã nộp thêm ${added.length} file. Cô xem được ngay.` : `Đã tải lên ${added.length} file (tất cả ${sub.length} file). Còn trang nào thì chụp thêm, đủ rồi bấm Nộp bài.`);
}
export function hwView(tid) {
  const t = classTasks().find(x => x.id === tid); if (!t || !t.cls) return;
  const w = t.hw, c = t.cls, st = hwState(w), subs = cleanFiles(w.sub).length;
  if (cleanFiles(w.files).length) printPrefetch(tid, c.code, w.files);
  openModal(`<h2>Bài cô giao</h2>
  <div class="fg f-title"><div class="ft"><div class="hw-title">${esc(w.title)}</div></div></div>
  <div class="fg">${frow('Môn', `<span class="fv-val">${subjDot(t.subj)}${esc(c.name)}${c.teacher ? ' · ' + esc(c.teacher) : ''}</span>`)}
    ${frow('Hạn nộp', `<span class="fv-val ${st.k === 'late' ? 'late' : ''}">${w.due ? esc(`${dateTxt(w.due)}${w.got || w.done ? '' : ' · ' + (daysTo(w.due) < 0 ? st.txt : daysTo(w.due) < 2 ? dueLabel(w.due) : `còn ${daysTo(w.due)} ngày`)}`) : 'Chưa có hạn'}</span>`)}
    ${frow('Tình trạng', `<span class="fv-val hw-st ${st.k}">${esc(w.got ? (w.chk ? 'Cô đã kiểm tra: ' + CHK[w.chk] : 'Cô đã nhận bài') : w.done ? (subs ? 'Đã nộp bài, chờ cô nhận' : 'Đã báo làm xong, chờ cô nhận') : subs ? 'Chưa nộp' : 'Đang làm')}</span>`)}
    ${w.score ? frow('Điểm', `<span class="fv-val"><b class="num">${esc(w.score)}</b></span>`) : ''}</div>
  ${w.review ? `<div class="fg">${frow('Cô nhận xét', `<div class="so-p">${esc(w.review)}</div>`, { cls: 'col' })}</div>` : ''}
  ${w.notes ? `<div class="fg">${frow('Cô dặn', `<div class="so-p">${esc(w.notes)}</div>`, { cls: 'col' })}</div>` : ''}
  ${attView(c.code, w.files, w.links) ? `<div class="fg">${frow('Đính kèm', attView(c.code, w.files, w.links), { cls: 'col', sub: 'Bấm để mở' })}
    ${cleanFiles(w.files).length ? (deviceRole() !== 'parent' ? `<div class="fr col"><div class="fl"><span class="lbl">Cần in bài?</span><span class="fs">Bấm nút, chọn Zalo rồi chọn bố hoặc mẹ để gửi file</span></div>
      <div class="row print-ask"><button class="btn quiet sm" data-act="print-ask" data-id="${esc(tid)}">🖨️ Nhờ bố mẹ in</button></div></div>`
      : `<div class="fr col"><div class="fl"><span class="lbl">In bài</span><span class="fs">Bấm nút, chọn Zalo (hoặc ứng dụng khác) rồi chọn người nhận</span></div>
      <div class="row print-ask"><button class="btn quiet sm" data-act="print-ask" data-id="${esc(tid)}" data-who="send">📤 Gửi file in</button></div></div>`) : ''}</div>` : ''}
  ${subSection(tid, c.code, w)}
  <div class="foot"><button class="btn quiet" data-act="close">Đóng</button>${w.got ? ''
    : t.done ? `<button class="btn quiet sm left" data-act="task-done" data-id="${esc(tid)}">${subs ? 'Rút lại bài đã nộp' : 'Chưa làm xong'}</button>`
    : `<button class="btn primary" data-act="task-done" data-id="${esc(tid)}" data-close="1" ${SUB_BUSY[tid] ? 'disabled' : ''}>${subs ? `📤 Nộp bài (${subs} file)` : 'Đã làm xong'}</button>`}</div>`);
  loadThumbs();
}
