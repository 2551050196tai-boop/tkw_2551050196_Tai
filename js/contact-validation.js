const form = document.getElementById("contact-form");

if (form) {
  const summary = document.getElementById("contact-form-summary");
  const toast = document.getElementById("contact-toast");
  const fields = [...form.elements].filter((field) => field.willValidate);
  let toastTimer;

  function errorElementFor(field) {
    return document.getElementById(`${field.id}-error`);
  }

  function applyCustomConstraints(field) {
    field.setCustomValidity("");

    if (field.id !== "ho-ten") return;

    const trimmedName = field.value.trim();

    if (field.value && !trimmedName) {
      field.setCustomValidity("Vui lòng nhập họ và tên.");
    } else if (trimmedName && trimmedName.length < 2) {
      field.setCustomValidity("Họ và tên phải có ít nhất 2 ký tự.");
    }
  }

  function messageFor(field) {
    const { validity } = field;

    if (validity.customError) return field.validationMessage;

    if (validity.valueMissing) {
      if (field.type === "checkbox") {
        return "Vui lòng xác nhận đồng ý để tiếp tục.";
      }

      if (field.tagName === "SELECT") {
        return "Vui lòng chọn quy mô kinh doanh.";
      }

      return "Vui lòng điền mục này.";
    }

    if (validity.typeMismatch && field.type === "email") {
      return "Email chưa đúng định dạng, ví dụ: ten@cuahang.com.";
    }

    if (validity.patternMismatch && field.id === "dien-thoai") {
      return "Nhập 10 chữ số, bắt đầu bằng 0. Ví dụ: 0912345678.";
    }

    if (validity.tooShort) {
      return `Vui lòng nhập ít nhất ${field.minLength} ký tự.`;
    }

    return "Vui lòng kiểm tra lại nội dung này.";
  }

  function validateField(field) {
    applyCustomConstraints(field);

    const errorElement = errorElementFor(field);
    const isValid = field.checkValidity();

    if (isValid) {
      field.removeAttribute("aria-invalid");
      if (errorElement) errorElement.textContent = "";
      return true;
    }

    field.setAttribute("aria-invalid", "true");
    if (errorElement) errorElement.textContent = messageFor(field);
    return false;
  }

  function clearValidation() {
    fields.forEach((field) => {
      field.setCustomValidity("");
      field.removeAttribute("aria-invalid");

      const errorElement = errorElementFor(field);
      if (errorElement) errorElement.textContent = "";
    });

    summary.hidden = true;
    summary.textContent = "";
  }

  function hideToast() {
    window.clearTimeout(toastTimer);
    toast.hidden = true;
    toast.textContent = "";
  }

  function showToast() {
    hideToast();
    toast.hidden = false;
    toast.textContent =
      "Gửi yêu cầu thành công. Chúng tôi sẽ liên hệ lại trong vòng 2 giờ làm việc.";
    toastTimer = window.setTimeout(hideToast, 5000);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideToast();

    const invalidFields = fields.filter((field) => !validateField(field));

    if (invalidFields.length > 0) {
      summary.hidden = false;
      summary.textContent = `Có ${invalidFields.length} mục cần sửa trước khi gửi.`;
      invalidFields[0].focus();
      return;
    }

    form.reset();
    clearValidation();
    showToast();
  });

  form.addEventListener("input", (event) => {
    const field = event.target;

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      if (field.hasAttribute("aria-invalid")) validateField(field);
    }
  });

  form.addEventListener("change", (event) => {
    const field = event.target;

    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLSelectElement ||
      field instanceof HTMLTextAreaElement
    ) {
      if (field.hasAttribute("aria-invalid")) validateField(field);
    }
  });
}
