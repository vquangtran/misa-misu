// Dữ liệu riêng của nhà mình: tên các con, thời khoá biểu, lịch năm học, các nơi các con ở, các cô dạy thêm (lịch cố định, học phí),
// số dư lúc chốt bảng. Phần còn lại của app gần như không ghi tên ai (trừ bảng mẫu ở quy-dinh.js và vài câu gợi ý trong form).
// Các bước sửa dữ liệu một lần cho riêng nhà mình nằm ở mot-lan.js.
import { norm } from './chung.js';

// ---------- các con ----------
// Tên các con viết thường, kèm tên cũ (Misu, Misa). Dữ liệu riêng của từng con trong app nhận con theo tên.
export const SU = ['su', 'misu'], SA = ['sa', 'misa'];
export const isSu = name => SU.includes(norm(name)), isSa = name => SA.includes(norm(name));
// Su mặc định là bộ gà, Sa là bộ ngựa (mỗi ngày một kiểu), cho tới khi bố mẹ chọn hình khác trong thông tin của con.
export const AV_DEFAULT = { misu: 'set:ga', su: 'set:ga', misa: 'set:ngua', sa: 'set:ngua' };
// Số dư thật của từng con lúc chốt bảng bản 2 (21/11/2026), theo tên. "Cập nhật theo bảng mẫu" điền sẵn để khớp số dư, sửa được trước khi áp dụng.
export const TABLE_BALANCES = { su: 875000, misu: 875000, sa: 703270, misa: 703270 };
export const TABLE_BAL_DATE = '21/11';

// ---------- ở trường ----------
// Thời khoá biểu mẫu: 7 tiết, nghỉ trưa sau tiết 4, Thứ Hai đến Thứ Sáu.
export const SAMPLE_PERIODS = [['08:00', '08:35'], ['08:45', '09:20'], ['09:40', '10:15'], ['10:25', '11:00'], ['14:10', '14:45'], ['14:55', '15:30'], ['15:40', '16:15']];
// Thời khoá biểu có sẵn của từng con, năm học 2026 – 2027. Bản lớp 4A của Su là bản học kì I. Mỗi dòng của `subj` là một tiết, các cột từ Thứ Hai đến Thứ Sáu.
// Chỉ gợi ý cho con có tên trong `kids`.
export const SAMPLE_TKBS = [
  { kids: SU, cls: 'Lớp 4A', year: '2026 – 2027', days: [1, 2, 3, 4, 5], lunch: 4, times: SAMPLE_PERIODS, subj: [
    ['SHĐT', 'Toán', 'Mĩ thuật', 'GDTC', 'GDTC'],
    ['HĐTN', 'Âm nhạc', 'Toán', 'LS-ĐL', 'Tiếng Anh'],
    ['Toán', 'Tiếng Anh', 'Tiếng Việt', 'Tiếng Anh', 'Toán'],
    ['LS-ĐL', 'Khoa học', 'HSTN', 'Toán', 'Tiếng Anh TC'],
    ['Tiếng Việt', 'Tiếng Việt', 'Tin học', 'Tiếng Việt', 'Tiếng Việt TC'],
    ['Toán TC', 'Tiếng Việt', 'Tiếng Việt', 'Tiếng Việt', 'HSTN'],
    ['Tiếng Anh', 'Đạo đức', 'Công nghệ', 'Khoa học', 'SHS'],
  ] },
  { kids: SA, cls: 'Lớp 7A', year: '2026 – 2027', days: [1, 2, 3, 4, 5], lunch: 4,
    times: [['07:30', '08:15'], ['08:20', '09:05'], ['09:25', '10:10'], ['10:15', '11:00'], ['13:45', '14:30'], ['14:35', '15:20'], ['15:25', '16:10']], subj: [
    ['Sinh hoạt Đội', 'Thể dục', 'Anh', 'Nhạc', 'Sử'],
    ['HĐTN', 'Thể dục', 'Anh TC', 'GDĐP', 'Địa'],
    ['Toán', 'Mĩ thuật', 'Công nghệ', 'KHTN Vật sống', 'Tự học'],
    ['Toán', 'Sử', 'KHTN Chất', 'KHTN Vật sống', 'Tự học'],
    ['Văn', 'Anh', 'Văn', 'Toán', 'Toán TC'],
    ['KHTN Năng lượng', 'Anh', 'Văn', 'Văn', 'Kĩ năng sống'],
    ['GDCD', 'Tin', 'Toán', 'Văn TC', 'Sinh hoạt lớp'],
  ] },
];
// Khung thời gian năm học 2026 – 2027 theo hướng dẫn của Bộ GD&ĐT và Sở GD&ĐT Hà Nội (khối 4).
// Không gồm các đợt kiểm tra: lịch thi do bố mẹ nhập ở tab Thi khi trường báo.
export const SAMPLE_YEAR = { label: 'năm học 2026 – 2027', items: [
  { name: 'Khối 4 tập trung, sinh hoạt lớp đầu năm', icon: '🎒', kind: 'event', from: '2026-09-03' },
  { name: 'Lễ khai giảng', icon: '🏫', kind: 'event', from: '2026-09-05' },
  { name: 'Kết thúc học kì I', icon: '📘', kind: 'event', from: '2027-01-15' },
  { name: 'Họp phụ huynh cuối kì I', icon: '👪', kind: 'meeting', from: '2027-01-17' },
  { name: 'Bắt đầu chương trình học kì II', icon: '🌱', kind: 'event', from: '2027-01-18' },
  { name: 'Lễ hội chào Xuân 2027', icon: '🌸', kind: 'event', from: '2027-01-27', to: '2027-01-28' },
  { name: 'Nghỉ Tết Nguyên đán', icon: '🧧', kind: 'holiday', from: '2027-02-04', to: '2027-02-22' },
  { name: 'Kết thúc chương trình học kì II', icon: '🎓', kind: 'event', from: '2027-05-21' },
  { name: 'Họp phụ huynh cuối năm học', icon: '👪', kind: 'meeting', from: '2027-05-23' },
  { name: 'Kết thúc năm học (bế giảng)', icon: '🏆', kind: 'event', from: '2027-05-24', to: '2027-05-30' },
] };

