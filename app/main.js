// Boot and routing for the Price War board. The header, tabs, search box and
// filter controls live in index.html; this module wires them up and swaps the
// grid, Price War, Hall of Shame and single-deal views when the hash moves.
// Routes are #/ for the grid, #/war, #/shame and #/deal/<id>. A filtered grid
// is shareable as a link, for instance #/?q=airpods&cat=Tech&min=50.

import { CHECKED_DAY, CATEGORIES, STORES, deals } from "./deals.js";
import { SORTS, MISSIONS, state, applyFilters, resetFilters } from "./filters.js";
import { gridHtml, detailHtml, findDeal } from "./board.js";
import { warHtml } from "./warboard.js";
import { shameHtml } from "./shameboard.js";

// Every control this module touches is looked up once, through one table,
// so the ids live in a single place instead of ten scattered statements.
const IDS = [
  ["root", "app"],
  ["search", "search"],
  ["cats", "category-chips"],
  ["missions", "mission-chips"],
  ["store", "store-filter"],
  ["discount", "discount-filter"],
  ["sort", "sort-select"],
  ["clear", "clear-filters"],
  ["count", "deal-count"],
  ["checked", "checked-day"],
];
const el = {};
for (const [key, id] of IDS) el[key] = document.getElementById(id);
const tabLinks = Array.from(document.querySelectorAll(".tab"));

function chipButton(label, on, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = on ? "chip active" : "chip";
  b.textContent = label;
  b.setAttribute("aria-pressed", on ? "true" : "false");
  b.addEventListener("click", onClick);
  return b;
} // chipButton

function paintControls() {
  el.cats.textContent = "";
  el.cats.appendChild(chipButton("All", state.category === "All", () => { state.category = "All"; draw(); }));
  for (const c of CATEGORIES) {
    el.cats.appendChild(chipButton(c, state.category === c, () => { state.category = c; draw(); }));
  }
  el.missions.textContent = "";
  for (const m of MISSIONS) {
    const on = (m.id === "under-50" && state.maxPrice === 50) ||
      (m.id === "under-100" && state.maxPrice === 100) ||
      (m.id === "gaming-300" && state.maxPrice === 300 && state.category === "Gaming");
    el.missions.appendChild(chipButton(m.label, on, () => { resetFilters(); m.run(); draw(); }));
  }
  el.store.textContent = "";
  const allStoresOpt = document.createElement("option");
  allStoresOpt.value = "All";
  allStoresOpt.textContent = "All stores";
  el.store.appendChild(allStoresOpt);
  for (const s of STORES) {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    el.store.appendChild(opt);
  }
  el.store.value = state.store;
  el.discount.value = String(state.minDiscount);
  el.sort.textContent = "";
  for (const s of SORTS) {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.label;
    el.sort.appendChild(opt);
  }
  el.sort.value = state.sort;
} // paintControls

function syncFromControls() {
  state.query = el.search.value.trim();
  if (el.store.value) state.store = el.store.value;
  if (el.discount.value !== "") state.minDiscount = Number(el.discount.value);
  if (el.sort.value) state.sort = el.sort.value;
} // syncFromControls

function applyHashParams() {
  const rawHash = location.hash || "#/";
  const qm = rawHash.indexOf("?");
  if (qm < 0) return;
  const qp = new URLSearchParams(rawHash.slice(qm + 1));
  const catQ = qp.get("cat");
  if (catQ && (catQ === "All" || CATEGORIES.includes(catQ))) state.category = catQ;
  const storeQ = qp.get("store");
  if (storeQ && (storeQ === "All" || STORES.includes(storeQ))) state.store = storeQ;
  const minQ = Number(qp.get("min"));
  if (minQ === 30 || minQ === 50) state.minDiscount = minQ;
  const maxQ = Number(qp.get("max"));
  if (maxQ === 50 || maxQ === 100 || maxQ === 300) state.maxPrice = maxQ;
  const sortQ = qp.get("sort");
  if (sortQ && SORTS.some((s) => s.id === sortQ)) state.sort = sortQ;
  const queryQ = qp.get("q");
  if (queryQ) {
    state.query = queryQ;
    el.search.value = queryQ;
  }
} // applyHashParams

function highlightTab(h) {
  let view = "grid";
  if (h.startsWith("#/deal/")) view = "deal";
  else if (h.startsWith("#/war")) view = "war";
  else if (h.startsWith("#/shame")) view = "shame";
  for (const t of tabLinks) t.classList.toggle("active", t.dataset.view === view);
} // highlightTab

function draw() {
  paintControls();
  syncFromControls();
  applyHashParams();
  paintControls();
  const hash = location.hash || "#/";
  highlightTab(hash);
  if (hash.startsWith("#/deal/")) {
    el.root.innerHTML = detailHtml(findDeal(hash.slice(7).split("?")[0]));
  } else if (hash.startsWith("#/war")) {
    el.root.innerHTML = warHtml();
  } else if (hash.startsWith("#/shame")) {
    el.root.innerHTML = shameHtml();
  } else {
    el.root.innerHTML = gridHtml();
  }
  const onGrid = hash.startsWith("#/") && !hash.startsWith("#/deal") && !hash.startsWith("#/war") && !hash.startsWith("#/shame");
  const shown = onGrid ? applyFilters().length : deals.length;
  el.count.textContent = shown + " of " + deals.length + " deals";
  window.scrollTo(0, 0);
} // draw

el.search.addEventListener("input", draw);
el.store.addEventListener("change", draw);
el.discount.addEventListener("change", draw);
el.sort.addEventListener("change", draw);
el.clear.addEventListener("click", () => {
  resetFilters();
  el.search.value = "";
  el.discount.value = "0";
  draw();
});
window.addEventListener("hashchange", draw);

el.checked.textContent = "All prices checked " + CHECKED_DAY + " evening";
draw();
