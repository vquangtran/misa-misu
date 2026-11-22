// Các cảnh của bộ kiểm tra: mỗi cảnh mở app từ điểm xuất phát (hoặc từ dữ liệu thử, với cảnh mo-dau) rồi bấm qua
// một nhóm màn. Mỗi thao tác được chụp lại (innerHTML và localStorage) để so giữa hai lần chạy.
// Thêm tính năng mới thì thêm bước vào cảnh tương ứng; dùng `node tools/kiem-tra/chay.mjs liet-ke '#màn'` để xem các nút.
//
// c.go(đường dẫn), c.hash('#...'), c.click(selector, { text, nth }), c.check(selector), c.fill({ selector: giá trị }),
// c.hold(selector), c.reload(), c.snap(tên). Con: k-su (Su), k-sa (Sa). Sổ học: lop-k-su-0 (Tiếng Việt của Su, đã nhập
// từ data/so-tieng-viet-su.json), lop-k-su-1 (Toán của Su), lop-k-sa-2 (Tiếng Việt của Sa), lop-k-sa-3 (Toán của Sa, sổ trống).

const MAIN = 'be-cham-ngoan-v1';
const data = ls => JSON.parse(ls[MAIN]);
const lopCode = (diem, id) => data(diem.ls).paid[id].code;
const sua = f => ls => { const d = JSON.parse(ls[MAIN]); f(d, ls); ls[MAIN] = JSON.stringify(d); return ls; };
const X = '#modal [data-act="close"]';
// Mã gia đình của Firestore giả (các cảnh firebase-…).
const FAM = 'gia01-gia01-gia01-gia01';
const act = (a, attrs = {}) => `[data-act="${a}"]` + Object.entries(attrs).map(([k, v]) => `[data-${k}="${v}"]`).join('');

