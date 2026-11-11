# 🎬 KỊCH BẢN TRÌNH DIỄN BẢO VỆ ĐỒ ÁN 4 (DEMO SCRIPT)
## HỆ THỐNG QUẢN LÝ CÂY XANH ĐÔ THỊ TÍCH HỢP QR CODE & BLOCKCHAIN (URBANTREE)
> **Sinh viên thực hiện:** Trần Quang Lâm (MSSV: 2311074)  
> **Thời lượng trình diễn lý tưởng:** 5 - 7 phút trước Hội đồng

---

## 📌 PHẦN 1: MỞ ĐẦU & NÊU BÀI TOÁN (1 phút)
* **Lời thoại gợi ý:**  
  *"Kính thưa quý Thầy/Cô trong Hội đồng, hiện nay việc quản lý cây xanh đô thị gặp 2 bất cập lớn:  
  1. Người dân khi phát hiện cành gãy, cây nghiêng sau bão rất khó báo đúng vị trí cây và đơn vị quản lý khó điều phối kịp thời.  
  2. Các biên bản chăm sóc, cắt tỉa và xử lý sự cố trong cơ sở dữ liệu truyền thống rất dễ bị chỉnh sửa hồi tố, khai khống khối lượng bảo dưỡng mà không thể kiểm toán độc lập.  
  Để giải quyết vấn đề này, nhóm chúng em phát triển hệ thống **UrbanTree** tích hợp mã định danh QR Code và công nghệ Smart Contract trên mạng EVM để bảo chứng toàn vẹn dữ liệu."*

---

## 📱 PHẦN 2: LUỒNG NGƯỜI DÂN QUÉT QR & GỬI PHẢN ÁNH (1.5 phút)
* **Thao tác thực tế:** Mở trình duyệt tại `http://localhost:5001/citizen`
* **Lời thoại & Hành động:**
  1. *"Đây là giao diện Web Responsive tối ưu cho điện thoại khi người dân dùng camera quét mã QR gắn trên thân cây."*
  2. Bấm xem các cây `TREE-001`, `TREE-002`: *"Người dân tra cứu được ngay lý lịch sinh thái, lượng CO2 hấp thụ và mã băm bảo chứng Blockchain của cây."*
  3. Điền form gửi phản ánh: Nhập tên, số điện thoại, chọn mức độ `Khẩn cấp` và bấm **"Gửi Báo Cáo Ngay"**.
  4. *"Hệ thống tiếp nhận tức thì và cấp phát mã vé cứu hộ `#INC-...` cho người dân theo dõi tiến độ."*

---

## 🚨 PHẦN 3: LUỒNG ĐIỀU PHỐI VÀ NGHIỆM THU HIỆN TRƯỜNG (2 phút)
* **Thao tác thực tế:** Chuyển sang tab `http://localhost:5001/admin`
* **Lời thoại & Hành động:**
  1. *"Tại Trung tâm điều phối của Ban quản lý, sự cố người dân vừa gửi lập tức xuất hiện ở trạng thái màu cam **'Chờ xử lý'**."*
  2. Bấm **"Điều phối xe"**: *"Cán bộ điều phối đội cơ động tiếp cận hiện trường trong mục tiêu 60 phút, trạng thái chuyển sang **'Đang xử lý'**."*
  3. Bấm **"Nghiệm thu On-chain"**:  
     *"Sau khi cắt tỉa xong, cán bộ nghiệm thu bấm 'Nghiệm thu On-chain'. Tại thời điểm này, Backend sẽ tính toán mã băm SHA-256 từ biên bản và dùng khóa riêng (Private Key) của hệ thống gửi giao dịch lên Smart Contract `UrbanTreeRegistry`."*
  4. Mở popup hiển thị **Transaction Hash** vừa sinh ra trên mạng Blockchain.

---

## 🔒 PHẦN 4: ĐIỂM NHẤN ĂN ĐIỂM — CỔNG KIỂM TOÁN MERKLE & ZERO MISMATCH (2 phút)
* **Thao tác thực tế:** Chuyển sang tab `http://localhost:5001/verifier`
* **Lời thoại & Trình diễn 2 ca đối soát:**
  1. **Màn A18 (Activity Explorer):**  
     *"Toàn bộ lịch sử từ hồ sơ cây xanh đến biên bản nghiệm thu sự cố đều được ghi nhận bất biến trên sổ cái Blockchain. Thầy cô có thể thấy các bản ghi `TREE-001`, `CARE-001` và `INC-...` kèm địa chỉ ví ký số và dấu thời gian khối."*
  2. **Ca 1 (Dữ liệu chuẩn - Tích xanh):**  
     Bấm nút **"Kiểm toán"** tại dòng `TREE-001` $\rightarrow$ Hiện khung **Xanh lá: BẢN GHI NGUYÊN VẸN 100% (VERIFIED VALID)**.  
     *"Hệ thống so khớp mã băm off-chain từ SQLite với mã băm on-chain trên Smart Contract, xác nhận hồ sơ không bị can thiệp."*
  3. **Ca 2 (Phát hiện gian lận - Cảnh báo đỏ):**  
     Cố tình sửa 1 chữ số trong ô *Mã băm hiện thời* $\rightarrow$ Bấm **"Thực Hiện Xác Minh"** $\rightarrow$ Hiện khung **Đỏ: CẢNH BÁO: DỮ LIỆU ĐÃ BỊ SỬA ĐỔI (HASH MISMATCH)**.  
     *"Nếu có bất kỳ ai, kể cả quản trị viên Database, cố tình sửa lén dữ liệu trong cơ sở dữ liệu thì mã băm sẽ lập tức bị sai lệch, hệ thống phát hiện ngay hành vi gian lận dữ liệu."*

---

## 🎯 PHẦN 5: KẾT LUẬN & TRẢ LỜI CÂU HỎI HỘI ĐỒNG (30 giây)
* *"Hệ thống đã chứng minh được tính khả thi của mô hình lưu trữ lai (Hybrid Storage): vừa đảm bảo hiệu năng xử lý nhanh cho nghiệp vụ công ích, vừa đảm bảo tính minh bạch, bất biến tuyệt đối nhờ Smart Contract."*
