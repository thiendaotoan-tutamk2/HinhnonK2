# DANH SÁCH YÊU CẦU & KẾT QUẢ TRIỂN KHAI
*(Đã hoàn thành toàn bộ 4 yêu cầu theo đúng đặc tả của người dùng)*

---

### 1. Chặng 2 - Bước 2/3: Sửa lỗi 2 tam giác cùng quay -> Đúng duy nhất 1 tam giác quay [ĐÃ HOÀN THÀNH ✓]
- **Đã xử lý:**
  - Định vị lại các nhãn $h$ và $O$ nằm trọn vẹn bên trong phạm vi tam giác $SOB$, loại bỏ hoàn toàn tọa độ âm $x = -0.85$ trước đó (vốn tạo ảo giác một tam giác đối xứng thứ hai quay ở phía đối diện).
  - Tắt triệt để mọi profile phụ/bóng phụ (`revStartProfileGroup.visible = false`, `revGhostGroup.visible = false`).
  - Đảm bảo trong suốt quá trình quay từ $0^\circ$ đến $360^\circ$, chỉ có duy nhất một tam giác vuông $SOB$ quay quanh trục $SO$.

---

### 2. Chặng 3 - Bước 1/3: Đường cắt quá nhỏ, chỉnh to lên và bằng nét đứt [ĐÃ HOÀN THÀNH ✓]
- **Đã xử lý:**
  - Tạo nhóm đối tượng 3D `coneCutLineGroup` riêng biệt với các ống rod nét đứt (`dashRod` bán kính chuẩn $0.024$) và đường nét đứt `THREE.LineDashedMaterial` màu hồng viền nổi bật kèm độ sâu 3D.
  - Gắn huy hiệu 3D `✂️ Đường cắt SB` tại trung điểm đường cắt ở Bước 1 Chặng 3 (khi $p < 0.15$), giúp học sinh quan sát rõ ràng đường kéo cắt trước khi khai triển phẳng sang 2D.

---

### 3. Chặng 5: Chưa rót xong, chưa rút ra kết luận thì KHÔNG hiện công thức thể tích hình nón [ĐÃ HOÀN THÀNH ✓]
- **Đã xử lý:**
  - Ở Bước 1 (Dự đoán) và Bước 2 (Đang thí nghiệm rót nước lần 1, lần 2): Ẩn công thức $V = \frac{1}{3}\pi r^2 h$, thay thế bằng huy hiệu ẩn số gợi mở: $V_{nón} = ?$ kèm chú thích *"Dự đoán & thí nghiệm rót 3 lần để khám phá công thức!"*.
  - Chỉ khi học sinh hoàn thành xong cả 3 lần rót nước (`currentPour === 3`) hoặc chuyển sang Bước 3/3 (Kết luận) thì huy hiệu công thức $V = \frac{1}{3}\pi r^2 h$ mới chính thức được mở khóa và hiển thị.

---

### 4. Bổ sung giọng nói thuyết minh & Tinh chỉnh đọc mượt mà, chậm rãi [ĐÃ HOÀN THÀNH ✓]
- **Đã xử lý:**
  - **Khắc phục lỗi đọc nhanh & chưa mượt:** Giảm tốc độ đọc từ 0.94x xuống **0.82x** (tốc độ sư phạm chậm rãi, ấm áp, rõ ràng từng thanh sắc/ngã/hỏi).
  - **Tùy chỉnh tốc độ:** Bổ sung nút bấm điều chỉnh tốc độ đọc ngay trong Menu Cài đặt: `0.82x (Chậm rõ)` ⇄ `0.90x (Vừa phải)` ⇄ `0.78x (Chậm rãi)`.
  - **Sửa triệt để các lỗi phát âm toán học (`cleanTextForSpeech`):**
    + Tách biệt đỉnh và tam giác bằng dấu phẩy: `S, O, B`, `S, O`, `O, B`, `S, B` loại bỏ hoàn toàn hiện tượng trình duyệt phát âm nhầm sang tiếng Anh ("sob", "so", "ob").
    + Phiên âm chuẩn các góc độ: `360°` -> "ba trăm sáu mươi độ", `180°` -> "một trăm tám mươi độ", `90°` -> "chín mươi độ", `0°` -> "không độ".
    + Phiên âm chuẩn các biến và công thức: "đường sinh l", "bán kính r", "chiều cao h", "l bình phương bằng r bình phương cộng h bình phương", "một phần ba", "ba chiều", "hai chiều".
  - **Khắc phục lỗi ngắt quãng trên Chromium/Edge:** Lưu giữ tham chiếu `_activeUtterance` ngăn V8 thu gom rác giữa chừng và bổ sung nhịp tim tự duy trì (heartbeat timer) chống đóng ngắt sau 14 giây.
  - **Tích hợp nút điều khiển:** Đấu nối nút loa trên thanh điều khiển bước `#lw-btn-speak` và nút `🔊 Nghe giảng / Dừng đọc` trên từng thẻ bài học của cả 7 chặng.

---

