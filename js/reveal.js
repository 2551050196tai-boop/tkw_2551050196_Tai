// js/reveal.js — Tính năng 7: hiệu ứng lộ dần khi cuộn tới.
// Việc của file này chỉ là gắn class "is-visible" đúng lúc.
// CSS: .js [data-reveal] ẩn · .js [data-reveal].is-visible hiện.

export function initReveal() {
  const items = [...document.querySelectorAll("[data-reveal]")];
  if (items.length === 0) return;

  // Tôn trọng người dùng: nếu bật "giảm chuyển động" hoặc không có IntersectionObserver thì hiện luôn
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // hiện rồi thì không theo dõi nữa
        }
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px 50px 0px" }
  );

  items.forEach((el) => {
    // Nếu phần tử đang ở trong màn hình ngay khi tải trang thì hiện luôn
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add("is-visible");
    } else {
      observer.observe(el);
    }
  });
}