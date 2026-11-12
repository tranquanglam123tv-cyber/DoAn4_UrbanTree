---
trigger: model_decision
description: "Dùng khi phân tích yêu cầu, lập kế hoạch, chia task, đọc roadmap hoặc kiểm soát phạm vi."
---
# Planning and Scope

- Chuyển yêu cầu thành mục tiêu, phạm vi trong/ngoài phạm vi, giả định, tiêu chí nghiệm thu.
- Đọc roadmap/spec hiện có trước khi đề xuất kế hoạch mới; không tạo roadmap mâu thuẫn.
- Với task nhiều file hoặc nhiều lớp, lập kế hoạch theo các bước nhỏ, xác định thứ tự phụ thuộc và điểm kiểm thử.
- Nêu file/module dự kiến thay đổi và dữ liệu/API/UI bị ảnh hưởng.
- Không tự thêm tính năng “tiện thể”, AI feature, analytics, notification, role hoặc tích hợp ngoài yêu cầu.
- Nếu yêu cầu có nhiều cách hiểu nhưng tác động thấp, chọn phương án đơn giản và nêu giả định. Nếu ảnh hưởng nghiệp vụ, dữ liệu, bảo mật hoặc kiến trúc, hỏi trước.
- Không đánh dấu roadmap item hoàn thành chỉ vì đã tạo UI hoặc mock data; phải có luồng hoạt động và kiểm chứng phù hợp.
