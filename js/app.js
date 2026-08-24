// js/app.js — Script chạy độc lập (hỗ trợ cả khi mở trực tiếp qua file:// và HTTP/Live Server)
(function () {
  if (window.__APP_LOADED__) return;
  window.__APP_LOADED__ = true;
  window.__MAIN_JS_LOADED__ = true;

  /* ------------------------------------------------------------------ */
  /* Tính năng 5 — Công tắc giá Tháng / Năm (Tiết kiệm 20%)             */
  /* ------------------------------------------------------------------ */
  function initPricing() {
    const sw = document.getElementById("cong-tac-gia");
    if (!sw) return;

    const prices = [...document.querySelectorAll("[data-price]")];
    const units = [...document.querySelectorAll("[data-price-unit]")];
    if (prices.length === 0) return;

    const labelMonthly = document.getElementById("nhan-thang");
    const labelYearly = document.getElementById("nhan-nam");
    const MONTHS_PER_YEAR = 12;
    const YEARLY_DISCOUNT = 0.2;

    const dong = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });

    function render(yearly) {
      sw.setAttribute("aria-checked", String(yearly));

      if (labelMonthly) {
        labelMonthly.classList.toggle("text-ink", !yearly);
        labelMonthly.classList.toggle("font-bold", !yearly);
        labelMonthly.classList.toggle("text-muted", yearly);
      }
      if (labelYearly) {
        labelYearly.classList.toggle("text-ink", yearly);
        labelYearly.classList.toggle("font-bold", yearly);
        labelYearly.classList.toggle("text-muted", !yearly);
      }

      prices.forEach((el) => {
        const monthlyPrice = Number(el.dataset.monthly);
        const value = yearly
          ? Math.round(monthlyPrice * MONTHS_PER_YEAR * (1 - YEARLY_DISCOUNT))
          : monthlyPrice;

        if (!Number.isFinite(value) || value <= 0) {
          el.textContent = "Miễn phí";
        } else {
          el.textContent = dong.format(value);
        }
      });

      units.forEach((el) => {
        el.textContent = yearly ? "/năm" : "/tháng";
      });
    }

    // Vẽ ban đầu
    render(sw.getAttribute("aria-checked") === "true");

    sw.addEventListener("click", function (e) {
      e.preventDefault();
      render(sw.getAttribute("aria-checked") !== "true");
    });

    if (labelMonthly) {
      labelMonthly.style.cursor = "pointer";
      labelMonthly.addEventListener("click", function () {
        render(false);
      });
    }

    if (labelYearly) {
      labelYearly.style.cursor = "pointer";
      labelYearly.addEventListener("click", function () {
        render(true);
      });
    }

    sw.addEventListener("keydown", function (event) {
      if (event.key === " " || event.key === "Spacebar" || event.key === "Enter") {
        event.preventDefault();
        render(sw.getAttribute("aria-checked") !== "true");
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Tính năng 1, 2, Khởi động — Menu mobile, Navbar cuộn & Lên đầu   */
  /* ------------------------------------------------------------------ */
  function initNav() {
    const toggle = document.querySelector('[aria-controls="nav-mobile"]');
    const menu = document.getElementById("nav-mobile");
    const header = document.querySelector("header") || document.getElementById("site-header");
    if (!toggle || !menu) return;

    function setOpen(open) {
      menu.classList.toggle("hidden", !open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
      document.body.classList.toggle("overflow-hidden", open);
    }

    const isOpen = () => toggle.getAttribute("aria-expanded") === "true";
    toggle.addEventListener("click", () => setOpen(!isOpen()));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (isOpen() && header && !header.contains(event.target)) {
        setOpen(false);
      }
    });

    const mq = window.matchMedia("(min-width: 768px)");
    if (mq && mq.addEventListener) {
      mq.addEventListener("change", (event) => {
        if (event.matches && isOpen()) setOpen(false);
      });
    }
  }

  function initHeaderOnScroll() {
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

  function initToTop() {
    const btn = document.getElementById("nut-len-dau");
    const sentinel = document.getElementById("nav-sentinel");
    if (!btn || !sentinel || !("IntersectionObserver" in window)) return;

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
      const main = document.querySelector("main") || document.getElementById("main");
      if (main) {
        main.tabIndex = -1;
        main.focus({ preventScroll: true });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Tính năng 4 — Chế độ Sáng / Tối (Theme Mode)                       */
  /* ------------------------------------------------------------------ */
  function initTheme() {
    window.__THEME_INIT__ = true;
    const btn = document.getElementById("nut-nen-toi");
    if (!btn) return;
    const root = document.documentElement;
    const isDark = () => root.classList.contains("dark");

    function sync() {
      const darkNow = isDark();
      btn.setAttribute("aria-pressed", String(darkNow));
      btn.setAttribute("aria-label", darkNow ? "Chuyển sang nền sáng" : "Chuyển sang nền tối");
    }
    sync();

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const darkNow = root.classList.toggle("dark");
      try { localStorage.setItem("theme", darkNow ? "dark" : "light"); } catch (err) {}
      sync();
    });

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq && mq.addEventListener) {
      mq.addEventListener("change", (event) => {
        if (localStorage.getItem("theme")) return;
        root.classList.toggle("dark", event.matches);
        sync();
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Tính năng 3 — Accordion FAQ                                        */
  /* ------------------------------------------------------------------ */
  function initFaq() {
    const root = document.getElementById("cau-hoi");
    if (!root) return;
    const triggers = [...root.querySelectorAll("[data-faq-trigger]")];
    if (triggers.length === 0) return;

    function setOpen(trigger, open) {
      trigger.setAttribute("aria-expanded", String(open));
      const panel = document.getElementById(trigger.getAttribute("aria-controls"));
      if (panel) panel.hidden = !open;
    }

    root.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-faq-trigger]");
      if (!trigger) return;
      const willOpen = trigger.getAttribute("aria-expanded") !== "true";
      triggers.forEach((t) => setOpen(t, false));
      if (willOpen) setOpen(trigger, true);
    });

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

    triggers.forEach((t) => setOpen(t, false));
  }

  /* ------------------------------------------------------------------ */
  /* Tính năng 6 — Slider cảm nhận khách hàng                          */
  /* ------------------------------------------------------------------ */
  function initSlider() {
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

    if (dotsBox) dotsBox.innerHTML = "";
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
      index = (next_ + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
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
      stop();
      timer = setInterval(() => go(index + 1), 6000);
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    function restart() {
      stop();
      start();
    }

    if (prev) prev.addEventListener("click", () => { go(index - 1); restart(); });
    if (next) next.addEventListener("click", () => { go(index + 1); restart(); });

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

  /* ------------------------------------------------------------------ */
  /* Tính năng 7 — Hiệu ứng lộ dần khi cuộn                            */
  /* ------------------------------------------------------------------ */
  function initReveal() {
    const items = [...document.querySelectorAll("[data-reveal]")];
    if (items.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px 50px 0px" }
    );

    items.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("is-visible");
      } else {
        observer.observe(el);
      }
    });
  }

  function startAll() {
    try { initNav(); } catch (e) { console.error("initNav error:", e); }
    try { initHeaderOnScroll(); } catch (e) { console.error("initHeaderOnScroll error:", e); }
    try { initToTop(); } catch (e) { console.error("initToTop error:", e); }
    try { initTheme(); } catch (e) { console.error("initTheme error:", e); }
    try { initFaq(); } catch (e) { console.error("initFaq error:", e); }
    try { initPricing(); } catch (e) { console.error("initPricing error:", e); }
    try { initSlider(); } catch (e) { console.error("initSlider error:", e); }
    try { initReveal(); } catch (e) { console.error("initReveal error:", e); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAll);
  } else {
    startAll();
  }
})();
