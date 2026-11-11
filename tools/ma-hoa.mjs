// Mã hoá một bản sao lưu của Bé Chăm Ngoan để đưa vào repo công khai (data/gia-dinh.enc.json).
// App giải mã bằng nút "Nạp lịch gia đình" ở mục Gia đình.
//
//   MAT_KHAU='mật khẩu' node tools/ma-hoa.mjs ban-sao-luu.json > data/gia-dinh.enc.json
//
// Mật khẩu được đổi về chữ thường. Không commit file sao lưu chưa mã hoá.
import { readFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const pass = String(process.env.MAT_KHAU || '').trim().toLowerCase();
const file = process.argv[2];
if (!pass || !file) { console.error("Cách dùng: MAT_KHAU='...' node tools/ma-hoa.mjs ban-sao-luu.json > data/gia-dinh.enc.json"); process.exit(1); }
const json = JSON.parse(readFileSync(file, 'utf8'));
if (!json?.data?.kids) { console.error('File không phải bản sao lưu của Bé Chăm Ngoan.'); process.exit(1); }

const iter = 600000;
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(json))));
const b64 = u => Buffer.from(u).toString('base64');
process.stdout.write(JSON.stringify({ app: 'be-cham-ngoan', kind: 'aes-gcm/pbkdf2-sha256', iter, salt: b64(salt), iv: b64(iv), ct: b64(ct) }) + '\n');
