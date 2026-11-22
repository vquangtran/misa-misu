// Sửa dữ liệu một lần cho cả nhà: thêm sẵn mục, đổi tên, đổi lịch, tạo và tự nhập sổ học từ data/*.json.
import { addDays, DAILY, key, newFamilyCode, norm, parse, slug, toast, today } from './chung.js';
import { isSa, isSu, isSuTV, SA, SA_TV_HW_FROM, SAMPLE_CLASSES, SU, SU_TV_BOOK, SU_TV_DUR, SU_TV_HW_FROM, SU_TV_MODE } from './nha-minh.js';
import { choresList, del, deviceRole, isDaily, isDone, isFun, kidName, kidsList, lessonsList, loaded, placeName, pricesList, put, S, setDone,
  SETTINGS_ID, stale, stepMask, stepText, TEACH } from './du-lieu.js';
import { classesList, classesOf, classLessons, classTitle, CLS, clsPut, fixedFor, okDate, onSoData, paidOf, parseSoRows, sessList, soImportApply,
  soImportPlan } from './so-hoc.js';
import { FUN_DEFAULT, HW_CHORES, HW_PENALTY, SAMPLE_MERITS, sampleAdds, TABLE_VER } from './quy-dinh.js';

// Những sổ mẫu nhà chưa có (so theo con và môn). id cố định theo con và thứ tự mẫu: hai máy cùng tạo thì vẫn chỉ ra một sổ.
const classSamples = () => kidsList().flatMap(k => SAMPLE_CLASSES.map((sp, i) => ({ sp, i })).filter(({ sp }) => sp.kids.includes(norm(k.name)) && !classesOf(k.id).some(c => norm(c.name) === norm(sp.name)))
  .map(({ sp, i }) => ({ id: `lop-${k.id}-${i}`, kid: k.id, name: sp.name, ...(sp.book ? { book: sp.book } : {}), ...(sp.dur ? { dur: sp.dur.slice() } : {}), teacher: sp.teacher, fee: sp.fee || 0, feeOn: sp.feeOn || 0, feeBy: 'buoi', feeOff: !!sp.feeOff })));
