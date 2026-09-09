async function verifyAllRoutes() {
  const routes = [
    "/",
    "/products",
    "/checkout",
    "/blog",
    "/blog/how-to-identify-authentic-vs-fake-cosmetics-bangladesh",
    "/blog/k-beauty-glass-skin-routine-bangladesh",
    "/blog/top-10-vitamin-c-serums-dark-spots-bangladesh",
    "/page/authenticity-guarantee",
    "/page/about-us",
    "/page/delivery-policy",
    "/page/return-refund-policy",
    "/page/terms-and-conditions",
  ];

  console.log("=== Verifying Routes at http://localhost:3000 ===");
  let passed = 0;
  let failed = 0;

  for (const r of routes) {
    try {
      const url = `http://localhost:3000${r}`;
      const res = await fetch(url, { headers: { "Accept-Language": "bn" } });
      if (res.status === 200) {
        console.log(`[PASS] ${r} -> Status ${res.status}`);
        passed++;
      } else {
        console.error(`[FAIL] ${r} -> Status ${res.status}`);
        failed++;
      }
    } catch (err) {
      console.error(`[ERR]  ${r} -> ${err.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
}

verifyAllRoutes();
