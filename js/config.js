/**
 * App-wide constants. Edit CATS to change the spending categories.
 */
window.BT = window.BT || {};

BT.config = {
  STORAGE_KEY: 'budget-tracker-v1',
  SEGMENTS: 40,

  CATS: ['Housing', 'Food', 'Transport', 'Bills', 'Health', 'Fun', 'Shopping', 'Other'],

  // Rough exchange rates, used only to scale the sample data to the chosen currency.
  RATES: { USD: 1, EUR: 0.92, GBP: 0.79, PHP: 56, JPY: 150, INR: 83, AUD: 1.5, CAD: 1.36, SGD: 1.35, KRW: 1350 },

  // Default currency guessed from the browser's region.
  REGION_CURRENCY: {
    US: 'USD', GB: 'GBP', PH: 'PHP', JP: 'JPY', IN: 'INR', AU: 'AUD', CA: 'CAD', SG: 'SGD', KR: 'KRW',
    DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', IE: 'EUR'
  }
};
