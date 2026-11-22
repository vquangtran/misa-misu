// Bộ kiểm tra của Misa Misu: mở app trong Chromium (Playwright), đi qua mọi màn ở hai khổ màn hình, ghi lại
// innerHTML của #app, #km, #modal (kèm thanh tab, thông báo, bản in) và localStorage sau từng bước. So hai lần chạy
// (ví dụ bản main và bản đang sửa) để biết giao diện và dữ liệu có giống hệt nhau không.
//
// Không bao giờ chạm vào Firebase thật: js/config.js bị chặn và trả về `export const firebaseConfig = null;`
// nên app chỉ lưu trên trình duyệt. Mọi request ra ngoài máy đều bị chặn. Giờ cố định bằng page.clock,
// múi giờ Asia/Ho_Chi_Minh, Math.random và crypto.getRandomValues là hàm cố định, nên mã ngẫu nhiên lần nào cũng như nhau.
//
// Cách dùng (chạy ở thư mục gốc của repo):
//   node tools/kiem-tra/chay.mjs chay --ra /tmp/truoc.json            chạy mọi màn, ghi kết quả
//   node tools/kiem-tra/chay.mjs chay --ra /tmp/sau.json --so /tmp/truoc.json   chạy rồi so với lần trước
//   node tools/kiem-tra/chay.mjs so /tmp/truoc.json /tmp/sau.json      so hai kết quả đã có
//   node tools/kiem-tra/chay.mjs tao-diem-xuat-phat                   chụp lại diem-xuat-phat.json (chỉ khi đổi dữ liệu thử)
//   node tools/kiem-tra/chay.mjs liet-ke '#lich-hoc'                  liệt kê các nút data-act trên một màn (để viết thêm bước)
// Tuỳ chọn: --goc <thư mục app> (mặc định: thư mục gốc của repo), --kho 390 hoặc --kho 1280 (chỉ chạy một khổ),
//           --canh <tên> (chỉ chạy một cảnh), --tu-dau (cảnh mở đầu chạy cả ở khổ thứ hai).
//
// Mỗi lần chạy bắt đầu từ diem-xuat-phat.json: localStorage chụp sau lần mở đầu tiên với dữ liệu thử (du-lieu-thu.mjs).
// Riêng cảnh "mo-dau" chạy lại lần mở đầu từ dữ liệu thử, để kiểm tra phần app tự thêm và tự sửa dữ liệu (js/mot-lan.js).
// Trước khi mở trình duyệt, chay còn kiểm tra tĩnh các module trong js/ (module.mjs): import, tên chưa khai báo, vòng import.
// Các bước của từng cảnh nằm trong canh.mjs.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { duLieuThu } from './du-lieu-thu.mjs';
import { CANH } from './canh.mjs';
import { kiemTraModule } from './module.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const DIEM = join(HERE, 'diem-xuat-phat.json');
const { chromium } = createRequire(import.meta.url)('playwright');

// Giờ của lần mở đầu (dữ liệu thử) và giờ của các lần chạy: thứ Hai 23/11/2026, 18:30, buổi tối có học thêm.
export const GIO_MO_DAU = '2026-11-16T07:30:00+07:00';
export const GIO_CHAY = '2026-11-23T18:30:00+07:00';
const KHO = { 390: { width: 390, height: 844 }, 1280: { width: 1280, height: 860 } };
const KEY = 'be-cham-ngoan-v1';
export const PIN = '1234';
export const pinHash = pin => createHash('sha256').update('misa-misu:' + pin).digest('hex');

const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = s => createHash('sha1').update(String(s)).digest('hex').slice(0, 16);

// ---------- máy chủ tĩnh ----------
const freePort = () => new Promise((ok, no) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); s.on('error', no); });
async function startServer(dir) {
  const port = await freePort();
  const proc = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: dir, stdio: 'ignore' });
  const origin = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { try { const r = await fetch(origin + '/index.html'); if (r.ok) return { origin, stop: () => proc.kill() }; } catch (e) {} await sleep(100); }
  proc.kill(); throw new Error('Không mở được python3 -m http.server');
}

// ---------- trình duyệt ----------
// Chạy trước mọi script của trang: số ngẫu nhiên cố định, không in, không đụng bộ nhớ tạm.
function initScript() {
  const prng = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  Math.random = prng(20261122);
  const bytes = prng(97);
  crypto.getRandomValues = a => { const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); for (let i = 0; i < u.length; i++) u[i] = Math.floor(bytes() * 256); return a; };
  window.print = () => {};
  try { if (navigator.clipboard) navigator.clipboard.writeText = () => Promise.resolve(); } catch (e) {}
}

