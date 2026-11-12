# 🧭 NGUYÊN TẮC KỸ THUẬT PHÁT TRIỂN & CỘNG TÁC AI (5-LAYER ENGINEERING PRINCIPLES)
> **Dự án:** UrbanTree – Hệ thống Quản trị Cây xanh Đô thị Thông minh GIS 4.0 & Blockchain  
> **Nguồn cảm hứng:** Mô hình 5 lớp của Lauren & Chuẩn mực Kỹ nghệ Phần mềm Chuyên nghiệp  
> **Áp dụng cho:** Tất cả lập trình viên, kỹ sư kiểm thử và các AI Coding Agent (Antigravity, Claude Code, Cursor, Codex).

---

## 🌟 TRIẾT LÝ CỐT LÕI (CORE PHILOSOPHY)

> **"CÓ AI MẠNH KHÔNG ĐỒNG NGHĨA VỚI VIỆC BẠN SẼ TẠO RA PHẦN MỀM TỐT."**

Ngày nay, chỉ cần vài câu lệnh, AI có thể sinh ra hàng trăm, hàng nghìn dòng code. Nhưng AI có thể viết code rất nhanh, trong khi chất lượng sản phẩm cuối cùng vẫn phụ thuộc vào **kiến trúc, yêu cầu, khả năng kiểm thử và cách con người kiểm soát hệ thống**.

- Một dự án có cấu trúc lộn xộn sẽ khiến AI khó xác định phần nào cần sửa.
- Một hệ thống không có quy tắc rõ ràng sẽ khiến AI tạo ra code không nhất quán.
- Một ứng dụng thiếu kiểm thử có thể chạy rất đẹp trong bản demo nhưng phát sinh hàng loạt lỗi khi đưa vào sử dụng thực tế.

**Bài học lớn nhất:**  
*Thời đại AI không khiến kiến thức nền tảng trở nên vô dụng — nó khiến kiến thức nền tảng càng đáng giá.*  
Người dùng không quan tâm bạn đã dùng 1 Agent hay 100 Agent. Họ chỉ quan tâm **sản phẩm có hoạt động tốt, an toàn và giải quyết được nhu cầu thực tế của họ hay không**.

---

## 🧱 LỚP THỨ NHẤT: CODEBASE — CODE CÓ TỔ CHỨC TRƯỚC, AI SUY LUẬN SAU

> *Muốn AI hiểu code, trước hết code phải có tổ chức.*

### Các nguyên tắc thực hiện:
1. **Kiến trúc rõ ràng, module hóa độc lập**: Mỗi module, component, utility chỉ đảm nhận một trách nhiệm duy nhất (Single Responsibility Principle). Tránh các file "god object" phình to chứa mọi logic.
2. **Không viết code phụ thuộc chằng chịt**: Thiết kế API nhất quán, tách bạch rõ ràng giữa tầng dữ liệu (Data/Storage), tầng nghiệp vụ tính toán (Utils/Services) và tầng giao diện (Components/Views).
3. **Đặt tên tường minh**: Tên hàm, biến, component phải nói rõ ý nghĩa nghiệp vụ (ví dụ: `calculateAllometricCarbon`, `isStormSeasonPruningNeeded`, không đặt `calc1`, `data2`).
4. **Không "chữa cháy" bằng code rác**: Khi sửa một lỗi, phải hiểu rõ nguyên nhân gốc rễ (Root Cause), không vá víu tạm bợ dẫn đến việc sửa 1 lỗi nhưng sinh ra 3 lỗi khác.

---

## 🔍 LỚP THỨ HAI: STATIC ANALYSIS — ĐỂ CÔNG CỤ TRUYỀN THỐNG LÀM VIỆC CỦA NÓ

> *Đừng bắt AI làm những việc mà công cụ tự động truyền thống đã làm rất tốt.*

### Các nguyên tắc thực hiện:
1. **Tận dụng Type Checker & Compiler**: Sử dụng TypeScript nghiêm ngặt (`strict: true`). Kiểm tra tính nhất quán của kiểu dữ liệu qua `npm run build` trước khi nhờ AI phân tích logic.
2. **Không lãng phí token cho lỗi cú pháp**: Các lỗi cú pháp, linter, định dạng code, import sai đường dẫn phải được phát hiện và giải quyết bằng Compiler và Linter tự động trước.
3. **Phân định rõ ràng**: Việc nào máy móc có thể kiểm tra bằng quy tắc rõ ràng, hãy để công cụ tự động xử lý. AI chỉ được sử dụng cho những nhiệm vụ thực sự cần khả năng **suy luận logic, kiến trúc và tối ưu hóa giải thuật**.

---

## 🛡️ LỚP THỨ BA: VERIFICATION — CODE CHẠY ĐƯỢC CHƯA CHẮC ĐÃ LÀ CODE ĐÚNG

