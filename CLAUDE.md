# Misa Misu: ghi chú cho Claude

App web tĩnh (HTML, CSS, JavaScript thuần, không có bước build) cho một gia đình: việc nhà, tiền tiêu vặt, lịch học của các con, sổ học của các cô dạy thêm. Giao diện, dữ liệu và chú thích trong mã đều bằng tiếng Việt. Xem README.md để biết chi tiết từng tính năng.

Chạy thử: `python3 -m http.server 8000`. `js/config.js` đang trỏ tới Firebase thật của gia đình: khi chạy thử để kiểm tra, cho `js/config.js` trả về `export const firebaseConfig = null;` (app lưu trên trình duyệt) để không ghi vào dữ liệu thật.

## Sơ đồ màn

Năm tab của bố mẹ, mỗi tab trả lời một câu hỏi:

| Tab | Câu hỏi | Gồm |
| --- | --- | --- |
| Hôm nay (`#hom-nay`) | Hôm nay con cần làm gì? | Theo từng con. Thông báo cần bố mẹ chú ý ở đầu màn (chờ duyệt, sổ học của cô), tiến độ và số dư, khối nhắc, bài cần nộp, các buổi trong ngày, việc làm thêm. Menu ⋯: Xem cả tuần, Chế độ cho bé, In kế hoạch tuần, Sửa danh sách việc nhà (mở Quy định). |
| Học tập (`#lich-hoc`) | Các con học gì, nộp gì, ai đưa đón? | Cả nhà hoặc từng con. Bốn tab chia theo nguồn: Sắp tới (lịch gộp từng ngày, kèm các con ở đâu hôm đó), Bài tập, Ở trường (thanh gạt Thời khoá biểu / Mốc năm học), Học thêm (lịch học thêm và đưa đón, Học phí của tất cả các cô, Sổ học của cô). Mỗi sổ học là một trang riêng `#lich-hoc/so/<mã sổ>` có nút quay lại. |
| Tài khoản (`#tai-khoan`) | Con có bao nhiêu tiền, vì sao? | Theo từng con. Số dư, chờ duyệt thành tích, Ghi cho con (Phạt, Thưởng thêm, Chi tiêu), mục tiêu tiết kiệm, lịch sử. |
| Quy định (`#quy-dinh`, link cũ `#bang-gia`) | Nhà mình có việc gì, thưởng phạt thế nào? | Nơi duy nhất thêm, sửa, xoá việc nhà (bốn loại) và mục giá (thành tích, phạt, phí sử dụng, phiếu thưởng). Menu ⋯: in bảng giá, phiếu thưởng, kế hoạch tuần. |
| Gia đình (`#gia-dinh`) | Cài đặt của cả nhà | Các con, các con ở đâu, máy của con và mã PIN, link mời, sao lưu. |

- Máy của con (nhà có mã PIN) và Chế độ cho bé dùng chung một màn với ba tab: Hôm nay, Học tập (bốn tab như bố mẹ, chỉ xem, không có sổ học và học phí, nhớ tab riêng), Tài khoản (chỉ xem). Báo thành tích có ở cả tab Hôm nay và tab Tài khoản của con.
- Màn của cô (`?lop=<mã lớp>`): ba tab Buổi học, Bài tập, Báo cáo; chỉ đọc và ghi được sổ của lớp đó.

## Quy tắc đặt chỗ

- Thứ con phải làm hoặc cần biết trong hôm nay: Hôm nay. Thứ không phải việc thì gọn trong một dòng nhắc.
- Lịch học, bài tập, sổ học của cô, học phí: Học tập.
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
| Tiền trừ theo giờ xem TV, chơi game, điện thoại (`kind: 'fee'`) | Phí sử dụng | |
| Khoản bố mẹ cộng thêm (`ledger.kind: 'bonus'`) | Thưởng thêm | |
| Điểm tốt, được khen (mục giá `kind: 'merit'`) | Thành tích | |
| Trang việc nhà và mục giá | Quy định | Bảng giá (chỉ là tên tờ in "In bảng giá") |
| Sổ của cô dạy thêm | Sổ học của cô; mỗi sổ tên "Nhật ký học" kèm môn | |

Trong mã, bốn loại việc nằm ở `CHORE_KINDS` (`week`, `each`, `extra`, `fun`), `choreKindOf(c)` cho biết một việc thuộc loại nào.

## Mã

- `js/app.js`: toàn bộ màn hình và thao tác, mỗi phần mở đầu bằng dòng `// ---------- tên phần ----------`. Mọi nút bấm đi qua một bộ xử lý theo `data-act`; máy của con chỉ được làm các thao tác trong `KID_ACTS`, màn của cô trong `TEACH_ACTS`.
- `js/store.js`: mô tả dữ liệu (đầu file) và nơi lưu (trình duyệt hoặc Firestore). Thêm nhóm dữ liệu mới thì thêm vào `COLS` và `firestore.rules`.
- Sửa dữ liệu một lần cho cả nhà: làm trong `autoAdds()`, đánh dấu bằng một cờ trong `paid/caidat` để không chạy lại.
- Việc mới ghi `since` (ngày thêm); đổi mức thưởng ghi vào `wbLog`, `dbLog`; để tiền của các ngày đã qua không đổi.
- Chữ trên giao diện: tiếng Việt có dấu, câu ngắn, gọi đúng tên ở bảng trên. Đổi tính năng thì sửa luôn README.md và, nếu đổi chỗ hay đổi tên, sửa file này.
