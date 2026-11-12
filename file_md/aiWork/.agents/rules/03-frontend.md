---
trigger: glob
globs: "**/*.{tsx,ts,jsx,js,vue,svelte,html,css,scss,dart}"
description: "Dùng khi tạo hoặc sửa frontend, UI, responsive layout, state và accessibility."
---
# Frontend Standards

- Trước khi code, tìm design system, component dùng chung, routing, state management và style convention hiện tại.
- Bám sát UI spec/ảnh tham chiếu đã duyệt; không tự đổi brand, palette, typography, layout hoặc interaction cốt lõi.
- Responsive theo breakpoint thực tế; kiểm tra ít nhất các viewport mục tiêu được mô tả trong project profile.
- Không dùng fixed width/height gây tràn hoặc làm nút/form co méo; kiểm tra text dài, empty/loading/error states.
- Tái sử dụng component hợp lý; tránh component khổng lồ và tránh abstraction quá sớm.
- Mọi control có vẻ tương tác phải có hành vi thực; không để nút giả, link chết hoặc form không submit.
- Có trạng thái loading, empty, error, success khi phù hợp; hiển thị validation rõ ràng.
- Ưu tiên semantic HTML, keyboard navigation, focus visible, label và contrast đủ dùng.
- Không nhúng secret hoặc logic phân quyền nhạy cảm ở frontend; backend phải kiểm tra quyền.
- Không thay API contract bằng mock hoặc dữ liệu hardcode để che backend chưa hoàn thành.
- Khi sửa UI, kiểm tra console/build và các màn hình bị ảnh hưởng; không chỉ kiểm tra component mới.
