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

## 🌍 PHẦN 6: BẢN ĐỒ ĐA TỈNH THÀNH (MULTI-TENANT GIS) & PHÂN QUYỀN ĐỊA BÀN HÀNH CHÍNH

### 1. Câu hỏi thực tế: "Nếu muốn quản lý thêm cây ở TP.HCM thì Admin có cần tạo thêm bản đồ mới không?"

> **Hội đồng hỏi:** *"Hệ thống hiện tại đang làm cho Cần Thơ. Nếu sau này bán bản quyền hoặc triển khai cho Sở Xây Dựng TP.HCM hay Hà Nội, các em có phải đập đi xây lại hoặc tạo ra một bản đồ riêng cho TP.HCM không?"*

👉 **Câu trả lời xuất sắc:**
> *"Dạ thưa Thầy/Cô, hoàn toàn KHÔNG CẦN thêm hay vẽ lại bất kỳ bản đồ nào cả!*  
> *Bởi vì trong kiến trúc GIS chuẩn quốc tế (Leaflet, OpenStreetMap, Mapbox, Google Maps), **toàn bộ Trái Đất chỉ là MỘT BẢN ĐỒ DUY NHẤT** theo hệ quy chiếu tọa độ toàn cầu WGS-84 (`latitude, longitude`). Cả Cần Thơ, TP.HCM, Đà Nẵng, Hà Nội đều đã có sẵn trên cùng một mặt phẳng bản đồ số.*  
>  
> *Bản đồ giống như **mặt bàn kính khổng lồ**, còn dữ liệu cây xanh của từng thành phố giống như **các lớp dữ liệu (Data Layers)** đặt lên trên. Khi ta cắm một cây ở Bến Ninh Kiều (Cần Thơ) và một cây ở Chợ Bến Thành (TP.HCM), cả 2 cây đều đã cùng tồn tại trên một bản đồ chung. Tương tự như ứng dụng Grab hay Google Maps, người dùng ở Cần Thơ thì ứng dụng trượt về Cần Thơ, khi di chuyển lên TP.HCM thì ứng dụng tự động hiển thị tài xế tại TP.HCM mà không cần tạo 2 app bản đồ khác nhau."*

---

### 2. Nghiệp vụ thực tế: "Cán bộ phụ trách khu vực nào thì chỉ quản lý khu vực đó" được tổ chức thế nào?

Trong nghiệp vụ hạ tầng đô thị thông minh cấp quốc gia (Multi-Tenancy Architecture), hệ thống phân cấp chặt chẽ theo **Mã định danh Địa bàn Hành chính (Administrative Hierarchy Code)**:

```
                              HỆ THỐNG QUẢN TRỊ URBANTREE
                                           │
             ┌─────────────────────────────┴─────────────────────────────┐
   [ĐỊA BÀN: TP. CẦN THƠ]                                     [ĐỊA BÀN: TP. HỒ CHÍ MINH]
   (Mã vùng: 92)                                              (Mã vùng: 79)
             │                                                           │
   ┌─────────┴─────────┐                                       ┌─────────┴─────────┐
[Quận Ninh Kiều]   [Quận Cái Răng]                          [Quận 1]            [Quận 3]
  (KTV Lâm)          (KTV Tuấn)                               (KTV An)            (KTV Bình)
```

- **Cấp Cán bộ Kỹ thuật (Field Staff / Ward Operator):**  
  Tài khoản được gán quyền theo địa bàn phụ trách (Scope: District/Ward). Khi KTV Lâm đăng nhập, bản đồ tự động bay (`flyTo`) về Quận Ninh Kiều và chỉ tải danh sách cây thuộc địa bàn mình phụ trách để chống quá tải dữ liệu và bảo mật thông tin.
- **Cấp Lãnh đạo Sở Xây Dựng Địa phương (City Admin):**  
  Có quyền bao quát toàn bộ các quận huyện trong tỉnh/thành phố đó.
- **Cấp Tổng Quản Trị / Bộ Xây Dựng (Super Admin):**  
  Nắm toàn quyền đa địa bàn, có thể chuyển đổi linh hoạt: `[📍 Chọn Tỉnh/Thành phố: Cần Thơ / TP.HCM / Đà Nẵng]` hoặc phóng to/thu nhỏ toàn quốc.

---

### 3. Hai khu vực ở 2 tỉnh cách xa nhau thì bản đồ hiển thị và tối ưu hiệu năng ra sao?