// Sổ Tiếng Việt của Su: tự nhập một lần file theo dõi tiến độ cô Thảo gửi (data/so-tieng-viet-su.json, chép từ file Excel) trên máy của bố mẹ,
// khi sổ đã mở xong từ máy chủ. Học phí các tháng trước tháng 11/2026 đã đóng, tháng 11 chưa. Nhập xong ghi xlAuto vào sổ để không nhập lại.
let suAutoBusy = false;
async function suAutoImport(code) {
  if (suAutoBusy || TEACH || !loaded || stale || deviceRole() !== 'parent') return;
  const c = classesList().find(x => x.code === code), k = CLS[code];
  if (!c || (c.xlAuto && k && SU_FIXES.every(f => k.data.info?.fixes?.[f])) || !isSuTV(kidName(c.kid), c.name) || !k || !k.loaded || k.stale || k.err || !k.st) return;
  if (c.xlAuto) return suFixes(code, c, k);
  suAutoBusy = true;
  try {
    const r = await fetch('data/so-tieng-viet-su.json', { cache: 'no-cache' }); if (!r.ok) return;
    const parsed = parseSoRows((await r.json()).rows || []); if (!parsed) return;
    const cur = classesList().find(x => x.code === code); if (!cur || cur.xlAuto || CLS[code] !== k) return;
    const plan = soImportPlan(code, cur.id, parsed);
    plan.months = plan.months.filter(m => m < '2026-11');
    if (!soImportApply(plan, plan.months.length > 0)) return;
    const { id, ...o } = classesList().find(x => x.code === code) || cur; put('paid', id, { ...o, xlAuto: 1, paidFix: 1 });
    suFixes(code, { id, ...o, xlAuto: 1, paidFix: 1 }, k);
    if (plan.sessions.length) toast(`Đã nhập sổ ${classTitle(cur)}: ${plan.sessions.length} buổi, ${plan.tasks.length} bài tập${plan.months.length ? `, học phí ${plan.months.map(m => 'tháng ' + Number(m.slice(5))).join(', ')} đã đóng` : ''}.`);
  } catch (e) { console.error(e); } finally { suAutoBusy = false; }
}
// Các lần sửa một lần cho sổ Tiếng Việt của Su sau khi đã nhập file (mỗi lần một cờ trong sổ):
//  paidFix: tháng 10 đóng ngày 1/11 (không phải ngày nhập), tháng 11 chưa đóng (hết tháng mới đóng).
//  fix1711: buổi 10 (CN 15/11) đã học; T3 17/11 là buổi 11 (cô chưa ghi); các buổi kế hoạch sau đó xếp lần lượt vào các ngày có lịch
//           từ CN 22/11; mọi buổi vào chủ nhật là Offline 2 tiếng, thứ 3 là Online 1 tiếng (sửa cả buổi cũ ghi lệch).
// Cờ đã sửa lưu cả trong sổ (info/fixes, máy của cô cũng đọc được) lẫn ở sổ của nhà (bản trước chỉ lưu ở đây): có một trong hai là đã sửa.
const SU_FIXES = ['paidFix', 'fix1711', 'fill1'];
const suFixDone = (c, d, f) => !!((c && c[f]) || d.info?.fixes?.[f]);
let suFixBusy = false;
function suFixes(code, c, k) {
  // Chạy khi trong sổ còn thiếu cờ: sửa phần chưa làm, rồi ghi đủ cờ vào sổ (kể cả phần đã làm theo cờ cũ ở sổ của nhà),
  // để máy của cô không bao giờ chạy lại phần đã làm (ví dụ không xoá xác nhận đã đóng học phí tháng 11 bố mẹ bấm sau này).
  if (suFixBusy || SU_FIXES.every(f => k.data.info?.fixes?.[f])) return;
  suFixBusy = true;
  try { suFixesRun(code, c, k); } finally { suFixBusy = false; }
}
function suFixesRun(code, c, k) {
  const flags = {}, done = f => suFixDone(c, k.data, f);
  if (!done('paidFix')) {
    const p0 = paidOf(k.data), next = { ...p0 };
    if (next['2026-10']) next['2026-10'] = { ...next['2026-10'], at: '2026-11-01' };
    delete next['2026-11'];
    if (JSON.stringify(next) !== JSON.stringify(p0)) clsPut(code, 'info', 'paid', next);
    flags.paidFix = 1;
  }
  if (!done('fix1711')) {
    const raw = k.data.sessions || {}, all = sessList(k.data), used = new Set(all.map(x => x.date).filter(Boolean));
    const setS = (id, patch) => { if (raw[id]) clsPut(code, 'sessions', id, { ...raw[id], ...patch }); };
    if (raw['xl-10']?.state === 'plan' && raw['xl-10'].date === '2026-11-15') setS('xl-10', { state: 'done' });
    // Buổi nhập từ file vào chủ nhật hay thứ 3 mà ghi lệch hình thức, thời lượng (ví dụ buổi 7, buổi 9): sửa theo lịch cố định.
    for (const [id, x] of Object.entries(raw)) if (/^xl-\d+$/.test(id) && x && okDate(x.date)) {
      const wd = parse(x.date).getDay(); if (!SU_TV_MODE[wd]) continue;
      if (x.mode !== SU_TV_MODE[wd] || Number(x.mins) !== SU_TV_DUR[wd]) setS(id, { mode: SU_TV_MODE[wd], mins: SU_TV_DUR[wd], ...(id === 'xl-10' && x.state === 'plan' ? { state: 'done' } : {}) });
    }
    // Buổi kế hoạch chưa có ngày, theo thứ tự trong file: buổi đầu vào T3 17/11 (nếu ngày đó chưa có buổi nào), các buổi sau vào các ngày có lịch tiếp theo.
    const todo = Object.entries(raw).filter(([id, x]) => /^xl-\d+$/.test(id) && x && x.state === 'plan' && !x.date).map(([id]) => id).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
    let day = parse('2026-11-17');
    for (const id of todo) {
      while (used.has(key(day)) || ![0, 2].includes(day.getDay())) day = addDays(day, 1);
      const dk = key(day), wd = day.getDay();
      setS(id, { date: dk, mode: SU_TV_MODE[wd], mins: SU_TV_DUR[wd], ...(dk < key(today()) ? { state: 'done' } : {}) });
      used.add(dk); day = addDays(day, 1);
    }
    flags.fix1711 = 1;
  }
  // fill1: chỉ buổi 11 (T3 17/11, cô chưa ghi) là buổi cô cần ghi; các buổi khác trong file coi như đã ghi xong, không cần bổ sung nhận xét.
  if (!done('fill1')) {
    const raw = k.data.sessions || {};
    for (const id of ['xl-11']) if (raw[id] && raw[id].state === 'done' && !raw[id].fill) clsPut(code, 'sessions', id, { ...raw[id], fill: 1 });
    flags.fill1 = 1;
  }
  clsPut(code, 'info', 'fixes', { ...(k.data.info?.fixes || {}), ...Object.fromEntries(SU_FIXES.filter(f => done(f)).map(f => [f, 1])), ...flags });
  if (!Object.keys(flags).length) return;
  if (c && !TEACH) { const { id, ...o } = classesList().find(x => x.code === code) || c; put('paid', id, { ...o, ...flags }); }
}
// Dữ liệu các cô gửi (file Word, Excel) đã chép sẵn vào data/…json: nhập một lần vào đúng sổ, trên máy của bố mẹ hoặc máy của cô
// (máy nào mở trước). Ngày đã có buổi trong sổ thì giữ nguyên buổi cô đã ghi. Cờ đã nhập lưu trong sổ (info/fixes).
// Mỗi buổi: { date, state: done|plan, topic?, content?, note?, task?: { title, got, review } }. Hình thức, thời lượng theo lịch cố định của cô.
// Bài nhập từ file không có tình trạng tick (chk) nên không bị trừ tiền Thiếu BTVN.
const DATA_IMPORTS = [
  { flag: 'planToan1', file: 'data/ke-hoach-toan-su.json', kids: SU, subj: 'toán', label: 'kế hoạch Toán của cô Trang' },
  { flag: 'nganTV1', file: 'data/so-tieng-viet-sa.json', kids: SA, subj: 'tiếng việt', label: 'sổ Tiếng Việt của cô Ngân' },
];
let planBusy = false;
async function planAuto(code) {
  const k = CLS[code]; if (planBusy || !k || !k.loaded || k.stale || k.err || !k.st) return;
  let kidNm, subj;
  if (TEACH) { if (code !== TEACH) return; kidNm = k.data.info?.lop?.student; subj = k.data.info?.lop?.name; }
  else { if (!loaded || stale || deviceRole() !== 'parent') return; const c = classesList().find(x => x.code === code); if (!c) return; kidNm = kidName(c.kid); subj = c.name; }
  const cfg = DATA_IMPORTS.find(x => x.kids.includes(norm(kidNm)) && norm(subj) === x.subj && !k.data.info?.fixes?.[x.flag]); if (!cfg) return;
  planBusy = true;
  try {
    const r = await fetch(cfg.file, { cache: 'no-cache' }); if (!r.ok) return;
    const list = ((await r.json()).sessions || []).filter(x => okDate(x.date)).sort((a, b) => a.date.localeCompare(b.date));
    if (CLS[code] !== k || k.data.info?.fixes?.[cfg.flag]) return;
    const have = new Set(sessList(k.data).map(x => x.date).filter(Boolean)), allDates = [...new Set([...have, ...list.map(x => x.date)])].sort(), f = fixedFor(kidNm, subj), t0 = Date.now();
    let n = 0, m = 0;
    list.forEach((x, i) => {
      const date = x.date; if (have.has(date)) return;
      const wd = parse(date).getDay(), sid = 'kh-' + date;
      if (!clsPut(code, 'sessions', sid, { date, state: x.state === 'done' ? 'done' : 'plan', mode: f?.mode[wd] || 'off', mins: f?.dur[wd] || 120, topic: String(x.topic || '').slice(0, 300),
        content: String(x.content || '').slice(0, 2000), src: '', note: String(x.note || '').slice(0, 2000), next: '', links: [], files: [], at: new Date(t0 + i).toISOString(), xl: 1 })) return;
      n++;
      if (x.task?.title && !k.data.tasks?.['kh-h-' + date]) {
        const due = allDates.find(dk => dk > date) || '';
        clsPut(code, 'tasks', 'kh-h-' + date, { title: String(x.task.title).slice(0, 300), notes: '', due, session: sid, steps: [], links: [], files: [], at: new Date(t0 + i).toISOString(),
          ...(x.task.got ? { got: true, gotAt: due || date } : {}), review: String(x.task.review || '').slice(0, 2000) });
        m++;
      }
    });
    clsPut(code, 'info', 'fixes', { ...(k.data.info?.fixes || {}), [cfg.flag]: 1 });
    if (n) toast(`Đã nhập ${cfg.label}: ${n} buổi${m ? `, ${m} bài tập` : ''}.`);
  } catch (e) { console.error(e); } finally { planBusy = false; }
}
// Máy của cô: sổ Tiếng Việt của Su đã có dữ liệu nhập từ file (xl-…) thì tự sửa luôn, không phải chờ máy của bố mẹ mở app.
function suTeachFix(code) {
  const k = CLS[code], info = k?.data?.info?.lop;
  if (!TEACH || code !== TEACH || !k || !k.loaded || k.stale || k.err || !k.st || !info || !isSuTV(info.student, info.name) || !k.data.sessions?.['xl-1']) return;
  suFixes(code, null, k);
}
onSoData(suAutoImport); onSoData(suTeachFix); onSoData(planAuto);
// Nhà đã dùng bảng bản này (mọi con đã thưởng theo ngày) mà lịch từng ngày còn thiếu việc của bảng: tự thêm một lần lúc mở app.
// Lần cập nhật bản 2 trước đây chỉ thêm mục mới của bản, nên nhà chưa có việc nào thì các buổi vẫn trống.
// Chỉ làm một lần cho mỗi nhà (k.tableFull): sau đó bố mẹ xoá việc nào thì việc đó không tự quay lại.
let fillChecked = false;
export function autoFill() {
  if (fillChecked || !loaded || stale) return;
  const kids = kidsList(); if (!kids.length) return;
  fillChecked = true;
  const ver = k => Number(k.tableVer) || 0, full = k => Number(k.tableFull) || 0;
  if (!kids.every(k => ver(k) >= TABLE_VER && isDaily(k)) || kids.every(k => full(k) >= TABLE_VER)) return;
  const adds = sampleAdds();
  for (const o of adds) put(o.col, o.nid, o.add);
  for (const k of kids) put('kids', k.id, { ...S.kids[k.id], tableFull: TABLE_VER });
  const nc = adds.filter(o => o.col === 'chores').length, np = adds.length - nc; if (!adds.length) return;
  toast([nc ? `Đã đưa ${nc} việc của bảng vào lịch từng ngày` : '', np ? `${nc ? 'thêm' : 'Đã thêm'} ${np} mục vào trang Quy định` : ''].filter(Boolean).join(', ') + '.',
    () => { for (const o of adds) del(o.col, o.nid); toast('Đã hoàn tác, lịch như trước.'); });
}
let addsChecked = false;
export function autoAdds() {
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
    if (n || pen) toast(`Đã thêm ${[n ? `${n} việc quan trọng về BTVN` : '', pen ? 'mục phạt Thiếu BTVN' : ''].filter(Boolean).join(' và ')}. Sửa ở trang Quy định.`);
  }
  // Sửa mục con của các checklist đang có. Gom mọi thay đổi của một việc vào một lần ghi: với Firestore, dữ liệu trong máy chưa đổi ngay sau khi ghi,
  // nên ghi hai lần liên tiếp thì lần sau sẽ đè mất thay đổi của lần trước.
  const work = {}, stepsNow = c => work[c.id] ?? (S.chores[c.id].steps || []).filter(Boolean);
  if (!set.bottle) {
    for (const c of choresList()) {
      const cur = stepsNow(c), steps = cur.map(x => ['đã tráng bình nước', 'tráng bình nước'].includes(norm(x)) ? `${String(x).trim()} (mai đi học)` : x);
      if (steps.some((x, k) => x !== cur[k])) work[c.id] = steps;
    }
    flags.bottle = 1;
  }
  if (!set.nodone) {
    const tk = key(today());
    for (const c of choresList()) {
      const cur = stepsNow(c), i = cur.findIndex(x => norm(stepText(x)) === 'việc ngày hôm nay đã hoàn thành'); if (i < 0) continue;
      work[c.id] = cur.filter((x, k) => k !== i);
      // Các mục con hôm nay đã tick dở: bỏ bit của dòng vừa xoá, dồn các bit phía sau xuống một vị trí để dấu tick vẫn đúng dòng.
      for (const kid of c.kids || []) { const m = stepMask(today(), kid, c.id); if (m && !isDone(today(), kid, c.id)) setDone(tk, kid, c.id + '~s', (m & ((1 << i) - 1)) | ((m >> (i + 1)) << i)); }
    }
    flags.nodone = 1;
  }
  // Chỗ ở và nơi học còn ghi tên cũ ("Nhà mẹ", "Nhà bố"): đổi hẳn trong dữ liệu sang tên toà nhà. Không dùng cờ, để bản sao lưu cũ nạp lại cũng được sửa.
  for (const [id, x] of Object.entries(S.stays || {})) if (x && (placeName(x.day) !== String(x.day || '') || placeName(x.night) !== String(x.night || '')))
    put('stays', id, { ...x, day: placeName(x.day), night: placeName(x.night) });
  for (const [id, l] of Object.entries(S.lessons || {})) if (l && l.at && placeName(l.at) !== l.at) put('lessons', id, { ...l, at: placeName(l.at) });
  // Đọc sách 30 phút xong mới mở khoá việc thích làm; việc thích làm mặc định là chơi game hoặc dùng iPad/điện thoại 15 phút (một lần).
  // Gom vào cùng một lần ghi với `work` ở trên, để không đè mất thay đổi của nhau.
  const patch = {}, edit = (id, o) => { patch[id] = { ...(patch[id] || {}), ...o }; };
  if (!set.read) {
    for (const c of choresList()) if (!isFun(c) && ['đọc sách 30 phút', 'đọc sách'].includes(norm(c.name)) && !c.unlock) edit(c.id, { unlock: true });
    flags.read = 1;
  }
  // Chi tiêu có Xem TV và Chơi game (tính theo giờ, một lần): đổi tên mục "Tivi" thành "Xem TV", thêm "Chơi game" nếu chưa có.
  if (!set.screen) {
    const fees = pricesList('fee'), tv = fees.find(r => norm(r.name) === 'tivi');
    if (tv && !fees.some(r => norm(r.name) === 'xem tv')) { const { id, ...o } = tv; put('rewards', id, { ...o, name: 'Xem TV', icon: o.icon || '📺' }); }
    else if (!tv && !fees.some(r => norm(r.name) === 'xem tv')) put('rewards', 'gia-xem-tv', { name: 'Xem TV', icon: '📺', kind: 'fee', price: 25000 });
    if (!fees.some(r => ['chơi game', 'game'].includes(norm(r.name)))) put('rewards', 'gia-choi-game', { name: 'Chơi game', icon: '🎮', kind: 'fee', price: 25000 });
    flags.screen = 1;
  }
  // Hút bụi chỉ có ở 6th Element (một lần; sau đó bố mẹ sửa ở form việc).
  if (!set.vac) {
    for (const c of choresList()) if (['hút bụi', 'quét nhà'].includes(norm(c.name)) && !c.place) edit(c.id, { place: '6th Element' });
    flags.vac = 1;
  }
  if (!set.game) {
    const funs = choresList().filter(isFun), has = kid => funs.some(c => norm(c.name) === norm(FUN_DEFAULT) && (c.kids || []).includes(kid));
    for (const c of funs) if (norm(c.name) === 'xem phim hoặc chơi lego') edit(c.id, { name: FUN_DEFAULT, icon: '🎮', minutes: 15 });
    const renamed = funs.filter(c => patch[c.id]?.name).flatMap(c => c.kids || []);
    const need = kidsList().map(k => k.id).filter(kid => !has(kid) && !renamed.includes(kid));
    if (need.length) put('chores', 'mau-' + slug(FUN_DEFAULT), { name: FUN_DEFAULT, icon: '🎮', money: 0, kind: 'fun', kids: need, days: DAILY.slice(), slot: 'toi', minutes: 15, order: Object.keys(S.chores).length, since: key(today()) });
    flags.game = 1;
  }
  for (const id of new Set([...Object.keys(work), ...Object.keys(patch)])) {
    const next = { ...S.chores[id], ...(patch[id] || {}) };
    if (work[id]) { next.steps = work[id]; if (!work[id].length) delete next.steps; }
    put('chores', id, next);
  }
  // Sổ học của các cô nhà mình: tạo sẵn một lần. Sau đó bố mẹ sửa, xoá tuỳ ý, app không tự tạo lại.
  if (!set.so) {
    const samples = classSamples();
    samples.forEach(({ id, ...o }, i) => put('paid', id, { lop: 1, ...o, code: newFamilyCode(), at: new Date(Date.now() + i).toISOString() }));
    flags.so = 1;
    if (samples.length) toast(`Đã tạo sẵn ${samples.length} sổ học của các cô. Vào Học tập → Học thêm, bấm Link cho các cô để gửi.`);
  }
  // Sổ Tiếng Việt của Su đã tạo từ trước: đổi tên một lần thành Nhật ký học Tiếng Việt (sổ đã có tên riêng thì giữ nguyên).
  if (!set.book) {
    for (const c of classesList()) if (isSu(kidName(c.kid)) && norm(c.name) === 'tiếng việt' && !String(c.book || '').trim()) { const { id, ...o } = c; put('paid', id, { ...o, book: SU_TV_BOOK }); }
    flags.book = 1;
  }
  // Sổ Tiếng Việt của Sa (cô Ngân): bài cũ nhập từ file có hạn trước 22/11/2026 không hiện quá hạn trên máy của con (một lần).
  if (!set.hwfromSa) {
    for (const c of classesList()) if (isSa(kidName(c.kid)) && norm(c.name) === 'tiếng việt' && !c.hwFrom) { const { id, ...o } = c; put('paid', id, { ...o, hwFrom: SA_TV_HW_FROM }); }
    flags.hwfromSa = 1;
  }
  // Sổ Tiếng Việt của Su: bài tập có hạn trước 22/11/2026 không hiện quá hạn trên máy của con (một lần).
  if (!set.hwfrom) {
    for (const c of classesList()) if (isSuTV(kidName(c.kid), c.name) && !c.hwFrom) { const { id, ...o } = c; put('paid', id, { ...o, hwFrom: SU_TV_HW_FROM }); }
    flags.hwfrom = 1;
  }
  // Sổ có lịch cố định (Toán của Su: T2, T5 120 phút; Tiếng Việt của Sa: CN 120 phút, T4 60 phút; Toán của Sa: T3, T5 120 phút): ghi thời lượng theo thứ (một lần; sổ đã có thì giữ nguyên).
  if (!set.dur2) {
    for (const c of classesList()) { const f = fixedFor(kidName(c.kid), c.name); if (f && !isSuTV(kidName(c.kid), c.name) && !Array.isArray(c.dur)) { const { id, ...o } = c; put('paid', id, { ...o, dur: f.dur.slice() }); } }
    flags.dur2 = 1;
  }
  // Cô Trang đổi giờ dạy: buổi học thêm Toán của Su vào thứ 2 và thứ 5 thành 17:45–19:45 (một lần).
  if (!set.trang1745) {
    const c = classesList().find(x => isSu(kidName(x.kid)) && norm(x.name) === 'toán');
    if (c) for (const l of classLessons(c)) if ([1, 4].includes(l.day) && (l.s !== '17:45' || l.e !== '19:45')) { const { id, ...o } = l; put('lessons', id, { ...S.lessons[id], s: '17:45', e: '19:45' }); }
    flags.trang1745 = 1;
  }
  // Gia sư Toán của Su (cô Trang) học tại nhà, không cần đưa đón: bỏ người đưa, người đón và nơi học bên ngoài (một lần).
  if (!set.trangHome) {
    const c = classesList().find(x => isSu(kidName(x.kid)) && norm(x.name) === 'toán');
    if (c) for (const l of classLessons(c)) if (l.home !== true || l.go || l.back || l.at) { const { go, back, at, ...o } = S.lessons[l.id] || {}; put('lessons', l.id, { ...o, home: true }); }
    flags.trangHome = 1;
  }
  // Đi lại của các buổi học thêm (một lần): Toán của Sa thứ 5 (cô Hải) phải đến nhà cô; bóng rổ, bóng đá, học nhảy phải đi, bố đưa đón;
  // còn lại đều học tại nhà.
  const isSport = l => /bóng rổ|bóng đá|nhảy|dance/i.test(String(l.name || ''));
  if (!set.homeAll) {
    const saMath = classesList().find(x => isSa(kidName(x.kid)) && norm(x.name) === 'toán');
    const outIds = new Set(saMath ? classLessons(saMath).filter(l => l.day === 4).map(l => l.id) : []);
    for (const l of lessonsList()) {
      const cur = S.lessons[l.id] || {};
      if (isSport(l)) continue;
      if (outIds.has(l.id)) { if (cur.home !== false) put('lessons', l.id, { ...cur, home: false }); }
      else if (cur.home !== true || cur.go || cur.back || cur.at) { const { go, back, at, ...o } = cur; put('lessons', l.id, { ...o, home: true }); }
    }
    flags.homeAll = 1;
  }
  if (!set.sportOut) {
    for (const l of lessonsList()) if (isSport(l)) { const cur = S.lessons[l.id] || {}; if (cur.home !== false || cur.go !== 'Bố' || cur.back !== 'Bố') put('lessons', l.id, { ...cur, home: false, go: 'Bố', back: 'Bố' }); }
    flags.sportOut = 1;
  }
  // Sổ Tiếng Việt của Su: thứ 3 học 60 phút, chủ nhật 120 phút (một lần; sổ đã có thời lượng riêng thì giữ nguyên).
  if (!set.dur) {
    for (const c of classesList()) if (isSuTV(kidName(c.kid), c.name) && !Array.isArray(c.dur)) { const { id, ...o } = c; put('paid', id, { ...o, dur: SU_TV_DUR.slice() }); }
    flags.dur = 1;
  }
  if (Object.keys(flags).length) put('paid', SETTINGS_ID, { ...set, ...flags });
}
