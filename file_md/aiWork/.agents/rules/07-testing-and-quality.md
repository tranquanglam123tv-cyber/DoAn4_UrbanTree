---
trigger: model_decision
description: "Dùng khi viết test, debug, review code, build, lint hoặc xác minh tính hoàn chỉnh."
---
# Testing and Quality

- Xác định lệnh test/lint/build từ package scripts, CI hoặc project profile; không đoán lệnh.
- Viết test cho logic nghiệp vụ và regression bug; ưu tiên test hành vi quan sát được.
- Chạy kiểm tra nhỏ liên quan trước, sau đó chạy bộ kiểm tra rộng hơn nếu thời gian và môi trường cho phép.
- Khi test thất bại, đọc lỗi và tìm nguyên nhân; không xoá test hoặc nới assertion chỉ để xanh.
- Không giả lập thành công của API/database khi đang xác minh tích hợp thật.
- Nếu môi trường thiếu dependency/dịch vụ, nêu rõ kiểm tra nào chưa chạy và lý do.
- Review diff để tìm lỗi logic, edge cases, breaking changes, lộ secret, file ngoài phạm vi và thay đổi không mong muốn.
- Phân biệt rõ: test passed, test failed, test not run.
- Không tuyên bố “đã test đầy đủ” nếu chỉ chạy một phần.
