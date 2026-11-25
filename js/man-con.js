// Màn của con: máy của con (nhà có mã PIN) và Chế độ cho bé dùng chung màn này, với ba tab Hôm nay, Học tập, Tài khoản.
import { $, addDays, CHEV, dm, DOWN, durTxt, esc, key, money, norm, nowMin, PLUS, PREV, signed, STAR, today, WD, weekStart } from './chung.js';
import { againVnd, balance, dayBonusAt, dayBonuses, dayFull, deviceRole, FEE_DAY_MAX, FEE_MIN, FEE_UNIT, isBirthday, isDaily, isDone, isFun, kidsList,
  ledgerVnd, mustFor, placeLow, pricesList, priceVnd, S, setRO, shortPlace, slotAt, stayNow, stepMask, stepsShow, streakOf, UI, weekBonusOf, weekStats } from './du-lieu.js';
import { ava, barCount, loading, moneyChip, secHead, secIsOpen, subjChips, tintOf } from './giao-dien.js';
import { eventLines, learnPage, openTasks, studyRow, studySoon, taskRow, tasksSoon } from './hoc-tap.js';
import { choreMeta, dayPlan, markRow, needLine, stepOff, schoolNow, SEC_LABEL, skipNote, slotCount, slotMissed, slotOpenDefault, slotSecs, subHead } from './hom-nay.js';
import { acctStats, buyLeft, buyList, buyName, buyWhen, coins, funSection, goalProgress, goalsCard, histSection, pendingList } from './tai-khoan.js';
import { HW_PENALTY, meritList } from './quy-dinh.js';

