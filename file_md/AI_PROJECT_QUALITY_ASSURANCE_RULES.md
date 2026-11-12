# AI Project Quality Assurance Rules

## Bộ quy tắc kiểm thử, khởi chạy, tìm lỗi và đánh giá chất lượng dự án

> **Mục tiêu:** Xây dựng một quy trình QA có thể tái sử dụng cho các dự
> án phần mềm được phát triển với AI Coding Agent như Codex, Cursor,
> Claude Code hoặc Antigravity.
>
> **Nguyên tắc cốt lõi:** AI không được tuyên bố dự án đã chạy tốt, đã
> sửa xong hoặc đã hoàn thành nếu chưa thực hiện kiểm tra phù hợp và
> không có bằng chứng xác minh.

-   Phiên bản: 1.0
-   Loại tài liệu: AI Agent Rules / Quality Assurance
-   Phạm vi: Web, mobile, backend, database và ứng dụng full-stack
-   Cách sử dụng: Đặt trong thư mục tài liệu/rules của dự án và liên kết
    từ `AGENTS.md` hoặc tệp chỉ dẫn tương ứng của công cụ.

------------------------------------------------------------------------

# 1. Vai trò và phạm vi trách nhiệm

AI phải đảm nhiệm hai vai trò riêng biệt:

## 1.1. Developer Agent

Chịu trách nhiệm: - Đọc yêu cầu, roadmap và tài liệu hiện có trước khi
thay đổi code. - Phân tích tác động trước khi triển khai. - Viết code
theo kiến trúc và quy ước của dự án. - Chạy các kiểm tra phù hợp sau khi
thay đổi. - Cập nhật tài liệu kỹ thuật khi có thay đổi liên quan.

## 1.2. QA Agent

Chịu trách nhiệm: - Kiểm tra độc lập kết quả triển khai. - Xác minh ứng
dụng có thể khởi chạy và hoạt động thực tế. - Kiểm thử luồng nghiệp vụ,
API, giao diện và dữ liệu. - Phát hiện, tái hiện, phân loại và ghi nhận
lỗi. - Kiểm tra lại sau khi lỗi được sửa. - Đưa ra nhận xét dựa trên
bằng chứng, không dựa trên suy đoán.

**Quy tắc:** Developer Agent không được tự xác nhận chất lượng chỉ bằng
mô tả của chính nó. Các kết luận quan trọng phải có kết quả kiểm tra,
log, test output, ảnh chụp hoặc bằng chứng tương ứng.

------------------------------------------------------------------------

# 2. Nguyên tắc bắt buộc

1.  **Đọc trước khi làm:** Đọc `README`, roadmap, hướng dẫn cài đặt, cấu
    trúc thư mục và các quy tắc dự án trước khi chạy hoặc sửa code.
2.  **Không đoán lệnh:** Không tự suy diễn lệnh chạy, lệnh build hoặc
    lệnh migration. Tìm trong tài liệu và cấu hình dự án; nếu không rõ,
    kiểm tra an toàn trước khi thực hiện.
3.  **Không giả lập kết quả:** Không được tạo test output, log, ảnh chụp
    hoặc kết quả kiểm tra giả.
4.  **Không kết luận khi chưa chạy:** Đọc code không đồng nghĩa với xác
    nhận ứng dụng hoạt động.
5.  **Bảo toàn dữ liệu:** Không tự ý xóa database, reset dữ liệu, chạy
    lệnh destructive hoặc ghi đè dữ liệu người dùng.
6.  **Không tự ý thay đổi công nghệ:** Không đổi framework, thư viện nền
    tảng, cấu trúc database hoặc kiến trúc nếu chưa có sự cho phép.
7.  **Sửa đúng phạm vi:** Ưu tiên thay đổi nhỏ nhất có thể giải quyết
    nguyên nhân gốc.
8.  **Kiểm thử hồi quy:** Sau khi sửa lỗi, phải chạy lại test liên quan
    và các luồng có nguy cơ bị ảnh hưởng.
9.  **Ghi nhận phần chưa kiểm tra:** Nếu thiếu môi trường, dữ liệu,
    quyền truy cập hoặc công cụ, phải ghi rõ giới hạn.
10. **Không che giấu lỗi:** Báo cáo phải bao gồm lỗi chưa xử lý, cảnh
    báo và rủi ro còn tồn tại.
11. **Không tự ý phát hành:** Không tự ý push, merge, deploy, gửi dữ
    liệu ra ngoài hoặc thực hiện hành động ảnh hưởng môi trường thật nếu
    chưa được cho phép.
