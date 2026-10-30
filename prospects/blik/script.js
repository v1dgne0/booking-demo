"use strict";

/* --------------------------------------------------------------------------
   Данные демо-студии
   -------------------------------------------------------------------------- */

const SERVICES = [{"id":"care","name":"Маникюр без покрытия","description":"Форма, бережный маникюр и масло для кутикулы.","duration":60,"price":1500,"master":"alina"},{"id":"color","name":"Маникюр + однотон","description":"Маникюр и покрытие в один оттенок.","duration":90,"price":2300,"master":"mira"},{"id":"strength","name":"Укрепление + цвет","description":"Выравнивание, укрепление и покрытие.","duration":120,"price":2900,"master":"nika"},{"id":"removal","name":"Снятие + маникюр","description":"Снятие покрытия и чистый маникюр.","duration":90,"price":1900,"master":"alina"}];

const MASTERS = [{"id":"alina","name":"Александра","specialty":"Маникюр · однотон","experience":"6 лет","bio":"Работает с чистой формой и спокойной палитрой. Демо-профиль.","days":[1,2,3,4,5,6],"slots":["10:00","12:30","15:00","17:30"],"works":[{"title":"Пудровый штрих","style":"nail-nude"},{"title":"Розовый свет","style":"nail-red"},{"title":"Тёплый нюд","style":"nail-olive"}],"reviews":[]},{"id":"mira","name":"Ирина","specialty":"Форма · лаконичный дизайн","experience":"4 года","bio":"Любит тонкие линии и детали без перегруза. Демо-профиль.","days":[1,2,3,4,5,6],"slots":["10:00","12:30","15:00","17:30"],"works":[{"title":"Пудровый штрих","style":"nail-red"},{"title":"Розовый свет","style":"nail-nude"},{"title":"Тёплый нюд","style":"nail-olive"}],"reviews":[]},{"id":"nika","name":"Нина","specialty":"Укрепление · покрытие","experience":"8 лет","bio":"Внимательна к комфорту и стойкости результата. Демо-профиль.","days":[1,2,3,4,5,6],"slots":["10:00","12:30","15:00","17:30"],"works":[{"title":"Пудровый штрих","style":"nail-olive"},{"title":"Розовый свет","style":"nail-red"},{"title":"Тёплый нюд","style":"nail-nude"}],"reviews":[]}];

const COLORS = [{"name":"Золотая пыль","style":"shade-cherry"},{"name":"Розовый кварц","style":"shade-cranberry"},{"name":"Молочный","style":"shade-raspberry"},{"name":"Бордо","style":"shade-poppy"},{"name":"Пудровый","style":"shade-quartz"},{"name":"Карамель","style":"shade-rose"},{"name":"Кремовый","style":"shade-lilac"},{"name":"Шалфей","style":"shade-plum"},{"name":"Пион","style":"shade-milk"},{"name":"Лиловый","style":"shade-sand"},{"name":"Кофе","style":"shade-caramel"},{"name":"Песочный","style":"shade-coffee"},{"name":"Прозрачный","style":"shade-sage"},{"name":"Ягодный","style":"shade-olive"},{"name":"Тёплый серый","style":"shade-teal"},{"name":"Белый","style":"shade-blue"}];

const STORAGE = {
  bookings: "blik:bookings:v1",
  profile: "blik:profile:v1",
  reviews: "blik:reviews:v1"
};

const DAY_MS = 86400000;
const OPEN_MIN = 10 * 60;
const CLOSE_MIN = 20 * 60;

/* --------------------------------------------------------------------------
   Состояние и утилиты
   -------------------------------------------------------------------------- */

