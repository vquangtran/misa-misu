// Màn Tài khoản: số dư, ghi cho con (phạt, thưởng thêm, chi tiêu), chờ duyệt thành tích, việc thích làm con xin, lịch sử, mục tiêu tiết kiệm.
import { $, addDays, CHEV, DAILY, daysLabel, dm, durTxt, esc, key, money, norm, nowMin, pad, parse, PLUS, signed, toast, today, WDN, weekStart } from './chung.js';
import { againVnd, balance, choresList, choreSlot, choreVnd, dayBonuses, dayBonusIn, dayBonusOf, doneVnd, earned, FEE_DAY_MAX, FEE_MIN, feeMinsOn,
  isDaily, isExtra, isFun, kidName, kidsList, ledgerVnd, memoize, penaltyTimes, penaltyVnd, priceKind, pricesList, priceVnd, readLogOf, RO, S, slotAt,
  slotName, SLOTS, streakOf, todayKid, UI, weekBonuses, weekBonusOf, weekStats } from './du-lieu.js';
import { addBtn, bar, barCount, blankAdd, kidTabs, mini, moreBtn, noKids, pillBar, plusBtn, secHead, secIsOpen } from './giao-dien.js';
import { DAY_SETS, formFoot, frow, kidRow, openModal, pillNum, pillSel, titleCard } from './form.js';
import { meritList, priceTag } from './quy-dinh.js';

// ---------- việc thích làm con xin, thành tích chờ duyệt ----------
// Việc thích làm con xin thêm hoặc xin sửa, chờ bố duyệt. Nằm trong nhóm `paid`, id "xin-<mã>":
//   { xin: 'fun', kid, chore: mã việc đang có (xin sửa; không có = xin thêm việc mới), name, icon, minutes, slot, days, at }.
// Chưa duyệt thì lịch của con chưa đổi. Duyệt: thêm việc mới, hoặc sửa việc đang có cho riêng con đó. Không duyệt: xoá yêu cầu.
export const funAsks = kidId => Object.entries(S.paid || {}).filter(([id, x]) => id.startsWith('xin-') && x && x.xin === 'fun' && S.kids[x.kid] && (!kidId || x.kid === kidId)
  && (!x.chore || (S.chores[x.chore] && isFun(S.chores[x.chore]) && (S.chores[x.chore].kids || []).includes(x.kid)))).map(([id, x]) => ({ id, ...x })).sort((a, b) => String(a.at).localeCompare(String(b.at)));
export const funOf = kidId => choresList().filter(c => isFun(c) && (c.kids || []).includes(kidId));
// Một dòng tả việc thích làm: số phút, buổi, ngày.
const funLine = x => [Number(x.minutes) ? `${Number(x.minutes)} phút` : '', slotName(choreSlot(x)).toLowerCase(), daysLabel(x.days)].filter(Boolean).join(' · ');
// Con xin sửa thì đổi những gì so với việc đang có: ['30 phút → 45 phút', ...].
export function funDiff(x) {
  const c = S.chores[x.chore]; if (!c) return [];
  const mins = v => Number(v) ? `${Number(v)} phút` : 'không ghi số phút', p = [];
  if ((Number(c.minutes) || 0) !== (Number(x.minutes) || 0)) p.push(`${mins(c.minutes)} → ${mins(x.minutes)}`);
  if (choreSlot(c) !== (x.slot || '')) p.push(`${slotName(choreSlot(c)).toLowerCase()} → ${slotName(x.slot).toLowerCase()}`);
  if (daysLabel(c.days) !== daysLabel(x.days)) p.push(`${daysLabel(c.days)} → ${daysLabel(x.days)}`);
  return p;
}
// Thành tích con đã báo, đang chờ bố duyệt. Nằm trong sổ tài khoản với amount = 0 (chưa tính vào số dư, cả với máy chưa cập nhật app),
// số tiền sẽ cộng ghi ở ask. Duyệt: amount = ask, bỏ pending. Không duyệt: xoá.
export const pendingList = kidId => Object.entries(S.ledger).filter(([, l]) => l.pending && S.kids[l.kid] && (!kidId || l.kid === kidId)).map(([id, l]) => ({ id, ...l })).sort((a, b) => String(a.at).localeCompare(String(b.at)));