1. **Cơ chế Tự động tính toán tầm nhìn (Auto-fit Bounds):**  
   Thay vì fix cứng tọa độ trung tâm, hệ thống sử dụng thuật toán bao hình chữ nhật `L.latLngBounds(markers)`. Khi người dùng mở bản đồ, hệ thống tự động phóng to vừa vặn toàn bộ các cây đang có trong tầm nhìn.
2. **Cơ chế Phân cụm điểm dữ liệu (Marker Clustering):**  
   Khi zoom xa thấy toàn cảnh miền Nam: Cây ở Cần Thơ tự động gom thành 1 vòng tròn tròn số `[2.500 cây]`, cây ở TP.HCM gom thành 1 vòng tròn `[10.000 cây]`. Khi người dùng click vào cụm nào thì bản đồ tự động phóng nhanh vào thành phố đó.
3. **Truy vấn theo Không gian địa lý (Spatial Bounding Box Query):**  
   Server không bao giờ gửi 100.000 cây về trình duyệt cùng một lúc gây đơ lag. Bản đồ người dùng đang nhìn vào khung tọa độ nào (`north-east, south-west`) thì API chỉ nạp các cây nằm trong khung nhìn đó (Viewport Caching).

---

## 📌 BỘ CÂU HỎI THỰC TẾ & CÂU TRẢ LỜI SẮC BÉN KHI BẢO VỆ ĐỒ ÁN (FAQ)

### Câu 1: Tại sao không dùng GPS dân sự đơn thuần để tự động gán mã cây luôn mà phải in thẻ dán mã QR?
- **Trả lời:** Vì GPS trên điện thoại di động thông thường có sai số từ **3m đến 8m**, đặc biệt khi đứng dưới tán lá rậm rạp và nhà cao tầng (hiện tượng tán xạ sóng đa đường - Multipath Effect). Dưới tán cây, sai số 5m đủ để làm hệ thống nhận diện nhầm cây số 8 thành cây số 7 hoặc cây số 9. Do đó, GPS chỉ đóng vai trò **bộ lọc gợi ý vùng (Neighborhood Hint)**, còn chiếc thẻ nhôm khắc QR cố định trên thân cây mới là **vật chứng pháp lý 100% chuẩn xác** để định danh cá thể.

### Câu 2: Lỡ dân chụp ảnh mã QR rồi về nhà quét báo cáo giả/phá hoại thì sao?
- **Trả lời:** Hệ thống đối chiếu tọa độ kép (Cross-GPS Verification). Khi người dân quét mã QR gửi báo cáo sự cố, trình duyệt yêu cầu lấy GPS thực tế tại thời điểm quét. Nếu khoảng cách giữa GPS người gửi và GPS gốc cây đã neo trên Blockchain vượt quá 100m, hệ thống sẽ cảnh báo "Bạn đang không ở gần cây này" và gắn cờ rủi ro (Risk Flag) để quản trị viên sàng lọc trước.

### Câu 3: Làm sao đảm bảo dữ liệu cây không bị công ty cây xanh làm đẹp số liệu hoặc khai khống để rút ngân sách bảo dưỡng?
- **Trả lời:** Dữ liệu hồ sơ cây và nhật ký chăm sóc đều được băm mã theo chuẩn SHA-256 và neo khối mã hóa lên Smart Contract Blockchain A19. Bất kỳ hành vi sửa đổi lén trong cơ sở dữ liệu SQL/MongoDB (ví dụ sửa ngày trồng, sửa tình trạng sức khỏe từ CHẾT thành TỐT) đều sẽ bị hệ thống phát hiện ngay lập tức do lệch Hash gốc (Data Tampering Detected).

