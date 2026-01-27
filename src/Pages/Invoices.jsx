import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

function Invoices() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])

  // UI state
  const [activeTab, setActiveTab] = useState("Draft") // Draft | Paid | Unpaid
  const [q, setQ] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  // Inline errors (no alerts)
  const [pageError, setPageError] = useState("")
  const [rowErrors, setRowErrors] = useState({}) // { [invoiceId]: "message" }

  // Debounce search
  const [debouncedQ, setDebouncedQ] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350)
    return () => clearTimeout(t)
  }, [q])

  const statusParam = useMemo(() => {
    if (activeTab === "Draft") return "Draft"
    if (activeTab === "Paid") return "Paid"
    return "" // Unpaid: fetch all, filter client-side
  }, [activeTab])

  const fetchInvoices = async () => {
    setLoading(true)
    setPageError("")
    try {
      const params = {}
      if (statusParam) params.status = statusParam
      if (debouncedQ) params.q = debouncedQ
      if (from) params.from = from
      if (to) params.to = to

      const res = await api.get("/invoices", { params })
      setRows(res.data || [])
    } catch (err) {
      setPageError(err.response?.data?.message || "Failed to load invoices.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedQ, from, to])

  const filteredRows = useMemo(() => {
    if (activeTab !== "Unpaid") return rows
    return rows.filter((r) => r.status === "Approved" || r.status === "Overdue")
  }, [rows, activeTab])

  const clearRowError = (invoiceId) => {
    setRowErrors((prev) => {
      if (!prev[invoiceId]) return prev
      const copy = { ...prev }
      delete copy[invoiceId]
      return copy
    })
  }

  const handleStatusChange = async (invoiceId, newStatus) => {
    setPageError("")
    clearRowError(invoiceId)

    const prevStatus = rows.find((r) => r.id === invoiceId)?.status

    // optimistic update
    setRows((prevRows) =>
      prevRows.map((r) => (r.id === invoiceId ? { ...r, status: newStatus } : r))
    )

    try {
      await api.patch(`/invoices/${invoiceId}/status`, { status: newStatus })
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update status."

      // rollback
      setRows((prevRows) =>
        prevRows.map((r) => (r.id === invoiceId ? { ...r, status: prevStatus } : r))
      )

      setRowErrors((p) => ({ ...p, [invoiceId]: msg }))
    }
  }

  const money = (v) => `$${Number(v || 0).toFixed(2)}`

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {/* Styled heading like your design */}
          <h1 className="text-3xl sm:text-4xl font-extrabold italic tracking-tight leading-none">
            <span className="text-slate-900">INVENTORY</span>{" "}
            <span className="text-sky-500">LOGS</span>
          </h1>
          <div className="mt-1 text-[11px] sm:text-xs uppercase tracking-[0.18em] text-slate-500">
            Financial protocol oversight
          </div>
        </div>

        {/* Filters */}
        <div className="w-full lg:w-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPageError("")
              }}
              className="border rounded-xl px-4 py-3 bg-white shadow-sm w-full sm:col-span-3 lg:col-span-1"
              placeholder="Search: Customer, VIN, ID..."
            />

            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPageError("")
              }}
              className="border rounded-xl px-4 py-3 bg-white shadow-sm w-full"
              title="From date"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPageError("")
              }}
              className="border rounded-xl px-4 py-3 bg-white shadow-sm w-full"
              title="To date"
            />

            {/* helper small actions row (optional) */}
            <div className="hidden lg:flex items-center justify-end gap-2 sm:col-span-3">
              {(q || from || to) && (
                <button
                  onClick={() => {
                    setQ("")
                    setFrom("")
                    setTo("")
                    setPageError("")
                  }}
                  className="px-4 py-2 rounded-xl border bg-white hover:bg-slate-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {["Draft", "Paid", "Unpaid"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setActiveTab(t)
              setPageError("")
            }}
            className={[
              "px-5 py-2 rounded-2xl text-sm font-semibold border transition",
              activeTab === t
                ? "bg-slate-900 text-white border-slate-900 shadow"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Errors */}
      {pageError ? (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {pageError}
        </div>
      ) : null}

      {/* Desktop/Tablet table (md+) */}
      <div className="hidden md:block bg-white border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-widest text-slate-500">
                <th className="p-4">Serial</th>
                <th className="p-4">Timeline</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Unit VIN</th>
                <th className="p-4">Credit</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Access</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6 text-sm text-slate-500" colSpan={7}>
                    Loading...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className="p-6 text-sm text-slate-500" colSpan={7}>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((inv, idx) => (
                  <tr key={inv.id} className="border-t text-sm align-top">
                    <td className="p-4 font-semibold italic text-slate-700">
                      {inv.invoice_number || `INV-${String(idx + 1).padStart(3, "0")}`}
                    </td>
                    <td className="p-4 text-slate-600">{inv.invoice_date}</td>
                    <td className="p-4 font-semibold text-slate-900">
                      {(inv.customer_name || "").toUpperCase()}
                    </td>
                    <td className="p-4 text-slate-700">{inv.vehicle_vin || "-"}</td>
                    <td className="p-4 font-semibold text-slate-900">
                      {money(inv.total_amount)}
                    </td>

                    <td className="p-4">
                      <select
                        className={[
                          "border rounded-xl px-3 py-2 bg-white w-40",
                          rowErrors[inv.id] ? "border-red-500" : "border-slate-200",
                        ].join(" ")}
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        onFocus={() => clearRowError(inv.id)}
                      >
                        <option value="Draft">DRAFT</option>
                        <option value="Approved">APPROVED</option>
                        <option value="Paid">PAID</option>
                        <option value="Overdue">OVERDUE</option>
                      </select>

                      {rowErrors[inv.id] ? (
                        <div className="mt-1 text-xs text-red-600">{rowErrors[inv.id]}</div>
                      ) : null}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                      >
                        INSPECT
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t text-xs text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
            Note: “UNPAID” includes invoices with operational status:{" "}
            <b className="text-slate-700">APPROVED</b> and{" "}
            <b className="text-slate-700">OVERDUE</b>.
          </span>
        </div>
      </div>

      {/* Mobile cards (<md) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white border rounded-2xl p-4 text-sm text-slate-500">
            Loading...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="bg-white border rounded-2xl p-4 text-sm text-slate-500">
            No invoices found.
          </div>
        ) : (
          filteredRows.map((inv, idx) => (
            <div key={inv.id} className="bg-white border rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold italic text-slate-900">
                    {inv.invoice_number || `INV-${String(idx + 1).padStart(3, "0")}`}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{inv.invoice_date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-slate-900">
                    {money(inv.total_amount)}
                  </div>
                  <div className="text-[11px] text-slate-500">Credit</div>
                </div>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Entity</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {(inv.customer_name || "-").toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Unit VIN</span>
                  <span className="font-medium text-slate-700 text-right">
                    {inv.vehicle_vin || "-"}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <select
                  className={[
                    "w-full border rounded-xl px-3 py-2 bg-white",
                    rowErrors[inv.id] ? "border-red-500" : "border-slate-200",
                  ].join(" ")}
                  value={inv.status}
                  onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                  onFocus={() => clearRowError(inv.id)}
                >
                  <option value="Draft">DRAFT</option>
                  <option value="Approved">APPROVED</option>
                  <option value="Paid">PAID</option>
                  <option value="Overdue">OVERDUE</option>
                </select>
                {rowErrors[inv.id] ? (
                  <div className="mt-1 text-xs text-red-600">{rowErrors[inv.id]}</div>
                ) : null}
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                >
                  INSPECT
                </button>
              </div>
            </div>
          ))
        )}

        <div className="bg-white border rounded-2xl p-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
            Note: “UNPAID” includes <b>APPROVED</b> and <b>OVERDUE</b>.
          </span>
        </div>
      </div>
    </div>
  )
}

export default Invoices
