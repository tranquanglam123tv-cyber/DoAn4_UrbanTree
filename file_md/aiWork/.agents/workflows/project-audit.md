---
description: "Kiểm tra repository, tài liệu, kiến trúc và mức độ sẵn sàng trước khi bắt đầu code."
---
# Project Audit

Thực hiện kiểm tra chỉ đọc, không sửa code.

1. Đọc `AGENTS.md` và các rule áp dụng.
2. Kiểm tra cấu trúc repository, Git status, package manifests và cấu hình.
3. Đọc `docs/PROJECT_PROFILE.md` nếu có; tìm roadmap, SRS, API spec, ERD và UI spec.
4. Xác định stack thực tế, kiến trúc, module, lệnh chạy/test/build và điểm chưa rõ.
5. Phân loại rủi ro: dữ liệu, bảo mật, API compatibility, dependency, deployment.
6. Không đọc nội dung secret trong `.env` hoặc credential files.
7. Xuất báo cáo: hiện trạng, tài liệu thiếu/mâu thuẫn, rủi ro, lệnh xác minh và đề xuất bước tiếp theo.
8. Không tự tạo hoặc sửa file nếu người dùng chỉ yêu cầu audit.
