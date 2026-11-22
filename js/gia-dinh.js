// Màn Gia đình: các con, các con ở đâu, chia sẻ và máy của con (link mời, mã PIN), sao lưu, lịch gia đình mã hoá.
import { AVATAR_SETS } from './avatars.js';
import { icon } from './icons.js';
import { $, CHEV, dm, esc, key, money, norm, parse, toast, today, WDN, WDS, WEEK_ORDER } from './chung.js';
import { ageOf, DAY_BONUS, dayBonusOf, family, hasStays, isDaily, kidName, kidsList, modeLabel, pinHash, placeName, placeNames, RO, S, SETTINGS_ID,
  shortPlace, stayInfo, stayLine, store, weekBonusOf } from './du-lieu.js';
import { addBtn, ava, avatarOf, avInner, blankAdd, editBtn, photoOf, pillBar, plusBtn, secHead, subjTint, tintOf } from './giao-dien.js';
import { formFoot, frow, menuRow, openModal, pillNum, titleCard, toggle } from './form.js';

// ---------- các con ở đâu ----------
function stayStrip() {
  const wd = today().getDay();
  return `<div class="stay-strip">${WEEK_ORDER.map(d => { const st = stayInfo(d);
    return `<div class="stay ${d === wd ? 'on' : ''} ${st?.moved ? 'moved' : ''}"><b>${WDS[d]}</b><span class="sd">${st?.day ? esc(shortPlace(st.day)) : ''}</span><span class="sn sj${st?.night ? subjTint(st.night) : ''} ${shortPlace(st?.night).length > 6 ? 'long' : ''}">${st?.night ? esc(shortPlace(st.night)) : '—'}</span></div>`; }).join('')}</div>`;
}
export function stayForm() {
  const names = placeNames();
  openModal(`<h2>Các con ở đâu</h2><p class="muted small lead">Mỗi thứ trong tuần, ban ngày và buổi tối các con ở nhà nào. Ban ngày bỏ trống nếu con đi học bình thường.</p>
  <div class="fg f-pad"><div class="stay-rows"><div></div><span class="lbl">Ban ngày</span><span class="lbl">Buổi tối</span>
  ${WEEK_ORDER.map(d => { const x = (S.stays || {})[String(d)] || {}; return `<b>${WDN(d)}</b>
    <input class="input" list="place-list" maxlength="24" data-sd="${d}" value="${esc(placeName(x.day))}" placeholder="Đi học" aria-label="${WDN(d)} ban ngày">
    <input class="input" list="place-list" maxlength="24" data-sn="${d}" value="${esc(placeName(x.night))}" placeholder="Chưa ghi" aria-label="${WDN(d)} buổi tối">`; }).join('')}</div>
  <datalist id="place-list">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
  <span class="fs">Gõ vài chữ đầu để chọn: ${names.map(esc).join(', ')}.</span></div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="stay-save">Lưu</button></div>`);
}

// Lịch các con ở đâu theo thứ (trang Gia đình). Sắp tới và màn Hôm nay hiện chỗ ở của từng ngày.
function staysCard(wd) {
  const head = secHead('🏠', 'Các con ở đâu', { side: hasStays() && !RO ? '<button class="linkbtn" data-act="stay-form">Sửa</button>' : '' });
  return `<section class="slot tn4">${head}${hasStays()
    ? `<div class="slot-list pad">${stayStrip()}<div class="muted small" style="margin-top:6px">Dòng trên: ban ngày (nếu không đi học). Ô màu: buổi tối ngủ ở đâu. Viền đậm: ngày đổi nhà.${stayLine(wd, true) ? ` <b>Hôm nay:</b> ${esc(stayLine(wd, true).replace(/^\S+\s/, '').toLowerCase())}.` : ''}</div></div>`
    : blankAdd('Ghi ngày nào các con ở nhà B4, 6th Element hay nhà ông bà', 'stay-form')}</section>`;
}


// ---------- màn Gia đình ----------
const inviteLink = () => location.origin + location.pathname + '?gd=' + encodeURIComponent(family);

