# Misa Misu: ghi chú cho Claude

App web tĩnh (HTML, CSS, JavaScript thuần, không có bước build) cho một gia đình: việc nhà, tiền tiêu vặt, lịch học của các con, sổ học của các cô dạy thêm. Giao diện, dữ liệu và chú thích trong mã đều bằng tiếng Việt. Xem README.md để biết chi tiết từng tính năng.

Chạy thử: `python3 -m http.server 8000`. `js/config.js` đang trỏ tới Firebase thật của gia đình: khi chạy thử để kiểm tra, cho `js/config.js` trả về `export const firebaseConfig = null;` (app lưu trên trình duyệt) để không ghi vào dữ liệu thật. Bộ kiểm tra `tools/kiem-tra/` đã tự làm việc này (xem mục Kiểm tra).

## Sơ đồ màn

Năm tab của bố mẹ, mỗi tab trả lời một câu hỏi:

| Tab | Câu hỏi | Gồm |
| --- | --- | --- |
| Hôm nay (`#hom-nay`) | Hôm nay con cần làm gì? | Theo từng con. Thông báo cần bố mẹ chú ý ở đầu màn (chờ duyệt, sổ học của cô), tiến độ và số dư, khối nhắc, bài cần nộp, việc ôn thi tới ngày, các buổi trong ngày, việc làm thêm. Menu ⋯: Xem cả tuần, Chế độ cho bé, In kế hoạch tuần, … nghỉ học (thêm ngày nghỉ cho ngày đang xem), Sửa danh sách việc nhà (mở Quy định). Máy bố mẹ: bấm vào việc hay buổi học thêm để sửa. Máy tính màn rộng chia hai cột (các buổi bên trái, thông báo và nhắc bên phải). |
| Học tập (`#lich-hoc`) | Các con học gì, nộp gì, ai đưa đón? | Cả nhà hoặc từng con. Ba tab chia theo nguồn: Trên lớp (thanh gạt Bài tập / Thời khoá biểu / Mốc năm học; bài tập ở đây do bố mẹ hoặc con tự ghi), Học thêm (Sổ học của cô: mỗi sổ một thẻ có buổi vừa qua và bài tập về nhà cô giao; Học phí của tất cả các cô; Lịch học thêm và đưa đón), Thi (lịch thi các môn của từng con, nội dung ôn tập, kế hoạch ôn tập; lịch thi luôn của đúng một con, không ghi chung cả nhà; chỉ hiện kỳ thi gần nhất, các kỳ khác gập ở Kỳ thi khác; app không thêm sẵn kỳ thi, bố mẹ nhập khi có). Mỗi sổ học là một trang riêng `#lich-hoc/so/<mã sổ>` có nút quay lại. |
| Tài khoản (`#tai-khoan`) | Con có bao nhiêu tiền, vì sao? | Theo từng con. Số dư, chờ duyệt thành tích, Ghi cho con (Phạt, Thưởng thêm, Chi tiêu), mục tiêu tiết kiệm, lịch sử. |
| Quy định (`#quy-dinh`, link cũ `#bang-gia`) | Nhà mình có việc gì, thưởng phạt thế nào? | Nơi duy nhất thêm, sửa, xoá việc nhà (bốn loại) và mục giá (thành tích, phạt, phí sử dụng, phiếu thưởng). Menu ⋯: in bảng giá, phiếu thưởng, kế hoạch tuần. |
| Gia đình (`#gia-dinh`) | Cài đặt của cả nhà | Các con, các con ở đâu, Chia sẻ và máy của con (link mời người nhà, mã PIN, link riêng cho máy của từng con), Sao lưu. |

- Máy của con (nhà có mã PIN) và Chế độ cho bé dùng chung một màn với ba tab: Hôm nay, Học tập (ba tab như bố mẹ, chỉ xem, không có trang sổ, nhận xét học sinh và học phí, nhớ tab riêng; con tự thêm bài của mình, tick bài và việc ôn thi), Tài khoản (chỉ xem). Báo thành tích có ở cả tab Hôm nay và tab Tài khoản của con.
- Màn của cô (`?lop=<mã lớp>`): ba tab Buổi học, Bài tập, Báo cáo (menu ⋯: In báo cáo, Nhập từ file Excel); chỉ đọc và ghi được sổ của lớp đó.

