// Dữ liệu thử cho bộ kiểm tra: một nhà có hai con tên Su, Sa (không có ngày sinh hay thông tin riêng nào).
// Đây là dữ liệu trước lần mở đầu tiên. App tự thêm việc mẫu (tableVer 2 và dayFrom), mục thành tích, việc BTVN,
// tạo sẵn sổ học của các cô rồi tự nhập sổ từ data/*.json. Kết quả sau lần mở đầu được chụp lại thành diem-xuat-phat.json.

// Mã việc mẫu app tự thêm: 'mau-' + tên viết liền không dấu (giống slug trong app).
const slug = v => String(v || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const mau = name => 'mau-' + slug(name);

// Việc phải làm của bảng mẫu (tiền 0) và hai việc BTVN app tự thêm: dùng để đánh dấu đủ việc cho vài ngày đã qua.
const MUST = ['Gấp chăn, dọn giường', 'Không kén ăn', 'Tự giác hoàn thành bài tập', 'Hoàn thành bài tập ở lớp', 'Tự chuẩn bị, cất cặp', 'Dọn bàn học',
  'Chuẩn bị sách vở cho buổi học thêm hôm sau', 'Đánh răng, rửa mặt', 'Uống đủ 1200ml nước lọc'].map(mau).concat(['hw-lesson', 'hw-school']);
const PAID = { [mau('Tập thể dục ít nhất 15 phút')]: 15000, [mau('Đọc sách 30 phút')]: 10000, [mau('Thu quần áo')]: 5000, [mau('Xếp bát vào máy')]: 10000 };

const tkb = (cls, times, subj) => ({ cls, year: '2026 – 2027', days: [1, 2, 3, 4, 5], lunch: 4,
  rows: times.map(([s, e], i) => ({ s, e, d: Object.fromEntries([1, 2, 3, 4, 5].map((d, j) => [d, subj[i][j]])) })) });
const P4 = [['08:00', '08:35'], ['08:45', '09:20'], ['09:40', '10:15'], ['10:25', '11:00'], ['14:10', '14:45'], ['14:55', '15:30'], ['15:40', '16:15']];
const P7 = [['07:30', '08:15'], ['08:20', '09:05'], ['09:25', '10:10'], ['10:15', '11:00'], ['13:45', '14:30'], ['14:35', '15:20'], ['15:25', '16:10']];

export function duLieuThu() {
  const done = {};
  const tick = (dk, kid, ids) => { const m = ((done[dk] = done[dk] || {})[kid] = done[dk][kid] || {}); for (const id of ids) m[id] = PAID[id] || 0.5; };
  // Su làm đủ việc ba ngày liền (chuỗi ngày), Sa làm một phần.
  for (const dk of ['2026-11-20', '2026-11-21', '2026-11-22']) tick(dk, 'k-su', [...MUST, mau('Đọc sách 30 phút'), mau('Thu quần áo')]);
  tick('2026-11-17', 'k-su', [mau('Gấp chăn, dọn giường'), mau('Tập thể dục ít nhất 15 phút')]);
  tick('2026-11-18', 'k-sa', [mau('Đánh răng, rửa mặt'), mau('Xếp bát vào máy')]);
  tick('2026-11-22', 'k-sa', MUST.slice(0, 4));
  tick('2026-11-23', 'k-sa', [mau('Gấp chăn, dọn giường'), mau('Đánh răng, rửa mặt')]);
  // Su ghi đã đọc gì, bao nhiêu trang khi xong việc đọc sách (lần sau điền sẵn tên sách).
  done['2026-11-22']['k-su'][mau('Đọc sách 30 phút') + '~r'] = { what: 'Dế Mèn phiêu lưu ký', pages: 12 };

  return {
    kids: {
      'k-su': { name: 'Su', avatar: '🐣', order: 0, tint: 0, since: '2026-11-16', dayBonus: 15000, dayFrom: '2026-11-16', tableVer: 2 },
      'k-sa': { name: 'Sa', avatar: '🐴', order: 1, tint: 1, since: '2026-11-16', dayBonus: 15000, dayFrom: '2026-11-16', tableVer: 2 },
    },
    chores: {},
    rewards: {},
    done,
    ledger: {
      l1: { kid: 'k-su', amount: 50000, kind: 'bonus', note: 'Thưởng thêm', icon: '⭐', at: '2026-11-18T05:00:00.000Z' },
      l2: { kid: 'k-sa', amount: -10000, kind: 'penalty', note: 'Nổi nóng', icon: '😤', rid: 'gia-noi-nong', at: '2026-11-19T12:00:00.000Z' },
      l3: { kid: 'k-su', amount: -25000, kind: 'fee', note: 'Xem TV 1 giờ', qty: 1, icon: '📺', at: '2026-11-21T12:00:00.000Z' },
      l4: { kid: 'k-sa', amount: 0, ask: 10000, kind: 'bonus', note: 'Được 9', icon: '⭐', at: '2026-11-23T05:00:00.000Z', pending: true },
      l5: { kid: 'k-sa', amount: -20000, kind: 'spend', note: 'Mua bút', icon: '', at: '2026-11-20T09:00:00.000Z' },
      l6: { kid: 'k-sa', amount: -20000, kind: 'reward', note: 'Một ngày không làm việc nhà (Thứ 5 19/11)', icon: '🧹', skip: '2026-11-19', at: '2026-11-18T13:00:00.000Z' },
      l7: { kid: 'k-su', amount: 20000, kind: 'bonus', note: 'Được 10', icon: '💯', at: '2026-11-22T08:00:00.000Z', okAt: '2026-11-23T03:00:00.000Z' },
      l8: { kid: 'k-su', amount: -10000, kind: 'penalty', note: 'Trì hoãn', icon: '🐢', rid: 'gia-tri-hoan', at: '2026-11-23T02:00:00.000Z' },
      l9: { kid: 'k-su', amount: 0, ask: 5000, kind: 'bonus', note: 'Được cô khen', icon: '👏', at: '2026-11-23T06:00:00.000Z', pending: true },
    },
    paid: {
      'xin-a1': { xin: 'fun', kid: 'k-su', name: 'Đọc truyện tranh', icon: '📚', minutes: 20, slot: 'toi', days: [0, 6], at: '2026-11-22T10:00:00.000Z' },
    },
    timetables: {
      'k-su': tkb('Lớp 4A', P4, [
        ['SHĐT', 'Toán', 'Mĩ thuật', 'GDTC', 'GDTC'], ['HĐTN', 'Âm nhạc', 'Toán', 'LS-ĐL', 'Tiếng Anh'], ['Toán', 'Tiếng Anh', 'Tiếng Việt', 'Tiếng Anh', 'Toán'],
        ['LS-ĐL', 'Khoa học', 'HSTN', 'Toán', 'Tiếng Anh TC'], ['Tiếng Việt', 'Tiếng Việt', 'Tin học', 'Tiếng Việt', 'Tiếng Việt TC'],
        ['Toán TC', 'Tiếng Việt', 'Tiếng Việt', 'Tiếng Việt', 'HSTN'], ['Tiếng Anh', 'Đạo đức', 'Công nghệ', 'Khoa học', 'SHS']]),
      'k-sa': tkb('Lớp 7A', P7, [
        ['Sinh hoạt Đội', 'Thể dục', 'Anh', 'Nhạc', 'Sử'], ['HĐTN', 'Thể dục', 'Anh TC', 'GDĐP', 'Địa'], ['Toán', 'Mĩ thuật', 'Công nghệ', 'KHTN Vật sống', 'Tự học'],
        ['Toán', 'Sử', 'KHTN Chất', 'KHTN Vật sống', 'Tự học'], ['Văn', 'Anh', 'Văn', 'Toán', 'Toán TC'], ['KHTN Năng lượng', 'Anh', 'Văn', 'Văn', 'Kĩ năng sống'],
        ['GDCD', 'Tin', 'Toán', 'Văn TC', 'Sinh hoạt lớp']]),
    },
    lessons: {
      'ls-1': { kid: 'k-su', day: 1, s: '17:30', e: '19:30', name: 'Gia sư Toán', home: false, go: 'Bố', back: 'Mẹ', at: 'Nhà mẹ' },
      'ls-2': { kid: 'k-su', day: 4, s: '17:30', e: '19:30', name: 'Gia sư Toán', home: false, go: 'Bố', back: 'Mẹ' },
      'ls-3': { kid: 'k-su', day: 0, s: '09:00', e: '11:00', name: 'Tiếng Việt' },
      'ls-4': { kid: 'k-su', day: 2, s: '19:00', e: '20:00', name: 'Tiếng Việt' },
      'ls-5': { kid: 'k-sa', day: 0, s: '09:00', e: '11:00', name: 'Tiếng Việt' },
      'ls-6': { kid: 'k-sa', day: 3, s: '18:30', e: '19:30', name: 'Tiếng Việt' },
      'ls-7': { kid: 'k-sa', day: 2, s: '17:30', e: '19:30', name: 'Toán' },
      'ls-8': { kid: 'k-sa', day: 4, s: '18:00', e: '20:00', name: 'Toán' },
      'ls-9': { kid: 'k-su', day: 6, s: '08:00', e: '09:30', name: 'Bóng rổ' },
      'ls-10': { kid: 'k-sa', day: 5, s: '18:00', e: '19:30', name: 'Tiếng Anh', home: false, go: 'Grab', back: 'Mẹ' },
    },
    stays: {
      1: { day: '', night: 'Nhà B4' }, 2: { day: '', night: 'Nhà B4' }, 3: { day: '', night: '6th Element' }, 4: { day: '', night: 'Nhà B4' },
      5: { day: '', night: 'Nhà B4' }, 6: { day: 'Nhà ông bà', night: '6th Element' }, 0: { day: '', night: 'Nhà mẹ' },
    },
    events: {
      'ev-1': { name: 'Kiểm tra giữa kì Toán', icon: '📝', kind: 'exam', from: '2026-11-26', kids: ['k-su'] },
      'ev-2': { name: 'Nghỉ lễ', icon: '🏖️', kind: 'holiday', from: '2026-11-20', kids: [] },
      'ev-3': { name: 'Họp phụ huynh', icon: '👪', kind: 'meeting', from: '2026-11-28', kids: [] },
      'ev-4': { name: 'Hội diễn văn nghệ', icon: '🎉', kind: 'event', from: '2026-11-24', to: '2026-11-25', kids: ['k-sa'] },
    },
    tasks: {
      t1: { kid: 'k-su', title: 'Bài tập Toán trang 45', kind: 'bt', subj: 'Toán', due: '2026-11-24', notes: 'Làm vào vở ô li', steps: [{ t: 'Bài 1', done: true }, { t: 'Bài 2', done: false }, { t: 'Bài 3', done: false }], done: false, doneAt: '' },
      t2: { kid: 'k-sa', title: 'Ôn tập Văn', kind: 'on', subj: 'Văn', due: '2026-11-23', notes: '', steps: [], done: false, doneAt: '' },
      t3: { kid: 'k-sa', title: 'Dự án Khoa học', kind: 'da', subj: 'KHTN', due: '2026-11-30', notes: '', steps: [{ t: 'Tìm tài liệu', done: true }, { t: 'Làm mô hình', done: false }], done: false, doneAt: '' },
      t4: { kid: 'k-su', title: 'Học thuộc bài thơ', kind: 'bt', subj: 'Tiếng Việt', due: '2026-11-21', notes: '', steps: [], done: false, doneAt: '' },
      t5: { kid: 'k-su', title: 'Bài tập Tiếng Anh', kind: 'bt', subj: 'Tiếng Anh', due: '2026-11-20', notes: '', steps: [], done: true, doneAt: '2026-11-19' },
      t6: { kid: 'k-sa', title: 'Bài con tự thêm', kind: 'bt', subj: '', due: '', notes: '', steps: [], done: false, doneAt: '', by: 'k-sa' },
    },
    goals: {
      g1: { kid: 'k-su', name: 'Bộ Lego', icon: '🧸', price: 500000, order: 0, done: false },
      g2: { kid: 'k-sa', name: 'Sách truyện', icon: '📖', price: 150000, order: 0, done: false },
      g3: { kid: 'k-sa', name: 'Hộp bút', icon: '✏️', price: 80000, order: 1, done: false },
    },
  };
}
