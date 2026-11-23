// Màn Hôm nay: các buổi trong ngày của từng con, đóng dấu việc, thêm việc nhanh, xem cả tuần, in kế hoạch tuần.
import { $, addDays, CHEV, confetti, DAILY, dateTxt, daysLabel, daysTo, dm, dmy, DOTS, DOWN, esc, hm, key, money, NEXT, nowMin, parse, PLUS, PREV,
  printHtml, STAR, toast, today, toMin, WD, WDN, WDS, weekStart } from './chung.js';
import { ageOf, choresFor, choresList, choreSlot, choreVnd, claimers, claimVal, clearMemo, dayBonusAt, dayBonusIn, dayBonusOf, deviceRole, doneVal,
  doneVnd, earned, isBirthday, isDaily, isDone, isExtra, isFun, isMust, isWeekly, kidName, kidSince, kidsList, lessonsAt, mustFor, nextSchool, onDay,
  perWeekOf, placeLow, placeName, prepFor, readLogOf, lastReadLog, reqIn, RO, S, schoolOn, setDone, skipEntry, skipOn, slotAt, SLOTS, stayInfo, stayLine, stepMask, stepsAll,
  stepsOf, streakOf, takenBy, tkbOf, todayKid, UI, variantOf, weekBonusAt, weekBonusOf, weekCount, weekStats } from './du-lieu.js';
import { ava, barCount, kidTabs, lessonIcon, mini, moneyChip, moreBtn, noKids, pillBar, secHead, secIsOpen, tintOf } from './giao-dien.js';
import { frow, menuRow, menuSheet, openModal, pillNum } from './form.js';
import { dayAgenda, eventLines, placeTxt, taskRow, tasksList, tasksSoon } from './hoc-tap.js';
import { classesOf, classTitle, CLS, feeOf, paidOf, sessList, soFees, soMissing, soOf, soStats } from './so-hoc.js';
import { coins, coinUnit, goalProgress, pendingCard } from './tai-khoan.js';
import { SAMPLE_CHORES } from './quy-dinh.js';
import { kidForm } from './gia-dinh.js';

// ---------- chuỗi ngày, sinh nhật, giờ ở trường ----------
const streakChip = k => { const n = streakOf(k.id); return n ? `<span class="streak" title="Số ngày liên tiếp làm đủ việc phải làm">🔥 ${n} ngày liên tiếp</span>` : ''; };
const bdayChip = (k, d) => isBirthday(k, d) ? `<span class="streak">🎂 Sinh nhật ${ageOf(k, d)} tuổi</span>` : '';

// Dòng ngắn "hôm nay ở trường" cho màn Hôm nay và chế độ cho bé.
export function schoolNow(k, d, isToday) {
  const t = tkbOf(k.id); if (!t) return null;
  const info = schoolOn(k.id, d);
  if (info && !(isToday && nowMin() >= toMin(info.end))) return { title: `Ở trường ${info.start} – ${info.end}`, subjects: info.subjects };
  if (!isToday) return null;
  const nx = nextSchool(t, d, k.id);
  return nx ? { title: `Soạn cặp cho ${nx.label === 'Ngày mai' ? 'ngày mai' : nx.label}`, subjects: nx.info.subjects, bag: true } : null;
}