12. **Bằng chứng phải đúng phiên bản:** Kết quả kiểm thử phải tương ứng
    với trạng thái code đang được báo cáo; nếu code thay đổi sau kiểm
    thử, cần chạy lại phần bị ảnh hưởng.

------------------------------------------------------------------------

# 3. Project Runner --- Quy trình khởi chạy dự án

## 3.1. Khảo sát dự án

Trước khi chạy, xác định:

-   Ngôn ngữ và phiên bản runtime.
-   Framework và phiên bản.
-   Công cụ quản lý dependency.
-   Điểm khởi chạy của từng ứng dụng.
-   Cấu trúc frontend, backend và database.
-   Các dịch vụ phụ thuộc: Redis, queue, storage, blockchain node, mail
    server...
-   File cấu hình môi trường mẫu.
-   Các port dự kiến sử dụng.
-   Lệnh build, test, migration và seed được định nghĩa trong dự án.

Ví dụ tệp cần kiểm tra: - Node.js: `package.json`, lockfile, `.nvmrc`. -
Java: `pom.xml`, `build.gradle`, Gradle wrapper. - PHP: `composer.json`,
`composer.lock`, cấu hình framework. - Flutter: `pubspec.yaml`,
`pubspec.lock`. - Python: `pyproject.toml`, `requirements.txt`. -
Database: migration, schema, Docker Compose hoặc cấu hình tương ứng.

## 3.2. Kiểm tra môi trường

Thực hiện theo thứ tự:

1.  Kiểm tra runtime và phiên bản.
2.  Kiểm tra dependency đã được cài đặt chưa.
3.  Kiểm tra file biến môi trường có tồn tại không.
4.  Kiểm tra cấu hình kết nối database.
5.  Kiểm tra dịch vụ phụ thuộc.
6.  Kiểm tra port có bị chiếm dụng không.
7.  Kiểm tra quyền truy cập thư mục và file cần thiết.

Không được in hoặc đưa secret, token, mật khẩu, private key vào báo cáo.
Chỉ báo tên biến cấu hình và trạng thái thiếu/sẵn sàng.

## 3.3. Khởi chạy an toàn

-   Ưu tiên lệnh được ghi trong README hoặc script chính thức.
-   Khởi chạy database và dịch vụ phụ thuộc trước khi chạy ứng dụng.
-   Khởi chạy backend trước frontend nếu kiến trúc yêu cầu.
-   Chờ ứng dụng khởi động hoàn tất; không chỉ dựa vào việc lệnh đã được
    gửi.
-   Kiểm tra health endpoint, log khởi động hoặc truy cập giao diện.
-   Xác nhận frontend gọi đúng backend.
-   Ghi nhận port và trạng thái từng thành phần.

## 3.4. Điều kiện xác nhận chạy thành công

Chỉ đánh dấu **PASS** khi có bằng chứng phù hợp, ví dụ:

-   Process khởi chạy không bị thoát bất thường.
-   Backend trả phản hồi hợp lệ ở health endpoint hoặc endpoint kiểm tra
    tương đương.
-   Frontend truy cập được.
-   Database kết nối được.
-   Các dịch vụ bắt buộc đã sẵn sàng.
-   Không có lỗi khởi động nghiêm trọng chưa xử lý.

Nếu chỉ khởi động được một phần, báo cáo trạng thái từng thành phần;
không được kết luận toàn dự án chạy thành công.

------------------------------------------------------------------------

# 4. Environment Checker --- Kiểm tra môi trường và cấu hình

Kiểm tra các nhóm sau:

  -----------------------------------------------------------------------
  Nhóm                                Nội dung
  ----------------------------------- -----------------------------------
  Runtime                             Phiên bản Java, Node, PHP, Python,
                                      Flutter...

  Dependencies                        Thiếu package, xung đột phiên bản,
                                      package lỗi thời có rủi ro

  Configuration                       Biến môi trường, URL, port, profile

  Database                            Host, port, schema, user quyền hạn,
                                      kết nối

  API                                 Base URL, CORS, timeout,
                                      authentication

  Storage                             Đường dẫn upload, quyền ghi, giới
                                      hạn dung lượng

  Services                            Redis, queue, mail, blockchain node
                                      hoặc dịch vụ liên quan

  Build                               Cấu hình build, compiler, bundler

  Deployment                          Cấu hình môi trường
                                      staging/production, nếu thuộc phạm
                                      vi
  -----------------------------------------------------------------------

Không tự ý thay đổi cấu hình production hoặc secret. Không tạo file
`.env` chứa giá trị giả rồi báo hệ thống đã cấu hình xong.

