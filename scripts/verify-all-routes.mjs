async function verifyAllRoutes() {
  const routes = [
    "/",
    "/shop",
    "/category/casual-shirt",
    "/product/robin-oxford-casual-shirt",
    "/cart",
    "/checkout",
    "/track-order",
    "/account",
    "/admin",
    "/admin/orders",
    "/admin/products",
    "/admin/shipping/steadfast",
    "/admin/payments/bkash",
    "/admin/marketing/homepage",
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