### Câu 4: Khi nhập dữ liệu cây xanh bằng File (Excel / CSV), hệ thống tự định vị mốc tọa độ trên bản đồ thế nào và Icon Marker có được tạo tự động không?
- **Trả lời phản biện hoàn hảo:**
  1. **Tự động định vị GPS (Automated Spatial Georeferencing):** Thay vì ghim tay trên bản đồ (vốn dễ lệch tim đường do cảm tính), file khảo sát thực địa của đơn vị đo đạc luôn có 2 cột chuẩn: `latitude` (vĩ độ, ví dụ: `10.03512`) và `longitude` (kinh độ, ví dụ: `105.78221`). Hệ thống tự động phân tích (parse) 2 cột này và cắm trực tiếp Marker lên lưới tọa độ WGS-84 của Leaflet GIS với độ chính xác đến từng centimet.
  2. **Sinh Icon Marker động theo thời gian thực (Procedural Icon Rendering):** Hệ thống KHÔNG dùng ảnh tĩnh chụp sẵn mà dùng hàm kết xuất động `L.divIcon` kết hợp mã màu trạng thái sức khỏe:
     - Xanh lục Emerald (`#10b981`) = Khỏe mạnh (GOOD)
     - Xanh dương xám Slate (`#3b82f6` / `#64748b`) = Bình thường (FAIR)
     - Vàng cam Amber (`#f59e0b`) = Kém / Sâu bệnh (POOR)
     - Đỏ thẫm Red (`#ef4444`) = Nguy cấp / Nghiêng đổ (CRITICAL)
     - Đồng thời, nhãn số thứ tự trên tuyến (như `01`, `02`, `14`) được in nổi trực tiếp giữa lòng Icon Marker, giúp người quản lý nhìn tổng quan từ xa là nhận diện được ngay hiện trạng từng cây mà không cần click vào từng điểm!

### Câu 5: Phân cấp nghiệp vụ xử lý sự cố giữa Admin (Điều phối viên) và Staff (Kỹ thuật viên hiện trường) được tổ chức ra sao?
- **Trả lời nghiệp vụ chuẩn:**
  1. **Vai trò Admin (Phòng điều hành / Trung tâm IOC):** Admin ngồi tại văn phòng chỉ làm nhiệm vụ **Điều phối (Dispatching)**: tiếp nhận phản ánh của người dân ➔ sàng lọc tin rác / tin sai ➔ chuyển giao vé công tác và chỉ định Kỹ thuật viên phụ trách địa bàn (`ASSIGNED`). Admin **tuyệt đối không cầm cưa ra đường** nên không thực hiện chụp ảnh hay bấm hoàn tất hiện trường.
  2. **Vai trò Staff (Tổ kỹ thuật thực địa):** Đội ngũ KTV đi xe thang đến hiện trường kiểm tra, cưa tỉa cành gãy, thu dọn rác xanh. Sau khi hoàn thành, KTV sử dụng điện thoại chụp ảnh đối chứng hiện trường sau xử lý và bấm **Nghiệm thu & Ký số On-Chain (RESOLVED)** trực tiếp trên giao diện dành riêng cho Staff (`StaffWorkstationView`).

### Câu 6: Hệ thống phân loại cây đô thị theo tiêu chuẩn pháp lý nào và có cảnh báo cây bảo tồn di sản không?
- **Trả lời chuẩn luật xây dựng:**
  - Hệ thống tuân thủ nghiêm ngặt **Thông tư 20/2020/TT-BXD** và **Nghị định 64/2010/NĐ-CP** của Chính phủ:
    - **Cây Loại 1 (Mới trồng / Cây con):** Đường kính $D < 20cm$, chiều cao $H < 6m$.
    - **Cây Loại 2 (Trưởng thành):** Đường kính $D: 20-50cm$, chiều cao $H: 6-12m$ (cắt tỉa định kỳ trước mùa mưa bão).
    - **Cây Loại 3 (Cổ thụ / Di sản bảo tồn):** Đường kính $D \ge 50cm$ hoặc chiều cao $H \ge 12m$.
  - Trên Thẻ nhôm định danh và Form nhập liệu, hệ thống tự động dán nhãn viền tím nhấp nháy cảnh báo: **🛑 CÂY DI SẢN BẢO TỒN ĐÔ THỊ · NGHIÊM CẤM TỰ Ý ĐỐN HẠ KHI CHƯA CÓ GIẤY PHÉP PHÊ DUYỆT TỪ UBND HOẶC SỞ XÂY DỰNG!**

### Câu 7: Con số hấp thụ CO2 và Sinh khối trên Dashboard được tính theo căn cứ khoa học nào?
- **Trả lời chuyên gia môi trường:**
  - Hệ thống KHÔNG dùng số ngẫu nhiên mà tích hợp **Phương trình Allometric lâm sinh chuẩn quốc tế của USDA Forest Service (i-Tree Eco Model)**:
    $$\text{Biomass (kg)} = 0.0673 \times (\rho \times \text{DBH}^2 \times H)^{0.976}$$
    *(Trong đó: $\text{DBH}$ là đường kính ngang ngực cm, $H$ là chiều cao m, $\rho$ là tỷ trọng gỗ khô).*
  - Từ sinh khối tích lũy hàng năm, hệ thống nhân với tỷ lệ Carbon ($50\%$) và tỷ số phân tử $\frac{44}{12}$ để kết xuất chính xác lượng $CO_2$ cô lập (tấn/năm) và lượng Oxy hoàn lưu cho không gian sống đô thị.

