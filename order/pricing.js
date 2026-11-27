/*
 * Greentree Prints — order price table
 * =====================================
 * THIS IS THE ONE PLACE TO EDIT PRICES.
 *
 * The /order page loads this file to show a live price, and the checkout
 * function (api/checkout.js) loads the SAME file to work out what Stripe
 * charges. The amount is always recalculated on the server from this table,
 * so nobody can change the price in their browser.
 *
 * All amounts are Canadian dollars, per item, before quantity.
 * Item price = item or size price + material + finish + custom text.
 * Order total = item price × quantity, topped up to `minimumJob` if lower.
 *
 * Anything marked `quote: true` can't be paid online — the page switches to
 * "Request a quote" and sends the details by email instead.
 *
 * STARTING NUMBERS ARE PLACEHOLDERS built from "jobs start at $10".
 * Change them freely. After editing, commit and push; both the page and the
 * checkout pick up the new numbers on the next deploy.
 *
 * Plain ES5 on purpose: browsers read it via <script>, Node via require().
 */
(function (root) {
  var PRICING = {
    version: '2026-11-26',
    currency: 'cad',

    // "Jobs start at $10" — orders below this get a small-job top-up line.
    minimumJob: 10,

    // Orders above this quantity go to a quote (bulk pricing is a conversation).
    maxOnlineQty: 20,

    // What the visitor is ordering.
    //   usesSize: true  → price comes from `sizes` below
    //   price: n        → fixed price per item, no size question
    //   text: 'required' | 'optional' | 'none'
    //   needsLink: true → model link is required
    items: {
      model:   { label: 'A model I found online', usesSize: true, text: 'optional', needsLink: true },
      nametag: { label: 'Name tag, keychain or bag tag', price: 6, text: 'required' },
      repair:  { label: 'Replacement for a broken part', quote: true, text: 'none' },
      custom:  { label: 'Something designed from scratch', quote: true, text: 'optional' }
    },

    sizes: {
      small:  { label: 'Small', hint: 'fits in your palm, up to ~6 cm', price: 6 },
      medium: { label: 'Medium', hint: 'fits in your hand, up to ~12 cm', price: 12 },
      large:  { label: 'Large', hint: 'up to shoebox size, ~20 cm', price: 24 },
      unsure: { label: 'Not sure', hint: "I'll check the model", quote: true }
    },

    materials: {
      pla:  { label: 'PLA', hint: 'everyday indoor items', price: 0 },
      petg: { label: 'PETG', hint: "car, garage, outdoors — won't warp in heat", price: 2 },
      tpu:  { label: 'Flexible (TPU)', hint: 'rubbery, bendy parts', quote: true }
    },

    // Colours in stock. "Something else" adds a few days but doesn't change the price.
    colours: ['Black', 'White', 'Grey', 'Forest green', 'Red', 'Blue', 'Yellow', 'Orange', 'Surprise me'],
    otherColourLabel: 'Something else',

    finishes: {
      standard: { label: 'Standard matte', price: 0 },
      silk:     { label: 'Silk / shiny', price: 2 },
      twotone:  { label: 'Two colours', price: 4 }
    },

    // Adding a name or short text to an item where text is optional (per item).
    customText: { price: 3, maxLength: 40 },

    // Holiday ornament offer (same window as the homepage forms).
    // Dec 10, 2026 00:00 in Vancouver = 07:00 UTC (BC is on permanent UTC-7).
    ornamentOfferEnds: Date.UTC(2026, 11, 10, 7, 0, 0),
    ornamentMaxLength: 12
  };

  function has(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }

  // Works out the price for an order, or says why it needs a quote.
  // `o` = { item, size, material, finish, quantity, text }
  // Returns { quote: true, reasons: [...] }  or
  //         { quote: false, unit, quantity, subtotal, topUp, total, parts: [...] }
  PRICING.calculate = function (o) {
    var P = PRICING, reasons = [], parts = [], unit = 0;
    var item = has(P.items, o.item) ? P.items[o.item] : null;
    if (!item) return { quote: true, reasons: ['Pick what you are ordering'] };
    if (item.quote) reasons.push(item.label + ' needs a look before pricing');

    if (item.usesSize) {
      var size = has(P.sizes, o.size) ? P.sizes[o.size] : null;
      if (!size || size.quote) reasons.push('Size not settled yet');
      else { unit += size.price; parts.push(size.label + ' size $' + size.price); }
    } else if (typeof item.price === 'number') {
      unit += item.price; parts.push(item.label + ' $' + item.price);
    }

    var mat = has(P.materials, o.material) ? P.materials[o.material] : null;
    if (!mat || mat.quote) reasons.push((mat ? mat.label : 'This material') + ' is priced by quote');
    else if (mat.price) { unit += mat.price; parts.push(mat.label + ' +$' + mat.price); }

    var fin = has(P.finishes, o.finish) ? P.finishes[o.finish] : P.finishes.standard;
    if (fin.price) { unit += fin.price; parts.push(fin.label + ' +$' + fin.price); }

    if (item.text === 'optional' && o.text) {
      unit += P.customText.price; parts.push('Custom text +$' + P.customText.price);
    }

    var qty = parseInt(o.quantity, 10);
    if (!(qty >= 1)) qty = 1;
    if (qty > P.maxOnlineQty) reasons.push('More than ' + P.maxOnlineQty + ' pieces is a bulk quote');

    if (reasons.length) return { quote: true, reasons: reasons };

    var subtotal = unit * qty;
    var topUp = subtotal < P.minimumJob ? P.minimumJob - subtotal : 0;
    return { quote: false, unit: unit, quantity: qty, subtotal: subtotal, topUp: topUp, total: subtotal + topUp, parts: parts };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = PRICING;
  else root.GT_PRICING = PRICING;
})(this);