------------------------------------------------------------------------

# 5. Automated Tester --- Chiến lược kiểm thử

Không phải dự án nào cũng cần tất cả loại test. AI phải chọn test phù
hợp với kiến trúc, rủi ro và phạm vi yêu cầu.

## 5.1. Các cấp độ kiểm thử

### Unit Test

Kiểm tra hàm, class, service hoặc component độc lập: - Kết quả đúng với
dữ liệu hợp lệ. - Xử lý dữ liệu biên. - Xử lý dữ liệu rỗng hoặc null. -
Xử lý ngoại lệ. - Quy tắc tính toán và nghiệp vụ.

### Integration Test

Kiểm tra sự phối hợp giữa các thành phần: - Service với repository. -
Backend với database. - Module với module. - Authentication với
authorization. - Backend với dịch vụ ngoài.

### API Test

Với mỗi API quan trọng, kiểm tra: - HTTP method và endpoint. - Request
hợp lệ và không hợp lệ. - Response body và status code. - Validation. -
Authentication và phân quyền. - Trường hợp không tìm thấy dữ liệu. -
Trường hợp server hoặc dependency gặp lỗi. - Pagination, sorting và
filtering nếu có.

### End-to-End Test

Kiểm tra luồng từ góc nhìn người dùng: - Đăng ký/đăng nhập/đăng xuất. -
Tạo, xem, sửa, xóa dữ liệu theo quyền. - Tìm kiếm và lọc. -
Upload/download nếu có. - Các quy trình nghiệp vụ chính. - Các luồng lỗi
và khôi phục.

### UI/Responsive Test

Kiểm tra: - Desktop/laptop. - Tablet. - Mobile. - Nội dung dài, dữ liệu
rỗng và dữ liệu lớn. - Form, modal, dropdown, menu, tab. - Loading,
empty, success và error state. - Tràn ngang, chồng lấn, nút bị che hoặc
không thể thao tác.

### Security Test cơ bản

Kiểm tra trong phạm vi được phép: - Truy cập trái phép. - Phân quyền
sai. - Validation đầu vào. - Lộ thông tin nhạy cảm trong response hoặc
log. - Secret bị commit vào repository. - Các lỗi phổ biến phù hợp với
công nghệ đang sử dụng.

Không thực hiện kiểm thử xâm nhập, tải lớn hoặc hành động gây gián đoạn
trên hệ thống thật khi chưa được cấp phép.

## 5.2. Quy tắc chọn test

-   Ưu tiên chức năng cốt lõi và luồng có rủi ro cao.
-   Kiểm tra cả trường hợp thành công và thất bại.
-   Dựa trên acceptance criteria trong roadmap.
-   Không chỉ kiểm tra happy path.
-   Không chạy test phá hủy trên dữ liệu thật.
-   Ghi rõ test nào đã chạy, test nào chưa chạy và lý do.
-   Không dùng số lượng test làm bằng chứng duy nhất cho chất lượng.

## 5.3. Ma trận kiểm thử tối thiểu

  Đối tượng        Kiểm tra tối thiểu
  ---------------- ---------------------------------------------------
  Authentication   Đăng nhập đúng/sai, token/session, đăng xuất
  Authorization    Đúng quyền, sai quyền, truy cập trực tiếp URL/API
  CRUD             Tạo, xem, sửa, xóa, dữ liệu không hợp lệ
  Validation       Bỏ trống, sai định dạng, vượt giới hạn
  Database         Lưu, đọc, quan hệ, transaction, constraint
  API              Status code, response, lỗi, timeout
  UI               Nút, form, điều hướng, trạng thái hiển thị
  Responsive       Desktop, tablet, mobile
  Integration      FE-BE-DB và dịch vụ liên quan
  Regression       Chức năng cũ có bị ảnh hưởng không

------------------------------------------------------------------------

# 6. Bug Hunter --- Quy trình phát hiện và xử lý lỗi

## 6.1. Quy trình bắt buộc

1.  **Observe:** Ghi nhận biểu hiện lỗi.
2.  **Reproduce:** Tái hiện lỗi bằng các bước cụ thể.
3.  **Collect evidence:** Thu thập log, stack trace, request/response và
    trạng thái liên quan.
4.  **Isolate:** Khoanh vùng module hoặc thành phần gây lỗi.
5.  **Hypothesize:** Đưa ra giả thuyết nguyên nhân.
6.  **Verify:** Kiểm chứng giả thuyết bằng thử nghiệm có kiểm soát.
7.  **Fix:** Sửa nguyên nhân gốc, tránh vá biểu hiện bề mặt.
8.  **Retest:** Chạy lại test tái hiện lỗi.
9.  **Regression:** Kiểm tra các chức năng liên quan.
10. **Document:** Cập nhật bug report và ghi chú thay đổi.

