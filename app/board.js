// The two screens shoppers open most: the verdict-first grid and the
// one-deal autopsy. Both come back as plain strings rendered into #app.
// The autopsy gathers it all: the evidence checklist, the "Also at" table
// of rival stores, the tall Price Elevator chart, the condition chips and
// the worth-it score split into its four visible parts.

import { CHECKED_DAY, deals } from "./deals.js";
import { applyFilters, countByVerdict } from "./filters.js";
import { VERDICT_INFO, discountPercent, dollarsSaved, money, scoreParts, storesBeaten, worthScore } from "./scores.js";
import { miniChart, elevatorChart } from "./pricechart.js";

function verdictBadge(deal) {
  const info = VERDICT_INFO[deal.verdict];
  return '<span class="badge" style="background:' + info.tint + ';color:' + info.colour + ';border-color:' + info.colour + '">' + info.label + '</span>';
} // verdictBadge

function scoreStrip(deal) {
  const s = worthScore(deal);
  const bits = [
    '<div class="score" title="Worth-it score ' + s + ' out of 100">',
    '<span class="score-num">' + s + '</span><span class="score-of">/100 worth it</span>',
    '<span class="score-track"><span class="score-fill" style="width:' + s + '%"></span></span></div>',
  ];
  return bits.join("");
} // scoreStrip

function cardMarkup(deal) {
  const pct = discountPercent(deal);
  const parts = [
    '<article class="card" data-id="' + deal.id + '">',
    '<div class="card-top">' + verdictBadge(deal) + '<span class="cat">' + deal.cat + '</span></div>',
    '<h3><a href="#/deal/' + deal.id + '">' + deal.name + '</a></h3>',
    '<p class="store-line">' + deal.store + ' &middot; <a class="store-link" href="' + deal.url + '" target="_blank" rel="noopener">View at ' + deal.store + ' &nearr;</a></p>',
    '<p class="checked">Checked ' + deal.checked + ' &middot; Source: ' + deal.source + '</p>',
    '<p class="price-line"><span class="sale">' + money(deal.sale) + '</span>' +
      '<span class="usual"><s>' + money(deal.usual) + '</s></span>' +
      '<span class="off">-' + pct + '%</span></p>',
    '<p class="save-line">You save ' + money(dollarsSaved(deal)) + '</p>',
    scoreStrip(deal),
    '<p class="evidence">' + deal.evidence + '</p>',
    '<div class="spark">' + miniChart(deal, 220, 40) + '<span class="spark-cap">Price history &middot; red dot is today</span></div>',
    '<p class="card-actions"><a class="btn" href="' + deal.url + '" target="_blank" rel="noopener">View at ' + deal.store + '</a>' +
      '<a class="btn ghost" href="#/deal/' + deal.id + '">Full autopsy</a></p>',
    '</article>',
  ];
  return parts.join("");
} // cardMarkup

function verdictMeter(list) {
  const tally = countByVerdict(list);
  const n = list.length;
  const head = '<section class="meter" aria-label="Honesty meter">' +
    '<p class="meter-line"><strong>' + tally["new-low"] + ' NEW LOW</strong> &middot; ' + tally.strong + ' STRONG &middot; ' +
    tally.routine + ' ROUTINE &middot; ' + tally.inflated + ' INFLATED — duds shown, not hidden</p>';
  const sub = '<p class="meter-sub">Out of ' + n + ' deals checked tonight: ' + tally["new-low"] + ' at their lowest ever, ' +
    tally.strong + ' deep cuts, ' + tally.routine + ' prices that come back often, and ' + tally.inflated + ' sales that are not sales. ' +
    'A routine price is not a bargain, and an inflated one gets called out by name.</p></section>';
  return head + sub;
} // verdictMeter

export function gridHtml() {
  const list = applyFilters();
  const cards = list.map(cardMarkup).join("");
  const sortEl = document.getElementById("sort-select");
  const sortLabel = sortEl?.selectedOptions?.[0]?.textContent || "best verdict first";
  const empty = list.length === 0
    ? '<p class="empty">No deals match those filters. Loosen the discount, raise the price ceiling, or clear the search.</p>'
    : "";
  const head = verdictMeter(deals) +
    '<p class="result-count">Showing <strong>' + list.length + '</strong> of ' + deals.length + ' deals &middot; ' +
    'all prices checked ' + CHECKED_DAY + ', sorted by ' + sortLabel.toLowerCase() + '</p>';
  return head + '<div class="grid">' + cards + '</div>' + empty;
} // gridHtml

function evidenceRow(ok, label, detail) {
  const mark = ok ? "&#10003;" : "&#10007;";
  const cls = ok ? "ok" : "no";
  return '<li class="' + cls + '">' + mark + ' <strong>' + label + '</strong> — ' + detail + '</li>';
} // evidenceRow

