# Budget tracker

A private, single-page budget tracker. Track income and spending by month, set limits per category, and see how much money is left at a glance. No build step, no dependencies, no account.

## Run it

Open `index.html` in a browser (double-click it), or in VS Code install the **Live Server** extension, right-click `index.html` and choose **Open with Live Server**.

## Project structure

```
budget-tracker/
├── index.html            Page markup only
├── css/
│   ├── tokens.css        Colors and fonts (change the look here)
│   ├── base.css          Reset, typography, buttons, form controls
│   ├── layout.css        Page grid, header, footer, responsive rules
│   └── components.css    Gauge, add form, categories, entries, toast
└── js/
    ├── config.js         Constants: categories, currencies, storage key
    ├── utils.js          Pure helpers: formatting, parsing, escaping
    ├── store.js          Data layer: state, localStorage, all data changes
    ├── toast.js          Bottom notification with optional Undo
    ├── render.js         Turns state into HTML (never changes data)
    └── app.js            Entry point: connects user actions to the store
```

Scripts are plain (non-module) files loaded in order from `index.html`, so the app works when opened straight from disk. Each file adds itself to a single `BT` namespace instead of polluting the global scope.

## How it works

- **Data flow:** an action in `app.js` calls a function in `store.js`, then `render.renderAll()` redraws the page from the current state.
- **Storage:** data is kept in the browser's `localStorage` under the key `budget-tracker-v1`. It stays on the device and is never sent anywhere. Clearing site data removes it.
- **Currency:** switching currency changes the symbol only. Amounts are not converted.

## Common changes

| I want to... | Edit |
| --- | --- |
| Rename or add spending categories | `CATS` in `js/config.js` |
| Add a currency | `RATES` in `js/config.js` |
| Change colors or fonts | `css/tokens.css` |
| Change the gauge size | `SEGMENTS` in `js/config.js`, and `grid-template-columns` on `.gauge` in `css/components.css` |

If you rename a category that already has saved entries, those entries are dropped on the next load because their category no longer exists. Export or note down your data first.

## Browser support

Any current version of Chrome, Edge, Firefox or Safari.
