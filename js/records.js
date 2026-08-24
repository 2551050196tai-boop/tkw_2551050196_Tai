const STORAGE_KEY = "landwind:records:v2";
const STORAGE_VERSION = 2;
const DATA_REQUEST_TIMEOUT = 8000;
const LOADING_INDICATOR_DELAY = 160;
const NEW_RECORD_HIGHLIGHT_DURATION = 2800;

const STATUS_LABELS = Object.freeze({
  "dang-can": "Đang cân",
  "da-chot": "Đã chốt",
  "da-thanh-toan": "Đã thanh toán",
});

const STATUS_STYLES = Object.freeze({
  "dang-can": ["bg-amber-100", "text-amber-800", "dark:bg-amber-950", "dark:text-amber-200"],
  "da-chot": ["bg-blue-100", "text-blue-800", "dark:bg-blue-950", "dark:text-blue-200"],
  "da-thanh-toan": ["bg-emerald-100", "text-emerald-800", "dark:bg-emerald-950", "dark:text-emerald-200"],
});

const state = {
  records: [],
  query: "",
  category: "all",
  status: "all",
  sort: "date-desc",
  loading: true,
  loadingVisible: false,
  error: null,
};

const elements = {
  content: document.getElementById("records-content"),
  filterFieldset: document.getElementById("records-filters"),
  search: document.getElementById("record-search"),
  category: document.getElementById("category-filter"),
  status: document.getElementById("status-filter"),
  sort: document.getElementById("record-sort"),
  clearFilters: document.getElementById("clear-record-filters"),
  restore: document.getElementById("restore-records"),
  loading: document.getElementById("records-loading"),
  error: document.getElementById("records-error"),
  errorMessage: document.getElementById("records-error-message"),
  retry: document.getElementById("retry-records"),
  empty: document.getElementById("records-empty"),
  emptyMessage: document.getElementById("records-empty-message"),
  emptyClearFilters: document.getElementById("empty-clear-record-filters"),
  ready: document.getElementById("records-ready"),
  resultSummary: document.getElementById("records-result-summary"),
  body: document.getElementById("records-body"),
  tableRegion: document.getElementById("records-table-region"),
  rowTemplate: document.getElementById("record-row-template"),
  form: document.getElementById("record-form"),
  trader: document.getElementById("record-trader"),
  categoryInput: document.getElementById("record-category"),
  statusInput: document.getElementById("record-status"),
  weightInput: document.getElementById("record-weight"),
  amountInput: document.getElementById("record-amount"),
  formDate: document.getElementById("record-date"),
  toast: document.getElementById("records-toast"),
};

const requiredElements = Object.entries(elements).filter(([, element]) => !element);

if (requiredElements.length > 0) {
  throw new Error(
    `Không thể khởi tạo trang giao dịch. Thiếu: ${requiredElements
      .map(([name]) => name)
      .join(", ")}`,
  );
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const sorters = {
  "date-desc": (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id, "vi"),
  "date-asc": (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id, "vi"),
  "amount-desc": (a, b) => b.amount - a.amount || b.date.localeCompare(a.date),
  "amount-asc": (a, b) => a.amount - b.amount || b.date.localeCompare(a.date),
  "weight-desc": (a, b) => b.weight - a.weight || b.date.localeCompare(a.date),
  "trader-asc": (a, b) => a.trader.localeCompare(b.trader, "vi") || b.date.localeCompare(a.date),
};

let toastTimer = null;
let loadingIndicatorTimer = null;

function scheduleLoadingIndicator() {
  window.clearTimeout(loadingIndicatorTimer);
  state.loadingVisible = false;
  loadingIndicatorTimer = window.setTimeout(() => {
    if (!state.loading) return;
    state.loadingVisible = true;
    render();
  }, LOADING_INDICATOR_DELAY);
}

function stopLoadingIndicator() {
  window.clearTimeout(loadingIndicatorTimer);
  loadingIndicatorTimer = null;
  state.loadingVisible = false;
}

function debounce(callback, delay) {
  let timer = null;

  function debounced(...args) {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), delay);
  }

  debounced.cancel = () => {
    window.clearTimeout(timer);
    timer = null;
  };

  return debounced;
}

function normalizeSearch(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi")
    .trim();
}