export const CANH = [
  // Lần mở đầu từ dữ liệu thử: app tự thêm việc mẫu, mục giá, sổ học và tự nhập sổ. Kết quả phải đúng bằng điểm xuất phát.
  {
    ten: 'mo-dau',
    async chay(c, { moDau, diem }) {
      const ls = await moDau(c);
      if (JSON.stringify(ls) !== JSON.stringify(diem.ls)) c.st.errs.push('lần mở đầu cho localStorage khác diem-xuat-phat.json');
      await c.snap('so với điểm xuất phát');
    },
  },

  // Màn Hôm nay của bố mẹ: chọn con, các buổi, menu ⋯, thêm nhanh, đóng dấu, mục con, form việc, duyệt, cả tuần.
  {
    ten: 'hom-nay',
    async chay(c) {
      await c.go('/#hom-nay');
      await c.click(act('today-kid', { kid: 'k-sa' }));
      await c.click(act('today-kid', { kid: 'k-su' }));
      await c.click(act('slot-toggle'), { nth: 0 });
      await c.click(act('slot-toggle'), { nth: 1 });
      await c.click(act('slot-toggle'), { text: 'Lúc nào cũng được' });
      await c.click(act('today-menu'));
      await c.click(X);
      await c.click(act('quick-add'), { nth: 0 });
      await c.fill({ '#qname': 'Tưới cây' });
      for (const f of ['slot', 'rep', 'who', 'pay', 'slot']) await c.click(act('qa-cycle', { f }));
      await c.click(act('qa-save'));
      await c.click(act('quick-add', { slot: 'sang' }));
      await c.click(act('qa-more'));
      await c.click(X);
      await c.click(act('tick', { kid: 'k-su', chore: 'mau-don-ban-hoc' }));
      await c.click(act('tick', { kid: 'k-su', chore: 'mau-xep-bat-vao-may' }));
      await c.click(act('step', { kid: 'k-su', chore: 'mau-checklist-truoc-khi-di-ngu', i: 0 }));
      await c.click(act('step', { kid: 'k-su', chore: 'mau-checklist-truoc-khi-di-ngu', i: 1 }));
      await c.click(act('tick', { kid: 'k-su', chore: 'mau-don-ban-hoc' }), { label: 'bỏ dấu Dọn bàn học' });
      await c.click(act('fun-need'));
      await c.click(X);
      await c.click('.item.edit-row' + act('chore-form', { id: 'mau-phoi-quan-ao' }));
      await c.fill({ '#cname': 'Phơi quần áo sau bữa tối', '#cmin': '10' });
      await c.click(act('chore-save'));
      await c.click('.item.edit-row' + act('lesson-form'));
      await c.click(X);
      await c.click(act('day-set', { d: '2026-11-24' }));
      await c.click(act('day', { n: '-7' }));
      await c.click(act('day-set', { d: '2026-11-17' }));
      await c.click(act('day', { n: '0' }));
      await c.click(act('merit-ok', { id: 'l4' }));
      await c.click(act('merit-no', { id: 'l9' }));
      await c.click(act('fun-ok', { id: 'xin-a1' }));
      await c.click(act('task-step', { id: 't1', i: '1' }));
      await c.click(act('task-done', { id: 't4' }));
      await c.click(act('sec-toggle', { key: 'today-so' }));
      await c.click(act('sec-toggle', { key: 'today-so' }));
      await c.click(act('today-kid', { kid: 'k-sa' }));
      await c.click(act('tick', { kid: 'k-sa', chore: 'mau-xep-bat-vao-may' }), { label: 'Sa cùng làm Xếp bát (chia tiền)' });
      await c.click(act('tick', { kid: 'k-sa', chore: 'mau-lau-ban' }));
      await c.click(act('today-kid', { kid: 'k-su' }));
      await c.click(act('cls-open', { id: 'lop-k-su-1' }));
      await c.click(act('so-back'));
      await c.click(act('acct-go', { kid: 'k-su' }));
      await c.hash('#hom-nay');
      await c.click(act('today-menu'));
      await c.click('#modal ' + act('today-mode', { v: 'week' }));
      await c.click(act('grid-tick'), { nth: 3 });
      await c.click(act('grid-week', { n: '-7' }));
      await c.click(act('grid-week', { n: '0' }));
      await c.click(act('today-mode', { v: 'day' }));
      await c.click(act('today-menu'));
      await c.click('#modal ' + act('sheet-open'));
      await c.check('#modal input[name="planw"][value="1"]');
      await c.click('#modal ' + act('print'));
      await c.click(X);
      // Bấm hết các việc phải làm còn lại của Su hôm nay: màn chúc mừng và thưởng ngày đủ việc.
      await c.click(act('slot-toggle'), { text: 'Lúc nào cũng được' });
      for (const id of ['hw-lesson', 'hw-school', 'mau-tu-giac-hoan-thanh-bai-tap', 'mau-hoan-thanh-bai-tap-o-lop', 'mau-tu-chuan-bi-cat-cap', 'mau-don-ban-hoc', 'mau-chuan-bi-sach-vo-cho-buoi-hoc-them-hom-sau', 'mau-khong-ken-an', 'mau-gap-chan-don-giuong', 'mau-danh-rang-rua-mat'])
        await c.click(act('tick', { kid: 'k-su', chore: id }), { optional: true, label: 'đóng dấu ' + id });
      await c.click(act('slot-toggle'), { text: 'Việc làm thêm' });
      await c.click(act('tick', { kid: 'k-su', chore: 'mau-hut-bui' }), { optional: true });
      await c.click(act('chore-form', { kind: 'extra' }));
      await c.click(X);
    },
  },

  // Chế độ cho bé trên máy bố mẹ: chọn con, đóng dấu, ba tab của con, báo thành tích, xin việc thích làm, giữ để thoát.
  {
    ten: 'che-do-be',
    async chay(c) {
      await c.go('/#hom-nay');
      await c.click(act('today-menu'));
      await c.click('#modal ' + act('km-open'));
      await c.click(act('km-kid', { kid: 'k-su' }));
      await c.click('#km ' + act('tick', { kid: 'k-su', chore: 'mau-don-ban-hoc' }));
      await c.click('#km ' + act('step', { kid: 'k-su', chore: 'mau-checklist-truoc-khi-di-ngu', i: 2 }));
      await c.click('#km ' + act('slot-toggle'), { nth: 0 });
      await c.click('#km ' + act('fun-need'));
      await c.click(X);
      await c.check('#km input[name="kmtab"][value="learn"]');
      for (const v of ['bai-tap', 'truong', 'hoc-them', 'sap-toi']) await c.click('#km ' + act('learn-tab', { v }));
      await c.click('#km ' + act('learn-tab', { v: 'truong' }));
      await c.click('#km ' + act('tkb-day', { d: '3' }));
      await c.check('#km input[name="truong"][value="moc"]');
      await c.click('#km ' + act('learn-tab', { v: 'bai-tap' }));
      await c.check('#km input[name="tview"][value="1"]');
      await c.check('#km input[name="kmtab"][value="acct"]');
      await c.click('#km ' + act('sec-toggle', { key: 'kr-pen' }));
      await c.click('#km ' + act('merit-open', { kid: 'k-su' }));
      await c.click('#modal ' + act('merit-pick'), { nth: 1 });
      await c.fill({ '#mnote': 'Môn Toán' });
      await c.click('#modal ' + act('merit-ask'));
      await c.click('#km ' + act('hist-all'), { optional: true });
      await c.check('#km input[name="kmtab"][value="today"]');
      await c.click('#km ' + act('fun-form', { kid: 'k-su' }));
      await c.fill({ '#fname': 'Xem phim hoạt hình', '#fmin': '30' });
      await c.click('#modal ' + act('fun-ask'));
      await c.click('#km ' + act('km-acct'), { optional: true });
      await c.click('#km ' + act('km-kid', { kid: '' }));
      await c.click(act('km-kid', { kid: 'k-sa' }));
      await c.click('#km ' + act('tick', { kid: 'k-sa', chore: 'mau-don-ban-hoc' }));
      await c.hold('[data-hold]');
    },
  },

  // Học tập: bốn tab, cả nhà và từng con, bài tập, mốc năm học, học thêm, thời khoá biểu, các form.
  {
    ten: 'hoc-tap',
    async chay(c) {
      await c.go('/#lich-hoc');
      await c.click(act('ag-day', { d: '2026-11-25' }));
      await c.click(act('ag-week', { n: '7' }));
      await c.click(act('ag-day', { d: '' }));
      await c.click(act('learn-tab', { v: 'bai-tap' }));
      await c.check('input[name="tview"][value="1"]');
      await c.check('input[name="tview"][value="0"]');
      await c.click(act('task-form', { id: 't2' }));
      await c.fill({ '#ttitle': 'Ôn tập Văn bài 5', '#tsteps': 'Đọc bài\nTrả lời câu hỏi' });
      await c.click('#modal ' + act('task-due', { v: '1' }));
      await c.click('#modal ' + act('task-save'));
      await c.click(act('task-step', { id: 't3', i: '1' }));
      await c.click(act('task-done', { id: 't2' }));
      await c.click(act('page-add'));
      await c.fill({ '#ttitle': 'Chép chính tả' });
      await c.check('#modal input[name="tkid"][value="k-su"]');
      await c.click('#modal ' + act('task-subj'), { nth: 0 });
      await c.click('#modal ' + act('task-due', { v: 'next' }));
      await c.click('#modal ' + act('task-save'));
      await c.click(act('learn-tab', { v: 'truong' }));
      await c.check('input[name="truong"][value="moc"]');
      await c.click(act('year-form'));
      await c.click('#modal ' + act('year-add'));
      await c.click(act('event-form', { id: 'ev-3' }));
      await c.fill({ '#ename': 'Họp phụ huynh giữa kì', '#eto': '2026-11-29' });
      await c.click('#modal ' + act('event-save'));
      await c.click(act('page-add'));
      await c.fill({ '#ename': 'Thi vẽ', '#efrom': '2026-12-02' });
      await c.fill({ '#ekind': 'exam' });
      await c.click('#modal ' + act('event-save'));
      await c.check('input[name="truong"][value="tkb"]');
      await c.click(act('page-add'));
      await c.click(X);
      await c.click(act('learn-tab', { v: 'hoc-them' }));
      await c.click(act('page-add'));
      await c.click('#modal ' + act('cls-form'));
      await c.fill({ '#clname': 'Tiếng Anh', '#clteacher': 'Cô Lan', '#clfee': '180000' });
      await c.check('#modal input[name="clkid"][value="k-sa"]');
      await c.click('#modal ' + act('cls-save'));
      await c.click(X);
      await c.click(act('cls-links'), { optional: true });
      await c.click(X, { optional: true });
      await c.click(act('learn-kid', { kid: 'k-su' }));
      await c.click(act('lesson-form') + '[data-id]', { nth: 0 });
      await c.fill({ '#lname': 'Gia sư Toán', '#le': '19:50' });
      await c.click('#modal ' + act('lesson-save'));
      await c.click(act('page-add'));
      await c.click('#modal ' + act('lesson-form'));
      await c.fill({ '#lname': 'Cờ vua', '#ls': '15:00', '#le': '16:00' });
      await c.check('#modal input[name="lday"][value="6"]');
      await c.fill({ '#lwhere': 'out' });
      await c.fill({ '#lgo': 'Bố', '#lback': 'Grab', '#lat': 'Nhà văn hoá' });
      await c.click('#modal ' + act('lesson-save'));
      await c.click(act('learn-tab', { v: 'truong' }));
      await c.click(act('tkb-day', { d: '3' }));
      await c.click(act('tkb-day', { d: '5' }));
      await c.click(act('page-add'));
      await c.click('#modal ' + act('tkb-row-add'));
      await c.click('#modal ' + act('tkb-save'));
      await c.check('input[name="truong"][value="moc"]');
      await c.click(act('learn-tab', { v: 'sap-toi' }));
      await c.click(act('learn-tab', { v: 'bai-tap' }));
      await c.click(act('learn-kid', { kid: 'k-sa' }));
      for (const v of ['sap-toi', 'truong', 'hoc-them']) await c.click(act('learn-tab', { v }));
      await c.click(act('learn-kid', { kid: 'all' }));
      // Trang sổ học của từng cô.
      for (const id of ['lop-k-su-0', 'lop-k-su-1', 'lop-k-sa-2', 'lop-k-sa-3']) await c.hash('#lich-hoc/so/' + id);
      await c.hash('#lich-hoc/so/lop-k-su-0');
      await c.click(act('sess-toggle'), { nth: 0 });
      await c.click(act('so-menu'));
      await c.click(X);
      await c.click(act('fee-paid'), { nth: 0, label: 'xác nhận học phí' });
      await c.click(act('fee-unpaid'), { nth: 0 });
      await c.click(act('cls-link'));
      await c.click(X);
      await c.click(act('bank-form'));
      await c.fill({ '#bbank': 'Vietcombank', '#bnumber': '0123456789', '#bholder': 'Nguyen Thi Thao', '#bnote': 'Ghi tên con' });
      await c.click('#modal ' + act('bank-save'));
      await c.hash('#lich-hoc/so/lop-k-sa-2');
      await c.click(act('fee-paid'), { nth: 0, label: 'xác nhận học phí' });
      await c.click(act('so-menu'));
      await c.click('#modal ' + act('cls-form'));
      await c.fill({ '#clfee': '150000', '#clbook': 'Nhật ký Tiếng Việt của Sa' });
      await c.click('#modal ' + act('cls-save'));
      await c.click(act('so-menu'));
      await c.click('#modal ' + act('cls-print'));
      await c.click(act('so-back'));
      await c.hash('#lich-hoc/so/khong-co');
    },
  },

  // Tài khoản: ghi phạt (cả phạt tăng nặng), phí sử dụng theo giờ, thưởng thêm, chi tiêu, phiếu thưởng, duyệt, lịch sử, mục tiêu.
  {
    ten: 'tai-khoan',
    async chay(c) {
      await c.go('/#tai-khoan');
      await c.click(act('acct-preset', { id: 'gia-noi-nong' }), { label: 'ghi phạt Nổi nóng' });
      await c.click(act('acct-preset', { id: 'pen-hw' }), { label: 'ghi phạt Thiếu BTVN lần 1' });
      await c.click(act('acct-preset', { id: 'pen-hw' }), { label: 'ghi phạt Thiếu BTVN lần 2' });
      await c.click(act('acct-preset', { id: 'gia-danh-nhau' }));
      await c.click(act('acct-preset', { id: 'gia-danh-nhau' }), { label: 'bấm lần nữa: mất tiền thưởng tuần' });
      await c.fill({ '#aamt': '7000', '#anote': 'Làm vỡ cốc' });
      await c.click(act('acct-custom'));
      await c.check('input[name="akind"][value="bonus"]');
      await c.fill({ '#aamt': '30000', '#anote': 'Giúp bà' });
      await c.click(act('acct-custom'));
      await c.click(act('acct-preset', { id: 'merit-3' }), { optional: true });
      await c.check('input[name="akind"][value="spend"]');
      await c.fill({ '#ahours': '1.5' });
      await c.click(act('acct-preset', { id: 'gia-xem-tv' }), { label: 'phí sử dụng Xem TV 1,5 giờ' });
      await c.click(act('acct-preset', { id: 'gia-chon-mon-an-sang' }), { optional: true });
      await c.click(act('acct-preset', { id: 'gia-mot-ngay-khong-lam-viec-nha' }), { optional: true });
      await c.fill({ '#askip': '2026-11-25' });
      await c.click('#modal ' + act('acct-preset'), { optional: true, label: 'đổi phiếu nghỉ' });
      await c.fill({ '#aamt': '15000', '#anote': 'Mua kem' });
      await c.click(act('acct-custom'));
      await c.click(act('sec-toggle', { key: 'acct-hist' }));
      await c.click(act('sec-toggle', { key: 'acct-hist' }));
      await c.click(act('hist-all'), { optional: true });
      await c.click(act('ledger-undo'), { nth: 0 });
      await c.click(act('ledger-undo'), { nth: 0, label: 'bấm lần nữa để huỷ' });
      await c.click(act('acct-kid', { kid: 'k-sa' }));
      await c.click(act('merit-ok', { id: 'l4' }));
      await c.click(act('acct-menu'));
      await c.click('#modal ' + act('bal-form'));
      await c.fill({ '[data-bal="k-sa"]': '120000' });
      await c.click('#modal ' + act('bal-save'));
      await c.click(act('page-add'));
      await c.click('#modal ' + act('acct-mode', { v: 'spend' }));
      await c.click(act('goal-form', { id: 'g2' }));
      await c.fill({ '#gprice': '120000', '#gname': 'Sách truyện tranh' });
      await c.click('#modal ' + act('goal-save'));
      await c.click(act('goal-up', { id: 'g3' }), { optional: true });
      await c.click(act('goal-form', { kid: 'k-sa' }));
      await c.fill({ '#gname': 'Bóng rổ', '#gprice': '250000' });
      await c.click('#modal ' + act('goal-save'));
      await c.click(act('goal-buy'), { optional: true });
      await c.click(act('goal-buy'), { optional: true, label: 'bấm lần nữa để mua' });
      await c.click(act('acct-kid', { kid: 'k-su' }));
    },
  },

  // Quy định: menu ⋯ và +, form bốn loại việc và bốn loại mục giá, sửa, xoá, gập nhóm, các bản in.
  {
    ten: 'quy-dinh',
    async chay(c) {
      await c.go('/#quy-dinh');
      await c.click(act('price-menu'));
      await c.click(X);
      for (const kind of ['week', 'each', 'extra', 'fun']) { await c.click(act('page-add')); await c.click('#modal ' + act('chore-form', { kind })); await c.click(X); }
      for (const kind of ['merit', 'penalty', 'fee', 'gift']) { await c.click(act('page-add')); await c.click('#modal ' + act('price-form', { kind })); await c.click(X); }
      await c.click(act('chore-form', { kind: 'week' }));
      await c.fill({ '#cname': 'Tưới cây', '#ctime': '17:00', '#csteps': 'Tưới chậu trước\nTưới chậu sau' });
      await c.check('#modal input[name="cday"][value="0"]', false);
      await c.check('#cimp');
      await c.click('#modal ' + act('chore-save'));
      await c.click(act('chore-form', { id: 'mau-lau-ban' }));
      await c.fill({ '#ckind': 'extra' });
      await c.fill({ '#cmoney': '3000' });
      await c.click('#modal ' + act('chore-save'));
      await c.click(act('chore-form', { id: 'mau-do-rac' }));
      await c.click('#modal ' + act('chore-del'));
      await c.click('#modal ' + act('chore-del'), { label: 'bấm lần nữa để xoá' });
      await c.click(act('chore-form', { id: 'mau-choi-game-hoac-dung-ipad-dien-thoai-15-phut' }));
      await c.click(X);
      await c.click(act('price-form', { id: 'gia-noi-tuc' }));
      await c.fill({ '#pprice': '15000', '#pagain': '30000' });
      await c.click('#modal ' + act('price-save'));
      await c.click(act('price-form', { kind: 'penalty' }));
      await c.fill({ '#pname': 'Bỏ bữa', '#pprice': '5000' });
      await c.click('#modal ' + act('price-save'));
      await c.click(act('price-form', { kind: 'gift' }));
      await c.fill({ '#pname': 'Đi công viên', '#pprice': '30000', '#pnote': 'Cuối tuần' });
      await c.click('#modal ' + act('price-save'));
      await c.click(act('sec-toggle', { key: 'bg-week' }));
      await c.click(act('sec-toggle', { key: 'bg-week' }));
      await c.click(act('sec-toggle', { key: 'bg-extra' }));
      await c.click(act('price-menu'));
      await c.click('#modal ' + act('prices-print'));
      await c.click(act('price-menu'));
      await c.click('#modal ' + act('coupons-print'));
      await c.click(act('price-menu'));
      await c.click('#modal ' + act('sheet-open'));
      await c.click('#modal ' + act('print'));
      await c.click(X);
      await c.go('/#bang-gia', 'mở link cũ #bang-gia');
    },
  },

  // Gia đình: sửa con, thêm con, các con ở đâu, đặt mã PIN, nạp lịch, link cho máy của con.
  {
    ten: 'gia-dinh',
    async chay(c) {
      await c.go('/#gia-dinh');
      await c.click(act('kid-form', { id: 'k-su' }));
      await c.fill({ '#kdb': '20000' });
      await c.check('#modal input[name="kava"][value="set:ngua"]');
      await c.click('#modal ' + act('kid-save'));
      await c.click(act('page-add'));
      await c.fill({ '#kname': 'Bin' });
      await c.click(X);
      await c.click(act('stay-form'));
      await c.fill({ '[data-sn="0"]': 'Nhà B4', '[data-sd="3"]': 'Nhà ông bà' });
      await c.click('#modal ' + act('stay-save'));
      await c.click(act('seed-form'));
      await c.click(X);
      await c.click(act('pin-set'));
      await c.fill({ '#pin': '1234' });
      await c.click('#modal ' + act('pin-ok'));
      await c.click(act('role-kid', { kid: 'k-sa' }));
      await c.click(X);
      await c.click(act('pin-clear'));
      await c.click(act('pin-clear'), { label: 'bấm lần nữa để bỏ mã PIN' });
      await c.hash('#hom-nay');
    },
  },

  // Máy của con có mã PIN: chỉ thấy phần của Su, ba tab, tự thêm bài, báo thành tích, nhập PIN để thành máy bố mẹ.
  {
    ten: 'may-con',
    sua: (ls, { pinHash, PIN }) => { const d = data(ls); d.paid.caidat = { ...d.paid.caidat, pin: pinHash(PIN) }; ls[MAIN] = JSON.stringify(d); ls['be-cham-ngoan-role'] = JSON.stringify({ local: 'k-su' }); return ls; },
    async chay(c) {
      await c.go('/');
      await c.click('#km ' + act('tick', { kid: 'k-su', chore: 'mau-don-ban-hoc' }));
      await c.click('#km ' + act('step', { kid: 'k-su', chore: 'mau-checklist-truoc-khi-di-ngu', i: 3 }));
      await c.click('#km ' + act('task-done'), { nth: 0 });
      await c.click('#km ' + act('tkb-go'), { nth: 0 });
      await c.check('#km input[name="kmtab"][value="learn"]');
      for (const v of ['bai-tap', 'truong', 'hoc-them', 'sap-toi']) await c.click('#km ' + act('learn-tab', { v }));
      await c.click('#km ' + act('learn-tab', { v: 'bai-tap' }));
      await c.click('#km ' + act('task-form'), { nth: 0 });
      await c.fill({ '#ttitle': 'Con tự ghi: học từ mới' });
      await c.click('#modal ' + act('task-save'));
      await c.check('#km input[name="kmtab"][value="acct"]');
      await c.click('#km ' + act('merit-open', { kid: 'k-su' }));
      await c.click('#modal ' + act('merit-pick'), { nth: 0 });
      await c.click('#modal ' + act('merit-ask'));
      await c.click('#km ' + act('merit-cancel'), { nth: 0 });
      await c.click('#km ' + act('merit-cancel'), { nth: 0, label: 'bấm lần nữa để huỷ' });
      await c.check('#km input[name="kmtab"][value="today"]');
      await c.click('#km ' + act('fun-form', { kid: 'k-su' }));
      await c.fill({ '#fname': 'Vẽ tranh' });
      await c.click('#modal ' + act('fun-ask'));
      // Máy của con không làm được việc của bố mẹ: bấm thử vẫn không có gì đổi.
      await c.eval(() => { const b = document.createElement('button'); b.dataset.act = 'kid-del'; b.dataset.id = 'k-sa'; document.body.appendChild(b); b.click(); b.remove(); });
      await c.snap('thử bấm Xoá con trên máy của con');
      await c.click('#km ' + act('role-parent'));
      await c.fill({ '#pin': '0000' });
      await c.click('#modal ' + act('pin-ok'), { label: 'nhập sai PIN' });
      await c.fill({ '#pin': '1234' });
      await c.click('#modal ' + act('pin-ok'), { label: 'nhập đúng PIN' });
    },
  },

  // Nhà có mã PIN mà máy này chưa chọn là của ai: hỏi một lần, chọn Sa.
  {
    ten: 'may-chua-chon',
    sua: (ls, { pinHash, PIN }) => { const d = data(ls); d.paid.caidat = { ...d.paid.caidat, pin: pinHash(PIN) }; ls[MAIN] = JSON.stringify(d); return ls; },
    async chay(c) {
      await c.go('/');
      await c.click(act('role-kid', { kid: 'k-sa' }));
      await c.click('#modal ' + act('role-kid-ok', { kid: 'k-sa' }));
      await c.check('#km input[name="kmtab"][value="acct"]');
      await c.reload();
    },
  },

  // Màn của cô (?lop=): ba tab, ghi buổi, giao bài, chấm bài, tài khoản, in báo cáo; rồi máy bố mẹ tự trừ tiền Thiếu BTVN.
  {
    ten: 'man-co',
    async chay(c, { diem }) {
      const tv = lopCode(diem, 'lop-k-su-0'), toan = lopCode(diem, 'lop-k-sa-3');
      await c.go('/?lop=' + tv);
      await c.click(act('sess-toggle'), { nth: 0 });
      await c.click(act('so-plan-more'));
      await c.click(act('sec-toggle', { key: 'so-m-2026-10' }));
      await c.click(act('sess-view'), { nth: 0, optional: true });
      await c.click(X, { optional: true });
      await c.click(act('sess-form', { id: 'xl-12' }));
      await c.click(X);
      await c.click(act('sess-form'), { nth: 0 });
      await c.fill({ '#scontent': 'Ôn tập từ láy', '#snote': 'Con làm bài tốt', '#snext': 'Viết đoạn văn' });
      await c.fill({ '#shw-list .hw-in': 'Làm bài 1 và bài 2' });
      await c.click('#modal ' + act('hw-row-add'));
      await c.click('#modal ' + act('sess-save'));
      await c.click(act('t-tab', { v: 'bai' }));
      await c.click(act('hw-form'), { nth: 1 });
      await c.fill({ '#hscore': '9', '#hreview': 'Chữ đẹp' });
      await c.click('#modal ' + act('hw-save'));
      await c.click(act('t-tab', { v: 'bao-cao' }));
      await c.click(act('t-menu'));
      await c.click('#modal ' + act('so-print'));
      await c.click(act('bank-form'));
      await c.fill({ '#bbank': 'Techcombank', '#bnumber': '1903 1234 5678', '#bholder': 'Tran Thi Thao' });
      await c.click('#modal ' + act('bank-save'));
      await c.click(act('t-tab', { v: 'buoi' }));
      await c.click(act('so-off'), { nth: 0, optional: true });
      // Sổ trống (Toán của Sa): ghi hai buổi, buổi sau chấm bài buổi trước là Thiếu.
      await c.go('/?lop=' + toan);
      await c.click(act('sess-form'), { nth: 0 });
      await c.fill({ '#sdate': '2026-11-19' });
      await c.fill({ '#scontent': 'Phân số', '#snote': 'Cần cẩn thận hơn' });
      await c.fill({ '#shw-list .hw-in': 'Bài tập phân số trang 12' });
      await c.click('#modal ' + act('sess-save'));
      await c.click(act('sess-form'), { nth: 0 });
      await c.fill({ '#sdate': '2026-11-23' });
      await c.fill({ '#scontent': 'Số thập phân', '#snote': 'Hiểu bài' });
      await c.check('#modal .hw-chk input[value="thieu"]');
      await c.check('#modal .hw-chk input[value="thieu-nua"]');
      await c.fill({ '#shw-list .hw-in': 'Bài tập số thập phân' });
      await c.click('#modal ' + act('sess-save'));
      await c.click(act('t-tab', { v: 'bai' }));
      await c.go('/#hom-nay', 'máy bố mẹ mở app: tự trừ tiền Thiếu BTVN');
      await c.click(act('today-kid', { kid: 'k-sa' }));
      await c.hash('#tai-khoan');
    },
  },

  // ----- Đường chạy bằng Firebase, với Firestore giả trong trang (firebase-gia.mjs), không có gì gửi ra ngoài -----
  // Nhà mở bằng ?gd=: các tab, đóng dấu, duyệt, học phí, phạt, sửa việc, đặt PIN, link cho máy của con.
  {
    ten: 'firebase-bo-me',
    fb: ({ diem, firestoreFromLs }) => firestoreFromLs(diem.ls, FAM),
    async chay(c) {
      await c.go(`/?gd=${FAM}#hom-nay`);
      await c.click(act('tick', { kid: 'k-su', chore: 'mau-don-ban-hoc' }));
      await c.click(act('step', { kid: 'k-su', chore: 'mau-checklist-truoc-khi-di-ngu', i: 0 }));
      await c.click(act('merit-ok', { id: 'l4' }));
      await c.click(act('fun-ok', { id: 'xin-a1' }));
      await c.click(act('today-kid', { kid: 'k-sa' }));
      await c.click(act('tick', { kid: 'k-sa', chore: 'mau-xep-bat-vao-may' }));
      await c.hash('#lich-hoc');
      for (const v of ['bai-tap', 'truong', 'hoc-them']) await c.click(act('learn-tab', { v }));
      await c.hash('#lich-hoc/so/lop-k-su-0');
      await c.click(act('fee-paid'), { nth: 0, label: 'xác nhận học phí' });
      await c.click(act('so-back'));
      await c.hash('#tai-khoan');
      await c.click(act('acct-preset', { id: 'gia-noi-nong' }), { label: 'ghi phạt Nổi nóng' });
      await c.hash('#quy-dinh');
      await c.click(act('chore-form', { id: 'mau-lau-ban' }));
      await c.fill({ '#cmoney': '3000' });
      await c.click('#modal ' + act('chore-save'));
      await c.hash('#gia-dinh');
      await c.click(act('pin-set'));
      await c.fill({ '#pin': '1234' });
      await c.click('#modal ' + act('pin-ok'));
      await c.click(act('copy-kid-link', { kid: 'k-sa' }));
      await c.click(act('copy-invite'), { optional: true });
      await c.reload();
    },
  },

  // Máy của con mở bằng link riêng (?gd=…&con=…), nhà có mã PIN; nhập PIN để thành máy bố mẹ.
  {
    ten: 'firebase-may-con',
    fb: ({ diem, firestoreFromLs, pinHash, PIN }) => { const d = firestoreFromLs(diem.ls, FAM), k = `families/${FAM}/paid/caidat`; d[k] = { ...d[k], pin: pinHash(PIN) }; return d; },
    async chay(c) {
      await c.go(`/?gd=${FAM}&con=k-su`);
      await c.click('#km ' + act('tick', { kid: 'k-su', chore: 'mau-don-ban-hoc' }));
      await c.check('#km input[name="kmtab"][value="learn"]');
      await c.check('#km input[name="kmtab"][value="acct"]');
      await c.click('#km ' + act('role-parent'));
      await c.fill({ '#pin': '1234' });
      await c.click('#modal ' + act('pin-ok'));
      await c.reload();
    },
  },

  // Lần mở đầu trên Firebase từ dữ liệu thử: dán link riêng của Sa ở màn mở đầu, app tự thêm, tạo và tự nhập sổ trên Firestore giả.
  {
    ten: 'firebase-mo-dau',
    gio: 'mo-dau',
    fb: ({ seed, firestoreFromData }) => firestoreFromData(seed, FAM),
    async chay(c) {
      await c.go('/');
      await c.fill({ '#famcode': `http://may-thu/?gd=${FAM}&con=k-sa` });
      await c.click('[data-setup="join"]');
      await c.cho(15000, 'sau khi app tự thêm, tự nhập sổ');
      await c.reload('tải lại lần 1');
      await c.reload('tải lại lần 2');
    },
  },

  // Nhà mới trên Firebase: tạo gia đình, thêm con, dùng bảng mẫu, rồi rời gia đình.
  {
    ten: 'firebase-nha-moi',
    fb: () => ({}),
    async chay(c) {
      await c.go('/');
      await c.click('[data-setup="new"]');
      await c.click(act('kid-form'), { nth: 0 });
      await c.fill({ '#kname': 'Bin' });
      await c.click('#modal ' + act('kid-save'));
      await c.click(act('seed'), { optional: true });
      await c.hash('#quy-dinh');
      await c.hash('#gia-dinh');
      await c.click(act('leave'));
      await c.click(act('leave'), { label: 'bấm lần nữa để rời gia đình' });
    },
  },

  // Màn của cô trên Firebase, rồi máy bố mẹ mở sổ đó.
  {
    ten: 'firebase-co',
    fb: ({ diem, firestoreFromLs }) => firestoreFromLs(diem.ls, FAM),
    async chay(c, { diem }) {
      const toan = lopCode(diem, 'lop-k-sa-3');
      await c.go('/?lop=' + toan);
      await c.click(act('sess-form'), { nth: 0 });
      await c.fill({ '#sdate': '2026-11-19' });
      await c.fill({ '#scontent': 'Phân số', '#snote': 'Làm bài tốt' });
      await c.fill({ '#shw-list .hw-in': 'Bài tập phân số trang 12' });
      await c.click('#modal ' + act('sess-save'));
      await c.click(act('t-tab', { v: 'bai' }));
      await c.click(act('t-tab', { v: 'bao-cao' }));
      await c.click(act('bank-form'));
      await c.fill({ '#bbank': 'ACB', '#bnumber': '123456', '#bholder': 'Co Hai' });
      await c.click('#modal ' + act('bank-save'));
      await c.go(`/?gd=${FAM}#lich-hoc/so/lop-k-sa-3`, 'máy bố mẹ mở sổ trên Firebase');
    },
  },

  // Cập nhật theo bảng mẫu (con chưa ghi bản 2): trang Quy định gợi ý, áp dụng, khớp số dư theo bảng chốt.
  {
    ten: 'bang-mau',
    sua: sua(d => { d.kids['k-sa'].tableVer = 1; d.kids['k-sa'].name = 'Sa'; delete d.kids['k-sa'].dayFrom; d.chores['mau-lau-ban'].money = 1000; d.rewards['gia-noi-nong'].price = 5000; }),
    async chay(c) {
      await c.go('/#quy-dinh');
      await c.click(act('table-update'));
      await c.click('#modal ' + act('table-apply'));
      await c.hash('#tai-khoan');
      await c.click(act('acct-kid', { kid: 'k-sa' }));
    },
  },
];
