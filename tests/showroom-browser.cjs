const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
(async () => {
  const output = path.resolve("work/showroom-qa");
  await fs.mkdir(output, { recursive: true });
  await require("esbuild").build({
    entryPoints: ["tests/fixtures/showroom.jsx"],
    bundle: true,
    jsx: "automatic",
    loader: { ".js": "jsx" },
    outfile: path.join(output, "harness.js"),
  });
  await fs.copyFile("styles/apex.css", path.join(output, "apex.css"));
  await fs.copyFile("public/apex-hero.webp", path.join(output, "apex-hero.webp"));
  await fs.copyFile(
    "styles/mobile-showroom.css",
    path.join(output, "mobile.css"),
  );
  await fs.copyFile(
    "public/pmselect-logo.png",
    path.join(output, "pmselect-logo.png"),
  );
  await fs.writeFile(
    path.join(output, "index.html"),
    '<html lang="bg"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="apex.css"><link rel="stylesheet" href="mobile.css"><div id="root"></div><script src="harness.js"></script></html>',
  );
  const server = http.createServer(async (req, res) => {
    const name =
      path.basename(new URL(req.url, "http://localhost").pathname) ||
      "index.html";
    try {
      const body = await fs.readFile(path.join(output, name));
      res.setHeader(
        "Content-Type",
        name.endsWith(".js")
          ? "text/javascript"
          : name.endsWith(".css")
            ? "text/css"
            : name.endsWith(".webp")
                ? "image/webp"
                : name.endsWith(".png")
              ? "image/png"
              : "text/html",
      );
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://localhost:${server.address().port}`;

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const results = [];
  for (const width of [360, 375, 390, 430, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 850 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== "localhost") return route.abort();
      if (url.pathname.startsWith("/photo")) {
        if (url.pathname === "/photo2.svg")
          await new Promise((r) => setTimeout(r, 350));
        return route.fulfill({
          contentType: "image/svg+xml",
          body: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${url.pathname.includes("2") ? "#678" : "#345"}"/></svg>`,
        });
      }
      return route.continue();
    });
    await page.goto(base);
    assert.equal(await page.locator('.car-link').count(), 0);
    if (width === 390) await page.screenshot({path:path.join(output,'intro-390.png'),animations:'disabled'});
    await page
      .getByRole("button", { name: "Разгледай →", exact: true })
      .click();
    const nav = page.getByRole("navigation", { name: "Мобилна навигация" });
    const buttons = nav.locator("button");
    for (const index of [1, 2, 3, 0, 2, 1, 3, 1, 0]) {
      await buttons.nth(index).click();
      assert.equal(await nav.locator(".is-active").count(), 1);
      assert.equal(await nav.locator("[aria-current=page]").count(), 1);
    }
    await buttons.nth(3).click();
    await page.waitForTimeout(1100);
    assert.equal(await buttons.nth(3).getAttribute("class"), "is-active");
    await buttons.nth(1).click();
    await page.waitForTimeout(1100);
    assert.equal(await buttons.nth(1).getAttribute("class"), "is-active");
    await page.mouse.wheel(0, 10000);
    await page.waitForTimeout(600);
    assert.equal(await buttons.nth(3).getAttribute("class"), "is-active");
    await buttons.nth(0).click();
    await page.waitForTimeout(600);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.equal(await page.locator('.car-link').count(), 12);
    await page.locator(".car-link").first().click();
    await page
      .getByRole("button", { name: "Следваща снимка", exact: true })
      .click();
    assert.ok(
      (await page.locator(".gallery-current").getAttribute("src")).includes(
        "photo1",
      ),
    );
    await page.waitForTimeout(750);
    assert.ok(
      (await page.locator(".gallery-current").getAttribute("src")).includes(
        "photo2",
      ),
    );
    if (width === 390) await page.screenshot({path:path.join(output,'detail-390.png'),animations:'disabled'});
    await page
      .getByRole("button", { name: "Отвори снимката на цял екран" })
      .click();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("dialog").count(), 0);
    await page
      .getByRole("button", { name: "Следваща снимка", exact: true })
      .click();
    await page.waitForTimeout(500);
    assert.ok(
      (await page.locator(".gallery-current").getAttribute("src")).includes(
        "photo2",
      ),
    );
    assert.equal(await page.getByRole("status").count(), 1);
    await page
      .getByRole("button", { name: "Предишна снимка", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Към колекцията", exact: false })
      .click();
    assert.equal(await nav.locator(".is-active").count(), 1);
    assert.deepEqual(errors, []);
    await page.screenshot({
      path: path.join(output, `viewport-${width}.png`),
      fullPage: true,
      animations: "disabled",
    });
    results.push({ width, passed: true });
    await page.close();
  }
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await page.route("**/*", (r) =>
    new URL(r.request().url()).hostname === "localhost"
      ? r.continue()
      : r.abort(),
  );
  await page.goto(base);
  await page.getByRole("button", { name: "Разгледай →", exact: true }).click();
  await page.locator(".car-link").first().click();
  assert.equal(
    await page
      .locator(".gallery-current")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  results.push({ reducedMotion: true, passed: true });
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