function normalizeRecord(record) {
  if (!record || typeof record !== "object") return null;

  const normalized = {
    id: String(record.id ?? "").trim(),
    trader: String(record.trader ?? "").trim(),
    category: String(record.category ?? "").trim(),
    status: String(record.status ?? "").trim(),
    weight: Number(record.weight),
    amount: Number(record.amount),
    date: String(record.date ?? "").trim(),
  };

  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(normalized.date)
    && !Number.isNaN(new Date(`${normalized.date}T00:00:00`).getTime());

  if (
    !normalized.id
    || !normalized.trader
    || !normalized.category
    || !Object.hasOwn(STATUS_LABELS, normalized.status)
    || !Number.isFinite(normalized.weight)
    || normalized.weight <= 0
    || !Number.isFinite(normalized.amount)
    || normalized.amount < 0
    || !validDate
  ) {
    return null;
  }

  return normalized;
}

function normalizeRecordList(records) {
  if (!Array.isArray(records)) {
    throw new Error("Dữ liệu giao dịch không phải là một danh sách.");
  }

  const normalized = records.map(normalizeRecord);
  if (normalized.some((record) => record === null)) {
    throw new Error("Dữ liệu giao dịch có bản ghi không hợp lệ.");
  }

  const ids = new Set(normalized.map((record) => record.id));
  if (ids.size !== normalized.length) {
    throw new Error("Dữ liệu giao dịch có mã phiếu bị trùng.");
  }

  return normalized;
}