// Gia đình: cài đặt ít khi đụng tới (các con, các con ở đâu, máy của con và mã PIN, chia sẻ, sao lưu). Việc nhà và thưởng phạt nằm ở trang Quy định.
export function viewFamily() {
  const kids = kidsList();
  let h = `<div class="day-head tools"><h1>Gia đình</h1>${pillBar(plusBtn('Thêm con'))}</div><div class="slots">
  <section class="slot tn0">${secHead('👪', 'Các con', { cnt: kids.length || '', add: addBtn('kid-form', 'Thêm con') })}${kids.length
    ? `<div class="slot-list list">${kids.map(k => `<div class="item">${ava(k, 'sm')}<div class="txt"><div class="t">${esc(k.name)}</div><div class="s">${ageOf(k) !== null ? `${ageOf(k)} tuổi (sinh ${dm(parse(k.birthday))}/${parse(k.birthday).getFullYear()}) · ` : ''}${modeLabel(k)}</div></div><div class="acts">${editBtn('kid-form', k.id, k.name)}</div></div>`).join('')}</div>`
    : blankAdd('Thêm tên và hình đại diện cho từng con', 'kid-form')}</section>${kids.length ? staysCard(today().getDay()) : ''}</div>`;
  if (kids.length) h += `<p class="foot-note">Việc nhà, thưởng, phạt và phiếu thưởng nằm ở trang <a href="#quy-dinh">Quy định</a>.</p>`;
  // Chia sẻ và máy của con: ai mở được app trên máy nào. Link mời cho máy của bố mẹ, mã PIN và link riêng cho máy của từng con.
  h += `<section class="slot">${secHead('🔒', 'Chia sẻ và máy của con')}<div class="card stack">`;
  if (store?.kind === 'firebase') {
    h += `<div class="field"><label for="invite">Link mời người nhà</label>
      <div class="copyrow"><input id="invite" class="input" readonly value="${esc(inviteLink())}"><button class="btn primary sm" data-act="copy-invite">Sao chép</button></div>
      <span class="muted small">${pinHash() ? 'Link cho bố, mẹ: máy mới mở link sẽ được hỏi là máy của ai, chọn bố mẹ thì nhập mã PIN. Máy của con thì dùng link riêng của từng con ở bên dưới.' : 'Gửi link này cho bố/mẹ hoặc mở trên máy tính bảng của con. Ai có link đều xem và sửa được bảng của nhà mình, nên chỉ gửi cho người trong nhà. Muốn máy của con chỉ thấy phần của con thì đặt mã PIN bố mẹ ở bên dưới.'}</span></div>`;
  } else {
    h += `<div class="note">Dữ liệu đang lưu trên trình duyệt của máy này. Muốn đồng bộ giữa điện thoại của bố, mẹ và máy của con, hãy bật Firebase theo hướng dẫn trong README của repo.</div>`;
  }
  h += roleRows();
  if (store?.kind === 'firebase') h += `<div class="list"><button class="item nav" data-act="leave"><span class="ico">🔁</span><span class="txt"><span class="t">Đổi sang gia đình khác</span></span>${CHEV}</button></div>`;
  h += `</div></section>`;
  h += `<section class="slot">${secHead('🔐', 'Sao lưu')}<div class="card stack">`;
  if (getSeedMem()) h += `<div class="note">🔐 Máy này đã nhớ mật khẩu lịch gia đình. Mỗi khi lịch lưu sẵn có bản mới, app tự nạp lúc mở. <button class="btn quiet sm" data-act="seed-forget">Quên mật khẩu</button></div>`;
  h += `<div class="list"><button class="item nav" data-act="seed-form"><span class="ico">🔐</span><span class="txt"><span class="t">Nạp lịch gia đình</span><span class="s">Lịch lưu sẵn, mở bằng mật khẩu gia đình</span></span>${CHEV}</button>
    <button class="item nav" data-act="export"><span class="ico">⬇️</span><span class="txt"><span class="t">Tải bản sao lưu</span></span>${CHEV}</button>
    <label class="item nav file-btn"><span class="ico">⬆️</span><span class="txt"><span class="t">Nhập từ file sao lưu</span></span>${CHEV}<input type="file" id="import-file" accept=".json,application/json"></label></div></div></section>`;
  return h;
}
export async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('misa-misu:' + pin));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
}

