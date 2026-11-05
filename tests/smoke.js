// Browser smoke test with a fake Supabase backend (no real data touched).
// Logs in as admin, employee and customer, opens every page in the nav, and
// checks the invite/reset link shows the set-password screen.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const nm = path.join(root, 'node_modules');
const libs = {
  'cdn.jsdelivr.net/npm/@supabase/supabase-js@2': path.join(nm, '@supabase/supabase-js/dist/umd/supabase.js'),
};
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = 'x.' + b64({ sub: 'u1', role: 'authenticated', exp: 4102444800 }) + '.y';
const user = { id: 'u1', email: 'test@example.com', aud: 'authenticated', role: 'authenticated' };

async function openPortal(browser, profile, hash = '') {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = []; let where = 'load';
  page.on('pageerror', e => errors.push(`[${where}] ${e.message}`));
  page.on('dialog', d => d.dismiss());
  await page.route('**/*', route => {
    const req = route.request(), u = new URL(req.url()), key = u.host + u.pathname;
    if (libs[key]) return route.fulfill({ path: libs[key], contentType: 'text/javascript' });
    if (u.host.endsWith('.supabase.co')) {
      const single = (req.headers()['accept'] || '').includes('object');
      if (u.pathname.startsWith('/auth/v1/token')) return route.fulfill({ json: { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user } });
      if (u.pathname.startsWith('/auth/v1/user')) return route.fulfill({ json: user });
      if (u.pathname.startsWith('/auth/v1/')) return route.fulfill({ json: {} });
      if (u.pathname.startsWith('/rest/v1/profiles')) return route.fulfill({ json: single ? profile : [profile] });
      if (u.pathname.startsWith('/rest/v1/')) return route.fulfill({ json: single ? {} : [] });
      return route.fulfill({ json: {} });
    }
    if (u.host === 'portal.test') {
      const f = path.join(root, u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
      if (fs.existsSync(f)) return route.fulfill({ path: f });
      errors.push(`[${where}] 404 ${u.pathname}`);
      return route.fulfill({ status: 404, body: '' });
    }
    return route.fulfill({ body: '' }); // fonts, barcode lib etc.
  });
  await page.goto('http://portal.test/' + hash);
  await page.waitForTimeout(600);
  return { page, errors, setWhere: w => (where = w) };
}

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) failed++; };

  for (const [role, cust] of [['admin', null], ['employee', null], ['customer', 'platinum_financial_g_2420']]) {
    const { page, errors, setWhere } = await openPortal(browser, { id: 'u1', role, full_name: 'Test', customer_id: cust, active: true });
    setWhere('login');
    await page.fill('#lgEmail', 'test@example.com');
    await page.fill('#lgPass', 'secret123');
    await page.click('#lgBtn');
    await page.waitForSelector('#app', { state: 'visible', timeout: 5000 }).catch(() => {});
    check(await page.isVisible('#app'), `${role}: logs in`);
    const ids = await page.$$eval('.nv[data-page]', els => els.map(e => e.dataset.page));
    for (const id of ids) { setWhere(id); await page.evaluate(i => showPage(i), id).catch(e => errors.push(`[${id}] ${e.message}`)); await page.waitForTimeout(250); }
    check(errors.length === 0, `${role}: ${ids.length} pages open without errors${errors.length ? '\n    ' + errors.join('\n    ') : ''}`);
    await page.close();
  }

  { // deactivated account is refused
    const { page } = await openPortal(browser, { id: 'u1', role: 'customer', customer_id: 'x', active: false });
    await page.fill('#lgEmail', 'test@example.com'); await page.fill('#lgPass', 'secret123'); await page.click('#lgBtn');
    await page.waitForTimeout(1200);
    check(!(await page.isVisible('#app')) && /deactivated/.test(await page.textContent('#lgErr')), 'deactivated account cannot log in');
    await page.close();
  }

  for (const type of ['recovery', 'invite']) { // email links show set-password, not auto login
    const hash = `#access_token=${jwt}&refresh_token=r&expires_in=3600&expires_at=4102444800&token_type=bearer&type=${type}`;
    const { page, errors } = await openPortal(browser, { id: 'u1', role: 'admin', active: true }, hash);
    await page.waitForSelector('#newPwInput', { timeout: 5000 }).catch(() => {});
    check(await page.isVisible('#newPwInput') && !(await page.isVisible('#app')), `${type} link shows set-password screen`);
    check(errors.length === 0, `${type} link: no errors${errors.length ? ' ' + errors.join('; ') : ''}`);
    await page.close();
  }

  await browser.close();
  console.log(failed ? `\n${failed} check(s) failed` : '\nAll smoke checks passed');
  process.exit(failed ? 1 : 0);
})();
