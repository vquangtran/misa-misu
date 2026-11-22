// Điểm vào của app (index.html nạp file này): vẽ khung và các màn, điều hướng bằng #hash, mở dữ liệu của gia đình
// (Firebase hoặc trên trình duyệt), màn mở đầu khi chưa có gia đình, màn của cô.
import { firebaseConfig } from './config.js';
import { autoIcons, icon, iconSvg } from './icons.js';
import { firebaseStore, localStore } from './store.js';
import { $, addDays, CHEV, confetti, DAILY, dateTxt, daysLabel, daysTo, dm, dmy, DOTS, DOWN, dueLabel, durTxt, esc, hm, key, money, monthTxt,
  newFamilyCode, NEXT, norm, nowMin, parse, PLUS, PREV, printHtml, signed, STAR, toast, today, toMin, uid, WD, WDN, WDS, WEEK_ORDER, weekStart } from './chung.js';
import { SAMPLE_PERIODS, SAMPLE_TKBS, SAMPLE_YEAR } from './nha-minh.js';
import { againVnd, ageOf, balance, choresFor, choresList, choreSlot, choreVnd, claimers, claimVal, clearMemo, DAY_BONUS, dayBonusAt, dayBonuses,
  dayBonusIn, dayBonusOf, dayFull, del, deviceRole, doneVal, doneVnd, earned, eventsList, eventsOf, family, FAMILY_KEY, getFamily, getRole, holidayOn,
  isBirthday, isDaily, isDone, isExtra, isFun, isMust, isWeekly, keepFamilyInUrl, kidName, kidSince, kidsList, ledgerVnd, lessonMin, lessonsList,
  lessonsOf, lessonsOn, loaded, memoize, mustFor, nextSchool, onDay, penaltyTimes, perWeekOf, pinHash, placeLow, placeName, placeNames, prepFor,
  priceKind, pricesList, priceVnd, put, render, reqIn, RO, S, schoolDay, schoolOn, setData, setDone, setDraw, setFamily, setFamilyCode, setLoaded,
  setRO, setRole, setStale, setStore, setTeach, SETTINGS_ID, shortPlace, skipEntry, skipOn, slotAt, SLOTS, stale, stayInfo, stayLine, stayNow,
  stepMask, stepsAll, stepsOf, store, streakOf, takenBy, TEACH, tkbDays, tkbOf, TODAY_KID, todayKid, UI, variantOf, WEEK_BONUS, weekBonusAt,
  weekBonusOf, weekCount, weekGain, weekStats } from './du-lieu.js';
import { addBtn, ava, avInner, barCount, blankAdd, brand, editBtn, kidChip, kidTabs, lessonIcon, loading, mini, moneyChip, moreBtn, noKids, photoOf,
  pillBar, plusBtn, secHead, secIsOpen, subjChips, subjDot, subjTint, suggest, tintOf } from './giao-dien.js';
import { closeModal, daySet, dismissModal, formFoot, frow, kidRow, menuRow, menuSheet, openModal, pillSel, radioVal, setModalDirty, titleCard, toggle } from './form.js';
import { ATT, attAdd, attClear, attDraw, attTake, bankForm, bookName, CHK, classesList, classesOf, classesSection, classForm, classLinkSheet,
  classLinksSheet, classTasks, classTitle, cleanFiles, cleanSteps, CLS, CLS_GONE, clsDel, clsPatch, clsPut, delFiles, drawTeacher, feeOf, fileOpen,
  getLop, growTitle, hwDueAfter, hwForm, hwList, hwRowInput, hwState, hwView, linkList, nextClassDay, offOf, okDate, okId, openClass, paidOf, printAsk,
  printSo, sessDayTitle, sessDefaults, sessForm, sessList, sessView, setLop, soFees, soImportGo, soImportPick, soMissing, soOf, soPage, soStats,
  subAdd, subMay, syncClasses } from './so-hoc.js';
import { acctStats, balForm, coins, coinUnit, funAsks, funDiff, funForm, funOf, funSection, goalForm, goalProgress, goalsCard, goalsOf, histSection,
  meritForm, meritSheet, pendingCard, pendingList, skipForm, viewAccount } from './tai-khoan.js';
import { addSamples, CHORE_KIND_SUB, CHORE_KINDS, choreForm, guessIcon, kindHelp, meritList, PRICE_FEE, PRICE_HELP, PRICE_KINDS, priceForm,
  printCoupons, printPrices, SAMPLE_CHORES, TABLE_VER, tableUpdate, tableUpdateForm, tableUpdateRun, viewPrices, weeklyCandidates } from './quy-dinh.js';
import { autoSeed, decryptSeed, exportBackup, hashPin, importBackup, importData, kidForm, kidLink, photoEdit, photoLoad, photoRender, pinForm,
  roleKidForm, seedForm, setPhotoEdit, setSeedChecked, setSeedMem, stayForm, viewFamily } from './gia-dinh.js';
import { autoAdds, autoFill } from './mot-lan.js';

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

// Môn học gợi ý khi nhập thời khoá biểu (tiểu học và THCS).
const SUBJECTS = ['Toán', 'Tiếng Việt', 'Ngữ văn', 'Tiếng Anh', 'Khoa học', 'KHTN', 'Lịch sử và Địa lí', 'Đạo đức', 'GDCD', 'Âm nhạc', 'Mĩ thuật',
  'Tin học', 'Công nghệ', 'Giáo dục thể chất', 'Bơi', 'Hoạt động trải nghiệm', 'Sinh hoạt dưới cờ', 'Sinh hoạt lớp', 'Tự học'];
const streakChip = k => { const n = streakOf(k.id); return n ? `<span class="streak" title="Số ngày liên tiếp làm đủ việc phải làm">🔥 ${n} ngày liên tiếp</span>` : ''; };
const bdayChip = (k, d) => isBirthday(k, d) ? `<span class="streak">🎂 Sinh nhật ${ageOf(k, d)} tuổi</span>` : '';
// Thời khoá biểu có sẵn của con này (theo tên), không có thì null.
const tkbOffer = k => (k && SAMPLE_TKBS.find(sp => sp.kids.includes(String(k.name || '').trim().toLowerCase()))) || null;
const sampleTkb = sp => sp ? { cls: sp.cls, year: sp.year, days: [...sp.days], lunch: sp.lunch,
  rows: sp.times.map(([s, e], i) => ({ s, e, d: Object.fromEntries(sp.days.map((d, j) => [d, sp.subj[i][j]])) })) } : undefined;
const sampleLabel = sp => `${sp.cls} · ${sp.year}`;
// Giờ và môn của từng tiết, để biết bản đang nhập đã giống thời khoá biểu có sẵn chưa.
const tkbSig = t => JSON.stringify((t.rows || []).map(r => [r.s, r.e, ...tkbDays(t).map(d => String((r.d || {})[d] || '').trim())]));

