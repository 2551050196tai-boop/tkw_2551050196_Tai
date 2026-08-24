<<<<<<< HEAD
export function initNav() {
  const toggle = document.querySelector('[aria-controls="nav-mobile"]');
  const menu = document.getElementById("nav-mobile");
  const header = document.getElementById("site-header");
  if (!toggle || !menu || !header) return;

=======
// js/nav.js — Tính năng 1 (menu mobile), Tính năng 2 (navbar khi cuộn),
//             và bài khởi động (nút lên đầu trang).
//
// Phần tử có sẵn trong HTML:
//   nút mở menu   : <button aria-expanded="false" aria-controls="nav-mobile">
//   khối menu     : #nav-mobile        (class "hidden")
//   mốc cuộn      : #nav-sentinel      (thẻ rỗng cao 1px, đầu <body>)
//   nút lên đầu   : #nut-len-dau       (CSS hiện khi có class "is-visible")

/* ------------------------------------------------------------------ */
/* Tính năng 1 — Menu mobile                                          */
/* ------------------------------------------------------------------ */
export function initNav() {
  const toggle = document.querySelector('[aria-controls="nav-mobile"]');
  const menu = document.getElementById("nav-mobile");
  const header = document.querySelector("header") || document.getElementById("site-header");
  if (!toggle || !menu) return; // trang không có menu thì thoát êm

  // MỘT hàm duy nhất chịu trách nhiệm đổi trạng thái menu
>>>>>>> f3748ce (buoi-4)
  function setOpen(open) {
    menu.classList.toggle("hidden", !open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
    document.body.classList.toggle("overflow-hidden", open);
  }
<<<<<<< HEAD
  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";
  toggle.addEventListener("click", () => setOpen(!isOpen()));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) { setOpen(false); toggle.focus(); }
  });
  document.addEventListener("click", (event) => {
    if (isOpen() && !header.contains(event.target)) setOpen(false);
  });
  window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

export function initHeaderOnScroll() {
  const header = document.getElementById("site-header");
  const sentinel = document.getElementById("nav-sentinel");
  if (!header || !sentinel || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(([entry]) => header.classList.toggle("shadow-sm", !entry.isIntersecting));
  observer.observe(sentinel);
}
=======

  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

  // Bấm nút hamburger để bật / tắt menu
  toggle.addEventListener("click", () => setOpen(!isOpen()));

  // 3 cách đóng menu:
  // a. Phím ESC: đóng menu và trả tiêu điểm về nút toggle
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  // b. Bấm ra ngoài vùng header
  document.addEventListener("click", (event) => {
    if (isOpen() && header && !header.contains(event.target)) {
      setOpen(false);
    }
  });

  // c. Màn hình phóng to lên tablet/desktop thì tự đóng
  const mq = window.matchMedia("(min-width: 768px)");
  mq.addEventListener("change", (event) => {
    if (event.matches && isOpen()) {
      setOpen(false);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Tính năng 2 — Navbar đổi trạng thái khi cuộn                       */
/* ------------------------------------------------------------------ */
export function initHeaderOnScroll() {
  const header = document.querySelector("header") || document.getElementById("site-header");
  const sentinel = document.getElementById("nav-sentinel");
  if (!header || !sentinel || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(([entry]) => {
    const isScrolled = !entry.isIntersecting;
    header.classList.toggle("shadow-sm", isScrolled);
    header.classList.toggle("is-scrolled", isScrolled);
  });
  observer.observe(sentinel);
}

/* ------------------------------------------------------------------ */
/* Bài khởi động — Nút "Lên đầu trang" (hiện sau khi cuộn quá 400px)  */
/* ------------------------------------------------------------------ */
export function initToTop() {
  const btn = document.getElementById("nut-len-dau");
  const sentinel = document.getElementById("nav-sentinel");
  if (!btn || !sentinel || !("IntersectionObserver" in window)) return;

  // rootMargin 400px: nới vùng quan sát lên 400px, sentinel trôi khỏi màn hình
  // sau khi đã cuộn qua 400px
  const observer = new IntersectionObserver(
    ([entry]) => {
      btn.classList.toggle("is-visible", !entry.isIntersecting);
    },
    { rootMargin: "400px 0px 0px 0px" }
  );
  observer.observe(sentinel);

  btn.addEventListener("click", () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });

    // Trả tiêu điểm về đầu trang cho người dùng bàn phím
    const main = document.querySelector("main") || document.getElementById("main");
    if (main) {
      main.tabIndex = -1;
      main.focus({ preventScroll: true });
    }
  });
}
>>>>>>> f3748ce (buoi-4)
