---
trigger: model_decision
description: "Dùng khi làm việc với database, schema, ORM, query, migration, seed hoặc dữ liệu."
---
# Database and Migration Standards

- Xác minh DB engine, version, ORM, naming convention và migration tool từ repository/profile.
- Đọc schema/model và migration gần nhất trước khi thêm hoặc sửa cấu trúc.
- Không tự ý drop, truncate, reset, recreate database hoặc xoá dữ liệu.
- Migration phải có thứ tự, mục đích rõ ràng; đánh giá backward compatibility và rollback.
- Thay đổi có nguy cơ mất dữ liệu, rename/drop column, đổi type, đổi key/constraint hoặc migration production phải xin phép.
- Không sửa migration đã chạy ở môi trường chia sẻ/production nếu chưa đánh giá; ưu tiên migration mới.
- Dùng transaction khi cần; khai báo index/constraint theo truy vấn và quy tắc nghiệp vụ.
- Không lưu mật khẩu dạng plaintext; không lưu secret không cần thiết.
- Seed/demo data phải tách biệt dữ liệu production và không chứa thông tin thật.
- Sau thay đổi schema, kiểm tra migration trên môi trường an toàn và cập nhật ERD/schema docs.