// ---------- màn Tài khoản ----------
const LEDGER_KIND = {
  bonus: ['Thưởng', '⭐'], penalty: ['Phạt', '⚠️'], fee: ['Phí sử dụng', '📱'], spend: ['Chi tiêu', '💸'],
  reward: ['Đổi phiếu thưởng', '🎁'], week: ['Thưởng đủ tuần', '🏆'], day: ['Thưởng ngày đủ việc', '⭐'], chores: ['Việc nhà', '🧹'], adjust: ['Khớp số dư', '🏦'],
};
// Ghi cho con: ba mục. Phí sử dụng (xem TV, chơi game, điện thoại, tính theo mỗi 30 phút) nằm trong Chi tiêu, vẫn ghi là khoản phí (kind 'fee').
const ACCT_KINDS = [['penalty', 'Phạt'], ['bonus', 'Thưởng thêm'], ['spend', 'Chi tiêu']];
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
    // Việc đọc sách ghi kèm đã đọc gì, bao nhiêu trang.
    const names = Object.entries(S.done[dk][kidId] || {}).filter(([cid, x]) => !cid.includes('~') && doneVnd(x) > 0 && S.chores[cid]?.name)
      .map(([cid]) => { const r = readLogOf(dk, kidId, cid); return S.chores[cid].name + (r ? ` (${r.what}${Number(r.pages) ? `, ${Number(r.pages)} trang` : ''})` : ''); });
    const end = parse(dk); end.setHours(23, 58);
    rows.push({ kind: 'chores', vnd: v, note: `Ngày ${dm(parse(dk))} · ${names.length ? `${names.length} việc: ${names.join(', ')}` : 'việc nhà'}`, at: end.toISOString() });
  }
  return rows.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
