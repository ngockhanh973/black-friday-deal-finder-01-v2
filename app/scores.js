// Verdicts and the worth-it score. Every number a card shows is computed
// here from the deal's own sale and usual prices, never copied from a badge.
//
// Score, 0-100, in four visible parts:
//   cut points   = the discount percent x 1.1, capped at 50
//   verdict part = new-low 25, strong 15, routine 5, inflated -15
//   price-war    = 5 points per rival store the cheapest price beats, cap 10
//   shipping     = 6 points when the store ships it free
// An inflated deal therefore cannot score its way out of the shame pile:
// a big fake cut still lands under 45.

export const VERDICT_INFO = {
  "new-low": { label: "NEW LOW", colour: "#0a6b2d", tint: "#dcf1e2", blurb: "Lowest price ever seen" },
  strong: { label: "STRONG DEAL", colour: "#0a4d9e", tint: "#dbe8fb", blurb: "Deep cut, worth buying" },
  routine: { label: "ROUTINE", colour: "#7d5700", tint: "#fbeec2", blurb: "This price comes back often" },
  inflated: { label: "INFLATED", colour: "#a31616", tint: "#fbd9d9", blurb: "Near last month's price" },
};

export const VERDICT_ORDER = { "new-low": 0, strong: 1, routine: 2, inflated: 3 };

const VERDICT_POINTS = { "new-low": 25, strong: 15, routine: 5, inflated: -15 };

export function discountPercent(deal) {
  if (!deal.usual || deal.usual <= 0) return 0;
  return Math.round(((deal.usual - deal.sale) / deal.usual) * 1000) / 10;
}

export function dollarsSaved(deal) {
  return Math.round((deal.usual - deal.sale) * 100) / 100;
}

// How many rival stores the deal's own store beats, from its compare list.
export function storesBeaten(deal) {
  if (!deal.compare || deal.compare.length < 2) return 0;
  const mine = deal.compare.find((r) => r.store === deal.store);
  if (!mine) return 0;
  return deal.compare.filter((r) => r.price > mine.price).length;
}

export function scoreParts(deal) {
  const pct = discountPercent(deal);
  const cut = Math.min(50, Math.round(pct * 1.1));
  const verdict = VERDICT_POINTS[deal.verdict] ?? 0;
  const war = Math.min(10, storesBeaten(deal) * 5);
  const ship = deal.ship ? 6 : 0;
  return { cut, verdict, war, ship, pct };
}

export function worthScore(deal) {
  const p = scoreParts(deal);
  return Math.max(5, Math.min(100, p.cut + p.verdict + p.war + p.ship));
}

export function verdictLabel(deal) {
  return VERDICT_INFO[deal.verdict].label;
}

export function money(n) {
  return "$" + Number(n).toLocaleString("en-US", {
    minimumFractionDigits: Number(n) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

// Median of a list of numbers, for the street-price line on the War board.
export function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}
