---
description: "Triển khai feature đã được thống nhất theo từng bước nhỏ và có kiểm chứng."
---
# Implement Feature

1. Xác nhận feature/plan đã được người dùng yêu cầu hoặc duyệt.
2. Đọc rule, profile, spec và kiểm tra Git status.
3. Nếu phát hiện cần thay đổi lớn ngoài plan, dừng và xin phép.
4. Triển khai từng lát nhỏ, giữ diff tập trung.
5. Viết/cập nhật test cùng với logic.
6. Chạy kiểm tra phù hợp sau mỗi phần quan trọng.
7. Cập nhật tài liệu liên quan.
8. Review diff và kiểm tra không có secret/file ngoài phạm vi.
9. Báo kết quả, test thực tế, phần chưa làm và rủi ro.
10. Không commit/push/deploy nếu chưa được yêu cầu rõ ràng.
