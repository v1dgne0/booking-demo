"use strict";

const services = [
  { id: "care", name: "Маникюр без покрытия", description: "Форма, бережный маникюр и масло", duration: 60, price: 1500, master: "alina" },
  { id: "color", name: "Маникюр + однотон", description: "Маникюр и покрытие в один оттенок", duration: 90, price: 2300, master: "mira" },
  { id: "strength", name: "Укрепление + цвет", description: "Выравнивание, укрепление и покрытие", duration: 120, price: 2900, master: "nika" },
  { id: "removal", name: "Снятие + маникюр", description: "Снятие покрытия и чистый маникюр", duration: 90, price: 1900, master: "alina" }
];
const masters = [
  { id: "alina", name: "Алина", days: [1, 2, 3, 4, 5, 6], slots: ["10:00", "12:30", "15:00", "17:30"] },
  { id: "mira", name: "Мира", days: [1, 2, 3, 4, 5], slots: ["11:00", "13:30", "16:00", "18:00"] },
  { id: "nika", name: "Ника", days: [2, 3, 4, 5, 6], slots: ["10:30", "13:00", "15:30", "18:00"] }
];
const STORAGE_KEY = "yagoda-demo-bookings-v1";
const serviceSelect = document.querySelector("#service-select");
const masterSelect = document.querySelector("#master-select");
const dateOptions = document.querySelector("#date-options");
const slotOptions = document.querySelector("#slot-options");
const emptySlots = document.querySelector("#slots-empty");
const form = document.querySelector("#booking-form");
const success = document.querySelector("#booking-success");
const selected = { service: services[0].id, master: services[0].master, date: "", time: "" };

function loadBookings() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data.filter(item => item && item.master && item.date && item.time) : [];
  } catch { return []; }
}
function saveBookings(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); return true; }
  catch { return false; }
}
function formatDate(date) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(date);
}
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function getDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = [];
  for (let offset = 1; offset <= 21; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    result.push(date);
  }
  return result;
}
function dayName(date) {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(date).replace(".", "");
}
function currentService() { return services.find(item => item.id === selected.service); }
function currentMaster() { return masters.find(item => item.id === selected.master); }
function availableSlots(master, date, duration) {
  const weekday = date.getDay();
  if (!master.days.includes(weekday)) return [];
  const bookings = loadBookings();
  // All demo starts are at least 150 minutes apart; duration is capped at 120 minutes.
  return master.slots.filter(time => !bookings.some(item => item.master === master.id && item.date === dateKey(date) && item.time === time));
}
function populateSelects() {
  serviceSelect.innerHTML = services.map(item => `<option value="${item.id}">${item.name} · ${item.price.toLocaleString("ru-RU")} ₽ · ${item.duration} мин</option>`).join("");
  masterSelect.innerHTML = masters.map(item => `<option value="${item.id}">${item.name}</option>`).join("");
  serviceSelect.value = selected.service;
  masterSelect.value = selected.master;
}
function renderServices() {
  const list = document.querySelector("#service-list");
  list.innerHTML = services.map((item, index) => `
    <article class="service-row" role="listitem">
      <span class="service-index">0${index + 1}</span>
      <div><h3 class="service-name">${item.name}</h3><p class="service-description">${item.description}</p></div>
      <span class="service-duration">${item.duration} минут</span>
      <span class="service-price">${item.price.toLocaleString("ru-RU")} ₽</span>
      <button class="button button-small service-action" type="button" data-service="${item.id}" aria-label="Выбрать услугу: ${item.name}">Выбрать <span aria-hidden="true">↗</span></button>
    </article>`).join("");
  list.querySelectorAll("[data-service]").forEach(button => button.addEventListener("click", () => {
    serviceSelect.value = button.dataset.service;
    serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelector("#booking").scrollIntoView({ behavior: "smooth", block: "start" });
    serviceSelect.focus({ preventScroll: true });
  }));
}
function getAvailableDates() {
  const master = currentMaster();
  const service = currentService();
  return getDates().filter(date => availableSlots(master, date, service.duration).length > 0);
}
function renderDates() {
  const dates = getAvailableDates();
  if (!dates.some(date => dateKey(date) === selected.date)) selected.date = dates[0] ? dateKey(dates[0]) : "";
  dateOptions.innerHTML = dates.slice(0, 5).map(date => {
    const key = dateKey(date);
    const active = key === selected.date;
    return `<button class="date-option" type="button" data-date="${key}" aria-pressed="${active}" aria-label="${formatDate(date)}, ${dayName(date)}"><span>${date.getDate()}</span><span>${dayName(date)}</span></button>`;
  }).join("");
  dateOptions.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    clearFormError();
    selected.date = button.dataset.date;
    selected.time = "";
    renderDates();
    renderSlots();
    updateSummary();
  }));
}
function renderSlots() {
  const date = getDates().find(item => dateKey(item) === selected.date);
  const slots = date ? availableSlots(currentMaster(), date, currentService().duration) : [];
  if (!slots.includes(selected.time)) selected.time = slots[0] || "";
  slotOptions.innerHTML = slots.map(time => `<button class="slot-option" type="button" data-time="${time}" aria-pressed="${selected.time === time}">${time}</button>`).join("");
  emptySlots.hidden = slots.length > 0;
  slotOptions.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    clearFormError();
    selected.time = button.dataset.time;
    renderSlots();
    updateSummary();
  }));
}
function renderRecommendation() {
  const recommendedId = currentService().master;
  document.querySelector("#recommendation-label").textContent = selected.master === recommendedId ? "Рекомендуем" : "Вы выбрали";
}
function updateSummary() {
  const service = currentService();
  const master = currentMaster();
  const date = getDates().find(item => dateKey(item) === selected.date);
  document.querySelector("#summary-service").textContent = service.name;
  document.querySelector("#summary-master").textContent = master.name;
  document.querySelector("#summary-datetime").textContent = date && selected.time ? `${formatDate(date)}, ${selected.time}` : "Выберите дату и время";
  document.querySelector("#summary-price").textContent = `${service.price.toLocaleString("ru-RU")} ₽ · ${service.duration} мин`;
}
function clearFormError() {
  document.querySelector("#form-error").hidden = true;
}
function resetTime() {
  clearFormError();
  selected.date = "";
  selected.time = "";
  renderDates();
  renderSlots();
  renderRecommendation();
  updateSummary();
}
serviceSelect.addEventListener("change", () => {
  selected.service = serviceSelect.value;
  selected.master = currentService().master;
  masterSelect.value = selected.master;
  resetTime();
});
masterSelect.addEventListener("change", () => {
  selected.master = masterSelect.value;
  resetTime();
});