export async function newPage(browser, origin, { kho, ls, gio }) {
  const ctx = await browser.newContext({
    viewport: KHO[kho], timezoneId: 'Asia/Ho_Chi_Minh', locale: 'vi-VN', deviceScaleFactor: 1,
    storageState: { cookies: [], origins: [{ origin, localStorage: Object.entries(ls || {}).map(([name, value]) => ({ name, value })) }] },
  });
  const st = { errs: [], inflight: 0 };
  await ctx.route('**/*', route => {
    const u = new URL(route.request().url());
    if (u.origin === origin) return route.fallback();
    if (u.hostname === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    st.errs.push('chặn request ra ngoài: ' + u.href);
    return route.abort();
  });
  await ctx.route('**/js/config.js', route => route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: 'export const firebaseConfig = null;\n' }));
  // Sổ học tự nhập từ data/*.json: nhiều file được tải cùng lúc và app làm tiếp tuỳ file nào về trước. Trả từng file một,
  // theo thứ tự app xin, cách nhau một chút, để lần chạy nào cũng đi đúng một đường.
  let gate = Promise.resolve();
  await ctx.route('**/data/*.json', async route => {
    const prev = gate; let release; gate = new Promise(r => (release = r));
    await prev;
    try { await route.fulfill({ response: await route.fetch() }); } finally { setTimeout(release, 400); }
  });
  await ctx.addInitScript(initScript);
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date(gio));
  page.on('pageerror', e => st.errs.push('lỗi JS: ' + (e.stack || e.message)));
  page.on('console', m => { if (m.type() === 'error') st.errs.push('console.error: ' + m.text()); });
  page.on('request', () => st.inflight++);
  page.on('requestfinished', () => st.inflight--);
  page.on('requestfailed', r => { st.inflight--; if (new URL(r.url()).origin === origin) st.errs.push('không tải được: ' + r.url()); });
  page.on('response', r => { if (r.status() >= 400) st.errs.push(`HTTP ${r.status()}: ${r.url()}`); });
  return { ctx, page, st };
}

// Chờ app vẽ xong: không còn request đang chạy và trang không đổi qua vài khung hình liên tiếp.
const SIG = () => {
  let h = 0; const add = s => { s = String(s ?? ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; };
  for (const id of ['app', 'km', 'modal', 'rail', 'tabs', 'toast', 'print-area']) add(document.getElementById(id)?.innerHTML);
  for (const k of Object.keys(localStorage).sort()) { add(k); add(localStorage.getItem(k)); }
  return h + ':' + location.href;
};
export async function settle(page, st, max = 6000) {
  const t0 = Date.now(); let prev = null, same = 0;
  while (Date.now() - t0 < max) {
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))));
    const sig = await page.evaluate(SIG);
    if (sig === prev && st.inflight <= 0) { if (++same >= 3) return; } else { same = 0; prev = sig; }
    await sleep(30);
  }
  st.errs.push('trang chưa ổn định sau ' + max + 'ms');
}
const CAPTURE = () => {
  const g = id => document.getElementById(id) || {};
  const ls = {}; try { for (const k of Object.keys(localStorage).sort()) ls[k] = localStorage.getItem(k); } catch (e) {}
  return { app: g('app').innerHTML, km: g('km').innerHTML, modal: g('modal').innerHTML, nav: g('rail').innerHTML + '\n' + g('tabs').innerHTML,
    flags: JSON.stringify({ appCls: g('app').className, km: g('km').hidden, kmCls: g('km').className, modal: g('modal').hidden, setup: g('setup').hidden, setupHtml: g('setup').innerHTML }),
    toast: g('toast').textContent, print: g('print-area').className + '\n' + g('print-area').innerHTML, url: location.pathname + location.search + location.hash, ls: JSON.stringify(ls) };
};

