const routes = [
  '/',
  '/products',
  '/products/advanced-snail-96-mucin-power-essence-100ml',
  '/categories',
  '/brands',
  '/cart',
  '/checkout',
  '/track-order',
  '/wishlist',
  '/quiz',
  '/blog',
  '/blog/how-to-identify-authentic-vs-fake-cosmetics-bangladesh',
  '/blog/k-beauty-glass-skin-routine-bangladesh',
  '/blog/top-10-vitamin-c-serums-dark-spots-bangladesh',
  '/page/authenticity-guarantee',
  '/page/about-us',
  '/page/delivery-policy',
  '/page/return-refund-policy',
  '/page/terms-and-conditions'
];

async function checkRoute(route) {
  try {
    const res = await fetch(`http://localhost:3000${route}`);
    const text = await res.text();
    const hasError = text.includes('Application error') || text.includes('Unhandled Runtime Error') || text.includes('Hydration failed');
    return {
      route,
      status: res.status,
      ok: res.status === 200 && !hasError,
      length: text.length,
      hasError
    };
  } catch (err) {
    return {
      route,
      status: 0,
      ok: false,
      error: err.message
    };
  }
}

async function run() {
  console.log('--- Deep Auditing All Storefront Routes & Pages ---');
  let allPass = true;
  for (const r of routes) {
    const res = await checkRoute(r);
    if (res.ok) {
      console.log(`[PASS] ${res.route} (Status: ${res.status}, HTML bytes: ${res.length})`);
    } else {
      console.error(`[FAIL] ${res.route} (Status: ${res.status}, Error: ${res.hasError ? 'React/Hydration Error' : res.error})`);
      allPass = false;
    }
  }
  if (allPass) {
    console.log('\nAll 19 routes verified successfully with 0 errors.');
  } else {
    process.exit(1);
  }
}

run();