// ---------- các buổi trong ngày ----------
// Buổi nào mở sẵn ở màn Hôm nay. Xem hôm nay (cur = buổi đang diễn ra): chỉ mở buổi đó, các buổi khác thu gọn còn nhãn và số việc;
// "Lúc nào cũng được" mở khi còn việc chưa xong hoặc có việc thích làm; việc làm thêm mở khi đã có làm.
// Xem ngày khác (cur = null) thì mở những buổi còn việc chưa xong. Bấm nhãn để mở, đóng; lựa chọn đó giữ tới khi sang buổi khác.
export const slotOpenDefault = (g, cur, full, nd, hasFun) => g.extra ? nd > 0 : cur && g.id ? g.id === cur : !full || hasFun;
// Buổi đã qua trong hôm nay mà còn việc phải làm chưa xong: vẫn thu gọn, nhưng số việc trên nhãn tô đỏ để nhắc.
export const slotMissed = (g, cur, full, n) => !!cur && !g.extra && !!g.id && n > 0 && !full && SLOTS.findIndex(x => x[0] === g.id) < SLOTS.findIndex(x => x[0] === cur);
// Trong mỗi buổi, việc chia thành từng nhóm riêng, theo thứ tự: mốc giờ (vào học, tan học, học thêm), việc quan trọng,
// việc phải làm (bắt buộc, tính vào tiến độ ngày và thưởng làm đủ việc), việc được thưởng (không bắt buộc, làm lần nào cộng tiền lần đó), việc thích làm.
const SECS = ['mark', 'imp', 'must', 'paid', 'fun'];
export const SEC_LABEL = { imp: 'Việc quan trọng', must: 'Việc phải làm', paid: 'Việc được thưởng', fun: 'Việc thích làm' };
// Việc đã xong với con này: con đã làm, hoặc việc "ai làm trước thì tính" đã có con khác làm.
const choreOk = (c, kidId, d) => isDone(d, kidId, c.id) || takenBy(c, kidId, d).length > 0;
// Tiêu đề nhỏ của một nhóm trong buổi, kèm số việc đã xong.
export function subHead(sec, items, kidId, d) {
  const n = items.filter(x => choreOk(x.c, kidId, d)).length, full = n === items.length;
  return `<div class="sub-h ${sec}">${SEC_LABEL[sec]}${sec === 'fun' ? '' : `<i class="num ${full ? 'full' : ''}">${full ? '✓ ' : ''}${n}/${items.length}</i>`}</div>`;
}
// Các nhóm của một buổi: [{ sec, items }], bỏ nhóm trống. Việc làm thêm không chia nhóm.
export const slotSecs = g => g.extra ? [{ sec: 'extra', items: g.items }] : SECS.map(sec => ({ sec, items: g.items.filter(x => x.sec === sec) })).filter(x => x.items.length);
// Con số trên nhãn của một buổi: chỉ đếm việc phải làm, việc được thưởng không bắt buộc nên không tính vào.
// Buổi chỉ có việc được thưởng (và nhóm Việc làm thêm) thì ghi số việc, đã làm mấy việc thì ghi thêm ở trước.
export function slotCount(g, kidId, d) {
  const ch = g.items.filter(x => x.type === 'chore' && !isFun(x.c)), ok = x => choreOk(x.c, kidId, d);
  const mine = ch.filter(x => x.req), nd = mine.filter(ok).length, full = mine.length > 0 && nd === mine.length;
  const opt = ch.filter(x => !x.req), no = opt.filter(ok).length;
  return { n: mine.length, full, nd: g.extra ? no : nd, cnt: mine.length ? `${full ? '✓ ' : ''}${nd}/${mine.length}` : opt.length ? `${no ? `${no}/` : ''}${opt.length}` : '' };
}
// Ghép việc nhà, giờ ở trường và học thêm của một con trong ngày d, chia theo buổi.
export function dayPlan(kidId, d) {
  const all = choresFor(kidId, d), extras = all.filter(isExtra);
  const wk = key(weekStart(d));
  const items = all.filter(c => !isExtra(c)).map(c => { const req = reqIn(c, kidId, wk); return { type: 'chore', c, t: toMin(c.time), slot: choreSlot(c), req, sec: isFun(c) ? 'fun' : c.imp ? 'imp' : req ? 'must' : 'paid' }; });
  const t = tkbOf(kidId), info = t && schoolOn(kidId, d);
  if (info) {
    items.push({ type: 'mark', t: toMin(info.start), icon: '🏫', text: `Vào học (${info.list.length} tiết)` });
    items.push({ type: 'mark', t: toMin(info.end), icon: '🏫', text: 'Tan học' });
  }
  for (const l of lessonsAt(kidId, d)) items.push({ type: 'lesson', l, t: toMin(l.s) });
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
export const needLine = need => need.length === 1 ? `Xong “${need[0].name}” là được làm` : `Còn ${need.length} việc nữa là được làm`;
// Bấm vào việc thích làm còn khoá: hiện những việc cần làm để mở khoá, việc nào xong rồi thì có dấu ✓.
export function funNeedForm(kidId, cid, dk) {
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
  const l = lessonsAt(kidId, d).find(l => toMin(l.s) <= m && m < toMin(l.e));
  if (l) return `học ${l.name} (${l.s} – ${l.e})`;
  const info = schoolOn(kidId, d);
  return info && toMin(info.start) <= m && m < toMin(info.end) ? `ở trường (${info.start} – ${info.end})` : '';
}
export function choreMeta(c, kidId, d, isToday) {
  const got = c.claim && isDone(d, kidId, c.id) ? doneVnd(S.done[key(d)]?.[kidId]?.[c.id]) : choreVnd(c);
  const p = [isFun(c) || isWeekly(c) ? '' : `<b class="earn">+${money(got)}</b>`].filter(Boolean);
  if (toMin(c.time) !== null) p.push(`${c.by ? 'trước ' : ''}${esc(c.time)}`);
  if (Number(c.minutes)) p.push(`${Number(c.minutes)} phút`);
  if (c.place) p.push(`📍 ${esc(placeName(c.place))}`);
  const n = perWeekOf(c); if (n) p.push(`${weekCount(kidId, c, d)}/${n} lần tuần này`);
  if (c.shared) p.push('👨‍👩‍👧 việc chung');
  if (c.prep === 'school') p.push(`${isToday ? 'mai' : 'hôm sau'} đi học`);
  else if (c.prep) { const ls = lessonsAt(kidId, addDays(d, 1)).map(l => esc(l.name)).filter(Boolean); if (ls.length) p.push(`${isToday ? 'mai' : 'hôm sau'} học ${ls.join(', ')}`); }
  if (c.claim && (c.kids || []).length > 1) {
    const mine = isDone(d, kidId, c.id), others = claimers(c, d).filter(x => x !== kidId).map(kidName).map(esc).join(', ');
    p.push(others ? (mine ? `🙌 làm cùng ${others}${choreVnd(c) ? ', chia đều tiền' : ''}` : `🙋 ${others} đã làm${choreVnd(c) ? ' · làm cùng thì chia đều tiền' : ''}`) : mine ? '' : 'ai làm trước thì tính');
  }
  const v = variantOf(c, kidId, d); if (v) p.push(`hôm nay: <b>${esc(v)}</b>`);
  const r = c.readLog && isDone(d, kidId, c.id) ? readLogOf(d, kidId, c.id) : null; if (r) p.push(`📖 ${esc(r.what)}${Number(r.pages) ? `, ${Number(r.pages)} trang` : ''}`);
  if (isToday && c.by && !isDone(d, kidId, c.id) && toMin(c.time) !== null && nowMin() > toMin(c.time)) p.push('<span class="late">⏰ quá giờ</span>');
  const busy = busyAt(kidId, d, toMin(c.time)); if (busy) p.push(`<span class="late">⚠️ lúc ${esc(c.time)} con đang ${esc(busy)}</span>`);
  return p.filter(Boolean).join(' · ');
}
// Màn Hôm nay của bố mẹ (big = false): bấm vào buổi học thêm là mở form sửa buổi đó. Màn của con chỉ xem.
export const markRow = (x, big) => x.type === 'lesson'
  ? `<div class="${big ? 'big-mark' : 'item mark'}${!big && !RO ? ` edit-row" data-act="lesson-form" data-id="${esc(x.l.id)}` : ''}"><span class="ico">${lessonIcon(x.l.name)}</span><div class="txt"><div class="t"><span class="num">${esc(x.l.s)} – ${esc(x.l.e)}</span> ${esc(x.l.name)}</div>${placeTxt(x.l) ? `<div class="s">${placeTxt(x.l)}</div>` : ''}</div></div>`
  : `<div class="${big ? 'big-mark' : 'item mark'}"><span class="ico">${x.icon}</span><div class="txt"><div class="t"><span class="num">${hm(x.t)}</span> ${esc(x.text)}</div></div></div>`;

// ---------- phiếu nghỉ, xem cả tuần, dải 7 ngày ----------
export const skipNote = (k, d) => { const e = skipEntry(k.id, d); return e ? `<div class="skip-note">🎟️ ${key(d) === key(today()) ? 'Hôm nay' : 'Ngày này'} ${esc(k.name)} dùng phiếu “Một ngày không làm việc nhà”: việc phải làm được miễn, làm thì vẫn được thưởng.</div>` : ''; };
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


// ---------- màn Hôm nay ----------
// Hàng trên cùng của màn Hôm nay: các con (kèm số việc đã xong trong ngày đang xem) bên trái, nút ⋯ và + bên phải.
function todayTop(kids, cur, d) {
  const badge = k => { const l = mustFor(k.id, d), n = l.filter(c => isDone(d, k.id, c.id)).length, full = l.length > 0 && n === l.length; return l.length ? `<i class="num ${full ? 'full' : ''}">${full ? '✓' : `${n}/${l.length}`}</i>` : ''; };
  return `<div class="tbar">${kidTabs(kids, cur?.id, 'today-kid', badge)}${pillBar(moreBtn('today-menu', 'Xem cả tuần, chế độ cho bé, in'), `<button class="add" data-act="quick-add" aria-label="Thêm việc" ${kids.length ? '' : 'disabled'}>${PLUS}</button>`)}</div>`;
}
const SLOT_ASK = { sang: 'Buổi sáng con làm gì?', chieu: 'Buổi chiều có việc gì?', toi: 'Buổi tối làm gì trước khi ngủ?', '': 'Việc làm lúc nào cũng được' };
export function viewToday() {
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
export function todayMenu() {
  const off = !kidsList().length;
  menuSheet('Hôm nay', [menuRow('data-act="today-mode" data-v="week"', '✅', 'Xem cả tuần', 'Mỗi việc một dòng, mỗi ngày một cột', off),
    menuRow('data-act="km-open"', '🙂', 'Chế độ cho bé', 'Chữ và nút to để con tự đánh dấu', off),
    menuRow('data-act="sheet-open"', '🖨️', 'In kế hoạch tuần', 'Mỗi con một trang A4 dán bàn học', off),
    `<a class="item nav" href="#quy-dinh" data-act="close"><span class="ico">✏️</span><span class="txt"><span class="t">Sửa danh sách việc nhà</span><span class="s">Ở trang Quy định: đổi tên, ngày, buổi, tiền thưởng của từng việc</span></span>${CHEV}</a>`]);
}

// ---------- thêm việc nhanh ----------
// Chỉ một ô gõ tên việc và vài lựa chọn bấm để đổi; còn lại lấy mặc định. Muốn chỉnh kỹ thì bấm ⋯ để mở form đầy đủ.
export let QA = null;
export const QA_PAY = [[5000, 'Được thưởng +5.000đ'], [10000, 'Được thưởng +10.000đ'], [0, 'Việc phải làm']];
export const qaReps = () => { const wd = UI.date.getDay(); return [[DAILY, 'Mỗi ngày'], [[1, 2, 3, 4, 5], 'Ngày thường'], [[0, 6], 'Cuối tuần'], [[wd], `${WDN(wd)} hằng tuần`]]; };
export function qaWho() {
  const kids = kidsList(), k = todayKid(kids); if (!k) return [];
  return [[[k.id], k.name], ...(kids.length > 1 ? [[kids.map(x => x.id), 'Cả nhà']] : []), ...kids.filter(x => x.id !== k.id).map(x => [[x.id], x.name])];
}
export function qaChips() {
  const sl = SLOTS.find(x => x[0] === QA.slot) || SLOTS[3], rep = qaReps()[QA.rep], who = qaWho()[QA.who], pay = QA_PAY[QA.pay];
  const chip = (f, ic, txt, cls = '') => `<button class="qa-chip ${cls}" data-act="qa-cycle" data-f="${f}">${ic}<span>${esc(txt)}</span></button>`;
  return chip('slot', sl[2], sl[0] ? sl[1] : 'Lúc nào cũng được', 's-' + (sl[0] || 'any')) + chip('rep', '🔁', rep[1])
    + (qaWho().length > 1 ? chip('who', who[0].length > 1 ? '👪' : mini(S.kids[who[0][0]] ? { id: who[0][0], ...S.kids[who[0][0]] } : {}), who[1]) : '')
    + chip('pay', pay[0] ? '💰' : '⭐', pay[1]) + `<button class="qa-chip more" data-act="qa-more" aria-label="Mở form đầy đủ">${DOTS}</button>`;
}
export function quickAdd(slot) {
  if (!kidsList().length) return kidForm();
  QA = { slot: SLOTS.some(x => x[0] === slot) ? slot : key(UI.date) === key(today()) ? slotAt(nowMin()) : '', rep: 0, who: 0, pay: 0 };
  openModal(`<div class="qa"><div class="qa-row"><input id="qname" class="qa-input" maxlength="40" placeholder="Thêm một việc thôi" autocomplete="off" enterkeyhint="done" aria-label="Tên việc"><button class="qa-go" data-act="qa-save" aria-label="Thêm việc">${PLUS}</button></div>
    <div class="qa-chips" id="qa-chips">${qaChips()}</div></div>`);
  $('#qname').focus();
}
// Các lựa chọn đang có trong ô thêm nhanh, đổi sang dạng dữ liệu của một việc.
export const qaData = () => ({ name: $('#qname')?.value.trim() || '', slot: QA.slot, days: qaReps()[QA.rep][0], kids: qaWho()[QA.who][0], money: QA_PAY[QA.pay][0] });

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
    if (a.hol) p.push(a.lessonsOff ? 'Nghỉ học, nghỉ học thêm' : 'Nghỉ học');
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
export function drawSheet() {
  openModal(`<h2>Kế hoạch tuần</h2><p class="muted small lead">Mỗi con một trang: việc theo buổi sáng, chiều, tối; ô đánh dấu từng ngày; lịch học thêm, kiểm tra, bài phải nộp; mục tiêu tiết kiệm.</p>
  <div class="seg modes"><label><input type="radio" name="planw" value="0" ${UI.planNext ? '' : 'checked'}><span>Tuần này (${dm(weekStart(today()))})</span></label><label><input type="radio" name="planw" value="1" ${UI.planNext ? 'checked' : ''}><span>Tuần sau (${dm(addDays(weekStart(today()), 7))})</span></label></div>
  <div class="wp-preview">${kidsList().map(weekPlan).join('')}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Đóng</button><button class="btn primary" data-act="print">In ${kidsList().length > 1 ? `${kidsList().length} trang` : 'kế hoạch'}</button></div>`, true, true);
}
export function printSheet() { printHtml(`<div class="wp-print">${kidsList().map(weekPlan).join('')}</div>`); }


// ---------- đánh dấu việc, màn chúc mừng ----------
// Đánh dấu / bỏ dấu một việc. Việc chung thì tính cho mọi con được giao việc đó trong ngày.
// Việc ai làm trước thì tính: chỉ tính cho con vừa đánh dấu; có con khác cũng đã làm thì chia đều tiền cho những con đã làm.
// Xong việc phải làm cuối cùng của buổi thì báo mở khoá việc thích làm.
export function markChore(d, kid, cid, on) {
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
    if (!on && readLogOf(d, x, cid)) setDone(key(d), x, cid + '~r', 0);
  }
  if (msg) toast(msg);
}
// Việc đọc sách (readLog): bấm xong thì hỏi đã đọc gì, bao nhiêu trang; bấm Xong (read-save ở thao-tac.js) mới đánh dấu việc.
// Tên sách điền sẵn theo lần ghi trước, vì con hay đọc tiếp một cuốn.
export function readForm(d, kid, cid) {
  const ch = S.chores[cid]; if (!ch) return;
  const last = lastReadLog(kid, cid), con = UI.km?.on || deviceRole() !== 'parent' ? 'Con' : esc(kidName(kid));
  openModal(`<h2>${esc(ch.icon || '📚')} ${esc(ch.name)}</h2><p class="muted small lead">${con} đọc gì, bao nhiêu trang? Ghi xong bấm Xong thì việc mới được tính.</p>
  <div class="fg">${frow('Đọc gì', `<input id="rwhat" class="input" maxlength="60" value="${esc(last?.what || '')}" placeholder="Ví dụ: Dế Mèn phiêu lưu ký, báo Nhi Đồng" autocomplete="off">`, { id: 'rwhat', cls: 'col', sub: 'Tên sách, truyện hay báo' })}
    ${frow('Bao nhiêu trang', pillNum('rpages', '', { step: 1, unit: 'trang', attr: 'min="1" max="999" step="1"', ph: '0' }), { id: 'rpages' })}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="read-save" data-kid="${esc(kid)}" data-chore="${esc(cid)}" data-d="${key(d)}">Xong</button></div>`);
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