// ---------- một cảnh: chuỗi thao tác, chụp lại sau mỗi thao tác ----------
class Canh {
  constructor(run, name, page, st, kho, origin) { Object.assign(this, { run, name, page, st, kho, origin, n: 0 }); }
  async snap(label) {
    const c = await this.page.evaluate(CAPTURE);
    const rec = { canh: this.name, kho: this.kho, buoc: `${String(++this.n).padStart(3, '0')} ${label}`, loi: this.st.errs.splice(0) };
    // Cổng của máy chủ thử đổi mỗi lần chạy: thay địa chỉ bằng một tên cố định để so được.
    for (const [k, v] of Object.entries(c)) rec[k] = this.run.blob(String(v ?? '').split(this.origin).join('http://may-thu'));
    this.run.steps.push(rec);
    if (rec.loi.length) console.log(`  ! ${this.name} [${this.kho}] ${rec.buoc}: ${rec.loi.join(' | ').slice(0, 400)}`);
    return c;
  }
  async go(path, label = 'mở ' + path) { await this.page.goto(this.origin + path); await settle(this.page, this.st); return this.snap(label); }
  async reload(label = 'tải lại') { await this.page.reload(); await settle(this.page, this.st); return this.snap(label); }
  async hash(h, label = 'đi tới ' + h) { await this.page.evaluate(x => { location.hash = x; }, h); await settle(this.page, this.st); return this.snap(label); }
  // Bấm bằng element.click() (đi qua bộ xử lý data-act như bấm tay), không phụ thuộc lớp phủ hay hiệu ứng.
  async click(sel, { text, nth = 0, label, optional = false } = {}) {
    const ok = await this.page.evaluate(([sel, text, nth]) => {
      const list = [...document.querySelectorAll(sel)].filter(el => !text || el.textContent.includes(text));
      const el = list[nth]; if (!el) return false; el.click(); return true;
    }, [sel, text || '', nth]);
    if (!ok) { if (optional) return null; this.st.errs.push(`không thấy ${sel}${text ? ` có chữ "${text}"` : ''}${nth ? ` thứ ${nth + 1}` : ''}`); }
    await settle(this.page, this.st);
    return this.snap(label || `bấm ${sel}${text ? ` "${text}"` : ''}${nth ? ` #${nth + 1}` : ''}`);
  }
  // Chọn một ô radio hoặc checkbox rồi phát sự kiện change (như khi bấm).
  async check(sel, on = true, label) {
    const ok = await this.page.evaluate(([sel, on]) => { const el = document.querySelector(sel); if (!el) return false; el.checked = on; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; }, [sel, on]);
    if (!ok) this.st.errs.push('không thấy ' + sel);
    await settle(this.page, this.st);
    return this.snap(label || `chọn ${sel}${on ? '' : ' (bỏ)'}`);
  }
  // Gõ vào ô (đặt giá trị rồi phát input, change). Nhiều ô một lúc: fill({ '#a': 'x', '#b': 'y' }).
  async fill(map, label) {
    const miss = await this.page.evaluate(map => Object.entries(map).filter(([sel, v]) => {
      const el = document.querySelector(sel); if (!el) return true;
      el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return false;
    }).map(([s]) => s), map);
    for (const s of miss) this.st.errs.push('không thấy ô ' + s);
    await settle(this.page, this.st);
    return this.snap(label || 'gõ ' + Object.keys(map).join(', '));
  }
  // Giữ nút (chế độ cho bé: Giữ để thoát).
  async hold(sel, ms = 1400, label) {
    const ok = await this.page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return false; el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return true; }, sel);
    if (!ok) this.st.errs.push('không thấy ' + sel);
    await sleep(ms);
    await settle(this.page, this.st);
    return this.snap(label || 'giữ ' + sel);
  }
  async key(sel, k, label) {
    await this.page.evaluate(([sel, k]) => { const el = document.querySelector(sel) || document.body; el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); }, [sel, k]);
    await settle(this.page, this.st);
    return this.snap(label || `phím ${k}`);
  }
  // Đọc dữ liệu trong trang (ví dụ mã sổ học) mà không chụp.
  eval(f, a) { return this.page.evaluate(f, a); }
}

// ---------- chạy ----------
const diemXuatPhat = () => {
  if (!existsSync(DIEM)) throw new Error('Chưa có diem-xuat-phat.json. Chạy: node tools/kiem-tra/chay.mjs tao-diem-xuat-phat');
  return JSON.parse(readFileSync(DIEM, 'utf8'));
};
export const seedLs = () => ({ [KEY]: JSON.stringify(duLieuThu()) });

