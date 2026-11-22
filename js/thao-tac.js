// Bộ xử lý thao tác: mọi nút bấm đi qua một bộ xử lý theo data-act; thêm các sự kiện change, input, phím, vuốt, giữ nút.
// Máy của con chỉ được làm các thao tác trong KID_ACTS, màn của cô trong TEACH_ACTS.
import { icon } from './icons.js';
import { $, addDays, CHEV, confetti, dateTxt, daysTo, dm, dueLabel, esc, hm, key, money, monthTxt, newFamilyCode, norm, parse, toast, today, toMin,
  uid, WDN, weekStart } from './chung.js';
import { SAMPLE_YEAR } from './nha-minh.js';
import { againVnd, balance, choresList, choreSlot, DAY_BONUS, dayBonusOf, del, deviceRole, isDaily, isDone, isWeekly, keepFamilyInUrl, kidName,
  kidsList, penaltyTimes, pinHash, placeName, priceKind, pricesList, priceVnd, put, render, S, setDone, setFamily, setRole, SETTINGS_ID, skipOn, SLOTS,
  stepMask, stepsAll, stepsOf, TEACH, tkbOf, TODAY_KID, UI, WEEK_BONUS, weekBonusOf, weekGain } from './du-lieu.js';
import { avInner, photoOf } from './giao-dien.js';
import { closeModal, daySet, dismissModal, menuRow, menuSheet, openModal, radioVal, setModalDirty } from './form.js';
import { EVENT_HELP, EVENT_KINDS, eventForm, lessonForm, missingYear, nextSubjectDay, openTasks, printTkb, readTkbForm, sampleLabel, sampleTkb,
  setLearn, taskForm, taskOf, tasksList, tkbDraft, tkbForm, tkbOffer, yearForm } from './hoc-tap.js';
import { ATT, attAdd, attClear, attDraw, attTake, bankForm, bookName, CHK, classesList, classForm, classLinkSheet, classLinksSheet, cleanFiles,
  cleanSteps, CLS, CLS_GONE, clsDel, clsPatch, clsPut, delFiles, feeOf, fileOpen, growTitle, hwDueAfter, hwForm, hwList, hwRowInput, hwView, linkList,
  nextClassDay, offOf, okDate, okId, paidOf, printAsk, printSo, sessDayTitle, sessDefaults, sessForm, sessView, soImportGo, soImportPick, soOf,
  soStats, subAdd, subMay } from './so-hoc.js';
import { drawSheet, funNeedForm, markChore, printSheet, QA, QA_PAY, qaChips, qaData, qaReps, qaWho, quickAdd, todayMenu } from './hom-nay.js';
import { balForm, funAsks, funDiff, funForm, funOf, goalForm, goalsOf, meritForm, meritSheet, skipForm } from './tai-khoan.js';
import { addSamples, CHORE_KIND_SUB, CHORE_KINDS, choreForm, guessIcon, kindHelp, meritList, PRICE_FEE, PRICE_HELP, PRICE_KINDS, priceForm,
  printCoupons, printPrices, TABLE_VER, tableUpdate, tableUpdateForm, tableUpdateRun, weeklyCandidates } from './quy-dinh.js';
import { decryptSeed, exportBackup, hashPin, importBackup, importData, kidForm, kidLink, photoEdit, photoLoad, photoRender, pinForm, roleKidForm,
  seedForm, setPhotoEdit, setSeedChecked, setSeedMem, stayForm } from './gia-dinh.js';

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
