/**
 * Small pure helpers: DOM lookup, formatting, parsing.
 */
(function (BT) {
  'use strict';

  const { REGION_CURRENCY } = BT.config;

  const $ = (id) => document.getElementById(id);
  const pad = (n) => (n < 10 ? '0' + n : String(n));
  const round2 = (n) => Math.round(n * 100) / 100;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

  function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function guessCurrency() {
    try {
      const region = ((navigator.language || '').split('-')[1] || '').toUpperCase();
      return REGION_CURRENCY[region] || 'USD';
    } catch (e) {
      return 'USD';
    }
  }

  function formatMoney(amount, currency) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
    } catch (e) {
      return amount.toFixed(2);
    }
  }

  /** "2026-09-29" -> "Sep 29" */
  function shortDate(dateString) {
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  /** Accepts "1,234.50", "12.5" and "12,50". Returns NaN when the text is not a number. */
  function parseAmount(raw) {
    let s = raw.replace(/\s/g, '');
    if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
    else s = s.replace(/,/g, '');
    if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) return NaN;
    return round2(Number(s));
  }

  BT.utils = { $, pad, round2, uid, escapeHtml, todayString, guessCurrency, formatMoney, shortDate, parseAmount };
})(window.BT);
