const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1240, height: 1754 },
    deviceScaleFactor: 2
  });
  const page = await ctx.newPage();
  await page.goto('file:///D:/myData/demo/Bookkeeping/docs/posters.html');
  await page.waitForTimeout(1000);

  // Get all pages
  const pages = await page.$$('.page');
  console.log(`Found ${pages.length} pages`);

  for (let i = 0; i < pages.length; i++) {
    await pages[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const path = `D:/myData/demo/Bookkeeping/docs/poster-${i + 1}.png`;
    await pages[i].screenshot({ path, type: 'png' });
    console.log(`Saved: ${path}`);
  }

  await browser.close();
  console.log('Done!');
})();
