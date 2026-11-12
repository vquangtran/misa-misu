// Hình đại diện vẽ bằng SVG, cùng phong cách với app: viền nâu đậm dày, khối tròn có bóng và điểm sáng như đồ chơi, nền tia nắng.
// Bộ gà (Su, thích màu vàng) và bộ ngựa (Sa, thích màu be, nâu), mỗi bộ 12 kiểu.
// Giá trị lưu ở kids.avatar: "svg:ga-3" (một kiểu cố định) hoặc "set:ga" (mỗi ngày một kiểu).
const O = '#3A2810';
const ln = (w = 3) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const SHADE = 'rgba(58,40,16,.13)';

// Nền: màu của bộ + tia nắng như màn chúc mừng.
function bg(base, ray) {
  let s = `<rect width="100" height="100" fill="${base}"/>`;
  for (let i = 0; i < 12; i++) {
    const a1 = (i * 30 - 90) * Math.PI / 180, a2 = (i * 30 - 75) * Math.PI / 180, p = (a, r) => `${(50 + r * Math.cos(a)).toFixed(1)} ${(58 + r * Math.sin(a)).toFixed(1)}`;
    s += `<path d="M50 58L${p(a1, 90)}L${p(a2, 90)}z" fill="${ray}"/>`;
  }
  return s;
}
const eyes = (y, happy) => happy
  ? `<path d="M36 ${y + 1}q4-5.5 8 0M56 ${y + 1}q4-5.5 8 0" fill="none" ${ln(3.2)}/>`
  : `<ellipse cx="40" cy="${y}" rx="4.4" ry="5" fill="${O}"/><ellipse cx="60" cy="${y}" rx="4.4" ry="5" fill="${O}"/><circle cx="41.6" cy="${y - 1.8}" r="1.7" fill="#fff"/><circle cx="61.6" cy="${y - 1.8}" r="1.7" fill="#fff"/>`;
const cheeks = y => `<ellipse cx="31" cy="${y}" rx="5.5" ry="3.4" fill="#FF8A7A" opacity=".45"/><ellipse cx="69" cy="${y}" rx="5.5" ry="3.4" fill="#FF8A7A" opacity=".45"/>`;
const shine = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.4" transform="rotate(-35 ${x} ${y})" fill="#fff" opacity=".75"/>`;

