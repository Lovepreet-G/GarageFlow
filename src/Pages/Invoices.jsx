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

  // Debounce search a bit
  const [debouncedQ, setDebouncedQ] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350)
    return () => clearTimeout(t)
  }, [q])

  const statusParam = useMemo(() => {
    // backend supports exact statuses; for Unpaid we fetch all then filter client-side
    if (activeTab === "Draft") return "Draft"
    if (activeTab === "Paid") return "Paid"
    return "" // Unpaid
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
    // optimistic UI update + rollback on error (better UX)
    setPageError("")
    clearRowError(invoiceId)

    const prev = rows.find((r) => r.id === invoiceId)?.status

    // update UI locally right away
    setRows((prevRows) =>
      prevRows.map((r) => (r.id === invoiceId ? { ...r, status: newStatus } : r))
    )

    try {
      await api.patch(`/invoices/${invoiceId}/status`, { status: newStatus })
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update status."

      // rollback
      setRows((prevRows) =>
        prevRows.map((r) => (r.id === invoiceId ? { ...r, status: prev } : r))
      )

      // show error under dropdown for that row
      setRowErrors((p) => ({ ...p, [invoiceId]: msg }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Top header row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPageError("")
            }}
            className="border rounded px-3 py-2 w-full sm:w-72"
            placeholder="Search: customer, VIN, invoice #"
          />

          <div className="flex gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPageError("")
              }}
              className="border rounded px-3 py-2"
              title="From date"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPageError("")
              }}
              className="border rounded px-3 py-2"
              title="To date"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {["Draft", "Paid", "Unpaid"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setActiveTab(t)
              setPageError("")
            }}
            className={[
              "px-4 py-2 rounded border",
              activeTab === t
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white hover:bg-slate-50",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {/* Page-level error (no alert) */}
        {pageError ? (
          <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b">
            {pageError}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm">
                <th className="p-3">Sr No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">VIN</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Print</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-sm text-slate-500" colSpan={7}>
                    Loading...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className="p-4 text-sm text-slate-500" colSpan={7}>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((inv, idx) => (
                  <tr key={inv.id} className="border-t text-sm align-top">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">{inv.invoice_date}</td>
                    <td className="p-3">{inv.customer_name}</td>
                    <td className="p-3">{inv.vehicle_vin}</td>
                    <td className="p-3 font-medium">
                      ${Number(inv.total_amount).toFixed(2)}
                    </td>

                    <td className="p-3">
                      <select
                        className={[
                          "border rounded px-2 py-1 w-full",
                          rowErrors[inv.id] ? "border-red-500" : "border-slate-300",
                        ].join(" ")}
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        onFocus={() => clearRowError(inv.id)}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Approved">Approved</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>

                      {rowErrors[inv.id] ? (
                        <div className="mt-1 text-xs text-red-600">
                          {rowErrors[inv.id]}
                        </div>
                      ) : null}
                    </td>

                    <td className="p-3">
                      <button
                        className="px-3 py-1 rounded bg-slate-900 text-white hover:bg-slate-800"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* small helper */}
      <div className="text-xs text-slate-500">
        Tip: “Unpaid” includes invoices with status <b>Approved</b> and{" "}
        <b>Overdue</b>.
      </div>
    </div>
  )
}

export default Invoices