function rivalTable(deal) {
  if (!deal.compare || deal.compare.length < 2) return "";
  const floor = Math.min(...deal.compare.map((r) => r.price));
  const rowHtml = [...deal.compare]
    .sort((a, b) => a.price - b.price)
    .map((r) => {
      const isFloor = r.price === floor;
      const cell = isFloor ? "Best price" : money(r.price - floor) + " more than the cheapest";
      return '<tr class="' + (isFloor ? "cheapest" : "") + '"><td>' + r.store + (isFloor ? " ★ cheapest" : "") + '</td>' +
        '<td>' + money(r.price) + '</td><td>' + cell + '</td></tr>';
    })
    .join("");
  const beaten = storesBeaten(deal);
  const plural = beaten === 1 ? "" : "s";
  return '<section class="compare"><h2>Also at: the same product, every store we checked</h2>' +
    '<table><thead><tr><th>Store</th><th>Price</th><th>What it means</th></tr></thead><tbody>' + rowHtml + '</tbody></table>' +
    '<p class="compare-note">' + deal.store + ' beats ' + beaten + ' store' + plural + ' on this product — worth ' + Math.min(10, beaten * 5) + ' points of its score.</p></section>';
} // rivalTable

function scoreNote(deal) {
  const p = scoreParts(deal);
  const s = worthScore(deal);
  const beaten = storesBeaten(deal);
  const word = VERDICT_INFO[deal.verdict].label.toLowerCase();
  const plural = beaten === 1 ? "" : "s";
  return '<p class="score-why">Score ' + s + '/100: ' + p.cut + ' pts for a ' + p.pct + '% cut + ' + p.verdict + ' for a ' + word + ' verdict ' +
    '+ ' + p.war + ' for beating ' + beaten + ' store' + plural + ' ' +
    '+ ' + p.ship + ' for free shipping.</p>';
} // scoreNote

export function detailHtml(deal) {
  if (!deal) return '<p class="empty">That deal is not on the board. <a href="#/">Back to all deals</a>.</p>';
  const pct = discountPercent(deal);
  const chips = deal.tags.map((t) => '<span class="cond-chip">' + t + '</span>').join("");
  const parts = [
    '<p class="back"><a href="#/">&larr; All deals</a> &middot; <a href="#/war">Price War</a> &middot; <a href="#/shame">Hall of Shame</a></p>',
    '<article class="detail">',
    '<div class="detail-head">' + verdictBadge(deal) + '<span class="cat">' + deal.cat + '</span></div>',
    '<h2>' + deal.name + '</h2>',
    '<p class="store-line">' + deal.store + ' &middot; <a class="store-link" href="' + deal.url + '" target="_blank" rel="noopener">View at ' + deal.store + ' &nearr;</a></p>',
    '<p class="price-line big"><span class="sale">' + money(deal.sale) + '</span>' +
      '<span class="usual"><s>' + money(deal.usual) + '</s></span><span class="off">-' + pct + '%</span></p>',
    '<p class="save-line">You save ' + money(dollarsSaved(deal)) + ' off the usual price.</p>',
    scoreStrip(deal),
    scoreNote(deal),
    '<div class="cond-row" aria-label="Conditions">' + chips + '</div>',
    '<section class="evidence-box"><h2>Evidence checklist</h2><ul class="checks">' +
      evidenceRow(true, "Store price", money(deal.sale) + ' at ' + deal.store + ', checked ' + deal.checked + '.') +
      evidenceRow(true, "Discount adds up", money(deal.usual) + ' minus ' + money(deal.sale) + ' is ' + pct + '% off — computed, not copied from a badge.') +
      evidenceRow(deal.verdict !== "inflated", "Verdict evidence", deal.evidence) +
      evidenceRow(true, "Condition", deal.note) +
      '</ul><p class="checked">Source: ' + deal.source + '. Checked ' + deal.checked + '.</p></section>',
    rivalTable(deal),
    '<section class="history"><h2>Price Elevator — 90 days, in dollars</h2>' + elevatorChart(deal, 560, 220) +
      '<p class="spark-cap">Only prices a source actually reported are plotted; the red dot is today' + "'" + 's price, ' +
      'and the dashed line is the lowest price seen in 90 days.</p></section>',
    '<p class="card-actions"><a class="btn big" href="' + deal.url + '" target="_blank" rel="noopener">View at ' + deal.store + '</a>' +
      '<a class="btn ghost" href="#/">Back to all deals</a></p>',
    '</article>',
  ];
  return parts.join("");
} // detailHtml

export function findDeal(id) {
  return deals.find((row) => row.id === id);
} // findDeal
