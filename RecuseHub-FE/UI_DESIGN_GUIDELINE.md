# UI Design Guideline - RescueHub

## 📋 Quy Tắc Thiết Kế Giao Diện

Tài liệu này định nghĩa các tiêu chuẩn thiết kế để team tuân thủ, đảm bảo sự nhất quán trong color scheme và typography trên toàn bộ ứng dụng.

---

## 🎨 Màu Sắc Chính (Primary Colors)

### Màu Chính (Primary Blue)

- **CSS Variable**: `var(--color-blue-950)`
- **Hex Value**: `#001f3f` (Dark Navy Blue)
- **Tailwind Class**: `bg-blue-950`, `text-blue-950`
- **Sử dụng cho**: Header, footer, button chính, border, text quan trọng

### Thay Thế Màu Cũ

- **Cũ**: `--color-primary: #006481` (Cyan xanh)
- **Mới**: `--color-blue-950: #001f3f` (Navy Blue đậm)

### Các Màu Hỗ Trợ

- **Cyan/Highlight**: `#17a2b8` - Dùng cho nút khẩn cấp, hover effects
- **Error/Warning**: `#dc3545` - Dùng cho cảnh báo, danger states
- **Success**: `#28a745` - Dùng cho trạng thái hoàn tất
- **Background**: `#f8f9fa` - Màu nền chính

---

## 🔤 Typography (Font Chữ)

### Font Chính

- **Tên Font**: `SiemensSans`
- **CSS Variable**: `--font-primary: "SiemensSans", sans-serif`
- **Sử dụng cho**: Tất cả heading, button text, navigation

### Font Phụ

- **Tên Font**: `Inter`
- **CSS Variable**: `--font-sans: "Inter", sans-serif`
- **Sử dụng cho**: Body text, description, paragraphs

### Font Cũ

- **Headline**: `Manrope` - ❌ KHÔNG SỬ DỤNG (thay thế bằng SiemensSans)
- **Sans**: `Inter` - ✅ Giữ lại cho body text

---

## 📐 Công Thức Áp Dụng

### Khi Thêm Màu Sắc

```jsx
// ❌ KHÔNG - Sử dụng màu hardcoded
style={{ backgroundColor: '#006481' }}
className="bg-cyan-500"

// ✅ ĐÚNG - Sử dụng CSS Variable
style={{ backgroundColor: 'var(--color-blue-950)' }}
className="bg-blue-950"
style={{ color: 'var(--color-blue-950)' }}
```

### Khi Thêm Font Chữ

```jsx
// ❌ KHÔNG - Sử dụng font hardcoded
style={{ fontFamily: 'Arial, sans-serif' }}

// ✅ ĐÚNG - Sử dụng CSS Variable
style={{ fontFamily: 'var(--font-primary)' }}
className="font-primary" // Nếu được định nghĩa trong Tailwind
```

---

## 🎯 Component Styling Guidelines

### Header/Navigation

- **Background**: `var(--color-blue-950)` (#001f3f)
- **Text Color**: `#ffffff` (White)
- **Font**: `var(--font-primary)` (SiemensSans)
- **Example**:
  ```jsx
  <nav style={{
    backgroundColor: 'var(--color-blue-950)',
    color: '#ffffff',
    fontFamily: 'var(--font-primary)'
  }}>
  ```

### Buttons (Primary)

- **Background**: `var(--color-blue-950)`
- **Hover Background**: `#003d5c` (Darker shade)
- **Text Color**: `#ffffff`
- **Font**: `var(--font-primary)`

### Buttons (Secondary/Action)

- **Background**: `#17a2b8` (Cyan)
- **Hover Background**: `#138496`
- **Text Color**: `#ffffff`

### Text (Heading)

- **Color**: `var(--color-blue-950)` hoặc `#ffffff` (tùy background)
- **Font**: `var(--font-primary)` (SiemensSans)
- **Font Weight**: Bold, Extra Bold

### Text (Body)

- **Color**: `#333333` hoặc `#6c757d` (gray)
- **Font**: `var(--font-sans)` (Inter)
- **Font Weight**: Regular, Medium

---

## ✅ Checklist Trước Khi Commit

- [ ] Tất cả hardcoded colors đã được thay thế bằng CSS variables
- [ ] Font chữ chính sử dụng `SiemensSans` (không phải Manrope)
- [ ] Màu chính là `--color-blue-950` thay vì `--color-primary`
- [ ] Header/Navigation sử dụng màu blue-950
- [ ] Tất cả text dùng font đúng (SiemensSans hoặc Inter)
- [ ] Kiểm tra consistency trên mobile và desktop
- [ ] Không có inline style với color/font hardcoded

---

## 🔄 Migration Guide (Từ Design Cũ)

### Font Manrope → SiemensSans

```jsx
// Cũ
style={{ fontFamily: '"Manrope", sans-serif' }}

// Mới
style={{ fontFamily: 'var(--font-primary)' }}
// hoặc
style={{ fontFamily: '"SiemensSans", sans-serif' }}
```

### Màu Primary (#006481) → Blue-950 (#001f3f)

```jsx
// Cũ
className="text-primary"
style={{ color: 'var(--color-primary)' }}

// Mới
className="text-blue-950"
style={{ color: 'var(--color-blue-950)' }}
```

---

## 📝 Ghi Chú

- Tài liệu này được cập nhật ngày **13/04/2026**
- Tất cả component mới phải tuân thủ guideline này
- Team lead sẽ review code theo guideline này
- Nếu có ngoại lệ, phải có discussion với team lead trước
- Luôn luôn là tiếng việt có dấu

---

**Liên Hệ**: Team Lead khi có thắc mắc về design guidelines
