// js/faq.js — Tính năng 3: accordion câu hỏi thường gặp.
//
// Phần tử: khu vực #cau-hoi, nút <button data-faq-trigger
// aria-expanded aria-controls="faq-p1">, khối đáp <div id="faq-p1" hidden>.

export function initFaq() {
  const root = document.getElementById("cau-hoi");
  if (!root) return;

  const triggers = [...root.querySelectorAll("[data-faq-trigger]")];
  if (triggers.length === 0) return;

  // Hàm DUY NHẤT đổi trạng thái một mục — ARIA và hidden luôn đi cùng nhau
  function setOpen(trigger, open) {
    trigger.setAttribute("aria-expanded", String(open));
    const panel = document.getElementById(trigger.getAttribute("aria-controls"));
    if (panel) panel.hidden = !open;
  }

  // Event delegation trên cả nhóm: closest() để bấm trúng icon <svg> vẫn chạy đúng
  root.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-faq-trigger]");
    if (!trigger) return;
    const willOpen = trigger.getAttribute("aria-expanded") !== "true";
    triggers.forEach((t) => setOpen(t, false)); // đóng hết
    if (willOpen) setOpen(trigger, true);       // mở lại đúng cái vừa bấm
  });

  // Mở rộng: phím mũi tên Lên/Xuống di chuyển tiêu điểm giữa các câu hỏi
  root.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const current = document.activeElement;
    const idx = triggers.indexOf(current);
    if (idx === -1) return;
    event.preventDefault();
    const next =
      event.key === "ArrowDown"
        ? triggers[(idx + 1) % triggers.length]
        : triggers[(idx - 1 + triggers.length) % triggers.length];
    next.focus();
  });

  // Trạng thái ban đầu: đóng hết — JS là nguồn sự thật duy nhất
  triggers.forEach((t) => setOpen(t, false));
}