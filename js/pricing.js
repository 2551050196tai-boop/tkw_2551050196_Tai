// js/pricing.js — Tính năng 5: công tắc giá Tháng / Năm.
//
// Phần tử: #cong-tac-gia (role="switch" aria-checked), [data-price] có
// data-monthly, [data-price-unit]. Giá năm được tính tự động từ giá tháng
// với mức giảm 20%, nên chỉ cần cập nhật giá tháng trong HTML.

const MONTHS_PER_YEAR = 12;
const YEARLY_DISCOUNT = 0.2;

// Intl.NumberFormat định dạng tiền tệ VND chuẩn
const dong = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function initPricing() {
  const sw = document.getElementById("cong-tac-gia");
  if (!sw) return;

  const prices = [...document.querySelectorAll("[data-price]")];
  const units = [...document.querySelectorAll("[data-price-unit]")];
  if (prices.length === 0) return;

  const labelMonthly = document.getElementById("nhan-thang");
  const labelYearly = document.getElementById("nhan-nam");

  function render(yearly) {
    // a. Trạng thái nằm ở ARIA; CSS đọc qua .cong-tac[aria-checked="true"]
    sw.setAttribute("aria-checked", String(yearly));

    // b. Cập nhật trạng thái nhãn tháng / năm
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

    // c. Đổi số tiền bằng textContent (giá năm = giá tháng * 12 tháng * 80%)
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

    // d. Đổi nhãn kỳ hạn
    units.forEach((el) => {
      el.textContent = yearly ? "/năm" : "/tháng";
    });
  }

  // Vẽ lần đầu theo trạng thái HTML
  render(sw.getAttribute("aria-checked") === "true");

  sw.addEventListener("click", () => {
    render(sw.getAttribute("aria-checked") !== "true");
  });

  // Hỗ trợ bấm trực tiếp vào nhãn chữ
  if (labelMonthly) {
    labelMonthly.style.cursor = "pointer";
    labelMonthly.addEventListener("click", () => render(false));
  }
  if (labelYearly) {
    labelYearly.style.cursor = "pointer";
    labelYearly.addEventListener("click", () => render(true));
  }

  // Hỗ trợ bàn phím: phím Space / Enter
  sw.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Spacebar" || event.key === "Enter") {
      event.preventDefault();
      render(sw.getAttribute("aria-checked") !== "true");
    }
  });
}