// Phụ kiện, tô bằng màu của bộ (p). e = độ cao mắt, t = đỉnh đầu, b = chỗ cài nơ/hoa.
function acc(kind, p, { e, t, b }) {
  const lip = (d, fill) => `<path d="${d}" fill="${fill}" ${ln()}/>`;
  switch (kind) {
    case 'glasses': return `<circle cx="40" cy="${e}" r="8" fill="#fff" fill-opacity=".3" ${ln(2.8)}/><circle cx="60" cy="${e}" r="8" fill="#fff" fill-opacity=".3" ${ln(2.8)}/><path d="M48 ${e}h4" ${ln(2.8)}/>`;
    case 'shades': return `<rect x="30.5" y="${e - 6.5}" width="19" height="13" rx="6" fill="${O}" ${ln(2.6)}/><rect x="50.5" y="${e - 6.5}" width="19" height="13" rx="6" fill="${O}" ${ln(2.6)}/><path d="M35 ${e - 2.5}l4-1.5M55 ${e - 2.5}l4-1.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
    case 'bow': { const [x, y] = b; return lip(`M${x} ${y}l-12-8c-2 5-2 11 0 16zM${x} ${y}l12-8c2 5 2 11 0 16z`, p.acc) + `<circle cx="${x}" cy="${y}" r="4" fill="${p.acc2}" ${ln(2.6)}/>`; }
    case 'flower': { const [x, y] = b; return [0, 72, 144, 216, 288].map(a => `<circle cx="${(x + 5.6 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(y + 5.6 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="4.6" fill="#FFFDF6" ${ln(2.2)}/>`).join('') + `<circle cx="${x}" cy="${y}" r="3.6" fill="#FFC633" ${ln(2.2)}/>`; }
    case 'crown': return lip(`M35 ${t + 5}l2-16 7.5 7.5L50 ${t - 15}l5.5 11.5 7.5-7.5 2 16z`, '#FFC633') + `<path d="M36 ${t + 1}h28" stroke="#E9A20C" stroke-width="2.4"/><circle cx="50" cy="${t - 3}" r="2.4" fill="#FF6B4A"/>`;
    case 'party': return lip(`M39 ${t + 4}L54 ${t - 15}L63 ${t + 4}z`, p.acc) + `<path d="M44 ${t - 2}l14 2M49 ${t - 9}l8 1" stroke="${p.acc2}" stroke-width="3.4" stroke-linecap="round"/><circle cx="54" cy="${t - 16}" r="4" fill="${p.acc2}" ${ln(2.4)}/>`;
    case 'phones': return `<path d="M21 ${e + 2}C21 ${t - 9} 79 ${t - 9} 79 ${e + 2}" fill="none" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M21 ${e + 2}C21 ${t - 9} 79 ${t - 9} 79 ${e + 2}" fill="none" stroke="${p.acc}" stroke-width="3.6" stroke-linecap="round"/>`
      + `<rect x="12" y="${e - 7}" width="13" height="19" rx="6" fill="${p.acc}" ${ln()}/><rect x="75" y="${e - 7}" width="13" height="19" rx="6" fill="${p.acc}" ${ln()}/>`;
    case 'stars': return `<path d="M19 22l2.4 5.6 5.6 2.4-5.6 2.4L19 38l-2.4-5.6L11 30l5.6-2.4zM82 30l1.8 4.2 4.2 1.8-4.2 1.8L82 42l-1.8-4.2L76 36l4.2-1.8z" fill="#FFC633" ${ln(2)}/>`;
    case 'band': return lip(`M22 ${t + 13}c15-7 41-7 56 0l-2 8c-15-6-37-6-52 0z`, p.acc) + `<circle cx="34" cy="${t + 15}" r="1.8" fill="#fff"/><circle cx="50" cy="${t + 11.5}" r="1.8" fill="#fff"/><circle cx="66" cy="${t + 15}" r="1.8" fill="#fff"/>`;
    case 'scarf': return lip(`M27 ${e + 30}c14 6 32 6 46 0l1 7c-15 7-33 7-48 0z`, p.acc) + lip(`M60 ${e + 35}l4 12 7-3-3-11z`, p.acc);
    default: return '';
  }
}

// Gà: thân tròn như quả trứng, mào đỏ cam, mỏ cam.
const GA = { bg: '#FFE9A6', ray: 'rgba(255,255,255,.45)', acc: '#FF9F2E', acc2: '#FFF3C9' };
function chicken(o) {
  let s = bg(GA.bg, GA.ray);
  if (o.tail) s += `<path d="M72 50c6-14 16-16 20-10-5 1-7 4-7 7 5-3 10-1 10 3-5 0-8 2-9 6 3-1 6 1 5 4-5-1-10 1-13 4z" fill="${o.tail}" ${ln()}/>`;
  if (o.chick) s += `<path d="M46 26c-1-6 3-9 6-6M50 27c2-7 8-7 9-3" fill="none" ${ln(3)}/>`;
  else s += `<path d="M37 32c-5-8 3-14 8-8-1-10 11-11 12-2 4-7 13-3 9 6z" fill="#FF6B4A" ${ln()}/>`;
  if (!o.egg) s += `<path d="M42 88v7m-3.5 0h7M58 88v7m-3.5 0h7" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M42 88v7m-3.5 0h7M58 88v7m-3.5 0h7" stroke="#FF9F1C" stroke-width="2.6" stroke-linecap="round"/>`;
  s += `<path d="M50 26c20 0 32 17 32 36 0 17-14 28-32 28S18 79 18 62c0-19 12-36 32-36z" fill="${o.body}" ${ln(3.2)}/>`;
  s += `<path d="M22 72c4 10 15 15 28 15s24-5 28-15c-6 6-16 9-28 9s-22-3-28-9z" fill="${SHADE}"/>`;
  if (o.belly) s += `<ellipse cx="50" cy="77" rx="14" ry="7.5" fill="${o.belly}"/>`;
  if (o.spots) s += `<circle cx="30" cy="48" r="2.6" fill="${o.spots}"/><circle cx="69" cy="44" r="2" fill="${o.spots}"/><circle cx="72" cy="74" r="2.6" fill="${o.spots}"/>`;
  if (!o.egg) s += `<path d="M20 61c-7 2-9 11-3 14 4 2 8-2 9-6M80 61c7 2 9 11 3 14-4 2-8-2-9-6" fill="${o.wing || o.body}" ${ln()}/>`;
  s += shine(34, 38) + cheeks(64) + eyes(54, o.happy);
  s += `<path d="M43.5 59h13l-6.5 8.5z" fill="#FF9F1C" ${ln(2.6)}/>`;
  if (!o.chick) s += `<path d="M48 67.5c-1 5 0 8 2 8s3-4 1-8" fill="#FF6B4A" ${ln(2.2)}/>`;
  if (o.egg) s += `<path d="M16 65l8-7 8 7 9-7 9 7 9-7 9 7 8-7 8 7c0 17-15 28-34 28S16 82 16 65z" fill="#FFFDF6" ${ln()}/><path d="M22 76c4 9 15 14 28 14s24-5 28-14c-6 5-16 8-28 8s-22-3-28-8z" fill="${SHADE}"/>`;
  s += acc(o.acc, GA, { e: 54, t: 22, b: [67, 31] });
  return s;
}

