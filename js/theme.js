// js/theme.js — Tính năng 4: công tắc nền sáng / nền tối (Dark Mode / Light Mode).
//
// Việc BẬT nền tối lúc tải trang nằm ở script inline trong <head> (chống nháy trắng).
// File này xử lý khi người dùng BẤM NÚT ĐỂ ĐỔI và lưu lựa chọn vào localStorage.

const KEY = "theme";

export function initTheme() {
  window.__THEME_INIT__ = true;
  const btn = document.getElementById("nut-nen-toi");
  if (!btn) return;

  const root = document.documentElement;
  const isDark = () => root.classList.contains("dark");

  // Đồng bộ nhãn và trạng thái trợ năng cho nút
  function sync() {
    const darkNow = isDark();
    btn.setAttribute("aria-pressed", String(darkNow));
    btn.setAttribute("aria-label", darkNow ? "Chuyển sang nền sáng" : "Chuyển sang nền tối");
  }

  sync(); // Đồng bộ ngay lúc tải trang

  // Khi người dùng bấm nút: đổi qua lại giữa Light mode và Dark mode
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const darkNow = root.classList.toggle("dark");
    try {
      localStorage.setItem(KEY, darkNow ? "dark" : "light");
    } catch (err) {}
    sync();
  });

  // Tự động chuyển theo hệ điều hành nếu người dùng chưa từng tự chọn thủ công
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = (event) => {
    if (localStorage.getItem(KEY)) return;
    root.classList.toggle("dark", event.matches);
    sync();
  };

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onSystemChange);
  }
}