const state = {
  serviceId: SERVICES[0].id,
  masterId: SERVICES[0].master,
  masterTouched: false,
  date: "",
  time: "",
  step: 1
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

const pad2 = value => String(value).padStart(2, "0");

function plural(count, one, few, many) {
  const mod100 = Math.abs(count) % 100;
  const mod10 = mod100 % 10;
  if (mod100 > 10 && mod100 < 20) return many;
  if (mod10 > 1 && mod10 < 5) return few;
  if (mod10 === 1) return one;
  return many;
}

function formatPrice(value) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function formatDuration(minutes) {
  return `${minutes} ${plural(minutes, "минута", "минуты", "минут")}`;
}

function serviceById(id) {
  return SERVICES.find(item => item.id === id);
}

function masterById(id) {
  return MASTERS.find(item => item.id === id);
}

function masterIndex(id) {
  return MASTERS.findIndex(item => item.id === id);
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function keyToDate(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateRange() {
  const today = startOfDay(new Date());
  const first = addDays(today, 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 3, 0);
  const dates = [];
  for (let date = new Date(first); date <= last; date = addDays(date, 1)) {
    dates.push(new Date(date));
  }
  return dates;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const longDate = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" });
const shortDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const weekdayShort = new Intl.DateTimeFormat("ru-RU", { weekday: "short" });
const monthShort = new Intl.DateTimeFormat("ru-RU", { month: "short" });
const monthYear = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

function formatLongDate(date) {
  return capitalize(longDate.format(date));
}

function formatShortDate(date) {
  return shortDate.format(date);
}

function formatDayStatus(count) {
  return `${count} ${plural(count, "место", "места", "мест")}`;
}

function toMinutes(time) {
  const [hours, minutes] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(total) {
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

function shiftTime(time, delta) {
  return fromMinutes(toMinutes(time) + delta);
}

/* --------------------------------------------------------------------------
   Расписание, занятость, слоты
   -------------------------------------------------------------------------- */

function scheduleFor(master, date) {
  const index = masterIndex(master.id);
  const shift = [0, -30, 30][(date.getDate() + date.getMonth() + index) % 3];
  return master.slots.map((time, slotIndex) => slotIndex === 0 ? time : shiftTime(time, shift));
}

function demoBusyIntervals(master, date) {
  if (!master.days.includes(date.getDay())) return [];
  const index = masterIndex(master.id);
  const seed = Math.floor(startOfDay(date).getTime() / DAY_MS) + index;
  if (seed % 5 !== 0) return [];
  const times = scheduleFor(master, date);
  const start = toMinutes(times[seed % times.length]);
  return [{ start, end: start + 90 }];
}

function bookingIntervals(masterId, key, bookings) {
  return bookings
    .filter(booking => booking.master === masterId && booking.date === key)
    .map(booking => {
      const service = serviceById(booking.service);
      const start = toMinutes(booking.time);
      return { start, end: start + (service ? service.duration : 60) };
    });
}

function busyIntervals(master, date, bookings) {
  return [
    ...demoBusyIntervals(master, date),
    ...bookingIntervals(master.id, dateKey(date), bookings)
  ];
}

function overlaps(start, end, intervals) {
  return intervals.some(interval => start < interval.end && interval.start < end);
}

function getFreeSlots(master, date, duration, bookings) {
  if (!master.days.includes(date.getDay())) return [];
  const busy = busyIntervals(master, date, bookings);
  return scheduleFor(master, date).filter(time => {
    const start = toMinutes(time);
    return start >= OPEN_MIN && start + duration <= CLOSE_MIN && !overlaps(start, start + duration, busy);
  });
}

function getAllSlots(master, date, duration, bookings) {
  if (!master.days.includes(date.getDay())) return [];
  const times = new Set(scheduleFor(master, date));
  bookings
    .filter(booking => booking.master === master.id && booking.date === dateKey(date))
    .forEach(booking => times.add(booking.time));
  return [...times]
    .filter(time => toMinutes(time) >= OPEN_MIN && toMinutes(time) + duration <= CLOSE_MIN)
    .sort((a, b) => toMinutes(a) - toMinutes(b));
}

function isSlotFree(master, date, time, duration, bookings) {
  return getFreeSlots(master, date, duration, bookings).includes(time);
}

function bookingStart(booking) {
  const date = keyToDate(booking.date);
  if (!date) return null;
  const [hours, minutes] = booking.time.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function bookingHasPassed(booking) {
  const start = bookingStart(booking);
  if (!start) return true;
  const service = serviceById(booking.service);
  const end = start.getTime() + (service ? service.duration : 60) * 60000;
  return end < Date.now();
}

/* --------------------------------------------------------------------------
   Хранилище
   -------------------------------------------------------------------------- */

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function normalizePhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  else if (digits.length === 10) digits = `7${digits}`;
  return digits.startsWith("7") && digits.length === 11 ? digits : "";
}

function displayPhone(value) {
  const digits = normalizePhone(value);
  return digits ? `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}` : "";
}

function normalizeBooking(raw) {
  if (!raw || typeof raw !== "object") return null;
  const service = serviceById(raw.service);
  const master = masterById(raw.master);
  if (!service || !master) return null;
  const date = keyToDate(raw.date);
  if (!date || dateKey(date) !== raw.date) return null;
  const time = String(raw.time || "");
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;
  const phone = normalizePhone(raw.phone);
  const name = String(raw.name || "").trim().slice(0, 60);
  if (!phone || !name) return null;
  return {
    id: String(raw.id || `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    service: service.id,
    master: master.id,
    date: raw.date,
    time,
    name,
    phone,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString()
  };
}

function loadBookings() {
  const raw = readJSON(STORAGE.bookings, []);
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const result = [];
  raw.forEach(item => {
    const booking = normalizeBooking(item);
    if (booking && !seen.has(booking.id)) {
      seen.add(booking.id);
      result.push(booking);
    }
  });
  return result.slice(-200);
}

function saveBookings(items) {
  if (!Array.isArray(items)) return false;
  return writeJSON(STORAGE.bookings, items.slice(-200));
}

function normalizeReview(raw) {
  if (!raw || typeof raw !== "object") return null;
  const bookingId = String(raw.bookingId || "");
  const target = raw.target === "master" ? "master" : "salon";
  const rating = Number(raw.rating);
  const text = String(raw.text || "").trim().slice(0, 500);
  if (!bookingId || !Number.isInteger(rating) || rating < 1 || rating > 5 || text.length < 5) return null;
  const master = masterById(raw.master);
  return {
    bookingId,
    target,
    rating,
    text,
    master: master ? master.id : "",
    name: String(raw.name || "").trim().slice(0, 60),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString()
  };
}

function loadReviews() {
  const raw = readJSON(STORAGE.reviews, []);
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeReview).filter(Boolean).slice(-300);
}

function saveReviews(items) {
  if (!Array.isArray(items)) return false;
  return writeJSON(STORAGE.reviews, items.slice(-300));
}

function loadProfile() {
  const stored = readJSON(STORAGE.profile, null);
  if (stored && typeof stored === "object") {
    const phone = normalizePhone(stored.phone);
    if (phone) return { name: String(stored.name || "").trim().slice(0, 60), phone };
  }
  const latest = loadBookings()
    .filter(booking => booking.phone)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
  return latest ? { name: latest.name, phone: latest.phone } : null;
}

function saveProfile(name, phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const profile = { name: String(name || "").trim().slice(0, 60), phone: normalized };
  writeJSON(STORAGE.profile, profile);
  return profile;
}

let currentProfile = loadProfile();

/* --------------------------------------------------------------------------
   Форматирование телефона
   -------------------------------------------------------------------------- */

function formatPhoneInput(input) {
  const rawValue = input.value;
  const start = input.selectionStart ?? rawValue.length;
  const end = input.selectionEnd ?? rawValue.length;
  const digitsBeforeStart = rawValue.slice(0, start).replace(/\D/g, "").length;
  const digitsBeforeEnd = rawValue.slice(0, end).replace(/\D/g, "").length;
  let digits = rawValue.replace(/\D/g, "");
  if (!digits) {
    input.value = "";
    return;
  }
  const addCountryCode = !digits.startsWith("7") && !digits.startsWith("8");
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  else if (!digits.startsWith("7")) digits = `7${digits}`;
  digits = digits.slice(0, 11);

  let formatted = "+7";
  if (digits.length > 1) formatted += ` (${digits.slice(1, 4)}`;
  if (digits.length >= 4) formatted += ")";
  if (digits.length > 4) formatted += ` ${digits.slice(4, 7)}`;
  if (digits.length > 7) formatted += `-${digits.slice(7, 9)}`;
  if (digits.length > 9) formatted += `-${digits.slice(9, 11)}`;
  input.value = formatted;

  const caretForDigitCount = count => {
    if (count <= 0) return 0;
    let seen = 0;
    for (let index = 0; index < formatted.length; index += 1) {
      if (/\d/.test(formatted[index])) seen += 1;
      if (seen >= count) return index + 1;
    }
    return formatted.length;
  };

  const startCount = Math.min(11, digitsBeforeStart + (addCountryCode && digitsBeforeStart > 0 ? 1 : 0));
  const endCount = Math.min(11, digitsBeforeEnd + (addCountryCode && digitsBeforeEnd > 0 ? 1 : 0));
  input.setSelectionRange(caretForDigitCount(startCount), caretForDigitCount(endCount));
}

function clearPhonePrefix(event, input) {
  if (event.key !== "Backspace" && event.key !== "Delete") return;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  if (start !== end) return;
  if ((event.key === "Backspace" && start <= 4) || (event.key === "Delete" && start < 4)) {
    event.preventDefault();
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

/* --------------------------------------------------------------------------
   DOM
   -------------------------------------------------------------------------- */

const serviceList = $("#service-list");
const teamGrid = $("#team-grid");
const serviceSelect = $("#service-select");
const masterSelect = $("#master-select");
const serviceOptions = $("#service-options");
const masterOptions = $("#master-options");
const serviceTrigger = $("#service-trigger");
const masterTrigger = $("#master-trigger");
const dateOptions = $("#date-options");
const slotOptions = $("#slot-options");
const slotsEmpty = $("#slots-empty");
const form = $("#booking-form");
const success = $("#booking-success");
const successSummary = $("#success-summary");
const step1 = $("#step-1");
const step2 = $("#step-2");
const step3 = $("#step-3");
const stepBack = $("#step-back");
const stepNext = $("#step-next");
const submitButton = $("#submit-booking");
const progressSteps = $$(".progress-step");
const formError = $("#form-error");
const stepError = $("#step-error");
const nameInput = $("#client-name");
const nameError = $("#name-error");
const phoneInput = $("#client-phone");
const phoneError = $("#phone-error");
const consent = $("#consent");
const calendarToggle = $("#calendar-toggle");
const calendarToggleText = $("#calendar-toggle-text");
const calendarPicker = $("#calendar-picker");
const calendarGrid = $("#calendar-grid");
const calendarTitle = $("#calendar-month-title");
const calendarPrev = $("#calendar-prev");
const calendarNext = $("#calendar-next");
const bookingCard = $("#booking-card");
const profileDialog = $("#profile-dialog");
const profileContent = $("#profile-content");
const profilePhoneInput = $("#profile-phone");
const profileError = $("#profile-error");
const profileToggle = $("#profile-toggle");
const masterDialog = $("#master-dialog");
const masterDetailBody = $("#master-detail-body");
const masterDialogTitle = $("#master-dialog-title");
const colorsDialog = $("#colors-dialog");
const paletteGrid = $("#palette-grid");
const toast = $("#toast");
const menuToggle = $("#menu-toggle");
const mainNav = $("#main-nav");
const navBackdrop = $("#nav-backdrop");
const siteHeader = $("#site-header");
const summaryService = $("#summary-service");
const summaryMaster = $("#summary-master");
const summaryDatetime = $("#summary-datetime");
const summaryPrice = $("#summary-price");
const selectedDayLabel = $("#selected-day-label");
const recommendationLabel = $("#recommendation-label");
const profileCount = $("#profile-count");

const pickers = {
  service: { field: $("#service-picker"), input: serviceSelect, trigger: serviceTrigger, options: serviceOptions },
  master: { field: $("#master-picker"), input: masterSelect, trigger: masterTrigger, options: masterOptions }
};

let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let toastTimer = 0;
const dialogInvokers = new WeakMap();

/* --------------------------------------------------------------------------
   Услуги и мастера
   -------------------------------------------------------------------------- */

function renderServices() {
  serviceList.innerHTML = SERVICES.map((service, index) => `
    <li class="service-row">
      <span class="service-index" aria-hidden="true">0${index + 1}</span>
      <div class="service-main">
        <h3 class="service-name">${escapeHtml(service.name)}</h3>
        <p class="service-description">${escapeHtml(service.description)}</p>
      </div>
      <span class="service-duration">${formatDuration(service.duration)}</span>
      <span class="service-price">${formatPrice(service.price)}</span>
      <button class="button button-outline button-small service-action" type="button" data-service="${service.id}" aria-label="Выбрать услугу: ${escapeHtml(service.name)}">
        Выбрать
        <svg class="ui-icon icon-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"></path></svg>
      </button>
    </li>`).join("");

  $$("[data-service]", serviceList).forEach(button => {
    button.addEventListener("click", () => {
      selectService(button.dataset.service);
      setStep(2, { focus: true, scroll: true });
      showToast("Услуга выбрана. Осталось выбрать время.");
    });
  });
}

function starsMarkup(rating) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  const stars = Array.from({ length: 5 }, (_, index) => `
    <svg viewBox="0 0 24 24" aria-hidden="true" class="${index < value ? "is-filled" : ""}">
      <path d="m12 3 2.8 5.7 6.3.9-4.55 4.45 1.08 6.28L12 17.35l-5.63 2.98 1.08-6.28L2.9 9.6l6.3-.9L12 3Z"></path>
    </svg>`).join("");
  return `<span class="stars" aria-hidden="true">${stars}</span>`;
}

function masterRating(master) {
  const local = loadReviews().filter(review => review.target === "master" && review.master === master.id);
  const all = [
    ...master.reviews.map(review => ({ rating: review.rating })),
    ...local.map(review => ({ rating: review.rating }))
  ];
  if (!all.length) return { average: 0, count: 0 };
  const sum = all.reduce((total, review) => total + review.rating, 0);
  return { average: Math.round((sum / all.length) * 10) / 10, count: all.length };
}

function renderMasters() {
  teamGrid.innerHTML = MASTERS.map((master, index) => {
    const rating = masterRating(master);
    const ratingLabel = rating.count
      ? `${rating.average.toFixed(1)} · ${rating.count} ${plural(rating.count, "отзыв", "отзыва", "отзывов")}`
      : "Пока без отзывов";
    return `
      <article class="master-card">
        <button class="master-card-button" type="button" data-master="${master.id}" aria-haspopup="dialog" aria-controls="master-dialog" aria-label="О мастере ${escapeHtml(master.name)}">
          <span class="master-portrait portrait-${index + 1}">
            <span class="master-initial" aria-hidden="true">${escapeHtml(master.name.charAt(0))}</span>
            <svg class="master-flower" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3v34M3 20h34M8 8l24 24M32 8 8 32"></path><circle cx="20" cy="20" r="3"></circle></svg>
          </span>
          <span class="master-info">
            <span class="master-card-body">
              <strong class="master-name">${escapeHtml(master.name)}</strong>
              <span class="master-specialty">${escapeHtml(master.specialty)}</span>
              <span class="master-rating">${starsMarkup(rating.average)}<span>${ratingLabel}</span></span>
            </span>
            <span class="master-more" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"></path></svg>
            </span>
          </span>
        </button>
      </article>`;
  }).join("");

  $$("[data-master]", teamGrid).forEach(button => {
    button.addEventListener("click", () => openMasterDialog(button.dataset.master, button));
  });
}

/* --------------------------------------------------------------------------
   Выбор услуги и мастера
   -------------------------------------------------------------------------- */

function renderPickers() {
  const service = serviceById(state.serviceId) || SERVICES[0];
  const master = masterById(state.masterId) || MASTERS[0];

  $("#service-value").textContent = service.name;
  $("#service-meta").textContent = `${formatPrice(service.price)} · ${formatDuration(service.duration)}`;
  $("#master-value").textContent = master.name;
  $("#master-meta").textContent = master.specialty;
  $("#master-avatar").textContent = master.name.charAt(0);

  serviceOptions.innerHTML = SERVICES.map(item => `
    <button class="picker-option picker-option-service${item.id === service.id ? " is-selected" : ""}" type="button" role="option" aria-selected="${item.id === service.id}" tabindex="-1" data-service-option="${item.id}">
      <span class="picker-option-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description)}</small></span>
      <span class="picker-option-meta"><strong>${formatPrice(item.price)}</strong><small>${item.duration} мин</small></span>
      <span class="picker-check" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-8"></path></svg></span>
    </button>`).join("");

  masterOptions.innerHTML = MASTERS.map(item => `
    <button class="picker-option picker-option-master${item.id === master.id ? " is-selected" : ""}" type="button" role="option" aria-selected="${item.id === master.id}" tabindex="-1" data-master-option="${item.id}">
      <span class="picker-option-avatar" aria-hidden="true">${escapeHtml(item.name.charAt(0))}</span>
      <span class="picker-option-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.specialty)}</small></span>
      <span class="picker-check" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-8"></path></svg></span>
    </button>`).join("");

  $$("[data-service-option]", serviceOptions).forEach(option => {
    option.addEventListener("click", () => {
      selectService(option.dataset.serviceOption);
      closePicker("service", true);
    });
  });

  $$("[data-master-option]", masterOptions).forEach(option => {
    option.addEventListener("click", () => {
      selectMaster(option.dataset.masterOption);
      closePicker("master", true);
    });
  });

  renderRecommendation();
}

function renderRecommendation() {
  const recommended = serviceById(state.serviceId)?.master;
  recommendationLabel.textContent = state.masterId === recommended && !state.masterTouched ? "Рекомендуем" : "Вы выбрали";
}

function selectService(id) {
  const service = serviceById(id);
  if (!service) return;
  state.serviceId = service.id;
  if (!state.masterTouched) state.masterId = service.master;
  serviceSelect.value = state.serviceId;
  masterSelect.value = state.masterId;
  renderPickers();
  resetSchedule();
}

function selectMaster(id) {
  if (!masterById(id)) return;
  state.masterId = id;
  state.masterTouched = true;
  masterSelect.value = id;
  renderPickers();
  resetSchedule();
}

function resetSchedule() {
  state.date = "";
  state.time = "";
  clearStepError();
  renderDates();
  renderSlots();
  updateSummary();
  updateProgress();
}

function openPicker(type, focusSelected = false) {
  const picker = pickers[type];
  Object.entries(pickers).forEach(([otherType, other]) => {
    if (otherType !== type && other.trigger.getAttribute("aria-expanded") === "true") closePicker(otherType);
  });
  if (picker.trigger.getAttribute("aria-expanded") === "true") return;

  picker.trigger.setAttribute("aria-expanded", "true");
  picker.options.hidden = false;
  picker.options.classList.remove("is-open");
  window.requestAnimationFrame(() => {
    picker.options.classList.add("is-open");
    if (focusSelected) {
      const target = picker.options.querySelector('[aria-selected="true"]') || picker.options.querySelector('[role="option"]');
      target?.focus();
    }
  });
}

function closePicker(type, returnFocus = false) {
  const picker = pickers[type];
  picker.trigger.setAttribute("aria-expanded", "false");
  picker.options.classList.remove("is-open");
  picker.options.hidden = true;
  if (returnFocus) picker.trigger.focus({ preventScroll: true });
}

Object.entries(pickers).forEach(([type, picker]) => {
  picker.trigger.addEventListener("click", () => {
    if (picker.trigger.getAttribute("aria-expanded") === "true") closePicker(type);
    else openPicker(type);
  });

  picker.trigger.addEventListener("keydown", event => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openPicker(type, true);
    }
  });

  picker.options.addEventListener("keydown", event => {
    const options = $$('[role="option"]', picker.options);
    const index = options.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      closePicker(type, true);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      options[(index + direction + options.length) % options.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      options[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      options[options.length - 1]?.focus();
    } else if (event.key === "Tab") {
      closePicker(type);
    }
  });
});

document.addEventListener("pointerdown", event => {
  Object.entries(pickers).forEach(([type, picker]) => {
    if (picker.trigger.getAttribute("aria-expanded") === "true" && !picker.field.contains(event.target)) {
      closePicker(type);
    }
  });
});

serviceSelect.addEventListener("change", () => selectService(serviceSelect.value));
masterSelect.addEventListener("change", () => selectMaster(masterSelect.value));

/* --------------------------------------------------------------------------
   Даты и календарь
   -------------------------------------------------------------------------- */

function syncCalendarMonth() {
  const base = state.date ? keyToDate(state.date) : new Date();
  const date = base || new Date();
  calendarMonth = new Date(date.getFullYear(), date.getMonth(), 1);
}

function renderDates() {
  const range = getDateRange();
  const bookings = loadBookings();
  const master = masterById(state.masterId);
  const service = serviceById(state.serviceId);
  if (!range.length || !master || !service) return;

  const rangeStart = range[0].getTime();
  const rangeEnd = range[range.length - 1].getTime();

  if (state.date) {
    const selectedDate = keyToDate(state.date);
    const valid = selectedDate
      && selectedDate.getTime() >= rangeStart
      && selectedDate.getTime() <= rangeEnd
      && getFreeSlots(master, selectedDate, service.duration, bookings).length > 0;
    if (!valid) {
      state.date = "";
      state.time = "";
    }
  }

  if (state.time && state.date) {
    const selectedDate = keyToDate(state.date);
    if (!selectedDate || !isSlotFree(master, selectedDate, state.time, service.duration, bookings)) {
      state.time = "";
    }
  }

  let windowStart = 0;
  const selectedIndex = state.date ? range.findIndex(date => dateKey(date) === state.date) : -1;
  if (selectedIndex >= 5) windowStart = Math.min(selectedIndex - 4, range.length - 5);
  const visibleDates = range.slice(windowStart, windowStart + 5);

  dateOptions.innerHTML = visibleDates.map(date => {
    const key = dateKey(date);
    const free = getFreeSlots(master, date, service.duration, bookings).length;
    const works = master.days.includes(date.getDay());
    const selected = key === state.date;
    const status = !works ? "Вых." : free ? formatDayStatus(free) : "Нет мест";
    const spokenStatus = !works ? "выходной" : free ? formatDayStatus(free).toLowerCase() : "нет мест";
    const classes = [
      "date-option",
      selected ? "is-selected" : "",
      !works ? "is-closed" : "",
      works && !free ? "is-full" : ""
    ].filter(Boolean).join(" ");
    return `
      <button class="${classes}" type="button" data-date="${key}" aria-pressed="${selected}" aria-label="${formatLongDate(date)}, ${spokenStatus}" ${!works || !free ? "disabled" : ""}>
        <span class="date-weekday">${weekdayShort.format(date).replace(".", "")}</span>
        <span class="date-day">${date.getDate()}</span>
        <span class="date-month">${monthShort.format(date).replace(".", "")}</span>
        <span class="date-status">${status}</span>
      </button>`;
  }).join("");

  if (calendarPicker && !calendarPicker.hidden) renderCalendar();
  updateProgress();
}

function renderCalendar() {
  const range = getDateRange();
  const master = masterById(state.masterId);
  const service = serviceById(state.serviceId);
  const bookings = loadBookings();
  if (!range.length || !master || !service) return;

  const minMonth = new Date(range[0].getFullYear(), range[0].getMonth(), 1);
  const maxMonth = new Date(range[range.length - 1].getFullYear(), range[range.length - 1].getMonth(), 1);
  if (calendarMonth < minMonth) calendarMonth = minMonth;
  if (calendarMonth > maxMonth) calendarMonth = maxMonth;

  calendarTitle.textContent = capitalize(monthYear.format(calendarMonth));
  calendarPrev.disabled = calendarMonth.getTime() <= minMonth.getTime();
  calendarNext.disabled = calendarMonth.getTime() >= maxMonth.getTime();

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rangeStart = range[0].getTime();
  const rangeEnd = range[range.length - 1].getTime();

  const cells = Array.from({ length: firstWeekday }, () => '<span class="calendar-blank" aria-hidden="true"></span>');

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = dateKey(date);
    const inRange = date.getTime() >= rangeStart && date.getTime() <= rangeEnd;
    const works = master.days.includes(date.getDay());
    const free = inRange && works ? getFreeSlots(master, date, service.duration, bookings).length : 0;
    const busy = inRange && works ? busyIntervals(master, date, bookings).length : 0;
    const selected = key === state.date;
    const canSelect = inRange && works && free > 0;
    const status = !inRange ? "" : !works ? "выходной" : free ? formatDayStatus(free) : "нет мест";
    const classes = [
      "calendar-day",
      selected ? "is-selected" : "",
      free ? "has-free" : "",
      busy ? "has-busy" : "",
      inRange && !works ? "is-closed" : ""
    ].filter(Boolean).join(" ");
    const label = inRange
      ? `${formatLongDate(date)}${status ? `, ${status}` : ""}`
      : `${formatLongDate(date)}, вне окна записи`;
    cells.push(`
      <button class="${classes}" type="button" data-date="${key}" aria-pressed="${selected}" aria-label="${label}" ${canSelect ? "" : "disabled"}>
        <span class="calendar-day-number">${day}</span>
        ${status ? `<span class="calendar-day-status">${free ? free : ""}</span>` : ""}
      </button>`);
  }

  calendarGrid.innerHTML = cells.join("");
}

function chooseDate(key) {
  const date = keyToDate(key);
  if (!date) return;
  state.date = key;
  state.time = "";
  clearStepError();
  renderDates();
  renderSlots();
  updateSummary();
  closeCalendar();
  window.requestAnimationFrame(() => {
    const firstSlot = slotOptions.querySelector("button:not(:disabled)");
    if (firstSlot) firstSlot.focus({ preventScroll: true });
    else slotsEmpty.focus({ preventScroll: true });
  });
}

function openCalendar() {
  syncCalendarMonth();
  calendarPicker.hidden = false;
  calendarToggle.setAttribute("aria-expanded", "true");
  calendarToggleText.textContent = "Скрыть календарь";
  renderCalendar();
}

function closeCalendar() {
  calendarPicker.hidden = true;
  calendarToggle.setAttribute("aria-expanded", "false");
  calendarToggleText.textContent = "Выбрать другую дату";
}

dateOptions.addEventListener("click", event => {
  const button = event.target.closest("button[data-date]");
  if (button && !button.disabled) chooseDate(button.dataset.date);
});

calendarGrid.addEventListener("click", event => {
  const button = event.target.closest("button[data-date]");
  if (button && !button.disabled) chooseDate(button.dataset.date);
});

calendarToggle.addEventListener("click", () => {
  if (calendarToggle.getAttribute("aria-expanded") === "true") closeCalendar();
  else openCalendar();
});

calendarPrev.addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
  renderCalendar();
});

calendarNext.addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
  renderCalendar();
});

/* --------------------------------------------------------------------------
   Время
   -------------------------------------------------------------------------- */

function renderSlots() {
  const date = state.date ? keyToDate(state.date) : null;
  const master = masterById(state.masterId);
  const service = serviceById(state.serviceId);
  const bookings = loadBookings();

  if (!date || !master || !service) {
    slotOptions.replaceChildren();
    slotsEmpty.hidden = false;
    slotsEmpty.textContent = "Сначала выберите дату — свободное время появится здесь.";
    selectedDayLabel.textContent = "дата не выбрана";
    state.time = "";
    updateProgress();
    return;
  }

  const allSlots = getAllSlots(master, date, service.duration, bookings);
  const freeSlots = getFreeSlots(master, date, service.duration, bookings);
  const demoBusy = demoBusyIntervals(master, date);
  const saved = bookings.filter(booking => booking.master === master.id && booking.date === state.date);

  if (state.time && !freeSlots.includes(state.time)) state.time = "";

  selectedDayLabel.textContent = formatLongDate(date).toLowerCase();
  slotOptions.innerHTML = allSlots.map(time => {
    const free = freeSlots.includes(time);
    const savedBooking = saved.find(booking => booking.time === time);
    const isOwn = savedBooking && currentProfile && savedBooking.phone === currentProfile.phone;
    const demo = !savedBooking && overlaps(toMinutes(time), toMinutes(time) + service.duration, demoBusy);
    const label = savedBooking ? (isOwn ? "Ваша запись" : "Занято") : demo ? "Занято · пример" : "Свободно";
    const selected = free && state.time === time;
    return `
      <button class="slot-option ${free ? "is-free" : "is-busy"}${selected ? " is-selected" : ""}" type="button" data-time="${time}" aria-pressed="${selected}" aria-label="${time}, ${label.toLowerCase()}" ${free ? "" : "disabled"}>
        <span class="slot-time">${time}</span>
        <span class="slot-status">${label}</span>
      </button>`;
  }).join("");

  if (!allSlots.length) {
    slotsEmpty.hidden = false;
    slotsEmpty.textContent = "На эту дату мастер не принимает. Выберите другой день.";
  } else if (!freeSlots.length) {
    slotsEmpty.hidden = false;
    slotsEmpty.textContent = "На эту дату всё занято. Выберите другое время или день.";
  } else {
    slotsEmpty.hidden = true;
  }

  updateProgress();
}

slotOptions.addEventListener("click", event => {
  const button = event.target.closest("button[data-time]");
  if (!button || button.disabled) return;
  state.time = button.dataset.time;
  clearStepError();
  renderSlots();
  slotOptions.querySelector(`[data-time="${state.time}"]`)?.focus({ preventScroll: true });
  updateSummary();
  updateProgress();
});

/* --------------------------------------------------------------------------
   Итог и шаги
   -------------------------------------------------------------------------- */

function updateSummary() {
  const service = serviceById(state.serviceId) || SERVICES[0];
  const master = masterById(state.masterId) || MASTERS[0];
  const date = state.date ? keyToDate(state.date) : null;
  summaryService.textContent = service.name;
  summaryMaster.textContent = master.name;
  summaryDatetime.textContent = date && state.time ? `${formatShortDate(date)}, ${state.time}` : "Выберите дату и время";
  summaryPrice.textContent = `${formatPrice(service.price)} · ${formatDuration(service.duration)}`;
}

function updateProgress() {
  progressSteps.forEach(button => {
    const step = Number(button.dataset.step);
    button.classList.toggle("is-active", step === state.step);
    button.classList.toggle("is-complete", step < state.step);
    if (step === state.step) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
    button.disabled = step === 3 ? !(state.date && state.time) : false;
  });
  stepBack.hidden = state.step === 1;
  stepNext.hidden = state.step === 3;
  submitButton.hidden = state.step !== 3;
}

function setStep(step, options = {}) {
  const { focus = true, scroll = false, validate = true } = options;
  if (step < 1 || step > 3) return false;
  if (step > state.step && validate && !validateStep(state.step)) return false;

  state.step = step;
  [step1, step2, step3].forEach((section, index) => {
    const isCurrent = index + 1 === step;
    section.hidden = !isCurrent;
    section.classList.toggle("is-active", isCurrent);
  });
  updateProgress();
  clearFormError();

  if (scroll) scrollToBooking();
  if (focus) $(`#step-${step}-title`)?.focus({ preventScroll: true });
  return true;
}

function validateStep(step) {
  if (step === 1) return true;
  if (step !== 2) return true;

  if (!state.date) {
    showStepError("Выберите дату — без неё нельзя подобрать время.");
    dateOptions.querySelector("button:not(:disabled)")?.focus();
    return false;
  }
  if (!state.time) {
    showStepError("Выберите свободное время.");
    slotOptions.querySelector("button:not(:disabled)")?.focus();
    return false;
  }

  const date = keyToDate(state.date);
  const master = masterById(state.masterId);
  const service = serviceById(state.serviceId);
  if (!date || !master || !service || !isSlotFree(master, date, state.time, service.duration, loadBookings())) {
    state.time = "";
    renderSlots();
    updateSummary();
    showStepError("Это время уже заняли. Выберите другое.");
    return false;
  }

  clearStepError();
  return true;
}

function scrollToBooking() {
  bookingCard.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start"
  });
}

stepNext.addEventListener("click", () => setStep(state.step + 1, { focus: true }));
stepBack.addEventListener("click", () => setStep(state.step - 1, { focus: true, validate: false }));

progressSteps.forEach(button => {
  button.addEventListener("click", () => {
    const step = Number(button.dataset.step);
    if (step === state.step) return;
    if (step > state.step) setStep(step, { focus: true });
    else setStep(step, { focus: true, validate: false });
  });
});

/* --------------------------------------------------------------------------
   Ошибки формы
   -------------------------------------------------------------------------- */

function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
  formError.focus({ preventScroll: true });
}

function clearFormError() {
  formError.hidden = true;
  formError.textContent = "";
}

function showStepError(message) {
  stepError.textContent = message;
  stepError.hidden = false;
  stepError.focus({ preventScroll: true });
}

function clearStepError() {
  stepError.hidden = true;
  stepError.textContent = "";
}

function setFieldError(input, element, message) {
  input.setAttribute("aria-invalid", "true");
  element.textContent = message;
  element.hidden = false;
}

function clearFieldError(input, element) {
  input.removeAttribute("aria-invalid");
  element.textContent = "";
  element.hidden = true;
}

nameInput.addEventListener("input", () => {
  clearFieldError(nameInput, nameError);
  clearFormError();
});

phoneInput.addEventListener("input", () => {
  formatPhoneInput(phoneInput);
  clearFieldError(phoneInput, phoneError);
  clearFormError();
});
phoneInput.addEventListener("keydown", event => clearPhonePrefix(event, phoneInput));
phoneInput.addEventListener("blur", () => formatPhoneInput(phoneInput));
consent.addEventListener("change", () => {
  if (consent.checked) consent.removeAttribute("aria-invalid");
  clearFormError();
});

/* --------------------------------------------------------------------------
   Отправка записи
   -------------------------------------------------------------------------- */

form.addEventListener("submit", event => {
  event.preventDefault();
  if (state.step !== 3) {
    setStep(state.step + 1, { focus: true });
    return;
  }

  clearFormError();
  clearFieldError(nameInput, nameError);
  clearFieldError(phoneInput, phoneError);

  const name = nameInput.value.trim().replace(/\s+/g, " ");
  const phone = normalizePhone(phoneInput.value);
  const letters = name.match(/\p{L}/gu) || [];
  const problems = [];

  if (letters.length < 2) {
    setFieldError(nameInput, nameError, "Укажите имя минимум из двух букв.");
    problems.push(nameInput);
  }
  if (!phone) {
    setFieldError(phoneInput, phoneError, "Нужен российский номер из 11 цифр, начиная с +7.");
    problems.push(phoneInput);
  }
  if (!consent.checked) {
    consent.setAttribute("aria-invalid", "true");
    problems.push(consent);
  }

  if (problems.length) {
    const message = consent.checked === false && problems[0] === consent
      ? "Подтвердите, что понимаете условия демо-записи."
      : "Проверьте выделенные поля.";
    showFormError(message);
    problems[0].focus({ preventScroll: false });
    return;
  }

  const date = keyToDate(state.date);
  const master = masterById(state.masterId);
  const service = serviceById(state.serviceId);
  if (!date || !master || !service || !isSlotFree(master, date, state.time, service.duration, loadBookings())) {
    setStep(2, { focus: true, validate: false });
    state.time = "";
    renderSlots();
    updateSummary();
    showStepError("Это время только что заняли. Выберите другое.");
    return;
  }

  const booking = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    service: service.id,
    master: master.id,
    date: state.date,
    time: state.time,
    name,
    phone,
    createdAt: new Date().toISOString()
  };

  if (!saveBookings([...loadBookings(), booking])) {
    showFormError("Браузер не разрешил сохранить запись. Проверьте настройки хранения сайта.");
    return;
  }

  currentProfile = saveProfile(name, phone);
  consent.removeAttribute("aria-invalid");
  updateProfileCount();

  form.hidden = true;
  success.hidden = false;
  successSummary.textContent = `${service.name} · ${master.name} · ${formatShortDate(date)}, ${state.time} · ${formatPrice(service.price)}`;
  success.focus({ preventScroll: true });
  showToast("Демо-запись сохранена в этом браузере.");
});

function restartBooking() {
  form.reset();
  state.serviceId = SERVICES[0].id;
  state.masterId = SERVICES[0].master;
  state.masterTouched = false;
  state.date = "";
  state.time = "";
  state.step = 1;

  clearFormError();
  clearStepError();
  clearFieldError(nameInput, nameError);
  clearFieldError(phoneInput, phoneError);
  consent.removeAttribute("aria-invalid");
  closeCalendar();

  success.hidden = true;
  form.hidden = false;

  serviceSelect.value = state.serviceId;
  masterSelect.value = state.masterId;
  renderPickers();
  renderDates();
  renderSlots();
  updateSummary();
  setStep(1, { focus: false });
  scrollToBooking();
  $("#step-1-title").focus({ preventScroll: true });
}

$("#restart-booking").addEventListener("click", restartBooking);
$("#open-my-bookings").addEventListener("click", () => openProfile(profileToggle));

/* --------------------------------------------------------------------------
   Профиль и записи
   -------------------------------------------------------------------------- */

function updateProfileCount() {
  currentProfile = loadProfile();
  const phone = currentProfile?.phone || "";
  const count = phone ? loadBookings().filter(booking => booking.phone === phone).length : 0;
  profileCount.textContent = String(count);
  profileCount.setAttribute("aria-label", `Сохранённых записей: ${count}`);
}

function sortBookings(bookings) {
  const upcoming = bookings.filter(booking => !bookingHasPassed(booking))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const past = bookings.filter(booking => bookingHasPassed(booking))
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  return [...upcoming, ...past];
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function ratingStarsMarkup(rating) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `<span class="review-stars" aria-label="Оценка: ${value} из 5">${Array.from({ length: 5 }, (_, index) => `
    <svg viewBox="0 0 24 24" aria-hidden="true" class="${index < value ? "is-filled" : ""}"><path d="m12 3 2.8 5.7 6.3.9-4.55 4.45 1.08 6.28L12 17.35l-5.63 2.98 1.08-6.28L2.9 9.6l6.3-.9L12 3Z"></path></svg>`).join("")}</span>`;
}

function renderProfile() {
  currentProfile = loadProfile();
  const phone = currentProfile?.phone || "";
  const bookings = phone ? loadBookings().filter(booking => booking.phone === phone) : [];
  const reviews = loadReviews();

  profilePhoneInput.value = phone ? displayPhone(phone) : "";
  profileError.hidden = true;
  profileContent.replaceChildren();

  if (!phone) {
    profileContent.append(makeElement("p", "profile-empty", "Здесь появятся ваши записи. Если вы уже записывались в этом браузере, введите телефон ниже."));
    updateProfileCount();
    return;
  }

  const person = makeElement("div", "profile-person");
  const avatar = makeElement("span", "profile-avatar");
  avatar.setAttribute("aria-hidden", "true");
  avatar.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 20c.7-3.5 3.2-5.3 7-5.3s6.3 1.8 7 5.3"></path></svg>';
  const identity = makeElement("div");
  identity.append(makeElement("strong", "", currentProfile?.name || "Ваш профиль"));
  identity.append(makeElement("span", "", displayPhone(phone)));
  person.append(avatar, identity);
  profileContent.append(person);

  if (!bookings.length) {
    profileContent.append(makeElement("p", "profile-empty", "Записей с этим номером пока нет. Оформите демо-запись, и она появится здесь."));
  }

  sortBookings(bookings).forEach(booking => {
    profileContent.append(buildBookingCard(booking, reviews));
  });

  const newBooking = makeElement("a", "button button-small profile-new-booking", "Новая запись");
  newBooking.href = "#booking";
  newBooking.addEventListener("click", event => {
    event.preventDefault();
    closeDialog(profileDialog);
    window.requestAnimationFrame(() => {
      scrollToBooking();
      setStep(1, { focus: false });
      $("#step-1-title").focus({ preventScroll: true });
    });
  });
  profileContent.append(newBooking);
  updateProfileCount();
}

function buildBookingCard(booking, reviews) {
  const service = serviceById(booking.service);
  const master = masterById(booking.master);
  const passed = bookingHasPassed(booking);
  const review = reviews.find(item => item.bookingId === booking.id);
  const card = makeElement("article", "profile-booking");

  const head = makeElement("div", "profile-booking-head");
  head.append(makeElement("h3", "", service ? service.name : "Демо-услуга"));
  head.append(makeElement("span", `profile-status${passed ? " is-past" : ""}`, passed ? "Прошла" : "Предстоит"));
  card.append(head);
  card.append(makeElement("p", "profile-meta", `${master ? master.name : "Мастер"} · ${service ? formatPrice(service.price) : "—"}`));

  const start = bookingStart(booking);
  const time = document.createElement("time");
  time.className = "profile-time";
  time.dateTime = `${booking.date}T${booking.time}`;
  time.textContent = start ? `${formatLongDate(start)}, ${booking.time}` : `${booking.date}, ${booking.time}`;
  card.append(time);

  if (!passed) {
    const actions = makeElement("div", "profile-actions");
    const cancel = makeElement("button", "cancel-button", "Отменить запись");
    cancel.type = "button";
    cancel.addEventListener("click", () => renderCancelConfirm(actions, booking));
    actions.append(cancel);
    card.append(actions);
  }

  card.append(buildReviewPanel(booking, master, passed, review));
  return card;
}

function buildReviewPanel(booking, master, passed, review) {
  const panel = makeElement("div", "booking-review");
  if (review) {
    panel.classList.add("has-review");
    panel.append(makeElement("strong", "", review.target === "master" ? `Отзыв о мастере ${master?.name || ""}` : "Отзыв о студии"));
    const stars = document.createElement("span");
    stars.innerHTML = ratingStarsMarkup(review.rating);
    panel.append(stars.firstElementChild);
    panel.append(makeElement("p", "", review.text));
    return panel;
  }

  if (!passed) {
    panel.append(makeElement("p", "review-after-visit", "Оставить отзыв можно после визита."));
    return panel;
  }

  const reveal = makeElement("button", "button button-outline button-small review-start", "Оставить отзыв");
  reveal.type = "button";
  const reviewForm = document.createElement("form");
  reviewForm.className = "profile-review-form";
  reviewForm.dataset.bookingId = booking.id;
  reviewForm.hidden = true;
  reviewForm.innerHTML = `
    <label>Кому адресован отзыв
      <select name="target">
        <option value="salon">Салону «Blik»</option>
        <option value="master">Мастеру ${escapeHtml(master?.name || "")}</option>
      </select>
    </label>
    <label>Оценка
      <select name="rating">
        <option value="5">5 · отлично</option>
        <option value="4">4 · хорошо</option>
        <option value="3">3 · нормально</option>
        <option value="2">2 · плохо</option>
        <option value="1">1 · очень плохо</option>
      </select>
    </label>
    <label>Ваш отзыв
      <textarea name="text" rows="3" maxlength="500" minlength="5" placeholder="Расскажите о впечатлениях от визита" required></textarea>
    </label>
    <button class="button button-small" type="submit">Сохранить отзыв</button>`;

  reveal.addEventListener("click", () => {
    reveal.hidden = true;
    reviewForm.hidden = false;
    reviewForm.querySelector("textarea")?.focus();
  });

  panel.append(reveal, reviewForm);
  return panel;
}

function renderCancelConfirm(actions, booking) {
  actions.replaceChildren();
  const box = makeElement("div", "cancel-confirm");
  box.append(makeElement("span", "", "Отменить запись?"));
  const yes = makeElement("button", "button button-small", "Да, отменить");
  yes.type = "button";
  yes.addEventListener("click", () => cancelBooking(booking.id));
  const no = makeElement("button", "button button-outline button-small", "Оставить");
  no.type = "button";
  no.addEventListener("click", renderProfile);
  box.append(yes, no);
  actions.append(box);
}

function cancelBooking(id) {
  const bookings = loadBookings();
  const booking = bookings.find(item => item.id === id);
  if (!booking) return;
  const wasSuccess = !success.hidden;
  saveBookings(bookings.filter(item => item.id !== id));
  saveReviews(loadReviews().filter(item => item.bookingId !== id));
  if (wasSuccess) {
    success.hidden = true;
    form.hidden = false;
    setStep(1, { focus: false });
  }
  renderProfile();
  renderMasters();
  renderDates();
  renderSlots();
  updateSummary();
  $("#profile-close").focus({ preventScroll: true });
  showToast("Демо-запись отменена — слот снова свободен.");
}

profileContent.addEventListener("submit", event => {
  const reviewForm = event.target.closest(".profile-review-form");
  if (!reviewForm) return;
  event.preventDefault();

  const booking = loadBookings().find(item => item.id === reviewForm.dataset.bookingId);
  if (!booking || !bookingHasPassed(booking)) return;

  const textField = reviewForm.querySelector('[name="text"]');
  const text = textField.value.trim();
  if (text.length < 5) {
    textField.setCustomValidity("Напишите хотя бы несколько слов.");
    reviewForm.reportValidity();
    textField.addEventListener("input", () => textField.setCustomValidity(""), { once: true });
    return;
  }

  const review = {
    bookingId: booking.id,
    target: reviewForm.elements.target.value,
    rating: Number(reviewForm.elements.rating.value),
    text,
    master: booking.master,
    name: booking.name,
    createdAt: new Date().toISOString()
  };

  const reviews = loadReviews().filter(item => item.bookingId !== booking.id);
  if (!saveReviews([...reviews, review])) {
    reviewForm.append(makeElement("p", "field-error", "Не удалось сохранить отзыв в этом браузере."));
    return;
  }

  renderProfile();
  renderMasters();
  $("#profile-close").focus({ preventScroll: true });
  showToast("Спасибо! Отзыв сохранён в этом браузере.");
});

const profileLookup = $("#profile-lookup");
profileLookup.addEventListener("submit", event => {
  event.preventDefault();
  const phone = normalizePhone(profilePhoneInput.value);
  if (!phone) {
    profileError.textContent = "Введите российский номер из 11 цифр, начиная с +7.";
    profileError.hidden = false;
    profilePhoneInput.focus();
    return;
  }
  profileError.hidden = true;
  const matches = loadBookings().filter(booking => booking.phone === phone);
  if (!matches.length) {
    profileContent.replaceChildren(makeElement("p", "profile-empty", "Записей с этим номером в браузере не найдено. Проверьте номер или создайте демо-запись."));
    return;
  }
  const latest = matches.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
  saveProfile(latest.name, phone);
  renderProfile();
  renderSlots();
  renderDates();
  showToast("Записи найдены.");
});

profilePhoneInput.addEventListener("input", () => {
  formatPhoneInput(profilePhoneInput);
  profileError.hidden = true;
});
profilePhoneInput.addEventListener("keydown", event => clearPhonePrefix(event, profilePhoneInput));
profilePhoneInput.addEventListener("blur", () => formatPhoneInput(profilePhoneInput));

/* --------------------------------------------------------------------------
   Диалоги
   -------------------------------------------------------------------------- */

function openDialog(dialog, invoker = document.activeElement) {
  if (dialog.open) return;
  dialogInvokers.set(dialog, invoker);
  document.documentElement.classList.add("modal-open");
  dialog.showModal();
}

function closeDialog(dialog) {
  if (dialog.open) dialog.close();
}

[profileDialog, masterDialog, colorsDialog].forEach(dialog => {
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("modal-open");
    const invoker = dialogInvokers.get(dialog);
    dialogInvokers.delete(dialog);
    if (dialog === profileDialog) profileToggle.setAttribute("aria-expanded", "false");
    if (invoker?.isConnected) invoker.focus({ preventScroll: true });
  });

  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    closeDialog(dialog);
  });

  dialog.addEventListener("click", event => {
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) closeDialog(dialog);
  });
});