// Nghỉ học Thứ Ba 24/11/2026 (Ngày Văn hóa Việt Nam, trường thông báo 19/11); các cô dạy thêm cũng nghỉ. autoAdds (cờ nghi2411) thêm một lần.
export const NGHI_2411 = { name: 'Nghỉ học nhân Ngày Văn hóa Việt Nam', icon: '🏖️', kind: 'holiday', from: '2026-11-24', off: 'both' };
// Cô chủ nhiệm lớp 4A nhắn nhóm phụ huynh 25/11/2026 (thông báo chung): bài của Su. autoAdds (cờ tbc2511) thêm một lần vào Học tập › Trên lớp › Bài tập,
// hạn nộp theo thời khoá biểu (Tiếng Việt, Tiếng Anh Thứ Năm 26/11; Mĩ thuật tiết tuần sau là Thứ Tư 2/12). Mục Toán chỉ là lời khen các bạn, không thêm.
export const TBC_2511 = { last: '2026-12-02', tasks: {
  'tbc-2511-tv': { title: 'Chữa đoạn văn, chuẩn bị bài viết trang 99', kind: 'bt', subj: 'Tiếng Việt', due: '2026-11-26',
    steps: ['Chữa đoạn văn vào vở ghi theo hướng dẫn', 'Chuẩn bị bài viết trang 99'],
    notes: 'Cô nhắn 25/11: GV đã trả vở ghi bài. Cả lớp chữa đoạn văn vào vở theo hướng dẫn. Em chuẩn bị bài viết s/99.' },
  'tbc-2511-ta': { title: 'Ôn lại Unit 7', kind: 'bt', subj: 'Tiếng Anh', due: '2026-11-26', steps: ['Làm bài 1', 'Làm bài 2'],
    notes: 'Cô nhắn 25/11: GVBM gửi links ôn luyện lại Unit 7.\nhttps://yourhomework.net/quiz/test/000000092085\nhttps://yourhomework.net/quiz/test/000000408029' },
  'tbc-2511-mt': { title: 'Mang đủ đồ dùng học tập môn Mĩ thuật', kind: 'bt', subj: 'Mĩ thuật', due: '2026-12-02',
    notes: 'Cô nhắn 25/11: tiết Mĩ thuật tuần sau cô kiểm tra đồ dùng học tập môn học.' },
} };

