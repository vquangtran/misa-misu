// Màn Học tập: bốn tab Sắp tới, Bài tập, Ở trường (thời khoá biểu, mốc năm học), Học thêm (lịch học thêm, đưa đón).
import { $, addDays, CHEV, daysTo, dm, dmy, dueLabel, durTxt, esc, hm, key, NEXT, norm, nowMin, parse, PLUS, PREV, printHtml, today, toMin, WD, WDN,
  WDS, WEEK_ORDER, weekStart } from './chung.js';
import { SAMPLE_PERIODS, SAMPLE_TKBS, SAMPLE_YEAR } from './nha-minh.js';
import { eventsList, eventsOf, holidayOn, kidName, kidsList, lessonMin, lessonsList, lessonsOf, lessonsOn, memoize, nextSchool, placeLow, placeName,
  placeNames, RO, S, schoolDay, schoolOn, stayInfo, stayLine, tkbDays, tkbOf, UI } from './du-lieu.js';
import { addBtn, ava, barCount, blankAdd, editBtn, kidChip, kidTabs, lessonIcon, mini, noKids, pillBar, plusBtn, secHead, secIsOpen, subjDot, subjTint,
  suggest } from './giao-dien.js';
import { formFoot, frow, kidRow, openModal, pillSel, radioVal, titleCard, toggle } from './form.js';
import { classesList, classesSection, classTasks, hwState, linkList, soPage } from './so-hoc.js';

// ---------- thời khoá biểu có sẵn ----------
// Môn học gợi ý khi nhập thời khoá biểu (tiểu học và THCS).
const SUBJECTS = ['Toán', 'Tiếng Việt', 'Ngữ văn', 'Tiếng Anh', 'Khoa học', 'KHTN', 'Lịch sử và Địa lí', 'Đạo đức', 'GDCD', 'Âm nhạc', 'Mĩ thuật',
  'Tin học', 'Công nghệ', 'Giáo dục thể chất', 'Bơi', 'Hoạt động trải nghiệm', 'Sinh hoạt dưới cờ', 'Sinh hoạt lớp', 'Tự học'];
// Thời khoá biểu có sẵn của con này (theo tên), không có thì null.
export const tkbOffer = k => (k && SAMPLE_TKBS.find(sp => sp.kids.includes(String(k.name || '').trim().toLowerCase()))) || null;
export const sampleTkb = sp => sp ? { cls: sp.cls, year: sp.year, days: [...sp.days], lunch: sp.lunch,
  rows: sp.times.map(([s, e], i) => ({ s, e, d: Object.fromEntries(sp.days.map((d, j) => [d, sp.subj[i][j]])) })) } : undefined;
export const sampleLabel = sp => `${sp.cls} · ${sp.year}`;
// Giờ và môn của từng tiết, để biết bản đang nhập đã giống thời khoá biểu có sẵn chưa.
const tkbSig = t => JSON.stringify((t.rows || []).map(r => [r.s, r.e, ...tkbDays(t).map(d => String((r.d || {})[d] || '').trim())]));