const DEFAULT_RECORDS = Object.freeze([
  { "id": "PC-1307-101", "trader": "Chú Tư Bến Tre", "category": "Sầu riêng", "status": "dang-can", "weight": 660, "amount": 51480000, "date": "2026-07-13" },
  { "id": "PC-1807-102", "trader": "Cô Tám Cái Bè", "category": "Xoài", "status": "da-chot", "weight": 2380, "amount": 76160000, "date": "2026-07-18" },
  { "id": "PC-1707-103", "trader": "Chị Hường Long Hồ", "category": "Bưởi", "status": "dang-can", "weight": 420, "amount": 7980000, "date": "2026-07-17" },
  { "id": "PC-1407-104", "trader": "Cô Tám Cái Bè", "category": "Xoài", "status": "da-chot", "weight": 1390, "amount": 44480000, "date": "2026-07-14" },
  { "id": "PC-1407-105", "trader": "Chú Bảy Rạch Giá", "category": "Xoài", "status": "da-thanh-toan", "weight": 1690, "amount": 54080000, "date": "2026-07-14" },
  { "id": "PC-2107-106", "trader": "Chú Tư Bến Tre", "category": "Xoài", "status": "da-thanh-toan", "weight": 850, "amount": 27200000, "date": "2026-07-21" },
  { "id": "PC-1907-107", "trader": "Cô Lành Tam Bình", "category": "Xoài", "status": "dang-can", "weight": 1750, "amount": 56000000, "date": "2026-07-19" },
  { "id": "PC-1807-108", "trader": "Anh Dũng Chợ Lách", "category": "Nhãn", "status": "da-chot", "weight": 390, "amount": 10920000, "date": "2026-07-18" },
  { "id": "PC-1807-109", "trader": "Chú Bảy Rạch Giá", "category": "Mít", "status": "da-chot", "weight": 1470, "amount": 22050000, "date": "2026-07-18" },
  { "id": "PC-1907-110", "trader": "Cô Tám Cái Bè", "category": "Sầu riêng", "status": "da-thanh-toan", "weight": 890, "amount": 69420000, "date": "2026-07-19" },
  { "id": "PC-1507-111", "trader": "Chị Hường Long Hồ", "category": "Nhãn", "status": "da-thanh-toan", "weight": 520, "amount": 14560000, "date": "2026-07-15" },
  { "id": "PC-2007-112", "trader": "Chú Tư Bến Tre", "category": "Bưởi", "status": "dang-can", "weight": 310, "amount": 5890000, "date": "2026-07-20" },
  { "id": "PC-1607-113", "trader": "Anh Dũng Chợ Lách", "category": "Sầu riêng", "status": "da-thanh-toan", "weight": 1120, "amount": 87360000, "date": "2026-07-16" },
  { "id": "PC-1707-114", "trader": "Cô Lành Tam Bình", "category": "Mít", "status": "dang-can", "weight": 980, "amount": 14700000, "date": "2026-07-17" },
  { "id": "PC-2207-115", "trader": "Chú Bảy Rạch Giá", "category": "Bưởi", "status": "da-chot", "weight": 640, "amount": 12160000, "date": "2026-07-22" },
  { "id": "PC-1307-116", "trader": "Cô Tám Cái Bè", "category": "Nhãn", "status": "da-thanh-toan", "weight": 780, "amount": 21840000, "date": "2026-07-13" },
  { "id": "PC-1407-117", "trader": "Chị Hường Long Hồ", "category": "Sầu riêng", "status": "da-chot", "weight": 1450, "amount": 113100000, "date": "2026-07-14" },
  { "id": "PC-1907-118", "trader": "Anh Dũng Chợ Lách", "category": "Xoài", "status": "dang-can", "weight": 1820, "amount": 58240000, "date": "2026-07-19" },
  { "id": "PC-1607-119", "trader": "Chú Tư Bến Tre", "category": "Mít", "status": "da-thanh-toan", "weight": 1230, "amount": 18450000, "date": "2026-07-16" },
  { "id": "PC-2007-120", "trader": "Cô Lành Tam Bình", "category": "Bưởi", "status": "da-chot", "weight": 560, "amount": 10640000, "date": "2026-07-20" },
  { "id": "PC-2107-121", "trader": "Cô Tám Cái Bè", "category": "Bưởi", "status": "dang-can", "weight": 490, "amount": 9310000, "date": "2026-07-21" },
  { "id": "PC-1507-122", "trader": "Chú Bảy Rạch Giá", "category": "Sầu riêng", "status": "da-chot", "weight": 930, "amount": 72540000, "date": "2026-07-15" },
  { "id": "PC-2207-123", "trader": "Anh Dũng Chợ Lách", "category": "Mít", "status": "da-thanh-toan", "weight": 1650, "amount": 24750000, "date": "2026-07-22" },
  { "id": "PC-1707-124", "trader": "Cô Lành Tam Bình", "category": "Nhãn", "status": "da-thanh-toan", "weight": 610, "amount": 17080000, "date": "2026-07-17" },
  { "id": "PC-1307-125", "trader": "Chú Tư Bến Tre", "category": "Nhãn", "status": "da-chot", "weight": 440, "amount": 12320000, "date": "2026-07-13" },
  { "id": "PC-1807-126", "trader": "Chị Hường Long Hồ", "category": "Xoài", "status": "dang-can", "weight": 2100, "amount": 67200000, "date": "2026-07-18" },
  { "id": "PC-1607-127", "trader": "Cô Tám Cái Bè", "category": "Mít", "status": "da-chot", "weight": 1340, "amount": 20100000, "date": "2026-07-16" },
  { "id": "PC-2107-128", "trader": "Chú Bảy Rạch Giá", "category": "Nhãn", "status": "dang-can", "weight": 830, "amount": 23240000, "date": "2026-07-21" },
  { "id": "PC-1507-129", "trader": "Anh Dũng Chợ Lách", "category": "Bưởi", "status": "da-thanh-toan", "weight": 720, "amount": 13680000, "date": "2026-07-15" },
  { "id": "PC-2207-130", "trader": "Chị Hường Long Hồ", "category": "Mít", "status": "da-thanh-toan", "weight": 1580, "amount": 23700000, "date": "2026-07-22" },
]);

async function fetchDefaultRecords() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), DATA_REQUEST_TIMEOUT);
  let response;

  try {
    response = await fetch("./data/records.json", {
      cache: "default",
      signal: controller.signal,
    });
    if (response && response.ok) {
      return normalizeRecordList(await response.json());
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Yêu cầu dữ liệu mất quá nhiều thời gian. Vui lòng thử lại.");
    }
    // Khi mở file:// trực tiếp hoặc mạng không có server, dùng dữ liệu mẫu mặc định
    console.info("Dùng dữ liệu mẫu tích hợp sẵn do trình duyệt chặn fetch cục bộ.");
  } finally {
    window.clearTimeout(timeout);
  }

  return normalizeRecordList(DEFAULT_RECORDS);
}

