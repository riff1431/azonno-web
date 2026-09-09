async function testSchema(url) {
  const r = await fetch(url);
  const text = await r.text();
  const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  console.log(`\n=== Testing Schema for ${url} ===`);
  let count = 0;
  while ((match = regex.exec(text)) !== null) {
    count++;
    try {
      const obj = JSON.parse(match[1]);
      console.log(`  [Schema #${count}] @type: ${obj["@type"]} | Name: ${obj.name || obj.headline || "(Root)"}`);
      if (obj["@type"] === "Product") {
        console.log(`     Price: ${obj.offers?.price} ${obj.offers?.priceCurrency} | Availability: ${obj.offers?.availability} | Seller: ${obj.offers?.seller?.name}`);
        console.log(`     AggregateRating:`, obj.aggregateRating ? obj.aggregateRating : "None (Correctly suppressed when 0 reviews)");
      }
      if (obj["@type"] === "WebSite") {
        console.log(`     SearchAction Target: ${obj.potentialAction?.target?.urlTemplate}`);
      }
      if (obj["@type"] === "BreadcrumbList") {
        console.log(`     Breadcrumb Items Count: ${obj.itemListElement?.length}`);
      }
      if (obj["@type"] === "ItemList") {
        console.log(`     ItemList NumberOfItems: ${obj.numberOfItems}`);
      }
    } catch (e) {
      console.error(`  [Schema #${count}] JSON Parse Error:`, e.message);
    }
  }
}

async function run() {
  await testSchema("http://localhost:3000");
  await testSchema("http://localhost:3000/products/advanced-snail-96-mucin-power-essence-100ml");
  await testSchema("http://localhost:3000/categories/skincare");
  await testSchema("http://localhost:3000/blog/how-to-identify-authentic-vs-fake-cosmetics-bangladesh");
  await testSchema("http://localhost:3000/page/authenticity-guarantee");
}

run();
