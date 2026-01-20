import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
function normalizePhone(phone) {
  return phone.replace(/[^\d]/g, "")
}
function isValidPhone(phone) {
  const digits = normalizePhone(phone)
  if (digits.length === 10) return true
  if (digits.length === 11 && digits.startsWith("1")) return true
  return false
}

function Customers() {
  const navigate = useNavigate()

  const [q, setQ] = useState("")
  const [customers, setCustomers] = useState([])
  const [selectedId, setSelectedId] = useState("")

  const [customer, setCustomer] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [history, setHistory] = useState([])
  const [loadingRight, setLoadingRight] = useState(false)

  // Vehicle filter
  const [selectedVehicleVin, setSelectedVehicleVin] = useState("")

  // Modals
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showAddVehicle, setShowAddVehicle] = useState(false)

  // Forms
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

  // Inline form errors (no alerts)
  const [customerErrors, setCustomerErrors] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    general: "",
  })

  const [vehicleErrors, setVehicleErrors] = useState({
    vehicle_vin: "",
    year: "",
    general: "",
  })

  const [savingCustomer, setSavingCustomer] = useState(false)
  const [savingVehicle, setSavingVehicle] = useState(false)

  const money = (v) => `$${Number(v || 0).toFixed(2)}`

  const resetCustomerForm = () => {
    setNewCustomer({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_address: "",
    })
    setCustomerErrors({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_address: "",
      general: "",
    })
  }

  const resetVehicleForm = () => {
    setNewVehicle({
      vehicle_vin: "",
      make: "",
      model: "",
      year: "",
      license_plate: "",
    })
    setVehicleErrors({
      vehicle_vin: "",
      year: "",
      general: "",
    })
  }

  const setCustomerField = (name, value) => {
    setNewCustomer((p) => ({ ...p, [name]: value }))
    setCustomerErrors((p) => ({ ...p, [name]: "", general: "" }))
  }

  const setVehicleField = (name, value) => {
    setNewVehicle((p) => ({ ...p, [name]: value }))
    if (name === "vehicle_vin") setVehicleErrors((p) => ({ ...p, vehicle_vin: "", general: "" }))
    if (name === "year") setVehicleErrors((p) => ({ ...p, year: "", general: "" }))
    if (name !== "vehicle_vin" && name !== "year") setVehicleErrors((p) => ({ ...p, general: "" }))
  }

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
    } finally {
      setLoadingRight(false)
    }
  }

  // Debounced customer search
  useEffect(() => {
    const t = setTimeout(() => {
      loadCustomers(q).catch(() => {
        // no alerts: show error in list area silently (optional later)
      })
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  // Right panel load
  useEffect(() => {
    if (!selectedId) return
    setSelectedVehicleVin("")
    loadRightPanel(selectedId).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // Validations
  const validateCustomer = () => {
    const e = {
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_address: "",
      general: "",
    }

    if (!newCustomer.customer_name.trim()) e.customer_name = "Customer name is required."
    if (!newCustomer.customer_phone.trim()) e.customer_phone = "Phone is required."
    else if (!isValidPhone(newCustomer.customer_phone)) e.customer_phone = "Enter a valid phone number."

    if (newCustomer.customer_email.trim() && !isValidEmail(newCustomer.customer_email.trim())) {
      e.customer_email = "Enter a valid email."
    }

    setCustomerErrors(e)
    return !e.customer_name && !e.customer_phone && !e.customer_email
  }

  const validateVehicle = () => {
    const e = { vehicle_vin: "", year: "", general: "" }

    if (!selectedId) e.general = "Select a customer first."
    if (!newVehicle.vehicle_vin.trim()) e.vehicle_vin = "VIN is required."
    else if (newVehicle.vehicle_vin.trim().length < 5) e.vehicle_vin = "VIN looks too short."

    if (newVehicle.year.trim()) {
      const y = Number(newVehicle.year)
      if (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear() + 1) {
        e.year = "Enter a valid year."
      }
    }

    setVehicleErrors(e)
    return !e.vehicle_vin && !e.year && !e.general
  }

  // Submit: Add Customer
  const handleAddCustomer = async (e) => {
    e.preventDefault()
    if (!validateCustomer()) return

    setSavingCustomer(true)
    try {
      const res = await api.post("/customers", {
        customer_name: newCustomer.customer_name.trim(),
        customer_phone: newCustomer.customer_phone.trim(),
        customer_email: newCustomer.customer_email.trim() || null,
        customer_address: newCustomer.customer_address.trim() || null,
      })

      const newId = String(res.data.id)
      setShowAddCustomer(false)
      resetCustomerForm()

      await loadCustomers(q)
      setSelectedId(newId)
      await loadRightPanel(newId)
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add customer."

      // Duplicate phone goes under phone field
      if (msg.toLowerCase().includes("phone") || msg.toLowerCase().includes("exists")) {
        setCustomerErrors((p) => ({ ...p, customer_phone: msg }))
      } else {
        setCustomerErrors((p) => ({ ...p, general: msg }))
      }
    } finally {
      setSavingCustomer(false)
    }
  }

  // Submit: Add Vehicle
  const handleAddVehicle = async (e) => {
    e.preventDefault()
    if (!validateVehicle()) return

    setSavingVehicle(true)
    try {
      await api.post("/vehicles", {
        customer_id: Number(selectedId),
        vehicle_vin: newVehicle.vehicle_vin.trim(),
        make: newVehicle.make.trim() || null,
        model: newVehicle.model.trim() || null,
        year: newVehicle.year.trim() ? Number(newVehicle.year) : null,
        license_plate: newVehicle.license_plate.trim() || null,
      })

      setShowAddVehicle(false)
      resetVehicleForm()
      await loadRightPanel(selectedId)
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add vehicle."

      // put common errors under VIN
      setVehicleErrors((p) => ({ ...p, vehicle_vin: msg }))
    } finally {
      setSavingVehicle(false)
    }
  }

  const filteredHistory = selectedVehicleVin
    ? history.filter((h) => h.vehicle_vin === selectedVehicleVin)
    : history

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Customers</h1>

          <button
            onClick={() => {
              resetCustomerForm()
              setShowAddCustomer(true)
            }}
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

      {/* Right */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border rounded-xl p-4">
          {loadingRight ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : !customer ? (
            <div className="text-sm text-slate-500">Select a customer to view details.</div>
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
                resetVehicleForm()
                setShowAddVehicle(true)
              }}
              className="px-3 py-2 rounded bg-slate-900 text-white hover:bg-slate-800 text-sm"
              disabled={!selectedId}
              title={!selectedId ? "Select a customer first" : ""}
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
                      setSelectedVehicleVin((prev) => (prev === v.vehicle_vin ? "" : v.vehicle_vin))
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

        {/* History */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">Repair History (Invoices)</div>
              <div className="text-xs text-slate-500">Click a vehicle to filter by VIN</div>
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

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
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

            {customerErrors.general ? (
              <div className="mb-3 text-sm text-red-600">{customerErrors.general}</div>
            ) : null}

            <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  className={[
                    "border rounded px-3 py-2 w-full",
                    customerErrors.customer_name ? "border-red-500" : "border-slate-300",
                  ].join(" ")}
                  placeholder="Customer Name*"
                  value={newCustomer.customer_name}
                  onChange={(e) => setCustomerField("customer_name", e.target.value)}
                />
                {customerErrors.customer_name ? (
                  <div className="mt-1 text-sm text-red-600">
                    {customerErrors.customer_name}
                  </div>
                ) : null}
              </div>

              <div>
                <input
                  className={[
                    "border rounded px-3 py-2 w-full",
                    customerErrors.customer_phone ? "border-red-500" : "border-slate-300",
                  ].join(" ")}
                  placeholder="Phone*"
                  value={newCustomer.customer_phone}
                  onChange={(e) => setCustomerField("customer_phone", e.target.value)}
                />
                {customerErrors.customer_phone ? (
                  <div className="mt-1 text-sm text-red-600">
                    {customerErrors.customer_phone}
                  </div>
                ) : null}
              </div>

              <div>
                <input
                  className={[
                    "border rounded px-3 py-2 w-full",
                    customerErrors.customer_email ? "border-red-500" : "border-slate-300",
                  ].join(" ")}
                  placeholder="Email (optional)"
                  value={newCustomer.customer_email}
                  onChange={(e) => setCustomerField("customer_email", e.target.value)}
                />
                {customerErrors.customer_email ? (
                  <div className="mt-1 text-sm text-red-600">
                    {customerErrors.customer_email}
                  </div>
                ) : null}
              </div>

              <div>
                <input
                  className="border rounded px-3 py-2 w-full border-slate-300"
                  placeholder="Address (optional)"
                  value={newCustomer.customer_address}
                  onChange={(e) => setCustomerField("customer_address", e.target.value)}
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomer(false)
                    resetCustomerForm()
                  }}
                  className="px-4 py-2 rounded border hover:bg-slate-50"
                  disabled={savingCustomer}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className={[
                    "px-4 py-2 rounded text-white font-semibold",
                    savingCustomer
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-slate-900 hover:bg-slate-800",
                  ].join(" ")}
                >
                  {savingCustomer ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
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

            {vehicleErrors.general ? (
              <div className="mb-3 text-sm text-red-600">{vehicleErrors.general}</div>
            ) : null}

            <form onSubmit={handleAddVehicle} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  className={[
                    "border rounded px-3 py-2 w-full",
                    vehicleErrors.vehicle_vin ? "border-red-500" : "border-slate-300",
                  ].join(" ")}
                  placeholder="VIN*"
                  value={newVehicle.vehicle_vin}
                  onChange={(e) => setVehicleField("vehicle_vin", e.target.value)}
                />
                {vehicleErrors.vehicle_vin ? (
                  <div className="mt-1 text-sm text-red-600">{vehicleErrors.vehicle_vin}</div>
                ) : null}
              </div>

              <div>
                <input
                  className={[
                    "border rounded px-3 py-2 w-full",
                    vehicleErrors.year ? "border-red-500" : "border-slate-300",
                  ].join(" ")}
                  placeholder="Year"
                  value={newVehicle.year}
                  onChange={(e) => setVehicleField("year", e.target.value)}
                />
                {vehicleErrors.year ? (
                  <div className="mt-1 text-sm text-red-600">{vehicleErrors.year}</div>
                ) : null}
              </div>

              <input
                className="border rounded px-3 py-2 w-full border-slate-300"
                placeholder="Make"
                value={newVehicle.make}
                onChange={(e) => setVehicleField("make", e.target.value)}
              />
              <input
                className="border rounded px-3 py-2 w-full border-slate-300"
                placeholder="Model"
                value={newVehicle.model}
                onChange={(e) => setVehicleField("model", e.target.value)}
              />

              <input
                className="border rounded px-3 py-2 w-full border-slate-300 md:col-span-2"
                placeholder="License Plate"
                value={newVehicle.license_plate}
                onChange={(e) => setVehicleField("license_plate", e.target.value)}
              />

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVehicle(false)
                    resetVehicleForm()
                  }}
                  className="px-4 py-2 rounded border hover:bg-slate-50"
                  disabled={savingVehicle}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVehicle}
                  className={[
                    "px-4 py-2 rounded text-white font-semibold",
                    savingVehicle
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-slate-900 hover:bg-slate-800",
                  ].join(" ")}
                >
                  {savingVehicle ? "Saving..." : "Save"}
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
