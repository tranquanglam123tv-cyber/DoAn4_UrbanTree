---
trigger: model_decision
description: "Dùng khi thiết kế kiến trúc, module, phân lớp, tích hợp hoặc thay đổi cấu trúc hệ thống."
---
# Architecture and Design

- Xác minh kiến trúc đang tồn tại qua code và cấu hình trước khi mô tả.
- Tuân thủ kiến trúc đã được duyệt; ưu tiên pattern và convention đang dùng.
- Giữ ranh giới module rõ ràng; tránh circular dependency và coupling không cần thiết.
- Không tạo layer/interface/factory/repository chỉ vì hình thức; chỉ thêm khi có lợi ích cụ thể.
- Tách trách nhiệm UI, application/business logic, persistence và integration theo stack thực tế.
- Không đổi framework, runtime, kiến trúc monolith/microservice, giao thức hoặc chiến lược state management nếu chưa được duyệt.
- Với thay đổi liên module, nêu impact map và thứ tự triển khai.
- Thiết kế phải có đường kiểm thử, xử lý lỗi, logging phù hợp và khả năng rollback.