// ---------- mốc năm học ----------
// events: { name, icon, kind: exam|holiday|meeting|event, from: "YYYY-MM-DD", to: "YYYY-MM-DD" (không bắt buộc), kids: [] = cả nhà }
const EVENT_KINDS = [['exam', 'Kiểm tra', '📝'], ['holiday', 'Nghỉ học', '🏖️'], ['meeting', 'Họp phụ huynh', '👪'], ['event', 'Sự kiện', '🎉']];
const EVENT_ICONS = ['📝', '🏫', '🎒', '📘', '🌱', '🌸', '🧧', '🎓', '🏆', '👪', '🎉', '🏖️', '⚽', '🎭', '🩺', '📣'];
function eventRange(e) {
  const a = parse(e.from), b = parse(e.to);
  if (e.from === e.to) return `${WDN(a.getDay())}, ${dmy(a)}`;
  return a.getFullYear() === b.getFullYear() ? `${dm(a)} – ${dmy(b)}` : `${dmy(a)} – ${dmy(b)}`;
}
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
// Buổi nào mở sẵn ở màn Hôm nay. Xem hôm nay (cur = buổi đang diễn ra): chỉ mở buổi đó, các buổi khác thu gọn còn nhãn và số việc;
// "Lúc nào cũng được" mở khi còn việc chưa xong hoặc có việc thích làm; việc làm thêm mở khi đã có làm.
// Xem ngày khác (cur = null) thì mở những buổi còn việc chưa xong. Bấm nhãn để mở, đóng; lựa chọn đó giữ tới khi sang buổi khác.
const slotOpenDefault = (g, cur, full, nd, hasFun) => g.extra ? nd > 0 : cur && g.id ? g.id === cur : !full || hasFun;
// Buổi đã qua trong hôm nay mà còn việc phải làm chưa xong: vẫn thu gọn, nhưng số việc trên nhãn tô đỏ để nhắc.
const slotMissed = (g, cur, full, n) => !!cur && !g.extra && !!g.id && n > 0 && !full && SLOTS.findIndex(x => x[0] === g.id) < SLOTS.findIndex(x => x[0] === cur);
// Trong mỗi buổi, việc chia thành từng nhóm riêng, theo thứ tự: mốc giờ (vào học, tan học, học thêm), việc quan trọng,
// việc phải làm (bắt buộc, tính vào tiến độ ngày và thưởng làm đủ việc), việc được thưởng (không bắt buộc, làm lần nào cộng tiền lần đó), việc thích làm.
const SECS = ['mark', 'imp', 'must', 'paid', 'fun'];
const SEC_LABEL = { imp: 'Việc quan trọng', must: 'Việc phải làm', paid: 'Việc được thưởng', fun: 'Việc thích làm' };
// Việc đã xong với con này: con đã làm, hoặc việc "ai làm trước thì tính" đã có con khác làm.
const choreOk = (c, kidId, d) => isDone(d, kidId, c.id) || takenBy(c, kidId, d).length > 0;
// Tiêu đề nhỏ của một nhóm trong buổi, kèm số việc đã xong.
function subHead(sec, items, kidId, d) {
  const n = items.filter(x => choreOk(x.c, kidId, d)).length, full = n === items.length;
  return `<div class="sub-h ${sec}">${SEC_LABEL[sec]}${sec === 'fun' ? '' : `<i class="num ${full ? 'full' : ''}">${full ? '✓ ' : ''}${n}/${items.length}</i>`}</div>`;
}
// Các nhóm của một buổi: [{ sec, items }], bỏ nhóm trống. Việc làm thêm không chia nhóm.
const slotSecs = g => g.extra ? [{ sec: 'extra', items: g.items }] : SECS.map(sec => ({ sec, items: g.items.filter(x => x.sec === sec) })).filter(x => x.items.length);
// Con số trên nhãn của một buổi: chỉ đếm việc phải làm, việc được thưởng không bắt buộc nên không tính vào.
// Buổi chỉ có việc được thưởng (và nhóm Việc làm thêm) thì ghi số việc, đã làm mấy việc thì ghi thêm ở trước.
function slotCount(g, kidId, d) {
  const ch = g.items.filter(x => x.type === 'chore' && !isFun(x.c)), ok = x => choreOk(x.c, kidId, d);
  const mine = ch.filter(x => x.req), nd = mine.filter(ok).length, full = mine.length > 0 && nd === mine.length;
  const opt = ch.filter(x => !x.req), no = opt.filter(ok).length;
  return { n: mine.length, full, nd: g.extra ? no : nd, cnt: mine.length ? `${full ? '✓ ' : ''}${nd}/${mine.length}` : opt.length ? `${no ? `${no}/` : ''}${opt.length}` : '' };
}
// Ghép việc nhà, giờ ở trường và học thêm của một con trong ngày d, chia theo buổi.
function dayPlan(kidId, d) {
  const all = choresFor(kidId, d), extras = all.filter(isExtra);
  const wk = key(weekStart(d));
  const items = all.filter(c => !isExtra(c)).map(c => { const req = reqIn(c, kidId, wk); return { type: 'chore', c, t: toMin(c.time), slot: choreSlot(c), req, sec: isFun(c) ? 'fun' : c.imp ? 'imp' : req ? 'must' : 'paid' }; });
  const t = tkbOf(kidId), info = t && schoolOn(kidId, d);
  if (info) {
    items.push({ type: 'mark', t: toMin(info.start), icon: '🏫', text: `Vào học (${info.list.length} tiết)` });
    items.push({ type: 'mark', t: toMin(info.end), icon: '🏫', text: 'Tan học' });
  }
  for (const l of lessonsOn(kidId, d.getDay())) items.push({ type: 'lesson', l, t: toMin(l.s) });
  for (const x of items) if (x.slot === undefined) { x.slot = slotAt(x.t); x.sec = 'mark'; }
  const rank = x => SECS.indexOf(x.sec) * 10000 + (x.t ?? 24 * 60);
  const groups = SLOTS.map(([id, label, icon]) => ({ id, label, icon, items: items.filter(x => x.slot === id)
    .sort((a, b) => rank(a) - rank(b) || (a.c?.order ?? 0) - (b.c?.order ?? 0)) })).filter(g => g.items.length);
  // Việc thích làm mở khoá khi xong hết việc phải làm của buổi đó ("Lúc nào cũng được": của cả ngày)
  // và xong các việc mở khoá của cả ngày (unlock, ví dụ đọc sách 30 phút). g.need: những việc còn phải làm, theo thứ tự trong ngày.
  const req = new Set(mustFor(kidId, d).map(c => c.id)), keys = skipOn(kidId, d) ? [] : all.filter(c => c.unlock && !isFun(c) && !takenBy(c, kidId, d).length);
  for (const g of groups) {
    const scope = (g.id ? g.items : items).filter(x => x.type === 'chore' && req.has(x.c.id)).map(x => x.c);
    g.need = [...scope, ...keys.filter(c => !scope.some(y => y.id === c.id))].filter(c => !isDone(d, kidId, c.id));
    g.open = !g.need.length;
    g.left = g.need.length;
    for (const x of g.items) if (x.type === 'chore' && isFun(x.c)) x.locked = !g.open;
  }
  // Việc làm thêm (có tiền, không bắt buộc) xếp riêng ở cuối ngày.
  if (extras.length) groups.push({ id: 'them', extra: true, label: 'Việc làm thêm', icon: '💪', open: true, left: 0,
    items: extras.map(c => ({ type: 'chore', c, t: toMin(c.time), slot: 'them' })) });
  return groups;
}
// Dòng ngắn dưới việc thích làm còn khoá: "Xong Đọc sách 30 phút là được làm" / "Còn 3 việc nữa là được làm".
const needLine = need => need.length === 1 ? `Xong “${need[0].name}” là được làm` : `Còn ${need.length} việc nữa là được làm`;
// Bấm vào việc thích làm còn khoá: hiện những việc cần làm để mở khoá, việc nào xong rồi thì có dấu ✓.
function funNeedForm(kidId, cid, dk) {
  const d = dk ? parse(dk) : today(), c = S.chores[cid]; if (!c || !S.kids[kidId]) return;
  const g = dayPlan(kidId, d).find(p => p.items.some(x => x.c?.id === cid)); if (!g) return;
  if (!g.need.length) return toast(`Mở khoá rồi, ${kidName(kidId)} được ${c.name.toLowerCase()}!`);
  const slot = g.id ? ` (${g.label.toLowerCase()})` : '';
  openModal(`<h2>${esc(c.icon || '🎈')} ${esc(c.name)}</h2>
  <p class="muted small lead">🔒 Chưa mở khoá. Xong ${g.need.length === 1 ? 'việc' : `${g.need.length} việc`} dưới đây là ${UI.km?.on || deviceRole() !== 'parent' ? 'con' : esc(kidName(kidId))} được làm việc này.</p>
  <div class="fg"><div class="list">${g.need.map(x => `<div class="item"><span class="ico">${esc(x.icon || '✅')}</span><div class="txt"><div class="t">${esc(x.name)}</div><div class="s">${x.unlock ? 'Việc mở khoá' : `Việc phải làm${slot}`}${Number(x.minutes) ? ` · ${Number(x.minutes)} phút` : ''}</div></div></div>`).join('')}</div></div>
  <div class="foot"><button class="btn primary" data-act="close">Đã hiểu</button></div>`);
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
  const p = [isFun(c) || isWeekly(c) ? '' : `<b class="earn">+${money(got)}</b>`].filter(Boolean);
  if (toMin(c.time) !== null) p.push(`${c.by ? 'trước ' : ''}${esc(c.time)}`);
  if (Number(c.minutes)) p.push(`${Number(c.minutes)} phút`);
  if (c.place) p.push(`📍 ${esc(placeName(c.place))}`);
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
// Màn Hôm nay của bố mẹ (big = false): bấm vào buổi học thêm là mở form sửa buổi đó. Màn của con chỉ xem.
const markRow = (x, big) => x.type === 'lesson'
  ? `<div class="${big ? 'big-mark' : 'item mark'}${!big && !RO ? ` edit-row" data-act="lesson-form" data-id="${esc(x.l.id)}` : ''}"><span class="ico">${lessonIcon(x.l.name)}</span><div class="txt"><div class="t"><span class="num">${esc(x.l.s)} – ${esc(x.l.e)}</span> ${esc(x.l.name)}</div>${placeTxt(x.l) ? `<div class="s">${placeTxt(x.l)}</div>` : ''}</div></div>`
  : `<div class="${big ? 'big-mark' : 'item mark'}"><span class="ico">${x.icon}</span><div class="txt"><div class="t"><span class="num">${hm(x.t)}</span> ${esc(x.text)}</div></div></div>`;
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
const skipNote = (k, d) => { const e = skipEntry(k.id, d); return e ? `<div class="skip-note">🎟️ ${key(d) === key(today()) ? 'Hôm nay' : 'Ngày này'} ${esc(k.name)} dùng phiếu “Một ngày không làm việc nhà”: việc phải làm được miễn, làm thì vẫn được thưởng.</div>` : ''; };
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
  UI.todayTwo = false;
  if (!k) return h + noKids();
  // Mỗi khối mang một thứ tự (order): điện thoại một cột, thứ tự như cũ. Máy tính rộng chia hai cột: các buổi trong ngày bên trái;
  // thông báo cần bố mẹ chú ý, khối nhắc, bài cần nộp, sổ học của cô bên phải, vẫn ở đầu màn.
  const blk = (o, html, cls = '') => html ? `<div class="dcb ${cls}" style="order:${o}">${html}</div>` : '';
  const list = mustFor(k.id, d), plan = dayPlan(k.id, d);
  const n = list.filter(c => isDone(d, k.id, c.id)).length, left = list.length - n;
  // Một dòng tóm tắt: còn mấy việc, chuỗi ngày, số dư (bấm sang Tài khoản).
  const sum = `<section class="kid-sum" style="--tint:${tintOf(k)}"><div class="kid-sum-row"><b class="kid-sum-t">${!list.length ? 'Không có việc phải làm' : left ? `Còn ${left} việc phải làm` : 'Xong hết việc phải làm 🎉'}</b><a href="#tai-khoan" class="acct-link" data-act="acct-go" data-kid="${k.id}" aria-label="Tài khoản của ${esc(k.name)}">${moneyChip(k)}${CHEV}</a></div>
    ${list.length ? `${barCount(n, list.length)}` : ''}
    ${streakChip(k) || bdayChip(k, d) ? `<div class="kid-sub">${streakChip(k)}${bdayChip(k, d)}</div>` : ''}</section>`;
  // Các dòng nhắc gom vào một khối: con đang ở đâu, giờ ở trường, mốc sắp tới, phiếu nghỉ.
  const st = stayLine(d.getDay(), isT), sc = schoolNow(k, d, isT);
  let notes = st ? `<div class="stay-note ${stayInfo(d.getDay()).moved ? 'moved' : ''}">${esc(st)}</div>` : '';
  if (sc) notes += `<a class="school-line" href="#lich-hoc" data-act="tkb-go" data-tab="tkb" data-kid="${k.id}" data-wd="${sc.bag ? '' : d.getDay()}"><b>${sc.bag ? '🎒' : '🏫'} ${esc(sc.title)}:</b> ${esc(sc.subjects.join(', '))}</a>`;
  notes += eventLines(k) + skipNote(k, d);
  // Buổi học thêm hôm nay hoặc hôm qua cô đã ghi nhận xét: một dòng, bấm để mở sổ.
  if (isT) for (const c of classesOf(k.id)) for (const x of sessList(soOf(c.code)).filter(x => x.state !== 'plan' && x.note && x.date && daysTo(x.date) >= -1 && daysTo(x.date) <= 0))
    notes += `<button class="school-line so-line" data-act="cls-open" data-id="${c.id}"><b>📒 ${esc(c.teacher || 'Cô')} nhận xét buổi ${esc(c.name)} ${daysTo(x.date) ? 'hôm qua' : 'hôm nay'}:</b> ${esc(String(x.note).slice(0, 140))}</button>`;
  // Nhà chưa có việc nào: một dòng gợi ý bảng mẫu, gọn để các ô thêm việc vẫn nằm ngay bên dưới.
  const seed = Object.keys(S.chores).length ? '' : `<section class="suggest"><div><b>Chưa biết bắt đầu từ đâu?</b><span>Bảng mẫu có sẵn ${SAMPLE_CHORES.length} việc, kèm mục phạt, phí sử dụng và phiếu thưởng. Thêm xong sửa lại tuỳ ý.</span></div><button class="btn primary sm" data-act="seed">Dùng bảng mẫu</button></section>`;
  // Bài cần nộp: cùng kiểu với các buổi, nằm trước để thấy ngay.
  let side = '', main = '';
  const ts = isT ? tasksSoon(k.id) : [];
  if (ts.length) side += `<section class="slot s-task"><div class="slot-h"><a class="slot-pill" href="#lich-hoc" data-act="tkb-go" data-tab="bai-tap" data-kid="${k.id}">📝<span>Bài cần nộp</span><i class="num">${ts.length}</i>${CHEV}</a></div><div class="slot-list list">${ts.map(x => taskRow(x, false, 'mini')).join('')}</div></section>`;
  // Sổ học của cô: mỗi sổ một dòng tóm tắt (buổi gần nhất, nhận xét mới nhất, học phí tháng này, buổi cô chưa ghi), bấm để mở sổ.
  const cls = isT && !RO ? classesOf(k.id) : [];
  if (cls.length) side += `<section class="slot">${secHead('📒', 'Sổ học của cô', { cnt: cls.length, key: 'today-so' })}${secIsOpen('today-so') ? `<div class="slot-list list">${cls.map(soTodayRow).join('')}</div>` : ''}</section>`;
  const cur = isT ? slotAt(nowMin()) : null, canAdd = d >= t;
  // Luôn đủ bốn buổi (từ hôm nay trở đi): buổi chưa có việc hiện ô trống có dấu + để thêm ngay tại chỗ.
  const groups = SLOTS.map(([id, label, icon]) => plan.find(g => !g.extra && g.id === id) || { id, label, icon, items: [], blank: true }).filter(g => !g.blank || canAdd);
  const extra = plan.find(g => g.extra); if (extra) groups.push(extra);
  for (const g of groups) {
    // Mỗi buổi mở/đóng được, mặc định theo slotOpenDefault: hôm nay chỉ mở buổi đang diễn ra.
    const sk = `${key(d)}|${k.id}|${g.id}|${cur || ''}`, isNow = !g.extra && g.id && g.id === cur;
    const sc = slotCount(g, k.id, d), full = sc.full, hasFun = g.items.some(x => x.type === 'chore' && isFun(x.c));
    const open = UI.slotOpen[sk] ?? slotOpenDefault(g, cur, full, sc.nd, hasFun);
    const cnt = sc.cnt || (g.blank ? '0' : '');
    const add = !canAdd ? '' : g.extra ? `<button class="mini-add" data-act="chore-form" data-kind="extra" aria-label="Thêm việc làm thêm">${PLUS}</button>`
      : `<button class="mini-add" data-act="quick-add" data-slot="${g.id}" aria-label="Thêm việc: ${g.label}">${PLUS}</button>`;
    main += `<section class="slot s-${g.extra ? 'them' : g.id || 'any'} ${isNow ? 'now' : ''} ${full ? 'full' : ''}" data-slot="${sk}"><div class="slot-h"><button class="slot-pill" data-act="slot-toggle" data-slot="${sk}" aria-expanded="${!!open}">${g.icon}<span>${g.label}</span>${cnt ? `<i class="num ${slotMissed(g, cur, full, sc.n) ? 'late' : ''}">${cnt}</i>` : ''}${DOWN}</button>${isNow ? '<span class="nowpill">Bây giờ</span>' : ''}${g.blank && open ? '' : add}</div>`;
    if (open && g.blank) main += `<button class="slot-blank" data-act="quick-add" data-slot="${g.id}"><span>${SLOT_ASK[g.id]}</span>${PLUS}</button>`;
    else if (open) for (const part of slotSecs(g)) {
      // Mỗi nhóm một thẻ riêng, có tiêu đề nhỏ ở trên (mốc giờ và việc làm thêm không cần tiêu đề).
      if (SEC_LABEL[part.sec]) main += subHead(part.sec, part.items, k.id, d);
      main += `<div class="slot-list list">`;
      for (const x of part.items) {
        if (x.type !== 'chore') { main += markRow(x); continue; }
        const c = x.c, on = isDone(d, k.id, c.id), steps = stepsOf(c, k.id, d), mask = stepMask(d, k.id, c.id);
        const right = isFun(c) ? (x.locked ? `<button class="fun-badge" data-act="fun-need" data-kid="${k.id}" data-chore="${c.id}" data-d="${key(d)}" aria-label="Cần làm gì để mở khoá: ${esc(c.name)}">🔒 Chưa mở</button>` : '<span class="fun-badge open">Được làm</span>')
          : `<button class="stamp ${on ? 'on' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" ${future ? 'disabled' : ''} aria-pressed="${on}" aria-label="${on ? 'Bỏ dấu' : 'Đóng dấu'}: ${esc(c.name)}">${STAR}</button>`;
        // Bấm vào việc (ngoài nút đóng dấu và các mục con) là mở form sửa việc đó.
        main += `<div class="item edit-row ${on ? 'done' : takenBy(c, k.id, d).length ? 'taken' : ''} ${isFun(c) ? 'fun' + (x.locked ? ' locked' : '') : ''}" data-act="chore-form" data-id="${c.id}"><span class="ico">${esc(c.icon || '✅')}</span><div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${choreMeta(c, k.id, d, isT)}</div>
          ${steps.length && !isFun(c) ? `<div class="steps">${steps.map(st => { const ok = on || (mask >> st.i) & 1; return `<button class="step ${ok ? 'on' : ''}" data-act="step" data-kid="${k.id}" data-chore="${c.id}" data-i="${st.i}" ${future ? 'disabled' : ''} aria-pressed="${!!ok}">${esc(st.t)}</button>`; }).join('')}</div>` : ''}</div>${right}</div>`;
      }
      main += `</div>`;
    }
    main += `</section>`;
  }
  const colR = blk(1, pendingCard('', true)) + blk(4, notes ? `<div class="notes">${notes}</div>` : '') + blk(6, side ? `<div class="slots">${side}</div>` : '');
  const colL = blk(2, future ? `<p class="foot-note">Ngày này chưa tới nên chưa đánh dấu được.</p>` : '') + blk(3, sum) + blk(5, seed) + blk(7, `<div class="slots">${main}</div>`, side ? 'after' : '');
  UI.todayTwo = !!colR;
  // Cột thông báo đứng trước trong mã trang, để trình đọc màn hình và phím Tab đi qua thông báo trước, như thứ tự nhìn thấy trên điện thoại.
  return h + `<div class="day-cols ${colR ? 'two' : ''}"><div class="dc-side">${colR}</div><div class="dc-main">${colL}</div></div>`;
}
function soTodayRow(c) {
  const k = CLS[c.code], d = soOf(c.code), st = soStats(d), last = st.done[st.done.length - 1], f = feeOf(c), mk = key(today()).slice(0, 7);
  const cur = soFees(d, f).find(r => r.mk === mk), paid = paidOf(d), mi = soMissing(d);
  const owe = f.off ? [] : soFees(d, f).filter(r => r.mk < mk && !paid[r.mk]), noted = [...st.done].reverse().find(x => x.note);
  // Bài đang làm: không tính bài cũ trước hwFrom (cũng không hiện ở phần của con).
  const open = st.hw.filter(t => !t.done && !t.got && (!c.hwFrom || !t.due || t.due >= c.hwFrom)).length;
  const sub = !k || !k.loaded ? 'Đang mở sổ…' : !st.ss.length ? 'Sổ còn trống. Gửi link cho cô để cô bắt đầu ghi.'
    : [last ? `Gần nhất ${dateTxt(last.date)}` : '', `tháng ${today().getMonth() + 1}: ${st.month} buổi${cur && (f.fee || f.on) && !f.off ? ` · ${money(cur.amount)}${paid[mk] ? ' đã đóng' : ''}` : ''}`, open ? `${open} bài đang làm` : ''].filter(Boolean).join(' · ');
  const badges = [mi.n ? `<span class="badge owe">${mi.n} buổi cô chưa ghi</span>` : '', owe.length ? `<span class="badge wait">Chưa đóng HP tháng ${owe.map(r => Number(r.mk.slice(5))).join(', ')}</span>` : '', st.wait ? `<span class="badge wait">${st.wait} bài chờ cô nhận</span>` : ''].filter(Boolean).join('');
  return `<button class="item nav so-today" data-act="cls-open" data-id="${c.id}"><span class="ico">${lessonIcon(c.name) === '📚' ? '📒' : lessonIcon(c.name)}</span><span class="txt"><span class="t">${esc(classTitle(c))}</span><span class="s">${esc(sub)}</span>
    ${noted ? `<span class="s so-p cmt"><b>Cô nhận xét ${esc(dm(parse(noted.date)))}:</b> ${esc(String(noted.note).slice(0, 160))}${String(noted.note).length > 160 ? '…' : ''}</span>` : ''}${badges ? `<span class="so-badges">${badges}</span>` : ''}</span>${CHEV}</button>`;
}
// Menu ⋯ của màn Hôm nay: những cách xem ít dùng hơn, để màn chính chỉ còn việc cần làm.
function todayMenu() {
  const off = !kidsList().length;
  menuSheet('Hôm nay', [menuRow('data-act="today-mode" data-v="week"', '✅', 'Xem cả tuần', 'Mỗi việc một dòng, mỗi ngày một cột', off),
    menuRow('data-act="km-open"', '🙂', 'Chế độ cho bé', 'Chữ và nút to để con tự đánh dấu', off),
    menuRow('data-act="sheet-open"', '🖨️', 'In kế hoạch tuần', 'Mỗi con một trang A4 dán bàn học', off),
    `<a class="item nav" href="#quy-dinh" data-act="close"><span class="ico">✏️</span><span class="txt"><span class="t">Sửa danh sách việc nhà</span><span class="s">Ở trang Quy định: đổi tên, ngày, buổi, tiền thưởng của từng việc</span></span>${CHEV}</a>`]);
}
// Nút + ở góc phải của mỗi màn: thêm thứ thuộc về màn đó. Chỉ có một thứ thì mở thẳng form, nhiều thứ thì hỏi.
function pageAdd() {
  const kids = kidsList(); if (!kids.length) return kidForm();
  const v = UI.view;
  if (v === 'lich-hoc') {
    const kid = S.kids[UI.tkbKid] ? UI.tkbKid : '', tab = UI.learn;
    if (tab === 'bai-tap') return taskForm(null, kid);
    if (tab === 'truong' && UI.truong === 'moc') return eventForm(null, kid);
    if (tab === 'hoc-them') return menuSheet('Thêm vào Học thêm', [menuRow(`data-act="lesson-form" data-kid="${kid}"`, '📚', 'Buổi học thêm', 'Học gì, ngày nào, ai đưa đón'), menuRow(`data-act="cls-form" data-kid="${kid}"`, '📒', 'Sổ học của cô', 'Cô có link riêng để ghi buổi học và giao bài')]);
    if (tab === 'truong') { const ks = kid ? [S.kids[kid] && { id: kid, ...S.kids[kid] }] : kids; const pre = k => !tkbOf(k.id) && tkbOffer(k); return ks.length === 1 ? tkbForm(ks[0].id, pre(ks[0]) ? sampleTkb(tkbOffer(ks[0])) : undefined) : menuSheet('Thời khoá biểu của ai?', ks.map(k => menuRow(`data-act="tkb-form" ${pre(k) ? 'data-sample="1"' : ''} data-kid="${k.id}"`, '🏫', esc(k.name), tkbOf(k.id) ? 'Sửa thời khoá biểu' : pre(k) ? `Có sẵn ${esc(sampleLabel(tkbOffer(k)))}` : 'Chưa có, tạo mới'))); }
    return menuSheet('Thêm vào Học tập', [menuRow(`data-act="task-form" data-kid="${kid}"`, '📝', 'Bài tập', 'Bài cô giao, hạn nộp, các bước'),
      menuRow(`data-act="lesson-form" data-kid="${kid}"`, '📚', 'Buổi học thêm', 'Học gì, ngày nào, ai đưa đón'), menuRow(`data-act="event-form" data-kid="${kid}"`, '📌', 'Mốc năm học', 'Kiểm tra, nghỉ học, họp phụ huynh')]);
  }
  if (v === 'tai-khoan') {
    const ak = S.kids[UI.acctKid] ? UI.acctKid : kids[0].id, nm = esc(kidName(ak));
    return menuSheet(`Thêm cho ${nm}`, [menuRow('data-act="acct-mode" data-v="bonus"', '⭐', 'Thưởng thêm', 'Cộng một khoản ngoài việc nhà'), menuRow('data-act="acct-mode" data-v="spend"', '💸', 'Chi tiêu', 'Con tiêu tiền, rút tiền mặt'),
      menuRow(`data-act="goal-form" data-kid="${ak}"`, '🎁', 'Mục tiêu tiết kiệm', 'Con muốn để dành mua gì')]);
  }
  if (v === 'quy-dinh') return menuSheet('Thêm vào Quy định', [...CHORE_KINDS.map(([k, l, ic]) => menuRow(`data-act="chore-form" data-kind="${k}"`, ic, l, CHORE_KIND_SUB[k])),
    ...PRICE_KINDS.map(([k, l, ic]) => menuRow(`data-act="price-form" data-kind="${k}"`, ic, l, PRICE_HELP[k]))]);
  // Gia đình chỉ còn phần cài đặt: nút + thêm con. Việc nhà thêm ở trang Quy định.
  if (v === 'gia-dinh') return kidForm();
}