const phoneInput = document.querySelector("#client-phone");
phoneInput.addEventListener("input", () => {
  let digits = phoneInput.value.replace(/\D/g, "");
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  else if (digits && !digits.startsWith("7")) digits = `7${digits}`;
  digits = digits.slice(0, 11);
  let formatted = "+7";
  if (digits.length > 1) formatted += ` (${digits.slice(1, 4)}`;
  if (digits.length >= 4) formatted += ")";
  if (digits.length > 4) formatted += ` ${digits.slice(4, 7)}`;
  if (digits.length > 7) formatted += `-${digits.slice(7, 9)}`;
  if (digits.length > 9) formatted += `-${digits.slice(9, 11)}`;
  phoneInput.value = digits.length > 1 ? formatted : (digits ? "+7" : "");
});
function showError(message) {
  const error = document.querySelector("#form-error");
  error.textContent = message;
  error.hidden = false;
  error.focus?.();
}
form.addEventListener("submit", event => {
  event.preventDefault();
  const name = document.querySelector("#client-name").value.trim();
  const digits = phoneInput.value.replace(/\D/g, "");
  if (!selected.date || !selected.time) return showError("Сначала выберите свободную дату и время.");
  if ((name.match(/\p{L}/gu) || []).length < 2) return showError("Укажите имя минимум из двух букв.");
  if (!digits.startsWith("7") || digits.length !== 11) return showError("Проверьте номер: нужен российский номер из 11 цифр, начиная с +7.");
  if (!document.querySelector("#consent").checked) return showError("Подтвердите, что понимаете условия демо-записи.");
  const bookings = loadBookings();
  const conflict = bookings.some(item => item.master === selected.master && item.date === selected.date && item.time === selected.time);
  if (conflict) {
    selected.time = "";
    renderSlots();
    updateSummary();
    return showError("Этот слот уже занят в локальных демо-данных. Выберите другое время.");
  }
  const service = currentService();
  const master = currentMaster();
  const date = getDates().find(item => dateKey(item) === selected.date);
  const booking = { id: `${Date.now()}`, service: service.id, master: master.id, date: selected.date, time: selected.time, name, phone: phoneInput.value, createdAt: new Date().toISOString() };
  if (!saveBookings([...bookings, booking])) return showError("Браузер не разрешил сохранить демо-запись. Проверьте настройки хранения сайта.");
  const dateTime = `${formatDate(date)}, ${selected.time}`;
  document.querySelector("#success-summary").textContent = `${service.name} · ${master.name} · ${dateTime} · ${service.price.toLocaleString("ru-RU")} ₽`;
  form.hidden = true;
  success.hidden = false;
  success.focus();
});
document.querySelector("#restart-booking").addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  success.hidden = true;
  selected.service = services[0].id;
  selected.master = services[0].master;
  selected.date = "";
  selected.time = "";
  populateSelects();
  renderDates();
  renderSlots();
  renderRecommendation();
  updateSummary();
  document.querySelector("#form-error").hidden = true;
  document.querySelector("#booking-title").scrollIntoView({ behavior: "smooth", block: "start" });
  serviceSelect.focus({ preventScroll: true });
});
form.addEventListener("input", clearFormError);
form.addEventListener("change", clearFormError);

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("#main-nav");
menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Открыть меню" : "Закрыть меню");
  nav.classList.toggle("is-open", !isOpen);
});
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Открыть меню");
  nav.classList.remove("is-open");
}));

populateSelects();
renderServices();
renderDates();
renderSlots();
renderRecommendation();
updateSummary();

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealItems = document.querySelectorAll(".section-heading, .service-row, .master-card, .work-card, .booking-card, .contact-details > div");
  revealItems.forEach((item, index) => {
    item.classList.add("will-reveal");
    item.style.setProperty("--reveal-delay", `${(index % 4) * 90}ms`);
  });
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });
  revealItems.forEach(item => revealObserver.observe(item));
}
