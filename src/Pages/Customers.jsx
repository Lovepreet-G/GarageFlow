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

  // ✅ Vehicle filter
  const [selectedVehicleVin, setSelectedVehicleVin] = useState("")

  // ✅ Modals
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showAddVehicle, setShowAddVehicle] = useState(false)

  // ✅ Forms
  const [newCustomer, setNewCustomer] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
  })

  const [newVehicle, setNewVehicle] = useState({
    vehicle_vin: "",
    make: "",
    model: "",
    year: "",
    license_plate: "",
  })

  const money = (v) => `$${Number(v || 0).toFixed(2)}`

  const resetCustomerForm = () =>
    setNewCustomer({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_address: "",
    })

  const resetVehicleForm = () =>
    setNewVehicle({
      vehicle_vin: "",
      make: "",
      model: "",
      year: "",
      license_plate: "",
    })

  const loadCustomers = async (query = "") => {
    const res = await api.get("/customers", { params: { q: query } })
    setCustomers(res.data || [])
    if (!selectedId && res.data?.length) setSelectedId(String(res.data[0].id))
  }

  const loadRightPanel = async (id) => {
    if (!id) return
    setLoadingRight(true)
    try {
      const [cRes, vRes, hRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/customers/${id}/vehicles`),
        api.get(`/customers/${id}/history`),
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

  // Load customers list with debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      loadCustomers(q).catch(() => alert("Failed to load customers"))
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  // Load right panel on selection change
  useEffect(() => {
    if (!selectedId) return
    setSelectedVehicleVin("") // reset filter when switching customer
    loadRightPanel(selectedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ✅ Add customer submit
  const handleAddCustomer = async (e) => {
    e.preventDefault()
    if (!newCustomer.customer_name || !newCustomer.customer_phone) {
      return alert("Customer name and phone are required")
    }

    try {
      const res = await api.post("/customers", newCustomer)
      const newId = String(res.data.id)

      setShowAddCustomer(false)
      resetCustomerForm()

      await loadCustomers(q)
      setSelectedId(newId)
      await loadRightPanel(newId)
    } catch (e2) {
      alert(e2.response?.data?.message || "Failed to add customer")
    }
  }

  // ✅ Add vehicle submit
  const handleAddVehicle = async (e) => {
    e.preventDefault()
    if (!selectedId) return alert("Select a customer first")
    if (!newVehicle.vehicle_vin) return alert("VIN is required")

    try {
      await api.post("/vehicles", {
        customer_id: Number(selectedId),
        vehicle_vin: newVehicle.vehicle_vin,
        make: newVehicle.make || null,
        model: newVehicle.model || null,
        year: newVehicle.year ? Number(newVehicle.year) : null,
        license_plate: newVehicle.license_plate || null,
      })

      setShowAddVehicle(false)
      resetVehicleForm()

      await loadRightPanel(selectedId)
    } catch (e2) {
      alert(e2.response?.data?.message || "Failed to add vehicle")
    }
  }

  const filteredHistory = selectedVehicleVin
    ? history.filter((h) => h.vehicle_vin === selectedVehicleVin)
    : history

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: customer list */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Customers</h1>

          <button
            onClick={() => setShowAddCustomer(true)}
            className="px-3 py-2 rounded bg-slate-900 text-white hover:bg-slate-800 text-sm"
          >
            + Add Customer
          </button>
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
        {/* Customer detail */}
        <div className="bg-white border rounded-xl p-4">
          {loadingRight ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : !customer ? (
            <div className="text-sm text-slate-500">
              Select a customer to view details.
            </div>
          ) : (
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
          )}
        </div>

        {/* Vehicles */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Vehicles Owned</div>

            <button
              onClick={() => {
                if (!selectedId) return alert("Select a customer first")
                setShowAddVehicle(true)
              }}
              className="px-3 py-2 rounded bg-slate-900 text-white hover:bg-slate-800 text-sm"
            >
              + Add Vehicle
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="text-sm text-slate-500">No vehicles found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vehicles.map((v) => {
                const active = selectedVehicleVin === v.vehicle_vin

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      setSelectedVehicleVin((prev) =>
                        prev === v.vehicle_vin ? "" : v.vehicle_vin
                      )
                    }
                    className={[
                      "border rounded-lg p-3 text-left hover:bg-slate-50 w-full",
                      active ? "ring-2 ring-slate-900 bg-slate-50" : "",
                    ].join(" ")}
                  >
                    <div className="font-semibold">{v.vehicle_vin}</div>
                    <div className="text-sm text-slate-600">
                      {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                    </div>
                    <div className="text-xs text-slate-500">
                      Plate: {v.license_plate || "-"}
                    </div>
                    {active ? (
                      <div className="mt-2 text-xs font-semibold text-slate-900">
                        Filtering history
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Repair history / invoices */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">Repair History (Invoices)</div>
              <div className="text-xs text-slate-500">
                Click a vehicle to filter by VIN
              </div>
            </div>
          </div>

          {selectedVehicleVin ? (
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs bg-slate-100 border rounded px-2 py-1">
                Filter: <b>{selectedVehicleVin}</b>
              </div>
              <button
                onClick={() => setSelectedVehicleVin("")}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : null}

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
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td className="p-3 text-slate-500" colSpan={5}>
                      No invoices yet.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((h) => (
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
        </div>
      </div>

      {/* ✅ Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-lg">Add Customer</div>
              <button
                onClick={() => {
                  setShowAddCustomer(false)
                  resetCustomerForm()
                }}
                className="text-slate-600 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleAddCustomer}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <input
                className="border rounded px-3 py-2"
                placeholder="Customer Name*"
                value={newCustomer.customer_name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, customer_name: e.target.value })
                }
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Phone*"
                value={newCustomer.customer_phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, customer_phone: e.target.value })
                }
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Email"
                value={newCustomer.customer_email}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, customer_email: e.target.value })
                }
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Address"
                value={newCustomer.customer_address}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, customer_address: e.target.value })
                }
              />

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomer(false)
                    resetCustomerForm()
                  }}
                  className="px-4 py-2 rounded border hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-lg">Add Vehicle</div>
              <button
                onClick={() => {
                  setShowAddVehicle(false)
                  resetVehicleForm()
                }}
                className="text-slate-600 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleAddVehicle}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <input
                className="border rounded px-3 py-2"
                placeholder="VIN*"
                value={newVehicle.vehicle_vin}
                onChange={(e) =>
                  setNewVehicle({ ...newVehicle, vehicle_vin: e.target.value })
                }
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Year"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Make"
                value={newVehicle.make}
                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Model"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
              />
              <input
                className="border rounded px-3 py-2 md:col-span-2"
                placeholder="License Plate"
                value={newVehicle.license_plate}
                onChange={(e) =>
                  setNewVehicle({ ...newVehicle, license_plate: e.target.value })
                }
              />

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVehicle(false)
                    resetVehicleForm()
                  }}
                  className="px-4 py-2 rounded border hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers
