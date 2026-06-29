import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

const statusColor: Record<string, string> = {
  "Submitted":    "bg-blue-100 text-blue-800",
  "Under Review": "bg-yellow-100 text-yellow-800",
  "Approved":     "bg-green-100 text-green-800",
  "Rejected":     "bg-red-100 text-red-800",
  "In Progress":  "bg-purple-100 text-purple-800",
  "Implemented":  "bg-teal-100 text-teal-800",
  "Deferred":     "bg-gray-100 text-gray-700",
}

const priorityColor: Record<string, string> = {
  HIGH:   "bg-red-100 text-red-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW:    "bg-green-100 text-green-800",
}

function Field({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1", full ? "col-span-2" : "")}>
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800 whitespace-pre-wrap">{value || "—"}</span>
    </div>
  )
}

export function CRDocument({ cr }: { cr: any }) {
  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-4">
        <div>
          <p className="text-xs text-gray-500 font-mono mb-1">{cr.crId}</p>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{cr.title}</h1>
          <p className="text-xs text-gray-500 mt-1">Raised on {formatDate(cr.createdAt)} · Last updated {formatDate(cr.updatedAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
          <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", statusColor[cr.status] ?? "bg-gray-100 text-gray-700")}>
            {cr.status}
          </span>
          <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", priorityColor[cr.priority] ?? "bg-gray-100 text-gray-700")}>
            {cr.priority} Priority
          </span>
        </div>
      </div>

      {/* Main fields */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        <Field label="Requested By"    value={cr.requestedBy} />
        <Field label="Assigned Owner"  value={cr.owner?.name} />
        <Field label="Target Date"     value={formatDate(cr.targetDate)} />
        <Field label="Estimated Effort" value={cr.estimatedEffort} />
        <Field label="Actual Completion" value={formatDate(cr.actualCompletion)} />
      </div>

      <hr className="border-gray-100" />

      {/* Content sections */}
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">{cr.description}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Reason / Justification</p>
          <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">{cr.reason}</p>
        </div>

        {cr.impact && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Impact Assessment</p>
            <p className="text-sm text-gray-800 bg-amber-50 border border-amber-100 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">{cr.impact}</p>
          </div>
        )}

        {cr.remarks && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Remarks / Review Notes</p>
            <p className="text-sm text-gray-800 bg-blue-50 border border-blue-100 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">{cr.remarks}</p>
          </div>
        )}
      </div>

      {/* Status timeline */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Status Workflow</p>
        <div className="flex items-center gap-1 flex-wrap">
          {["Submitted","Under Review","Approved","In Progress","Implemented"].map((s, i, arr) => (
            <div key={s} className="flex items-center gap-1">
              <span className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium",
                cr.status === s
                  ? (statusColor[s] ?? "bg-gray-200 text-gray-700") + " ring-2 ring-offset-1 ring-current"
                  : "bg-gray-100 text-gray-400"
              )}>
                {s}
              </span>
              {i < arr.length - 1 && <span className="text-gray-300 text-xs">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
