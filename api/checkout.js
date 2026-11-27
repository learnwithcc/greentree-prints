// Greentree Prints — creates a Stripe Checkout Session for an /order submission.
//
// The only server-side code on the site. It recalculates the price from
// order/pricing.js (never trusting an amount from the browser), puts every
// order detail into Stripe metadata, and returns the hosted Checkout URL.
//
// Env vars (set in Vercel → Project → Settings → Environment Variables):
//   STRIPE_SECRET_KEY  required. A TEST key (sk_test_… or rk_test_…).
//                      Live keys are refused unless STRIPE_ALLOW_LIVE=true.
//   STRIPE_ALLOW_LIVE  optional. Leave unset until going live on purpose.
//
// Calls Stripe's REST API with fetch, so there is no SDK and no package.json.
'use strict';

const PRICING = require('../order/pricing.js');

const LIMITS = { name: 80, email: 120, phone: 30, colour: 40, link: 500, notes: 1000, referral: 60 };
const META_MAX = 500; // Stripe metadata values are capped at 500 characters.
const ORN_OK = /^[A-Za-zÀ-ÖØ-öø-ɏ ]+$/;
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function orderRef() {
  const t = new Date();
  const day = t.toISOString().slice(2, 10).replace(/-/g, '');
  return 'GT-' + day + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

// Turns { a: { b: 1 } } into a=…&b… form encoding the way Stripe expects (a[b]=1).
function formEncode(obj, prefix, out) {
  out = out || [];
  Object.keys(obj).forEach(function (k) {
    const v = obj[k];
    if (v === undefined || v === null || v === '') return;
    const key = prefix ? prefix + '[' + k + ']' : k;
    if (typeof v === 'object') formEncode(v, key, out);
    else out.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(v)));
  });
  return out.join('&');
}

function originOf(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  if (!/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return null;
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return (local ? 'http://' : 'https://') + host;
}

function validate(b) {
  const o = {
    item: str(b.item, 20),
    size: str(b.size, 20),
    material: str(b.material, 20),
    finish: str(b.finish, 20) || 'standard',
    colour: str(b.colour, LIMITS.colour),
    quantity: parseInt(b.quantity, 10),
    text: str(b.text, PRICING.customText.maxLength),
    link: str(b.link, LIMITS.link),
    notes: str(b.notes, LIMITS.notes),
    name: str(b.name, LIMITS.name),
    email: str(b.email, LIMITS.email),
    phone: str(b.phone, LIMITS.phone),
    referral: str(b.referral, LIMITS.referral),
    ornament: Date.now() < PRICING.ornamentOfferEnds ? str(b.ornament, 40) : ''
  };
  const errors = [];
  const item = PRICING.items[o.item];
  if (!o.name) errors.push('name');
  if (!EMAIL_OK.test(o.email)) errors.push('email');
  if (!o.colour) errors.push('colour');
  if (!(o.quantity >= 1)) errors.push('quantity');
  if (item && item.text === 'required' && !o.text) errors.push('text');
  if (item && item.text === 'none') o.text = '';
  if (item && item.needsLink && !o.link) errors.push('link');
  if (o.link && !/^https?:\/\//i.test(o.link)) errors.push('link');
  if (o.ornament && (o.ornament.length > PRICING.ornamentMaxLength || !ORN_OK.test(o.ornament))) errors.push('ornament');
  return { order: o, errors: errors };
}

function label(group, key) {
  return PRICING[group][key] ? PRICING[group][key].label : '';
}

function metadataFor(ref, o, price) {
  const m = {
    order_ref: ref,
    item: label('items', o.item),
    size: PRICING.items[o.item].usesSize ? label('sizes', o.size) : '',
    material: label('materials', o.material),
    colour: o.colour,
    finish: label('finishes', o.finish),
    quantity: String(price.quantity),
    custom_text: o.text,
    model_link: o.link,
    notes_1: o.notes.slice(0, META_MAX),
    notes_2: o.notes.slice(META_MAX, META_MAX * 2),
    name: o.name,
    email: o.email,
    phone: o.phone,
    referred_by: o.referral,
    free_ornament_name: o.ornament,
    price_each: '$' + price.unit,
    small_job_top_up: price.topUp ? '$' + price.topUp : '',
    total: '$' + price.total + ' ' + PRICING.currency.toUpperCase(),
    pricing_version: PRICING.version
  };
  Object.keys(m).forEach(function (k) { m[k] = String(m[k] || '').slice(0, META_MAX); });
  return m;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key) return res.status(503).json({ error: 'not_configured' });
  if (!/^(sk|rk)_test_/.test(key) && process.env.STRIPE_ALLOW_LIVE !== 'true') {
    console.error('checkout: refusing a non-test Stripe key (set STRIPE_ALLOW_LIVE=true to go live)');
    return res.status(503).json({ error: 'not_configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'bad_request' });

  const checked = validate(body);
  if (checked.errors.length) return res.status(400).json({ error: 'invalid', fields: checked.errors });
  const o = checked.order;

  const price = PRICING.calculate(o);
  if (price.quote) return res.status(422).json({ error: 'needs_quote', reasons: price.reasons });

  const origin = originOf(req);
  if (!origin) return res.status(400).json({ error: 'bad_host' });

  const ref = orderRef();
  const meta = metadataFor(ref, o, price);
  const summary = [meta.item, meta.size, meta.material, o.colour, meta.finish !== label('finishes', 'standard') ? meta.finish : '']
    .filter(Boolean).join(' · ');
  const cents = function (d) { return Math.round(d * 100); };

  const lineItems = [{
    quantity: price.quantity,
    price_data: {
      currency: PRICING.currency,
      unit_amount: cents(price.unit),
      product_data: {
        name: 'Custom 3D print — ' + meta.item,
        description: (summary + (o.text ? ' · Text: "' + o.text + '"' : '')).slice(0, 500)
      }
    }
  }];
  if (price.topUp) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: PRICING.currency,
        unit_amount: cents(price.topUp),
        product_data: { name: 'Small-job minimum (jobs start at $' + PRICING.minimumJob + ')' }
      }
    });
  }

  const params = {
    mode: 'payment',
    submit_type: 'pay',
    client_reference_id: ref,
    customer_email: o.email,
    line_items: lineItems,
    metadata: meta,
    payment_intent_data: {
      description: ('Greentree Prints ' + ref + ' — ' + o.name + ' — ' + summary + ' × ' + price.quantity).slice(0, 500),
      receipt_email: o.email,
      metadata: meta
    },
    custom_text: {
      submit: { message: "Porch pickup in Greentree Village, Burnaby. I'll text or email when it's ready." }
    },
    success_url: origin + '/order/thanks/?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: origin + '/order/cancelled/'
  };

  let stripeRes, data;
  try {
    stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': ref
      },
      body: formEncode(params)
    });
    data = await stripeRes.json();
  } catch (e) {
    console.error('checkout: Stripe request failed', e && e.message);
    return res.status(502).json({ error: 'stripe_unreachable' });
  }

  if (!stripeRes.ok || !data.url) {
    console.error('checkout: Stripe error', stripeRes.status, data && data.error && data.error.message);
    return res.status(502).json({ error: 'stripe_error' });
  }

  return res.status(200).json({ url: data.url, ref: ref, total: price.total });
};