### 5. Rà soát toàn diện & Nâng cấp tương tác đa giác quan [ĐÃ HOÀN THÀNH ✓]
- **Đã xử lý:**
  - **Khắc phục triệt để luồng hiển thị nút nghe giảng:** Loại bỏ các câu lệnh `return` sớm trong `renderGuidedCard()`, đảm bảo nút bấm `🔊 Nghe giảng / Dừng đọc` (`.btn-step-speak`) luôn luôn hiển thị trên thanh tiêu đề của tất cả thẻ bài học (từ Chặng 1 đến Chặng 7).
  - **Giọng nói phản hồi tương tác bài tập (Interactive Voice Feedback):** Khi học sinh chọn đáp án trong các câu hỏi trắc nghiệm (`handleAnswerEvaluation`), hệ thống tự động đọc lời khen và giải thích cặn kẽ khi đúng (*"Chính xác! [giải thích]"*), hoặc hướng dẫn gợi ý khi chọn sai (*"Chưa đúng, em hãy quan sát kỹ mô hình..."*).
  - **Thuyết minh xác nhận dự đoán:** Khi học sinh đưa ra dự đoán ở các Chặng 2, 3, 5 (`makePrediction`), giọng nói lập tức phản hồi và cổ vũ học sinh cùng làm thí nghiệm kiểm chứng.
  - **Bổ sung phím tắt `V`:** Hỗ trợ giáo viên và học sinh nhấn phím `V` trên bàn phím để nghe giảng hoặc tạm dừng giọng đọc ngay lập tức mà không cần di chuột.
  - **Kiểm thử hệ thống:** Đã kiểm tra biên dịch (`compile_applet`) và TypeScript linter (`lint_applet`) đạt 100% không lỗi.

---

### 6. Bổ sung giọng nói ở tất cả các phần & hoạt động tương tác [ĐÃ HOÀN THÀNH ✓]
- **Đã xử lý:**
  - **Thuyết minh 6 Chế độ quan sát tự do (Sidebar Mode Panels):**
    + Chế độ Cấu tạo (`structure`): Nút `🔊 Nghe giảng` thuyết minh đỉnh S, đáy tâm O, chiều cao h, bán kính r, đường sinh l, và hệ thức Pythagore $l^2 = r^2 + h^2$.
    + Chế độ Thể tích & Đổ nước (`volume`): Nút `🔊 Nghe giảng` thuyết minh dung tích, tỉ lệ 1/3, và thí nghiệm 3 lần rót nước. Đồng thời hệ thống tự động phát âm thanh hướng dẫn sau mỗi lần đổ 1, 2, 3.
    + Chế độ Khai triển (`net`): Nút `🔊 Nghe giảng` thuyết minh quá trình trải phẳng mặt xung quanh thành hình quạt tròn bán kính l và cung $2\pi r$.
    + Chế độ Quay tạo khối (`revolution`): Nút `🔊 Nghe giảng` thuyết minh tam giác vuông SOB quay quanh trục SO $360^\circ$.
    + Chế độ Mặt cắt (`section`): Nút `🔊 Nghe giảng` thuyết minh mặt cắt ngang đáy, mặt cắt qua trục tam giác cân, và định lý tam giác đồng dạng.
    + Chế độ So sánh (`compare`): Nút `🔊 Nghe giảng` thuyết minh so sánh trực quan và tỉ lệ 1:3 giữa hình nón và hình trụ.
    + Chế độ Đấu trường (`challenge`): Nút `🔊 Nghe giảng` giới thiệu đấu trường kiến thức.
  - **Giọng đọc trong các Modal & Tiện ích tương tác:**
    + **Câu hỏi thảo luận học sinh (`student-question-modal`):** Bổ sung nút `🔊 Đọc câu hỏi` và tự động đọc đáp án khi mở thẻ đáp án hoặc bấm `🔊 Đọc đáp án`.
    + **Đấu trường trắc nghiệm 5 câu (`challenge-content-card`):** Bổ sung nút `🔊 Đọc` để đọc to câu hỏi và 4 phương án A, B, C, D; kèm giọng nói chấm điểm đúng/sai và đọc lời giải thích tức thời.
    + **Toán thực tế (`real-world-modal`):** Bổ sung nút `🔊 Nghe đọc` đọc to đề bài, dữ liệu kích thước, phép tính và ứng dụng kỹ thuật cho từng mô hình: Lon nước ngọt, Nón sinh nhật, Phễu thí nghiệm, Tháp xi-lô thóc.
    + **Lắp ghép công thức (`formula-builder-modal`):** Bổ sung nút `🔊 Đọc nhiệm vụ` và giọng nói thuyết minh kết quả kiểm tra công thức đúng/sai kèm lời giải.
    + **Nhận diện trực tiếp trên 3D (`click-3d-banner`):** Giọng nói đọc hướng dẫn chỉ điểm ("Hãy nhấp chuột vào đường sinh l..."), phản hồi khen thưởng hoặc gợi ý khi nhấp trúng/sai đối tượng 3D.
    + **Gắn nhãn cấu tạo 3D (`drag-labels-modal`):** Bổ sung nút `🔊 Hướng dẫn`, đọc tên nhãn khi nhấp chọn và lời chúc mừng khi hoàn thành 100%.
    + **Thước đo 3D trực tiếp (`measure-overlay`):** Bổ sung nút `🔊 Đọc` kết quả đo chiều cao h, bán kính r, đường sinh l, đường kính 2r.
    + **Bảng so sánh công thức (`formula-compare-modal`):** Bổ sung nút `🔊 Nghe tóm tắt` đọc tổng kết toàn bộ các công thức toán học giữa nón và trụ.
    + **Nhật ký khám phá (`diary-modal`):** Bổ sung nút `🔊 Nghe tóm tắt` toàn bộ nhật ký và nút `🔊 Nghe đọc` riêng cho từng định lý đã mở khóa.
  - **Kiểm thử chất lượng:** Toàn bộ bản dựng TypeScript đạt chuẩn, không có lỗi linter, dev server hoạt động ổn định.