## Quy tắc đặt chỗ

- Thứ con phải làm hoặc cần biết trong hôm nay: Hôm nay. Thứ không phải việc thì gọn trong một dòng nhắc.
- Lịch học, bài tập, sổ học của cô, học phí, lịch thi: Học tập. Bài bố mẹ và con tự ghi ở tab Trên lớp; thứ cô dạy thêm ghi trong sổ tự hiện ở tab Học thêm; lịch thi, kiểm tra ở tab Thi (không nằm trong Mốc năm học).
- Tiền vào, tiền ra của con: Tài khoản.
- Có những việc gì, bao nhiêu tiền, phạt gì: Quy định.
- Cài đặt ít dùng: Gia đình.
- Mỗi thứ chỉ thêm, sửa, xoá ở một chỗ. Nơi khác chỉ hiện tóm tắt và bấm để sang chỗ đó.
- Giữ những gì đang dùng tốt. Thông báo cần bố mẹ chú ý (chờ duyệt, sổ học của cô, bài cần nộp) nằm ở đầu màn Hôm nay cho dễ thấy, không chuyển xuống. Chỉ sửa chỗ thật sự vô lý: trùng chỗ, sai chỗ, lệch tên.

## Tên gọi

Dùng đúng các tên này trên mọi màn, form, thông báo và bản in.

| Thứ | Gọi là | Không dùng |
| --- | --- | --- |
| Việc mỗi ngày không cộng tiền từng lần, làm đủ thì được thưởng ngày (`kind: 'must'`, `money: 0`) | Việc phải làm | việc bắt buộc mỗi ngày |
| Việc phải làm cần nhắc ở đầu mỗi buổi (`imp`) | Việc quan trọng | |
| Việc mỗi ngày, làm lần nào cộng tiền lần đó (`kind: 'must'`, `money > 0`) | Việc được thưởng | tiền từng lần, việc có tiền |
| Việc không bắt buộc, làm lúc nào được tiền lúc đó (`kind: 'extra'`) | Việc làm thêm | |
| Việc mở khoá khi xong việc phải làm (`kind: 'fun'`) | Việc thích làm | |
| Thứ con dùng tiền để đổi (mục giá `kind: 'gift'`) | Phiếu thưởng | đổi quà |
| Mốc `kind: 'holiday'`, `off`: `school` / `lessons` / `both` | Ngày nghỉ: Nghỉ học chính, Nghỉ học thêm, Nghỉ cả hai | |
| Việc chuẩn bị cho hôm sau mà hôm sau nghỉ (hiện mờ) | Không cần làm | |
| Tiền trừ theo giờ xem TV, chơi game, điện thoại (`kind: 'fee'`) | Phí sử dụng | |
| Khoản bố mẹ cộng thêm (`ledger.kind: 'bonus'`) | Thưởng thêm | |
| Điểm tốt, được khen (mục giá `kind: 'merit'`) | Thành tích | |
| Trang việc nhà và mục giá | Quy định | Bảng giá (chỉ là tên tờ in "In bảng giá") |
| Sổ của cô dạy thêm | Sổ học của cô; mỗi sổ tên "Nhật ký học" kèm môn | |
| Kỳ thi, bài kiểm tra có ngày (mốc `kind: 'exam'`, `kids` có đúng một con, có thêm `subj`, `content`, `plan`) | Lịch thi; mỗi môn là một Môn thi, có Nội dung ôn tập và Kế hoạch ôn tập (mỗi dòng là một việc ôn) | mốc kiểm tra |

Trong mã, bốn loại việc nằm ở `CHORE_KINDS` (`week`, `each`, `extra`, `fun`), `choreKindOf(c)` cho biết một việc thuộc loại nào.

## Mã

Mỗi màn một module ES trong `js/`, không có bước build (GitHub Pages phục vụ file nguyên trạng). `index.html` nạp `js/app.js`, các module khác được import từ đó. Trong mỗi file, các phần mở đầu bằng dòng `// ---------- tên phần ----------`.

