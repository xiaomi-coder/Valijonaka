const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  // Set localStorage mock if needed for login
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.setItem('erp_token', 'mock_token');
    localStorage.setItem('erp_user', JSON.stringify({ ism: 'Admin', rol: 'admin' }));
  });

  await page.goto('http://localhost:3000/xomAshyo.html');
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
