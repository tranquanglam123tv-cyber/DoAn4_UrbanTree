---
description: "Review thay đổi như code reviewer và chạy các bước xác minh an toàn."
---
# Review and Verify

1. Đọc yêu cầu và acceptance criteria.
2. Kiểm tra `git diff` và `git status`; không sửa các thay đổi không thuộc task.
3. Review correctness, security, performance, accessibility, error handling và compatibility.
4. Kiểm tra migration/API/UI/documentation đồng bộ.
5. Chạy test/lint/build phù hợp theo lệnh đã xác minh.
6. Ghi rõ kiểm tra nào pass/fail/not run.
7. Nếu phát hiện lỗi, đề xuất hoặc sửa lỗi nhỏ trong phạm vi; thay đổi lớn phải xin phép.
8. Xuất báo cáo review theo mức độ: blocker, high, medium, low; không phóng đại vấn đề.
