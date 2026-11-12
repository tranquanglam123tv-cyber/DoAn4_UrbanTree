---
trigger: model_decision
description: "Dùng khi kiểm tra Git, tạo commit/branch, xử lý diff hoặc quản lý thay đổi."
---
# Git and Change Management

- Trước khi sửa, kiểm tra `git status` và giữ nguyên thay đổi chưa commit của người dùng.
- Không reset, checkout đè, clean, stash, amend, rebase hoặc rewrite history khi chưa được yêu cầu.
- Không commit, push, merge, tạo release hoặc force-push nếu chưa được cho phép rõ ràng.
- Không đưa file `.env`, secret, build output, cache hoặc file cá nhân vào commit.
- Giữ diff tập trung; không format toàn bộ repository khi task chỉ sửa một module.
- Nếu phát hiện thay đổi không liên quan trong working tree, không tự sửa/xoá; báo người dùng.
- Có thể đề xuất tên branch và commit message; chỉ thực hiện thao tác remote khi được duyệt.
- Trước khi kết thúc, tóm tắt file thay đổi và các thay đổi chưa được commit.