function readStoredRecords() {
  let raw;

  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }

  if (raw === null) return null;

  try {
    const saved = JSON.parse(raw);

    if (
      !saved
      || saved.version !== STORAGE_VERSION
      || !Array.isArray(saved.records)
    ) {
      throw new Error("Phiên bản dữ liệu đã lưu không hợp lệ.");
    }

    return normalizeRecordList(saved.records);
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Trình duyệt có thể chặn localStorage; khi đó trang sẽ dùng JSON mẫu.
    }
    return null;
  }
}

function persistRecords() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        updatedAt: new Date().toISOString(),
        records: state.records,
      }),
    );
    return true;
  } catch {
    showToast(
      "Trình duyệt không cho phép lưu cục bộ. Thay đổi chỉ còn hiệu lực đến khi tải lại trang.",
      "error",
    );
    return false;
  }
}

function visibleRecords() {
  const query = normalizeSearch(state.query);
  const sorter = sorters[state.sort] ?? sorters["date-desc"];

  return state.records
    .filter((record) => state.category === "all" || record.category === state.category)
    .filter((record) => state.status === "all" || record.status === state.status)
    .filter((record) => !query || normalizeSearch(record.trader).includes(query))
    .sort(sorter);
}

function hasActiveFilters() {
  return Boolean(
    state.query.trim()
    || state.category !== "all"
    || state.status !== "all",
  );
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function setCell(row, name, value) {
  const cell = row.querySelector(`[data-cell="${name}"]`);
  if (cell) cell.textContent = value;
}

function buildRow(record) {
  const row = elements.rowTemplate.content.firstElementChild.cloneNode(true);
  row.dataset.recordId = record.id;

  setCell(row, "id", record.id);
  setCell(row, "trader", record.trader);
  setCell(row, "category", record.category);
  setCell(row, "weight", `${numberFormatter.format(record.weight)} kg`);
  setCell(row, "amount", currencyFormatter.format(record.amount));
  setCell(row, "date", formatDate(record.date));

  const statusCell = row.querySelector('[data-cell="status"]');
  const statusBadge = document.createElement("span");
  statusBadge.className = "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold";
  statusBadge.classList.add(...STATUS_STYLES[record.status]);
  statusBadge.textContent = STATUS_LABELS[record.status];
  statusCell.replaceChildren(statusBadge);

  const deleteButton = row.querySelector('[data-action="delete"]');
  deleteButton.dataset.id = record.id;
  deleteButton.setAttribute(
    "aria-label",
    `Xóa giao dịch ${record.id} của ${record.trader}`,
  );

  return row;
}

function revealRecord(recordId) {
  window.requestAnimationFrame(() => {
    const row = [...elements.body.rows].find(
      (candidate) => candidate.dataset.recordId === recordId,
    );

    if (!row) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const highlightClasses = [
      "bg-brand-50",
      "ring-2",
      "ring-brand-600",
      "dark:bg-surface-dark-alt",
      "dark:ring-brand-300",
    ];

    row.tabIndex = -1;
    row.classList.add(...highlightClasses);
    row.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
    row.focus({ preventScroll: true });

    window.setTimeout(() => {
      row.classList.remove(...highlightClasses);
    }, NEW_RECORD_HIGHLIGHT_DURATION);
  });
}

function render() {
  const list = visibleRecords();
  const showError = !state.loading && Boolean(state.error);
  const showEmpty = !state.loading && !state.error && list.length === 0;
  const showReady = !state.loading && !state.error && list.length > 0;
  const filtered = hasActiveFilters();

  elements.content.setAttribute("aria-busy", String(state.loading));
  elements.loading.hidden = !(state.loading && state.loadingVisible);
  elements.error.hidden = !showError;
  elements.empty.hidden = !showEmpty;
  elements.ready.hidden = !showReady;
  elements.filterFieldset.disabled = state.loading || showError;
  elements.restore.disabled = state.loading;
  elements.clearFilters.disabled = !filtered || state.loading || showError;
  elements.emptyClearFilters.hidden = !filtered;

  elements.category.value = state.category;
  elements.status.value = state.status;
  elements.sort.value = state.sort;

  if (showError) {
    elements.errorMessage.textContent = state.error;
  }

  if (showEmpty) {
    elements.emptyMessage.textContent = state.records.length === 0
      ? "Chưa có giao dịch nào. Hãy thêm bản ghi đầu tiên bằng biểu mẫu bên dưới."
      : "Không có giao dịch phù hợp với từ khóa và bộ lọc hiện tại.";
  }

  if (showReady) {
    const fragment = document.createDocumentFragment();
    list.forEach((record) => fragment.appendChild(buildRow(record)));
    elements.body.replaceChildren(fragment);
    elements.resultSummary.textContent = filtered
      ? `Đang hiển thị ${list.length} trên tổng số ${state.records.length} giao dịch.`
      : `Đang hiển thị ${list.length} giao dịch.`;
  } else {
    elements.body.replaceChildren();
  }
}

function showToast(message, tone = "success") {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("bg-brand-600", tone !== "error");
  elements.toast.classList.toggle("bg-danger", tone === "error");
  elements.toast.hidden = false;

  toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 4500);
}

