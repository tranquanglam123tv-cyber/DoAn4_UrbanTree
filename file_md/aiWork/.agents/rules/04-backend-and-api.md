---
trigger: model_decision
description: "Dùng khi triển khai backend, business logic, API, validation, authentication hoặc integration."
---
# Backend and API Standards

- Đọc route/controller/handler, service, model/entity, middleware và error handling hiện có trước khi sửa.
- Đặt business logic đúng tầng theo kiến trúc dự án; controller/route handler không chứa toàn bộ nghiệp vụ.
- Validate input ở ranh giới hệ thống; không tin dữ liệu từ client.
- API phải có response/error format nhất quán với dự án; dùng đúng HTTP method/status semantics.
- Kiểm tra authentication và authorization ở server cho mọi tài nguyên được bảo vệ.
- Không trả stack trace, secret, query nội bộ hoặc dữ liệu nhạy cảm cho client.
- Tránh N+1, truy vấn không giới hạn, thiếu pagination hoặc transaction ở luồng cần tính nhất quán.
- Tích hợp bên ngoài phải có timeout, xử lý lỗi, retry có giới hạn và idempotency khi phù hợp.
- Không đổi endpoint, payload, status code hoặc semantics đang được client sử dụng mà không xin duyệt.
- Cập nhật API docs/spec và test tương ứng khi API thay đổi.