// Số tiền viết gọn cho viên chọn con: 120.000đ là "120k", 12.500đ là "12,5k".
const kShort = n => (n < 0 ? '−' : '') + (Math.abs(n) / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'k';
// Hai con số đầu màn Tài khoản: đang có bao nhiêu (kèm mục tiêu tiết kiệm số 1) và tuần này kiếm được bao nhiêu.
export function acctStats(k) {
  const ak = k.id, ws = weekStart(today()), st = weekStats(k, ws), we = key(addDays(ws, 6)), dbw = dayBonusIn(ak, key(ws), we), wk = earned(ak, key(ws), we) + dbw, wb = weekBonusOf(k), bal = balance(ak);
  const fullDays = dayBonuses(ak).filter(x => x.dk >= key(ws)).length;
  const bonusNote = isDaily(k) ? (dayBonusOf(k) ? (fullDays ? ` · ⭐ ${fullDays} ngày đủ việc +${money(dbw)}` : ` · ngày đủ việc +${money(dayBonusOf(k))}`) : '') : wb ? (st.done >= st.possible ? ` · 🏆 thưởng ${money(wb)}` : ` · đủ tuần +${money(wb)}`) : '';
  const g = goalProgress(ak)[0], gp = g && g.price ? Math.min(100, Math.round(g.have / g.price * 100)) : 0, sn = streakOf(ak);
  return `<section class="stat2"><div class="stat"><b class="stat-n num ${bal < 0 ? 'neg' : ''}">${money(bal)}</b><span class="cap">Đang có</span>
      ${g ? `${bar(g.have, g.price)}<span class="stat-c">${esc(g.icon || '🎁')} ${esc(g.name)} · ${gp}%</span>` : `<span class="stat-c">${sn ? `🔥 ${sn} ngày liên tiếp` : 'Chưa có mục tiêu tiết kiệm'}</span>`}</div>
    <div class="stat"><b class="stat-n num ${wk ? 'plus' : ''}">+${money(wk)}</b><span class="cap">Tuần này</span>
      ${st.possible ? `${barCount(st.done, st.possible)}<span class="stat-c"><span class="num">${st.done}/${st.possible}</span> việc phải làm${bonusNote}</span>` : '<span class="stat-c">Chưa có việc phải làm</span>'}</div></section>`;
}
export function viewAccount() {
  const kids = kidsList(), t = today(), ws = weekStart(t);
  if (!kids.length) return `<div class="day-head"><h1>Tài khoản</h1></div>` + noKids();
  const ak = UI.acctKid = S.kids[UI.acctKid] ? UI.acctKid : todayKid(kids).id, kind = ACCT_KINDS.some(x => x[0] === UI.acctKind) ? UI.acctKind : 'penalty';
  const k = kids.find(x => x.id === ak);
  let h = `<div class="tbar">${kidTabs(kids, ak, 'acct-kid', x => `<i class="num ${balance(x.id) < 0 ? 'neg' : ''}">${kShort(balance(x.id))}</i>`)}${pillBar(moreBtn('acct-menu', 'Khớp số dư, sửa quy định'), plusBtn('Thưởng thêm, chi tiêu, mục tiêu tiết kiệm'))}</div>
  <div class="day-head"><h1>Tài khoản</h1></div>${acctStats(k)}`;

  const kidName1 = esc(kidName(ak));
  h += `<div class="slots">${pendingCard(ak)}<section class="slot">${secHead('✏️', `Ghi cho ${kidName1}`)}<div class="acct-form">
    <div class="seg modes">${ACCT_KINDS.map(([v, l]) => `<label><input type="radio" name="akind" value="${v}" ${v === kind ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  const presets = list => `<div class="presets">${list.map(r => `<button class="preset ${priceKind(r)}" data-act="acct-preset" data-id="${r.id}"><span class="ico">${esc(r.icon || '•')}</span><span class="t">${esc(r.name)}</span>${r.note ? `<span class="muted small">${esc(r.note)}</span>` : ''}${againVnd(r) ? `<span class="muted small">lần ${penaltyTimes(r.id, ak) + 1} trong tuần</span>` : ''}<b class="num">${againVnd(r) ? '−' + money(penaltyVnd(r, ak)) : priceTag(r)}</b></button>`).join('')}</div>`;
  const custom = (label, btn, ph) => `<div class="row2"><div class="field"><label for="aamt">${label}</label><input id="aamt" class="input num" type="number" min="0" step="1000" inputmode="numeric" placeholder="Ví dụ: 10000"></div>
    <div class="field"><label for="anote">Lý do</label><input id="anote" class="input" maxlength="80" placeholder="${ph}"></div></div>
    <div class="row"><button class="btn ${kind === 'bonus' ? 'primary' : 'danger'}" data-act="acct-custom">${btn}</button></div>`;
  // Ô số phút muốn mua cho phí sử dụng (xem TV, chơi game, điện thoại): giá ở trang Quy định tính cho mỗi 30 phút, mỗi mục mỗi ngày tối đa 1 giờ.
  const hoursField = `<div class="field"><label for="amins">Số phút muốn mua</label><div class="stepper"><button class="iconbtn" data-act="num-step" data-t="amins" data-n="-${FEE_MIN}" data-min="${FEE_MIN}" data-max="${FEE_DAY_MAX}" aria-label="Bớt ${FEE_MIN} phút">−</button><input id="amins" class="input num" type="number" min="${FEE_MIN}" max="${FEE_DAY_MAX}" step="${FEE_MIN}" value="${FEE_MIN}" inputmode="numeric"><button class="iconbtn" data-act="num-step" data-t="amins" data-n="${FEE_MIN}" data-min="${FEE_MIN}" data-max="${FEE_DAY_MAX}" aria-label="Thêm ${FEE_MIN} phút">+</button></div>
      <span class="muted small">Giá tính cho mỗi ${FEE_MIN} phút. Mỗi mục mỗi ngày mua tối đa ${durTxt(FEE_DAY_MAX)}.</span></div>`;
  if (kind === 'penalty') {
    const ps = pricesList('penalty');
    h += ps.length ? `<p class="muted small" style="margin:0">Bấm vào lỗi để trừ tiền của ${kidName1}. Bấm nhầm thì bấm Hoàn tác ngay sau đó, hoặc Huỷ trong lịch sử.</p>${presets(ps)}` : `<p class="muted small" style="margin:0">Chưa có mục phạt nào. Thêm ở trang <a href="#quy-dinh">Quy định</a>.</p>`;
    h += `<details class="adv"><summary>Phạt số tiền khác</summary>${custom('Số tiền trừ (đồng)', 'Trừ tiền', 'Ví dụ: Làm vỡ cốc')}</details>`;
  } else if (kind === 'bonus') {
    h += `<p class="muted small" style="margin:0">Tiền việc nhà và tiền thưởng làm đủ việc được cộng tự động. Ở đây ghi các khoản thưởng thêm khác.</p>${pricesList('merit').length ? presets(pricesList('merit')) : ''}${custom('Số tiền thưởng (đồng)', 'Thưởng tiền', 'Ví dụ: Được điểm 10, giúp bà nấu cơm')}`;
  } else {
    const gs = pricesList('gift'), fs = pricesList('fee');
    h += `<p class="muted small" style="margin:0">Con tiêu tiền trong tài khoản: xem TV, chơi game, đổi phiếu thưởng, mua đồ hoặc rút tiền mặt.</p>`;
    // Phí sử dụng (xem TV, chơi game, điện thoại): tính theo thời gian dùng, giá mỗi 30 phút ở trang Quy định.
    if (fs.length) h += `<div class="sub-h">Phí sử dụng (mua từng ${FEE_MIN} phút)</div>${hoursField}${presets(fs)}${gs.length ? '<div class="sub-h">Phiếu thưởng</div>' : ''}`;
    if (gs.length) h += presets(gs);
    if (!fs.length && !gs.length) h += `<p class="muted small" style="margin:0">Chưa có mục phí sử dụng hay phiếu thưởng nào. Thêm ở trang <a href="#quy-dinh">Quy định</a>.</p>`;
    h += custom('Số tiền chi (đồng)', 'Ghi chi tiêu', 'Ví dụ: Rút tiền mặt, mua truyện');
  }
  h += `</div></section>`;

  return h + goalsCard(ak) + histSection(ak) + `</div>`;
}
// Lịch sử tài khoản của một con. Chỉ xem (máy của con) thì không có nút Huỷ.
export function histSection(kidId) {
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

// ---------- con tự mua thời gian ----------
// Tab Tài khoản của con: con dùng tiền của mình mua thời gian xem TV, chơi game, điện thoại (các mục Phí sử dụng ở trang Quy định),
// không cần bố mẹ ghi hộ. Mua là trừ tiền ngay: một khoản phí trong sổ tài khoản có by = mã của con, rid = mã mục, mins = số phút.
// Mua từng 30 phút (FEE_MIN); mỗi mục mỗi ngày tối đa 1 giờ (FEE_DAY_MAX, tính cả phần bố mẹ ghi hộ); không đủ tiền thì không mua được.
// Mua xong con gửi yêu cầu thêm thời gian trên máy và nhắn bố. Màn của bố mẹ hiện "… vừa mua, hãy thêm thời gian" (buyCard); bố thêm xong
// bấm Đã thêm (khoản đó có added) thì màn của con hiện "Bố đã thêm". Bố mẹ bấm Huỷ thì xoá khoản đó, tiền về lại tài khoản của con.
export const buyLeft = (kidId, rid) => Math.max(0, FEE_DAY_MAX - feeMinsOn(kidId, rid));
export const buyMins = (m, left = FEE_DAY_MAX) => Math.max(FEE_MIN, Math.min(left, Math.round((Number(m) || FEE_MIN) / FEE_MIN) * FEE_MIN));
export const buyCost = (r, mins) => Math.round(priceVnd(r) * mins / FEE_MIN);
// Các lần con tự mua, mới nhất trước. waiting: chỉ những lần bố chưa bấm Đã thêm.
export const buyList = (kidId, waiting) => Object.entries(S.ledger).filter(([, l]) => l.by && l.kind === 'fee' && S.kids[l.kid] && (!kidId || l.kid === kidId) && (!waiting || !l.added))
  .map(([id, l]) => ({ id, ...l })).sort((a, b) => String(b.at).localeCompare(String(a.at)));
export const buyName = l => String(l.note || '').replace(' (con tự mua)', '');
const clock = iso => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
// "lúc 18:30" nếu là hôm nay, ngày khác thì kèm ngày.
export const buyWhen = iso => { const d = new Date(iso); return key(d) === key(today()) ? `lúc ${clock(iso)}` : `${WDN(d.getDay())} ${dm(d)} ${clock(iso)}`; };
// Form mua: chọn số phút muốn mua (30 phút, 1 giờ; chỉ hiện mức còn mua được hôm nay). keep: đang đổi số phút trong form, vẽ lại tại chỗ.
export function buyForm(kidId, rid, m, keep) {
  const r = pricesList('fee').find(x => x.id === rid); if (!r || !S.kids[kidId]) return;
  const left = buyLeft(kidId, rid), had = FEE_DAY_MAX - left;
  if (left < FEE_MIN) return toast(`Hôm nay con đã mua đủ ${durTxt(FEE_DAY_MAX)} ${r.name} rồi. Mai mua tiếp nhé.`);
  const mins = buyMins(m, left), cost = buyCost(r, mins), bal = balance(kidId), ok = bal >= cost, opts = [];
  for (let x = FEE_MIN; x <= left; x += FEE_MIN) opts.push(x);
  openModal(`<h2>Mua ${esc(r.name)}</h2>
  <div class="fg">
    <div class="fr col"><div class="fl"><span class="lbl">Chọn số phút muốn mua</span><span class="fs">${money(priceVnd(r))} mỗi ${FEE_MIN} phút. Mỗi ngày mua tối đa ${durTxt(FEE_DAY_MAX)}${had ? `, hôm nay con đã mua ${durTxt(had)}` : ''}.</span></div>
      <div class="seg buy-opts" data-id="${r.id}" data-kid="${kidId}">${opts.map(x => `<label><input type="radio" name="bmins" value="${x}" ${x === mins ? 'checked' : ''}><span>${durTxt(x)}</span></label>`).join('')}</div></div>
    ${frow('Hết', `<b class="num minus">−${money(cost)}</b>`)}
    ${frow('Con đang có', `<b class="num">${money(bal)}</b>`)}
    ${frow('Mua xong còn', ok ? `<b class="num">${money(bal - cost)}</b>` : `<b class="late">Thiếu ${money(cost - bal)}</b>`)}
  </div>
  ${ok ? '' : `<p class="note">Con chưa đủ tiền để mua ${esc(r.name)} ${durTxt(mins)}. Làm thêm việc nhà để có thêm tiền nhé.</p>`}
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="buy-ok" data-id="${r.id}" data-kid="${kidId}" data-m="${mins}" ${ok ? '' : 'disabled'}>Mua</button></div>`, false, keep);
}
// Mua xong: báo đã mua, hết bao nhiêu, còn bao nhiêu, và nhắc con việc cần làm tiếp để được thêm thời gian trên máy.
export function buyDone(r, mins, cost, left) {
  openModal(`<div class="empty buy-done"><div class="big">✅</div><h2>Đã mua thành công</h2>
    <p class="buy-what">${esc(r.icon || '📱')} ${esc(r.name)} ${durTxt(mins)} · <b class="num minus">−${money(cost)}</b></p><p class="muted">Con còn ${money(left)}</p>
    <p class="note buy-next">Con hãy gửi yêu cầu thêm thời gian và nhắn bố thêm.</p></div>
  <div class="foot"><button class="btn primary" data-act="close">Xong</button></div>`);
}
// Màn của bố mẹ: con vừa mua thời gian, bố mẹ thêm thời gian trên máy cho con rồi bấm Đã thêm. Huỷ: xoá khoản đó, trả lại tiền cho con.
function buyCard(kidId) {
  const list = buyList(kidId, true); if (!list.length) return '';
  return `<section class="slot tn2">${secHead('📱', 'Hãy thêm thời gian', { cnt: list.length })}<div class="slot-list list">${list.map(l => `<div class="item pend"><span class="ico">${esc(l.icon || '📱')}</span><div class="txt"><div class="t">${esc(kidName(l.kid))} vừa mua ${esc(buyName(l))}</div><div class="s">Mua ${esc(buyWhen(l.at))} · <b class="num minus">−${money(-ledgerVnd(l))}</b> · hãy thêm thời gian</div></div>
      <div class="acts"><button class="linkbtn undo" data-act="ledger-undo" data-id="${l.id}">Huỷ</button><button class="btn primary sm" data-act="buy-added" data-id="${l.id}">Đã thêm</button></div></div>`).join('')}</div></section>`;
}

// Thành tích con báo, chờ bố duyệt. Chưa duyệt thì chưa tính vào số dư.
// withFun: kèm việc thích làm con xin thêm, xin sửa (màn Hôm nay); màn Tài khoản chỉ có thành tích vì chỉ thành tích mới có tiền.
// Đứng trước là thẻ Hãy thêm thời gian (buyCard): những lần con tự mua thời gian mà bố mẹ chưa bấm Đã thêm.
export function pendingCard(kidId, withFun) {
  const list = pendingList(kidId), asks = withFun ? funAsks(kidId) : []; if (!list.length && !asks.length) return buyCard(kidId);
  return buyCard(kidId) + `<section class="slot tn3">${secHead(list.length ? '🏅' : '🎈', 'Chờ bố duyệt', { cnt: list.length + asks.length })}<div class="slot-list list">${list.map(l => {
    const dt = new Date(l.at);
    return `<div class="item pend"><span class="ico">${esc(l.icon || '🏅')}</span><div class="txt"><div class="t">${esc(l.note || 'Thành tích')}</div><div class="s">${esc(kidName(l.kid))} báo ${WDN(dt.getDay())} ${dm(dt)} · <b class="num plus">+${money(l.ask)}</b></div></div>
      <div class="acts"><button class="linkbtn undo" data-act="merit-no" data-id="${l.id}">Không</button><button class="btn primary sm" data-act="merit-ok" data-id="${l.id}">Duyệt</button></div></div>`;
  }).join('')}${asks.map(x => {
    const c = x.chore ? S.chores[x.chore] : null, who = esc(kidName(x.kid)), diff = c ? funDiff(x) : [];
    const shared = c && (c.kids || []).filter(y => S.kids[y]).length > 1;
    const sub = c ? `${who} xin sửa việc thích làm${norm(c.name) !== norm(x.name) ? ` “${esc(c.name)}”` : ''}${diff.length ? ` · ${diff.map(esc).join(' · ')}` : ''}${shared ? ` · chỉ đổi cho ${who}` : ''}` : `${who} xin thêm việc thích làm · ${esc(funLine(x))}`;
    return `<div class="item pend"><span class="ico">${esc(x.icon || '🎈')}</span><div class="txt"><div class="t">${esc(x.name)}</div><div class="s">${sub}</div></div>
      <div class="acts"><button class="linkbtn undo" data-act="fun-no" data-id="${x.id}">Không</button><button class="btn primary sm" data-act="fun-ok" data-id="${x.id}">Duyệt</button></div></div>`;
  }).join('')}</div></section>`;
}
// Việc thích làm trên màn của con: các việc con đang có (bấm để xin sửa), việc con xin thêm đang chờ duyệt, và nút + để xin thêm.
export function funSection(k) {
  const asks = funAsks(k.id), rows = funOf(k.id).map(c => {
    const x = asks.find(y => y.chore === c.id);
    return `<div class="item ${x ? 'pend' : ''}"><span class="ico">${esc(c.icon || '🎈')}</span><div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${x ? `⏳ Chờ bố duyệt: ${norm(x.name) !== norm(c.name) ? `đổi thành “${esc(x.name)}”` : 'đổi'}${funDiff(x).length ? ` · ${funDiff(x).map(esc).join(' · ')}` : ''}` : esc(funLine(c))}</div></div>
      <div class="acts"><button class="edit" data-act="fun-form" data-kid="${k.id}" data-id="${c.id}" aria-label="Sửa: ${esc(c.name)}">${CHEV}</button></div></div>`;
  }).concat(asks.filter(x => !x.chore).map(x => `<div class="item pend"><span class="ico">${esc(x.icon || '🎈')}</span><div class="txt"><div class="t">${esc(x.name)}</div><div class="s">⏳ Chờ bố duyệt · ${esc(funLine(x))}</div></div>
      <div class="acts"><button class="edit" data-act="fun-form" data-kid="${k.id}" data-ask="${x.id}" aria-label="Sửa: ${esc(x.name)}">${CHEV}</button></div></div>`));
  return `<section class="slot tn5">${secHead('🎈', 'Việc con thích làm', { cnt: rows.length || '' })}
    ${rows.length ? `<div class="slot-list list">${rows.join('')}</div>` : ''}
    <button class="slot-blank" data-act="fun-form" data-kid="${k.id}"><span>${rows.length ? 'Con thích làm gì nữa? Bấm để xin bố mẹ thêm' : 'Con thích làm gì khi xong việc? Bấm để xin bố mẹ thêm'}</span>${PLUS}</button></section>`;
}
// Con xin thêm một việc thích làm, hoặc xin sửa việc đang có (choreId), hoặc sửa lại yêu cầu đang chờ (askId). Gửi xong phải chờ bố duyệt.
export function funForm(kidId, choreId, askId) {
  if (!S.kids[kidId]) return;
  const asks = funAsks(kidId), c = choreId ? funOf(kidId).find(x => x.id === choreId) : null; if (choreId && !c) return;
  const x = c ? asks.find(y => y.chore === c.id) : asks.find(y => y.id === askId && !y.chore);
  const cur = x || (c ? { name: c.name, minutes: c.minutes, slot: choreSlot(c), days: c.days } : { name: '', minutes: 30, slot: slotAt(nowMin()), days: DAILY });
  const dk = [...(cur.days || [])].map(Number).sort().join(), sets = DAY_SETS.some(y => y[0] === dk) ? DAY_SETS : [[dk, daysLabel(cur.days).replace(/^./, m => m.toUpperCase())], ...DAY_SETS];
  openModal(`<h2>${c ? 'Sửa việc thích làm' : 'Thêm việc thích làm'}</h2>
  <p class="muted small lead">${x ? 'Yêu cầu này đang chờ bố duyệt. Con sửa lại rồi gửi lần nữa cũng được.' : c ? 'Con sửa xong thì gửi; bố xem và duyệt thì việc này mới đổi.' : 'Việc con thích làm khi đã xong việc phải làm. Bố xem và duyệt thì việc này mới có trong lịch của con.'}</p>
  ${titleCard('fname', cur.name, 'Con thích làm gì?')}
  <div class="fg">
    ${frow('Làm trong bao lâu', pillNum('fmin', Number(cur.minutes) || '', { step: 5, unit: 'phút', attr: 'min="0" max="600"', ph: '0' }), { id: 'fmin' })}
    ${frow('Buổi', pillSel('fslot', SLOTS.map(([v, label]) => [v, label]), cur.slot || ''), { id: 'fslot', sub: 'Xong việc phải làm của buổi đó là được làm' })}
    ${frow('Lặp lại', pillSel('fdays', sets, dk), { id: 'fdays' })}
  </div>
  <div class="foot">${x ? `<button class="btn danger left" data-act="fun-cancel" data-id="${x.id}">Huỷ yêu cầu</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="fun-ask" data-kid="${kidId}" data-id="${c ? c.id : ''}" data-ask="${x ? x.id : ''}">Gửi bố duyệt</button></div>`);
  if (!c && !x) $('#fname').focus();
}
// Con báo thành tích: chọn một mục có sẵn, ghi thêm môn nếu muốn, rồi gửi bố duyệt.
export function meritSheet(kidId) {
  if (!S.kids[kidId]) return;
  openModal(`<h2>Con đạt được gì?</h2><p class="muted small lead">Ở trường hay ở lớp học thêm đều tính như nhau. Chọn một mục rồi gửi; bố xem và duyệt thì tiền mới vào tài khoản của con.</p>
  <div class="fg"><div class="list menu">${meritList().map(r => `<button class="item nav" data-act="merit-pick" data-id="${r.id}" data-kid="${kidId}"><span class="ico">${esc(r.icon || '🏅')}</span><span class="txt"><span class="t">${esc(r.name)}</span><span class="s"><b class="num plus">+${money(priceVnd(r))}</b></span></span>${CHEV}</button>`).join('')}</div></div>
  <div class="foot"><button class="btn quiet" data-act="close">Đóng</button></div>`);
}
export function meritForm(kidId, rid) {
  const r = meritList().find(x => x.id === rid); if (!r || !S.kids[kidId]) return;
  openModal(`<h2>${esc(r.icon || '🏅')} ${esc(r.name)}</h2><p class="muted small lead">Bố duyệt thì con được cộng <b class="num plus">+${money(priceVnd(r))}</b>.</p>
  <div class="fg">${frow('Môn gì, bài gì?', `<input id="mnote" class="input" maxlength="60" placeholder="Ví dụ: Toán ở trường, Tiếng Anh học thêm">`, { id: 'mnote', cls: 'col', sub: 'Không bắt buộc, ghi để bố mẹ dễ xem' })}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="merit-ask" data-id="${rid}" data-kid="${kidId}">Gửi bố duyệt</button></div>`);
}
// Phiếu nghỉ việc nhà: hỏi con muốn nghỉ ngày nào rồi mới trừ tiền.
export function skipForm(rid, kidId) {
  const r = S.rewards[rid]; if (!r) return;
  openModal(`<h2>${esc(r.icon || '🎟️')} ${esc(r.name)}</h2>
  <p class="muted small lead">${esc(kidName(kidId))} đổi phiếu này mất ${money(priceVnd(r))}. Việc phải làm của ngày được chọn được miễn${isDaily(S.kids[kidId]) ? ', chuỗi ngày không bị đứt. Ngày nghỉ không có thưởng ngày đủ việc' : ', vẫn giữ thưởng đủ tuần'}.</p>
  <div class="fg">${frow('Nghỉ ngày nào', `<input id="askip" class="pillin num" type="date" value="${key(today())}" min="${key(today())}">`, { id: 'askip' })}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="acct-preset" data-id="${rid}" data-go="1">Đổi phiếu</button></div>`);
}

// Khớp số dư: bố mẹ gõ số tiền thật của từng con, app ghi một khoản "Khớp số dư" bằng phần chênh lệch.
export function balForm() {
  openModal(`<h2>Khớp số dư</h2><p class="muted small lead">Gõ số tiền thật đang có của từng con (ví dụ theo tài khoản ngân hàng). App ghi một khoản điều chỉnh bằng phần chênh lệch, lịch sử cũ giữ nguyên. Bỏ trống nếu không đổi.</p>
  <div class="fg">${kidsList().map(k => frow(`${mini(k)} ${esc(k.name)}`, pillNum(`bal-${k.id}`, '', { attr: `step="1" data-bal="${k.id}"`, ph: Math.max(0, balance(k.id)) }), { id: `bal-${k.id}`, sub: `Trong app: ${money(balance(k.id))}` })).join('')}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="bal-save">Lưu số dư</button></div>`);
}

// ---------- mục tiêu tiết kiệm ----------
// goals: { kid, name, icon, price, order, done, doneAt }. Tiền trong tài khoản được chia cho các mục tiêu
// theo thứ tự ưu tiên: mục tiêu đầu tiên đầy rồi mới sang mục tiếp theo.
const GOAL_ICONS = ['🚲', '🛴', '🎮', '📚', '🧸', '🎨', '⚽', '🎧', '👟', '🎒', '🧩', '🏊', '🎁', '✈️', '🐶', '💻'];
export const goalsOf = (kidId, done = false) => Object.entries(S.goals || {}).map(([id, g]) => ({ id, ...g, price: Math.max(0, Number(g.price) || 0) }))
  .filter(g => g.kid === kidId && !!g.done === done).sort((a, b) => done ? String(b.doneAt).localeCompare(String(a.doneAt)) : (a.order ?? 0) - (b.order ?? 0));
export function goalProgress(kidId) {
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
export function coinUnit(price) { for (const u of [5000, 10000, 20000, 50000, 100000, 200000, 500000]) if (price / u <= 40) return u; return 1000000; }
export function coins(g, big = false) {
  const u = coinUnit(g.price), n = Math.ceil(g.price / u), on = Math.floor(g.have / u);
  return `<div class="coins ${big ? 'big' : ''}" aria-label="Đã để dành ${on} trên ${n} xu, mỗi xu ${money(u)}">${Array.from({ length: n }, (_, i) => `<i class="${i < on ? 'on sj' + (i % 6) : ''}"></i>`).join('')}</div>
    <div class="muted small">Mỗi xu là ${money(u)}. Đã tô ${on}/${n} xu.</div>`;
}
export function goalsCard(kidId) {
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
export function goalForm(id, kidPre) {
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