// ---------- thêm việc nhanh ----------
// Chỉ một ô gõ tên việc và vài lựa chọn bấm để đổi; còn lại lấy mặc định. Muốn chỉnh kỹ thì bấm ⋯ để mở form đầy đủ.
let QA = null;
const QA_PAY = [[5000, 'Được thưởng +5.000đ'], [10000, 'Được thưởng +10.000đ'], [0, 'Việc phải làm']];
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
function quickAdd(slot) {
  if (!kidsList().length) return kidForm();
  QA = { slot: SLOTS.some(x => x[0] === slot) ? slot : key(UI.date) === key(today()) ? slotAt(nowMin()) : '', rep: 0, who: 0, pay: 0 };
  openModal(`<div class="qa"><div class="qa-row"><input id="qname" class="qa-input" maxlength="40" placeholder="Thêm một việc thôi" autocomplete="off" enterkeyhint="done" aria-label="Tên việc"><button class="qa-go" data-act="qa-save" aria-label="Thêm việc">${PLUS}</button></div>
    <div class="qa-chips" id="qa-chips">${qaChips()}</div></div>`);
  $('#qname').focus();
}
// Các lựa chọn đang có trong ô thêm nhanh, đổi sang dạng dữ liệu của một việc.
const qaData = () => ({ name: $('#qname')?.value.trim() || '', slot: QA.slot, days: qaReps()[QA.rep][0], kids: qaWho()[QA.who][0], money: QA_PAY[QA.pay][0] });

// Bốn tab, chia theo nguồn: Sắp tới (lịch gộp theo ngày), Bài tập, Ở trường (thời khoá biểu và mốc năm học), Học thêm (lịch, đưa đón, sổ học của cô, học phí).
const LEARN_TABS = [['sap-toi', 'Sắp tới'], ['bai-tap', 'Bài tập'], ['truong', 'Ở trường'], ['hoc-them', 'Học thêm']];
// Mở một tab của Học tập. Link cũ trỏ tới Thời khoá biểu hay Mốc năm học thì mở tab Ở trường, đúng phần đó. kid: màn của con (nhớ tab riêng).
function setLearn(v, kid) {
  const part = v === 'tkb' || v === 'moc' ? v : '', tab = part ? 'truong' : v;
  if (kid) { UI.kmLearn = tab; if (part) UI.kmTruong = part; } else { UI.learn = tab; if (part) UI.truong = part; }
}
function viewSchedule() {
  const kids = kidsList();
  if (!kids.length) return `<div class="day-head"><h1>Học tập</h1></div>` + noKids();
  // Trang sổ học của một cô (#lich-hoc/so/<mã sổ>). Sổ đã bị xoá thì về danh sách.
  if (UI.so) { const c = classesList().find(x => x.id === UI.so); if (c) return soPage(c); UI.so = null; UI.soBack = null; UI.learn = 'hoc-them'; history.replaceState(null, '', location.pathname + location.search + '#lich-hoc'); }
  // Nhiều con thì mặc định xem cả nhà, để thấy ngay giờ nào cần đưa đón hai nơi.
  const all = kids.length > 1 && (UI.tkbKid === 'all' || !S.kids[UI.tkbKid]);
  const k = all ? null : kids.find(x => x.id === UI.tkbKid) || kids[0];
  return `<div class="tbar">${kidTabs(kids, all ? 'all' : k.id, 'learn-kid', null, kids.length > 1)}${pillBar(plusBtn('Thêm bài tập, buổi học thêm, mốc năm học'))}</div>` + learnPage(all ? kids : [k], all);
}
// Tiêu đề, 4 tab và nội dung của màn Học tập. Máy của con dùng lại phần này cho riêng con đó, ở chế độ chỉ xem (RO).
function learnPage(ks, all) {
  const k = all ? null : ks[0];
  const tab = LEARN_TABS.some(x => x[0] === UI.learn) ? UI.learn : 'sap-toi';
  const t = today(), sel = UI.agDate || t;
  const h = `<div class="day-head"><h1>Học tập</h1>${tab === 'sap-toi' ? `<div class="day-side"><label class="day-pick"><span>Tháng ${sel.getMonth() + 1}, ${sel.getFullYear()}</span>${CHEV}<input type="date" id="ag-pick" value="${key(sel)}" aria-label="Chọn ngày"></label>${key(sel) === key(t) ? '' : '<button class="linkbtn" data-act="ag-day" data-d="">Về hôm nay</button>'}</div>` : ''}</div>
  <div class="tabbar" role="tablist">${LEARN_TABS.map(([v, l]) => `<button role="tab" aria-selected="${v === tab}" class="${v === tab ? 'on' : ''}" data-act="learn-tab" data-v="${v}">${l}${v === 'bai-tap' && openTasks(k?.id).length ? ` <i class="cnt num">${openTasks(k?.id).length}</i>` : ''}</button>`).join('')}</div>`;
  if (tab === 'sap-toi') return h + viewAgenda(ks);
  if (tab === 'bai-tap') return h + tasksView(ks);
  if (tab === 'truong') return h + schoolView(ks, all);
  return h + (all ? familyWeek(ks) : kidSchedule(k, 'lessons'));
}
// Tab Ở trường: thời khoá biểu và mốc năm học, hai thứ đều là lịch của trường. Thanh gạt chọn phần đang xem.
function schoolView(ks, all) {
  const part = UI.truong === 'moc' ? 'moc' : 'tkb';
  const seg = `<div class="seg modes">${[['tkb', 'Thời khoá biểu'], ['moc', 'Mốc năm học']].map(([v, l]) => `<label><input type="radio" name="truong" value="${v}" ${v === part ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  return seg + (part === 'moc' ? eventsCard(all ? null : ks[0].id) : ks.map(x => (all ? kidChip(x) : '') + kidSchedule(x, 'tkb')).join(''));
}

// ---------- bài tập ----------
// tasks: { kid, title, kind: bt|on|da, subj, due: "YYYY-MM-DD", notes, steps: [{ t, done }], done, doneAt }
const TASK_KINDS = [['bt', 'Bài tập', '📝'], ['on', 'Ôn kiểm tra', '📖'], ['da', 'Dự án', '🧪']];
// Gồm cả bài cô giao trong sổ học của cô (t.cls: sổ nào, t.hw: bài gốc trong sổ), xem classTasks.
const tasksList = () => memoize('tasks', () => [...Object.entries(S.tasks || {}).map(([id, t]) => ({ id, ...t, steps: Array.isArray(t.steps) ? t.steps : [] }))
  .filter(t => S.kids[t.kid]), ...classTasks()].sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || String(a.title).localeCompare(String(b.title), 'vi')));