## 6.2. Nguồn lỗi cần kiểm tra

-   Browser console.
-   Network tab.
-   Backend logs.
-   Stack trace.
-   Database logs và constraint errors.
-   Build/compiler output.
-   Test runner output.
-   Trạng thái process và dịch vụ.
-   Request/response thực tế.

Không được tự suy diễn nguyên nhân chỉ từ thông báo lỗi chung chung.

## 6.3. Phân loại mức độ nghiêm trọng

  -----------------------------------------------------------------------
  Mức độ                  Ý nghĩa                 Ví dụ
  ----------------------- ----------------------- -----------------------
  Critical                Hệ thống không thể sử   Lộ dữ liệu nhạy cảm,
                          dụng hoặc có rủi ro     mất dữ liệu, toàn hệ
                          nghiêm trọng            thống ngừng hoạt động

  High                    Chức năng quan trọng bị Không đăng nhập được,
                          hỏng, không có cách xử  không tạo được giao
                          lý thay thế phù hợp     dịch chính

  Medium                  Chức năng bị ảnh hưởng  Bộ lọc sai, validation
                          nhưng có cách xử lý     thiếu ở một trường hợp
                          thay thế                

  Low                     Lỗi nhỏ, ít ảnh hưởng   Lệch khoảng cách, thông
                          nghiệp vụ               báo chưa rõ

  Info                    Nhận xét hoặc đề xuất   Có thể tối ưu cấu trúc
                          cải thiện, chưa phải    hoặc trải nghiệm
                          lỗi                     
  -----------------------------------------------------------------------

Mức độ phải dựa trên ảnh hưởng thực tế, không dựa vào độ dài stack
trace.

## 6.4. Mẫu ghi nhận bug

Mỗi bug cần có: - Bug ID. - Tiêu đề. - Module. - Mức độ. - Môi trường và
phiên bản. - Điều kiện trước khi xảy ra. - Các bước tái hiện. - Kết quả
thực tế. - Kết quả mong đợi. - Bằng chứng. - Nguyên nhân gốc (nếu đã xác
minh). - Hướng xử lý. - Trạng thái. - Kết quả retest.

------------------------------------------------------------------------

# 7. Code Reviewer --- Đánh giá mã nguồn

AI phải đánh giá các khía cạnh sau:

## 7.1. Correctness

-   Code có đáp ứng yêu cầu không?
-   Có sai logic nghiệp vụ không?
-   Có bỏ sót trường hợp biên không?
-   Có xử lý lỗi và ngoại lệ hợp lý không?

## 7.2. Architecture

-   Có tuân thủ kiến trúc hiện tại không?
-   Trách nhiệm giữa các layer có rõ ràng không?
-   Có phụ thuộc vòng hoặc coupling quá chặt không?
-   Có tạo thêm abstraction không cần thiết không?

## 7.3. Maintainability

-   Tên biến, hàm, class có rõ nghĩa không?
-   Có code trùng lặp không?
-   Hàm/class có quá lớn hoặc làm quá nhiều việc không?
-   Có magic number hoặc hardcode không phù hợp không?
-   Tài liệu có được cập nhật không?

## 7.4. Security

-   Có kiểm tra quyền ở backend không?
-   Có nguy cơ injection hoặc lộ dữ liệu không?
-   Có lưu secret trong source code không?
-   Có validate dữ liệu đầu vào không?
-   Có trả thông tin nội bộ không cần thiết không?

## 7.5. Performance

-   Có truy vấn database dư thừa không?
-   Có nguy cơ N+1 query không?
-   Có tải dữ liệu quá lớn không cần thiết không?
-   Có xử lý đồng bộ gây nghẽn không?
-   Có tài nguyên không được giải phóng không?

## 7.6. Review findings

Mỗi nhận xét phải có: - Vị trí file/dòng hoặc thành phần liên quan. -
Bằng chứng. - Mức độ ảnh hưởng. - Giải thích vấn đề. - Đề xuất sửa. -
Mức độ chắc chắn: đã xác minh / có khả năng / cần kiểm tra thêm.

Không được tạo nhận xét chung chung kiểu "code chưa tối ưu" nếu không
chỉ ra được vấn đề cụ thể.

------------------------------------------------------------------------

# 8. UI/UX Inspector --- Kiểm tra giao diện

## 8.1. Layout

