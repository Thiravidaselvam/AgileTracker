import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false, slowMo: 400 })
const page = await browser.newPage()

// login
await page.goto("http://localhost:3000/login")
await page.fill('input[type="email"]', "thiravidaselvams@gmail.com")
await page.fill('input[type="password"]', "Admin@123")
await page.click('button[type="submit"]')
await page.waitForURL("http://localhost:3000/")
await page.waitForTimeout(1500)

// 1. Dashboard with new CR KPI card
await page.evaluate(() => document.querySelector('.overflow-y-auto')?.scrollTo(0, 0))
await page.screenshot({ path: "scripts/cr-01-dashboard.png" })
console.log("1. Dashboard KPI")

// 2. Navigate to Change Requests
await page.goto("http://localhost:3000/change-requests")
await page.waitForTimeout(1500)
await page.screenshot({ path: "scripts/cr-02-list-empty.png" })
console.log("2. CR list page (empty)")

// 3. Open New CR form
await page.click('button:has-text("New CR")')
await page.waitForTimeout(600)
await page.screenshot({ path: "scripts/cr-03-form.png" })
console.log("3. New CR form")

// 4. Fill the form
await page.fill('input[placeholder="Short summary of the change"]', "Add Export to Excel feature in Reports module")
await page.fill('textarea[placeholder="What exactly needs to change?"]', "The Reports module currently only supports PDF export. Users need the ability to export data to Excel (.xlsx) format for further analysis in spreadsheet tools.")
await page.fill('textarea[placeholder="Why is this change needed?"]', "Multiple clients have requested Excel export capability. This is a high-priority feature for the next sprint to improve user satisfaction and reduce manual data extraction efforts.")
await page.fill('textarea[placeholder="Which modules, systems, or teams are affected?"]', "Reports module, Backend API, Frontend UI. No database schema changes required.")

// Select requestedBy
await page.locator('button[role="combobox"]').first().click()
await page.waitForTimeout(300)
await page.locator('[role="option"]').first().click()
await page.waitForTimeout(200)

await page.fill('input[placeholder="e.g. 4 hours, 2 days"]', "3 days")
await page.fill('input[type="date"]', "2026-07-15")
await page.screenshot({ path: "scripts/cr-04-form-filled.png" })
console.log("4. Form filled")

// 5. Save
await page.click('button:has-text("Save")')
await page.waitForTimeout(1500)
await page.screenshot({ path: "scripts/cr-05-list-with-record.png" })
console.log("5. CR list with record")

// 6. Open the eye (view) button
const eyeBtn = await page.locator('button:has(svg)').last()
// Find the Eye button in the table
const rows = await page.locator('tbody tr').all()
if (rows.length > 0) {
  const viewBtn = rows[0].locator('button').last()
  await viewBtn.click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: "scripts/cr-06-document-view.png" })
  console.log("6. CR document view")
}

await browser.close()
