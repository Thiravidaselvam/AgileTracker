import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false, slowMo: 300 })
const ctx = await browser.newContext({ storageState: undefined })
const page = await ctx.newPage()

// login
await page.goto("http://localhost:3000/login")
await page.fill('input[type="email"]', "thiravidaselvams@gmail.com")
await page.fill('input[type="password"]', "Admin@123")
await page.click('button[type="submit"]')
await page.waitForURL("http://localhost:3000/")
await page.waitForTimeout(2000)

// screenshot 1 — full dashboard no filter
await page.screenshot({ path: "scripts/dash-01-default.png", fullPage: false })
console.log("1. Dashboard loaded")

// scroll down to see user progress table
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(500)
await page.screenshot({ path: "scripts/dash-02-user-table.png", fullPage: false })
console.log("2. User progress table")

// scroll back up and apply a filter
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(300)

// pick first user from dropdown (index 1 = first real user)
await page.selectOption('select', { index: 1 })

// set date range
const from = new Date(); from.setMonth(from.getMonth() - 3)
const pad = (n) => String(n).padStart(2, "0")
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
await page.fill('input[type="date"]:first-of-type', fmt(from))

const to = new Date()
await page.fill('input[type="date"]:last-of-type', fmt(to))

// apply
await page.click('button:has-text("Apply")')
await page.waitForTimeout(2000)
await page.screenshot({ path: "scripts/dash-03-filtered.png", fullPage: false })
console.log("3. Filtered dashboard")

// scroll to user table
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(400)
await page.screenshot({ path: "scripts/dash-04-filtered-table.png", fullPage: false })
console.log("4. Filtered user table")

await browser.close()