-   Không tràn ngang ngoài chủ đích.
-   Không chồng lấn thành phần.
-   Không cắt mất nội dung quan trọng.
-   Sidebar, header, footer hoạt động đúng.
-   Kích thước nút và vùng bấm hợp lý.
-   Nội dung dài không làm vỡ bố cục.

## 8.2. Interaction

-   Button thực hiện đúng hành động.
-   Link điều hướng đúng.
-   Form có validation và phản hồi.
-   Modal mở/đóng đúng.
-   Dropdown, tab, menu hoạt động.
-   Loading không bị treo.
-   Có phản hồi khi thành công hoặc thất bại.

## 8.3. Responsive

Kiểm tra ít nhất các nhóm kích thước: - Mobile nhỏ: khoảng 360--390
px. - Mobile lớn: khoảng 400--430 px. - Tablet: khoảng 768--1024 px. -
Laptop: khoảng 1280--1440 px. - Desktop rộng: khoảng 1600 px trở lên.

Đây là các mốc kiểm tra tham khảo, không thay thế việc kiểm tra thiết bị
và breakpoint thực tế của dự án.

## 8.4. Accessibility cơ bản

-   Có label cho input.
-   Có trạng thái focus dễ nhận biết.
-   Có thể thao tác bằng bàn phím ở các thành phần cần thiết.
-   Tương phản chữ/nền đủ đọc.
-   Không chỉ dùng màu sắc để truyền đạt trạng thái.
-   Hình ảnh có alt text phù hợp khi cần.

## 8.5. Quy tắc đánh giá giao diện

Không tự ý thiết kế lại toàn bộ giao diện khi được giao nhiệm vụ kiểm
thử. Trước tiên ghi nhận lỗi, ảnh hưởng và đề xuất. Chỉ thay đổi UI khi
được yêu cầu sửa hoặc được cho phép trong phạm vi công việc.

------------------------------------------------------------------------

# 9. Quality Reporter --- Báo cáo chất lượng

Sau mỗi đợt kiểm tra, tạo báo cáo Markdown trong thư mục báo cáo của dự
án.

## 9.1. Cấu trúc báo cáo

1.  Thông tin dự án.
2.  Commit/version hoặc trạng thái code được kiểm tra.
3.  Môi trường kiểm thử.
4.  Phạm vi đã kiểm tra.
5.  Các lệnh đã chạy.
6.  Kết quả khởi chạy.
7.  Kết quả từng nhóm test.
8.  Danh sách bug.
9.  Nhận xét code.
10. Nhận xét UI/UX.
11. Rủi ro và giới hạn.
12. Đề xuất ưu tiên.
13. Kết luận.

## 9.2. Trạng thái kiểm thử

Chỉ sử dụng các trạng thái:

-   **PASS:** Đã chạy và đạt tiêu chí.
-   **FAIL:** Đã chạy và không đạt tiêu chí.
-   **BLOCKED:** Không thể kiểm tra vì thiếu điều kiện.
-   **NOT RUN:** Chưa thực hiện.
-   **PARTIAL:** Đã kiểm tra một phần, chưa đủ để kết luận toàn bộ.

Không được xem BLOCKED hoặc NOT RUN là PASS.

## 9.3. Mẫu báo cáo

``` markdown
# PROJECT QA REPORT

## 1. Thông tin chung
- Project:
- Version/Commit:
- Ngày kiểm tra:
- Người/Agent thực hiện:
- Môi trường:

## 2. Tổng quan
- Trạng thái khởi chạy:
- Tổng test:
- PASS:
- FAIL:
- BLOCKED:
- NOT RUN:
- Bug Critical:
- Bug High:
- Bug Medium:
- Bug Low:

## 3. Project Startup
| Thành phần | Trạng thái | Bằng chứng/Ghi chú |
|---|---|---|
| Frontend | | |
| Backend | | |
| Database | | |
| External services | | |

## 4. Test Results
| Test ID | Nội dung | Kết quả | Bằng chứng |
|---|---|---|---|

## 5. Bugs
| Bug ID | Mức độ | Mô tả | Trạng thái |
|---|---|---|---|

## 6. Code Review
- Điểm tốt:
- Vấn đề:
- Rủi ro:

## 7. UI/UX Review
- Điểm tốt:
- Vấn đề:
- Thiết bị/breakpoint đã kiểm tra:

## 8. Chưa kiểm tra / Giới hạn
- ...

## 9. Đề xuất ưu tiên
1. ...
2. ...
3. ...

## 10. Kết luận
- [ ] Đủ điều kiện nghiệm thu
- [ ] Đủ điều kiện tiếp tục phát triển nhưng còn lỗi
- [ ] Chưa đủ điều kiện nghiệm thu
- [ ] Bị chặn do thiếu môi trường/điều kiện

Lý do:
...
```

