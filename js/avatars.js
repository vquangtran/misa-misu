// Hình đại diện vẽ bằng SVG: bộ gà (Su) và bộ ngựa (Sa), mỗi bộ nhiều kiểu.
// Giá trị lưu ở kids.avatar: "svg:ga-3" (một kiểu cố định) hoặc "set:ga" (mỗi ngày một kiểu).
const O = '#3A2810';
const ln = `stroke="${O}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;

const eyes = (y, l = 40, r = 60, happy = false) => happy
  ? `<path d="M${l - 4} ${y + 1}q4-5 8 0M${r - 4} ${y + 1}q4-5 8 0" fill="none" ${ln} stroke-width="2.8"/>`
  : `<circle cx="${l}" cy="${y}" r="4.3" fill="${O}"/><circle cx="${r}" cy="${y}" r="4.3" fill="${O}"/>
     <circle cx="${l + 1.4}" cy="${y - 1.5}" r="1.5" fill="#fff"/><circle cx="${r + 1.4}" cy="${y - 1.5}" r="1.5" fill="#fff"/>`;
const cheeks = y => `<ellipse cx="32" cy="${y}" rx="5.5" ry="3.4" fill="#FF7E98" opacity=".5"/><ellipse cx="68" cy="${y}" rx="5.5" ry="3.4" fill="#FF7E98" opacity=".5"/>`;

// Phụ kiện. e = độ cao mắt, t = đỉnh đầu, b = chỗ cài nơ/hoa.
function acc(kind, { e, t, b = [68, 30], l = 40, r = 60 }) {
  switch (kind) {
    case 'glasses': return `<circle cx="${l}" cy="${e}" r="7.5" fill="#fff" fill-opacity=".25" ${ln}/><circle cx="${r}" cy="${e}" r="7.5" fill="#fff" fill-opacity=".25" ${ln}/><path d="M${l + 7.5} ${e}h${r - l - 15}" ${ln}/>`;
    case 'shades': return `<rect x="${l - 8.5}" y="${e - 6}" width="17" height="12" rx="5" fill="#26232E" ${ln}/><rect x="${r - 8.5}" y="${e - 6}" width="17" height="12" rx="5" fill="#26232E" ${ln}/><path d="M${l + 8.5} ${e - 2}h${r - l - 17}" ${ln}/><path d="M${l - 4} ${e - 2.5}l3-1M${r - 4} ${e - 2.5}l3-1" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`;
    case 'bow': { const [x, y] = b; return `<path d="M${x} ${y}l-11-7v14zM${x} ${y}l11-7v14z" fill="#FF6FA8" ${ln} stroke-width="2.2"/><circle cx="${x}" cy="${y}" r="3.6" fill="#FF8FBE" ${ln} stroke-width="2"/>`; }
    case 'flower': { const [x, y] = b; return [0, 72, 144, 216, 288].map(a => `<circle cx="${(x + 5.2 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(y + 5.2 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="4.4" fill="#FFFFFF" ${ln} stroke-width="1.8"/>`).join('') + `<circle cx="${x}" cy="${y}" r="3.4" fill="#FFC633" ${ln} stroke-width="1.8"/>`; }
    case 'crown': return `<path d="M36 ${t + 4}l2-15 7 7 5-11 5 11 7-7 2 15z" fill="#FFC633" ${ln}/><circle cx="50" cy="${t - 2}" r="2.2" fill="#FF4D6D"/><circle cx="41" cy="${t + 1}" r="1.8" fill="#4DA8FF"/><circle cx="59" cy="${t + 1}" r="1.8" fill="#4DA8FF"/>`;
    case 'party': return `<path d="M40 ${t + 3}L55 ${t - 15}L62 ${t + 3}z" fill="#7C6BFF" ${ln}/><path d="M45 ${t - 3}l12 2M49 ${t - 9}l8 1" stroke="#FFC633" stroke-width="3" stroke-linecap="round"/><circle cx="55" cy="${t - 16}" r="3.6" fill="#FF6FA8" ${ln} stroke-width="2"/>`;
    case 'phones': return `<path d="M21 ${e + 2}C21 ${t - 8} 79 ${t - 8} 79 ${e + 2}" fill="none" stroke="#4D6BFF" stroke-width="5" stroke-linecap="round"/><rect x="13" y="${e - 6}" width="11" height="17" rx="5" fill="#4D6BFF" ${ln}/><rect x="76" y="${e - 6}" width="11" height="17" rx="5" fill="#4D6BFF" ${ln}/>`;
    case 'stars': return `<path d="M20 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM81 30l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#FFC633" ${ln} stroke-width="1.6"/>`;
    case 'band': return `<path d="M23 ${t + 12}c14-6 40-6 54 0l-2 7c-14-5-36-5-50 0z" fill="#FF5A5F" ${ln} stroke-width="2.2"/><circle cx="34" cy="${t + 14}" r="1.6" fill="#fff"/><circle cx="50" cy="${t + 11}" r="1.6" fill="#fff"/><circle cx="66" cy="${t + 14}" r="1.6" fill="#fff"/>`;
    default: return '';
  }
}

