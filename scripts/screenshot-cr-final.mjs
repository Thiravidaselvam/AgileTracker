import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false, slowMo: 300 })
const page = await browser.newPage()

await page.goto("http://localhost:3000/login")
await page.fill('input[type="email"]', "thiravidaselvams@gmail.com")
await page.fill('input[type="password"]', "Admin@123")
await page.click('button[type="submit"]')
await page.waitForURL("http://localhost:3000/")
await page.waitForTimeout(1500)

// 1. Dashboard with CR KPI
await page.evaluate(() => document.querySelector('.overflow-y-auto')?.scrollTo(0, 0))
await page.waitForTimeout(500)
await page.screenshot({ path: "scripts/final-01-dashboard.png" })
console.log("1. Dashboard with CR KPI card")

// 2. CR list with records
await page.goto("http://localhost:3000/change-requests")
await page.waitForTimeout(1500)
await page.screenshot({ path: "scripts/final-02-cr-list.png" })
console.log("2. CR list with records")

// 3. Kanban board
await page.click('button:has-text("Kanban Board")')
await page.waitForTimeout(600)
await page.screenshot({ path: "scripts/final-03-kanban.png" })
console.log("3. Kanban board")

// 4. Click eye icon on first row (table view)
await page.click('button:has-text("Table View")')
await page.waitForTimeout(500)
const firstRow = page.locator('tbody tr').first()
const eyeBtn = firstRow.locator('button').last()
await eyeBtn.click()
await page.waitForTimeout(800)
await page.screenshot({ path: "scripts/final-04-document.png" })
console.log("4. CR document view")

await browser.close()
