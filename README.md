# Landwind — Phần mềm Quản lý Bán hàng

Môn **Thực hành Thiết kế Web** · Trường Đại Học Mở TPHCM, Khoa CNTT  
Mã sinh viên: **2551050196** · Họ và tên: **Tài**

---

## 1. Thông tin Design Token & Giao diện

| Vai trò | Giá trị trong Figma | Tên token | Class Tailwind |
|---|---|---|---|
| Màu thương hiệu chính | `#0000ff` | `--color-brand-600` | `bg-brand-600` / `text-brand-600` |
| Màu nhấn | `#5672ff` | `--color-accent-500` | `text-accent-500` / `bg-accent-500` |
| Chữ chính | `#0c11ff` / `#eaf2ee` (dark) | `--color-ink` | `text-ink` |
| Chữ phụ | `#5672ff` / `#9db4ff` (dark) | `--color-muted` | `text-muted` |
| Nền trang | `#ffffff` / `#0e1c19` (dark) | `--color-surface` | `bg-surface` |
| Nền phụ | `#f1f5ff` / `#1a2f2a` (dark) | `--color-surface-alt` | `bg-surface-alt` |
| Viền | `#d5e2ff` / `#24403a` (dark) | `--color-line` | `border-line` |
| Phông tiêu đề | Plus Jakarta Sans | `--font-display` | `font-display` |
| Phông nội dung | Inter | `--font-body` | `font-body` |
| Bo góc thẻ | 24px | `--radius-card` | `rounded-card` |

### Các Breakpoints Responsive:
- **sm**: 640px (Điện thoại xoay ngang / màn hình nhỏ)
- **md**: 768px (Máy tính bảng / tablet)
- **lg**: 1024px (Laptop / máy tính xách tay)
- **xl**: 1280px (Desktop / màn hình lớn)
- **2xl**: 1536px (Màn hình siêu lớn)

---

## 2. Cấu trúc các trang web trong dự án

1. `index.html`: Trang chủ Landing Page giới thiệu giải pháp, tính năng, slider cảm nhận, thống kê, bảng giá, FAQ và CTA.
2. `pricing.html` / `price.html`: Trang bảng giá chi tiết 3 gói dịch vụ, công tắc tháng/năm, bảng đối chiếu tính năng và FAQ thanh toán.
3. `contact.html`: Trang liên hệ tư vấn với form đăng ký chuẩn WCAG & HTML5 validation, hotline, văn phòng và quy trình 3 bước.
4. `product.html`: Trang chi tiết về các tính năng phần mềm.
5. `documents.html`: Trung tâm hỗ trợ và tài liệu hướng dẫn sử dụng.

---

## 3. Bảy tính năng tương tác JavaScript (Buổi 4)

1. **Menu Mobile (`js/nav.js`)**: Nút mở menu toggle `[aria-controls="nav-mobile"]`, khóa cuộn trang, tự động đóng khi nhấn phím Escape, click ra ngoài hoặc đổi kích thước màn hình.
2. **Navbar khi cuộn (`js/nav.js`)**: Sử dụng `IntersectionObserver` theo dõi `#nav-sentinel` để bật hiệu ứng đổ bóng `shadow-sm` khi cuộn trang.
3. **Nút Lên đầu trang (`js/nav.js`)**: Nút `#nut-len-dau` tự động hiện khi cuộn qua 400px (`rootMargin`), cuộn mượt và trả tiêu điểm về `main`.
4. **Accordion FAQ (`js/faq.js`)**: Đóng mở câu hỏi theo cơ chế single-open, xoay icon mượt mà, hỗ trợ phím mũi tên Lên/Xuống.
5. **Chế độ Sáng / Tối Dark Mode (`js/theme.js`)**: Script inline trong `<head>` chống nháy trắng (FOUC), chuyển theme mượt mà, lưu `localStorage`, hỗ trợ `prefers-color-scheme`.
6. **Công tắc giá Tháng / Năm (`js/pricing.js`)**: Switch role switch, định dạng tiền tệ `Intl.NumberFormat` tiếng Việt, hỗ trợ phím Space.
7. **Slider cảm nhận khách hàng (`js/slider.js`)**: Tự sinh chấm tròn phân trang, chuyển động mượt mà, tự động chạy 6s, tạm dừng khi hover/focus/đổi tab, điều hướng phím mũi tên.
8. **Hiệu ứng lộ dần khi cuộn (`js/reveal.js`)**: `IntersectionObserver` tự động gắn `is-visible` khi lướt tới các section.

---

## 4. Hướng dẫn chạy dự án

```bash
npm install
npm run dev
```

Mở bất kỳ file HTML nào bằng **Live Server** trong VS Code để xem và trải nghiệm đầy đủ các tính năng.
