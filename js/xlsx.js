// Đọc file Excel (.xlsx) ngay trên trình duyệt, không cần thư viện ngoài.
// File .xlsx là một file zip chứa các file XML: đọc mục lục zip, giải nén bằng DecompressionStream('deflate-raw'),
// rồi lấy các ô của trang tính đầu tiên. Ô ngày tháng hay "7/10" mà Excel tự đổi thành ngày được trả về dạng số (số ngày kiểu Excel);
// nơi dùng tự đổi lại theo ý nghĩa của từng cột (xem excelDate).
//   readXlsx(file) → Promise<Array<Array<string|number|null>>>  (các hàng của trang tính đầu tiên)

const td = new TextDecoder();

async function inflate(bytes) {
  const ds = new DecompressionStream('deflate-raw');
  const out = new Response(new Blob([bytes]).stream().pipeThrough(ds));
  return new Uint8Array(await out.arrayBuffer());
}

// Mục lục zip (central directory) ở cuối file: tên file → { method, offset, size }.
function zipEntries(buf) {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('not-xlsx');
  const n = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const map = {};
  for (let k = 0; k < n; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('not-xlsx');
    const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true), nameLen = v.getUint16(p + 28, true);
    const extra = v.getUint16(p + 30, true), cmt = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true);
    map[td.decode(buf.subarray(p + 46, p + 46 + nameLen))] = { method, off, size };
    p += 46 + nameLen + extra + cmt;
  }
  return async name => {
    const e = map[name]; if (!e) return null;
    const start = e.off + 30 + v.getUint16(e.off + 26, true) + v.getUint16(e.off + 28, true), raw = buf.subarray(start, start + e.size);
    return td.decode(e.method === 0 ? raw : await inflate(raw));
  };
}

const xml = s => new DOMParser().parseFromString(s, 'application/xml');
const kids = (el, tag) => [...el.getElementsByTagName(tag)];
// "AB12" → cột 27 (đếm từ 0).
const colOf = ref => { let n = 0; for (const ch of String(ref).replace(/\d+/g, '')) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };

export async function readXlsx(file) {
  const get = zipEntries(new Uint8Array(await file.arrayBuffer()));
  const shared = [];
  const ss = await get('xl/sharedStrings.xml');
  if (ss) for (const si of kids(xml(ss), 'si')) shared.push(kids(si, 't').map(t => t.textContent).join(''));
  // Trang tính đầu tiên theo thứ tự trong workbook.
  let path = 'xl/worksheets/sheet1.xml';
  const wb = await get('xl/workbook.xml'), rels = await get('xl/_rels/workbook.xml.rels');
  if (wb && rels) {
    const first = kids(xml(wb), 'sheet')[0], rid = first && (first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
    const rel = rid && kids(xml(rels), 'Relationship').find(r => r.getAttribute('Id') === rid);
    if (rel) { const t = rel.getAttribute('Target'); path = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, ''); }
  }
  const sheet = await get(path); if (!sheet) throw new Error('not-xlsx');
  const rows = [];
  for (const r of kids(xml(sheet), 'row')) {
    const ri = Number(r.getAttribute('r')) - 1, row = [];
    for (const c of kids(r, 'c')) {
      const t = c.getAttribute('t'), v = kids(c, 'v')[0]?.textContent;
      let val = null;
      if (t === 's') val = shared[Number(v)] ?? null;
      else if (t === 'inlineStr') val = kids(c, 't').map(x => x.textContent).join('');
      else if (t === 'str' || t === 'e') val = v ?? null;
      else if (t === 'b') val = v === '1';
      else if (v != null && v !== '') val = Number(v);
      row[colOf(c.getAttribute('r'))] = val;
    }
    rows[ri >= 0 ? ri : rows.length] = row;
  }
  return Array.from(rows, r => Array.from(r || [], x => x ?? null));
}

// Số ngày kiểu Excel (tính từ 30/12/1899) → Date.
export const excelDate = n => new Date(Date.UTC(1899, 11, 30) + Math.round(Number(n)) * 86400000);
