# BÁO CÁO THỰC TẾ & BẢO VỆ ĐỒ ÁN: CHUYỂN ĐỔI SỐ CÂY XANH ĐÔ THỊ (URBANTREE)
> **Tài liệu chuẩn bị cho Hội đồng Giám khảo & Triển khai Dự án Smart City Cần Thơ**  
> *Đúc kết từ nghiệp vụ thực tế ngành Công viên Cây xanh & Quản lý Hạ tầng Đô thị Thông minh.*

---

## 📌 PHẦN 1: BÀI TOÁN THỰC TẾ VÀ NỖI ĐAU CHUYỂN ĐỔI SỐ

Khi chính quyền số hóa hàng chục ngàn cây xanh trên địa bàn thành phố (ví dụ: quận Ninh Kiều, TP. Cần Thơ), câu hỏi đầu tiên luôn là: **"Làm sao đưa toàn bộ cây lên hệ thống ban đầu mà không bị sai sót, không bị nhầm lẫn và không tốn nhiều năm trời?"**

Trong thực tế, nếu chỉ áp dụng cực đoan 1 trong 2 cách truyền thống thì đều thất bại:

| Phương pháp | Ưu điểm | Nhược điểm thực tế chí mạng |
| :--- | :--- | :--- |
| **Cách 1: Nhập hàng loạt từ Excel có sẵn** *(Văn phòng)* | Cực nhanh (1 click import 5.000 cây). In QR dán một loạt rất nhàn. | **Dữ liệu giấy tờ vênh nặng nề với hiện trường:** File Excel thường tồn tại từ nhiều năm trước, có cây bị sâu đục/bão ngã đã bị đốn hạ mà chưa cập nhật, có cây dân tự bứng dời, hoặc giữa cây số 14 và 15 mọc thêm cây mới. Cầm xấp thẻ in sẵn đi đóng từ đầu phố đến cuối phố: **chỉ cần lệch 1 cây là lệch toàn bộ hàng chục cây phía sau!** |
| **Cách 2: Đi đo vẽ thủ công từng cây tại chỗ** *(Thực địa)* | Chính xác, mắt thấy tai nghe, cây nào tọa độ đó. | **Tốn kém và quá chậm:** Cần đoàn khảo sát cầm thước dây, máy GPS đo từng gốc, gõ tay từng tên cây, năm trồng... Để hoàn thành 10.000 cây sẽ mất hơn 1 năm và tiêu tốn hàng trăm triệu đồng ngân sách. |

---

## 💡 PHẦN 2: GIẢI PHÁP HYBRID 2 BƯỚC CỦA URBANTREE (KHẢ THI NHẤT TRONG THỰC TIỄN)

UrbanTree áp dụng mô hình chuẩn của các dự án Smart City hiện đại (như Singapore NParks, Đề án chuyển đổi số cây xanh TP.HCM): **Mô hình Hybrid 2 Bước (Pre-populated GIS + Quick Field Calibration)**.

```
       [BƯỚC 1: VĂN PHÒNG]                               [BƯỚC 2: HIỆN TRƯỜNG - 10 GIÂY/CÂY]
 Dữ liệu lưu trữ Excel / CAD cũ                    Kỹ thuật viên cầm điện thoại + Thẻ nhôm QR
               ⬇                                                     ⬇
   Tạo khung dữ liệu hàng loạt                        Đứng trước cây ➔ Mở App UrbanTree Staff
  Trạng thái: "Chờ hiệu chuẩn"                     GPS tự nhận diện: "Bạn đang ở gần cây HB-08"
(Đã có sẵn: Tuyến đường, Chủng loại)               Đối chiếu mắt thường ➔ Bấm [📍 Khớp tọa độ GPS]
                                                   Quét QR ➔ Chụp 1 ảnh lá cây ➔ Bấm [KÍCH HOẠT]
```

### Chi tiết các kịch bản xử lý bất thường tại hiện trường:
1. **Trường hợp lý tưởng:** Cây ngoài đời khớp với dữ liệu cũ ➔ Bấm Khớp GPS ➔ Gán QR ➔ **10 giây/cây** (1 ngày một tổ 2 người kích hoạt được 200 - 300 cây).
2. **Trường hợp cây đã chết / bị đốn hạ từ trước:** KTV bấm nút đỏ **[Đánh dấu: Đã giải tỏa/Thanh lý]** ➔ Hệ thống lưu vết lịch sử, tự đóng hồ sơ mã đó mà **không làm xô lệch** số thứ tự các cây còn lại.
3. **Trường hợp phát sinh cây mới trồng chen giữa:** Bấm nút **[+ Thêm cây bổ sung tại vị trí GPS hiện tại]** ➔ Hệ thống tự sinh mã phụ (Ví dụ: `HB-08B` nằm giữa `HB-08` và `HB-09`).

---

## 🛠️ PHẦN 3: TÌNH TRẠNG TRÊN HỆ THỐNG URBANTREE HIỆN TẠI & HƯỚNG BẢO VỆ ĐỒ ÁN

