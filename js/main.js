<<<<<<< HEAD
import { initHeaderOnScroll, initNav } from "./nav.js";
initNav();
initHeaderOnScroll();
=======
// js/main.js — điểm khởi động DUY NHẤT cho tất cả các trang khi dùng ES Module.
import { initHeaderOnScroll, initNav, initToTop } from "./nav.js";
import { initTheme } from "./theme.js";
import { initFaq } from "./faq.js";
import { initPricing } from "./pricing.js";
import { initSlider } from "./slider.js";
import { initReveal } from "./reveal.js";

window.__MAIN_JS_LOADED__ = true;

if (!window.__APP_LOADED__) {
  // Khởi tạo an toàn cho từng module nếu chưa chạy qua app.js
  try { initNav(); } catch (e) { console.error("initNav error:", e); }
  try { initHeaderOnScroll(); } catch (e) { console.error("initHeaderOnScroll error:", e); }
  try { initToTop(); } catch (e) { console.error("initToTop error:", e); }
  try { initTheme(); } catch (e) { console.error("initTheme error:", e); }
  try { initFaq(); } catch (e) { console.error("initFaq error:", e); }
  try { initPricing(); } catch (e) { console.error("initPricing error:", e); }
  try { initSlider(); } catch (e) { console.error("initSlider error:", e); }
  try { initReveal(); } catch (e) { console.error("initReveal error:", e); }
}
>>>>>>> f3748ce (buoi-4)
