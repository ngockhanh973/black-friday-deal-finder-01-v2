// The two screens shoppers see most: the verdict-first grid and the
// single-deal autopsy. Both are plain strings rendered into #app.
// The autopsy pulls everything together: the evidence checklist, the
// "Also at" store table, the big Price Elevator chart, the condition chips
// and the score shown as its four visible parts.

import { deals, CHECKED_DAY } from "./deals.js";
import { applyFilters, countByVerdict, state } from "./filters.js";
import { discountPercent, dollarsSaved, money, scoreParts, storesBeaten, VERDICT_INFO, worthScore } from "./scores.js";
import { elevatorChart, miniChart } from "./pricechart.js";

function badge(deal) {
  const info = VERDICT_INFO[deal.verdict];
  return `<span class="badge" style="background:${info.tint};color:${info.colour};border-color:${info.colour}">${info.label}</span>`;
}

function scoreBar(deal) {
  const s = worthScore(deal);
  return (
    `<div class="score" title="Worth-it score ${s} out of 100">` +
    `<span class="score-num">${s}</span><span class="score-of">/100 worth it</span>` +
    `<span class="score-track"><span class="score-fill" style="width:${s}%"></span></span></div>`
  );
}

function cardHtml(deal) {
  const pct = discountPercent(deal);
  return (
    `<article class="card" data-id="${deal.id}">` +
    `<div class="card-top">${badge(deal)}<span class="cat">${deal.cat}</span></div>` +
    `<h3><a href="#/deal/${deal.id}">${deal.name}</a></h3>` +
    `<p class="store-line">${deal.store} &middot; <a class="store-link" href="${deal.url}" target="_blank" rel="noopener">View at ${deal.store} &nearr;</a></p>` +
    `<p class="checked">Checked ${deal.checked} &middot; Source: ${deal.source}</p>` +
    `<p class="price-line"><span class="sale">${money(deal.sale)}</span>` +
    `<span class="usual"><s>${money(deal.usual)}</s></span>` +
    `<span class="off">-${pct}%</span></p>` +
    `<p class="save-line">You save ${money(dollarsSaved(deal))}</p>` +
    `${scoreBar(deal)}` +
    `<p class="evidence">${deal.evidence}</p>` +
    `<div class="spark">${miniChart(deal, 220, 40)}<span class="spark-cap">Price history &middot; red dot is today</span></div>` +
    `<p class="card-actions"><a class="btn" href="${deal.url}" target="_blank" rel="noopener">View at ${deal.store}</a>` +
    `<a class="btn ghost" href="#/deal/${deal.id}">Full autopsy</a></p>` +
    `</article>`
  );
}

function honestyStrip(list) {
  const c = countByVerdict(list);
  const total = list.length;
  return (
    `<section class="meter" aria-label="Honesty meter">` +
    `<p class="meter-line"><strong>${c["new-low"]} NEW LOW</strong> &middot; ${c.strong} STRONG &middot; ` +
    `${c.routine} ROUTINE &middot; ${c.inflated} INFLATED — duds shown, not hidden</p>` +
    `<p class="meter-sub">Out of ${total} deals checked tonight: ${c["new-low"]} at their lowest ever, ` +
    `${c.strong} deep cuts, ${c.routine} prices that come back often, and ${c.inflated} sales that are not sales. ` +
    `A routine price is not a bargain, and an inflated one gets called out by name.</p>` +
    `</section>`
  );
}

export function gridHtml() {
  const list = applyFilters();
  const cards = list.map(cardHtml).join("");
  const empty = list.length === 0
    ? `<p class="empty">No deals match those filters. Loosen the discount, raise the price ceiling, or clear the search.</p>`
    : "";
  const sortLabel = (document.getElementById("sort-select")?.selectedOptions?.[0]?.textContent) || "best verdict first";
  return (
    `${honestyStrip(deals)}` +
    `<p class="result-count">Showing <strong>${list.length}</strong> of ${deals.length} deals &middot; ` +
    `all prices checked ${CHECKED_DAY}, sorted by ${sortLabel.toLowerCase()}</p>` +
    `<div class="grid">${cards}</div>${empty}`
  );
}

function checkRow(ok, label, detail) {
  return `<li class="${ok ? "ok" : "no"}">${ok ? "&#10003;" : "&#10007;"} <strong>${label}</strong> — ${detail}</li>`;
}

function alsoAtTable(deal) {
  if (!deal.compare || deal.compare.length < 2) return "";
  const best = Math.min(...deal.compare.map((r) => r.price));
  const rows = [...deal.compare]
    .sort((a, b) => a.price - b.price)
    .map((r) => {
      const cheapest = r.price === best;
      return `<tr class="${cheapest ? "cheapest" : ""}"><td>${r.store}${cheapest ? " ★ cheapest" : ""}</td>` +
        `<td>${money(r.price)}</td><td>${cheapest ? "Best price" : money(r.price - best) + " more than the cheapest"}</td></tr>`;
    })
    .join("");
  const beaten = storesBeaten(deal);
  return (
    `<section class="compare"><h2>Also at: the same product, every store we checked</h2>` +
    `<table><thead><tr><th>Store</th><th>Price</th><th>What it means</th></tr></thead><tbody>${rows}</tbody></table>` +
    `<p class="compare-note">${deal.store} beats ${beaten} store${beaten === 1 ? "" : "s"} on this product — worth ${Math.min(10, beaten * 5)} points of its score.</p></section>`
  );
}

function scoreBreakdown(deal) {
  const p = scoreParts(deal);
  const s = worthScore(deal);
  const verdictWord = VERDICT_INFO[deal.verdict].label.toLowerCase();
  return `<p class="score-why">Score ${s}/100: ${p.cut} pts for a ${p.pct}% cut + ${p.verdict} for a ${verdictWord} verdict ` +
    `+ ${p.war} for beating ${storesBeaten(deal)} store${storesBeaten(deal) === 1 ? "" : "s"} ` +
    `+ ${p.ship} for free shipping.</p>`;
}

export function detailHtml(deal) {
  if (!deal) return `<p class="empty">That deal is not on the board. <a href="#/">Back to all deals</a>.</p>`;
  const pct = discountPercent(deal);
  const s = worthScore(deal);
  const info = VERDICT_INFO[deal.verdict];
  const chips = deal.tags.map((t) => `<span class="cond-chip">${t}</span>`).join("");
  return (
    `<p class="back"><a href="#/">&larr; All deals</a> &middot; <a href="#/war">Price War</a> &middot; <a href="#/shame">Hall of Shame</a></p>` +
    `<article class="detail">` +
    `<div class="detail-head">${badge(deal)}<span class="cat">${deal.cat}</span></div>` +
    `<h2>${deal.name}</h2>` +
    `<p class="store-line">${deal.store} &middot; <a class="store-link" href="${deal.url}" target="_blank" rel="noopener">View at ${deal.store} &nearr;</a></p>` +
    `<p class="price-line big"><span class="sale">${money(deal.sale)}</span>` +
    `<span class="usual"><s>${money(deal.usual)}</s></span><span class="off">-${pct}%</span></p>` +
    `<p class="save-line">You save ${money(dollarsSaved(deal))} off the usual price.</p>` +
    `${scoreBar(deal)}` +
    `${scoreBreakdown(deal)}` +
    `<div class="cond-row" aria-label="Conditions">${chips}</div>` +
    `<section class="evidence-box"><h2>Evidence checklist</h2><ul class="checks">` +
    checkRow(true, "Store price", `${money(deal.sale)} at ${deal.store}, checked ${deal.checked}.`) +
    checkRow(true, "Discount adds up", `${money(deal.usual)} minus ${money(deal.sale)} is ${pct}% off — computed, not copied from a badge.`) +
    checkRow(deal.verdict !== "inflated", "Verdict evidence", deal.evidence) +
    checkRow(true, "Condition", deal.note) +
    `</ul><p class="checked">Source: ${deal.source}. Checked ${deal.checked}.</p></section>` +
    `${alsoAtTable(deal)}` +
    `<section class="history"><h2>Price Elevator — 90 days, in dollars</h2>${elevatorChart(deal, 560, 220)}` +
    `<p class="spark-cap">Only prices a source actually reported are plotted; the red dot is today's price, ` +
    `and the dashed line is the lowest price seen in 90 days.</p></section>` +
    `<p class="card-actions"><a class="btn big" href="${deal.url}" target="_blank" rel="noopener">View at ${deal.store}</a>` +
    `<a class="btn ghost" href="#/">Back to all deals</a></p>` +
    `</article>`
  );
}

export function findDeal(id) {
  return deals.find((d) => d.id === id);
}
