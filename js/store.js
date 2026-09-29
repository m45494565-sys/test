/**
 * Data layer: app state, saving to localStorage, and every change to the data.
 * Nothing in this file touches the DOM.
 */
(function (BT) {
  'use strict';

  const { STORAGE_KEY, CATS, RATES } = BT.config;
  const { pad, round2, uid, guessCurrency, todayString } = BT.utils;

  /* ---------- Load and save ---------- */

  function isValidTransaction(t) {
    return t &&
      typeof t.amount === 'number' && t.amount > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(t.date || '') &&
      (t.type === 'income' || (t.type === 'expense' && CATS.includes(t.cat)));
  }

  function load() {
    const data = { currency: guessCurrency(), limits: {}, tx: [] };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return data;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return data;

      if (RATES[saved.currency]) data.currency = saved.currency;

      if (saved.limits && typeof saved.limits === 'object') {
        CATS.forEach((c) => {
          const v = Number(saved.limits[c]);
          if (v > 0) data.limits[c] = v;
        });
      }

      if (Array.isArray(saved.tx)) {
        data.tx = saved.tx.filter(isValidTransaction).map((t) => ({
          id: String(t.id || uid()),
          type: t.type,
          amount: t.amount,
          cat: t.cat || '',
          note: typeof t.note === 'string' ? t.note : '',
          date: t.date
        }));
      }
    } catch (e) {
      /* Storage unavailable or data corrupt: start empty. */
    }
    return data;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* Ignore: the app still works for this session. */
    }
  }

  /* ---------- State ---------- */

  const state = load();                       // Saved data: currency, limits, transactions.
  const today = new Date();
  const view = { y: today.getFullYear(), m: today.getMonth() };  // Month being shown.
  const ui = { formType: 'expense', editingCat: null, pendingFocus: null };  // Temporary UI state.

  /* ---------- Month navigation ---------- */

  const viewKey = () => `${view.y}-${pad(view.m + 1)}`;

  function isCurrentMonth() {
    const d = new Date();
    return d.getFullYear() === view.y && d.getMonth() === view.m;
  }

  function shiftMonth(delta) {
    const d = new Date(view.y, view.m + delta, 1);
    view.y = d.getFullYear();
    view.m = d.getMonth();
  }

  function goToMonth(y, m) {
    view.y = y;
    view.m = m;
  }

  /* ---------- Queries ---------- */

  function monthTransactions() {
    const key = viewKey();
    return state.tx.filter((t) => t.date.startsWith(key));
  }

  function totals() {
    const by = {};
    CATS.forEach((c) => { by[c] = 0; });
    let income = 0;
    let spent = 0;

    monthTransactions().forEach((t) => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        spent += t.amount;
        by[t.cat] += t.amount;
      }
    });

    CATS.forEach((c) => { by[c] = round2(by[c]); });
    income = round2(income);
    spent = round2(spent);
    return { income, spent, by, left: round2(income - spent) };
  }

  /* ---------- Changes ---------- */

  function addTransaction(tx) {
    const t = { id: uid(), ...tx };
    state.tx.push(t);
    save();
    return t;
  }

  /** Removes a transaction. Returns what is needed to undo it, or null if not found. */
  function removeTransaction(id) {
    const index = state.tx.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const [tx] = state.tx.splice(index, 1);
    save();
    return { tx, index };
  }

  function restoreTransaction(tx, index) {
    state.tx.splice(Math.min(index, state.tx.length), 0, tx);
    save();
  }

  /** Sets a category limit. A value of 0 or less removes it. */
  function setLimit(cat, value) {
    if (value > 0) state.limits[cat] = value;
    else delete state.limits[cat];
    save();
  }

  function setCurrency(currency) {
    if (!RATES[currency]) return;
    state.currency = currency;
    save();
  }

  function reset() {
    state.tx = [];
    state.limits = {};
    save();
  }

  function loadSample() {
    const d = new Date();
    const prefix = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-`;
    const dayOf = (n) => prefix + pad(Math.min(n, 28));
    const scale = (usd) => {
      const v = usd * RATES[state.currency];
      const step = v >= 1000 ? 10 : 1;
      return Math.round(v / step) * step;
    };

    // [type, amount in USD, category, note, day of month]
    const rows = [
      ['income', 2400, '', 'Salary', 1],
      ['income', 320, '', 'Freelance project', 9],
      ['expense', 850, 'Housing', 'Rent', 2],
      ['expense', 96, 'Bills', 'Electricity', 4],
      ['expense', 45, 'Bills', 'Phone plan', 5],
      ['expense', 74, 'Food', 'Weekly groceries', 3],
      ['expense', 68, 'Food', 'Weekly groceries', 10],
      ['expense', 22, 'Food', 'Lunch with a friend', 12],
      ['expense', 60, 'Transport', 'Transit pass', 3],
      ['expense', 35, 'Transport', 'Fuel', 11],
      ['expense', 40, 'Health', 'Pharmacy', 8],
      ['expense', 32, 'Fun', 'Movie night', 7],
      ['expense', 18, 'Fun', 'Streaming', 6],
      ['expense', 120, 'Shopping', 'New shoes', 13]
    ];

    rows.forEach(([type, usd, cat, note, day]) => {
      state.tx.push({ id: uid(), type, amount: scale(usd), cat, note, date: dayOf(day) });
    });
    state.limits = { Food: scale(300), Fun: scale(80), Shopping: scale(150) };
    save();
    goToMonth(d.getFullYear(), d.getMonth());
  }

  BT.store = {
    state, view, ui,
    viewKey, isCurrentMonth, shiftMonth, goToMonth,
    monthTransactions, totals,
    addTransaction, removeTransaction, restoreTransaction,
    setLimit, setCurrency, reset, loadSample,
    todayString
  };
})(window.BT);
