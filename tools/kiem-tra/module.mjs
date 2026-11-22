// Kiểm tra tĩnh các module trong js/ (không cần mở trình duyệt):
//   - mỗi tên import đều được module kia export;
//   - không gán lại biến import (module khác chỉ đọc được, muốn đổi thì gọi hàm set… của module chủ);
//   - không dùng tên chưa khai báo hay chưa import (lỗi này chỉ hiện khi chạy tới đúng dòng đó);
//   - vòng import: mã chạy ngay khi nạp file (ngoài hàm) không được dùng tên của module cùng vòng;
//   - import thừa (cảnh báo).
// Cách dùng: node tools/kiem-tra/module.mjs   (chay.mjs cũng gọi phần này trước khi mở trình duyệt)
// Cần acorn và eslint-scope (có sẵn cùng Playwright hoặc ESLint cài toàn máy).
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const JS = resolve(HERE, '../../js');

function loadParser() {
  const req = createRequire(import.meta.url);
  for (const base of ['playwright', 'eslint']) {
    try { const r = createRequire(req.resolve(base)); return { acorn: r('acorn'), escope: r('eslint-scope') }; } catch (e) { /* thử chỗ khác */ }
  }
  try { return { acorn: req('acorn'), escope: req('eslint-scope') }; } catch (e) { return null; }
}

// Tên có sẵn trong trình duyệt mà Node không có.
const BROWSER = new Set(['window', 'document', 'localStorage', 'sessionStorage', 'location', 'history', 'navigator', 'matchMedia', 'requestAnimationFrame',
  'cancelAnimationFrame', 'createImageBitmap', 'Image', 'getComputedStyle', 'KeyboardEvent', 'PointerEvent', 'MutationObserver', 'HTMLElement', 'Node', 'NodeFilter',
  'DOMParser', 'XMLSerializer', 'FileReader', 'Event', 'CustomEvent', 'visualViewport', 'innerWidth', 'innerHeight', 'alert', 'confirm']);

export function kiemTraModule(dir = JS) {
  const p = loadParser();
  if (!p) return { skip: 'Không tìm thấy acorn và eslint-scope: bỏ qua phần kiểm tra module.', errors: [], warns: [] };
  const files = readdirSync(dir).filter(f => f.endsWith('.js')).sort();
  const errors = [], warns = [], mods = {};
  for (const f of files) {
    const src = readFileSync(join(dir, f), 'utf8');
    let ast;
    try { ast = p.acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', locations: true, ranges: true }); }
    catch (e) { errors.push(`${f}: lỗi cú pháp ${e.message}`); continue; }
    const sm = p.escope.analyze(ast, { ecmaVersion: 2024, sourceType: 'module' });
    const scope = sm.globalScope.childScopes.find(s => s.type === 'module');
    const exports = new Set(), imports = [];
    for (const n of ast.body) {
      if (n.type === 'ExportNamedDeclaration') {
        if (n.declaration?.declarations) n.declaration.declarations.forEach(d => exports.add(d.id.name));
        else if (n.declaration?.id) exports.add(n.declaration.id.name);
        for (const s of n.specifiers || []) exports.add(s.exported.name);
      }
      if (n.type === 'ImportDeclaration' && n.source.value.startsWith('./'))
        imports.push({ from: n.source.value.slice(2), names: n.specifiers.map(s => ({ local: s.local.name, imported: s.imported?.name || 'default', line: s.loc.start.line })) });
    }
    mods[f] = { src, ast, scope, sm, exports, imports };
  }
  // Import đúng tên.
  for (const [f, m] of Object.entries(mods)) for (const im of m.imports) {
    const t = mods[im.from];
    if (!t) { errors.push(`${f}: import từ ./${im.from} nhưng không có file này`); continue; }
    for (const n of im.names) if (!t.exports.has(n.imported)) errors.push(`${f}:${n.line}: ./${im.from} không export "${n.imported}"`);
  }
  // Vòng import (Tarjan).
  const edges = Object.fromEntries(Object.entries(mods).map(([f, m]) => [f, m.imports.map(i => i.from).filter(x => mods[x])]));
  const idx = {}, low = {}, on = new Set(), stack = [], scc = {}; let i = 0, nScc = 0;
  const visit = v => { idx[v] = low[v] = i++; stack.push(v); on.add(v);
    for (const w of edges[v]) { if (idx[w] === undefined) { visit(w); low[v] = Math.min(low[v], low[w]); } else if (on.has(w)) low[v] = Math.min(low[v], idx[w]); }
    if (low[v] === idx[v]) { const c = []; let w; do { w = stack.pop(); on.delete(w); c.push(w); } while (w !== v); nScc++; for (const x of c) scc[x] = c.length > 1 ? nScc : 0; if (c.length > 1) warns.push('Vòng import: ' + c.join(' ↔ ')); } };
  for (const f of Object.keys(mods)) if (idx[f] === undefined) visit(f);
  const inFn = s => { for (; s && s.type !== 'module'; s = s.upper) if (s.type === 'function') return true; return false; };
  const nodeGlobals = new Set(Object.getOwnPropertyNames(globalThis));
  for (const [f, m] of Object.entries(mods)) {
    const owner = {};
    for (const im of m.imports) for (const n of im.names) owner[n.local] = im.from;
    for (const v of m.scope.variables) {
      const from = owner[v.name];
      if (!from) continue;
      if (!v.references.length) warns.push(`${f}: import thừa "${v.name}" từ ./${from}`);
      for (const r of v.references) {
        if (r.isWrite()) errors.push(`${f}:${r.identifier.loc.start.line}: gán lại biến import "${v.name}" (của ./${from}); hãy gọi hàm set… của module đó`);
        if (!inFn(r.from) && scc[f] && scc[f] === scc[from]) errors.push(`${f}:${r.identifier.loc.start.line}: dùng "${v.name}" của ./${from} (cùng vòng import) ngay khi nạp file`);
      }
    }
    // Tên chưa khai báo.
    for (const r of m.sm.globalScope.through) {
      const n = r.identifier.name;
      if (!nodeGlobals.has(n) && !BROWSER.has(n)) errors.push(`${f}:${r.identifier.loc.start.line}: dùng "${n}" nhưng chưa khai báo hay import`);
    }
  }
  return { errors, warns, files: files.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = kiemTraModule();
  if (r.skip) console.log(r.skip);
  for (const w of r.warns) console.log('Cảnh báo: ' + w);
  for (const e of r.errors) console.log('LỖI: ' + e);
  if (!r.skip) console.log(`Đã kiểm tra ${r.files} file: ${r.errors.length} lỗi, ${r.warns.length} cảnh báo.`);
  process.exitCode = r.errors.length ? 1 : 0;
}