// Ngựa: đầu dài, mõm to, bờm và tóc mái.
const NGUA = { bg: '#F1E1C8', ray: 'rgba(255,255,255,.5)', acc: '#A8693C', acc2: '#F7E9D4' };
function horse(o) {
  let s = bg(NGUA.bg, NGUA.ray);
  s += `<path d="M68 30c13 6 16 21 10 35-3-4-7-5-10-4 3-9 3-18 0-28z" fill="${o.mane}" ${ln()}/>`;
  s += `<path d="M33 38L26 12l18 13zM67 38l7-26-18 13z" fill="${o.body}" ${ln()}/><path d="M34 31l-3-11 7 6zM66 31l3-11-7 6z" fill="#F4B6A6"/>`;
  s += `<ellipse cx="50" cy="50" rx="25" ry="28" fill="${o.body}" ${ln(3.2)}/>`;
  if (o.spots) s += `<path d="M28 44c4-4 10-3 11 2s-5 9-10 7c-2-2-2-6-1-9zM66 56c3-3 8-2 8 2 0 5-4 8-8 6-2-2-2-5 0-8z" fill="${o.spots}"/>`;
  if (o.blaze) s += `<path d="M47 33h6l-1 25h-4z" fill="${o.blaze}"/>`;
  if (o.horn) s += `<path d="M45 24L50 6l5 18z" fill="#FFC633" ${ln(2.6)}/><path d="M47 18l6-2M48 12l4-1" stroke="#E9A20C" stroke-width="2.2" stroke-linecap="round"/>`;
  s += `<path d="M37 31c0-9 8-13 13-8 4-6 14-3 13 5-4-2-8-1-10 3-2-3-7-4-10-1-2-1-4 0-6 1z" fill="${o.mane}" ${ln()}/>`;
  if (o.streak) s += `<path d="M44 26c2-3 6-3 8 0M53 25c2-2 5-2 7 0" fill="none" stroke="${o.streak}" stroke-width="3" stroke-linecap="round"/>`;
  s += shine(36, 36) + eyes(48, o.happy);
  s += `<ellipse cx="50" cy="70" rx="20" ry="14.5" fill="${o.muzzle}" ${ln(3.2)}/><path d="M33 75c4 6 10 9 17 9s13-3 17-9c-5 4-10 5-17 5s-12-1-17-5z" fill="${SHADE}"/>` + cheeks(57);
  s += `<ellipse cx="43" cy="68" rx="2.5" ry="3.4" fill="${O}"/><ellipse cx="57" cy="68" rx="2.5" ry="3.4" fill="${O}"/><path d="M44 77q6 5 12 0" fill="none" ${ln(2.8)}/>`;
  s += acc(o.acc, NGUA, { e: 48, t: 20, b: [62, 24] });
  return s;
}

