import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false, slowMo: 500 })
const page = await browser.newPage()

await page.goto("http://localhost:3000")
await page.screenshot({ path: "scripts/ss-01-home.png" })
console.log("1. Loaded:", page.url())

await page.fill('input[name="email"], input[type="email"]', "thiravidaselvams@gmail.com")
await page.fill('input[name="password"], input[type="password"]', "Admin@123")
await page.screenshot({ path: "scripts/ss-02-filled.png" })

await page.click('button[type="submit"]')
await page.waitForTimeout(3000)
await page.screenshot({ path: "scripts/ss-03-after-login.png" })
console.log("2. After login:", page.url())

await page.waitForTimeout(2000)
await browser.close()
