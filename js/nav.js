export function initNav() {
  const toggle = document.querySelector('[aria-controls="nav-mobile"]');
  const menu = document.getElementById("nav-mobile");
  const header = document.getElementById("site-header");
  if (!toggle || !menu || !header) return;

  function setOpen(open) {
    menu.classList.toggle("hidden", !open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
    document.body.classList.toggle("overflow-hidden", open);
  }
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