export const AVATAR_SETS = {
  ga: { label: 'Gà', icon: '🐔', tint: GA.bg, items: [
    ['Gà con', chicken({ body: '#FFD84A', chick: true, happy: true })],
    ['Gà trống vàng', chicken({ body: '#FFE27A', tail: '#FF9F2E' })],
    ['Gà mái nơ', chicken({ body: '#FFC633', belly: '#FFE7A0', acc: 'bow' })],
    ['Gà kính râm', chicken({ body: '#FFB800', wing: '#F5A300', acc: 'shades' })],
    ['Gà cài hoa', chicken({ body: '#FFEFA8', happy: true, acc: 'flower' })],
    ['Gà vương miện', chicken({ body: '#FFF3C9', acc: 'crown' })],
    ['Gà mới nở', chicken({ body: '#FFD84A', chick: true, egg: true, happy: true })],
    ['Gà đeo kính', chicken({ body: '#FFE066', acc: 'glasses' })],
    ['Gà đi tiệc', chicken({ body: '#FFD23F', happy: true, acc: 'party' })],
    ['Gà tai nghe', chicken({ body: '#FFE27A', belly: '#FFF3C9', acc: 'phones' })],
    ['Gà thể thao', chicken({ body: '#FFC633', tail: '#FF9F2E', acc: 'band' })],
    ['Gà lấp lánh', chicken({ body: '#FFEFA8', spots: '#FFC633', happy: true, acc: 'stars' })],
  ] },
  ngua: { label: 'Ngựa', icon: '🐴', tint: NGUA.bg, items: [
    ['Ngựa be', horse({ body: '#F1DCBC', muzzle: '#FBF0DF', mane: '#6B4226', blaze: '#FFFBF3' })],
    ['Ngựa nâu', horse({ body: '#C98B5A', muzzle: '#EFD3B4', mane: '#5A3820', blaze: '#F7E9D4' })],
    ['Ngựa sô-cô-la', horse({ body: '#8A5634', muzzle: '#D7AE88', mane: '#3E2414', blaze: '#F1DCBC', happy: true })],
    ['Ngựa kem thắt nơ', horse({ body: '#FFF6E8', muzzle: '#F3E2C7', mane: '#C99A6B', acc: 'bow' })],
    ['Kỳ lân be', horse({ body: '#FBEFDD', muzzle: '#FFF8EE', mane: '#C98B5A', streak: '#FFC633', horn: true, happy: true })],
    ['Ngựa kính râm', horse({ body: '#D9AC7E', muzzle: '#F3DDC2', mane: '#5A3820', acc: 'shades' })],
    ['Ngựa cài hoa', horse({ body: '#EAD2AE', muzzle: '#F9EBD6', mane: '#8A5634', happy: true, acc: 'flower' })],
    ['Ngựa vương miện', horse({ body: '#A8693C', muzzle: '#E3BB92', mane: '#4A2C17', blaze: '#F1DCBC', acc: 'crown' })],
    ['Ngựa đeo kính', horse({ body: '#E3C49C', muzzle: '#F7E6CF', mane: '#6B4226', acc: 'glasses' })],
    ['Ngựa đi tiệc', horse({ body: '#C98B5A', muzzle: '#EFD3B4', mane: '#5A3820', happy: true, acc: 'party' })],
    ['Ngựa tai nghe', horse({ body: '#F1DCBC', muzzle: '#FBF0DF', mane: '#8A5634', acc: 'phones' })],
    ['Ngựa đốm', horse({ body: '#FFF6E8', muzzle: '#F3E2C7', mane: '#6B4226', spots: '#C98B5A', acc: 'scarf' })],
  ] },
};

const svg = inner => `<svg class="av-svg" viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;
const dayNo = d => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);

export const isSvgAvatar = v => /^(svg:|set:)/.test(String(v || ''));
// Kiểu hình đang hiện: tên, SVG và màu nền của bộ.
export function avatarPick(v, d = new Date()) {
  const m = String(v || '').match(/^(svg|set):([a-z]+)(?:-(\d+))?$/); if (!m) return null;
  const set = AVATAR_SETS[m[2]]; if (!set) return null;
  const i = m[1] === 'set' ? dayNo(d) % set.items.length : Math.min(set.items.length - 1, Math.max(0, Number(m[3]) || 0));
  return { set: m[2], i, name: set.items[i][0], svg: svg(set.items[i][1]), tint: set.tint };
}
