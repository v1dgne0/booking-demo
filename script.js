"use strict";

const services = [
  { id: "care", name: "Маникюр без покрытия", description: "Форма, бережный маникюр и масло", duration: 60, price: 1500, master: "alina" },
  { id: "color", name: "Маникюр + однотон", description: "Маникюр и покрытие в один оттенок", duration: 90, price: 2300, master: "mira" },
  { id: "strength", name: "Укрепление + цвет", description: "Выравнивание, укрепление и покрытие", duration: 120, price: 2900, master: "nika" },
  { id: "removal", name: "Снятие + маникюр", description: "Снятие покрытия и чистый маникюр", duration: 90, price: 1900, master: "alina" }
];
const masters = [
  { id: "alina", name: "Алина", specialty: "Мягкий маникюр · однотон", experience: "6 лет", bio: "Любит чистую форму и спокойные оттенки. Помогает подобрать покрытие, которое удобно носить каждый день.", days: [1, 2, 3, 4, 5, 6], slots: ["10:00", "12:30", "15:00", "17:30"], works: [{ title: "Ягодный глянец", style: "nail-red" }, { title: "Тёплый нюд", style: "nail-nude" }, { title: "Чистая форма", style: "nail-olive" }] },
  { id: "mira", name: "Мира", specialty: "Форма · лаконичный дизайн", experience: "4 года", bio: "Сочетает аккуратную архитектуру ногтя с простыми деталями. Особенно любит нюдовые оттенки и тонкие линии.", days: [1, 2, 3, 4, 5], slots: ["11:00", "13:30", "16:00", "18:00"], works: [{ title: "Тихий нюд", style: "nail-nude" }, { title: "Ягодный акцент", style: "nail-red" }, { title: "Тонкая линия", style: "nail-olive" }] },
  { id: "nika", name: "Ника", specialty: "Укрепление · тонкие детали", experience: "8 лет", bio: "Работает с укреплением и деликатным дизайном. Внимательно относится к комфорту и состоянию натуральных ногтей.", days: [2, 3, 4, 5, 6], slots: ["10:30", "13:00", "15:30", "18:00"], works: [{ title: "Оливковая линия", style: "nail-olive" }, { title: "Мягкий нюд", style: "nail-nude" }, { title: "Вишнёвый цвет", style: "nail-red" }] }
];
const STORAGE_KEY = "yagoda-demo-bookings-v1";
const PROFILE_KEY = "yagoda-demo-profile-v1";
const REVIEWS_KEY = "yagoda-demo-reviews-v1";
const serviceSelect = document.querySelector("#service-select");
const masterSelect = document.querySelector("#master-select");
const dateOptions = document.querySelector("#date-options");
const slotOptions = document.querySelector("#slot-options");
const emptySlots = document.querySelector("#slots-empty");
const form = document.querySelector("#booking-form");
const success = document.querySelector("#booking-success");
const profileDialog = document.querySelector("#profile-dialog");
const profileContent = document.querySelector("#profile-content");
const profilePhoneInput = document.querySelector("#profile-phone");
const profileError = document.querySelector("#profile-error");
const masterDialog = document.querySelector("#master-dialog");
const masterDetailBody = document.querySelector("#master-detail-body");
const calendarTitle = document.querySelector("#calendar-month-title");
const calendarPrev = document.querySelector("#calendar-prev");
const calendarNext = document.querySelector("#calendar-next");
const serviceTrigger = document.querySelector("#service-trigger");
const masterTrigger = document.querySelector("#master-trigger");
const serviceOptions = document.querySelector("#service-options");
const masterOptions = document.querySelector("#master-options");
const pickerConfig = {
  service: { field: document.querySelector("#service-picker"), input: serviceSelect, trigger: serviceTrigger, options: serviceOptions },
  master: { field: document.querySelector("#master-picker"), input: masterSelect, trigger: masterTrigger, options: masterOptions }
};
const selected = { service: services[0].id, master: services[0].master, date: "", time: "" };
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

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
function loadReviews() {
  try {
    const data = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");
    return Array.isArray(data) ? data.filter(item => item && item.bookingId && item.target && item.rating && item.text) : [];
  } catch { return []; }
}
function saveReviews(items) {
  try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(items)); return true; }
  catch { return false; }
}
function normalizedPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  else if (digits.length === 10) digits = `7${digits}`;
  return digits.startsWith("7") && digits.length === 11 ? digits : "";
}
function formattedProfilePhone(value) {
  const digits = normalizedPhone(value);
  return digits ? `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}` : "";
}
function loadProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    if (stored && normalizedPhone(stored.phone)) return { ...stored, phone: normalizedPhone(stored.phone) };
  } catch { /* Use the most recent local booking as the profile. */ }
  const latest = loadBookings().filter(item => normalizedPhone(item.phone)).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];
  return latest ? { name: latest.name || "", phone: normalizedPhone(latest.phone) } : null;
}
function saveProfile(booking) {
  const nextProfile = { name: booking.name, phone: normalizedPhone(booking.phone) };
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile)); } catch { /* Booking data remains available in the history. */ }
  return nextProfile;
}
let currentProfile = loadProfile();
function makeProfileText(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}
function makeProfileAvatar() {
  const avatar = document.createElement("span");
  avatar.className = "profile-avatar";
  avatar.setAttribute("aria-hidden", "true");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "currentColor");
  const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  head.setAttribute("cx", "12");
  head.setAttribute("cy", "7.75");
  head.setAttribute("r", "3.5");
  const shoulders = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shoulders.setAttribute("d", "M4 20c.35-4.15 3.1-6.2 8-6.2s7.65 2.05 8 6.2H4Z");
  icon.append(head, shoulders);
  avatar.append(icon);
  return avatar;
}
function updateProfileButton() {
  const count = document.querySelector("#profile-count");
  const phone = currentProfile ? normalizedPhone(currentProfile.phone) : "";
  const total = phone ? loadBookings().filter(item => normalizedPhone(item.phone) === phone).length : 0;
  count.textContent = String(total);
  count.setAttribute("aria-label", `${total} сохранённых демо-записей`);
}
function renderProfile() {
  currentProfile = loadProfile() || currentProfile;
  const phone = currentProfile ? normalizedPhone(currentProfile.phone) : "";
  const bookings = phone ? loadBookings().filter(item => normalizedPhone(item.phone) === phone) : [];
  profileContent.replaceChildren();
  profilePhoneInput.value = formattedProfilePhone(phone);
  profileError.hidden = true;

  if (!phone) {
    profileContent.append(makeProfileText("p", "profile-empty", "Здесь появятся ваши записи. Если вы уже записывались в этом браузере, введите телефон ниже."));
    updateProfileButton();
    return;
  }

  const profile = document.createElement("div");
  profile.className = "profile-person";
  profile.append(makeProfileAvatar());
  const identity = document.createElement("div");
  identity.append(makeProfileText("strong", "", currentProfile?.name || "Ваш профиль"));
  identity.append(makeProfileText("span", "", "Личные записи в этом браузере"));
  profile.append(identity);
  profileContent.append(profile);

  const reviews = loadReviews();
  const ordered = bookings.sort((a, b) => {
    const pastA = bookingHasPassed(a);
    const pastB = bookingHasPassed(b);
    if (pastA !== pastB) return pastA ? 1 : -1;
    return pastA ? `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`) : `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
  });

  if (!ordered.length) {
    profileContent.append(makeProfileText("p", "profile-empty", "Записей с этим номером пока нет. Оформите демо-запись, и она появится здесь."));
  }

  ordered.forEach(booking => {
    const service = services.find(item => item.id === booking.service);
    const master = masters.find(item => item.id === booking.master);
    const bookingDate = new Date(`${booking.date}T12:00:00`);
    const isPast = bookingHasPassed(booking);
    const card = document.createElement("article");
    card.className = "profile-booking";
    card.append(makeProfileText("h3", "", service ? service.name : "Демо-услуга"));
    card.append(makeProfileText("span", `profile-status${isPast ? " is-past" : ""}`, isPast ? "Прошла" : "Предстоит"));
    card.append(makeProfileText("p", "", `${master ? master.name : "Мастер"} · ${service ? service.price.toLocaleString("ru-RU") : "—"} ₽`));
    const dateTime = document.createElement("time");
    dateTime.dateTime = `${booking.date}T${booking.time}`;
    dateTime.textContent = `${formatDate(bookingDate)} · ${booking.time}`;
    card.append(dateTime);
    appendBookingReview(card, booking, master, isPast, reviews);
    profileContent.append(card);
  });

  const newBooking = document.createElement("a");
  newBooking.className = "button button-small profile-new-booking";
  newBooking.href = "#booking";
  newBooking.textContent = "Новая запись";
  newBooking.addEventListener("click", () => profileDialog.close());
  profileContent.append(newBooking);
  updateProfileButton();
}
function appendBookingReview(card, booking, master, isPast, reviews) {
  const review = reviews.find(item => item.bookingId === booking.id);
  const panel = document.createElement("div");
  panel.className = "booking-review";

  if (review) {
    panel.classList.add("has-review");
    const title = makeProfileText("strong", "", review.target === "master" ? `Отзыв о мастере ${master?.name || ""}` : "Отзыв о салоне");
    const stars = makeProfileText("span", "review-stars", `${"★".repeat(Number(review.rating))}${"☆".repeat(5 - Number(review.rating))}`);
    stars.setAttribute("aria-label", `Оценка: ${review.rating} из 5`);
    panel.append(title, stars, makeProfileText("p", "", review.text));
  } else if (isPast) {
    const reveal = makeProfileText("button", "button button-small review-start", "Оставить отзыв");
    reveal.type = "button";
    const reviewForm = document.createElement("form");
    reviewForm.className = "profile-review-form";
    reviewForm.dataset.bookingId = booking.id;
    reviewForm.hidden = true;
    reviewForm.innerHTML = `
      <label>Кому адресован отзыв
        <select name="target"><option value="salon">Салону «Ягода»</option><option value="master">Мастеру ${master?.name || ""}</option></select>
      </label>
      <label>Оценка
        <select name="rating" required><option value="5">5 · отлично</option><option value="4">4 · хорошо</option><option value="3">3 · нормально</option><option value="2">2 · плохо</option><option value="1">1 · очень плохо</option></select>
      </label>
      <label>Ваш отзыв
        <textarea name="text" rows="3" maxlength="500" minlength="5" placeholder="Расскажите о впечатлениях от визита" required></textarea>
      </label>
      <button class="button button-small" type="submit">Сохранить отзыв</button>`;
    reveal.addEventListener("click", () => {
      reveal.hidden = true;
      reviewForm.hidden = false;
      reviewForm.querySelector("textarea").focus();
    });
    panel.append(reveal, reviewForm);
  } else {
    panel.append(makeProfileText("p", "review-after-visit", "Оставить отзыв можно после визита."));
  }

  card.append(panel);
}
function formatDate(date) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(date);
}
function bookingHasPassed(booking) {
  return new Date(`${booking.date}T${booking.time}:00`).getTime() < Date.now();
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
  const firstDate = new Date(today);
  firstDate.setDate(firstDate.getDate() + 1);
  const lastDate = new Date(today);
  const preferredDay = lastDate.getDate();
  lastDate.setDate(1);
  lastDate.setMonth(lastDate.getMonth() + 3);
  lastDate.setDate(Math.min(preferredDay, new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0).getDate()));
  const result = [];
  for (const date = new Date(firstDate); date <= lastDate; date.setDate(date.getDate() + 1)) {
    result.push(date);
  }
  return result;
}
function monthKey(date) { return `${date.getFullYear()}-${date.getMonth()}`; }
function monthDateLabel(date) {
  return new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(date);
}
function dayName(date) {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(date).replace(".", "");
}
function currentService() { return services.find(item => item.id === selected.service); }
function currentMaster() { return masters.find(item => item.id === selected.master); }
function demoBusySlots(master, date) {
  if (!master.days.includes(date.getDay())) return [];
  const dayNumber = Math.floor(date.getTime() / 86400000);
  const masterIndex = masters.findIndex(item => item.id === master.id);
  return master.slots.filter((time, index) => (dayNumber + masterIndex * 2 + index * 3) % 6 === 0);
}
function busySlots(master, date, bookings = loadBookings()) {
  const actual = bookings
    .filter(item => item.master === master.id && item.date === dateKey(date))
    .map(item => item.time);
  return [...new Set([...demoBusySlots(master, date), ...actual])];
}
function availableSlots(master, date, duration, bookings = loadBookings()) {
  const weekday = date.getDay();
  if (!master.days.includes(weekday)) return [];
  const busy = busySlots(master, date, bookings);
  return master.slots.filter(time => !busy.includes(time));
}
function populateSelects() {
  serviceSelect.value = selected.service;
  masterSelect.value = selected.master;
  renderPickers();
}
function renderPickers() {
  const service = currentService();
  const master = currentMaster();
  document.querySelector("#service-value").textContent = service.name;
  document.querySelector("#service-meta").textContent = `${service.price.toLocaleString("ru-RU")} ₽ · ${service.duration} минут`;
  document.querySelector("#master-value").textContent = master.name;
  document.querySelector("#master-meta").textContent = master.specialty;
  document.querySelector("#master-avatar").textContent = master.name.charAt(0);

  serviceOptions.innerHTML = services.map((item, index) => `
    <button class="picker-option picker-option-service${item.id === service.id ? " is-selected" : ""}" type="button" role="option" aria-selected="${item.id === service.id}" data-service-option="${item.id}">
      <span class="picker-option-copy"><strong>${item.name}</strong><small>${item.description}</small></span>
      <span class="picker-option-meta"><strong>${item.price.toLocaleString("ru-RU")} ₽</strong><small>${item.duration} мин</small></span>
      <span class="picker-check" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-8"></path></svg></span>
    </button>`).join("");
  masterOptions.innerHTML = masters.map(item => `
    <button class="picker-option picker-option-master${item.id === master.id ? " is-selected" : ""}" type="button" role="option" aria-selected="${item.id === master.id}" data-master-option="${item.id}">
      <span class="picker-option-avatar" aria-hidden="true">${item.name.charAt(0)}</span>
      <span class="picker-option-copy"><strong>${item.name}</strong><small>${item.specialty}</small></span>
      <span class="picker-check" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-8"></path></svg></span>
    </button>`).join("");

  serviceOptions.querySelectorAll("[data-service-option]").forEach(option => option.addEventListener("click", () => {
    serviceSelect.value = option.dataset.serviceOption;
    serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
    closePicker("service", true);
  }));
  masterOptions.querySelectorAll("[data-master-option]").forEach(option => option.addEventListener("click", () => {
    masterSelect.value = option.dataset.masterOption;
    masterSelect.dispatchEvent(new Event("change", { bubbles: true }));
    closePicker("master", true);
  }));
}
function closePicker(type, returnFocus = false) {
  const picker = pickerConfig[type];
  picker.trigger.setAttribute("aria-expanded", "false");
  picker.field.classList.remove("is-open");
  picker.options.classList.remove("is-open");
  window.setTimeout(() => {
    if (!picker.options.classList.contains("is-open")) picker.options.hidden = true;
  }, 220);
  if (returnFocus) picker.trigger.focus({ preventScroll: true });
}
function openPicker(type, focusSelected = false) {
  const picker = pickerConfig[type];
  Object.keys(pickerConfig).forEach(other => {
    if (other !== type && pickerConfig[other].trigger.getAttribute("aria-expanded") === "true") closePicker(other);
  });
  if (picker.trigger.getAttribute("aria-expanded") === "true") return;
  picker.trigger.setAttribute("aria-expanded", "true");
  picker.field.classList.add("is-open");
  picker.options.hidden = false;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      picker.options.classList.add("is-open");
      if (focusSelected) picker.options.querySelector('[aria-selected="true"]')?.focus();
    });
  });
}
Object.entries(pickerConfig).forEach(([type, picker]) => {
  picker.trigger.addEventListener("click", () => {
    if (picker.trigger.getAttribute("aria-expanded") === "true") closePicker(type);
    else openPicker(type, false);
  });
  picker.trigger.addEventListener("keydown", event => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openPicker(type, true);
    }
  });
  picker.options.addEventListener("keydown", event => {
    const options = [...picker.options.querySelectorAll('[role="option"]')];
    const index = options.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      closePicker(type, true);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      options[(index + direction + options.length) % options.length]?.focus();
    }
  });
});
document.addEventListener("pointerdown", event => {
  Object.entries(pickerConfig).forEach(([type, picker]) => {
    if (picker.trigger.getAttribute("aria-expanded") === "true" && !picker.field.contains(event.target)) closePicker(type);
  });
});
function renderServices() {
  const list = document.querySelector("#service-list");
  list.innerHTML = services.map(item => `
    <article class="service-row" role="listitem">
      <div><h3 class="service-name">${item.name}</h3><p class="service-description">${item.description}</p></div>
      <span class="service-duration">${item.duration} минут</span>
      <span class="service-price">${item.price.toLocaleString("ru-RU")} ₽</span>
      <button class="button button-small service-action" type="button" data-service="${item.id}" aria-label="Выбрать услугу: ${item.name}">Выбрать <span aria-hidden="true">↗</span></button>
    </article>`).join("");
  list.querySelectorAll("[data-service]").forEach(button => button.addEventListener("click", () => {
    serviceSelect.value = button.dataset.service;
    serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelector("#booking").scrollIntoView({ behavior: "smooth", block: "start" });
    serviceTrigger.focus({ preventScroll: true });
  }));
}
function getAvailableDates() {
  const master = currentMaster();
  const service = currentService();
  const bookings = loadBookings();
  return getDates().filter(date => availableSlots(master, date, service.duration, bookings).length > 0);
}
function renderDates() {
  const dates = getDates();
  const availableDates = getAvailableDates();
  const bookings = loadBookings();
  if (!dates.some(date => dateKey(date) === selected.date && currentMaster().days.includes(date.getDay()))) {
    selected.date = availableDates[0] ? dateKey(availableDates[0]) : "";
  }
  const firstDate = dates[0] || new Date();
  const lastDate = dates[dates.length - 1] || firstDate;
  const minMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
  const maxMonth = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
  if (calendarMonth < minMonth) calendarMonth = minMonth;
  if (calendarMonth > maxMonth) calendarMonth = maxMonth;
  calendarTitle.textContent = monthDateLabel(calendarMonth);
  calendarPrev.disabled = monthKey(calendarMonth) === monthKey(minMonth);
  calendarNext.disabled = monthKey(calendarMonth) === monthKey(maxMonth);

  const firstWeekday = (new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells = [...Array(firstWeekday).fill('<span class="calendar-blank" aria-hidden="true"></span>')];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const key = dateKey(date);
    const isInRange = dates.some(item => dateKey(item) === key);
    const busy = busySlots(currentMaster(), date, bookings);
    const free = availableSlots(currentMaster(), date, currentService().duration, bookings);
    const canSelect = isInRange && currentMaster().days.includes(date.getDay()) && date > today;
    const selectedDay = key === selected.date;
    const status = free.length ? `${free.length} мест` : busy.length ? "занято" : "—";
    const spokenDate = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(date);
    const accessibleStatus = `${spokenDate}, ${free.length ? `${free.length} свободных слота` : "нет свободных слотов"}${busy.length ? `, ${busy.length} занято` : ""}`;
    cells.push(`<button class="date-option${free.length ? " has-free" : ""}${busy.length ? " has-busy" : ""}" type="button" data-date="${key}" aria-pressed="${selectedDay}" aria-label="${accessibleStatus}" title="${accessibleStatus}" ${canSelect ? "" : "disabled"}><span class="calendar-day-number">${day}</span><span class="calendar-day-status">${status}</span></button>`);
  }
  dateOptions.innerHTML = cells.join("");
  dateOptions.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    clearFormError();
    selected.date = button.dataset.date;
    selected.time = "";
    renderDates();
    renderSlots();
    updateSummary();
  }));
}
calendarPrev.addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
  renderDates();
});
calendarNext.addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
  renderDates();
});
function renderSlots() {
  const date = getDates().find(item => dateKey(item) === selected.date);
  const master = currentMaster();
  const bookings = loadBookings();
  const scheduledSlots = date && master.days.includes(date.getDay()) ? master.slots : [];
  const freeSlots = date ? availableSlots(master, date, currentService().duration, bookings) : [];
  const occupiedSlots = date ? busySlots(master, date, bookings) : [];
  if (!freeSlots.includes(selected.time)) selected.time = freeSlots[0] || "";
  slotOptions.innerHTML = scheduledSlots.map(time => {
    const isBusy = occupiedSlots.includes(time);
    const label = isBusy ? `${time}, занято в демо-расписании` : `${time}, свободно`;
    return `<button class="slot-option${isBusy ? " is-busy" : ""}" type="button" data-time="${time}" aria-label="${label}" aria-pressed="${!isBusy && selected.time === time}" ${isBusy ? "disabled" : ""}><span>${time}</span>${isBusy ? "<small>Занято</small>" : ""}</button>`;
  }).join("");
  emptySlots.hidden = freeSlots.length > 0;
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
  renderPickers();
  resetTime();
});
masterSelect.addEventListener("change", () => {
  selected.master = masterSelect.value;
  renderPickers();
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
function showBookingSuccess() {
  const card = success.closest(".booking-card");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const startHeight = card.getBoundingClientRect().height;
  const cardTop = card.getBoundingClientRect().top;
  if (cardTop < 12 || cardTop > 120) {
    card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
  form.hidden = true;
  success.hidden = false;
  if (reduceMotion) {
    success.focus({ preventScroll: true });
    return;
  }
  success.classList.add("is-entering");
  card.style.height = `${startHeight}px`;
  card.classList.add("is-resizing");

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(fallback);
    card.style.height = "";
    card.classList.remove("is-resizing");
    success.focus({ preventScroll: true });
  };
  const onTransitionEnd = event => {
    if (event.target === card && event.propertyName === "height") {
      card.removeEventListener("transitionend", onTransitionEnd);
      finish();
    }
  };
  const fallback = window.setTimeout(finish, 700);
  card.addEventListener("transitionend", onTransitionEnd);
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      card.style.height = `${card.scrollHeight}px`;
      success.classList.remove("is-entering");
    });
  });
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
  const chosenDate = getDates().find(item => dateKey(item) === selected.date);
  const conflict = !chosenDate || !availableSlots(currentMaster(), chosenDate, currentService().duration).includes(selected.time);
  if (conflict) {
    selected.time = "";
    renderSlots();
    updateSummary();
    return showError("Этот слот уже занят в демо-расписании. Выберите другое время.");
  }
  const service = currentService();
  const master = currentMaster();
  const date = getDates().find(item => dateKey(item) === selected.date);
  const booking = { id: `${Date.now()}`, service: service.id, master: master.id, date: selected.date, time: selected.time, name, phone: phoneInput.value, createdAt: new Date().toISOString() };
  if (!saveBookings([...bookings, booking])) return showError("Браузер не разрешил сохранить демо-запись. Проверьте настройки хранения сайта.");
  currentProfile = saveProfile(booking);
  updateProfileButton();
  const dateTime = `${formatDate(date)}, ${selected.time}`;
  document.querySelector("#success-summary").textContent = `${service.name} · ${master.name} · ${dateTime} · ${service.price.toLocaleString("ru-RU")} ₽`;
  showBookingSuccess();
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
  serviceTrigger.focus({ preventScroll: true });
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

const profileToggle = document.querySelector("#profile-toggle");
profileToggle.addEventListener("click", () => {
  if (menuToggle.getAttribute("aria-expanded") === "true") {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть меню");
    nav.classList.remove("is-open");
  }
  renderProfile();
  profileToggle.setAttribute("aria-expanded", "true");
  profileDialog.showModal();
  if (!currentProfile) profilePhoneInput.focus();
});
function closeProfile() {
  if (profileDialog.open) profileDialog.close();
  profileToggle.setAttribute("aria-expanded", "false");
}
function renderMasterDetails(master) {
  document.querySelector("#master-dialog-title").textContent = master.name;
  masterDetailBody.replaceChildren();
  const intro = document.createElement("section");
  intro.className = "master-detail-intro";
  const avatar = document.createElement("span");
  avatar.className = `master-detail-avatar portrait-${masters.indexOf(master) + 1}`;
  avatar.textContent = master.name.charAt(0);
  const copy = document.createElement("div");
  copy.append(makeProfileText("strong", "master-detail-specialty", master.specialty));
  copy.append(makeProfileText("span", "master-detail-experience", `Опыт работы · ${master.experience}`));
  intro.append(avatar, copy);
  masterDetailBody.append(intro, makeProfileText("p", "master-detail-bio", master.bio));

  const worksHeading = document.createElement("div");
  worksHeading.className = "master-works-heading";
  worksHeading.append(makeProfileText("h3", "", "Примеры работ"));
  worksHeading.append(makeProfileText("span", "", "графические демо-иллюстрации"));
  masterDetailBody.append(worksHeading);
  const works = document.createElement("div");
  works.className = "master-works-grid";
  master.works.forEach(work => {
    const item = document.createElement("article");
    item.className = "master-work";
    const art = document.createElement("div");
    art.className = `nail-art ${work.style}`;
    art.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 4; index += 1) art.append(document.createElement("span"));
    item.append(art, makeProfileText("p", "", work.title));
    works.append(item);
  });
  masterDetailBody.append(works);
  const bookingLink = document.createElement("a");
  bookingLink.className = "button button-small master-book-link";
  bookingLink.href = "#booking";
  bookingLink.textContent = "Выбрать мастера";
  bookingLink.addEventListener("click", () => {
    masterDialog.close();
    masterSelect.value = master.id;
    masterSelect.dispatchEvent(new Event("change", { bubbles: true }));
  });
  masterDetailBody.append(bookingLink);
}
document.querySelectorAll("[data-master]").forEach(button => button.addEventListener("click", () => {
  const master = masters.find(item => item.id === button.dataset.master);
  if (!master) return;
  renderMasterDetails(master);
  masterDialog.showModal();
}));
document.querySelector("#master-close").addEventListener("click", () => masterDialog.close());
masterDialog.addEventListener("click", event => {
  if (event.target === masterDialog) masterDialog.close();
});
document.querySelector("#profile-close").addEventListener("click", closeProfile);
profileDialog.addEventListener("close", () => profileToggle.setAttribute("aria-expanded", "false"));
profileDialog.addEventListener("click", event => {
  if (event.target === profileDialog) closeProfile();
});
document.querySelector("#open-my-bookings").addEventListener("click", () => {
  renderProfile();
  profileToggle.setAttribute("aria-expanded", "true");
  profileDialog.showModal();
});
document.querySelector("#profile-lookup").addEventListener("submit", event => {
  event.preventDefault();
  const phone = normalizedPhone(profilePhoneInput.value);
  if (!phone) {
    profileError.textContent = "Введите российский номер из 11 цифр, начиная с +7.";
    profileError.hidden = false;
    profilePhoneInput.focus();
    return;
  }
  const matching = loadBookings().filter(item => normalizedPhone(item.phone) === phone);
  profileError.hidden = true;
  if (!matching.length) {
    profileContent.replaceChildren(makeProfileText("p", "profile-empty", "Записей с этим номером в браузере не найдено. Проверьте номер или создайте демо-запись."));
    return;
  }
  const latest = matching.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];
  currentProfile = saveProfile(latest);
  renderProfile();
});
profilePhoneInput.addEventListener("input", () => { profileError.hidden = true; });
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
    createdAt: new Date().toISOString()
  };
  if (!saveReviews([...loadReviews(), review])) {
    const error = makeProfileText("p", "profile-error", "Не удалось сохранить отзыв в этом браузере.");
    reviewForm.append(error);
    return;
  }
  renderProfile();
});
window.addEventListener("storage", event => {
  if (!event.key || event.key === STORAGE_KEY || event.key === PROFILE_KEY || event.key === REVIEWS_KEY) {
    currentProfile = loadProfile();
    updateProfileButton();
    if (profileDialog.open) renderProfile();
  }
});

populateSelects();
renderServices();
renderDates();
renderSlots();
renderRecommendation();
updateSummary();
updateProfileButton();

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
