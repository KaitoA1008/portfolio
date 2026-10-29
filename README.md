# Portfolio — Quang Anh

Bản portfolio đang dùng, chạy local tại <http://127.0.0.1:4174>. Chưa deploy.

## Chạy

```powershell
cd D:\code\profile\sites\quang-anh-portfolio-dark
node src\build.cjs
node serve.cjs
```

## Chỉnh sửa

- `src/content.cjs`: nội dung 4 dự án; `src/skills.json`: danh sách công nghệ.
- `src/build.cjs`: nội dung trang chính và tạo 4 trang case study.
- `src/styles.css`, `src/app.js`, `src/stage.js`, `src/modal.js`, `src/loader.js`: giao diện và tương tác.
- `public/assets/`: ảnh WebP và logo được build chép vào `dist/assets/`.
- `assets-source/`: ảnh gốc để tạo lại WebP; không được server phục vụ.
- `dist/`: kết quả build; sửa trong `src/` rồi build lại.

Chỉ khi thay ảnh gốc, chạy bước chuyển ảnh (Python có Pillow):

```powershell
D:\code\profile\products\.venv\Scripts\python.exe tools\prepare-assets.py
node src\build.cjs
```

Portfolio tự chứa toàn bộ nội dung và ảnh cần thiết, không phụ thuộc bản portfolio cũ.
Nguồn ảnh: ảnh chân dung do chủ hồ sơ cung cấp, bản tách nền giữ nguyên nhân dạng;
VinGrade và Englow3 là ảnh trang landing tiếng Anh từ dự án local;
LedgerLens và RelayDesk là ảnh ứng dụng với dữ liệu demo tổng hợp.
Nguồn và giấy phép logo nằm trong `public/assets/skills/`.
