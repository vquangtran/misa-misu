// Form và sheet: mở, đóng form (modal), các dòng của form dạng nhóm thẻ, sheet liệt kê lựa chọn (menu ⋯ và +).
import { icon } from './icons.js';
import { $, CHEV, esc, toast } from './chung.js';
import { kidsList, UI } from './du-lieu.js';
import { mini } from './giao-dien.js';

// Công tắc bật/tắt cho một lựa chọn đơn.
export const toggle = (id, label, on, cls = '', attr = '') => `<label class="toggle ${cls}" ${attr}><span>${label}</span><input type="checkbox" id="${id}" ${on ? 'checked' : ''}></label>`;
// ---------- form dạng nhóm thẻ: mỗi dòng một nhãn bên trái và giá trị bên phải ----------
// Một dòng: nhãn (kèm dòng giải thích nhỏ) bên trái, giá trị bên phải. cls 'col': giá trị nằm dưới nhãn, rộng hết dòng.
export const frow = (label, right, { sub = '', id = '', cls = '', hidden = false, subId = '' } = {}) => `<div class="fr ${cls}" ${hidden ? 'hidden' : ''}><div class="fl">${id ? `<label for="${id}">${label}</label>` : `<span class="lbl">${label}</span>`}${sub || subId ? `<span class="fs" ${subId ? `id="${subId}"` : ''}>${sub}</span>` : ''}</div>${right}</div>`;
// Giá trị dạng viên: bấm vào là mở danh sách chọn của máy.
export const pillSel = (id, opts, val, cls = '') => `<select id="${id}" class="pillsel ${cls}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
// Ô số dạng viên, có đơn vị; step > 0 thì thêm nút − và +.
export const pillNum = (id, val, { step = 0, unit = 'đ', attr = '', ph = '' } = {}) => `<div class="pillnum">${step ? `<button data-act="num-step" data-t="${id}" data-n="${-step}" data-min="0" aria-label="Bớt ${step.toLocaleString('vi-VN')}">−</button>` : ''}<input id="${id}" class="num" type="number" inputmode="numeric" value="${val}" placeholder="${ph}" ${attr}><span>${unit}</span>${step ? `<button data-act="num-step" data-t="${id}" data-n="${step}" data-min="0" aria-label="Thêm ${step.toLocaleString('vi-VN')}">+</button>` : ''}</div>`;
// Thẻ trên cùng của form: tên thật to; nếu có bộ biểu tượng thì hình đang chọn nằm bên phải, bấm để đổi.
export const titleCard = (id, val, ph, { max = 40, icoName = '', icons = [], ico = '', attr = '' } = {}) => {
  const cur = ico || icons[0] || '';
  return `<div class="fg f-title"><div class="ft"><input id="${id}" class="input ft-input" maxlength="${max}" value="${esc(val || '')}" placeholder="${ph}" aria-label="${ph}" autocomplete="off" ${attr}>
    ${icoName ? `<button class="ico-btn" data-act="ico-toggle" aria-expanded="false" aria-label="Chọn biểu tượng"><span class="ico-now">${icon(cur)}</span></button>` : ''}</div>
    ${icoName ? `<div class="ico-pick" hidden>${pickGrid(icoName, icons.includes(cur) ? icons : [cur, ...icons], cur)}</div>` : ''}</div>`;
};
// Dòng chọn con: một con (radio) hoặc nhiều con (checkbox). Nhà đông con thì các viên xuống dòng dưới nhãn.
export const kidRow = (label, name, type, sel, sub = '') => { const kids = kidsList();
  return frow(label, `<div class="seg kids">${kids.map(k => `<label><input type="${type}" name="${name}" value="${k.id}" ${sel.includes(k.id) ? 'checked' : ''}><span>${mini(k)} ${esc(k.name)}</span></label>`).join('')}</div>`, { sub, cls: kids.length > 2 ? 'col' : '' }); };
export const formFoot = (delAct, id, saveAct, saveLabel = 'Lưu', delLabel = 'Xoá') => `<div class="foot">${delAct ? `<button class="btn danger left" data-act="${delAct}" data-id="${id}">${delLabel}</button>` : ''}<button class="btn quiet" data-act="close">Huỷ</button><button class="btn primary" data-act="${saveAct}" data-id="${id || ''}">${saveLabel}</button></div>`;
// Sheet liệt kê vài lựa chọn (menu ⋯ và nút + của các màn).
export const menuRow = (attr, ic, t, sub = '', off = false) => `<button class="item nav" ${attr} ${off ? 'disabled' : ''}><span class="ico">${ic}</span><span class="txt"><span class="t">${t}</span>${sub ? `<span class="s">${sub}</span>` : ''}</span>${CHEV}</button>`;
export const menuSheet = (title, rows) => openModal(`<h2>${title}</h2><div class="fg"><div class="list menu">${rows.join('')}</div></div><div class="foot"><button class="btn quiet" data-act="close">Đóng</button></div>`);

// ---------- modal ----------
export function openModal(html, wide, keep) {
  const m = $('#modal');
  // keep: vẽ lại form đang mở (ví dụ đổi ngày), giữ nguyên vị trí cuộn và không nhảy con trỏ.
  const top = keep && !m.hidden ? m.querySelector('.dialog')?.scrollTop || 0 : 0;
  m.innerHTML = `<div class="dialog ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
  const dlg = m.querySelector('.dialog'), h2 = dlg.querySelector(':scope > h2'), foot = dlg.querySelector(':scope > .foot');
  // Thanh trên cùng như sheet của iOS: Huỷ bên trái, tên form ở giữa, nút chính (Lưu) bên phải, luôn trong tầm mắt dù form dài.
  // Nút Xoá ở lại cuối form.
  if (h2 && foot) {
    const bar = document.createElement('div'); bar.className = 'sheet-bar';
    const side = b => b || document.createElement('span');
    bar.append(side(foot.querySelector('[data-act=close]')), h2, side(foot.querySelector('.btn.primary')));
    dlg.prepend(bar);
    if (!foot.children.length) foot.remove();
  }
  m.hidden = false;
  if (keep) { dlg.scrollTop = top; return; }
  modalDirty = false;
  // Form thêm mới thì đặt con trỏ vào ô đầu tiên. Form sửa không bật bàn phím che mất nội dung.
  const f = dlg.querySelector('input.input:not([type=date]):not([type=time]):not([type=number])');
  if (f && !f.value && !wide) f.focus(); else dlg.focus();
  dlg.querySelectorAll('.pick input:checked').forEach(x => { const sp = x.nextElementSibling, box = x.closest('.pick'); if (sp && box.scrollWidth > box.clientWidth) box.scrollLeft = Math.max(0, sp.offsetLeft - box.clientWidth / 2); });
}
// Việc cần làm trước khi đóng form, do module khác thêm vào bằng onCloseModal (sổ học: xoá file vừa tải lên mà chưa lưu).
const modalClosers = [];
export const onCloseModal = f => { modalClosers.push(f); };
export function closeModal() { for (const f of modalClosers) f(); $('#modal').hidden = true; $('#modal').innerHTML = ''; UI.sheet = false; modalDirty = false; }
// Form đã gõ hoặc chọn gì đó thì bấm ra ngoài / phím Esc không đóng, tránh mất công nhập. Muốn bỏ thì bấm Huỷ.
let modalDirty = false;
export const setModalDirty = v => { modalDirty = v; };
export function dismissModal() {
  if (modalDirty && !UI.sheet && !$('#modal .qa')) return toast('Chưa lưu. Bấm Lưu để giữ, hoặc Huỷ để bỏ.');
  closeModal();
}
export const pickGrid = (name, list, val) => `<div class="pick" role="radiogroup">${list.map((e, i) => `<label><input type="radio" name="${name}" value="${e}" ${(val ? val === e : i === 0) ? 'checked' : ''} aria-label="${e}"><span>${e}</span></label>`).join('')}</div>`;
export const radioVal = n => { const r = document.querySelector(`#modal input[name="${n}"]:checked, #app input[name="${n}"]:checked`); return r ? r.value : null; };
export const DAY_SETS = [['0,1,2,3,4,5,6', 'Mỗi ngày'], ['1,2,3,4,5', 'Ngày thường'], ['0,6', 'Cuối tuần']];
export const daySet = days => { const k = [...days].map(Number).sort().join(); return DAY_SETS.some(x => x[0] === k) ? k : 'custom'; };
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') dismissModal(); else if (e.target.closest('button:not([data-act=close])')) modalDirty = true; });
$('#modal').addEventListener('input', () => { modalDirty = true; });
$('#modal').addEventListener('change', () => { modalDirty = true; });