function openProfile(invoker) {
  renderProfile();
  profileToggle.setAttribute("aria-expanded", "true");
  openDialog(profileDialog, invoker);
  if (!loadProfile()) profilePhoneInput.focus();
}

profileToggle.addEventListener("click", () => {
  closeMenu();
  openProfile(profileToggle);
});

$("#profile-close").addEventListener("click", () => closeDialog(profileDialog));

function openMasterDialog(masterId, invoker) {
  const master = masterById(masterId);
  if (!master) return;
  const rating = masterRating(master);
  const localReviews = loadReviews().filter(review => review.target === "master" && review.master === master.id);
  const index = masterIndex(master.id);

  masterDialogTitle.textContent = master.name;
  masterDetailBody.innerHTML = `
    <div class="master-detail-intro">
      <span class="master-detail-avatar portrait-${index + 1}" aria-hidden="true">${escapeHtml(master.name.charAt(0))}</span>
      <div class="master-detail-copy">
        <strong class="master-detail-specialty">${escapeHtml(master.specialty)}</strong>
        <span class="master-detail-experience">Опыт работы · ${escapeHtml(master.experience)}</span>
        <span class="master-rating">${starsMarkup(rating.average)}<span>${rating.count ? `${rating.average.toFixed(1)} · ${rating.count} ${plural(rating.count, "отзыв", "отзыва", "отзывов")}` : "Пока без отзывов"}</span></span>
      </div>
    </div>
    <p class="master-detail-bio">${escapeHtml(master.bio)}</p>
    <button class="button master-book-link" type="button" data-book-master="${master.id}">Записаться к ${escapeHtml(master.name)}</button>
    <div class="master-works-heading"><h3>Примеры работ</h3><span>графические демо-иллюстрации</span></div>
    <div class="master-works-grid">${master.works.map(work => `
      <article class="master-work">
        <div class="nail-art ${work.style}" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
        <p>${escapeHtml(work.title)}</p>
      </article>`).join("")}</div>
    <section class="master-reviews">
      <div class="master-works-heading"><h3>Отзывы</h3><span>демо и ваши отзывы</span></div>
      ${renderMasterReviews(master, localReviews)}
    </section>`;

  masterDetailBody.querySelector("[data-book-master]")?.addEventListener("click", () => {
    selectMaster(master.id);
    closeDialog(masterDialog);
    window.requestAnimationFrame(() => {
      setStep(1, { focus: false });
      scrollToBooking();
      $("#step-1-title").focus({ preventScroll: true });
      showToast(`Мастер ${master.name} выбран.`);
    });
  });

  openDialog(masterDialog, invoker);
}

function renderMasterReviews(master, localReviews) {
  const all = [
    ...localReviews.map(review => ({ ...review, own: true })),
    ...master.reviews.map(review => ({ ...review, own: false }))
  ];
  if (!all.length) return '<p class="master-reviews-empty">Пока нет отзывов. После визита здесь появится первое впечатление клиента.</p>';
  return `<div class="master-review-list">${all.map(review => `
    <article class="master-review-card">
      <div class="master-review-meta">
        <strong>${escapeHtml(review.name || "Клиент")}${review.own ? " · ваш отзыв" : ""}</strong>
        ${ratingStarsMarkup(review.rating)}
      </div>
      <p>${escapeHtml(review.text)}</p>
    </article>`).join("")}</div>`;
}

$("#master-close").addEventListener("click", () => closeDialog(masterDialog));

function renderPalette() {
  paletteGrid.innerHTML = COLORS.map(color => `
    <article class="palette-color-card">
      <div class="nail-art ${color.style}" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
      <p>${escapeHtml(color.name)}</p>
    </article>`).join("");
}

$("#show-all-colors").addEventListener("click", () => {
  renderPalette();
  openDialog(colorsDialog, $("#show-all-colors"));
});

$("#colors-close").addEventListener("click", () => closeDialog(colorsDialog));

