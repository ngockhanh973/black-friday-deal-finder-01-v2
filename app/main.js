// Boot and routing for the Price War board. The header, tabs, search and
// filters live in index.html; this file wires them up and swaps the grid,
// Price War, Hall of Shame and detail views on hash changes.
// Routes: #/ (grid), #/war, #/shame, #/deal/<id>.
// A filtered grid can be shared as a link: #/?q=airpods&cat=Tech&min=50.

import { CATEGORIES, STORES, deals, CHECKED_DAY } from "./deals.js";
import { MISSIONS, SORTS, applyFilters, resetFilters, state } from "./filters.js";
import { detailHtml, findDeal, gridHtml } from "./board.js";
import { warHtml } from "./warboard.js";
import { shameHtml } from "./shameboard.js";

const app = document.getElementById("app");
const searchBox = document.getElementById("search");
const categoryRow = document.getElementById("category-chips");
const missionRow = document.getElementById("mission-chips");
const storePick = document.getElementById("store-filter");
const discountPick = document.getElementById("discount-filter");
const sortPick = document.getElementById("sort-select");
const clearBtn = document.getElementById("clear-filters");
const tabLinks = [...document.querySelectorAll(".tab")];

function pressButton(label, active, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip" + (active ? " active" : "");
  b.textContent = label;
  b.setAttribute("aria-pressed", active ? "true" : "false");
  b.addEventListener("click", onClick);
  return b;
}

function buildControls() {
  categoryRow.textContent = "";
  categoryRow.appendChild(pressButton("All", state.category === "All", () => { state.category = "All"; render(); }));
  for (const c of CATEGORIES) {
    categoryRow.appendChild(pressButton(c, state.category === c, () => { state.category = c; render(); }));
  }
  missionRow.textContent = "";
  for (const m of MISSIONS) {
    const active = (m.id === "under-50" && state.maxPrice === 50) ||
      (m.id === "under-100" && state.maxPrice === 100) ||
      (m.id === "gaming-300" && state.maxPrice === 300 && state.category === "Gaming");
    missionRow.appendChild(pressButton(m.label, active, () => { resetFilters(); m.run(); render(); }));
  }
  storePick.textContent = "";
  const allOpt = document.createElement("option");
  allOpt.value = "All";
  allOpt.textContent = "All stores";
  storePick.appendChild(allOpt);
  for (const s of STORES) {
    const o = document.createElement("option");
    o.value = s;
    o.textContent = s;
    storePick.appendChild(o);
  }
  storePick.value = state.store;
  discountPick.value = String(state.minDiscount);
  sortPick.textContent = "";
  for (const s of SORTS) {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = s.label;
    sortPick.appendChild(o);
  }
  sortPick.value = state.sort;
}

function readControls() {
  state.query = searchBox.value.trim();
  if (storePick.value) state.store = storePick.value;
  if (discountPick.value !== "") state.minDiscount = Number(discountPick.value);
  if (sortPick.value) state.sort = sortPick.value;
}

function readHashParams() {
  const hash = location.hash || "#/";
  const q = hash.indexOf("?");
  if (q < 0) return;
  const params = new URLSearchParams(hash.slice(q + 1));
  const cat = params.get("cat");
  if (cat && (cat === "All" || CATEGORIES.includes(cat))) state.category = cat;
  const store = params.get("store");
  if (store && (store === "All" || STORES.includes(store))) state.store = store;
  const min = Number(params.get("min"));
  if (min === 30 || min === 50) state.minDiscount = min;
  const max = Number(params.get("max"));
  if (max === 50 || max === 100 || max === 300) state.maxPrice = max;
  const sort = params.get("sort");
  if (sort && SORTS.some((s) => s.id === sort)) state.sort = sort;
  const query = params.get("q");
  if (query) {
    state.query = query;
    searchBox.value = query;
  }
}

function markTab(hash) {
  const view = hash.startsWith("#/deal/") ? "deal" : hash.startsWith("#/war") ? "war" : hash.startsWith("#/shame") ? "shame" : "grid";
  for (const t of tabLinks) t.classList.toggle("active", t.dataset.view === view);
}

function render() {
  buildControls();
  readControls();
  readHashParams();
  buildControls();
  const hash = location.hash || "#/";
  markTab(hash);
  if (hash.startsWith("#/deal/")) {
    app.innerHTML = detailHtml(findDeal(hash.slice(7).split("?")[0]));
  } else if (hash.startsWith("#/war")) {
    app.innerHTML = warHtml();
  } else if (hash.startsWith("#/shame")) {
    app.innerHTML = shameHtml();
  } else {
    app.innerHTML = gridHtml();
  }
  const shown = hash.startsWith("#/") && !hash.startsWith("#/deal") && !hash.startsWith("#/war") && !hash.startsWith("#/shame")
    ? applyFilters().length
    : deals.length;
  document.getElementById("deal-count").textContent = `${shown} of ${deals.length} deals`;
  window.scrollTo(0, 0);
}

searchBox.addEventListener("input", render);
storePick.addEventListener("change", render);
discountPick.addEventListener("change", render);
sortPick.addEventListener("change", render);
clearBtn.addEventListener("click", () => {
  resetFilters();
  searchBox.value = "";
  discountPick.value = "0";
  render();
});
window.addEventListener("hashchange", render);

document.getElementById("checked-day").textContent = `All prices checked ${CHECKED_DAY} evening`;
render();