function resetFilters() {
  debouncedSearch.cancel();
  state.query = "";
  state.category = "all";
  state.status = "all";
  state.sort = "date-desc";
  elements.search.value = "";
  render();
}

async function loadInitialRecords() {
  state.loading = true;
  state.loadingVisible = false;
  state.error = null;
  scheduleLoadingIndicator();
  render();

  try {
    const stored = readStoredRecords();
    const records = stored === null ? await fetchDefaultRecords() : stored;

    state.records = records;
    state.loading = false;
    state.error = null;

    if (stored === null) persistRecords();
  } catch (error) {
    state.records = [];
    state.loading = false;
    state.error = error instanceof Error
      ? error.message
      : "Không thể tải dữ liệu giao dịch.";
  } finally {
    stopLoadingIndicator();
  }

  render();
}

async function restoreDefaultRecords() {
  const shouldRestore = window.confirm(
    "Khôi phục dữ liệu mẫu sẽ thay thế toàn bộ giao dịch bạn đã thêm hoặc xóa. Bạn có muốn tiếp tục?",
  );

  if (!shouldRestore) return;

  const previousRecords = state.records;
  state.loading = true;
  state.loadingVisible = true;
  state.error = null;
  render();

  try {
    state.records = await fetchDefaultRecords();
    state.loading = false;
    state.loadingVisible = false;
    persistRecords();
    resetFilters();
    showToast(`Đã khôi phục ${state.records.length} giao dịch mẫu.`);
  } catch (error) {
    state.records = previousRecords;
    state.loading = false;
    state.loadingVisible = false;
    render();
    showToast(
      error instanceof Error
        ? `Không thể khôi phục dữ liệu: ${error.message}`
        : "Không thể khôi phục dữ liệu mẫu.",
      "error",
    );
  }
}

function createRecordId(date) {
  const [, month, day] = date.split("-");
  const prefix = `PC-${day}${month}-`;
  const usedIds = new Set(state.records.map((record) => record.id));
  const daySequences = state.records
    .filter((record) => record.id.startsWith(prefix))
    .map((record) => Number(record.id.slice(prefix.length)))
    .filter(Number.isFinite);

  let sequence = Math.max(100, ...daySequences) + 1;
  let id = `${prefix}${String(sequence).padStart(3, "0")}`;

  while (usedIds.has(id)) {
    sequence += 1;
    id = `${prefix}${String(sequence).padStart(3, "0")}`;
  }

  return id;
}

function todayForInput() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const debouncedSearch = debounce((query) => {
  state.query = query;
  render();
}, 300);

elements.search.addEventListener("input", (event) => {
  debouncedSearch(event.currentTarget.value);
});

elements.search.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && event.currentTarget.value) {
    event.preventDefault();
    resetFilters();
    event.currentTarget.focus();
  }
});

elements.category.addEventListener("change", (event) => {
  state.category = event.currentTarget.value;
  render();
});

elements.status.addEventListener("change", (event) => {
  state.status = event.currentTarget.value;
  render();
});

elements.sort.addEventListener("change", (event) => {
  state.sort = event.currentTarget.value;
  render();
});

elements.clearFilters.addEventListener("click", resetFilters);
elements.emptyClearFilters.addEventListener("click", resetFilters);
elements.retry.addEventListener("click", loadInitialRecords);
elements.restore.addEventListener("click", restoreDefaultRecords);