// ---------- thành tích, tin mới, bảng phạt, tài khoản của con ----------
// Thành tích học tập trên màn của con: những mục con đã báo đang chờ duyệt, và nút + để báo mục mới.
function meritSection(k) {
  const pend = pendingList(k.id);
  return meritList().length ? `<section class="slot tn3">${secHead('🏅', 'Thành tích học tập', { cnt: pend.length || '' })}
    ${pend.length ? `<div class="slot-list list">${pend.map(l => `<div class="item pend"><span class="ico">${esc(l.icon || '🏅')}</span><div class="txt"><div class="t">${esc(l.note || 'Thành tích')}</div><div class="s">⏳ Chờ bố duyệt · ${dm(new Date(l.at))}</div></div>
      <div class="acts col"><span class="delta num wait">+${money(l.ask)}</span><button class="linkbtn undo" data-act="merit-cancel" data-id="${l.id}">Huỷ</button></div></div>`).join('')}</div>` : ''}
    <button class="slot-blank" data-act="merit-open" data-kid="${k.id}"><span>Được cô khen, được điểm 9, điểm 10 ở trường hay ở lớp học thêm? Bấm để báo bố</span>${PLUS}</button>
    <p class="foot-note km-merits">${meritList().map(r => `${esc(r.icon || '🏅')} ${esc(r.name)} <b class="num plus">+${money(priceVnd(r))}</b>`).join(' · ')}</p></section>` : '';
}
// Tin mới trên tab Hôm nay của con: hôm nay, hôm qua bị trừ tiền vì gì (phạt, phí sử dụng bố mẹ ghi; thời gian con tự mua thì báo đang chờ bố thêm hay bố đã thêm) và thành tích nào bố vừa duyệt. Bấm để sang tab Tài khoản.
function kmNews(k, t) {
  const tk = key(t), yk = key(addDays(t, -1)), day = iso => { const dk = iso ? key(new Date(iso)) : ''; return dk === tk ? 'Hôm nay' : dk === yk ? 'Hôm qua' : ''; };
  const mine = Object.values(S.ledger).filter(l => l.kid === k.id && !l.pending).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const cuts = mine.filter(l => ['penalty', 'fee'].includes(l.kind) && !l.by && ledgerVnd(l) < 0 && day(l.at)), oks = mine.filter(l => day(l.okAt) && ledgerVnd(l) > 0);
  const card = (cls, title, list, when) => list.length ? `<button class="km-news ${cls}" data-act="km-acct"><b>${title}</b>${list.map(l => `<span>${day(when(l))} · ${esc(l.note || '')} <i class="num">${signed(ledgerVnd(l))}</i></span>`).join('')}${CHEV}</button>` : '';
  // Thời gian con tự mua: đang chờ bố thêm, hoặc hôm nay bố đã thêm.
  const buys = buyList(k.id), wait = buys.filter(l => !l.added), added = buys.filter(l => l.added && key(new Date(l.added)) === tk);
  const buyNews = (cls, title, list, line) => list.length ? `<button class="km-news ${cls}" data-act="km-acct"><b>${title}</b>${list.map(l => `<span>${esc(buyName(l))} · ${line(l)}</span>`).join('')}${CHEV}</button>` : '';
  return buyNews('ok', '✅ Bố đã thêm thời gian', added, l => esc(buyWhen(l.added))) + buyNews('', '⏳ Chờ bố thêm thời gian', wait, l => `mua ${esc(buyWhen(l.at))}`)
    + card('cut', `⚠️ Con bị trừ ${money(-cuts.reduce((a, l) => a + ledgerVnd(l), 0))}`, cuts, l => l.at) + card('ok', `🏅 Bố đã duyệt, con được cộng ${money(oks.reduce((a, l) => a + ledgerVnd(l), 0))}`, oks, l => l.okAt);
}
// Thưởng phạt cho con xem (lấy từ trang Quy định của bố mẹ): thành tích nào được cộng bao nhiêu, lỗi nào bị trừ bao nhiêu, phiếu thưởng nào đổi được bằng bao nhiêu tiền.
function kidRules() {
  const row = (r, ic, tag, cls, sub) => `<div class="item"><span class="ico">${esc(r.icon || ic)}</span><div class="txt"><div class="t">${esc(r.name)}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div><div class="acts"><span class="delta num ${cls}">${tag}</span></div></div>`;
  const ms = meritList(), ps = pricesList('penalty'), gs = pricesList('gift'), n = ms.length + ps.length + gs.length;
  if (!n) return '';
  const part = (label, list, html, note) => list.length ? `${secHead('', label, { cnt: list.length, sub: true })}<div class="slot-list list">${list.map(html).join('')}</div>${note ? `<p class="foot-note" style="margin:0 6px">${note}</p>` : ''}` : '';
  return `<section class="slot">${secHead('⚖️', 'Thưởng phạt', { cnt: n, key: 'kr-pen' })}${secIsOpen('kr-pen') ? part('Thành tích được thưởng', ms, r => row(r, '🏅', '+' + money(priceVnd(r)), 'plus'), 'Được khen, được điểm tốt thì con bấm Báo thành tích để báo bố. Bố duyệt xong là được cộng tiền.')
    + part('Lỗi bị phạt', ps, r => row(r, '⚠️', r.all ? 'Mất hết tiền' : r.week ? 'Mất thưởng tuần' : '−' + money(priceVnd(r)), 'minus',
      r.all ? 'Trừ hết số tiền con đang có' : r.week ? 'Mất tiền việc nhà và tiền thưởng từ Thứ Hai tới lúc bị phạt' : againVnd(r) ? `Từ lần 2 trong tuần: <b class="num minus">−${money(againVnd(r))}</b>` : ''), 'Mỗi lần mắc lỗi là bị trừ một lần.')
    + part('Phiếu thưởng', gs, r => row(r, '🎁', priceVnd(r) ? money(priceVnd(r)) : 'miễn phí', '', r.note ? esc(r.note) : ''), 'Con dùng tiền của mình để đổi. Muốn đổi thì nhờ bố.') : ''}</section>`;
}
// Tab Hôm nay của con: dưới Bài cần nộp nhắc mức phạt Thiếu BTVN; trong Thành tích học tập ghi mỗi thành tích được thưởng bao nhiêu.
const hwPenalty = () => pricesList('penalty').find(r => r.id === HW_PENALTY[0] || norm(r.name) === norm(HW_PENALTY[1].name));
function hwPenNote() {
  const r = hwPenalty(); if (!r || r.all || r.week) return '';
  return `<p class="foot-note km-pen">⚠️ ${esc(r.name)} bị trừ <b class="num minus">${money(priceVnd(r))}</b>${againVnd(r) ? `, từ lần 2 trong tuần trừ <b class="num minus">${money(againVnd(r))}</b>` : ''}.</p>`;
}
// Mua thời gian: các mục Phí sử dụng (xem TV, chơi game, điện thoại) kèm giá mỗi 30 phút, mỗi mục một nút Mua (buyForm trong tai-khoan.js).
// Mỗi mục mỗi ngày mua tối đa 1 giờ: đủ rồi thì hết nút Mua. Bên dưới là các lần mua hôm nay và lần nào bố chưa thêm thời gian:
// đang chờ bố thêm, hay bố đã thêm.
function kidBuy(k) {
  const fs = pricesList('fee'); if (!fs.length) return '';
  const tk = key(today()), mine = buyList(k.id).filter(l => !l.added || key(new Date(l.at)) === tk);
  return `<section class="slot tn2">${secHead('📱', 'Mua thời gian', { cnt: fs.length })}<div class="slot-list list">${fs.map(r => { const left = buyLeft(k.id, r.id), had = FEE_DAY_MAX - left;
    return `<div class="item"><span class="ico">${esc(r.icon || '📱')}</span><div class="txt"><div class="t">${esc(r.name)}</div><div class="s"><b class="num minus">${money(priceVnd(r))}${FEE_UNIT}</b>${had ? ` · hôm nay đã mua ${durTxt(had)}` : ''}</div></div>
    <div class="acts">${left >= FEE_MIN ? `<button class="btn primary sm" data-act="buy-form" data-id="${r.id}" data-kid="${k.id}" aria-label="Mua ${esc(r.name)}">Mua</button>` : `<span class="badge">Đủ ${durTxt(FEE_DAY_MAX)} hôm nay</span>`}</div></div>`; }).join('')}</div>
    ${mine.length ? `${secHead('', 'Con đã mua', { cnt: mine.length, sub: true })}<div class="slot-list list">${mine.map(l => `<div class="item ${l.added ? '' : 'pend'}"><span class="ico">${esc(l.icon || '📱')}</span><div class="txt"><div class="t">${esc(buyName(l))}</div><div class="s">${l.added ? `✅ Bố đã thêm ${esc(buyWhen(l.added))}` : `⏳ Chờ bố thêm thời gian · mua ${esc(buyWhen(l.at))}`}</div></div>
      <div class="acts"><span class="delta num minus">${signed(ledgerVnd(l))}</span></div></div>`).join('')}</div>` : ''}
    <p class="foot-note" style="margin:0 6px">Con dùng tiền của mình để mua. Mỗi mục mỗi ngày mua tối đa ${durTxt(FEE_DAY_MAX)}. Mua xong con gửi yêu cầu thêm thời gian và nhắn bố thêm.</p></section>`;
}
// Tab Tài khoản của con: đang có bao nhiêu, mua thời gian (con tự mua), thưởng phạt, mục tiêu tiết kiệm và toàn bộ lịch sử cộng trừ (kể cả các lần bị phạt).
function kidAcct(k) {
  return `<div class="day-head"><h1>Tài khoản</h1></div>${acctStats(k)}<div class="slots">${kidBuy(k)}${kidRules()}${meritSection(k)}${goalsCard(k.id)}${histSection(k.id)}</div>`;
}

