// js/slider.js — Tính năng 6: slider cảm nhận, TỰ VIẾT, không dùng thư viện.
//
// Phần tử: #slider-camnhan, [data-slider-track], [data-slide],
// [data-slider-dots] (rỗng — chấm do JS sinh), [data-slider-prev]/[data-slider-next].
//
// Ý tưởng: xếp slide thành dải ngang rồi dịch cả dải bằng
//   track.style.transform = `translateX(-${index * 100}%)`

const TU_CHAY = 6000; // ms — thời gian giữa hai lần tự chuyển slide (6 giây)

export function initSlider() {
  const root = document.getElementById("slider-camnhan");
  if (!root) return;

  const track = root.querySelector("[data-slider-track]");
  const slides = [...root.querySelectorAll("[data-slide]")];
  const dotsBox = root.querySelector("[data-slider-dots]");
  const prev = root.querySelector("[data-slider-prev]");
  const next = root.querySelector("[data-slider-next]");
  if (!track || slides.length === 0) return;

  let index = 0;
  let timer = null;

  // Sinh chấm chỉ dẫn BẰNG JAVASCRIPT từ số slide thật — thêm slide
  // không cần phải sửa HTML ở hai chỗ khác nhau.
  const dots = [];
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "slider-dot";
    dot.setAttribute("aria-label", `Xem cảm nhận ${i + 1} trên ${slides.length}`);
    dot.addEventListener("click", () => {
      go(i);
      restart();
    });
    if (dotsBox) dotsBox.appendChild(dot);
    dots.push(dot);
  });

  function go(next_) {
    // Thuật toán vòng lặp cả hai chiều không cần if: -1 + length = slide cuối
    index = (next_ + slides.length) % slides.length;

    track.style.transform = `translateX(-${index * 100}%)`;

    // Slide ẩn phải có inert và aria-hidden để người dùng bàn phím không bị lạc
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.toggleAttribute("inert", !active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    dots.forEach((dot, i) => {
      dot.setAttribute("aria-current", String(i === index));
    });
  }

  function start() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    stop(); // LUÔN dừng interval cũ trước khi tạo interval mới
    timer = setInterval(() => go(index + 1), TU_CHAY);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function restart() {
    stop();
    start();
  }

  prev?.addEventListener("click", () => {
    go(index - 1);
    restart();
  });

  next?.addEventListener("click", () => {
    go(index + 1);
    restart();
  });

  // Điều hướng bằng bàn phím khi tiêu điểm nằm trong slider
  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
      restart();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
      restart();
    }
  });

  // Tự chạy nhưng tạm dừng khi người dùng đang đọc / tương tác
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  go(0);
  start();
}