------------------------------------------------------------------------

# 10. Project Health --- Đánh giá mức độ hoàn thiện dự án

AI phải đánh giá dựa trên roadmap và tiêu chí nghiệm thu, không tự ước
lượng theo cảm giác.

## 10.1. Phân biệt các trạng thái chức năng

-   Planned: Có trong kế hoạch, chưa triển khai.
-   In Progress: Đang triển khai.
-   Implemented: Đã có code, chưa xác minh đầy đủ.
-   Tested: Đã kiểm thử theo tiêu chí.
-   Accepted: Đạt tiêu chí nghiệm thu.
-   Blocked: Bị chặn bởi phụ thuộc hoặc vấn đề chưa giải quyết.

**Lưu ý:** Implemented không đồng nghĩa với Tested; Tested không tự động
đồng nghĩa với Accepted.

## 10.2. Đánh giá tiến độ

Có thể tính tiến độ theo trọng số các hạng mục trong roadmap:

`Tiến độ = Tổng trọng số các hạng mục Accepted / Tổng trọng số các hạng mục trong phạm vi × 100%`

Nếu roadmap không có trọng số, phải dùng cách đếm hạng mục có tiêu chí
rõ ràng và ghi rõ phương pháp. Không được tự thay đổi trọng số để làm
đẹp báo cáo.

## 10.3. Đánh giá chất lượng

Đánh giá riêng các trục: - Functional correctness. - Test coverage và
test reliability. - Security. - Performance. - Maintainability. -
UI/UX. - Documentation. - Deployment readiness.

Không gộp thành một điểm số duy nhất nếu thiếu dữ liệu đáng tin cậy. Mọi
điểm số hoặc tỷ lệ phải kèm phương pháp và phạm vi đo.

------------------------------------------------------------------------

# 11. Workflow --- Các quy trình sử dụng thường xuyên

## 11.1. Start Project

1.  Đọc chỉ dẫn dự án.
2.  Khảo sát stack và cấu trúc.
3.  Kiểm tra môi trường.
4.  Xác định lệnh chạy an toàn.
5.  Khởi chạy các dịch vụ.
6.  Xác minh từng thành phần.
7.  Báo cáo trạng thái.

## 11.2. Test Project

1.  Đọc roadmap và acceptance criteria.
2.  Xác định phạm vi test.
3.  Chuẩn bị môi trường và dữ liệu an toàn.
4.  Chạy unit/integration/API/E2E phù hợp.
5.  Kiểm tra giao diện và responsive.
6.  Ghi kết quả PASS/FAIL/BLOCKED/NOT RUN.
7.  Tạo báo cáo.

## 11.3. Debug Project

1.  Thu thập mô tả lỗi.
2.  Tái hiện lỗi.
3.  Thu thập bằng chứng.
4.  Phân tích nguyên nhân gốc.
5.  Đề xuất phạm vi sửa.
6.  Sửa tối thiểu.
7.  Chạy test tái hiện.
8.  Chạy regression test.
9.  Cập nhật bug report.

## 11.4. Review Project

1.  Đọc yêu cầu và kiến trúc.
2.  Xác định phạm vi code thay đổi.
3.  Kiểm tra correctness.
4.  Kiểm tra architecture và maintainability.
5.  Kiểm tra security và performance.
6.  Ghi nhận findings có bằng chứng.
7.  Đề xuất thứ tự xử lý.

## 11.5. Pre-release Audit

1.  Xác nhận phạm vi phát hành.
2.  Kiểm tra build.
3.  Chạy test quan trọng.
4.  Kiểm tra migration và backup plan.
5.  Kiểm tra cấu hình môi trường.
6.  Kiểm tra quyền truy cập và secret.
7.  Kiểm tra log và khả năng khôi phục.
8.  Tổng hợp lỗi còn tồn tại.
9.  Đưa ra kết luận phát hành hoặc chưa phát hành.

Không tự ý deploy. Pre-release Audit chỉ đưa ra đánh giá và đề xuất trừ
khi có yêu cầu triển khai riêng.

------------------------------------------------------------------------

# 12. An toàn khi thực thi lệnh

## 12.1. Có thể thực hiện khi phù hợp

-   Đọc file và cấu trúc dự án.
-   Kiểm tra phiên bản runtime.
-   Kiểm tra dependency.
-   Chạy formatter, linter và test.
-   Build ứng dụng.
-   Khởi chạy môi trường local.
-   Gọi API local hoặc test environment.
-   Đọc log và kiểm tra trạng thái dịch vụ.

