/**
 * Entry point: wires up user actions to the store, then redraws the page.
 */
(function (BT) {
  'use strict';

  const { $, parseAmount, todayString } = BT.utils;
  const { store, render, toast } = BT;
  const { ui } = store;
  const { money } = render;

  function refresh() {
    render.renderAll();
  }

  /* ---------- Header: month and currency ---------- */

  function bindHeader() {
    $('prev').addEventListener('click', () => { store.shiftMonth(-1); ui.editingCat = null; refresh(); });
    $('next').addEventListener('click', () => { store.shiftMonth(1); ui.editingCat = null; refresh(); });
    $('thisMonth').addEventListener('click', () => {
      const d = new Date();
      store.goToMonth(d.getFullYear(), d.getMonth());
      ui.editingCat = null;
      refresh();
    });
    $('currency').addEventListener('change', (e) => { store.setCurrency(e.target.value); refresh(); });
  }

  /* ---------- Add form ---------- */

  function bindForm() {
    document.querySelectorAll('input[name="type"]').forEach((radio) => {
      radio.addEventListener('change', () => { ui.formType = radio.value; render.renderForm(); });
    });

    $('amount').addEventListener('input', () => {
      $('amountErr').textContent = '';
      $('amount').removeAttribute('aria-invalid');
    });

    $('form').addEventListener('submit', (e) => {
      e.preventDefault();

      const amount = parseAmount($('amount').value.trim());
      if (!(amount > 0) || !isFinite(amount) || amount >= 1e9) {
        $('amountErr').textContent = 'Enter an amount greater than 0, like 12.50.';
        $('amount').setAttribute('aria-invalid', 'true');
        $('amount').focus();
        return;
      }

      const isIncome = ui.formType === 'income';
      const date = $('date').value || todayString();
      const tx = store.addTransaction({
        type: ui.formType,
        amount,
        cat: isIncome ? '' : $('cat').value,
        note: $('note').value.trim().slice(0, 60),
        date
      });

      // Show the month the entry belongs to.
      const [y, m] = date.split('-').map(Number);
      store.goToMonth(y, m - 1);
      ui.editingCat = null;

      $('amount').value = '';
      $('note').value = '';
      refresh();
      $('amount').focus();
      toast.show(isIncome ? `Income added: ${money(amount)}.` : `Expense added: ${money(amount)} for ${tx.cat}.`);
    });
  }

  /* ---------- Category limits ---------- */

  function saveLimit(cat) {
    const input = $('limitInput');
    const raw = input ? input.value.trim() : '';
    const value = raw === '' ? 0 : parseAmount(raw);

    if (raw !== '' && !(value > 0)) {
      toast.show('Enter a limit greater than 0, or leave it empty to remove it.');
      if (input) input.focus();
      return;
    }

    store.setLimit(cat, value);
    ui.editingCat = null;
    ui.pendingFocus = `[data-edit="${cat}"]`;
    refresh();
  }

  function cancelLimitEdit() {
    const cat = ui.editingCat;
    ui.editingCat = null;
    ui.pendingFocus = `[data-edit="${cat}"]`;
    refresh();
  }

  function bindCategories() {
    const list = $('cats');

    list.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;

      if (button.hasAttribute('data-edit')) {
        ui.editingCat = button.getAttribute('data-edit');
        render.renderCategories();
        const input = $('limitInput');
        if (input) { input.focus(); input.select(); }
      } else if (button.hasAttribute('data-save')) {
        saveLimit(button.getAttribute('data-save'));
      } else if (button.hasAttribute('data-cancel')) {
        cancelLimitEdit();
      }
    });

    list.addEventListener('keydown', (e) => {
      const input = e.target.closest('[data-limit-input]');
      if (!input) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        saveLimit(input.getAttribute('data-limit-input'));
      } else if (e.key === 'Escape') {
        cancelLimitEdit();
      }
    });
  }

  /* ---------- Entries list, sample data, erase ---------- */

  function bindEntries() {
    $('filter').addEventListener('change', render.renderEntries);

    $('txList').addEventListener('click', (e) => {
      const button = e.target.closest('[data-del]');
      if (!button) return;

      const removed = store.removeTransaction(button.getAttribute('data-del'));
      if (!removed) return;

      refresh();
      toast.show(`Deleted ${money(removed.tx.amount)}.`, {
        label: 'Undo',
        run: () => { store.restoreTransaction(removed.tx, removed.index); refresh(); }
      });
    });

    $('listEmpty').addEventListener('click', (e) => {
      if (e.target && e.target.id === 'sample') {
        store.loadSample();
        refresh();
        toast.show('Sample data loaded. Erase all data whenever you want a clean start.');
      }
    });
  }

  function bindErase() {
    const button = $('erase');
    let armed = false;
    let timer = null;

    button.addEventListener('click', () => {
      if (!armed) {
        armed = true;
        button.textContent = 'Click again to erase everything';
        timer = setTimeout(() => { armed = false; button.textContent = 'Erase all data'; }, 4000);
        return;
      }
      clearTimeout(timer);
      armed = false;
      button.textContent = 'Erase all data';
      store.reset();
      ui.editingCat = null;
      refresh();
      toast.show('All data erased.');
    });
  }

  /* ---------- Start ---------- */

  render.setup();
  bindHeader();
  bindForm();
  bindCategories();
  bindEntries();
  bindErase();
  render.renderForm();
  refresh();
})(window.BT);