function chicken(o) {
  let s = '';
  if (o.tail) s += `<path d="M72 48c6-14 16-16 20-10-5 1-7 4-7 7 5-3 10-1 10 3-5 0-8 2-9 6 3-1 6 1 5 4-5-1-10 1-13 4z" fill="${o.tail}" ${ln}/>`;
  if (o.chick) s += `<path d="M46 25c-1-6 3-9 6-6M50 26c2-7 8-7 9-3" fill="none" ${ln} stroke-width="2.6"/>`;
  else s += `<path d="M37 31c-5-8 3-14 8-8-1-10 11-11 12-2 4-7 13-3 9 6z" fill="${o.comb}" ${ln}/>`;
  if (!o.egg) s += `<path d="M42 87v7m-3 0h6M58 87v7m-3 0h6" stroke="#F59A12" stroke-width="2.8" stroke-linecap="round"/>`;
  s += `<path d="M50 25c20 0 32 17 32 36 0 17-14 28-32 28S18 78 18 61c0-19 12-36 32-36z" fill="${o.body}" ${ln} stroke-width="2.6"/>`;
  if (o.belly) s += `<ellipse cx="50" cy="78" rx="15" ry="8" fill="${o.belly}"/>`;
  if (!o.egg) s += `<path d="M20 60c-7 2-9 11-3 14 4 2 8-2 9-6M80 60c7 2 9 11 3 14-4 2-8-2-9-6" fill="${o.wing || o.body}" ${ln}/>`;
  s += cheeks(63) + eyes(53, 40, 60, o.happy);
  s += `<path d="M44 58h12l-6 8z" fill="#FFA41B" ${ln} stroke-width="2.2"/>`;
  if (!o.chick) s += `<path d="M48 66c-1 5 0 8 2 8s3-4 1-8" fill="${o.comb}" ${ln} stroke-width="2"/>`;
  if (o.egg) s += `<path d="M16 64l8-7 8 7 9-7 9 7 9-7 9 7 8-7 8 7c0 17-15 28-34 28S16 81 16 64z" fill="#FFF8EA" ${ln}/><path d="M30 78c2 3 5 4 8 4" fill="none" stroke="#E9DCC4" stroke-width="2.4" stroke-linecap="round"/>`;
  s += acc(o.acc, { e: 53, t: 22, b: [67, 31] });
  return s;
}

function horse(o) {
  let s = '';
  if (o.side) s += `<path d="M68 30c12 6 15 20 10 34-3-4-6-5-9-4 3-9 3-17 0-27z" fill="${o.side}" ${ln}/>`;
  s += `<path d="M33 37L27 12l17 13zM67 37l6-25-17 13z" fill="${o.body}" ${ln}/><path d="M34 30l-3-11 7 6zM66 30l3-11-7 6z" fill="#FF9FB4"/>`;
  s += `<ellipse cx="50" cy="50" rx="24" ry="28" fill="${o.body}" ${ln} stroke-width="2.6"/>`;
  if (o.dapple) s += `<circle cx="38" cy="38" r="3" fill="#fff" opacity=".45"/><circle cx="62" cy="36" r="2.4" fill="#fff" opacity=".45"/><circle cx="66" cy="58" r="3.2" fill="#fff" opacity=".45"/><circle cx="33" cy="58" r="2.4" fill="#fff" opacity=".45"/>`;
  if (o.zebra) s += `<path d="M27 42c5 1 8 4 9 8M26 54c4 0 7 2 8 5M73 42c-5 1-8 4-9 8M74 54c-4 0-7 2-8 5M44 30c2 3 2 6 1 9M56 30c-2 3-2 6-1 9" fill="none" stroke="${O}" stroke-width="3.2" stroke-linecap="round"/>`;
  if (o.blaze) s += `<path d="M47 33h6l-1 26h-4z" fill="#FFFFFF" opacity=".9"/>`;
  if (o.horn) s += `<path d="M45 24L50 6l5 18z" fill="#FFD54A" ${ln}/><path d="M47 18l6-2M48 12l4-1" stroke="#E9A20C" stroke-width="2" stroke-linecap="round"/>`;
  const m = o.mane;
  s += Array.isArray(m)
    ? `<path d="M37 30c0-9 8-13 13-8 4-6 14-3 13 5-4-2-8-1-10 3-2-3-7-4-10-1-2-1-4 0-6 1z" fill="${m[0]}" ${ln}/><path d="M42 27c2-3 6-3 8 0" stroke="${m[1]}" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M52 26c2-3 6-3 8 0" stroke="${m[2]}" stroke-width="3" stroke-linecap="round" fill="none"/>`
    : `<path d="M37 30c0-9 8-13 13-8 4-6 14-3 13 5-4-2-8-1-10 3-2-3-7-4-10-1-2-1-4 0-6 1z" fill="${m}" ${ln}/>`;
  s += eyes(48, 40, 60, o.happy);
  s += `<ellipse cx="50" cy="70" rx="19" ry="14" fill="${o.muzzle}" ${ln} stroke-width="2.6"/>` + cheeks(57);
  s += `<ellipse cx="43" cy="68" rx="2.3" ry="3.2" fill="${O}"/><ellipse cx="57" cy="68" rx="2.3" ry="3.2" fill="${O}"/><path d="M44 77q6 5 12 0" fill="none" ${ln}/>`;
  s += acc(o.acc, { e: 48, t: 20, b: [62, 24] });
  return s;
}