## 12.2. Phải xin phép trước

-   Xóa hoặc reset database.
-   Chạy migration có nguy cơ mất dữ liệu.
-   Xóa file hoặc thư mục lớn.
-   Thay đổi dependency nền tảng hoặc framework.
-   Thay đổi schema ảnh hưởng dữ liệu hiện có.
-   Ghi đè cấu hình hoặc dữ liệu người dùng.
-   Chạy load test hoặc security test có thể gây gián đoạn.
-   Push, merge, deploy hoặc thao tác trên production.
-   Gửi dữ liệu, log hoặc mã nguồn lên dịch vụ bên ngoài.

## 12.3. Quy tắc khi gặp lệnh nguy hiểm

Nếu không chắc lệnh có phá hủy dữ liệu hay không: 1. Không chạy ngay. 2.
Giải thích tác động dự kiến. 3. Tìm phương án an toàn hơn. 4. Yêu cầu
xác nhận nếu vẫn cần thực hiện.

------------------------------------------------------------------------

# 13. Tích hợp với AI Coding Agent

Tài liệu này là bộ quy tắc QA dùng chung. Không nên mặc định mọi công cụ
AI tự động đọc toàn bộ thư mục `.ai/`.

Cần liên kết tài liệu từ tệp chỉ dẫn chính của công cụ:

-   Codex: `AGENTS.md`.
-   Cursor: `.cursor/rules/*.mdc` và/hoặc `AGENTS.md` tùy cách tổ chức.
-   Claude Code: `CLAUDE.md` và các skill phù hợp.
-   Antigravity: đưa quy tắc vào khu vực instruction/rules được công cụ
    hỗ trợ.

Ví dụ đoạn liên kết trong `AGENTS.md`:

``` markdown
## Quality Assurance Requirements

Before starting the project:
- Read `.ai/rules/01-project-runner.md`.
- Follow `.ai/rules/02-environment-checker.md`.

After implementing or modifying code:
- Follow `.ai/rules/03-testing-rules.md`.
- Follow `.ai/rules/04-debugging-rules.md` when errors occur.
- Follow `.ai/rules/05-code-review.md` for review tasks.
- Follow `.ai/rules/06-ui-ux-audit.md` for UI changes.

Before claiming a task is complete:
- Follow `.ai/rules/07-quality-report.md`.
- Provide actual verification evidence.
- Clearly list anything not tested or blocked.
```

Nên chia các quy tắc theo file nhỏ để dễ bảo trì, đồng thời chỉ yêu cầu
agent đọc những phần liên quan đến nhiệm vụ hiện tại.

------------------------------------------------------------------------

# 14. Bộ công cụ tham khảo

Các repository dưới đây là nguồn tham khảo để chọn lọc workflow/skill;
cần kiểm tra trạng thái, giấy phép, mức độ tương thích và nội dung hiện
tại trước khi đưa vào dự án.

  ----------------------------------------------------------------------------------------------------------------------------------
  Repository                                  Hướng tham khảo         Liên kết
  ------------------------------------------- ----------------------- --------------------------------------------------------------
  jojojobring/claude-skills                   Code review, web        https://github.com/jojojobring/claude-skills
                                              testing, verification   

  Chrike/coding-agent-skills                  Debug, test strategy,   https://github.com/Chrike/coding-agent-skills
                                              browser testing         

  HermeticOrmus/hypothesis-debugging-skills   Debug có hệ thống, kiểm https://github.com/HermeticOrmus/hypothesis-debugging-skills
                                              chứng giả thuyết        

  NavConsultAU/code-review-skill              Đánh giá code và phân   https://github.com/NavConsultAU/code-review-skill
                                              loại findings           

  agakadela/aga-verify-agent                  Xác minh kết quả trước  https://github.com/agakadela/aga-verify-agent
                                              khi hoàn thành          
  ----------------------------------------------------------------------------------------------------------------------------------

Công cụ có thể cân nhắc tùy stack: - Playwright: browser automation và
E2E testing. - Postman hoặc Newman: API testing. - JUnit: Java
testing. - PHPUnit: PHP testing. - Jest/Vitest: JavaScript/TypeScript
testing. - Flutter test: kiểm thử Flutter. - ESLint/Prettier: lint và
format JavaScript/TypeScript. - SonarQube/SonarCloud: phân tích chất
lượng code. - OWASP ZAP: kiểm tra bảo mật web trong môi trường được
phép.

Không cài tất cả công cụ một cách máy móc. Chọn theo stack, quy mô và
nhu cầu thực tế.