// Lần mở đầu: mở app với dữ liệu thử, chờ app tự thêm, tự tạo sổ và tự nhập sổ xong, rồi tải lại hai lần
// (mỗi lần mở app làm tiếp phần còn dở, ví dụ sổ chưa nhập vì đang bận nhập sổ khác). Trả về localStorage cuối cùng.
export async function moDau(c) {
  await c.go('/', 'mở lần đầu với dữ liệu thử');
  await settle(c.page, c.st, 15000);
  await c.snap('sau khi app tự thêm, tự nhập sổ');
  await c.reload('tải lại lần 1');
  await c.reload('tải lại lần 2');
  return c.eval(() => { const ls = {}; for (const k of Object.keys(localStorage).sort()) ls[k] = localStorage.getItem(k); return ls; });
}

async function runAll() {
  const goc = resolve(opt('--goc') || ROOT), out = opt('--ra');
  const khos = opt('--kho') ? [Number(opt('--kho'))] : [390, 1280], only = opt('--canh');
  const diem = diemXuatPhat();
  // Kiểm tra tĩnh các module trước (import, biến chưa khai báo, vòng import), xem module.mjs.
  const mk = kiemTraModule(join(goc, 'js'));
  if (mk.skip) console.log(mk.skip);
  else console.log(`Kiểm tra module: ${mk.files} file, ${mk.errors.length} lỗi, ${mk.warns.length} cảnh báo.` + [...mk.errors.map(e => '\n  LỖI: ' + e), ...mk.warns.map(w => '\n  Cảnh báo: ' + w)].join(''));
  const srv = await startServer(goc), browser = await chromium.launch();
  const run = { blobs: {}, steps: [], blob(v) { const h = sha(v); this.blobs[h] = v; return h; } };
  const t0 = Date.now();
  try {
    for (const kho of khos) {
      for (const canh of CANH) {
        if (only && canh.ten !== only) continue;
        if (canh.ten === 'mo-dau' && kho !== khos[0] && !args.includes('--tu-dau')) continue;
        const ls = canh.ten === 'mo-dau' ? seedLs() : canh.sua ? canh.sua(JSON.parse(JSON.stringify(diem.ls)), { pinHash, PIN }) : diem.ls;
        const { ctx, page, st } = await newPage(browser, srv.origin, { kho, ls, gio: canh.ten === 'mo-dau' ? GIO_MO_DAU : GIO_CHAY });
        const c = new Canh(run, canh.ten, page, st, kho, srv.origin);
        process.stdout.write(`${canh.ten} [${kho}] `);
        try { await canh.chay(c, { diem, moDau, pinHash, PIN }); } catch (e) { st.errs.push('cảnh bị dừng: ' + (e.stack || e.message)); await c.snap('cảnh bị dừng').catch(() => {}); }
        if (st.errs.length) await c.snap('lỗi còn lại').catch(() => {});
        console.log(`${c.n} bước`);
        await ctx.close();
      }
    }
  } finally { await browser.close(); srv.stop(); }
  const loi = run.steps.reduce((a, s) => a + s.loi.length, 0);
  console.log(`Xong ${run.steps.length} bước trong ${Math.round((Date.now() - t0) / 1000)} giây, ${loi} lỗi.`);
  const res = { goc, gio: GIO_CHAY, diem: sha(JSON.stringify(diem.ls)), steps: run.steps, blobs: run.blobs };
  if (out) { mkdirSync(dirname(resolve(out)), { recursive: true }); writeFileSync(out, JSON.stringify(res)); console.log('Đã ghi ' + out); }
  let bad = loi > 0 || mk.errors.length > 0;
  if (opt('--so')) bad = compare(JSON.parse(readFileSync(opt('--so'), 'utf8')), res) || bad;
  process.exitCode = bad ? 1 : 0;
}