// ---------- mã PIN, máy của con ----------
export const kidLink = id => inviteLink() + '&con=' + encodeURIComponent(id);
// mode 'unlock': nhập PIN để máy này thành máy của bố mẹ. mode 'set': đặt hoặc đổi PIN (chỉ máy của bố mẹ).
export function pinForm(mode) {
  const set = mode === 'set';
  openModal(`<h2>${set ? (pinHash() ? 'Đổi mã PIN' : 'Đặt mã PIN bố mẹ') : 'Bố mẹ'}</h2>
  <p class="muted small lead">${set ? 'Từ 4 đến 8 chữ số. Có mã PIN rồi thì máy nào cũng phải chọn một lần: máy của bố mẹ (nhập mã này) hay máy của một con. Đừng cho các con biết mã.' : 'Nhập mã PIN của bố mẹ để máy này thấy và sửa được mọi thứ.'}</p>
  <div class="fg">${frow('Mã PIN', `<input id="pin" class="pillin txt num" type="${set ? 'text' : 'password'}" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" placeholder="••••">`, { id: 'pin' })}</div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="pin-ok" data-mode="${set ? 'set' : 'unlock'}">${set ? 'Lưu' : 'Mở'}</button></div>`);
}
export function roleKidForm(id, fromParent) {
  const k = S.kids[id]; if (!k) return;
  openModal(`<h2>Máy của ${esc(k.name)}</h2>
  <p class="muted small lead">${fromParent ? `Máy này sẽ chỉ còn thấy phần của ${esc(k.name)}: việc hôm nay, bài cần nộp, tiền đang có. Không thêm, sửa, xoá được gì.` : `Con là ${esc(k.name)} phải không? Máy này sẽ chỉ hiện phần của con.`} Muốn đổi lại phải có mã PIN của bố mẹ.</p>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="role-kid-ok" data-kid="${id}">Đúng rồi</button></div>`);
}
// Mã PIN bố mẹ và máy của từng con, nằm trong mục Chia sẻ và máy của con (trang Gia đình).
function roleRows() {
  const kids = kidsList(); if (!kids.length) return '';
  let h = '';
  if (!pinHash()) {
    h += `<div class="note">Hiện giờ ai mở app cũng thấy và sửa được như bố mẹ. Đặt mã PIN bố mẹ để máy của con chỉ thấy phần của con.</div>
      <div class="list">${menuRow('data-act="pin-set"', '🔑', 'Đặt mã PIN bố mẹ', 'Sau đó mỗi máy chọn một lần: bố mẹ hay con nào')}</div>`;
  } else {
    h += `<div class="note">Máy này là máy của bố mẹ. Máy khác mở app sẽ được hỏi là máy của ai; chọn bố mẹ thì phải nhập mã PIN.</div><div class="list">`;
    for (const k of kids) {
      if (store?.kind === 'firebase') h += menuRow(`data-act="copy-kid-link" data-kid="${k.id}"`, '🔗', `Sao chép link cho máy của ${esc(k.name)}`, `Mở link này trên máy của ${esc(k.name)} là vào thẳng phần của con`);
      h += menuRow(`data-act="role-kid" data-kid="${k.id}"`, '📱', `Dùng máy này cho ${esc(k.name)}`, 'Khoá máy đang cầm vào phần của con');
    }
    h += `${menuRow('data-act="pin-set"', '🔑', 'Đổi mã PIN')}<button class="item nav" data-act="pin-clear"><span class="ico">🔓</span><span class="txt"><span class="t">Bỏ mã PIN</span><span class="s">Mọi máy lại thấy và sửa được như bố mẹ</span></span>${CHEV}</button></div>`;
  }
  return h;
}


// ---------- form thông tin của con: ảnh, hình đại diện ----------
// Cắt ảnh vuông theo mức phóng to và vị trí đã chọn, thu về 320px JPEG (khoảng 20–40KB).
export let photoEdit = { img: null, out: undefined };
export const setPhotoEdit = v => { photoEdit = v; };
export function photoRender() {
  const img = photoEdit.img; if (!img) return;
  const z = Number($('#pzoom')?.value) || 1, fx = Number($('#px')?.value ?? .5), fy = Number($('#py')?.value ?? .3);
  const side = Math.min(img.naturalWidth, img.naturalHeight) / z, sx = (img.naturalWidth - side) * fx, sy = (img.naturalHeight - side) * fy;
  const c = document.createElement('canvas'); c.width = c.height = 320;
  c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, 320, 320);
  photoEdit.out = c.toDataURL('image/jpeg', .85);
  const pv = $('#modal .photo-prev'); if (pv) pv.innerHTML = `<img src="${photoEdit.out}" alt="">`;
}
export function photoLoad(file) {
  if (!file || !/^image\//.test(file.type)) return toast('Hãy chọn một file ảnh nhé.');
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => { photoEdit.img = img; $('#modal .photo-adj').hidden = false; const d = $('#modal [data-act=photo-del]'); if (d) d.hidden = false; photoRender(); URL.revokeObjectURL(url); };
  img.onerror = () => { URL.revokeObjectURL(url); toast('Không mở được ảnh này. Thử ảnh JPG hoặc PNG.'); };
  img.src = url;
}
// Emoji chọn làm hình đại diện của con.
const AVATARS = ['🐔', '🐓', '🐣', '🐤', '🐥', '🐴', '🐎', '🦓', '🎠', '🦊', '🐯', '🐼', '🐨', '🦁', '🐸', '🐵', '🦄', '🐲', '🦖', '🐰', '🐱', '🐶', '🐧', '🐳', '🦋'];
// Ô chọn hình: bộ gà, bộ ngựa (mỗi ngày một kiểu hoặc một kiểu cố định), rồi tới emoji.
function avatarGrid(val) {
  const opt = (v, inner, label, cls = '') => `<label><input type="radio" name="kava" value="${esc(v)}" ${v === val ? 'checked' : ''} aria-label="${esc(label)}"><span class="${cls}" title="${esc(label)}">${inner}</span></label>`;
  const sets = Object.entries(AVATAR_SETS);
  let h = `<div class="av-group"><span class="av-h">Mỗi ngày một kiểu</span><div class="pick av">${sets.map(([id, st]) => opt('set:' + id, avInner('set:' + id) + `<i class="av-badge">${icon('🔀')}</i>`, `${st.label}, mỗi ngày một kiểu`, 'rot')).join('')}</div></div>`;
  for (const [id, st] of sets) h += `<div class="av-group"><span class="av-h">${st.label}</span><div class="pick av">${st.items.map((it, i) => opt(`svg:${id}-${i}`, avInner(`svg:${id}-${i}`), it[0])).join('')}</div></div>`;
  h += `<div class="av-group"><span class="av-h">Emoji</span><div class="pick" data-noic>${AVATARS.map(e => opt(e, e, e)).join('')}</div></div>`;
  if (!val) h = h.replace('name="kava" value="set:ga"', 'name="kava" value="set:ga" checked');
  return h;
}
export function kidForm(id) {
  const k = id ? S.kids[id] : null;
  photoEdit = { img: null, out: undefined };
  openModal(`<h2>${k ? 'Sửa thông tin con' : 'Thêm con'}</h2>
  ${titleCard('kname', k?.name, 'Tên của con', { max: 30 })}
  <div class="fg">
    ${frow('Ngày sinh', `<input id="kbday" class="pillin num" type="date" value="${esc(k?.birthday || '')}">`, { id: 'kbday' })}
    ${!k || isDaily(k) ? frow('Thưởng ngày đủ việc', pillNum('kdb', k ? dayBonusOf(k) : DAY_BONUS, { step: 5000, attr: 'min="0" step="1000"' }), { id: 'kdb', sub: `Ngày nào con xong hết việc phải làm thì app tự cộng tiền này. Để 0 nếu không thưởng.${k ? ' Đổi số tiền thì tính từ hôm nay.' : ''}` })
      : frow('Thưởng đủ tuần', pillNum('kwb', weekBonusOf(k), { step: 5000, attr: 'min="0" step="5000"' }), { id: 'kwb', sub: 'Xong hết việc phải làm từ Thứ Hai đến Chủ nhật thì app tự cộng tiền này. Để 0 nếu không thưởng. Đổi số tiền thì tính từ tuần này.' })
        + `<div class="fr">${toggle('kday', `Chuyển sang thưởng theo ngày <span class="fs">Ngày nào đủ việc thì thưởng ${money(DAY_BONUS)}, thay cho thưởng đủ tuần. Tính từ Thứ Hai tuần này, các tuần trước giữ nguyên</span>`, false)}</div>`}
  </div>
  <div class="fg"><div class="fr col"><div class="fl"><span class="lbl">Ảnh của con</span><span class="fs">Ảnh được thu nhỏ và chỉ lưu trong dữ liệu của gia đình. Không có ảnh thì dùng hình đại diện bên dưới.</span></div>
    <div class="photo-pick"><span class="ava photo-prev" style="background:${k ? tintOf(k) : 'var(--t3)'}">${photoOf(k) ? `<img src="${photoOf(k)}" alt="">` : k ? avInner(avatarOf(k)) : icon('📷')}</span>
      <div class="col"><div class="row"><label class="btn quiet sm file-btn">Chọn ảnh<input type="file" id="kphoto" accept="image/*"></label><button class="btn quiet sm" data-act="photo-del" ${photoOf(k) ? '' : 'hidden'}>Bỏ ảnh</button></div>
      <div class="photo-adj" hidden><label class="small">Phóng to<input type="range" id="pzoom" min="1" max="4" step="0.05" value="2"></label><label class="small">Lên xuống<input type="range" id="py" min="0" max="1" step="0.01" value="0.4"></label><label class="small">Trái phải<input type="range" id="px" min="0" max="1" step="0.01" value="0.5"></label></div></div></div></div></div>
  <div class="fg"><div class="fr col"><div class="fl"><span class="lbl">Hình đại diện</span></div><div>${avatarGrid(k ? avatarOf(k) : '')}</div></div></div>
  ${formFoot(k ? 'kid-del' : '', id, 'kid-save')}`);
}


// ---------- sao lưu ----------
export function exportBackup() {
  const data = { app: 'be-cham-ngoan', version: 1, exportedAt: new Date().toISOString(), data: S };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'misa-misu-sao-luu-' + key(today()) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
// Con trong file nhập mà trùng tên với con đã có (khác mã) thì gộp vào con đó,
// không tạo thêm một con nữa. Đổi mã con ở mọi nhóm dữ liệu trong file. Trả về tên các con đã gộp.
function matchKidsByName(data) {
  const byName = {};
  for (const [id, k] of Object.entries(S.kids)) byName[norm(k.name)] ??= id;
  const map = {};
  for (const [id, k] of Object.entries(data.kids)) if (!S.kids[id] && byName[norm(k.name)]) map[id] = byName[norm(k.name)];
  if (!Object.keys(map).length) return [];
  const m = id => map[id] || id;
  for (const id of Object.keys(map)) delete data.kids[id]; // giữ thông tin con đang có
  for (const c of Object.values(data.chores || {})) if (Array.isArray(c.kids)) c.kids = c.kids.map(m);
  for (const day of Object.values(data.done || {})) for (const id of Object.keys(day || {})) if (map[id]) { day[map[id]] = { ...(day[map[id]] || {}), ...day[id] }; delete day[id]; }
  for (const l of Object.values(data.ledger || {})) if (l) l.kid = m(l.kid);
  for (const l of Object.values(data.lessons || {})) if (l) l.kid = m(l.kid);
  for (const t of Object.values(data.tasks || {})) if (t) t.kid = m(t.kid);
  for (const g of Object.values(data.goals || {})) if (g) g.kid = m(g.kid);
  for (const ev of Object.values(data.events || {})) if (ev && Array.isArray(ev.kids)) ev.kids = ev.kids.map(m);
  if (data.paid) data.paid = Object.fromEntries(Object.entries(data.paid).filter(([id]) => id !== SETTINGS_ID).map(([id, p]) => { if (id.startsWith('lop-')) return [id, { ...p, kid: m(p.kid) }]; const [kid, w] = id.split('_'); return [m(kid) + '_' + w, { ...p, kid: m(p.kid) }]; }));
  if (data.timetables) data.timetables = Object.fromEntries(Object.entries(data.timetables).map(([id, t]) => [m(id), t]));
  return [...new Set(Object.values(map))].map(kidName);
}
export async function importBackup(file) {
  try {
    await importData(JSON.parse(await file.text()));
  } catch (e) {
    console.error(e);
    toast('File này không phải bản sao lưu của Misa Misu.');
  }
}
export async function importData(j, quiet = false) {
  {
    const data = j && j.data;
    if (!data || typeof data !== 'object' || !data.kids) throw new Error('bad');
    const matched = matchKidsByName(data);
    await store.importAll(data);
    const n = Object.keys(data.kids).length, parts = [];
    if (n) parts.push(`${n} con mới`);
    if (matched.length) parts.push(`gộp vào ${matched.join(', ')}`);
    for (const [c, label] of [['chores', 'việc nhà'], ['timetables', 'thời khoá biểu'], ['lessons', 'buổi học thêm'], ['stays', 'ngày trong lịch ở nhà nào'], ['events', 'mốc năm học'], ['tasks', 'bài tập'], ['goals', 'mục tiêu tiết kiệm']]) { const m = Object.keys(data[c] || {}).length; if (m) parts.push(`${m} ${label}`); }
    if (!quiet) toast(`Đã nhập: ${parts.join(', ') || 'không có gì mới'}.`);
  }
}


// ---------- lịch gia đình mã hoá ----------
// data/gia-dinh.enc.json là một bản sao lưu đã mã hoá (AES-GCM, khoá sinh từ mật khẩu bằng PBKDF2-SHA256),
// để repo công khai mà người ngoài không đọc được. Tạo file bằng tools/ma-hoa.mjs.
const SEED_URL = 'data/gia-dinh.enc.json';
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
// Nhớ mật khẩu trên máy này để tự nạp lịch mới mỗi khi file mã hoá đổi (mỗi lần mã hoá có salt/iv mới).
const SEED_KEY = 'be-cham-ngoan-seed';
const getSeedMem = () => { try { return JSON.parse(localStorage.getItem(SEED_KEY) || 'null'); } catch (e) { return null; } };
export const setSeedMem = v => { try { v ? localStorage.setItem(SEED_KEY, JSON.stringify(v)) : localStorage.removeItem(SEED_KEY); } catch (e) {} };
const seedVer = f => f.salt + '.' + f.iv;
async function fetchSeed() {
  const r = await fetch(SEED_URL, { cache: 'no-store' });
  if (!r.ok) throw Object.assign(new Error('missing'), { code: 'missing' });
  return r.json();
}
export async function decryptSeed(pass, f) {
  f = f || await fetchSeed();
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(f.salt), iterations: f.iter }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  let plain;
  try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(f.iv) }, key, b64(f.ct)); }
  catch (e) { throw Object.assign(new Error('wrong'), { code: 'wrong' }); }
  return { json: JSON.parse(new TextDecoder().decode(plain)), ver: seedVer(f) };
}
// Lúc mở app: nếu máy này đã nhớ mật khẩu và lịch lưu sẵn có bản mới thì tự nạp.
let seedChecked = false;
export const setSeedChecked = v => { seedChecked = v; };
export async function autoSeed() {
  if (seedChecked) return; seedChecked = true;
  const mem = getSeedMem(); if (!mem?.pass || !crypto?.subtle) return;
  try {
    const f = await fetchSeed();
    if (seedVer(f) === mem.ver) return;
    const { json, ver } = await decryptSeed(mem.pass, f);
    await importData(json, true);
    setSeedMem({ ...mem, ver });
    toast('Đã tự nạp lịch gia đình bản mới.');
  } catch (e) {
    if (e.code === 'wrong') { setSeedMem(null); toast('Lịch gia đình đã đổi mật khẩu. Vào Gia đình để nạp lại.'); }
    else console.warn('Không tự nạp được lịch gia đình', e);
  }
}
export function seedForm() {
  openModal(`<h2>Nạp lịch gia đình</h2>
  <p class="muted small lead">Lịch của các con được lưu sẵn trong app dưới dạng mã hoá. Gõ mật khẩu gia đình để nạp vào máy này. Dữ liệu được gộp vào bảng hiện có, không xoá gì.</p>
  <div class="fg">
    ${frow('Mật khẩu', `<input id="seedpass" class="input" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false">`, { id: 'seedpass', cls: 'col' })}
    <div class="fr">${toggle('seedmem', 'Nhớ trên máy này <span class="fs">Tự nạp khi lịch có bản mới</span>', true)}</div>
  </div>
  <div class="foot"><button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="seed-load">Nạp lịch</button></div>`);
}