### Câu 8: Vùng bảo vệ rễ cây (Root Protection Zone - RPZ) trên bản đồ GIS giải quyết bài toán gì khi thi công hạ tầng đô thị?
- **Trả lời chuyên gia hạ tầng:**
  - $70\%$ các sự cố cây xanh ngã đổ bất ngờ vào mùa mưa bão là do các đơn vị điện lực, viễn thông hoặc thoát nước đào rãnh vỉa hè quá sát gốc làm đứt cụm rễ cọc chịu lực.
  - Hệ thống tích hợp **Quy chuẩn Quốc tế BS 5837 (Trees in relation to design, demolition and construction)**:
    $$RPZ = \max\left(3.0m, \frac{\text{CanopyDiameter}}{2}, \text{DBH (cm)} \times 0.12\right)$$
  - Trên bản đồ Leaflet, khi bật công tắc `[🛡️ Vùng rễ (RPZ)]`, hệ thống vẽ vòng tròn mờ bán kính 3 - 6m xung quanh từng gốc cây, giúp các đơn vị thi công đào vỉa hè tra cứu tọa độ cấm đào bới máy xúc cơ giới, ngăn chặn tận gốc rủi ro ngã đổ.

### Câu 9: Cơ chế giám sát SLA phản ứng nhanh sự cố đô thị hoạt động như thế nào?
- **Trả lời về mặt quản trị điều hành:**
  - Hệ thống thiết lập đồng hồ đếm ngược SLA tự động theo mức độ nghiêm trọng:
    - **CRITICAL (Khẩn cấp):** SLA **30 phút** (cây đổ đè đường huyết mạch, dây điện đứt).
    - **HIGH (Cao):** SLA **120 phút** (nhánh lớn rạn nứt có nguy cơ rơi).
    - **MEDIUM / LOW:** SLA **24 - 48 giờ**.
  - Nếu quá hạn cam kết, hệ thống tự động đổi màu vé sang đỏ nhấp nháy: `🚨 VI PHẠM SLA: Quá hạn N phút!`, đồng thời cập nhật tỷ lệ tuân thủ cam kết phục vụ trên Báo cáo Sở Xây dựng.

### Câu 10: Chiến dịch rà soát cắt tỉa đón mùa mưa bão (Pre-Storm Pruning) hoạt động ra sao?
- **Trả lời về mặt vận hành mùa mưa Nam Bộ:**
  - Vào giai đoạn tháng 5 - tháng 11 hàng năm, hệ thống tự động lọc toàn bộ các cây Loại 2 và Loại 3 có chiều cao $H \ge 7m$ hoặc đường kính $D \ge 25cm$ mà **chưa được cắt tỉa trong vòng 180 ngày qua**.
  - Dashboard phát cảnh báo màu hổ phách: `⛈️ Chiến Dịch Rà Soát Cắt Tỉa Hạ Độ Cao Đón Mùa Mưa Bão: Phát hiện N cây cần xử lý` để lãnh đạo Công ty Cây xanh lập tức phân bổ xe thang xử lý trước khi giông lốc đổ bộ.

### Câu 11: Làm sao hệ thống xuất được Báo cáo chính quy cho UBND Thành phố và Sở Xây dựng?
- **Trả lời về tính ứng dụng hành chính:**
  - Ngay trên Admin Dashboard có nút `[📄 Xuất Báo Cáo Sở Xây Dựng]`.
  - Hệ thống tự động tổng hợp thành văn bản hành chính khổ A4 chuẩn thể thức Nhà nước (có Quốc hiệu, Tiêu ngữ, Số hiệu công văn, Bảng số liệu phân cấp Thông tư 20, Chỉ số Carbon Allometric, Tỷ lệ SLA và Khung chữ ký duyệt 3 cấp) cho phép in trực tiếp hoặc xuất file PDF nộp báo cáo chỉ với 1 click.

---
*Tài liệu lưu hành nội bộ đồ án tốt nghiệp UrbanTree - Cần Thơ Smart Eco-GIS 4.0.*