| File | Gồm |
| --- | --- |
| `js/app.js` | Điểm vào: vẽ khung (`draw`), thanh điều hướng, điều hướng bằng `#hash`, mở gia đình (Firebase hoặc trình duyệt), màn mở đầu, khởi động, màn của cô |
| `js/chung.js` | Hàm dùng chung không cần dữ liệu: ngày giờ (`key`, `parse`, `today`…), tiền (`money`), `esc`, `norm`, `slug`, `uid`, hình SVG nhỏ, `toast`, `confetti`, `printHtml` |
| `js/nha-minh.js` | Dữ liệu riêng của nhà mình: tên các con (`SU`, `SA`, `isSu`, `isSa`), thời khoá biểu, lịch năm học, các nơi ở, các cô (`FIXED_SCHED`, `SAMPLE_CLASSES`, `SU_TV_…`), ngày hwFrom, số dư lúc chốt bảng |
| `js/du-lieu.js` | Lõi: trạng thái (`S`, `UI`, `store`…), ghi dữ liệu (`put`, `del`, `setDone`), máy của ai (`deviceRole`), tính tiền, thưởng, chuỗi ngày, phần dữ liệu của lịch (thời khoá biểu, mốc, học thêm, các con ở đâu, buổi), `render` |
| `js/giao-dien.js` | Mảnh giao diện dùng chung: hình của con, `secHead`, thanh tiến độ, `kidTabs`, nút ⋯ và +, ô trống để thêm |
| `js/form.js` | `openModal`, `closeModal`, các dòng của form (`frow`, `pillSel`, `titleCard`, `kidRow`…), `menuSheet` |
| `js/hom-nay.js` | Màn Hôm nay (các buổi, `dayPlan`), thêm việc nhanh, xem cả tuần, in kế hoạch tuần, đóng dấu việc (`markChore`) |
| `js/hoc-tap.js` | Màn Học tập: Trên lớp (bài tập, thời khoá biểu, mốc năm học), Học thêm, Thi (lịch thi, nội dung và kế hoạch ôn tập, việc ôn tới ngày `studySoon`); form thời khoá biểu, buổi học thêm, bài tập, mốc, lịch thi |
| `js/so-hoc.js` | Sổ học của cô: thẻ sổ ở tab Học thêm (`classesSection`), trang sổ, học phí, bài cô giao (`classTasks`), tự trừ tiền Thiếu BTVN, màn của cô (`drawTeacher`), file đính kèm, nhập Excel |
| `js/tai-khoan.js` | Màn Tài khoản, chờ duyệt, việc thích làm con xin, mục tiêu tiết kiệm |
| `js/quy-dinh.js` | Màn Quy định, bảng mẫu (`SAMPLE_CHORES`, `SAMPLE_PRICES`…), cập nhật theo bảng mẫu, form việc nhà (`CHORE_KINDS`) và mục giá |
| `js/gia-dinh.js` | Màn Gia đình: các con (form, ảnh, hình đại diện), các con ở đâu, mã PIN, máy của con, sao lưu, lịch mã hoá |
| `js/man-con.js` | Màn của con (`drawKidMode`): máy của con và Chế độ cho bé |
| `js/mot-lan.js` | Sửa dữ liệu một lần: `autoFill`, `autoAdds` (cờ trong `paid/caidat`), tự nhập và tự sửa sổ từ `data/*.json`; đầu file ghi bước nào bỏ được sau |
| `js/thao-tac.js` | Bộ xử lý nút bấm theo `data-act`, `KID_ACTS`, `TEACH_ACTS`, nút + (`pageAdd`), các sự kiện change, input, phím, vuốt, giữ nút |
| `js/store.js` | Mô tả dữ liệu (đầu file) và nơi lưu (trình duyệt hoặc Firestore) |

Lớp dưới không import lớp trên: `chung`, `nha-minh` ← `du-lieu` ← `giao-dien` ← `form` ← các màn ← `thao-tac` ← `app`. Hiện không có vòng import. Lớp dưới cần gọi lên trên thì lớp trên đăng ký: `setDraw` (app.js đặt hàm vẽ cho `render`), `onCloseModal` (việc làm khi đóng form), `onSoData` (việc làm mỗi khi một sổ có dữ liệu). Nếu buộc phải có vòng import thì mã ở cấp file (ngoài hàm) không được dùng tên của module cùng vòng.

