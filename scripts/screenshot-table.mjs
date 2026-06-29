import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false, slowMo: 200 })
const page = await browser.newPage()

// login
await page.goto("http://localhost:3000/login")
await page.fill('input[type="email"]', "thiravidaselvams@gmail.com")
await page.fill('input[type="password"]', "Admin@123")
await page.click('button[type="submit"]')
await page.waitForURL("http://localhost:3000/")
await page.waitForTimeout(2500)

// scroll the inner scrollable container to the bottom
await page.evaluate(() => {
  const el = document.querySelector('.overflow-y-auto')
  if (el) el.scrollTop = el.scrollHeight
})
await page.waitForTimeout(600)
await page.screenshot({ path: "scripts/dash-05-user-table-scrolled.png" })
console.log("User progress table screenshot done")

await browser.close()