// ---------- màn của con: ba tab ----------
export function drawKidMode() {
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
  // Ba tab của con: việc hôm nay, Học tập (Trên lớp, Học thêm, Thi) và Tài khoản (số dư, lịch sử cộng trừ). Hai tab sau là của riêng con, chỉ xem.
  const tab = ['learn', 'acct'].includes(UI.kmTab) ? UI.kmTab : 'today';
  const top = `<div class="km-top">${kids.length > 1 && !lock ? `<button class="linkbtn back" data-act="km-kid" data-kid="">${PREV}Đổi bạn</button>` : '<span></span>'}${hold}</div>
  <div class="seg modes km-tabs" role="tablist" aria-label="Chọn màn">${[['today', '☀️ Hôm nay'], ['learn', '📚 Học tập'], ['acct', '💰 Tài khoản']].map(([v, l]) => `<label><input type="radio" name="kmtab" value="${v}" ${v === tab ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  el.classList.toggle('plain', tab !== 'today');
  if (tab !== 'today') {
    // Tab Học tập của con nhớ tab riêng (UI.kmLearn), mở ở Trên lớp › Bài tập, không theo tab bố mẹ xem lần cuối trên cùng máy.
    const parent = [UI.learn, UI.truong]; setRO(true); UI.learn = UI.kmLearn || 'tren-lop'; UI.truong = UI.kmTruong || 'bai';
    try { el.innerHTML = `<div class="wrap">${top}${tab === 'learn' ? learnPage([k], false) : kidAcct(k)}</div>`; } finally { setRO(false); [UI.learn, UI.truong] = parent; }
    return;
  }
  const list = mustFor(k.id, t), n = list.filter(c => isDone(t, k.id, c.id)).length, plan = dayPlan(k.id, t), cur = slotAt(nowMin());
  const sc = schoolNow(k, t, true);
  const kst = stayNow(t.getDay());
  const kts = tasksSoon(k.id), study = studySoon(k.id), g1 = goalProgress(k.id)[0];
  const goal = g1 ? `<div class="km-goal"><div class="t">${esc(g1.icon || '🎁')} Con đang để dành mua <b>${esc(g1.name)}</b></div>${coins(g1, true)}<div class="muted">${g1.need ? `Còn thiếu ${money(g1.need)}` : 'Đủ tiền rồi! Nhờ bố mẹ mua cho con nhé 🎉'}</div></div>` : '';
  // Trên danh sách việc: những gì con phải làm hôm nay (bài cần nộp, việc ôn thi tới ngày, soạn cặp). Dưới danh sách: mốc sắp tới và mục tiêu tiết kiệm.
  // Bài cô vừa giao trong hai ngày qua (chưa tới hạn nên chưa nằm trong Bài cần nộp): báo để con biết có bài mới.
  const fresh = openTasks(k.id).filter(x => x.cls && x.hw.at && Date.now() - new Date(x.hw.at) < 2 * 864e5 && !kts.some(y => y.id === x.id));
  const school = (fresh.length ? `<section class="slot tn2">${secHead('📒', 'Cô mới giao bài', { cnt: fresh.length })}<div class="big-list">${fresh.map(x => taskRow(x, false, 'big')).join('')}</div></section>` : '')
    + (kts.length ? `<section class="slot s-task">${secHead('📝', 'Bài cần nộp', { cnt: kts.length })}<div class="big-list">${kts.map(t => taskRow(t, false, 'big')).join('')}</div>${hwPenNote()}</section>` : '')
    + (study.length ? `<section class="slot s-task">${secHead('📖', 'Ôn thi', { cnt: study.length })}<div class="big-list">${study.map(x => studyRow(x, 'big')).join('')}</div></section>` : '')
    + (sc ? `<section class="slot tn4">${secHead(sc.bag ? '🎒' : '🏫', esc(sc.title))}<div class="slot-list pad"><div class="sj-list">${subjChips(sc.subjects)}</div></div></section>` : '');
  const after = eventLines(k, 'km-event') + goal;
  const merit = meritSection(k) + funSection(k);
  const bigChore = (x, g) => {
    const c = x.c, on = isDone(t, k.id, c.id), steps = stepsShow(c, k.id, t), mask = stepMask(t, k.id, c.id);
    const sub = `<span class="s">${choreMeta(c, k.id, t, true)}</span>`;
    if (isFun(c)) return x.locked
      ? `<button class="big-item fun locked" data-act="fun-need" data-kid="${k.id}" data-chore="${c.id}" data-d="${key(t)}"><span class="ico">${esc(c.icon || '🎈')}</span><span><span class="t">${esc(c.name)}</span><br><span class="s">${esc(needLine(g.need))}. Bấm để xem cần làm gì.</span></span><span class="lockic">🔒</span></button>`
      : `<div class="big-item fun open"><span class="ico">${esc(c.icon || '🎈')}</span><span><span class="t">${esc(c.name)}</span><br><span class="s">Mở khoá rồi, con được làm việc này!</span></span><span class="lockic"></span></div>`;
    if (!steps.length) return `<button class="big-item ${on ? 'done' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" data-km="1" aria-pressed="${on}"><span class="ico">${esc(c.icon || '✅')}</span><span><span class="t">${esc(c.name)}</span><br>${sub}</span><span class="stamp ${on ? 'on' : ''}">${STAR}</span></button>`;
    return `<div class="big-item has-steps ${on ? 'done' : ''}"><div class="big-top"><span class="ico">${esc(c.icon || '✅')}</span><span><span class="t">${esc(c.name)}</span><br>${sub}</span>
      <button class="stamp ${on ? 'on' : ''}" data-act="tick" data-kid="${k.id}" data-chore="${c.id}" data-km="1" aria-pressed="${on}" aria-label="${on ? 'Bỏ dấu' : 'Xong hết'}: ${esc(c.name)}">${STAR}</button></div>
      <div class="big-steps">${steps.map(st => { const ok = on || (mask >> st.i) & 1; return st.off ? stepOff(st, true) : `<button class="step ${ok ? 'on' : ''}" data-act="step" data-kid="${k.id}" data-chore="${c.id}" data-i="${st.i}" data-km="1" aria-pressed="${!!ok}">${esc(st.t)}</button>`; }).join('')}</div></div>`;
  };
  // Mỗi buổi một nhãn màu như màn Hôm nay, chữ và nút to hơn. Chỉ buổi đang diễn ra mở sẵn (xem slotOpenDefault trong hom-nay.js); bấm nhãn để mở buổi khác.
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