// ---------- so hai lần chạy ----------
function firstDiff(a, b) { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; }
const around = (s, i) => JSON.stringify(s.slice(Math.max(0, i - 120), i + 180));
function lsDiff(a, b) {
  const A = JSON.parse(a), B = JSON.parse(b), out = [];
  for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
    if (A[k] === B[k]) continue;
    if (A[k] == null || B[k] == null) { out.push(`  localStorage["${k}"] ${A[k] == null ? 'chỉ có ở lần sau' : 'chỉ có ở lần trước'}`); continue; }
    const i = firstDiff(A[k], B[k]);
    out.push(`  localStorage["${k}"] khác từ ký tự ${i}:\n    trước: ${around(A[k], i)}\n    sau:   ${around(B[k], i)}`);
  }
  return out;
}
export function compare(A, B) {
  const key = s => `${s.canh} [${s.kho}] ${s.buoc}`;
  const mapB = new Map(B.steps.map(s => [key(s), s]));
  const fields = ['app', 'km', 'modal', 'nav', 'flags', 'toast', 'print', 'url', 'ls'];
  let diff = 0, shown = 0;
  for (const a of A.steps) {
    const b = mapB.get(key(a));
    if (!b) { diff++; if (shown++ < 40) console.log(`THIẾU ở lần sau: ${key(a)}`); continue; }
    mapB.delete(key(a));
    for (const f of fields) {
      if (a[f] === b[f]) continue;
      diff++;
      if (shown++ >= 40) continue;
      const sa = A.blobs[a[f]], sb = B.blobs[b[f]];
      if (f === 'ls') console.log(`KHÁC ${key(a)}: localStorage\n${lsDiff(sa, sb).join('\n')}`);
      else { const i = firstDiff(sa, sb); console.log(`KHÁC ${key(a)}: ${f} từ ký tự ${i}\n  trước: ${around(sa, i)}\n  sau:   ${around(sb, i)}`); }
    }
  }
  for (const k of mapB.keys()) { diff++; if (shown++ < 40) console.log(`THỪA ở lần sau: ${k}`); }
  const errs = B.steps.reduce((n, s) => n + s.loi.length, 0);
  console.log(`So ${A.steps.length} bước với ${B.steps.length} bước: ${diff ? diff + ' chỗ khác' : 'giống hệt'}; lỗi ở lần sau: ${errs}.`);
  return diff > 0 || errs > 0;
}

// ---------- chụp điểm xuất phát ----------
async function taoDiem() {
  const goc = resolve(opt('--goc') || ROOT);
  const srv = await startServer(goc), browser = await chromium.launch();
  const run = { blobs: {}, steps: [], blob(v) { const h = sha(v); this.blobs[h] = v; return h; } };
  try {
    const { ctx, page, st } = await newPage(browser, srv.origin, { kho: 390, ls: seedLs(), gio: GIO_MO_DAU });
    const c = new Canh(run, 'mo-dau', page, st, 390, srv.origin);
    const ls = await moDau(c);
    const loi = run.steps.flatMap(s => s.loi);
    if (loi.length) { console.log('Có lỗi, không ghi:\n' + loi.join('\n')); process.exitCode = 1; return; }
    writeFileSync(DIEM, JSON.stringify({ ghiChu: 'localStorage sau lần mở đầu với du-lieu-thu.mjs, lúc ' + GIO_MO_DAU + '. Tạo bằng: node tools/kiem-tra/chay.mjs tao-diem-xuat-phat', ls }, null, 1) + '\n');
    console.log(`Đã ghi ${DIEM} (${Object.keys(ls).length} khoá, ${JSON.stringify(ls).length} ký tự).`);
    await ctx.close();
  } finally { await browser.close(); srv.stop(); }
}

// ---------- liệt kê nút trên một màn ----------
async function lietKe() {
  const where = args[1] || '/', goc = resolve(opt('--goc') || ROOT), kho = Number(opt('--kho') || 390);
  const srv = await startServer(goc), browser = await chromium.launch();
  try {
    const { page, st } = await newPage(browser, srv.origin, { kho, ls: diemXuatPhat().ls, gio: GIO_CHAY });
    await page.goto(srv.origin + (where.startsWith('#') ? '/' + where : where)); await settle(page, st);
    const list = await page.evaluate(() => [...document.querySelectorAll('[data-act]')].map(el => {
      const d = { ...el.dataset }; const act = d.act; delete d.act;
      return `${act} ${Object.entries(d).map(([k, v]) => `${k}=${v}`).join(' ')} | ${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)}`;
    }));
    console.log(list.join('\n'));
    if (st.errs.length) console.log('Lỗi:', st.errs);
  } finally { await browser.close(); srv.stop(); }
}

const cmd = args[0];
if (cmd === 'chay') await runAll();
else if (cmd === 'so') process.exitCode = compare(JSON.parse(readFileSync(args[1], 'utf8')), JSON.parse(readFileSync(args[2], 'utf8'))) ? 1 : 0;
else if (cmd === 'tao-diem-xuat-phat') await taoDiem();
else if (cmd === 'liet-ke') await lietKe();
else if (import.meta.url === `file://${process.argv[1]}`) console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).join('\n'));