const taskOf = id => tasksList().find(t => t.id === id);
const openTasks = kidId => tasksList().filter(t => !t.done && (!kidId || t.kid === kidId));
// Bài cần nhắc ở màn Hôm nay: quá hạn, hạn hôm nay hoặc ngày mai.
const tasksSoon = kidId => openTasks(kidId).filter(t => t.due && daysTo(t.due) <= 1);
// Ngày học tới có môn này: theo thời khoá biểu ở trường (bỏ qua ngày nghỉ), hoặc buổi học thêm cùng tên.
function nextSubjectDay(kidId, subj, from = today()) {
  if (!subj || (!tkbOf(kidId) && !lessonsOf(kidId).length)) return null;
  for (let i = 1; i <= 31; i++) {
    const x = addDays(from, i), info = schoolOn(kidId, x);
    if ((info && info.subjects.some(s => norm(s) === norm(subj))) || lessonsOn(kidId, x.getDay()).some(l => norm(l.name) === norm(subj))) return x;
  }
  return null;
}
function taskRow(t, showKid, mode = '') {
  const big = mode === 'big', bare = big || mode === 'mini';
  const nd = t.steps.filter(x => x.done).length, over = !t.done && t.due && daysTo(t.due) < 0, kind = TASK_KINDS.find(x => x[0] === t.kind) || TASK_KINDS[0];
  const natt = t.cls ? t.hw.files.length + linkList(t.hw.links).length : 0;
  const meta = [t.subj ? `${subjDot(t.subj)}${esc(t.subj)}` : '', t.done ? (t.cls ? esc(hwState(t.hw).txt) : `xong ${t.doneAt ? dm(parse(t.doneAt)) : ''}`) : t.due ? `<span class="${over ? 'late' : ''}">${over ? '' : 'hạn '}${esc(dueLabel(t.due))}</span>` : 'chưa có hạn',
    t.steps.length ? `${nd}/${t.steps.length} bước` : '', showKid ? esc(kidName(t.kid)) : '', t.by ? 'con tự thêm' : '', t.cls ? `${esc(t.cls.teacher || 'cô')} giao` : '', natt ? `📎 ${natt}` : ''].filter(Boolean).join(' · ');
  // Máy của con (RO): chỉ bài do chính con thêm (t.by) mới có nút sửa.
  // Bài cô giao: không sửa được ở nhà, bấm để xem cô dặn gì, file đính kèm, điểm và nhận xét.
  const acts = bare ? '' : t.cls ? `<div class="acts"><button class="edit" data-act="hw-view" data-id="${esc(t.id)}" aria-label="Xem: ${esc(t.title)}">${CHEV}</button></div>` : RO ? (t.by && t.by === t.kid ? `<div class="acts"><button class="edit" data-act="task-form" data-id="${t.id}" data-lock="1" aria-label="Sửa: ${esc(t.title)}">${CHEV}</button></div>` : '') : `<div class="acts">${editBtn('task-form', t.id, t.title)}</div>`;
  const steps = !t.done && t.steps.length ? `<div class="steps">${t.steps.map((x, i) => `<button class="step ${x.done ? 'on' : ''}" data-act="task-step" data-id="${t.id}" data-i="${i}" aria-pressed="${!!x.done}">${esc(x.t)}</button>`).join('')}</div>` : '';
  return `<div class="${big ? 'big-item task' : 'item task'} ${t.done ? 'done' : ''}"><button class="check ${t.done ? 'on' : ''}" data-act="task-done" data-id="${t.id}" aria-pressed="${!!t.done}" aria-label="${t.done ? 'Chưa xong' : 'Xong'}: ${esc(t.title)}">✓</button>
    <div class="txt"><div class="t">${kind[2]} ${esc(t.title)}</div><div class="s">${meta}</div>${t.notes && !bare ? `<div class="s snip">${esc(String(t.notes).slice(0, 120))}</div>` : ''}${steps}${t.cls && big ? `<button class="linkbtn hw-open" data-act="hw-view" data-id="${esc(t.id)}">Xem cô dặn gì${natt ? ` · 📎 ${natt} file` : ''}</button>` : ''}</div>
    ${acts}</div>`;
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
  // Máy của con: con tự thêm bài cần làm cho mình (bài cô giao, việc cần hoàn thành).
  if (RO && !multi) h += `<button class="slot-blank" data-act="task-form" data-kid="${ids[0]}" data-lock="1"><span>Cô giao bài gì? Bấm để tự thêm bài cần làm</span>${PLUS}</button>`;
  if (!open.length) return h + (RO ? `<p class="foot-note">Con không còn bài nào phải làm 🎉</p>` : blankAdd('Ghi bài cô giao: môn gì, hạn nộp ngày nào', 'task-form', kidAttr) + `<p class="foot-note">Không còn bài nào phải làm. App xếp bài theo hạn nộp và nhắc ở màn Hôm nay.</p>`);
  const groups = [['Quá hạn', t => t.due && t.due < tk, 's-late'], ['Hôm nay', t => t.due === tk, 'tn3'], ['Ngày mai', t => t.due && daysTo(t.due) === 1, 'tn0'],
    ['Tuần này', t => t.due && daysTo(t.due) > 1 && t.due <= key(addDays(weekStart(today()), 6)), 'tn4'], ['Sau đó', t => t.due && t.due > key(addDays(weekStart(today()), 6)), ''], ['Chưa có hạn', t => !t.due, '']];
  // Tiến độ tuần này: bài có hạn trong tuần, đã xong / tổng.
  const ws = key(weekStart(today())), we = key(addDays(weekStart(today()), 6)), wk = mine.filter(t => t.due && t.due >= ws && t.due <= we), wd = wk.filter(t => t.done).length;
  if (wk.length) h += `<section class="kid-sum"><div class="kid-sum-row"><b class="kid-sum-t">Tuần này xong ${wd}/${wk.length} bài</b></div>${barCount(wd, wk.length)}</section>`;
  h += `<div class="slots">`;
  // Mỗi bài chỉ nằm ở nhóm đầu tiên khớp (chủ nhật thì "Ngày mai" là thứ 2 của tuần sau, cũng khớp "Sau đó").
  const placed = new Set();
  for (const [label, f, tint] of groups) {
    const list = open.filter(t => !placed.has(t) && f(t)); list.forEach(t => placed.add(t)); if (!list.length) continue;
    h += `<section class="slot ${tint}">${secHead('', label, { cnt: list.length })}<div class="slot-list list">${list.map(t => taskRow(t, multi)).join('')}</div></section>`;
  }
  return h + `</div>`;
}
// Môn ít khi có bài tập về nhà: trong form bài tập được gom vào một nhóm gập sẵn cho đỡ rối.
const RARE_HW = ['thể dục', 'giáo dục thể chất', 'gdtc', 'âm nhạc', 'chào cờ', 'sinh hoạt dưới cờ', 'đạo đức', 'hđtn', 'hoạt động trải nghiệm', 'sinh hoạt lớp', 'tin học'];
const rareHw = x => RARE_HW.includes(norm(x));
// lock: mở từ màn của con. Bài luôn là của con đó (không chọn con khác), bài mới được ghi là con tự thêm (by).
function taskForm(id, kidPre, lock) {
  const t = id ? S.tasks[id] : null, kids = kidsList();
  const kid = t?.kid || (S.kids[kidPre] ? kidPre : S.kids[UI.tkbKid] ? UI.tkbKid : kids[0]?.id); if (!kid) return;
  // Môn gợi ý: các môn trong thời khoá biểu ở trường và các buổi học thêm. Mở từ màn của con thì chỉ lấy của con đó.
  const src = lock ? kids.filter(k => k.id === kid) : kids;
  const subs = [...new Set(src.flatMap(k => tkbOf(k.id) ? tkbStats(tkbOf(k.id)).subjects.map(x => x[0]) : []))];
  const extra = [...new Set(src.flatMap(k => lessonsOf(k.id).map(l => String(l.name || '').trim())).filter(Boolean))].filter(x => !subs.some(y => norm(y) === norm(x)));
  const main = subs.filter(x => !rareHw(x)), rare = subs.filter(rareHw);
  const chip = x => `<button class="btn quiet sm" data-act="task-subj" data-v="${esc(x)}">${subjDot(x)}${esc(x)}</button>`;
  const kind = t?.kind || 'bt';
  openModal(`<h2>${t ? 'Sửa bài tập' : lock ? 'Thêm bài cần làm' : 'Thêm bài tập'}</h2>
  ${titleCard('ttitle', t?.title, 'Bài gì?', { max: 80 })}
  <div class="fg">
    ${kids.length > 1 && !lock ? kidRow('Con', 'tkid', 'radio', [kid]) : `<input type="hidden" name="tkid" value="${kid}">`}${lock && !t ? `<input type="hidden" id="tby" value="${kid}">` : ''}
    ${frow('Loại', pillSel('tkind', TASK_KINDS.map(([v, l]) => [v, l]), kind), { id: 'tkind' })}
    <div class="fr col">${frow('Môn', `<input id="tsubj" class="pillin txt" list="tsubj-list" maxlength="40" value="${esc(t?.subj || '')}" placeholder="Toán">`, { id: 'tsubj', cls: 'in' })}
      <datalist id="tsubj-list">${[...new Set([...subs, ...extra, ...SUBJECTS])].map(x => `<option value="${esc(x)}">`).join('')}</datalist>
      ${main.length ? `<div class="row">${main.map(chip).join('')}</div>` : ''}
      ${extra.length ? `<span class="fs">Học thêm</span><div class="row">${extra.map(chip).join('')}</div>` : ''}
      ${rare.length ? `<details class="adv subj-more" ${rare.some(x => norm(x) === norm(t?.subj)) ? 'open' : ''}><summary>Môn khác, ít có bài tập (${rare.length})</summary><div class="row">${rare.map(chip).join('')}</div></details>` : ''}
      ${subs.length || extra.length ? `<span class="fs">Chọn môn thì hạn nộp tự đặt vào buổi học tới của môn đó.</span>` : ''}</div>
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
  const sl = stayLine(sel.getDay(), key(sel) === key(t));
  h += `<b class="kid-sum-t">${dd ? dd + ', ' : ''}${dd ? WD[sel.getDay()].toLowerCase() : WD[sel.getDay()]} ${dm(sel)}</b>${sl ? `<div class="notes"><div class="stay-note ${stayInfo(sel.getDay())?.moved ? 'moved' : ''}">${esc(sl)}</div></div>` : ''}<div class="slots">`;
  for (const k of ks) {
    const a = dayAgenda(k.id, sel);
    let b = '';
    const part = (title, body) => body ? `<div class="ag-sec"><div class="cap">${title}</div>${body}</div>` : '';
    b += part('Kiểm tra và mốc', a.events.map(e => `<div class="item event"><span class="ico">${esc(e.icon || '📌')}</span><div class="txt"><div class="t">${esc(e.name)}</div><div class="s">${esc(eventRange(e))}</div></div></div>`).join(''));
    b += part('Ở trường', a.hol ? `<p class="muted small" style="margin:4px 0">Nghỉ: ${esc(a.hol.name)}</p>` : a.school ? `<div class="periods">${a.school.list.map(p => `<div class="period"><span class="num">${esc(p.s)}</span>${subjDot(p.subj)}<span>${esc(p.subj)}</span></div>`).join('')}</div>` : '');
    b += part('Học thêm', a.lessons.map(l => `<div class="period"><span class="num">${esc(l.s)}</span><i class="dot lesson"></i><span>${esc(l.name)}${l.at ? ` <span class="muted small">· ${esc(placeName(l.at))}</span>` : ''}</span></div>`).join(''));
    b += part('Bài phải nộp', a.tasks.length ? `<div class="list">${a.tasks.map(x => taskRow(x, false)).join('')}</div>` : '');
    h += `<section class="slot">${multi ? kidChip(k) : ''}${b ? `<div class="slot-list pad">${b}</div>` : RO ? `<div class="slot-blank ro"><span>Ngày này con không có lịch học, bài tập hay kiểm tra</span></div>` : `<button class="slot-blank" data-act="page-add"><span>Ngày này ${esc(k.name)} không có lịch học, bài tập hay kiểm tra</span>${PLUS}</button>`}</section>`;
  }
  return h + `</div>`;
}

// part: 'tkb' (ở trường và số giờ mỗi tuần) hoặc 'lessons' (học thêm).
function kidSchedule(k, part) {
  const t = tkbOf(k.id), wd = today().getDay();
  let h = '';
  if (part === 'lessons') return `<div class="slots">${kidLessons(k)}${classesSection([k])}</div>`;
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
// Cả nhà: lịch học thêm của các con theo từng ngày, kèm lịch đưa đón và cảnh báo.
function familyWeek(kids) {
  const wd = today().getDay(), all = lessonsList();
  let h = `<div class="slots"><section class="slot tn1">${secHead('📚', 'Học thêm', { cnt: all.length || '', add: addBtn('lesson-form', 'Thêm buổi học thêm') })}`;
  if (!all.length) return h + blankAdd('Thêm buổi học thêm của từng con, ghi ai đưa đón', 'lesson-form') + `</section>${classesSection(kids)}</div><p class="foot-note">App xếp lịch đưa đón theo từng ngày và báo khi hai chuyến sát giờ nhau.</p>`;
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
  }).join('')}</div></section>${classesSection(kids)}</div>`;
  return h;
}
function lessonItem(l, who = false) {
  const k = S.kids[l.kid] ? { id: l.kid, ...S.kids[l.kid] } : null;
  return `<div class="item">${who && k ? ava(k, 'sm') : `<span class="ico">${lessonIcon(l.name)}</span>`}<div class="txt"><div class="t">${who && k ? `${esc(k.name)} · ` : ''}${esc(l.name)}</div><div class="s num">${esc(l.s)} – ${esc(l.e)} · ${durTxt(lessonMin(l))}</div>${placeTxt(l) ? `<div class="s">${placeTxt(l)}</div>` : ''}</div>
    <div class="acts">${editBtn('lesson-form', l.id, l.name)}</div></div>`;
}
// Việc máy của con được làm: đánh dấu việc, bài tập của chính mình, gập mở các buổi, xin thêm hoặc xin sửa việc thích làm (bố mẹ duyệt), và xin vào phần bố mẹ.
// Thêm các nút chỉ để xem ở mục Học tập: đổi tab, chọn ngày, chọn thứ, mở nhóm đã qua.
const KID_ACTS = new Set(['close', 'tick', 'step', 'slot-toggle', 'task-done', 'task-step', 'role-kid', 'role-kid-ok', 'role-parent', 'pin-ok',
  'tkb-go', 'learn-tab', 'tkb-day', 'ag-day', 'ag-week', 'hist-all', 'sec-toggle', 'merit-open', 'merit-pick', 'merit-ask', 'merit-cancel', 'fun-form', 'fun-ask', 'fun-cancel', 'fun-need', 'num-step', 'km-acct', 'task-form', 'task-save', 'task-del', 'task-subj', 'task-due', 'hw-view', 'file-open', 'print-ask', 'sub-del']);
// Việc màn của cô được làm: chỉ những gì thuộc sổ học.
const TEACH_ACTS = new Set(['close', 't-tab', 't-menu', 'sess-form', 'sess-view', 'sess-toggle', 'none', 'so-plan-more', 'so-off', 'sess-save', 'hw-row-add', 'so-import', 'so-import-go', 'sess-del', 'hw-form', 'hw-save', 'hw-del', 'hw-due', 'file-open', 'sub-dl', 'att-del', 'so-print', 'sec-toggle', 'num-step', 'bank-form', 'bank-save']);
function kidMay(a, b) {
  const r = deviceRole(); if (r === 'parent') return true;
  if (!KID_ACTS.has(a)) return false;
  if (a === 'tick' || a === 'step') return b.dataset.kid === r;
  if (a === 'task-done' || a === 'task-step' || a === 'hw-view' || a === 'print-ask' || a === 'sub-del') return taskOf(b.dataset.id)?.kid === r;
  if (a === 'file-open') return classesList().some(c => c.code === b.dataset.code && c.kid === r);
  // Bài tập: con tự thêm bài cho chính mình; chỉ sửa, xoá được bài do chính con thêm (bài bố mẹ ghi thì chỉ tick).
  if (a === 'task-form' || a === 'task-save' || a === 'task-del') {
    const t = S.tasks[b.dataset.id];
    return b.dataset.id ? !!t && t.kid === r && t.by === r : a === 'task-save' || (a === 'task-form' && b.dataset.kid === r);
  }
  if (a === 'role-kid' || a === 'role-kid-ok') return r === 'ask';
  // Thành tích: con chỉ báo cho chính mình và chỉ huỷ mục của mình đang chờ duyệt. Duyệt là việc của bố mẹ.
  if (a === 'merit-open' || a === 'merit-pick' || a === 'merit-ask') return b.dataset.kid === r;
  if (a === 'merit-cancel') { const l = S.ledger[b.dataset.id]; return !!l && !!l.pending && l.kid === r; }
  // Việc thích làm: con chỉ xin thêm, xin sửa cho chính mình và chỉ huỷ yêu cầu của mình. Duyệt là việc của bố mẹ.
  if (a === 'fun-form' || a === 'fun-ask') return b.dataset.kid === r;
  if (a === 'fun-cancel') return funAsks(r).some(x => x.id === b.dataset.id);
  return true;
}

// Thành tích học tập trên màn của con: những mục con đã báo đang chờ duyệt, và nút + để báo mục mới.
function meritSection(k) {
  const pend = pendingList(k.id);
  return meritList().length ? `<section class="slot tn3">${secHead('🏅', 'Thành tích học tập', { cnt: pend.length || '' })}
    ${pend.length ? `<div class="slot-list list">${pend.map(l => `<div class="item pend"><span class="ico">${esc(l.icon || '🏅')}</span><div class="txt"><div class="t">${esc(l.note || 'Thành tích')}</div><div class="s">⏳ Chờ bố mẹ duyệt · ${dm(new Date(l.at))}</div></div>
      <div class="acts col"><span class="delta num wait">+${money(l.ask)}</span><button class="linkbtn undo" data-act="merit-cancel" data-id="${l.id}">Huỷ</button></div></div>`).join('')}</div>` : ''}
    <button class="slot-blank" data-act="merit-open" data-kid="${k.id}"><span>Được cô khen, được điểm 9, điểm 10 ở trường hay ở lớp học thêm? Bấm để báo bố mẹ</span>${PLUS}</button></section>` : '';
}
// Tin mới trên tab Hôm nay của con: hôm nay, hôm qua bị trừ tiền vì gì (phạt, phí sử dụng) và thành tích nào bố mẹ vừa duyệt. Bấm để sang tab Tài khoản.
function kmNews(k, t) {
  const tk = key(t), yk = key(addDays(t, -1)), day = iso => { const dk = iso ? key(new Date(iso)) : ''; return dk === tk ? 'Hôm nay' : dk === yk ? 'Hôm qua' : ''; };
  const mine = Object.values(S.ledger).filter(l => l.kid === k.id && !l.pending).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const cuts = mine.filter(l => ['penalty', 'fee'].includes(l.kind) && ledgerVnd(l) < 0 && day(l.at)), oks = mine.filter(l => day(l.okAt) && ledgerVnd(l) > 0);
  const card = (cls, title, list, when) => list.length ? `<button class="km-news ${cls}" data-act="km-acct"><b>${title}</b>${list.map(l => `<span>${day(when(l))} · ${esc(l.note || '')} <i class="num">${signed(ledgerVnd(l))}</i></span>`).join('')}${CHEV}</button>` : '';
  return card('cut', `⚠️ Con bị trừ ${money(-cuts.reduce((a, l) => a + ledgerVnd(l), 0))}`, cuts, l => l.at) + card('ok', `🏅 Bố mẹ đã duyệt, con được cộng ${money(oks.reduce((a, l) => a + ledgerVnd(l), 0))}`, oks, l => l.okAt);
}
// Bảng phạt và phí cho con xem (lấy từ trang Quy định của bố mẹ): lỗi nào bị trừ bao nhiêu, dùng gì mất bao nhiêu mỗi giờ, để con biết mà tránh.
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
    // Tab Học tập của con nhớ tab riêng (UI.kmLearn), mở ở Sắp tới, không theo tab bố mẹ xem lần cuối trên cùng máy.
    const parent = [UI.learn, UI.truong]; setRO(true); UI.learn = UI.kmLearn || 'sap-toi'; UI.truong = UI.kmTruong || 'tkb';
    try { el.innerHTML = `<div class="wrap">${top}${tab === 'learn' ? learnPage([k], false) : kidAcct(k)}</div>`; } finally { setRO(false); [UI.learn, UI.truong] = parent; }
    return;
  }
  const list = mustFor(k.id, t), n = list.filter(c => isDone(t, k.id, c.id)).length, plan = dayPlan(k.id, t), cur = slotAt(nowMin());
  const sc = schoolNow(k, t, true);
  const kst = stayNow(t.getDay());
  const kts = tasksSoon(k.id), g1 = goalProgress(k.id)[0];
  const goal = g1 ? `<div class="km-goal"><div class="t">${esc(g1.icon || '🎁')} Con đang để dành mua <b>${esc(g1.name)}</b></div>${coins(g1, true)}<div class="muted">${g1.need ? `Còn thiếu ${money(g1.need)}` : 'Đủ tiền rồi! Nhờ bố mẹ mua cho con nhé 🎉'}</div></div>` : '';
  // Trên danh sách việc: những gì con phải làm hôm nay (bài cần nộp, soạn cặp). Dưới danh sách: mốc sắp tới và mục tiêu tiết kiệm.
  // Bài cô vừa giao trong hai ngày qua (chưa tới hạn nên chưa nằm trong Bài cần nộp): báo để con biết có bài mới.
  const fresh = openTasks(k.id).filter(x => x.cls && x.hw.at && Date.now() - new Date(x.hw.at) < 2 * 864e5 && !kts.some(y => y.id === x.id));
  const school = (fresh.length ? `<section class="slot tn2">${secHead('📒', 'Cô mới giao bài', { cnt: fresh.length })}<div class="big-list">${fresh.map(x => taskRow(x, false, 'big')).join('')}</div></section>` : '')
    + (kts.length ? `<section class="slot s-task">${secHead('📝', 'Bài cần nộp', { cnt: kts.length })}<div class="big-list">${kts.map(t => taskRow(t, false, 'big')).join('')}</div></section>` : '')
    + (sc ? `<section class="slot tn4">${secHead(sc.bag ? '🎒' : '🏫', esc(sc.title))}<div class="slot-list pad"><div class="sj-list">${subjChips(sc.subjects)}</div></div></section>` : '');
  const after = eventLines(k, 'km-event') + goal;
  const merit = meritSection(k) + funSection(k);
  const bigChore = (x, g) => {
    const c = x.c, on = isDone(t, k.id, c.id), steps = stepsOf(c, k.id, t), mask = stepMask(t, k.id, c.id);
    const sub = `<span class="s">${choreMeta(c, k.id, t, true)}</span>`;
    if (isFun(c)) return x.locked
      ? `<button class="big-item fun locked" data-act="fun-need" data-kid="${k.id}" data-chore="${c.id}" data-d="${key(t)}"><span class="ico">${esc(c.icon || '🎈')}</span><span><span class="t">${esc(c.name)}</span><br><span class="s">${esc(needLine(g.need))}. Bấm để xem cần làm gì.</span></span><span class="lockic">🔒</span></button>`
      : `<div class="big-item fun open"><span class="ico">${esc(c.icon || '🎈')}</span><span><span class="t">${esc(c.name)}</span><br><span class="s">Mở khoá rồi, con được làm việc này!</span></span><span class="lockic"></span></div>`;
    if (!steps.length) return `<button class="big-item ${on ? 'done' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" data-km="1" aria-pressed="${on}"><span class="ico">${esc(c.icon || '✅')}</span><span><span class="t">${esc(c.name)}</span><br>${sub}</span><span class="stamp ${on ? 'on' : ''}">${STAR}</span></button>`;
    return `<div class="big-item has-steps ${on ? 'done' : ''}"><div class="big-top"><span class="ico">${esc(c.icon || '✅')}</span><span><span class="t">${esc(c.name)}</span><br>${sub}</span>
      <button class="stamp ${on ? 'on' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" data-km="1" aria-pressed="${on}" aria-label="${on ? 'Bỏ dấu' : 'Xong hết'}: ${esc(c.name)}">${STAR}</button></div>
      <div class="big-steps">${steps.map(st => { const ok = on || (mask >> st.i) & 1; return `<button class="step ${ok ? 'on' : ''}" data-act="step" data-kid="${k.id}" data-chore="${c.id}" data-i="${st.i}" data-km="1" aria-pressed="${!!ok}">${esc(st.t)}</button>`; }).join('')}</div></div>`;
  };
  // Mỗi buổi một nhãn màu như màn Hôm nay, chữ và nút to hơn. Chỉ buổi đang diễn ra mở sẵn (xem slotOpenDefault); bấm nhãn để mở buổi khác.
  const timeline = plan.map(g => {
    const sk = `km|${key(t)}|${k.id}|${g.id}|${cur}`, isNow = !g.extra && g.id && g.id === cur;
    const sc = slotCount(g, k.id, t), full = sc.full, cnt = sc.cnt, hasFun = g.items.some(x => x.type === 'chore' && isFun(x.c));
    const open = UI.slotOpen[sk] ?? slotOpenDefault(g, cur, full, sc.nd, hasFun);
    return `<section class="slot s-${g.extra ? 'them' : g.id || 'any'} ${isNow ? 'now' : ''} ${full ? 'full' : ''}" data-slot="${sk}"><div class="slot-h"><button class="slot-pill" data-act="slot-toggle" data-slot="${sk}" aria-expanded="${!!open}">${g.icon}<span>${g.label}</span>${cnt ? `<i class="num ${slotMissed(g, cur, full, sc.n) ? 'late' : ''}">${cnt}</i>` : ''}${DOWN}</button>${isNow ? '<span class="nowpill">Bây giờ</span>' : ''}</div>
      ${open ? slotSecs(g).map(part => `${SEC_LABEL[part.sec] ? subHead(part.sec, part.items, k.id, t) : ''}<div class="big-list">${part.items.map(x => x.type === 'chore' ? bigChore(x, g) : markRow(x, true)).join('')}</div>`).join('') : ''}</section>`;
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
  const item = c => `<li><span class="bx"></span>${esc(c.icon || '')} ${esc(c.name)}<span class="sm">${toMin(c.time) !== null ? ` ${c.by ? 'trước ' : ''}${esc(c.time)}` : ''}${perWeekOf(c) ? ` · ${perWeekOf(c)} lần/tuần` : esc(daysShort(c.days))}${c.place ? ` · chỉ ở ${esc(placeLow(c.place))}` : ''}</span>${(c.steps || []).length ? `<div class="sm">${c.steps.map(esc).join(' · ')}</div>` : ''}</li>`;
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
    <div class="wp-bot">${extra.length ? `<div><div class="wp-h2">💪 Việc làm thêm được thưởng</div><div class="wp-extra">${extra.map(c => `<span>${esc(c.icon || '')} ${esc(c.name)} <b>${money(choreVnd(c))}</b></span>`).join('')}</div></div>` : ''}
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

// Đánh dấu / bỏ dấu một việc. Việc chung thì tính cho mọi con được giao việc đó trong ngày.
// Việc ai làm trước thì tính: chỉ tính cho con vừa đánh dấu; có con khác cũng đã làm thì chia đều tiền cho những con đã làm.
// Xong việc phải làm cuối cùng của buổi thì báo mở khoá việc thích làm.
function markChore(d, kid, cid, on) {
  const ch = S.chores[cid]; if (!ch || isFun(ch)) return;
  clearMemo();
  const who = ch.shared && !ch.claim ? (ch.kids || []).filter(x => S.kids[x] && choresFor(x, d).some(c => c.id === cid)) : [kid];
  if (!who.includes(kid)) who.push(kid);
  let msg = null;
  if (on) {
    const list = mustFor(kid, d), left = list.filter(c => c.id !== cid && !isDone(d, kid, c.id)).length;
    const g = dayPlan(kid, d).find(g => g.items.some(x => x.c?.id === cid));
    // Việc thích làm sẽ mở khoá nhờ việc vừa xong: chỉ còn thiếu đúng việc này (việc phải làm của buổi, hoặc việc mở khoá như đọc sách).
    const funs = [...new Set(dayPlan(kid, d).flatMap(p => p.need?.length && p.need.every(c => c.id === cid) ? p.items.filter(x => x.type === 'chore' && isFun(x.c) && x.locked).map(x => x.c.name) : []))];
    const mates = ch.claim ? claimers({ id: cid, ...ch }, d).filter(x => x !== kid) : [], gain = ch.claim ? doneVnd(claimVal(ch, mates.length + 1)) : choreVnd(ch);
    const earn = gain ? ` +${money(gain)}` : '';
    if (isExtra(ch)) msg = `${kidName(kid)} làm thêm “${ch.name}”${earn} 💪`;
    else if (!left && list.some(c => c.id === cid)) {
      confetti();
      const db = dayBonusAt(S.kids[kid], key(d));
      if (key(d) === key(today())) { const got = earned(kid, key(d), key(d)) + gain + db; setTimeout(() => celebrate(kid, got), 450); }
      else msg = `${kidName(kid)} làm xong hết việc phải làm rồi! 🎉${earn}${db ? ` Thưởng ngày đủ việc +${money(db)} ⭐` : ''}`;
    }
    else if (funs.length && (g?.id || ch.unlock)) { confetti(); msg = `🎈 Mở khoá: ${funs.join(', ')}!${earn}`; }
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
  // Việc ai làm trước thì tính: chia lại tiền cho những con đã làm (kể cả khi một con bỏ dấu).
  const doers = ch.claim ? [...claimers({ id: cid, ...ch }, d).filter(x => x !== kid), ...(on ? [kid] : [])] : [];
  for (const x of doers) if (x !== kid) setDone(key(d), x, cid, claimVal(ch, doers.length));
  for (const x of who) {
    setDone(key(d), x, cid, on ? (ch.claim ? claimVal(ch, doers.length) : doneVal(ch)) : 0);
    if ((ch.steps || []).length) setDone(key(d), x, cid + '~s', on ? stepsAll(stepsOf(ch, x, d)) : 0);
  }
  if (msg) toast(msg);
}
// Màn chúc mừng khi con làm xong hết việc phải làm hôm nay.
function celebrate(kidId, got) {
  const k = S.kids[kidId]; if (!k) return;
  clearMemo();
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
const confirmArm = {};
function armed(btn, label) {
  const k = btn.dataset.act + btn.dataset.id;
  if (confirmArm[k]) return true;
  confirmArm[k] = 1; btn.textContent = label; setTimeout(() => { delete confirmArm[k]; }, 4000); return false;
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, id = b.dataset.id;
  if (TEACH ? !TEACH_ACTS.has(a) : !kidMay(a, b)) return;
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
    const all = stepsAll(stepsOf(ch, kid, d));
    const sl = b.closest('.slot[data-slot]'); if (sl) UI.slotOpen[sl.dataset.slot] = true;
    let mask = isDone(d, kid, cid) ? all : stepMask(d, kid, cid) & all;
    mask ^= 1 << Number(b.dataset.i);
    b.classList.toggle('on', !!((mask >> Number(b.dataset.i)) & 1));
    if (mask === all) return markChore(d, kid, cid, true);
    if (isDone(d, kid, cid)) setDone(key(d), kid, cid, 0);
    setDone(key(d), kid, cid + '~s', mask);
    return;
  }
  if (a === 'tkb-go' && !$('#km').hidden) { e.preventDefault(); UI.kmTab = 'learn'; if (b.dataset.tab) setLearn(b.dataset.tab, true); UI.tkbDay = b.dataset.wd ? Number(b.dataset.wd) : null; $('#km').scrollTop = 0; return render(); }
  if (a === 'tkb-go') { UI.tkbKid = b.dataset.kid; if (b.dataset.tab) setLearn(b.dataset.tab); UI.tkbDay = b.dataset.wd ? Number(b.dataset.wd) : null; return; } // link tự chuyển sang #lich-hoc
  if (a === 'grid-week') { const n = Number(b.dataset.n); UI.gridWs = n ? addDays(UI.gridWs || weekStart(today()), n) : null; return render(); }
  if (a === 'grid-tick') { const d = parse(b.dataset.d), cid = b.dataset.chore; if (!S.chores[cid] || d > today()) return; return markChore(d, b.dataset.kid, cid, !isDone(d, b.dataset.kid, cid)); }
  if (a === 'learn-tab') { setLearn(b.dataset.v, !$('#km').hidden); UI.histAll = false; UI.tkbDay = null; return render(); }
  if (a === 'tkb-day') {
    UI.tkbDay = Number(b.dataset.d); render();
    // Bấm ở bản cả tuần thì cuộn lên thẻ của ngày vừa chọn.
    if (b.dataset.kid) requestAnimationFrame(() => document.querySelector(`[data-tkb="${b.dataset.kid}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    return;
  }
  if (a === 'ag-day') { UI.agDate = b.dataset.d ? parse(b.dataset.d) : null; return render(); }
  if (a === 'ag-week') { UI.agDate = addDays(UI.agDate || today(), Number(b.dataset.n)); return render(); }
  if (a === 'task-form') return taskForm(id, b.dataset.kid, !!b.dataset.lock);
  if (a === 'task-subj') {
    $('#tsubj').value = b.dataset.v;
    const nx = nextSubjectDay(radioVal('tkid') || document.querySelector('#modal input[name=tkid]')?.value, b.dataset.v);
    if (nx && !$('#tdue').value) $('#tdue').value = key(nx);
    return toast(nx ? `Buổi ${b.dataset.v} tới: ${WDN(nx.getDay())} ${dm(nx)}.` : `Không thấy ${b.dataset.v} trong thời khoá biểu hay lịch học thêm.`);
  }
  if (a === 'task-due') {
    const v = b.dataset.v, t = today(), kid = radioVal('tkid') || document.querySelector('#modal input[name=tkid]')?.value;
    let d = null;
    if (v === 'next') { d = nextSubjectDay(kid, $('#tsubj').value.trim()); if (!d) return toast($('#tsubj').value.trim() ? 'Không thấy môn này trong thời khoá biểu hay lịch học thêm.' : 'Chọn môn trước nhé.'); }
    else if (v === '1') d = addDays(t, 1);
    else if (v === 'mon') d = addDays(weekStart(t), 7);
    $('#tdue').value = d ? key(d) : ''; return;
  }
  if (a === 'task-save') {
    const title = $('#ttitle').value.trim(); if (!title) { $('#ttitle').focus(); return toast('Nhập tên bài nhé.'); }
    // Máy của con: bài luôn là của chính con, dù form gửi lên gì.
    const role = deviceRole(), kid = role !== 'parent' ? role : radioVal('tkid') || document.querySelector('#modal input[name=tkid]')?.value; if (!S.kids[kid]) return;
    const old = id ? S.tasks[id] : null, prev = old?.steps || [];
    const by = old ? old.by : role !== 'parent' ? role : $('#tby')?.value;
    const steps = $('#tsteps').value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 15).map(x => ({ t: x, done: !!prev.find(p => p.t === x)?.done }));
    const data = { kid, title, kind: $('#tkind').value || 'bt', subj: $('#tsubj').value.trim(), due: $('#tdue').value || '', notes: $('#tnotes').value.trim(), steps,
      done: !!old?.done, doneAt: old?.doneAt || '' };
    if (by && S.kids[by]) data.by = by;
    closeModal(); put('tasks', id || uid(), data); UI.learn = UI.view === 'lich-hoc' ? 'bai-tap' : UI.learn;
    return toast(data.due ? `Đã lưu. Hạn nộp: ${dueLabel(data.due)}.` : 'Đã lưu bài tập.');
  }
  if (a === 'task-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('tasks', id); return toast('Đã xoá bài tập.'); }
  if (a === 'task-done') {
    const t = taskOf(id); if (!t) return;
    const on = !t.done, steps = t.steps.map(x => ({ ...x, done: on ? true : x.done }));
    // Bài cô giao: ghi vào sổ của cô, chỉ ghi phần con báo xong để không đè lên điểm và nhận xét cô đang nhập.
    if (t.cls) {
      if (t.hw.got) return toast('Cô đã nhận bài này rồi.');
      if (!clsPatch(t.cls.code, 'tasks', t.hw.id, { done: on, doneAt: on ? key(today()) : '', steps })) return;
      if (b.dataset.close) closeModal();
    } else put('tasks', id, { ...S.tasks[id], done: on, doneAt: on ? key(today()) : '', steps });
    if (on) { const left = openTasks(t.kid).filter(x => x.id !== id && x.due && daysTo(x.due) <= 1).length; if (!left) confetti(); return toast(left ? `Xong “${t.title}”. Còn ${left} bài cần nộp sớm.` : `Xong “${t.title}”! 🎉`); }
    return;
  }
  if (a === 'task-step') {
    const t = taskOf(id); if (!t) return;
    const steps = t.steps.map((x, i) => i === Number(b.dataset.i) ? { ...x, done: !x.done } : x), all = steps.every(x => x.done);
    if (t.cls) { if (t.hw.got) return toast('Cô đã nhận bài này rồi.'); if (!clsPatch(t.cls.code, 'tasks', t.hw.id, { steps, done: all, doneAt: all ? key(today()) : '' })) return; }
    else put('tasks', id, { ...S.tasks[id], steps, done: all, doneAt: all ? key(today()) : '' });
    if (all) { confetti(); toast(`Xong hết các bước của “${t.title}”!`); }
    return;
  }
  // ----- sổ học của cô -----
  if (a === 't-tab') { e.preventDefault(); UI.tTab = b.dataset.v; window.scrollTo(0, 0); return render(); }
  if (a === 'sess-form') return sessForm(id, b.dataset.d);
  if (a === 'so-off') {
    const dk = okDate(b.dataset.d), cur = offOf(soOf(TEACH)); if (!dk) return;
    if (!clsPut(TEACH, 'info', 'off', { ...cur, [dk]: 1 })) return;
    return toast(`Đã ghi ${dateTxt(dk)} là ngày nghỉ.`, () => clsPut(TEACH, 'info', 'off', cur));
  }
  if (a === 'hw-form') return id ? hwForm(id) : sessForm();
  if (a === 'hw-view') return hwView(id);
  if (a === 'hw-due') {
    const v = b.dataset.v; let d = null;
    if (v === 'next') { d = nextClassDay(soOf(TEACH)); if (!d) return toast('Chưa biết buổi học tới là ngày nào. Cô chọn ngày ở ô Hạn nộp nhé.'); }
    else if (v) d = addDays(today(), Number(v));
    $('#hdue').value = d ? key(d) : ''; return;
  }
  if (a === 'att-del') { if (ATT) { ATT.files = ATT.files.filter(f => f.id !== b.dataset.fid); attDraw(); } return; }
  if (a === 'sub-dl') {
    const code = TEACH, t = code && soOf(code).tasks[id], st = CLS[code]?.st; if (!t || !st) return;
    const files = cleanFiles(t.sub); toast(`Đang tải ${files.length} file…`);
    (async () => {
      for (const f of files) {
        try { const u = URL.createObjectURL(new Blob(await st.getFile(f.id, f.n), { type: f.type || 'application/octet-stream' })), el = Object.assign(document.createElement('a'), { href: u, download: f.name }); document.body.appendChild(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000); }
        catch (e) { console.error(e); toast(`Chưa tải được “${f.name}”.`); }
      }
      toast(`Đã tải ${files.length} file về máy.`);
    })();
    return;
  }
  if (a === 'sub-del') {
    const t = tasksList().find(x => x.id === id); if (!t || !t.cls || !subMay(t) || t.hw.got) return;
    const code = t.cls.code, cur = soOf(code).tasks[t.hw.id] || {}, f = cleanFiles(cur.sub).find(x => x.id === b.dataset.fid); if (!f) return;
    if (!armed(b, '×?')) return toast('Bấm lần nữa để bỏ file này.');
    delFiles(code, [f]); clsPatch(code, 'tasks', t.hw.id, { sub: cleanFiles(cur.sub).filter(x => x.id !== f.id) });
    return hwView(id);
  }
  if (a === 'print-ask') return printAsk(id, b.dataset.who === 'send' && deviceRole() === 'parent' ? 'send' : 'bố mẹ');
  if (a === 'file-open') return okId(b.dataset.fid) && fileOpen(b.dataset.code, { id: b.dataset.fid, n: Math.min(20, Number(b.dataset.n) || 1), name: b.dataset.name || 'file', type: b.dataset.type || '', size: Number(b.dataset.size) || 0 });
  if (a === 'sess-save') {
    const state = radioVal('sstate') === 'plan' ? 'plan' : 'done', date = $('#sdate').value || '';
    if (!date && !$('#scontent').value.trim()) return toast('Chọn ngày học nhé.');
    if (state === 'done' && !date) return toast('Chọn ngày học nhé. Buổi chưa có ngày thì để Chưa học (kế hoạch).');
    // Buổi đã học: Nội dung, Nhận xét học sinh và Bài tập về nhà là phần bắt buộc. Buổi chưa học (kế hoạch) thì không bắt buộc.
    const hwLines = [...document.querySelectorAll('#shw-list .hw-in')].map(x => x.value.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 10);
    const hasHw = id && hwList(soOf(TEACH)).some(t => t.session === id);
    if (b.dataset.hw === 'new' && !hwLines.length && !hasHw) { $('#shw-list .hw-in')?.focus(); return toast('Ghi nhiệm vụ trước rồi đính kèm file nhé.'); }
    if (state === 'done') {
      if (!$('#scontent').value.trim()) { $('#scontent').focus(); return toast('Ghi nội dung buổi học nhé.'); }
      if (!$('#snote').value.trim()) { $('#snote').focus(); return toast('Ghi nhận xét học sinh nhé.'); }
      if (!b.dataset.hw && !hwLines.length && !(id && hwList(soOf(TEACH)).some(t => t.session === id))) { $('#shw-list .hw-in')?.focus(); return toast('Ghi bài tập về nhà nhé.'); }
    }
    if (ATT?.busy) return toast('Đợi file tải lên xong đã.');
    const old = id ? soOf(TEACH).sessions[id] : null, sid = id || uid(), topic = String(old?.topic || '');
    const data = { date, state, mode: radioVal('smode') || '', mins: Math.max(0, Math.round(Number($('#smins').value) || 0)), topic, content: $('#scontent').value.trim(), src: $('#ssrc').value.trim(),
      note: $('#snote').value.trim(), next: $('#snext').value.trim(), links: linkList($('#slinks').value), files: attTake(old?.files), at: old?.at || new Date().toISOString() };
    if (!clsPut(TEACH, 'sessions', sid, data)) return;
    // Mỗi dòng ở ô Bài tập về nhà thành một bài, gắn với buổi này, hạn nộp là buổi học tới sau ngày học.
    const due = okDate($('#shdue').value), t0 = Date.now(), newIds = hwLines.map(() => uid());
    hwLines.forEach((title, i) => clsPut(TEACH, 'tasks', newIds[i], { title, notes: '', due, session: sid, steps: [], links: [], files: [], at: new Date(t0 + i).toISOString() }));
    // Bài tập buổi trước cô đã tick: coi như cô đã nhận bài, ghi kèm mức hoàn thành. Bỏ tick (bài cô tick ở buổi này) thì trả lại như chưa nhận.
    for (const r of document.querySelectorAll('#modal .hw-chk')) {
      const tid = r.querySelector('input[name^="chk-"]')?.name.slice(4); if (!okId(tid)) continue;
      const m = radioVal('chk-' + tid), c = m === 'thieu' ? radioVal('lv-' + tid) || 'thieu-it' : m, cur = soOf(TEACH).tasks[tid]; if (!cur || !CHK[c] || cur.chk === c) continue;
      clsPatch(TEACH, 'tasks', tid, { chk: c, chkBy: sid, got: true, gotAt: cur.gotAt || date || key(today()) });
    }
    closeModal();
    // Đính kèm file: mở bài vừa ghi (nhiệm vụ đầu tiên, hoặc bài đã giao của buổi này) để đính kèm.
    if (b.dataset.hw) return hwForm(b.dataset.hw === 'new' ? newIds[0] || hwList(soOf(TEACH)).find(t => t.session === sid)?.id : b.dataset.hw, sid);
    return toast(hwLines.length ? `Đã lưu buổi học và giao ${hwLines.length} bài${due ? `, hạn nộp ${dueLabel(due)}` : ''}.` : 'Đã lưu buổi học.');
  }
  if (a === 'sess-view') return sessView(id);
  if (a === 'none') return;
  if (a === 'so-plan-more') { UI.secOpen['so-plan-all'] = !UI.secOpen['so-plan-all']; return render(); }
  if (a === 'sess-toggle') {
    const on = !UI.secOpen[b.dataset.key]; UI.secOpen[b.dataset.key] = on;
    b.classList.toggle('open', on); b.setAttribute('aria-expanded', on); const body = b.querySelector('.sess-body'); if (body) body.hidden = !on;
    return;
  }
  if (a === 'so-import') return soImportPick(TEACH ? null : id);
  if (a === 'so-import-go') return soImportGo();
  if (a === 'hw-row-add') {
    const box = $('#shw-list'); if (!box) return;
    const n = Number(box.dataset.base || 0) + box.querySelectorAll('.hw-in').length + 1; if (n > 10) return toast('Mỗi buổi giao tối đa 10 nhiệm vụ.');
    box.insertAdjacentHTML('beforeend', hwRowInput(n)); box.lastElementChild.focus(); return;
  }
  if (a === 'sess-del') {
    if (!armed(b, 'Bấm lần nữa để xoá')) return;
    const old = soOf(TEACH).sessions[id], at = attClear();
    delFiles(TEACH, [...(old?.files || []), ...(at?.added || [])]);
    closeModal(); clsDel(TEACH, 'sessions', id); return toast('Đã xoá buổi học.');
  }
  if (a === 'hw-save') {
    const title = $('#htitle').value.replace(/\s+/g, ' ').trim(); if (!title) { $('#htitle').focus(); return toast('Nhập tên bài nhé.'); }
    if (ATT?.busy) return toast('Đợi file tải lên xong đã.');
    const old = id ? soOf(TEACH).tasks[id] : null, prev = cleanSteps(old?.steps);
    const steps = $('#hsteps').value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 15).map(x => ({ t: x, done: !!prev.find(p => p.t === x)?.done }));
    const data = { title, notes: $('#hnotes').value.trim(), due: $('#hdue').value || '', session: $('#hsess')?.value || '', steps, links: linkList($('#hlinks').value), files: attTake(old?.files), at: old?.at || new Date().toISOString() };
    // Có điểm thì coi như cô đã nhận bài.
    if (old) { const score = $('#hscore').value.trim(), got = radioVal('hgot') === '1' || !!score; Object.assign(data, { got, gotAt: got ? old.gotAt || key(today()) : '', score, review: $('#hreview').value.trim() }); }
    // Chỉ ghi phần của cô, giữ nguyên phần con đã báo làm xong.
    if (!clsPatch(TEACH, 'tasks', id || uid(), data)) return;
    closeModal(); if (!old) UI.tTab = 'bai';
    return toast(old ? 'Đã lưu bài tập.' : `Đã giao bài${data.due ? `, hạn nộp ${dueLabel(data.due)}` : ''}. Bài hiện ngay trên máy của con.`);
  }
  if (a === 'hw-del') {
    if (!armed(b, 'Bấm lần nữa để xoá')) return;
    const old = soOf(TEACH).tasks[id], at = attClear();
    delFiles(TEACH, [...(old?.files || []), ...(at?.added || [])]);
    closeModal(); clsDel(TEACH, 'tasks', id); return toast('Đã xoá bài tập.');
  }
  if (a === 't-menu') return menuSheet('Báo cáo', [menuRow('data-act="so-print"', '🖨️', 'In báo cáo', 'Số buổi, học phí và nội dung từng buổi, khổ ngang', !soStats(soOf(TEACH)).done.length),
    menuRow('data-act="so-import"', '📥', 'Nhập từ file Excel', 'Chép các buổi từ file theo dõi tiến độ vào sổ')]);
  if (a === 'so-print') { closeModal(); const info = soOf(TEACH).info.lop || {}; return printSo(TEACH, bookName(info), info.student || '', info.teacher || '', feeOf(info)); }
  if (a === 'cls-form') return classForm(id, b.dataset.kid, b.dataset.name);
  // Mở trang sổ học của một cô. Nhớ trang đang đứng để nút quay lại về đúng chỗ (Hôm nay hoặc Học thêm).
  if (a === 'cls-open') { closeModal(); UI.soBack = location.hash || '#hom-nay'; location.hash = '#lich-hoc/so/' + encodeURIComponent(id); return; }
  if (a === 'so-back') { if (UI.soBack) return history.back(); UI.learn = 'hoc-them'; location.hash = '#lich-hoc'; return; }
  if (a === 'so-menu') {
    const c = classesList().find(x => x.id === UI.so); if (!c) return;
    return menuSheet(esc(bookName(c)), [menuRow(`data-act="cls-print" data-id="${c.id}"`, '🖨️', 'In sổ học', 'Số buổi, học phí và nội dung từng buổi, khổ ngang', !soStats(soOf(c.code)).done.length),
      menuRow(`data-act="so-import" data-id="${c.id}"`, '📥', 'Nhập từ file Excel', 'Chép các buổi từ file theo dõi tiến độ vào sổ'),
      menuRow(`data-act="cls-form" data-id="${c.id}"`, '✏️', 'Sửa sổ', 'Môn, tên cô, học phí, xoá sổ')]);
  }
  if (a === 'cls-link') return classLinkSheet(id);
  if (a === 'cls-print') { closeModal(); const c = classesList().find(x => x.id === id); return c && printSo(c.code, bookName(c), kidName(c.kid), c.teacher || '', feeOf(c)); }
  if (a === 'bank-form') return bankForm(TEACH ? '' : id);
  if (a === 'bank-save') {
    const v = (i, n) => $('#' + i).value.trim().slice(0, n), data = { bank: v('bbank', 40), number: v('bnumber', 30).replace(/[^\dA-Za-z .-]/g, ''), holder: v('bholder', 60), note: v('bnote', 200), at: new Date().toISOString() };
    const code = TEACH || classesList().find(x => x.id === id)?.code; if (!code || !clsPut(code, 'info', 'bank', data)) return;
    closeModal(); if (!TEACH) return toast('Đã lưu tài khoản của cô. Cô cũng thấy ở tab Báo cáo.');
    return toast('Đã lưu tài khoản. Phụ huynh thấy ngay khi xem sổ.');
  }
  // Bố mẹ xác nhận đã chuyển khoản học phí của một tháng (hoặc huỷ khi bấm nhầm). Ghi cả danh sách các tháng trong một tài liệu của sổ.
  if (a === 'fee-paid' || a === 'fee-unpaid') {
    const c = classesList().find(x => x.id === id), mk = b.dataset.mk; if (!c || !/^\d{4}-\d{2}$/.test(mk || '')) return;
    const cur = paidOf(soOf(c.code)), next = { ...cur };
    if (a === 'fee-paid') next[mk] = { at: key(today()), amount: Math.max(0, Number(b.dataset.amount) || 0) }; else delete next[mk];
    if (!clsPut(c.code, 'info', 'paid', next)) return;
    return a === 'fee-paid' ? toast(`Đã xác nhận đóng học phí ${monthTxt(mk).toLowerCase()} cho ${c.teacher || 'cô'}.`, () => clsPut(c.code, 'info', 'paid', cur)) : toast('Đã huỷ xác nhận.');
  }
  if (a === 'cls-links') return classLinksSheet(b.dataset.kid);
  if (a === 'cls-copy') {
    const inp = b.parentElement.querySelector('input') || $('#cl-link'), link = b.dataset.link || inp?.value; if (!link) return;
    const manual = () => { if (inp) { inp.focus(); inp.select(); } toast('Bấm giữ vào link rồi chọn Sao chép.'); };
    const ok = () => toast(b.dataset.msg ? b.dataset.msg : b.dataset.who === '' ? 'Đã sao chép tất cả link kèm tên từng cô.' : `Đã sao chép link${b.dataset.who ? ' của ' + b.dataset.who : ''}. Dán vào Zalo gửi cho cô.`);
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(ok, manual); else manual();
    return;
  }
  if (a === 'cls-save') {
    const name = $('#clname').value.trim(); if (!name) { $('#clname').focus(); return toast('Nhập tên môn nhé.'); }
    const kid = radioVal('clkid') || document.querySelector('#modal input[name=clkid]')?.value; if (!S.kids[kid]) return;
    const old = id ? S.paid[id] : null, cid = id || 'lop-' + uid();
    const book = $('#clbook').value.trim();
    const data = { lop: 1, kid, name, ...(book ? { book } : {}), ...(old?.dur ? { dur: old.dur } : {}), ...(old?.hwPen ? { hwPen: old.hwPen } : {}), ...(old?.hwFrom ? { hwFrom: old.hwFrom } : {}), ...(old?.xlAuto ? { xlAuto: old.xlAuto } : {}), ...(old?.paidFix ? { paidFix: old.paidFix } : {}), ...(old?.fix1711 ? { fix1711: old.fix1711 } : {}), ...(old?.fill1 ? { fill1: old.fill1 } : {}), teacher: $('#clteacher').value.trim(), code: old?.code || newFamilyCode(), at: old?.at || new Date().toISOString(),
      fee: Math.max(0, Math.round(Number($('#clfee').value) || 0)), feeOn: Math.max(0, Math.round(Number($('#clfeeon').value) || 0)), feeBy: $('#clfeeby').value === 'gio' ? 'gio' : 'buoi', feeOff: !$('#clfeeshow').checked };
    closeModal(); put('paid', cid, data);
    if (old) return toast('Đã lưu sổ học.');
    return classLinkSheet(cid, { id: cid, ...data });
  }
  if (a === 'cls-del') {
    if (!armed(b, 'Bấm lần nữa để xoá cả sổ')) return;
    const c = S.paid[id], k = c && CLS[c.code]; if (!c) return closeModal();
    closeModal(); CLS_GONE.add(c.code);
    // Xoá luôn nội dung sổ (buổi học, bài tập, file) để link của cô không còn mở được gì.
    if (k?.st && k.loaded) {
      for (const [sid, x] of Object.entries(k.data.sessions || {})) { delFiles(c.code, x.files); Promise.resolve(k.st.del('sessions', sid)).catch(() => {}); }
      for (const [tid, x] of Object.entries(k.data.tasks || {})) { delFiles(c.code, x.files); Promise.resolve(k.st.del('tasks', tid)).catch(() => {}); }
      for (const iid of ['lop', 'bank', 'paid']) Promise.resolve(k.st.del('info', iid)).catch(() => {});
    }
    del('paid', id); return toast('Đã xoá sổ học.');
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
    const where = $('#lwhere').value, trip = {}, at = placeName($('#lat').value);
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
    decryptSeed(pass).then(async ({ json, ver }) => { closeModal(); setSeedMem(mem ? { pass, ver } : null); setSeedChecked(true); await importData(json); confetti(); render(); })
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
      const day = placeName($(`#modal [data-sd="${d}"]`).value), night = placeName($(`#modal [data-sn="${d}"]`).value);
      if (day || night) put('stays', String(d), { day, night }); else if ((S.stays || {})[String(d)]) del('stays', String(d));
    }
    closeModal(); return toast('Đã lưu lịch các con ở đâu.');
  }
  if (a === 'fun-need') return funNeedForm(b.dataset.kid, b.dataset.chore, b.dataset.d);
  if (a === 'who-fill') { const i = $('#' + b.dataset.t); if (i) i.value = b.dataset.v; return; }
  if (a === 'lesson-del') { if (!armed(b, 'Bấm lần nữa để xoá')) return; closeModal(); del('lessons', id); return toast('Đã xoá buổi học thêm.'); }
  if (a === 'km-open') { closeModal(); const ks = kidsList(); UI.km = { on: true, kid: ks.length === 1 ? ks[0].id : null }; UI.kmTab = 'today'; return render(); }
  if (a === 'km-kid') { UI.km.kid = b.dataset.kid || null; UI.kmTab = 'today'; return render(); }
  if (a === 'sheet-open') { UI.sheet = true; return render(); }
  if (a === 'print') return printSheet();
  if (a === 'kid-form') return kidForm(id);
  if (a === 'photo-del') { setPhotoEdit({ img: null, out: '' }); const pv = $('#modal .photo-prev'); if (pv) pv.innerHTML = avInner(radioVal('kava')); b.hidden = true; $('#modal .photo-adj').hidden = true; return; }
  if (a === 'chore-form') return choreForm(id, b.dataset.kind);
  // Chọn con ở màn Hôm nay hay Tài khoản thì màn kia cũng theo con đó.
  if (a === 'today-kid' || a === 'acct-kid') { UI.todayKid = UI.acctKid = b.dataset.kid; UI.histAll = false; try { localStorage.setItem(TODAY_KID, UI.todayKid); } catch (err) {} return render(); }
  if (a === 'learn-kid') { UI.tkbKid = b.dataset.kid; return render(); }
  if (a === 'sec-toggle') { UI.secOpen[b.dataset.key] = b.getAttribute('aria-expanded') !== 'true'; return render(); }
  if (a === 'page-add') return pageAdd();
  if (a === 'acct-menu') return menuSheet('Tài khoản', [menuRow('data-act="bal-form"', '🏦', 'Khớp số dư', 'Gõ số tiền thật theo tài khoản ngân hàng'),
    `<a class="item nav" href="#quy-dinh" data-act="close"><span class="ico">🎁</span><span class="txt"><span class="t">Sửa quy định</span><span class="s">Mục phạt, phí sử dụng, phiếu thưởng</span></span>${CHEV}</a>`]);
  if (a === 'acct-mode') { closeModal(); UI.acctKind = b.dataset.v; render(); return setTimeout(() => { const i = $('#aamt'); if (i) { i.scrollIntoView({ block: 'center' }); i.focus({ preventScroll: true }); } }, 80); }
  if (a === 'price-menu') return menuSheet('Quy định', [menuRow('data-act="prices-print"', '🖨️', 'In bảng giá', 'Một tờ để dán tủ lạnh'), menuRow('data-act="coupons-print"', '🎟️', 'In phiếu thưởng', 'Tờ phiếu cắt rời', !pricesList('gift').length),
    menuRow('data-act="sheet-open"', '🗓️', 'In kế hoạch tuần', 'Mỗi con một trang A4 dán bàn học', !kidsList().length)]);
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
  if (a === 'qa-more') { if (!QA) return; const q = qaData(); choreForm(null, '', q); setModalDirty(!!q.name); return; }
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
    return toast('Đã thêm việc nhà và các mục thưởng, phạt mẫu.');
  }
  if (a === 'weekly-convert') {
    const cand = weeklyCandidates(), wk = key(weekStart(today())); if (!cand.length) return;
    for (const { id: cid, ...c } of cand) put('chores', cid, { ...c, money: 0, weeklyFrom: wk });
    for (const k of kidsList()) if (!isDaily(k) && weekBonusOf(k) !== WEEK_BONUS) {
      const { id: kid, ...rest } = k, log = Array.isArray(k.wbLog) ? k.wbLog : [], same = log.find(e => e.from === wk);
      put('kids', kid, { ...rest, weekBonus: WEEK_BONUS, wbLog: [...log.filter(e => e.from !== wk), { from: wk, amount: WEEK_BONUS, prev: same ? same.prev : weekBonusOf(k) }].sort((x, y) => x.from.localeCompare(y.from)) });
    }
    return toast(`Đã chuyển ${cand.length} việc sang việc phải làm.${kidsList().every(isDaily) ? '' : ` Làm đủ cả tuần thưởng ${money(WEEK_BONUS)}.`}`);
  }
  if (a === 'table-update') return tableUpdateForm();
  if (a === 'table-apply' || a === 'table-skip') {
    if (a === 'table-skip' && !armed(b, 'Bấm lần nữa để bỏ qua')) return;
    const bals = a === 'table-apply' ? [...document.querySelectorAll('#modal [data-tb]')].filter(i => i.value.trim() !== '' && Number.isFinite(Number(i.value))).map(i => ({ kid: i.dataset.tb, target: Math.round(Number(i.value)) })) : [];
    const n = tableUpdate()?.ops.length || 0, undo = tableUpdateRun(a === 'table-apply', bals);
    closeModal(); if (!undo) return;
    return toast(a === 'table-apply' ? `Đã cập nhật quy định: ${n} thay đổi${bals.length ? ', đã khớp số dư' : ''}.` : 'Đã bỏ qua bản này, quy định giữ nguyên.', () => { undo(); toast('Đã hoàn tác, quy định như trước.'); });
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
    for (const [pid, c] of Object.entries(S.paid || {})) if ((pid.startsWith('lop-') || pid.startsWith('xin-')) && c.kid === id) del('paid', pid);
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
    const sel = $('#ckind').value, kind = ['fun', 'extra'].includes(sel) ? sel : 'must';
    const pay = kind === 'fun' || sel === 'week' ? 0 : Math.max(0, Math.round(Number($('#cmoney').value) || 0));
    // Việc được thưởng mà tiền 0 sẽ thành Việc phải làm: hỏi lại thay vì tự đổi loại.
    if (sel === 'each' && !pay) { $('#cmoney').focus(); return toast('Nhập số tiền mỗi lần, hoặc chọn Loại việc là Việc phải làm.'); }
    const data = { name, icon: radioVal('cico') || '✅', money: pay, kids, days, order: old ? (old.order ?? 0) : Object.keys(S.chores).length,
      kind, slot: $('#cslot').value || '' };
    // Việc mới chỉ tính từ hôm nay. Việc được thưởng chuyển sang Việc phải làm thì tính từ tuần này.
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
    if (kind !== 'fun' && $('#cunlock').checked) data.unlock = true;
    const place = placeName($('#cplace').value); if (place) data.place = place;
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
  if (a === 'fun-form') return funForm(b.dataset.kid, id, b.dataset.ask);
  if (a === 'fun-ask') {
    const kid = b.dataset.kid, c = id ? funOf(kid).find(x => x.id === id) : null; if (!S.kids[kid] || (id && !c)) return closeModal();
    const name = $('#fname').value.trim(); if (!name) { $('#fname').focus(); return toast('Con thích làm gì? Gõ tên việc nhé.'); }
    const days = $('#fdays').value.split(',').filter(Boolean).map(Number), g = guessIcon(name);
    const old = funAsks(kid).find(y => y.id === b.dataset.ask), keep = old && norm(old.name) === norm(name) ? old.icon : c && norm(c.name) === norm(name) ? c.icon : '';
    const x = { xin: 'fun', kid, name, icon: keep || (g !== '✅' ? g : c?.icon || '🎈'), minutes: Math.max(0, Math.min(600, Math.round(Number($('#fmin').value) || 0))), slot: $('#fslot').value || '', days, at: new Date().toISOString() };
    if (c) { x.chore = c.id; if (c.name === name && !funDiff(x).length) { closeModal(); if (old) del('paid', old.id); return toast('Con chưa đổi gì nên không cần gửi.'); } }
    closeModal(); put('paid', old ? old.id : 'xin-' + uid(), x);
    return toast(c ? 'Đã gửi. Bố mẹ duyệt thì việc này mới đổi nhé.' : 'Đã gửi. Bố mẹ duyệt thì việc này mới có trong lịch của con nhé.');
  }
  if (a === 'fun-cancel') { const x = S.paid[id]; if (!String(id).startsWith('xin-') || !x || !armed(b, 'Chắc chưa?')) return; closeModal(); del('paid', id); return toast('Đã huỷ yêu cầu.'); }
  if (a === 'fun-ok' || a === 'fun-no') {
    const x = funAsks().find(y => y.id === id); if (!x) return;
    const { id: _, ...raw } = x, who = kidName(x.kid);
    if (a === 'fun-no') { del('paid', id); return toast(`Không duyệt “${x.name}” của ${who}.`, () => { put('paid', id, raw); toast('Đã hoàn tác, mục này lại chờ duyệt.'); }); }
    const data = { name: x.name, icon: x.icon || '🎈', slot: x.slot || '', days: x.days };
    if (!x.chore) {
      const cid = uid(); put('chores', cid, { ...data, ...(x.minutes ? { minutes: x.minutes } : {}), money: 0, kind: 'fun', kids: [x.kid], order: Object.keys(S.chores).length, since: key(today()) });
      del('paid', id);
      return toast(`Đã duyệt: thêm việc thích làm “${x.name}” cho ${who}.`, () => { del('chores', cid); put('paid', id, raw); toast('Đã hoàn tác, mục này lại chờ duyệt.'); });
    }
    // Sửa việc đang có. Đổi buổi thì bỏ giờ cũ (có giờ thì việc tự xếp theo giờ). Việc giao cho nhiều con: chỉ đổi cho con xin sửa,
    // các con khác giữ việc cũ, nên tách thành một việc riêng của con này.
    const c = S.chores[x.chore], { minutes, time, by, ...rest } = c, moved = choreSlot(c) !== (x.slot || '');
    const next = { ...rest, ...(moved || !time ? {} : { time, ...(by ? { by } : {}) }), ...data, ...(x.minutes ? { minutes: x.minutes } : {}) };
    const others = (c.kids || []).filter(y => y !== x.kid && S.kids[y]), nid = uid();
    if (others.length) { put('chores', x.chore, { ...c, kids: others }); put('chores', nid, { ...next, kids: [x.kid], order: Object.keys(S.chores).length }); }
    else put('chores', x.chore, { ...next, kids: [x.kid] });
    del('paid', id);
    return toast(`Đã duyệt: sửa việc thích làm “${x.name}” cho ${who}.`, () => { put('chores', x.chore, c); if (others.length) del('chores', nid); put('paid', id, raw); toast('Đã hoàn tác, mục này lại chờ duyệt.'); });
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
  // Bài tập buổi trước: chọn Thiếu thì hiện mức thiếu.
  if (e.target.name?.startsWith('chk-')) { const lv = e.target.closest('.hw-chk')?.querySelector('.hw-lv'); if (lv) lv.hidden = e.target.value !== 'thieu'; }
  if (e.target.name === 'akind') { UI.acctKind = e.target.value; render(); }
  if (e.target.name === 'planw') { UI.planNext = e.target.value === '1'; drawSheet(); }
  if (e.target.id === 'day-pick' && e.target.value) { UI.date = parse(e.target.value); render(); }
  if (e.target.id === 'ag-pick' && e.target.value) { UI.agDate = parse(e.target.value); render(); }
  if (e.target.name === 'kmtab') { UI.kmTab = e.target.value; UI.histAll = false; $('#km').scrollTop = 0; render(); }
  if (e.target.name === 'truong') { if ($('#km').hidden) UI.truong = e.target.value; else UI.kmTruong = e.target.value; UI.tkbDay = null; render(); }
  if (e.target.name === 'tview') { UI.taskDone = e.target.value === '1'; UI.histAll = false; render(); }
  if (e.target.id === 'ckind') {
    const kind = e.target.value;
    $('#modal .cmoney-f').hidden = kind === 'fun' || kind === 'week';
    $('#ckind-help').textContent = kindHelp(kind, $('#cname').dataset.wbs);
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
  if (e.target.id === 'att-file' && e.target.files.length) attAdd(e.target.files);
  if (e.target.id === 'sub-file' && e.target.files.length) subAdd(e.target.dataset.tid, e.target.files);
  if (e.target.id === 'kphoto' && e.target.files[0]) photoLoad(e.target.files[0]);
  if (e.target.name === 'kava' && !photoEdit.img && !(photoEdit.out ?? photoOf(S.kids[$('#modal [data-act=kid-save]')?.dataset.id]))) { const pv = $('#modal .photo-prev'); if (pv) pv.innerHTML = avInner(e.target.value); }
});
document.addEventListener('input', e => {
  if (e.target.classList?.contains('ft-long') || e.target.classList?.contains('grow')) growTitle(e.target);
  if (e.target.id === 'shdue') e.target.dataset.touched = '1';
  if (['pzoom', 'px', 'py'].includes(e.target.id)) photoRender();
  // Form buổi học: tên buổi đổi theo ngày học đang chọn.
  if (e.target.id === 'sdate' && $('#stitle')) {
    const sid = $('#modal [data-act="sess-save"]')?.dataset.id || '', old = soOf(TEACH).sessions[sid];
    if (!old?.topic) $('#stitle').textContent = sessDayTitle(e.target.value);
    // Hạn nộp mặc định đi theo ngày học (buổi học tới sau ngày đó), trừ khi cô đã tự chọn hạn khác.
    const hd = $('#shdue'); if (hd && !hd.dataset.touched) { const x = hwDueAfter(soOf(TEACH), e.target.value); hd.value = x ? key(x) : ''; }
    // Buổi mới: đổi ngày thì thời lượng và hình thức đổi theo thứ của ngày đó (cô Thảo: thứ 3 60 phút, chủ nhật 120 phút).
    if (!old && e.target.value) { const def = sessDefaults(soOf(TEACH), e.target.value), m = $('#smins'), r = document.querySelector(`#modal input[name="smode"][value="${def.mode}"]`); if (m) m.value = def.mins; if (r && def.sure) r.checked = true; }
  }
  // Việc mới: biểu tượng tự đổi theo tên đang gõ, cho tới khi bố mẹ tự chọn một hình.
  if (e.target.id === 'cname' && e.target.dataset.new) {
    const g = guessIcon(e.target.value), r = g !== '✅' && [...document.querySelectorAll('#modal input[name=cico]')].find(x => x.value === g);
    if (r && !r.checked) { r.checked = true; $('#modal .ico-now').innerHTML = icon(g); }
  }
});
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

// ---------- boot ----------
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
