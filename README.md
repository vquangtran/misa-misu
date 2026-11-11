# Bé Chăm Ngoan

Bảng việc nhà cho các con, bằng tiếng Việt:

- **Hôm nay:** mỗi con đóng dấu sao cho việc đã làm. Nếu con có thời khoá biểu thì hiện luôn giờ ở trường và các môn hôm nay; sau giờ tan học đổi thành các môn cần soạn cặp cho buổi học tiếp theo.
- **Lịch học:** thời khoá biểu ở trường của từng con (lớp, năm học, giờ từng tiết, nghỉ trưa, có thể học cả Thứ Bảy). Tô sáng ngày hôm nay và tiết đang học, đếm số tiết mỗi môn và số giờ con ở trường mỗi tuần, in khổ ngang để dán bàn học.
- **Chế độ cho bé:** chữ và nút to để con tự đánh dấu. Muốn thoát thì giữ nút 1 giây.
- **Phần thưởng:** đổi sao lấy quà, thưởng thêm hoặc trừ sao, có lịch sử.
- **Tiền tiêu vặt:** tính theo tuần, theo việc đã làm hoặc nhận đủ. Bố mẹ đánh dấu "Đã trả".
- **Gia đình:** thêm con, giao việc theo ngày, in bảng dán tủ lạnh, sao lưu và nhập dữ liệu.

App là web tĩnh, không cần bước build: HTML, CSS và JavaScript thuần. Chạy trên GitHub Pages.

## Cấu trúc

| File | Nội dung |
| --- | --- |
| `index.html` | Khung trang |
| `styles.css` | Giao diện (màu nằm trong `:root`, có chế độ tối) |
| `js/app.js` | Toàn bộ màn hình và thao tác |
| `js/store.js` | Lưu dữ liệu: trên máy (localStorage) hoặc Firebase |
| `js/config.js` | Cấu hình Firebase |
| `firestore.rules` | Quy tắc bảo vệ dữ liệu trên Firestore |

## Chạy thử trên máy

```bash
python3 -m http.server 8000
```

Rồi mở http://localhost:8000. Phải chạy qua server vì app dùng ES modules, mở thẳng file `index.html` sẽ không chạy.

## Bật đồng bộ bằng Firebase

Khi `js/config.js` để `null`, dữ liệu chỉ lưu trên trình duyệt của từng máy. Để bố, mẹ và các con dùng chung trên nhiều máy, làm một lần các bước sau (miễn phí, khoảng 5 phút):

1. Vào https://console.firebase.google.com, bấm **Create a project**, đặt tên (ví dụ `misa-misu`). Có thể tắt Google Analytics.
2. **Build → Firestore Database → Create database**. Chọn vùng `asia-southeast1` (Singapore), chế độ **production**.
3. Trong Firestore, mở tab **Rules**, dán toàn bộ nội dung file `firestore.rules`, bấm **Publish**. Mỗi khi app có thêm nhóm dữ liệu mới (ví dụ `timetables` cho Lịch học), dán lại file này một lần nữa, nếu không phần mới sẽ không lưu được.
4. **Build → Authentication → Get started → Sign-in method**, bật **Anonymous**.
5. **Authentication → Settings → Authorized domains**, thêm `vquangtran.github.io`.
6. **Project settings** (bánh răng) → **Your apps** → bấm biểu tượng web `</>`, đặt tên rồi bấm **Register app**. Firebase hiện ra đoạn `firebaseConfig`.
7. Dán đoạn đó vào `js/config.js`:

   ```js
   export const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     appId: "...",
   };
   ```

   Các giá trị này không phải mật khẩu, để công khai trong repo được. Dữ liệu được bảo vệ bằng Rules và mã gia đình.
8. Commit và push. Mở app, bấm **Tạo gia đình mới**. Vào **Gia đình → Chia sẻ và sao lưu**, sao chép **Link mời** và gửi cho người nhà.

### Về bảo mật

Mỗi gia đình có một mã ngẫu nhiên 23 ký tự, nằm trong link mời. Ai có link thì xem và sửa được bảng của nhà mình, nên chỉ gửi link cho người trong nhà. Tên, ngày sinh và dữ liệu của các con nằm trên Firestore, không nằm trong mã nguồn.

## Sao lưu

Vào **Gia đình → Tải bản sao lưu** để tải file `.json`. Dùng **Nhập từ file sao lưu** để đưa dữ liệu vào máy khác hoặc vào gia đình mới. Khi nhập, dữ liệu được gộp vào bảng hiện có (ghi đè các mục trùng mã), không xoá gì.

## Cài lên màn hình điện thoại

- **iPhone (Safari):** bấm nút Chia sẻ → **Thêm vào MH chính**.
- **Android (Chrome):** bấm menu ⋮ → **Thêm vào màn hình chính**.