elements.body.addEventListener("click", (event) => {
  const deleteButton = event.target.closest('[data-action="delete"]');
  if (!deleteButton || !elements.body.contains(deleteButton)) return;

  const record = state.records.find((item) => item.id === deleteButton.dataset.id);
  if (!record) return;

  const shouldDelete = window.confirm(
    `Xóa giao dịch ${record.id} của ${record.trader}?`,
  );
  if (!shouldDelete) return;

  state.records = state.records.filter((item) => item.id !== record.id);
  persistRecords();
  render();
  showToast(`Đã xóa giao dịch ${record.id}.`);

  const nextDeleteButton = elements.body.querySelector('[data-action="delete"]');
  if (nextDeleteButton) {
    nextDeleteButton.focus();
  } else {
    elements.trader.focus();
  }
});

function messageFor(field) {
  const v = field.validity;
  if (v.valueMissing) return "Vui lòng điền mục này.";
  if (v.tooShort) return `Nhập ít nhất ${field.minLength} ký tự. Ví dụ: Chú Tư Bến Tre`;
  if (v.rangeUnderflow) return `Giá trị phải lớn hơn hoặc bằng ${field.min}.`;
  if (v.typeMismatch) return "Dữ liệu chưa đúng định dạng.";
  if (field.validationMessage) return field.validationMessage;
  return "";
}

function validateField(field) {
  if (!field) return true;
  const errorBox = document.getElementById(`error-${field.id}`);
  const message = messageFor(field);
  const isValid = field.checkValidity();

  if (!isValid) {
    field.setAttribute("aria-invalid", "true");
    if (errorBox) errorBox.textContent = message;
  } else {
    field.removeAttribute("aria-invalid");
    if (errorBox) errorBox.textContent = "";
  }
  return isValid;
}

function clearFieldError(field) {
  if (!field) return;
  field.removeAttribute("aria-invalid");
  const errorBox = document.getElementById(`error-${field.id}`);
  if (errorBox) errorBox.textContent = "";
}

const formFields = [
  elements.trader,
  elements.categoryInput,
  elements.statusInput,
  elements.weightInput,
  elements.amountInput,
  elements.formDate,
];

formFields.forEach((field) => {
  if (!field) return;
  field.addEventListener("input", () => {
    if (field === elements.trader) {
      elements.trader.setCustomValidity(
        elements.trader.value.trim().length > 0 && elements.trader.value.trim().length < 2
          ? "Vui lòng nhập tên thương lái có ít nhất 2 ký tự."
          : "",
      );
    }
    if (field.hasAttribute("aria-invalid")) {
      validateField(field);
    }
  });
  field.addEventListener("change", () => {
    validateField(field);
  });
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const trader = elements.trader.value.trim();
  elements.trader.setCustomValidity(
    trader.length < 2 ? "Vui lòng nhập tên thương lái có ít nhất 2 ký tự." : "",
  );

  let firstInvalid = null;
  formFields.forEach((field) => {
    const valid = validateField(field);
    if (!valid && !firstInvalid) {
      firstInvalid = field;
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    showToast("Vui lòng kiểm tra lại các trường thông tin có lỗi.", "error");
    return;
  }

  const formData = new FormData(elements.form);
  const date = String(formData.get("date"));
  const record = normalizeRecord({
    id: createRecordId(date),
    trader,
    category: formData.get("category"),
    status: formData.get("status"),
    weight: formData.get("weight"),
    amount: formData.get("amount"),
    date,
  });

  if (!record) {
    showToast("Dữ liệu vừa nhập chưa hợp lệ. Vui lòng kiểm tra lại.", "error");
    return;
  }

  // Tự động thêm giao dịch mới vào đầu danh sách giao dịch
  state.records = [record, ...state.records];
  state.loading = false;
  state.error = null;
  persistRecords();
  elements.form.reset();
  formFields.forEach(clearFieldError);
  elements.formDate.value = todayForInput();
  resetFilters();
  showToast(`Đã thêm thành công giao dịch ${record.id} của ${record.trader}!`);
  revealRecord(record.id);
});

elements.formDate.value = todayForInput();
loadInitialRecords();