/* --------------------------------------------------------------------------
   Меню и шапка
   -------------------------------------------------------------------------- */

function openMenu() {
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Закрыть меню");
  mainNav.classList.add("is-open");
  document.documentElement.classList.add("menu-open");
  navBackdrop.hidden = false;
  window.requestAnimationFrame(() => navBackdrop.classList.add("is-visible"));
  window.requestAnimationFrame(() => mainNav.querySelector(".nav-link")?.focus({ preventScroll: true }));
}

function closeMenu() {
  if (menuToggle.getAttribute("aria-expanded") !== "true") return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Открыть меню");
  mainNav.classList.remove("is-open");
  document.documentElement.classList.remove("menu-open");
  navBackdrop.classList.remove("is-visible");
  window.setTimeout(() => {
    if (menuToggle.getAttribute("aria-expanded") !== "true") navBackdrop.hidden = true;
  }, 220);
}

menuToggle.addEventListener("click", () => {
  if (menuToggle.getAttribute("aria-expanded") === "true") closeMenu();
  else openMenu();
});

navBackdrop.addEventListener("click", closeMenu);
mainNav.addEventListener("click", event => {
  if (event.target.closest("a")) closeMenu();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMenu();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) closeMenu();
});

function updateStickyHeader() {
  siteHeader.classList.toggle("is-stuck", window.scrollY > 6);
}