// ---------- các con ở đâu ----------
export const PLACE_NAMES = ['Nhà B4', '6th Element', 'Nhà ông bà'];
// Tên cũ được hiện bằng tên mới: nhà gọi theo tên toà nhà, không theo bố hay mẹ (dữ liệu cũ ghi "Nhà mẹ", "Nhà bố", "bên mẹ", "Mẹ"...).
export const PLACE_ALIAS = [[/^(?:(?:nhà|bên|chỗ|ở)\s+)?(?:mẹ|má)$/i, '6th Element'], [/^(?:(?:nhà|bên|chỗ|ở)\s+)?(?:bố|ba)$/i, 'Nhà B4']];

// ---------- các cô dạy thêm ----------
// Sổ Tiếng Việt của Su (cô Thảo): tên sổ, thời lượng và hình thức theo thứ.
export const SU_TV_BOOK = 'Nhật ký học Tiếng Việt';
// Thời lượng mỗi buổi theo thứ (dur: 7 số, CN = 0 … T7 = 6; 0 = theo lịch học thêm). Cô Thảo: thứ 3 học 60 phút, chủ nhật 120 phút.
export const SU_TV_DUR = [120, 0, 60, 0, 0, 0, 0];
// Bài cô giao có hạn nộp trước ngày này không hiện ở phần của con (bài cũ nhập từ file), sổ Tiếng Việt của Su và của Sa.
export const SU_TV_HW_FROM = '2026-11-22', SA_TV_HW_FROM = '2026-11-22';
// Hình thức theo thứ của sổ Tiếng Việt của Su: chủ nhật học Offline (2 tiếng), thứ 3 học Online (1 tiếng).
export const SU_TV_MODE = ['off', '', 'on', '', '', '', ''];
export const isSuTV = (kidNm, subj) => isSu(kidNm) && norm(subj) === 'tiếng việt';
// Lịch cố định theo thứ của các cô nhà mình (CN = 0 … T7 = 6): thời lượng (phút) và hình thức. Cô Thảo (Tiếng Việt của Su): CN Offline 2 tiếng,
// T3 Online 1 tiếng. Cô Trang (Toán của Su): T2 và T5 Offline 2 tiếng, 17:45–19:45. Cô Ngân (Tiếng Việt của Sa): T4 Online 18:30–19:30, CN Offline 9:00–11:00.
// Cô Hải (Toán của Sa): T3 Online 17:30–19:30, T5 Offline 18:00–20:00.
// Dùng để điền sẵn form ghi buổi, tính ngày cần điền và hạn nộp bài. time: giờ học theo thứ (nếu biết).
export const FIXED_SCHED = [
  { kids: SU, subj: 'tiếng việt', dur: SU_TV_DUR, mode: SU_TV_MODE },
  { kids: SU, subj: 'toán', dur: [0, 120, 0, 0, 120, 0, 0], mode: ['', 'off', '', '', 'off', '', ''], time: { 1: ['17:45', '19:45'], 4: ['17:45', '19:45'] } },
  { kids: SA, subj: 'tiếng việt', dur: [120, 0, 0, 60, 0, 0, 0], mode: ['off', '', '', 'on', '', '', ''], time: { 0: ['09:00', '11:00'], 3: ['18:30', '19:30'] } },
  { kids: SA, subj: 'toán', dur: [0, 0, 120, 0, 120, 0, 0], mode: ['', '', 'on', '', 'off', '', ''], time: { 2: ['17:30', '19:30'], 4: ['18:00', '20:00'] } },
];
// Các cô dạy thêm của nhà mình và học phí: app tự tạo sẵn sổ học một lần trên máy của bố mẹ (xem autoAdds trong mot-lan.js), mỗi con chỉ nhận sổ của mình.
// Cô Ngân: buổi Offline 140.000đ, buổi Online một tiếng 65.000đ. Cô Hải chưa có học phí nên tạm ẩn phần học phí (feeOff), bật lại ở Sửa sổ.
// Tên sổ (book): để trống thì sổ gọi là "Nhật ký học <môn>".
export const SAMPLE_CLASSES = [
  { kids: SU, name: 'Tiếng Việt', book: SU_TV_BOOK, dur: SU_TV_DUR, teacher: 'Cô Thảo', fee: 200000 }, { kids: SU, name: 'Toán', dur: [0, 120, 0, 0, 120, 0, 0], teacher: 'Cô Trang', fee: 220000 },
  { kids: SA, name: 'Tiếng Việt', dur: [120, 0, 0, 60, 0, 0, 0], teacher: 'Cô Ngân', fee: 140000, feeOn: 65000 }, { kids: SA, name: 'Toán', dur: [0, 0, 120, 0, 120, 0, 0], teacher: 'Cô Hải', feeOff: true },
];
