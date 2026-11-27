// The Price War board: six hot products, each fought over by three or four
// stores. One row per product, one column per store; the cheapest cell is
// painted green, and the line under it says by how much it beats the next
// store and what the street price (the median of the stores shown) is.
// A product only makes this board when we verified at least two store
// prices for it.

import { WAR_IDS, deals } from "./deals.js";
import { discountPercent, median, money, VERDICT_INFO, worthScore } from "./scores.js";

function findDeal(id) {
  return deals.find((d) => d.id === id);
}

function warRow(deal) {
  const rows = [...deal.compare].sort((a, b) => a.price - b.price);
  const cheapest = rows[0].price;
  const tied = rows.filter((r) => r.price === cheapest).map((r) => r.store);
  const next = rows.find((r) => r.price > cheapest);
  const beatBy = next ? next.price - cheapest : 0;
  const street = median(rows.map((r) => r.price));
  const info = VERDICT_INFO[deal.verdict];
  const cells = rows
    .map((r) => {
      const isBest = r.price === cheapest;
      const over = r.price - cheapest;
      return `<td class="${isBest ? "war-best" : ""}">` +
        `<span class="war-store">${r.store}${isBest ? " ★ cheapest" : ""}</span>` +
        `<span class="war-price">${money(r.price)}</span>` +
        `<span class="war-over">${isBest ? "Best price" : "+" + money(over).slice(1) + " more"}</span></td>`;
    })
    .join("");
  return (
    `<article class="war-row">` +
    `<div class="war-head"><h3><a href="#/deal/${deal.id}">${deal.name}</a></h3>` +
    `<span class="badge" style="background:${info.tint};color:${info.colour};border-color:${info.colour}">${info.label}</span>` +
    `<span class="war-score">Score ${worthScore(deal)}/100 &middot; ${discountPercent(deal)}% off at ${deal.store}</span></div>` +
    `<table class="war-table"><tbody><tr>${cells}</tr></tbody></table>` +
    `<p class="war-line">Cheapest is <strong>${tied.join(" and ")} at ${money(cheapest)}</strong>` +
    (beatBy > 0 ? ` — beats the next store by <strong>${money(beatBy)}</strong>` : " — every store matches") +
    `. Median street price: <strong>${money(street)}</strong>. ` +
    `<a href="#/deal/${deal.id}">Full autopsy &rarr;</a></p>` +
    `</article>`
  );
}

export function warHtml() {
  const picked = WAR_IDS.map(findDeal).filter(Boolean);
  const rows = picked.map(warRow).join("");
  return (
    `<section class="war-intro"><h2>Price War</h2>` +
    `<p>Six products shoppers are hunting hardest, priced at every store we could verify. ` +
    `The green cell is the cheapest right now; the street price is the median of the stores shown, ` +
    `so a "sale" above it is not a sale at all.</p></section>` +
    rows +
    `<p class="war-note">Prices checked ${picked[0] ? picked[0].checked : ""}. Stores change prices during Black Friday — confirm at checkout.</p>`
  );
}
