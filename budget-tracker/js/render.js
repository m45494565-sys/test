/**
 * View layer: turns the current state into HTML. It reads from the store and never changes data.
 */
(function (BT) {
  'use strict';

  const { CATS, SEGMENTS } = BT.config;
  const { $, escapeHtml: esc, formatMoney, round2, shortDate } = BT.utils;
  const { state, view, ui } = BT.store;

  const money = (n) => formatMoney(n, state.currency);

  /* ---------- One-time setup ---------- */

  function setup() {
    const gauge = $('gauge');
    gauge.innerHTML = Array.from({ length: SEGMENTS }, (_, i) => `<span class="seg" style="--i:${i}"></span>`).join('');
    setTimeout(() => gauge.classList.remove('intro'), 1800);

    $('currency').innerHTML = Object.keys(BT.config.RATES).map((c) => `<option value="${c}">${c}</option>`).join('');
    $('currency').value = state.currency;

    $('cat').innerHTML = CATS.map((c) => `<option>${c}</option>`).join('');
    $('filter').innerHTML =
      '<option value="all">All entries</option><option value="Income">Income</option>' +
      CATS.map((c) => `<option>${c}</option>`).join('');

    $('date').value = BT.store.todayString();
  }

  /* ---------- Sections ---------- */

  function renderMonth() {
    $('monthLabel').textContent = new Date(view.y, view.m, 1)
      .toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    $('thisMonth').hidden = BT.store.isCurrentMonth();
  }

  function paceNote(t) {
    if (t.income <= 0) return '';
    if (BT.store.isCurrentMonth()) {
      const d = new Date();
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const daysLeft = daysInMonth - d.getDate() + 1;
      if (t.left > 0) {
        return `About ${money(t.left / daysLeft)} a day for the next ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}.`;
      }
      return t.left < 0 ? 'Spending is above income this month.' : 'Nothing left to spend this month.';
    }
    return t.left < 0 ? 'Spending was above income this month.' : '';
  }

  function renderHero() {
    const t = BT.store.totals();
    const hasAny = t.income > 0 || t.spent > 0;

    let label = 'Left this month';
    let value = 0;
    let over = false;
    let note = '';

    if (!hasAny) {
      note = 'Add your income and spending to see what is left.';
    } else if (t.income === 0) {
      label = 'Spent this month';
      value = t.spent;
      note = 'Add your income to see what is left.';
    } else if (t.left < 0) {
      label = 'Over by';
      value = -t.left;
      over = true;
    } else {
      value = t.left;
    }
    if (t.income > 0) note = paceNote(t);

    // Gauge: lit segments show the share of income still left.
    let lit = 0;
    let mode = 'ok';
    if (t.income > 0) {
      if (t.left < 0) {
        lit = SEGMENTS;
        mode = 'over';
      } else {
        const share = t.left / t.income;
        lit = Math.max(0, Math.min(SEGMENTS, Math.round(share * SEGMENTS)));
        if (share <= 0.2) mode = 'low';
      }
    }

    $('heroLabel').textContent = label;
    const figure = $('heroFigure');
    figure.textContent = money(value);
    figure.className = 'figure' + (over ? ' over' : '');
    $('heroStats').innerHTML = hasAny
      ? `<span>Income<b>${esc(money(t.income))}</b></span><span>Spent<b>${esc(money(t.spent))}</b></span>`
      : '';
    $('heroNote').textContent = note;

    const gauge = $('gauge');
    Array.from(gauge.children).forEach((seg, i) => seg.classList.toggle('on', i < lit));
    gauge.classList.remove('ok', 'low', 'over');
    gauge.classList.add(mode);

    let description = 'No income entered yet';
    if (t.income > 0) {
      description = t.left < 0
        ? 'Spending is over income'
        : `${Math.round((t.left / t.income) * 100)} percent of income left`;
    }
    gauge.setAttribute('aria-label', description);
  }

  function renderCategories() {
    const t = BT.store.totals();
    const maxSpent = Math.max(0, ...CATS.map((c) => t.by[c]));

    $('cats').innerHTML = CATS.map((cat) => {
      const spent = t.by[cat];
      const limit = state.limits[cat] || 0;
      let percent;
      let barClass;
      let footer;

      if (limit > 0) {
        const ratio = spent / limit;
        percent = Math.min(ratio, 1) * 100;
        barClass = ratio > 1 ? 'over' : ratio >= 0.8 ? 'warn' : '';
        const status = ratio > 1
          ? `<span class="status over">${esc(money(round2(spent - limit)))} over</span>`
          : `<span class="status">${esc(money(round2(limit - spent)))} left</span>`;
        footer = `<button class="link-btn" type="button" data-edit="${cat}">Limit ${esc(money(limit))}</button>${status}`;
      } else {
        percent = maxSpent > 0 ? (spent / maxSpent) * 100 : 0;
        barClass = 'free';
        footer = `<button class="link-btn" type="button" data-edit="${cat}">Set limit</button>`;
      }

      if (ui.editingCat === cat) {
        footer = `
          <div class="limit-edit">
            <label class="sr" for="limitInput">Monthly limit for ${cat}</label>
            <input id="limitInput" type="text" inputmode="decimal" autocomplete="off" placeholder="0.00"
                   data-limit-input="${cat}" value="${limit > 0 ? limit : ''}">
            <button class="link-btn" type="button" data-save="${cat}">Save limit</button>
            <button class="link-btn" type="button" data-cancel="1">Cancel</button>
          </div>`;
      }

      return `
        <li>
          <div class="cat-head"><span class="cat-name">${cat}</span><span class="cat-amt">${esc(money(spent))}</span></div>
          <div class="bar"><i class="${barClass}" style="width:${percent.toFixed(1)}%"></i></div>
          <div class="cat-foot">${footer}</div>
        </li>`;
    }).join('');
  }

  function emptyMessage(hasAnyData, hasMonthData) {
    if (!hasAnyData) {
      return '<p class="empty">Nothing here yet. Add your income first, then your spending as it happens. ' +
        '<button class="link-btn" type="button" id="sample">Load sample data</button> to see how it looks.</p>';
    }
    if (!hasMonthData) return '<p class="empty">No entries for this month. Use the form to add one.</p>';
    return '<p class="empty">No entries match this filter.</p>';
  }

  function renderEntries() {
    const filter = $('filter').value || 'all';
    const monthTx = BT.store.monthTransactions();

    const items = monthTx
      .filter((t) => {
        if (filter === 'all') return true;
        if (filter === 'Income') return t.type === 'income';
        return t.type === 'expense' && t.cat === filter;
      })
      .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : (a.id < b.id ? 1 : -1)));

    $('txList').innerHTML = items.map((t) => {
      const isIncome = t.type === 'income';
      const typeName = isIncome ? 'Income' : t.cat;
      const title = t.note || typeName;
      const meta = t.note ? `${typeName}, ${shortDate(t.date)}` : shortDate(t.date);
      return `
        <li class="tx">
          <div><span class="tx-title">${esc(title)}</span><span class="tx-meta">${esc(meta)}</span></div>
          <span class="tx-amt ${isIncome ? 'in' : 'out'}">${isIncome ? '+' : ''}${esc(money(t.amount))}</span>
          <button class="del" type="button" data-del="${esc(t.id)}" aria-label="Delete ${esc(title)}">&times;</button>
        </li>`;
    }).join('');

    $('listEmpty').innerHTML = items.length
      ? ''
      : emptyMessage(state.tx.length > 0, monthTx.length > 0);
  }

  function renderForm() {
    const isIncome = ui.formType === 'income';
    $('catField').hidden = isIncome;
    $('submitBtn').textContent = isIncome ? 'Add income' : 'Add expense';
    $('note').placeholder = isIncome ? 'Where did it come from?' : 'What was it for?';
  }

  /** Redraws the whole page, then moves focus if something asked for it. */
  function renderAll() {
    renderMonth();
    renderHero();
    renderCategories();
    renderEntries();
    if (ui.pendingFocus) {
      const el = document.querySelector(ui.pendingFocus);
      if (el) el.focus();
      ui.pendingFocus = null;
    }
  }

  BT.render = { setup, renderAll, renderCategories, renderEntries, renderForm, money };
})(window.BT);