- Biến trạng thái là `export let`: module khác đọc được giá trị mới nhất nhưng không gán lại được. Đổi bằng hàm của module chủ: `setData` (S), `setStore`, `setLoaded`, `setStale`, `setFamilyCode`, `setRO`, `setTeach`, `clearMemo` (du-lieu.js); `setModalDirty` (form.js); `setPhotoEdit`, `setSeedChecked` (gia-dinh.js); `attClear` (so-hoc.js). `UI` và `CLS` là đối tượng dùng chung, sửa thuộc tính trực tiếp.
- Dùng tên của module khác thì thêm vào dòng `import` đầu file; `tools/kiem-tra/module.mjs` báo tên chưa import, import thừa, import sai tên.
- Mọi nút bấm đi qua một bộ xử lý theo `data-act` (thao-tac.js); máy của con chỉ được làm các thao tác trong `KID_ACTS`, màn của cô trong `TEACH_ACTS`. Thao tác mới mà con hay cô cũng được làm thì thêm vào đó.
- Thêm nhóm dữ liệu mới thì thêm vào `COLS` (store.js) và `firestore.rules`.
- Dữ liệu chỉ đúng với nhà mình (tên các con, các cô, lịch, ngày cụ thể) ghi ở `js/nha-minh.js`; chỗ khác dùng `SU`, `SA`, `isSu`, `isSa`, không ghi tên trực tiếp.
- Sửa dữ liệu một lần cho cả nhà: làm trong `autoAdds()` (mot-lan.js), đánh dấu bằng một cờ trong `paid/caidat` để không chạy lại; sửa một lần cho một sổ thì dùng cờ trong `info/fixes` của sổ. Ghi vào danh sách bỏ được sau ở đầu mot-lan.js.
- Việc mới ghi `since` (ngày thêm); đổi mức thưởng ghi vào `wbLog`, `dbLog`; để tiền của các ngày đã qua không đổi.
- Kiểm tra cú pháp từng file bằng `node --input-type=module --check < js/ten-file.js`; lệnh `node --check` thường không bắt được lỗi trong các file này (ví dụ khai báo trùng tên biến).
- Đặt tên lớp CSS mới thì tìm trước trong `styles.css` cho khỏi trùng: ví dụ `.today` đã là ô hôm nay của dải 7 ngày và thanh chọn thứ.
- Chữ trên giao diện: tiếng Việt có dấu, câu ngắn, gọi đúng tên ở bảng trên. Đổi tính năng thì sửa luôn README.md và, nếu đổi chỗ hay đổi tên, sửa file này.

## Kiểm tra

`tools/kiem-tra/` mở app trong Chromium (Playwright có sẵn) với dữ liệu thử Su, Sa, đi qua mọi màn ở khổ 390×844 và 1280×860, ghi innerHTML của `#app`, `#km`, `#modal` và localStorage sau từng bước, rồi so hai lần chạy. Nó tự chặn `js/config.js` (trả về `null`) và mọi request ra ngoài, cố định giờ, múi giờ và số ngẫu nhiên. Các cảnh `firebase-…` chạy đường Firebase của app với Firestore giả trong trang (`firebase-gia.mjs`), không gửi gì ra ngoài. Trước khi sửa, chạy để làm mốc; sửa xong chạy lại và so:

```bash
node tools/kiem-tra/chay.mjs chay --ra /tmp/truoc.json
```

```bash
node tools/kiem-tra/chay.mjs chay --ra /tmp/sau.json --so /tmp/truoc.json
```

- Dọn mã (không đổi giao diện, dữ liệu) thì phải giống hệt và không có lỗi. Đổi giao diện có chủ ý thì các chỗ khác phải đúng chỗ đã đổi.
- Thêm tính năng thì thêm bước vào `tools/kiem-tra/canh.mjs` (`node tools/kiem-tra/chay.mjs liet-ke '#màn'` liệt kê các nút của một màn).
- Mọi lần chạy bắt đầu từ `diem-xuat-phat.json` (localStorage sau lần mở đầu với `du-lieu-thu.mjs`). Đổi dữ liệu thử hay đổi các bước trong mot-lan.js thì tạo lại bằng `node tools/kiem-tra/chay.mjs tao-diem-xuat-phat` (chạy trên bản cũ trước nếu muốn so).
- Dữ liệu thử không ghi ngày sinh hay thông tin riêng nào chưa có trong repo.
