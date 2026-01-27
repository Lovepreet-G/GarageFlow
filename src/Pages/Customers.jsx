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
      loadCustomers(q).catch(() => {})
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
      setVehicleErrors((p) => ({ ...p, vehicle_vin: msg }))
    } finally {
      setSavingVehicle(false)
    }
  }

  const filteredHistory = selectedVehicleVin
    ? history.filter((h) => h.vehicle_vin === selectedVehicleVin)
    : history

  return (
    <div className="w-full min-w-0">
      {/* Responsive layout: stacked on mobile, 2-panel on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: Customer list */}
        <div className="lg:col-span-4 min-w-0">
          <div className="bg-white border rounded-2xl shadow-sm">
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Customers</h1>
                  <div className="text-xs text-slate-500 mt-1">
                    Search and select a customer
                  </div>
                </div>

                <button
                  onClick={() => {
                    resetCustomerForm()
                    setShowAddCustomer(true)
                  }}
                  className="shrink-0 h-10 px-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold"
                >
                  + Add Customer
                </button>
              </div>

              <div className="mt-4">
                <input
                  className="border rounded-xl px-3 py-2.5 w-full bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  placeholder="Search by name or phone..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>

            {/* List: scrollable. On desktop, keep it tall and sticky-ish. */}
            <div className="px-2 pb-2">
              <div className="max-h-[40vh] lg:max-h-[72vh] overflow-auto rounded-xl">
                {customers.length === 0 ? (
                  <div className="text-sm text-slate-500 p-4">No customers found.</div>
                ) : (
                  <div className="divide-y">
                    {customers.map((c) => {
                      const active = String(c.id) === String(selectedId)
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedId(String(c.id))}
                          className={[
                            "w-full text-left p-3 sm:p-4 transition",
                            active
                              ? "bg-slate-900 text-white"
                              : "hover:bg-slate-50 text-slate-900",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className={["font-semibold truncate", active ? "text-white" : ""].join(" ")}>
                                {c.customer_name}
                              </div>
                              <div className={["text-xs mt-1", active ? "text-white/80" : "text-slate-600"].join(" ")}>
                                {c.customer_phone}
                              </div>
                            </div>

                            <div
                              className={[
                                "text-[10px] px-2 py-1 rounded-full border",
                                active
                                  ? "border-white/30 text-white/90"
                                  : "border-slate-200 text-slate-500",
                              ].join(" ")}
                            >
                              View
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Details */}
        <div className="lg:col-span-8 min-w-0 space-y-4">
          {/* Customer header card */}
          <div className="bg-white border rounded-2xl shadow-sm p-4 sm:p-6">
            {loadingRight ? (
              <div className="text-sm text-slate-500">Loading...</div>
            ) : !customer ? (
              <div className="text-sm text-slate-500">Select a customer to view details.</div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {customer.customer_name}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    {customer.customer_phone}
                    {customer.customer_email ? ` • ${customer.customer_email}` : ""}
                  </div>
                  {customer.customer_address ? (
                    <div className="text-sm text-slate-600 whitespace-pre-line mt-2">
                      {customer.customer_address}
                    </div>
                  ) : null}
                </div>

                <button
                  onClick={() => {
                    resetVehicleForm()
                    setShowAddVehicle(true)
                  }}
                  className="h-10 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed"
                  disabled={!selectedId}
                  title={!selectedId ? "Select a customer first" : ""}
                >
                  + Add Vehicle
                </button>
              </div>
            )}
          </div>

          {/* Vehicles */}
          <div className="bg-white border rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="font-extrabold tracking-tight">Vehicles Owned</div>
                <div className="text-xs text-slate-500 mt-1">Tap a vehicle to filter history</div>
              </div>

              <button
                onClick={() => {
                  resetVehicleForm()
                  setShowAddVehicle(true)
                }}
                className="hidden sm:inline-flex h-10 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed"
                disabled={!selectedId}
                title={!selectedId ? "Select a customer first" : ""}
              >
                + Add Vehicle
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="text-sm text-slate-500">No vehicles found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        "border rounded-2xl p-4 text-left w-full transition shadow-sm",
                        active
                          ? "bg-slate-900 text-white border-slate-900"
                          : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold">{v.vehicle_vin}</div>
                          <div className={["text-sm mt-1", active ? "text-white/80" : "text-slate-600"].join(" ")}>
                            {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                          </div>
                          <div className={["text-xs mt-2", active ? "text-white/80" : "text-slate-500"].join(" ")}>
                            Plate: {v.license_plate || "-"}
                          </div>
                        </div>

                        {active ? (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-white/15 border border-white/20">
                            Filtering
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-1 rounded-full border border-slate-200 text-slate-500">
                            Select
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-white border rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="font-extrabold tracking-tight">Repair History (Invoices)</div>
                <div className="text-xs text-slate-500 mt-1">Click a vehicle to filter by VIN</div>
              </div>

              {selectedVehicleVin ? (
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-xs bg-slate-100 border rounded-lg px-2 py-1">
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
            </div>

            {/* Mobile: cards, Desktop: table */}
            <div className="block sm:hidden space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="text-sm text-slate-500">No invoices yet.</div>
              ) : (
                filteredHistory.map((h) => (
                  <div key={h.id} className="border rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold">{h.invoice_number}</div>
                        <div className="text-xs text-slate-500 mt-1">{h.invoice_date}</div>
                        <div className="text-xs text-slate-500 mt-1">VIN: {h.vehicle_vin}</div>
                      </div>
                      <div className="text-sm font-extrabold">{money(h.total_amount)}</div>
                    </div>

                    <button
                      onClick={() => navigate(`/invoices/${h.id}`)}
                      className="mt-3 w-full h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold text-sm"
                    >
                      View / Print
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="p-2 whitespace-nowrap">Date</th>
                    <th className="p-2 whitespace-nowrap">Invoice #</th>
                    <th className="p-2 whitespace-nowrap">VIN</th>
                    <th className="p-2 whitespace-nowrap">Amount</th>
                    <th className="p-2 whitespace-nowrap">Open</th>
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
                        <td className="p-2 whitespace-nowrap">{h.invoice_date}</td>
                        <td className="p-2 whitespace-nowrap font-semibold">{h.invoice_number}</td>
                        <td className="p-2 whitespace-nowrap">{h.vehicle_vin}</td>
                        <td className="p-2 whitespace-nowrap font-bold">{money(h.total_amount)}</td>
                        <td className="p-2 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/invoices/${h.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold"
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
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6">
            <div className="bg-white rounded-2xl w-full max-w-lg border shadow-lg max-h-[90vh] overflow-auto">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-lg">Add Customer</div>
                  <button
                    onClick={() => {
                      setShowAddCustomer(false)
                      resetCustomerForm()
                    }}
                    className="text-slate-600 hover:text-slate-900"
                    aria-label="Close"
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
                        "border rounded-xl px-3 py-2.5 w-full bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20",
                        customerErrors.customer_name ? "border-red-500" : "border-slate-300",
                      ].join(" ")}
                      placeholder="Customer Name*"
                      value={newCustomer.customer_name}
                      onChange={(e) => setCustomerField("customer_name", e.target.value)}
                    />
                    {customerErrors.customer_name ? (
                      <div className="mt-1 text-sm text-red-600">{customerErrors.customer_name}</div>
                    ) : null}
                  </div>

                  <div>
                    <input
                      className={[
                        "border rounded-xl px-3 py-2.5 w-full bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20",
                        customerErrors.customer_phone ? "border-red-500" : "border-slate-300",
                      ].join(" ")}
                      placeholder="Phone*"
                      value={newCustomer.customer_phone}
                      onChange={(e) => setCustomerField("customer_phone", e.target.value)}
                    />
                    {customerErrors.customer_phone ? (
                      <div className="mt-1 text-sm text-red-600">{customerErrors.customer_phone}</div>
                    ) : null}
                  </div>

                  <div>
                    <input
                      className={[
                        "border rounded-xl px-3 py-2.5 w-full bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20",
                        customerErrors.customer_email ? "border-red-500" : "border-slate-300",
                      ].join(" ")}
                      placeholder="Email (optional)"
                      value={newCustomer.customer_email}
                      onChange={(e) => setCustomerField("customer_email", e.target.value)}
                    />
                    {customerErrors.customer_email ? (
                      <div className="mt-1 text-sm text-red-600">{customerErrors.customer_email}</div>
                    ) : null}
                  </div>

                  <div>
                    <input
                      className="border rounded-xl px-3 py-2.5 w-full bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 border-slate-300"
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
                      className="h-10 px-4 rounded-xl border hover:bg-slate-50 font-semibold"
                      disabled={savingCustomer}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingCustomer}
                      className={[
                        "h-10 px-4 rounded-xl text-white font-semibold",
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
          </div>
        )}

        {/* Add Vehicle Modal */}
        {showAddVehicle && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6">
            <div className="bg-white rounded-2xl w-full max-w-lg border shadow-lg max-h-[90vh] overflow-auto">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-lg">Add Vehicle</div>
                  <button
                    onClick={() => {
                      setShowAddVehicle(false)
                      resetVehicleForm()
                    }}
                    className="text-slate-600 hover:text-slate-900"
                    aria-label="Close"
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
                        "border rounded-xl px-3 py-2.5 w-full bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20",
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
                        "border rounded-xl px-3 py-2.5 w-full bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20",
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
                    className="border rounded-xl px-3 py-2.5 w-full bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 border-slate-300"
                    placeholder="Make"
                    value={newVehicle.make}
                    onChange={(e) => setVehicleField("make", e.target.value)}
                  />
                  <input
                    className="border rounded-xl px-3 py-2.5 w-full bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 border-slate-300"
                    placeholder="Model"
                    value={newVehicle.model}
                    onChange={(e) => setVehicleField("model", e.target.value)}
                  />

                  <input
                    className="border rounded-xl px-3 py-2.5 w-full bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 border-slate-300 md:col-span-2"
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
                      className="h-10 px-4 rounded-xl border hover:bg-slate-50 font-semibold"
                      disabled={savingVehicle}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingVehicle}
                      className={[
                        "h-10 px-4 rounded-xl text-white font-semibold",
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
          </div>
        )}
      </div>
    </div>
  )
}

export default Customers