window.addEventListener("scroll", updateStickyHeader, { passive: true });
updateStickyHeader();

/* --------------------------------------------------------------------------
   Подсветка текущего раздела
   -------------------------------------------------------------------------- */

function initScrollSpy() {
  if (!("IntersectionObserver" in window)) return;
  const links = $$(".nav-link");
  const sections = links.map(link => document.getElementById(link.dataset.nav)).filter(Boolean);
  if (!sections.length) return;

  const setCurrent = id => {
    links.forEach(link => {
      if (link.dataset.nav === id) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target.id);
      else visible.delete(entry.target.id);
    });
    const active = sections.find(section => visible.has(section.id));
    setCurrent(active ? active.id : "");
  }, { rootMargin: "-42% 0px -52% 0px", threshold: 0 });

  sections.forEach(section => observer.observe(section));
  window.addEventListener("scroll", () => {
    if (window.scrollY < 120) setCurrent("");
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   Анимация появления
   -------------------------------------------------------------------------- */

function initReveal() {
  if (!("IntersectionObserver" in window) || prefersReducedMotion()) return;
  const items = $$(".section-heading, .service-row, .master-card, .work-card, .contact-details > div");
  items.forEach((item, index) => {
    item.classList.add("will-reveal");
    item.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

  items.forEach(item => observer.observe(item));
  window.setTimeout(() => items.forEach(item => item.classList.add("is-visible")), 1400);
}

/* --------------------------------------------------------------------------
   Тост и синхронизация вкладок
   -------------------------------------------------------------------------- */

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3400);
}

window.addEventListener("storage", event => {
  if (event.key && ![STORAGE.bookings, STORAGE.profile, STORAGE.reviews].includes(event.key)) return;
  currentProfile = loadProfile();
  updateProfileCount();
  renderMasters();
  if (profileDialog.open) renderProfile();
  if (!success.hidden) return;
  renderDates();
  renderSlots();
  updateSummary();
});

/* --------------------------------------------------------------------------
   Запуск
   -------------------------------------------------------------------------- */

renderServices();
renderMasters();
renderPickers();
renderDates();
renderSlots();
updateSummary();
updateProfileCount();
setStep(1, { focus: false });
initScrollSpy();
initReveal();