### 1. Hệ thống đã có những gì phục vụ giải pháp này?
- **Quản lý danh sách & Tuyến đường:** Có phân chia theo đường, trạng thái sức khỏe, nhóm loại cây.
- **Bản đồ số GIS tương tác:** Hiển thị tọa độ trực quan từng cây trên nền bản đồ số, có popup chi tiết, bộ lọc trạng thái.
- **Biển số nhôm ảo & Mã QR động:** Mỗi cây đều có một mã định danh duy nhất và QR Code tương ứng để quét tra cứu không cần đăng nhập.
- **Phân quyền Staff / Kỹ thuật viên:** KTV có thể ghi nhật ký chăm sóc, cập nhật tình trạng, chụp ảnh đính kèm hiện trường.
- **Sổ cái Blockchain A19:** Bảo chứng minh bạch lịch sử chăm sóc và nghiệm thu cây xanh.

### 2. Nếu Hội đồng hỏi: "Giao diện làm sao để KTV thực hiện nhanh ngoài đường?"
> **Trả lời mẫu cho Giám khảo:**  
> *"Dạ thưa Thầy/Cô, hệ thống được thiết kế theo tư duy Mobile-First cho công nhân môi trường. Trên app Staff, hệ thống tích hợp API Geolocation của trình duyệt/thiết bị để tự động tính khoảng cách Harversine, gợi ý ngay 3 cây gần vị trí công nhân nhất trong bán kính 10m. Công nhân chỉ cần 1 chạm để chọn đúng cây, camera mở lên quét QR gán thẻ và bấm hoàn tất mà không cần nhập liệu thủ công."*

---

## 🗺️ PHẦN 4: NẾU MUỐN THAY ĐỔI NHÀ CUNG CẤP BẢN ĐỒ THÌ SAO?

Kiến trúc bản đồ trong UrbanTree được xây dựng theo tiêu chuẩn mở **OGC (Open Geospatial Consortium)** và thư viện **Leaflet**:

```
[ Giao diện Bản đồ UrbanTree ]
              │
    ┌─────────┴─────────┐
    ▼                   ▼
[Tile Layer Nhà Mạng] [Dữ liệu Cây GeoJSON]
```

Do dữ liệu tọa độ của cây được lưu theo chuẩn quốc tế **WGS-84 (`latitude, longitude`)**, việc đổi nhà cung cấp bản đồ là **cực kỳ linh hoạt, chỉ cần đổi 1 dòng Tile URL**:

1. **OpenStreetMap (Mặc định hiện tại):**
   - *Ưu điểm:* 100% miễn phí, mã nguồn mở, không phụ thuộc chi phí API Key của Google, cộng đồng đóng góp liên tục.
2. **Google Maps (Google Satellite / Vệ tinh & Đường phố):**
   - Chỉ cần gắn API Key của Google Maps Platform hoặc chèn Tile URL Google Vệ tinh để xem rõ mái nhà, tán cây từ không ảnh.
3. **Mapbox GL:**
   - Đem lại giao diện 3D Cyberpunk, Vector tiles siêu mượt, chế độ ban đêm Dark Mode thời thượng.
4. **Bản đồ Địa chính Quốc gia (VN2000 / Sở TN&MT TP. Cần Thơ):**
   - Khi triển khai thực tế cấp chính quyền, hệ thống chỉ cần kết nối với máy chủ bản đồ chuyên dụng **GeoServer** của thành phố qua giao thức WMS/WFS tile layer.

---

## 🌐 PHẦN 5: TƯ DUY SMART CITY: "LỘ TRÌNH THỰC TẾ" THAY VÌ "ẢO TƯỞNG HOÀN HẢO"

Một lập luận cực kỳ giá trị để ghi điểm tuyệt đối trước Hội đồng:

> *"Để một thành phố trở nên thông minh (Smart City), thời gian không thể tính bằng ngày một ngày hai. Tương tự như Đề án 06 về Cơ sở dữ liệu Quốc gia và VNeID của Bộ Công an phải mất nhiều năm cùng sự tham gia của hàng triệu cảnh sát khu vực đi gõ cửa từng nhà để làm sạch dữ liệu 'Đúng - Đủ - Sạch - Sống'.*  
>  
> *Vì vậy, **không có giải pháp nào là hoàn hảo tuyệt đối ngay từ đầu, mà là giải pháp KHẢ THI NHẤT, TINH GỌN NHẤT trong khả năng thực thi của con người và công nghệ**."*

### Lộ trình 3 giai đoạn triển khai khuyến nghị:
- **Giai đoạn 1 (Thí điểm Tuyến phố kiểu mẫu):** Chọn 1-2 tuyến đường trung tâm (Đại lộ Hòa Bình, Đường 30 Tháng 4) với ~200 cây để chuẩn hóa quy trình gắn thẻ và nghiệm thu.
- **Giai đoạn 2 (Nhân rộng toàn quận Ninh Kiều):** Dùng dữ liệu Excel sẵn có để tạo khung và cho các tổ công nhân môi trường hiệu chuẩn khi đi tuần tra định kỳ.
- **Giai đoạn 3 (Xã hội hóa / Crowdsourcing):** Cung cấp Cổng phản ánh cho Người dân (Citizen Portal). Người dân khi thấy cây trước cửa nhà bị nghiêng, sâu bệnh có thể quét QR phản ánh, qua đó gián tiếp giúp chính quyền cập nhật dữ liệu liên tục theo thời gian thực mà không tốn ngân sách thuê người khảo sát lại.

---
*Tài liệu lưu hành nội bộ đồ án tốt nghiệp UrbanTree - Cần Thơ Smart Eco-GIS 4.0.*
