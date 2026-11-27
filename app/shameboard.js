// The Hall of Shame: the deals we are telling you not to buy, in one place.
// Inflated sales first (today's price is near last month's, or the crossed
// out price was never real), then routine ones (the price comes back often).
// Each card carries its one-line evidence and the price worth waiting for.

import { deals } from "./deals.js";
import { discountPercent, money, VERDICT_INFO } from "./scores.js";

function shameCard(deal) {
  const info = VERDICT_INFO[deal.verdict];
  const wait = deal.waitFor
    ? `<p class="wait-line">Worth waiting for: <strong>${money(deal.waitFor)}</strong> — that is the low a price tracker actually recorded.</p>`
    : `<p class="wait-line">Worth waiting for: a real cut on the console itself, not $50 off a bundle.</p>`;
  return (
    `<article class="card shame-card" data-id="${deal.id}">` +
    `<div class="card-top"><span class="badge" style="background:${info.tint};color:${info.colour};border-color:${info.colour}">${info.label}</span>` +
    `<span class="cat">${deal.cat}</span></div>` +
    `<h3><a href="#/deal/${deal.id}">${deal.name}</a></h3>` +
    `<p class="store-line">${deal.store} &middot; <a class="store-link" href="${deal.url}" target="_blank" rel="noopener">View at ${deal.store} &nearr;</a></p>` +
    `<p class="price-line"><span class="sale">${money(deal.sale)}</span>` +
    `<span class="usual"><s>${money(deal.usual)}</s></span>` +
    `<span class="off">-${discountPercent(deal)}%</span></p>` +
    `<p class="evidence"><strong>Why it is here:</strong> ${deal.evidence}</p>` +
    wait +
    `<p class="checked">Checked ${deal.checked} &middot; Source: ${deal.source}</p>` +
    `<p class="card-actions"><a class="btn ghost" href="#/deal/${deal.id}">Full autopsy</a></p>` +
    `</article>`
  );
}

function shameSection(title, blurb, list) {
  if (list.length === 0) return "";
  return `<section class="shame-section"><h2>${title} (${list.length})</h2><p>${blurb}</p>` +
    `<div class="grid">${list.map(shameCard).join("")}</div></section>`;
}

export function shameHtml() {
  const inflated = deals.filter((d) => d.verdict === "inflated");
  const routine = deals.filter((d) => d.verdict === "routine");
  return (
    `<section class="war-intro"><h2>Hall of Shame</h2>` +
    `<p>Duds shown, not hidden. These ${inflated.length + routine.length} listings wear a sale badge ` +
    `but fail the price-history test — the same price as last month, or a discount from a price that never existed. ` +
    `We keep them on the board so you can see what we caught, not just what we praise.</p></section>` +
    shameSection("Inflated — the sale is the ordinary price", "The crossed-out price was never the going price, or today's price matches October's.", inflated) +
    shameSection("Routine — this price comes back often", "Fine prices, but nothing Black Friday about them. No reason to rush.", routine)
  );
}