// ---------- mốc năm học ----------
// events: { name, icon, kind: exam|holiday|meeting|event, from: "YYYY-MM-DD", to: "YYYY-MM-DD" (không bắt buộc), kids: [] = cả nhà }
export const EVENT_KINDS = [['exam', 'Kiểm tra', '📝'], ['holiday', 'Nghỉ học', '🏖️'], ['meeting', 'Họp phụ huynh', '👪'], ['event', 'Sự kiện', '🎉']];
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
export const eventLines = (k, cls = 'event-line', own = false) => eventsSoon(k.id).filter(e => !own || (e.kids || []).length).map(e => eventLine(e, cls, k.id)).join('');
export function missingYear() {
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
export const EVENT_HELP = { exam: 'App nhắc trước 14 ngày', holiday: 'Những ngày này app không báo giờ ở trường và soạn cặp', meeting: 'App nhắc trước 7 ngày', event: 'App nhắc trước 7 ngày' };
export function eventForm(id, kidPre) {
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
export function yearForm() {
  const kids = kidsList(), miss = missingYear();
  const pre = kids.filter(k => /(^|\D)4(\D|$)/.test(tkbOf(k.id)?.cls || '')).map(k => k.id);
  openModal(`<h2>Mốc ${SAMPLE_YEAR.label}</h2>
  <p class="muted small lead">Khung thời gian năm học khối 4 theo hướng dẫn của Bộ GD&ĐT và Sở GD&ĐT Hà Nội: ${miss.length} mốc, từ ngày tập trung đến bế giảng. Thêm xong sửa lại tuỳ ý.</p>
  ${kids.length > 1 ? `<div class="fg">${kidRow('Cho con nào', 'ykid', 'checkbox', pre, 'Không chọn ai thì là mốc chung của cả nhà')}</div>` : ''}
  <div class="fg"><div class="list">${miss.map(e => `<div class="item"><span class="ico">${e.icon}</span><div class="txt"><div class="t">${esc(e.name)}</div><div class="s num">${esc(eventRange({ ...e, to: e.to || e.from }))}</div></div></div>`).join('')}</div></div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="year-add">Thêm ${miss.length} mốc</button></div>`);
}

// ---------- thời khoá biểu: một ngày, cả tuần, bản in ----------
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

// ---------- học thêm: đi lại, đưa đón ----------
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
export const placeTxt = l => l.home === true ? `🏠 ${esc(placeName(l.at) || 'Ở nhà')}` : l.home === false
  ? `${l.at ? '📍 ' + esc(placeName(l.at)) + ' · ' : ''}${l.go ? whoIcon(l.go) + ' Đi: ' + esc(l.go) : '⚠️ Chưa có người đưa'} · ${l.back ? 'Về: ' + esc(l.back) : '⚠️ chưa có người đón'}` : (l.at ? '📍 ' + esc(placeName(l.at)) : '');
// Các buổi học thêm trong ngày, dạng viên có giờ và đi lại.
const lessonChips = list => list.map(l => `<span class="sj-chip sj${subjTint(l.name)}">${lessonIcon(l.name)} ${esc(l.s)} ${esc(l.name)}${l.home === true ? ` · ${esc(l.at ? placeLow(l.at) : 'ở nhà')}` : l.home === false && l.go ? ` · ${whoIcon(l.go)} ${esc(/^tự/i.test(l.go) ? 'tự đi' : isRide(l.go) ? 'đi ' + l.go : l.go + ' đưa')}` : ''}</span>`).join('');

// ---------- màn Học tập: bốn tab ----------
// Bốn tab, chia theo nguồn: Sắp tới (lịch gộp theo ngày), Bài tập, Ở trường (thời khoá biểu và mốc năm học), Học thêm (lịch, đưa đón, sổ học của cô, học phí).
const LEARN_TABS = [['sap-toi', 'Sắp tới'], ['bai-tap', 'Bài tập'], ['truong', 'Ở trường'], ['hoc-them', 'Học thêm']];
// Mở một tab của Học tập. Link cũ trỏ tới Thời khoá biểu hay Mốc năm học thì mở tab Ở trường, đúng phần đó. kid: màn của con (nhớ tab riêng).
export function setLearn(v, kid) {
  const part = v === 'tkb' || v === 'moc' ? v : '', tab = part ? 'truong' : v;
  if (kid) { UI.kmLearn = tab; if (part) UI.kmTruong = part; } else { UI.learn = tab; if (part) UI.truong = part; }
}
export function viewSchedule() {
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
export function learnPage(ks, all) {
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
export const tasksList = () => memoize('tasks', () => [...Object.entries(S.tasks || {}).map(([id, t]) => ({ id, ...t, steps: Array.isArray(t.steps) ? t.steps : [] }))
  .filter(t => S.kids[t.kid]), ...classTasks()].sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || String(a.title).localeCompare(String(b.title), 'vi')));
export const taskOf = id => tasksList().find(t => t.id === id);
export const openTasks = kidId => tasksList().filter(t => !t.done && (!kidId || t.kid === kidId));
// Bài cần nhắc ở màn Hôm nay: quá hạn, hạn hôm nay hoặc ngày mai.
export const tasksSoon = kidId => openTasks(kidId).filter(t => t.due && daysTo(t.due) <= 1);
// Ngày học tới có môn này: theo thời khoá biểu ở trường (bỏ qua ngày nghỉ), hoặc buổi học thêm cùng tên.
export function nextSubjectDay(kidId, subj, from = today()) {
  if (!subj || (!tkbOf(kidId) && !lessonsOf(kidId).length)) return null;
  for (let i = 1; i <= 31; i++) {
    const x = addDays(from, i), info = schoolOn(kidId, x);
    if ((info && info.subjects.some(s => norm(s) === norm(subj))) || lessonsOn(kidId, x.getDay()).some(l => norm(l.name) === norm(subj))) return x;
  }
  return null;
}
export function taskRow(t, showKid, mode = '') {
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
export function taskForm(id, kidPre, lock) {
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
export function dayAgenda(kidId, d) {
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

// ---------- in thời khoá biểu, form thời khoá biểu và buổi học thêm ----------
export function printTkb(kidId) {
  const k = S.kids[kidId], t = tkbOf(kidId); if (!k || !t) return;
  const st = tkbStats(t);
  printHtml(`<h1 style="font-family:var(--display);margin:0;text-align:center;font-size:34px">Thời khoá biểu</h1>
    <div style="text-align:center;font-size:18px;margin-bottom:12px">${mini(k)} ${esc(k.name)}${t.cls ? ' · ' + esc(t.cls) : ''}${t.year ? ' · Năm học ' + esc(t.year) : ''}</div>
    ${tkbTable(t)}
    ${st.periods ? `<div style="margin-top:10px;font-size:13px">Mỗi tuần ${st.periods} tiết, ngồi trong lớp ${durTxt(st.inClass)}, ở trường ${durTxt(st.atSchool)}.</div>` : ''}
    ${lessonsOf(kidId).length ? `<h2 style="font-family:var(--display);margin:14px 0 6px;font-size:20px">Học thêm</h2><div class="print-lessons">${WEEK_ORDER.filter(d => lessonsOn(kidId, d).length).map(d => `<div><b>${WDN(d)}</b>${lessonsOn(kidId, d).map(l => `<div>${lessonIcon(l.name)} ${esc(l.s)} – ${esc(l.e)} ${esc(l.name)}</div>`).join('')}</div>`).join('')}</div>` : ''}`, 'landscape');
}
// Bản nháp đang sửa, để thêm/bớt tiết hay bật Thứ Bảy không làm mất chữ đã gõ.
export let tkbDraft = null;
export function tkbForm(kidId, draft) {
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
export function readTkbForm() {
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
export function lessonForm(id, kidPre) {
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