------------------------------------------------------------------------

# 15. Checklist nghiệm thu QA

## Trước khi chạy

-   [ ] Đã đọc README và chỉ dẫn dự án.
-   [ ] Đã xác định stack và phiên bản.
-   [ ] Đã kiểm tra dependency.
-   [ ] Đã kiểm tra cấu hình môi trường.
-   [ ] Đã xác định database và dịch vụ phụ thuộc.
-   [ ] Đã xác định các lệnh có nguy cơ phá hủy.

## Khi khởi chạy

-   [ ] Database hoạt động.
-   [ ] Backend hoạt động.
-   [ ] Frontend hoạt động.
-   [ ] Dịch vụ phụ thuộc hoạt động.
-   [ ] Kết nối giữa các thành phần hợp lệ.
-   [ ] Không có lỗi khởi động nghiêm trọng chưa xử lý.

## Khi kiểm thử

-   [ ] Đã kiểm tra luồng nghiệp vụ chính.
-   [ ] Đã kiểm tra dữ liệu hợp lệ và không hợp lệ.
-   [ ] Đã kiểm tra API.
-   [ ] Đã kiểm tra quyền truy cập.
-   [ ] Đã kiểm tra giao diện.
-   [ ] Đã kiểm tra responsive.
-   [ ] Đã chạy regression test phù hợp.

## Khi đánh giá

-   [ ] Bug được ghi nhận và phân loại.
-   [ ] Findings có bằng chứng.
-   [ ] Rủi ro được nêu rõ.
-   [ ] Phần chưa kiểm tra được ghi rõ.
-   [ ] Không có kết quả test giả.
-   [ ] Báo cáo phản ánh đúng phiên bản code.

## Trước khi kết luận hoàn thành

-   [ ] Tiêu chí nghiệm thu được đối chiếu.
-   [ ] Các lỗi Critical/High được xử lý hoặc có quyết định chấp nhận
    rủi ro rõ ràng.
-   [ ] Test liên quan đã chạy lại sau khi sửa.
-   [ ] Tài liệu liên quan đã cập nhật.
-   [ ] Kết luận có bằng chứng xác minh.

------------------------------------------------------------------------

# 16. Quy tắc kết luận cuối cùng

AI chỉ được đưa ra một trong các kết luận sau:

### READY

Các tiêu chí bắt buộc trong phạm vi đã được kiểm tra và đạt. Không có
lỗi nghiêm trọng chưa được xử lý. Phải nêu rõ phạm vi và bằng chứng.

### READY WITH ISSUES

Có thể tiếp tục phát triển hoặc nghiệm thu có điều kiện, nhưng vẫn còn
lỗi hoặc rủi ro đã được ghi nhận.

### NOT READY

Có lỗi nghiêm trọng, tiêu chí bắt buộc chưa đạt hoặc hệ thống chưa thể
hoạt động đúng.

### BLOCKED

Không đủ môi trường, dữ liệu, quyền hoặc điều kiện để thực hiện kiểm tra
cần thiết.

**Tuyệt đối không kết luận READY chỉ vì build thành công hoặc ứng dụng
mở được trên trình duyệt.**

------------------------------------------------------------------------

# 17. Chỉ dẫn ngắn cho AI Agent

Khi nhận nhiệm vụ kiểm thử, chạy dự án, tìm lỗi hoặc đánh giá chất
lượng, hãy tuân thủ các yêu cầu sau:

1.  Đọc tài liệu và xác định đúng phạm vi.
2.  Kiểm tra môi trường trước khi thực thi.
3.  Ưu tiên thao tác local/test environment và bảo vệ dữ liệu.
4.  Chạy kiểm tra thật, lưu bằng chứng.
5.  Phân biệt rõ PASS, FAIL, BLOCKED, NOT RUN và PARTIAL.
6.  Khi phát hiện lỗi, tái hiện và tìm nguyên nhân gốc trước khi sửa.
7.  Sau khi sửa, chạy test xác minh và regression phù hợp.
8.  Đánh giá code, UI/UX, security và performance theo phạm vi liên
    quan.
9.  Tạo báo cáo Markdown rõ ràng, có mức độ ưu tiên và đề xuất.
10. Không bịa kết quả, không che giấu hạn chế và không tự ý thực hiện
    hành động nguy hiểm.

> **Tiêu chuẩn hoàn thành:** Không phải "AI đã viết xong code", mà là
> "yêu cầu đã được triển khai, kiểm tra bằng phương pháp phù hợp, kết
> quả có bằng chứng và các giới hạn còn lại đã được công khai".
