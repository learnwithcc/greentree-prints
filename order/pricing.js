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
 * The words customers see for each option live here too, next to its price:
 *   blurb  – one or two lines shown on the option card
 *   more   – the "What's this?" detail (tap or click to open)
 *   why    – why it costs more (shown with the detail)
 *   photo  – optional image path, e.g. '/order/photos/petg.jpg'. Leave ''
 *            and the page draws a labelled illustration instead.
 *
 * Plain ES5 on purpose: browsers read it via <script>, Node via require().
 */
(function (root) {
  var PRICING = {
    version: '2026-11-27',
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
      model:   { label: 'A model I found online', usesSize: true, text: 'optional', needsLink: true,
                 blurb: 'Found something on Printables, MakerWorld or Thingiverse? Send the link and I\'ll print it.' },
      nametag: { label: 'Name tag, keychain or bag tag', price: 6, text: 'required',
                 blurb: 'Your words on a tag: keychains, bag tags, pet tags, desk names.' },
      repair:  { label: 'Replacement for a broken part', quote: true, text: 'none',
                 blurb: 'A clip, knob, bracket or cover that snapped. I\'ll work out a replacement.' },
      custom:  { label: 'Something designed from scratch', quote: true, text: 'optional',
                 blurb: 'An idea that doesn\'t exist yet. Describe it and I\'ll quote the design and the print.' }
    },

    sizes: {
      small:  { label: 'Small', hint: 'fits in your palm, up to ~6 cm', price: 6,
                blurb: 'Keychains, figurines, cable clips, game pieces.' },
      medium: { label: 'Medium', hint: 'fits in your hand, up to ~12 cm', price: 12,
                blurb: 'Phone stands, small planters, toys, hooks.' },
      large:  { label: 'Large', hint: 'up to shoebox size, ~20 cm', price: 24,
                blurb: 'Organisers, vases, lamp shades, bigger toys.' },
      unsure: { label: 'Not sure', hint: "I'll check the model", quote: true,
                blurb: 'I\'ll look at the model and reply with a firm price. Nothing is charged.' }
    },

    // `auto` = "Not sure, you pick". It's charged like PLA; if I decide the job
    // really needs PETG, I cover the difference. Change its price if that's wrong.
    materials: {
      pla:  { label: 'PLA', hint: 'everyday indoor items', price: 0, recommended: true,
              blurb: 'The everyday standard. Crisp detail and a smooth, low-shine look. Best for things that live indoors.',
              more: 'PLA is a plant-based plastic and what most 3D prints are made of. It comes in the most colours and shows fine detail best. It is stiff rather than bendy, and it can soften if left in a hot car or in strong summer sun, so it is not the one for outdoor or car parts.',
              why: 'Included in the price.', photo: '' },
      petg: { label: 'PETG', hint: "car, garage, outdoors — won't warp in heat", price: 2,
              blurb: 'Tougher and handles heat, sun and rain. Good for the car, garage, garden or outdoors. Slightly glossy.',
              more: 'PETG is the same family of plastic as water bottles. It bends a little before it breaks instead of snapping, and it will not go soft on a hot dashboard. It has a light shine, and colours look slightly see-through at the edges. Pick it for anything that lives outside, in a car, near heat, or gets knocked around.',
              why: 'It costs $2 more because the material costs more and it prints slower, so the printer is busy longer.', photo: '' },
      tpu:  { label: 'Flexible (TPU)', hint: 'rubbery, bendy parts', quote: true,
              blurb: 'Rubbery and bendy, like a phone case. For grips, bumpers, feet, straps and seals.',
              more: 'TPU is a soft, rubber-like plastic. You can squeeze and bend it and it springs back. It grips well and absorbs knocks, which makes it good for furniture feet, drawer bumpers, phone cases, watch straps and gaskets.',
              why: 'Priced by quote because it prints very slowly and needs a careful setup, and how long that takes depends on the part.', photo: '' },
      auto: { label: 'Not sure, you pick', hint: 'I\'ll choose the right material', price: 0,
              blurb: 'I\'ll choose based on what it is and where it\'ll be used. No extra charge.',
              more: 'Most things are fine in PLA. If yours will live outdoors, in a car or near heat, I\'ll use PETG instead at no extra cost. A note about where it will be used helps: there\'s a space for that a couple of steps on.',
              why: 'Charged like PLA. If it needs something tougher, I cover the difference.', photo: '' }
    },

    // Colours in stock. "Something else" adds a few days but doesn't change the price.
    colours: ['Black', 'White', 'Grey', 'Forest green', 'Red', 'Blue', 'Yellow', 'Orange', 'Surprise me'],
    otherColourLabel: 'Something else',

    // `auto` = "Not sure, you pick". Charged like Standard; I choose standard or silk.
    finishes: {
      standard: { label: 'Standard matte', price: 0, recommended: true,
                  blurb: 'A soft, low-shine finish in one colour. Right for almost everything.',
                  more: 'A plain, even surface with very little shine, so it looks clean and hides the fine layer lines that every 3D print has.',
                  why: 'Included in the price.', photo: '' },
      silk:     { label: 'Silk / shiny', price: 2,
                  blurb: 'A pearly, metallic-looking shine, like satin ribbon. Lovely for gifts, vases and décor.',
                  more: 'Silk filament has a glossy, almost metallic sheen that catches the light, and the colour shifts a little as you turn it. It is a bit less strong than standard, so it is best for things that look pretty rather than parts that take a beating.',
                  why: 'It costs $2 more because silk filament costs more and prints slower.', photo: '' },
      twotone:  { label: 'Two colours', price: 4,
                  blurb: 'Two colours in one print, like white letters on a black tag. You pick both colours next.',
                  more: 'The printer swaps between two colours as it builds, so you can have raised letters in one colour and the base in another, or a design split into two colours.',
                  why: 'It costs $4 more because swapping colours takes the printer longer and uses extra filament.', photo: '' },
      auto:     { label: 'Not sure, you pick', price: 0,
                  blurb: 'I\'ll choose the finish that suits it best. No extra charge.',
                  more: 'Usually that\'s standard matte. For a gift or decoration I might use silk if it suits the piece. Either way, the price doesn\'t change.',
                  why: 'Charged like standard.', photo: '' }
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
