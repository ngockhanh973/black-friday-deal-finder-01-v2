// Search, filter and sort state for the board. The default sort is by
// verdict (new lows first), then by worth-it score, so the best deals sit
// on top without the shopper touching anything. Mission presets are one
// tap shortcuts: a price ceiling, or a gaming kit under $300.

import { deals } from "./deals.js";
import { discountPercent, VERDICT_ORDER, worthScore } from "./scores.js";

export const state = {
  query: "",
  category: "All",
  store: "All",
  minDiscount: 0,
  maxPrice: 0,
  sort: "verdict",
};

export const SORTS = [
  { id: "verdict", label: "Best verdict first" },
  { id: "score", label: "Highest score" },
  { id: "biggest-off", label: "Biggest discount" },
  { id: "biggest-save", label: "Biggest saving ($)" },
  { id: "lowest-price", label: "Lowest price" },
];

export const MISSIONS = [
  { id: "under-50", label: "Under $50", run: () => { state.maxPrice = 50; state.category = "All"; } },
  { id: "under-100", label: "Under $100", run: () => { state.maxPrice = 100; state.category = "All"; } },
  { id: "gaming-300", label: "Gaming setup under $300", run: () => { state.maxPrice = 300; state.category = "Gaming"; } },
];

export function applyFilters() {
  const q = state.query.trim().toLowerCase();
  const list = deals.filter((d) => {
    if (q && !(d.name.toLowerCase().includes(q) || d.store.toLowerCase().includes(q) || d.cat.toLowerCase().includes(q))) return false;
    if (state.category !== "All" && d.cat !== state.category) return false;
    if (state.store !== "All" && d.store !== state.store) return false;
    if (discountPercent(d) < state.minDiscount) return false;
    if (state.maxPrice > 0 && d.sale > state.maxPrice) return false;
    return true;
  });
  const byScore = (a, b) => worthScore(b) - worthScore(a);
  switch (state.sort) {
    case "score": return list.sort(byScore);
    case "biggest-off": return list.sort((a, b) => discountPercent(b) - discountPercent(a) || byScore(a, b));
    case "biggest-save": return list.sort((a, b) => (b.usual - b.sale) - (a.usual - a.sale) || byScore(a, b));
    case "lowest-price": return list.sort((a, b) => a.sale - b.sale || byScore(a, b));
    default: return list.sort((a, b) => VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict] || byScore(a, b));
  }
}

export function countByVerdict(list) {
  const counts = { "new-low": 0, strong: 0, routine: 0, inflated: 0 };
  for (const d of list) counts[d.verdict] += 1;
  return counts;
}

export function resetFilters() {
  state.query = "";
  state.category = "All";
  state.store = "All";
  state.minDiscount = 0;
  state.maxPrice = 0;
  state.sort = "verdict";
}
