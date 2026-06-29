import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false, slowMo: 400 })
const page = await browser.newPage()

await page.goto("http://localhost:3000/login")
await page.fill('input[type="email"]', "thiravidaselvams@gmail.com")
await page.fill('input[type="password"]', "Admin@123")
await page.click('button[type="submit"]')
await page.waitForURL("http://localhost:3000/")
await page.waitForTimeout(1000)

await page.goto("http://localhost:3000/change-requests")
await page.waitForTimeout(2000)

// Click the eye icon on the first row (the view button - the one before edit/delete)
await page.locator('tbody tr:first-child button').nth(0).click()
await page.waitForTimeout(1000)
await page.screenshot({ path: "scripts/doc-view.png" })
console.log("Document view")

await browser.close()