> *Xác minh thực tế quan trọng hơn việc code vượt qua biên dịch.*

### Các nguyên tắc thực hiện:
1. **Kiểm chứng tính đúng đắn của nghiệp vụ**:
   - Giao diện đẹp, nút bấm ấn được và lưu thành công chưa đủ chứng minh phần mềm đúng.
   - Phải kiểm tra: Công thức sinh khối Allometric tính có chuẩn không? Bán kính rễ RPZ có đúng chuẩn BS 5837 không? Thời hạn SLA sự cố có xử lý đúng múi giờ không? Tọa độ GPS có nằm trong lãnh thổ Việt Nam không?
2. **Kiểm tra trường hợp biên (Edge Cases & Stress Testing)**:
   - Hệ thống xử lý thế nào khi có 5.000 – 10.000 cây? Có bị tràn bộ nhớ không?
   - Mạng yếu hoặc mất sóng 4G thực địa thì dữ liệu có bị mất không?
   - Nhập chuỗi đặc biệt, số âm, ảnh dung lượng lớn có làm sập trang không?
3. **Không phá vỡ chức năng cũ (No Regression)**: Mọi tính năng mới hoặc bản vá lỗi phải chứng minh được là không làm hỏng các quy trình cốt lõi đang hoạt động.

---

## 📄 LỚP THỨ TƯ: PROSE — HƯỚNG DẪN RÕ RÀNG HƠN CẢ CHỤC AI AGENT

> *Đôi khi một file hướng dẫn tốt còn hữu ích hơn cả chục AI Agent.*

### Các nguyên tắc thực hiện:
1. **Tài liệu hóa quy chuẩn dự án (`AGENTS.md`, `PRINCIPLES.md`)**:
   - Mô tả rõ dự án được tổ chức như thế nào.
   - Quy tắc viết code, thư mục nào không được tự ý sửa, quy chuẩn bảo mật và những điều cấm kỵ.
2. **Giao việc rõ ràng, không bắt AI đoán mò**:
   - Khi ra yêu cầu hoặc giao task cho AI Coding, phải xác định rõ: **Mục tiêu là gì, tiêu chuẩn hoàn thành (Definition of Done) ra sao, kiểm thử bằng cách nào**.
   - Tránh các câu lệnh mơ hồ khiến AI tự suy diễn và sinh ra code không đúng định hướng.
3. **Cập nhật tài liệu song song với code**: Tài liệu hướng dẫn phải luôn đồng bộ với mã nguồn thực tế; tài liệu lỗi thời sẽ dẫn đường cho AI làm sai.

---

## 👨‍💻 LỚP THỨ NĂM: HUMAN REVIEW — CON NGƯỜI LÀ CHỐT CHẶN CUỐI CÙNG

> *AI làm xong không có nghĩa là có thể đưa lên Production ngay.*

### Các nguyên tắc thực hiện:
1. **Con người chịu trách nhiệm cao nhất**: Trách nhiệm đối với chất lượng, tính an toàn, tính pháp lý và độ chính xác của sản phẩm thuộc về con người, không thể đùn đẩy cho AI.
2. **Kiểm duyệt các chức năng nhạy cảm**:
   - Các tác vụ phân quyền, xác thực danh tính, mật mã Blockchain, xóa hồ sơ cây xanh, phê duyệt đốn hạ phải có sự xem xét, xác nhận của con người trước khi triển khai.
3. **Mức độ kiểm duyệt phù hợp với rủi ro**:
   - Thay đổi nhỏ giao diện có thể xem nhanh.
   - Thay đổi về cấu trúc cơ sở dữ liệu, bảo mật và logic tài chính/pháp lý bắt buộc phải review từng dòng code.

---

## 🎯 BẢNG CHECKLIST NGUYÊN TẮC TRƯỚC KHI BÀN GIAO TASK

Mỗi khi hoàn thành một chức năng hoặc sửa một lỗi, cả Developer lẫn AI Agent đều phải tự đối chiếu checklist sau:

- [ ] **Lớp 1 (Codebase):** Code viết vào đúng file, đúng module, không duplicate code, tên biến và hàm rõ ràng.
- [ ] **Lớp 2 (Static Analysis):** Đã chạy `npm run build` đạt Exit Code 0, không có lỗi TypeScript hay cú pháp.
- [ ] **Lớp 3 (Verification):** Đã kiểm tra thực tế trên trình duyệt, thử nghiệm trường hợp biên, tính toán đúng logic nghiệp vụ.
- [ ] **Lớp 4 (Prose):** Đã cập nhật tài liệu hoặc ghi chú rõ ràng các thay đổi, tuân thủ đúng hướng dẫn trong `AGENTS.md`.
- [ ] **Lớp 5 (Human Review):** Đã tóm tắt rõ ràng các thay đổi quan trọng để con người kiểm tra và đưa ra quyết định cuối cùng.