export const AVATAR_SETS = {
  ga: { label: 'Gà', icon: '🐔', items: [
    ['Gà trống', chicken({ body: '#FFFFFF', comb: '#FF4D4D', tail: '#3FBF7F' })],
    ['Gà con', chicken({ body: '#FFD84A', chick: true, happy: true })],
    ['Gà mái nơ hồng', chicken({ body: '#E9A86A', comb: '#FF4D4D', belly: '#F6CFA0', acc: 'bow' })],
    ['Gà ngầu', chicken({ body: '#5E5A68', comb: '#FF4D4D', wing: '#4A4655', acc: 'shades' })],
    ['Gà hoa', chicken({ body: '#FFC6DA', comb: '#FF5C8A', happy: true, acc: 'flower' })],
    ['Gà hoàng tử', chicken({ body: '#FFFFFF', comb: '#FF4D4D', acc: 'crown' })],
    ['Gà mới nở', chicken({ body: '#FFE066', chick: true, egg: true, happy: true })],
    ['Gà mọt sách', chicken({ body: '#FFEBC0', comb: '#FF6B4D', acc: 'glasses' })],
    ['Gà đi tiệc', chicken({ body: '#FFFFFF', comb: '#FF4D4D', happy: true, acc: 'party' })],
    ['Gà DJ', chicken({ body: '#FFB24D', comb: '#E8343A', belly: '#FFD59A', acc: 'phones' })],
    ['Gà thể thao', chicken({ body: '#FFF4D6', comb: '#FF4D4D', tail: '#FF9F2E', acc: 'band' })],
    ['Gà lấp lánh', chicken({ body: '#C9E8FF', comb: '#7C6BFF', happy: true, acc: 'stars' })],
  ] },
  ngua: { label: 'Ngựa', icon: '🐴', items: [
    ['Ngựa nâu', horse({ body: '#B9763F', muzzle: '#EBC79F', mane: '#4A2C17', side: '#4A2C17', blaze: true })],
    ['Ngựa trắng nơ hồng', horse({ body: '#FFFFFF', muzzle: '#F6E8DA', mane: '#FFB3D1', side: '#FFB3D1', acc: 'bow' })],
    ['Kỳ lân', horse({ body: '#FFFFFF', muzzle: '#FBEFF6', mane: ['#FF8FC8', '#FFD54A', '#7CC7FF'], side: '#B48CFF', horn: true, happy: true })],
    ['Ngựa đen', horse({ body: '#3E3A45', muzzle: '#6E6878', mane: '#1E1B22', side: '#1E1B22', blaze: true, acc: 'stars' })],
    ['Ngựa vàng', horse({ body: '#F2C46D', muzzle: '#FCE4B4', mane: '#FFF4D6', side: '#FFF4D6', happy: true, acc: 'flower' })],
    ['Ngựa vằn', horse({ body: '#FFFFFF', muzzle: '#4A4655', mane: '#26232E', side: '#26232E', zebra: true })],
    ['Ngựa xám', horse({ body: '#B9BECC', muzzle: '#DDE0E8', mane: '#646978', side: '#646978', dapple: true, acc: 'glasses' })],
    ['Ngựa hoàng gia', horse({ body: '#A8552B', muzzle: '#E3A77E', mane: '#5A2A12', side: '#5A2A12', acc: 'crown' })],
    ['Ngựa đi tiệc', horse({ body: '#D9A577', muzzle: '#F4D5B5', mane: '#8A5530', side: '#8A5530', happy: true, acc: 'party' })],
    ['Ngựa DJ', horse({ body: '#8A5A3B', muzzle: '#D8AE8C', mane: '#2E1D12', side: '#2E1D12', acc: 'phones' })],
    ['Ngựa ngầu', horse({ body: '#C98B5A', muzzle: '#F0CFAE', mane: '#3A2416', side: '#3A2416', blaze: true, acc: 'shades' })],
    ['Ngựa thể thao', horse({ body: '#FFFFFF', muzzle: '#EFE3D6', mane: '#7A5B44', side: '#7A5B44', acc: 'band' })],
  ] },
};

const svg = inner => `<svg class="av-svg" viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;
const dayNo = d => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);

export const isSvgAvatar = v => /^(svg:|set:)/.test(String(v || ''));
// Tên kiểu hình đang hiện (để đọc cho trình đọc màn hình và hiện trong form).
export function avatarPick(v, d = new Date()) {
  const m = String(v || '').match(/^(svg|set):([a-z]+)(?:-(\d+))?$/); if (!m) return null;
  const set = AVATAR_SETS[m[2]]; if (!set) return null;
  const i = m[1] === 'set' ? dayNo(d) % set.items.length : Math.min(set.items.length - 1, Math.max(0, Number(m[3]) || 0));
  return { set: m[2], i, name: set.items[i][0], svg: svg(set.items[i][1]) };
}
