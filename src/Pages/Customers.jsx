import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

function Customers() {
  const navigate = useNavigate()

  const [q, setQ] = useState("")
  const [customers, setCustomers] = useState([])
  const [selectedId, setSelectedId] = useState("")

  const [customer, setCustomer] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [history, setHistory] = useState([])
  const [loadingRight, setLoadingRight] = useState(false)

  // Load customers list
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/customers", { params: { q } })
        setCustomers(res.data || [])
        // auto select first if none selected
        if (!selectedId && res.data?.length) setSelectedId(String(res.data[0].id))
      } catch (e) {
        alert("Failed to load customers")
      }
    }, 250)

    return () => clearTimeout(t)
  }, [q]) // eslint-disable-line

  // Load right panel when selected changes
  useEffect(() => {
    const loadRight = async () => {
      if (!selectedId) return
      setLoadingRight(true)
      try {
        const [cRes, vRes, hRes] = await Promise.all([
          api.get(`/customers/${selectedId}`),
          api.get(`/customers/${selectedId}/vehicles`),
          api.get(`/customers/${selectedId}/history`),
        ])
        setCustomer(cRes.data)
        setVehicles(vRes.data || [])
        setHistory(hRes.data || [])
      } catch (e) {
        alert(e.response?.data?.message || "Failed to load customer details")
      } finally {
        setLoadingRight(false)
      }
    }
    loadRight()
  }, [selectedId])

  const money = (v) => `$${Number(v || 0).toFixed(2)}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: customer list */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Customers</h1>
        </div>

        <input
          className="border rounded px-3 py-2 w-full mb-3"
          placeholder="Search by name or phone..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="max-h-[65vh] overflow-auto divide-y">
          {customers.length === 0 ? (
            <div className="text-sm text-slate-500 p-3">No customers found.</div>
          ) : (
            customers.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(String(c.id))}
                className={[
                  "w-full text-left p-3 hover:bg-slate-50",
                  String(c.id) === String(selectedId) ? "bg-slate-100" : "",
                ].join(" ")}
              >
                <div className="font-semibold">{c.customer_name}</div>
                <div className="text-xs text-slate-600">{c.customer_phone}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: details + vehicles + history */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border rounded-xl p-4">
          {loadingRight ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : !customer ? (
            <div className="text-sm text-slate-500">Select a customer to view details.</div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="text-2xl font-bold">{customer.customer_name}</div>
                  <div className="text-sm text-slate-600">
                    {customer.customer_phone}
                    {customer.customer_email ? ` • ${customer.customer_email}` : ""}
                  </div>
                  {customer.customer_address ? (
                    <div className="text-sm text-slate-600 whitespace-pre-line">
                      {customer.customer_address}
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Vehicles */}
        <div className="bg-white border rounded-xl p-4">
          <div className="font-semibold mb-3">Vehicles Owned</div>

          {vehicles.length === 0 ? (
            <div className="text-sm text-slate-500">No vehicles found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vehicles.map((v) => (
                <div key={v.id} className="border rounded-lg p-3">
                  <div className="font-semibold">{v.vehicle_vin}</div>
                  <div className="text-sm text-slate-600">
                    {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                  </div>
                  <div className="text-xs text-slate-500">
                    Plate: {v.license_plate || "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repair history / invoices */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Repair History (Invoices)</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="p-2">Date</th>
                  <th className="p-2">Invoice #</th>
                  <th className="p-2">VIN</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Open</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td className="p-3 text-slate-500" colSpan={5}>
                      No invoices yet.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id} className="border-t">
                      <td className="p-2">{h.invoice_date}</td>
                      <td className="p-2">{h.invoice_number}</td>
                      <td className="p-2">{h.vehicle_vin}</td>
                      <td className="p-2 font-medium">{money(h.total_amount)}</td>
                      <td className="p-2">
                        <button
                          onClick={() => navigate(`/invoices/${h.id}`)}
                          className="px-3 py-1 rounded bg-slate-900 text-white hover:bg-slate-800"
                        >
                          View / Print
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-slate-500 mt-2">
            Clicking “View / Print” opens the invoice print layout.
          </div>
        </div>
      </div>
    </div>
  )
}

export default Customers
