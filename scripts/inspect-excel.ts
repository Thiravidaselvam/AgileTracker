import * as XLSX from "xlsx"

const wb = XLSX.readFile("E:/TrainningMaterials/ProgressTracker/Agile_Project_Tracker.xlsx")

const owners = new Set<string>()
const testedBy = new Set<string>()

// Requirements - Owner column
const reqWs = wb.Sheets["Requirements Tracker"]
XLSX.utils.sheet_to_json<any>(reqWs).forEach(r => { if (r["Owner"]) owners.add(r["Owner"].toString().trim()) })

// Issues - Owner column
const issueWs = wb.Sheets["Issue Tracker"]
XLSX.utils.sheet_to_json<any>(issueWs).forEach(r => { if (r["Owner"]) owners.add(r["Owner"].toString().trim()) })

// Test Items - Owner column AND Tested By column
const testWs = wb.Sheets["Test Items Tracker"]
XLSX.utils.sheet_to_json<any>(testWs).forEach(r => {
  if (r["Owner"])     owners.add(r["Owner"].toString().trim())
  if (r["Tested By"]) testedBy.add(r["Tested By"].toString().trim())
})

// Support - Owner column
const supWs = wb.Sheets["Support"]
XLSX.utils.sheet_to_json<any>(supWs).forEach(r => { if (r["Owner"]) owners.add(r["Owner"].toString().trim()) })

// Action Items - Owner column
const actionWs = wb.Sheets["Action Item"]
XLSX.utils.sheet_to_json<any>(actionWs).forEach(r => { if (r["Owner"]) owners.add(r["Owner"].toString().trim()) })

console.log("All unique Owner names:", JSON.stringify([...owners].sort()))
console.log("All unique Tested By:", JSON.stringify([...testedBy].sort()))
console.log("\nAction Item rows:")
XLSX.utils.sheet_to_json<any>(actionWs).slice(0,3).forEach((r,i) => console.log(i, JSON.stringify(r)))
