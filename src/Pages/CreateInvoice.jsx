import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+\.[^\s@]+$/.test(email) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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
const money = (v) => Number(v || 0).toFixed(2)

const emptyItem = () => ({
  item_description: "",
  type: "Labor",
  condition: "",
  quantity: 1,
  unit_price: "",
})

function CreateInvoice() {
  const navigate = useNavigate()

  // ====== Customer list/search ======
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerResults, setCustomerResults] = useState([])
  const [customerLoading, setCustomerLoading] = useState(false)

  const [customers, setCustomers] = useState([]) // initial load (optional)
  const [vehicles, setVehicles] = useState([])

  // ====== Invoice fields ======
  const today = new Date().toISOString().slice(0, 10)
  const [invoice_date, setInvoiceDate] = useState(today)
  const [due_date, setDueDate] = useState("")
  const [odometer_reading, setOdometer] = useState("")

  // ====== Customer selection / create ======
  const [customerMode, setCustomerMode] = useState("existing") // existing | new
  const [customer_id, setCustomerId] = useState("")
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null)

  const [newCustomer, setNewCustomer] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
  })

  // ====== Vehicle selection / create ======
  const [vehicleMode, setVehicleMode] = useState("existing") // existing | new
  const [vehicle_id, setVehicleId] = useState("")
  const [newVehicle, setNewVehicle] = useState({
    vehicle_vin: "",
    make: "",
    model: "",
    year: "",
    license_plate: "",
  })

  // ====== Items ======
  const [items, setItems] = useState([emptyItem()])

  // ====== Taxes & Note ======
  const [includePST, setIncludePST] = useState(true)
  const [note, setNote] = useState("")

  // ====== UI state ======
  const [saving, setSaving] = useState(false)

  // ====== Errors ======
  const [errors, setErrors] = useState({
    general: "",
    invoice_date: "",
    due_date: "",
    odometer_reading: "",
    customer_id: "",
    customerSearch: "",
    newCustomer: {
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_address: "",
    },
    vehicle_id: "",
    newVehicle: {
      vehicle_vin: "",
      year: "",
    },
    items: [],
  })

  // ====== Initial load customers (optional) ======
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/customers", { params: { q: "" } })
        const rows = res.data || []
        setCustomers(rows)
        setCustomerResults(rows.slice(0, 15))
      } catch {
        setErrors((p) => ({ ...p, general: "Failed to load customers." }))
      }
    }
    load()
  }, [])

  // ====== Debounced customer search (existing mode) ======
  useEffect(() => {
    if (customerMode !== "existing") return

    const t = setTimeout(async () => {
      setCustomerLoading(true)
      try {
        const res = await api.get("/customers", { params: { q: customerSearch.trim() } })
        setCustomerResults(res.data || [])
      } catch {
        // silent (no alerts)
      } finally {
        setCustomerLoading(false)
      }
    }, 250)

    return () => clearTimeout(t)
  }, [customerSearch, customerMode])

  // ====== Load vehicles when customer selected ======
  useEffect(() => {
    const loadVehicles = async () => {
      if (customerMode !== "existing" || !customer_id) {
        setVehicles([])
        setVehicleId("")
        return
      }
      try {
        const res = await api.get(`/customers/${customer_id}/vehicles`)
        const rows = res.data || []
        setVehicles(rows)
        setVehicleId(rows.length ? String(rows[0].id) : "")
      } catch {
        // silent
      }
    }
    loadVehicles()
  }, [customer_id, customerMode])

  // ====== Compute totals ======
  const subtotal = useMemo(() => {
    let sum = 0
    for (const it of items) {
      const qty = Number(it.quantity || 0)
      const unit = Number(it.unit_price || 0)
      if (Number.isFinite(qty) && Number.isFinite(unit)) sum += qty * unit
    }
    return Number(sum.toFixed(2))
  }, [items])

  const hst = useMemo(() => Number((subtotal * 0.07).toFixed(2)), [subtotal])
  const pst = useMemo(() => (includePST ? Number((subtotal * 0.05).toFixed(2)) : 0), [subtotal, includePST])
  const tax = useMemo(() => Number((hst + pst).toFixed(2)), [hst, pst])
  const total = useMemo(() => Number((subtotal + tax).toFixed(2)), [subtotal, tax])

  const setItemField = (idx, field, value) => {
    setItems((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      if (field === "type" && value === "Labor") copy[idx].condition = ""
      return copy
    })
    setErrors((p) => {
      const rowErrors = [...(p.items || [])]
      rowErrors[idx] = { ...(rowErrors[idx] || {}), [field]: "" }
      return { ...p, items: rowErrors, general: "" }
    })
  }

  const addItemRow = () => {
    setItems((prev) => [...prev, emptyItem()])
    setErrors((p) => ({ ...p, items: [...(p.items || []), {}] }))
  }

  const removeItemRow = (idx) => {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, i) => i !== idx))
    setErrors((p) => ({ ...p, items: (p.items || []).filter((_, i) => i !== idx) }))
  }

  const validate = () => {
    const next = {
      general: "",
      invoice_date: "",
      due_date: "",
      odometer_reading: "",
      customer_id: "",
      customerSearch: "",
      newCustomer: {
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        customer_address: "",
      },
      vehicle_id: "",
      newVehicle: {
        vehicle_vin: "",
        year: "",
      },
      items: items.map(() => ({})),
    }

    if (!invoice_date) next.invoice_date = "Invoice date is required."
    if (due_date && due_date < invoice_date) next.due_date = "Due date cannot be before invoice date."

    if (odometer_reading) {
      const odo = Number(odometer_reading)
      if (!Number.isInteger(odo) || odo < 0) next.odometer_reading = "Enter a valid odometer value."
    }

    if (customerMode === "existing") {
      if (!customer_id) next.customer_id = "Select a customer."
      if (!customerSearch.trim() && !customer_id) next.customerSearch = "Search and select a customer."
    } else {
      if (!newCustomer.customer_name.trim()) next.newCustomer.customer_name = "Customer name is required."
      if (!newCustomer.customer_phone.trim()) next.newCustomer.customer_phone = "Phone is required."
      else if (!isValidPhone(newCustomer.customer_phone)) next.newCustomer.customer_phone = "Enter a valid phone number."

      if (newCustomer.customer_email.trim() && !isValidEmail(newCustomer.customer_email.trim())) {
        next.newCustomer.customer_email = "Enter a valid email."
      }
    }

    if (vehicleMode === "existing") {
      if (!vehicle_id) next.vehicle_id = "Select a vehicle (or add a new one)."
    } else {
      if (!newVehicle.vehicle_vin.trim()) next.newVehicle.vehicle_vin = "VIN is required."
      else if (newVehicle.vehicle_vin.trim().length < 5) next.newVehicle.vehicle_vin = "VIN looks too short."

      if (newVehicle.year.trim()) {
        const y = Number(newVehicle.year)
        if (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear() + 1) next.newVehicle.year = "Enter a valid year."
      }
    }

    items.forEach((it, i) => {
      if (!it.item_description.trim()) next.items[i].item_description = "Description is required."
      const qty = Number(it.quantity)
      if (!Number.isFinite(qty) || qty <= 0) next.items[i].quantity = "Qty must be > 0."
      const unit = Number(it.unit_price)
      if (!Number.isFinite(unit) || unit < 0) next.items[i].unit_price = "Unit price must be valid."
      if (it.type === "Part") {
        if (!it.condition) next.items[i].condition = "Select condition for parts."
      }
    })

    setErrors(next)

    const hasItemErrors = next.items.some((row) => Object.values(row).some(Boolean))
    const ok =
      !next.general &&
      !next.invoice_date &&
      !next.due_date &&
      !next.odometer_reading &&
      !next.customer_id &&
      !next.customerSearch &&
      !Object.values(next.newCustomer).some(Boolean) &&
      !next.vehicle_id &&
      !Object.values(next.newVehicle).some(Boolean) &&
      !hasItemErrors

    return ok
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setErrors((p) => ({ ...p, general: "" }))
    if (!validate()) return

    setSaving(true)
    try {
      let finalCustomerId = customer_id
      let finalVehicleId = vehicle_id

      if (customerMode === "new") {
        const cRes = await api.post("/customers", {
          customer_name: newCustomer.customer_name.trim(),
          customer_phone: newCustomer.customer_phone.trim(),
          customer_email: newCustomer.customer_email.trim() || null,
          customer_address: newCustomer.customer_address.trim() || null,
        })
        finalCustomerId = String(cRes.data.id)
      }

      if (vehicleMode === "new") {
        const vRes = await api.post("/vehicles", {
          customer_id: Number(finalCustomerId),
          vehicle_vin: newVehicle.vehicle_vin.trim(),
          make: newVehicle.make.trim() || null,
          model: newVehicle.model.trim() || null,
          year: newVehicle.year.trim() ? Number(newVehicle.year) : null,
          license_plate: newVehicle.license_plate.trim() || null,
        })
        finalVehicleId = String(vRes.data.id) // backend must return {id}
      }

      const normalizedItems = items.map((it) => {
        const qty = Number(it.quantity)
        const unit = Number(it.unit_price)
        const total_price = Number((qty * unit).toFixed(2))
        return {
          item_description: it.item_description.trim(),
          type: it.type,
          condition: it.type === "Part" ? it.condition : null,
          quantity: qty,
          unit_price: Number(unit.toFixed(2)),
          total_price,
        }
      })

      const payload = {
        customer_id: Number(finalCustomerId),
        vehicle_id: Number(finalVehicleId),
        invoice_date,
        due_date: due_date || null,
        odometer_reading: odometer_reading ? Number(odometer_reading) : null,
        subtotal_amount: Number(subtotal.toFixed(2)),
        hst_amount: Number(hst.toFixed(2)),
        pst_amount: Number(pst.toFixed(2)),
        tax_amount: Number(tax.toFixed(2)),
        total_amount: Number(total.toFixed(2)),
        note: note.trim() || null,
        items: normalizedItems,
      }

      const invRes = await api.post("/invoices", payload)
      const newInvoiceId = invRes.data?.id
      if (newInvoiceId) navigate(`/invoices/${newInvoiceId}`)
      else navigate(`/invoices`)
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create invoice."
      if (msg.toLowerCase().includes("phone") && customerMode === "new") {
        setErrors((p) => ({ ...p, newCustomer: { ...p.newCustomer, customer_phone: msg } }))
      } else if (msg.toLowerCase().includes("vin") && vehicleMode === "new") {
        setErrors((p) => ({ ...p, newVehicle: { ...p.newVehicle, vehicle_vin: msg } }))
      } else {
        setErrors((p) => ({ ...p, general: msg }))
      }
    } finally {
      setSaving(false)
    }
  }

  const selectedCustomerLabel =
    selectedCustomerObj ? `${selectedCustomerObj.customer_name} (${selectedCustomerObj.customer_phone})` : ""

  return (
  <form onSubmit={onSubmit} className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    {/* Header */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-[28px] sm:text-[34px] font-extrabold tracking-tight text-slate-900">
          <span className="italic">CREATE</span>{" "}
          <span className="italic text-cyan-500">INVOICE</span>
        </h1>
        <p className="text-xs tracking-[0.2em] uppercase text-slate-500">
          GENERATION PROTOCOL
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className={[
          "h-12 px-6 rounded-2xl font-semibold text-white shadow-lg",
          "w-full sm:w-auto",
          saving ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
        ].join(" ")}
      >
        {saving ? "Saving..." : "SAVE INVOICE"}
      </button>
    </div>

    {errors.general ? (
      <div className="text-sm text-red-600">{errors.general}</div>
    ) : null}

    {/* Dates / Odometer */}
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Invoice Date */}
      <div className="bg-white/80 backdrop-blur border border-slate-100 shadow-sm rounded-[28px] p-5">
        <label className="block text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-2">
          Invoice Date *
        </label>
        <input
          type="date"
          className={[
            "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
            errors.invoice_date ? "border-red-500" : "border-slate-100",
          ].join(" ")}
          value={invoice_date}
          onChange={(e) => {
            setInvoiceDate(e.target.value)
            setErrors((p) => ({ ...p, invoice_date: "", general: "" }))
          }}
        />
        {errors.invoice_date ? (
          <div className="mt-2 text-sm text-red-600">{errors.invoice_date}</div>
        ) : null}
      </div>

      {/* Due Date */}
      <div className="bg-white/80 backdrop-blur border border-slate-100 shadow-sm rounded-[28px] p-5">
        <label className="block text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-2">
          Due Date
        </label>
        <input
          type="date"
          className={[
            "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
            errors.due_date ? "border-red-500" : "border-slate-100",
          ].join(" ")}
          value={due_date}
          onChange={(e) => {
            setDueDate(e.target.value)
            setErrors((p) => ({ ...p, due_date: "", general: "" }))
          }}
        />
        {errors.due_date ? (
          <div className="mt-2 text-sm text-red-600">{errors.due_date}</div>
        ) : null}
      </div>

      {/* Odometer */}
      <div className="bg-white/80 backdrop-blur border border-slate-100 shadow-sm rounded-[28px] p-5">
        <label className="block text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-2">
          Odometer
        </label>
        <input
          className={[
            "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
            errors.odometer_reading ? "border-red-500" : "border-slate-100",
          ].join(" ")}
          value={odometer_reading}
          onChange={(e) => {
            setOdometer(e.target.value)
            setErrors((p) => ({ ...p, odometer_reading: "", general: "" }))
          }}
          placeholder="e.g. 123456"
        />
        {errors.odometer_reading ? (
          <div className="mt-2 text-sm text-red-600">{errors.odometer_reading}</div>
        ) : null}
      </div>
    </section>

    {/* Customer + Vehicle */}
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Customer */}
      <div className="bg-white/80 backdrop-blur border border-slate-100 shadow-sm rounded-[34px] p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold italic text-slate-900">
            CUSTOMER <span className="text-cyan-500">ENTITY</span>
          </h2>

          <div className="flex rounded-2xl bg-slate-50 p-1 border border-slate-100">
            <button
              type="button"
              className={[
                "px-4 h-10 rounded-xl text-sm font-semibold",
                customerMode === "existing" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
              onClick={() => {
                setCustomerMode("existing")
                setErrors((p) => ({ ...p, customer_id: "", customerSearch: "", general: "" }))
              }}
            >
              EXISTING
            </button>
            <button
              type="button"
              className={[
                "px-4 h-10 rounded-xl text-sm font-semibold",
                customerMode === "new" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
              onClick={() => {
                setCustomerMode("new")
                setCustomerId("")
                setSelectedCustomerObj(null)
                setCustomerSearch("")
                setCustomerResults([])
                setVehicles([])
                setVehicleId("")
                setErrors((p) => ({ ...p, customer_id: "", customerSearch: "", general: "" }))
              }}
            >
              ADD NEW
            </button>
          </div>
        </div>

        <div className="mt-5">
          {customerMode === "existing" ? (
            <div className="space-y-3">
              <input
                className={[
                  "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
                  errors.customerSearch ? "border-red-500" : "border-slate-100",
                ].join(" ")}
                placeholder="Search customer by name or phone..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value)
                  setErrors((p) => ({ ...p, customerSearch: "", customer_id: "", general: "" }))
                }}
              />
              {errors.customerSearch ? (
                <div className="text-sm text-red-600">{errors.customerSearch}</div>
              ) : null}

              {customer_id && selectedCustomerObj ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-slate-100 rounded-2xl px-4 py-3 bg-slate-50">
                  <div className="text-sm">
                    Selected: <b>{selectedCustomerLabel}</b>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-cyan-600 hover:underline self-start sm:self-auto"
                    onClick={() => {
                      setCustomerId("")
                      setSelectedCustomerObj(null)
                      setVehicles([])
                      setVehicleId("")
                    }}
                  >
                    Change
                  </button>
                </div>
              ) : null}

              {!customer_id ? (
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="max-h-56 overflow-auto divide-y divide-slate-100">
                    {customerLoading ? (
                      <div className="p-4 text-sm text-slate-500">Searching...</div>
                    ) : customerResults.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">No customers found.</div>
                    ) : (
                      customerResults.map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => {
                            setCustomerId(String(c.id))
                            setSelectedCustomerObj(c)
                            setErrors((p) => ({ ...p, customer_id: "", customerSearch: "", general: "" }))
                          }}
                          className="w-full text-left p-4 hover:bg-slate-50"
                        >
                          <div className="font-semibold">{c.customer_name}</div>
                          <div className="text-xs text-slate-500">{c.customer_phone}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {errors.customer_id ? (
                <div className="text-sm text-red-600">{errors.customer_id}</div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <input
                  className={[
                    "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
                    errors.newCustomer.customer_name ? "border-red-500" : "border-slate-100",
                  ].join(" ")}
                  placeholder="Customer Name *"
                  value={newCustomer.customer_name}
                  onChange={(e) => {
                    setNewCustomer((p) => ({ ...p, customer_name: e.target.value }))
                    setErrors((p) => ({ ...p, newCustomer: { ...p.newCustomer, customer_name: "" }, general: "" }))
                  }}
                />
                {errors.newCustomer.customer_name ? (
                  <div className="mt-1 text-sm text-red-600">{errors.newCustomer.customer_name}</div>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <input
                  className={[
                    "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
                    errors.newCustomer.customer_phone ? "border-red-500" : "border-slate-100",
                  ].join(" ")}
                  placeholder="Phone *"
                  value={newCustomer.customer_phone}
                  onChange={(e) => {
                    setNewCustomer((p) => ({ ...p, customer_phone: e.target.value }))
                    setErrors((p) => ({ ...p, newCustomer: { ...p.newCustomer, customer_phone: "" }, general: "" }))
                  }}
                />
                {errors.newCustomer.customer_phone ? (
                  <div className="mt-1 text-sm text-red-600">{errors.newCustomer.customer_phone}</div>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <input
                  className={[
                    "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
                    errors.newCustomer.customer_email ? "border-red-500" : "border-slate-100",
                  ].join(" ")}
                  placeholder="Email (optional)"
                  value={newCustomer.customer_email}
                  onChange={(e) => {
                    setNewCustomer((p) => ({ ...p, customer_email: e.target.value }))
                    setErrors((p) => ({ ...p, newCustomer: { ...p.newCustomer, customer_email: "" }, general: "" }))
                  }}
                />
                {errors.newCustomer.customer_email ? (
                  <div className="mt-1 text-sm text-red-600">{errors.newCustomer.customer_email}</div>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <input
                  className="w-full h-12 rounded-2xl px-4 bg-slate-50 border border-slate-100"
                  placeholder="Address (optional)"
                  value={newCustomer.customer_address}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, customer_address: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle */}
      <div className="bg-white/80 backdrop-blur border border-slate-100 shadow-sm rounded-[34px] p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold italic text-slate-900">
            VEHICLE <span className="text-cyan-500">PROFILE</span>
          </h2>

          <div className="flex rounded-2xl bg-slate-50 p-1 border border-slate-100">
            <button
              type="button"
              className={[
                "px-4 h-10 rounded-xl text-sm font-semibold",
                vehicleMode === "existing" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
              onClick={() => {
                setVehicleMode("existing")
                setErrors((p) => ({ ...p, vehicle_id: "", general: "" }))
              }}
              disabled={customerMode === "new"}
              title={customerMode === "new" ? "Create customer first or use Add New vehicle" : ""}
            >
              EXISTING
            </button>

            <button
              type="button"
              className={[
                "px-4 h-10 rounded-xl text-sm font-semibold",
                vehicleMode === "new" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
              onClick={() => {
                setVehicleMode("new")
                setVehicleId("")
                setErrors((p) => ({ ...p, vehicle_id: "", general: "" }))
              }}
            >
              ADD NEW
            </button>
          </div>
        </div>

        <div className="mt-5">
          {vehicleMode === "existing" ? (
            <div>
              <select
                className={[
                  "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
                  errors.vehicle_id ? "border-red-500" : "border-slate-100",
                ].join(" ")}
                value={vehicle_id}
                onChange={(e) => {
                  setVehicleId(e.target.value)
                  setErrors((p) => ({ ...p, vehicle_id: "", general: "" }))
                }}
                disabled={!customer_id || customerMode !== "existing"}
              >
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_vin} — {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                  </option>
                ))}
              </select>

              {errors.vehicle_id ? (
                <div className="mt-2 text-sm text-red-600">{errors.vehicle_id}</div>
              ) : null}

              {!customer_id && customerMode === "existing" ? (
                <div className="mt-2 text-xs text-slate-500">Select a customer to load vehicles.</div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <input
                  className={[
                    "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
                    errors.newVehicle.vehicle_vin ? "border-red-500" : "border-slate-100",
                  ].join(" ")}
                  placeholder="VIN *"
                  value={newVehicle.vehicle_vin}
                  onChange={(e) => {
                    setNewVehicle((p) => ({ ...p, vehicle_vin: e.target.value }))
                    setErrors((p) => ({ ...p, newVehicle: { ...p.newVehicle, vehicle_vin: "" }, general: "" }))
                  }}
                />
                {errors.newVehicle.vehicle_vin ? (
                  <div className="mt-1 text-sm text-red-600">{errors.newVehicle.vehicle_vin}</div>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <input
                  className={[
                    "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
                    errors.newVehicle.year ? "border-red-500" : "border-slate-100",
                  ].join(" ")}
                  placeholder="Year"
                  value={newVehicle.year}
                  onChange={(e) => {
                    setNewVehicle((p) => ({ ...p, year: e.target.value }))
                    setErrors((p) => ({ ...p, newVehicle: { ...p.newVehicle, year: "" }, general: "" }))
                  }}
                />
                {errors.newVehicle.year ? (
                  <div className="mt-1 text-sm text-red-600">{errors.newVehicle.year}</div>
                ) : null}
              </div>

              <input
                className="w-full h-12 rounded-2xl px-4 bg-slate-50 border border-slate-100"
                placeholder="Make"
                value={newVehicle.make}
                onChange={(e) => setNewVehicle((p) => ({ ...p, make: e.target.value }))}
              />
              <input
                className="w-full h-12 rounded-2xl px-4 bg-slate-50 border border-slate-100"
                placeholder="Model"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle((p) => ({ ...p, model: e.target.value }))}
              />
              <input
                className="w-full sm:col-span-2 h-12 rounded-2xl px-4 bg-slate-50 border border-slate-100"
                placeholder="License Plate"
                value={newVehicle.license_plate}
                onChange={(e) => setNewVehicle((p) => ({ ...p, license_plate: e.target.value }))}
              />
            </div>
          )}
        </div>
      </div>
    </section>

    {/* Service Manifest */}
    <section className="bg-white/80 backdrop-blur border border-slate-100 shadow-sm rounded-[34px] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-extrabold italic text-slate-900">
            SERVICE <span className="text-cyan-500">MANIFEST</span>
          </h2>
        </div>

        <button
          type="button"
          onClick={addItemRow}
          className="h-11 px-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white text-sm font-semibold w-full sm:w-auto"
        >
          + ADD ITEM
        </button>
      </div>

      <div className="space-y-4">
        {items.map((it, idx) => {
          const rowErr = errors.items?.[idx] || {}
          const rowTotal = Number(it.quantity || 0) * Number(it.unit_price || 0)

          return (
            <div key={idx} className="relative border border-slate-100 rounded-[28px] p-4 sm:p-5 bg-white">
              {/* remove */}
              <button
                type="button"
                onClick={() => removeItemRow(idx)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-900 text-white grid place-items-center hover:bg-slate-800 disabled:opacity-40"
                disabled={items.length === 1}
                title={items.length === 1 ? "At least one item required" : "Remove"}
                >
                <span className="translate-y-[-6px] translate-x-[-6px] text-lg font-bold">X</span>
                </button>


              {/* Responsive grid:
                  - Mobile: stack
                  - Tablet+: 2 columns
                  - Desktop: “row-like” layout
              */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 lg:items-start">
                <div className="lg:col-span-2">
                  <label className="block text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-2">
                    Description *
                  </label>
                  <input
                    className={[
                      "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
                      rowErr.item_description ? "border-red-500" : "border-slate-100",
                    ].join(" ")}
                    placeholder="Description *"
                    value={it.item_description}
                    onChange={(e) => setItemField(idx, "item_description", e.target.value)}
                  />
                  {rowErr.item_description ? (
                    <div className="mt-1 text-sm text-red-600">{rowErr.item_description}</div>
                  ) : null}
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-2">
                    Type
                  </label>
                  <select
                    className="w-full h-12 rounded-2xl px-4 bg-slate-50 border border-slate-100"
                    value={it.type}
                    onChange={(e) => setItemField(idx, "type", e.target.value)}
                  >
                    <option value="Labor">Labor</option>
                    <option value="Part">Part</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-2">
                    Condition
                  </label>
                  <select
                    className={[
                      "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
                      rowErr.condition ? "border-red-500" : "border-slate-100",
                    ].join(" ")}
                    value={it.condition}
                    onChange={(e) => setItemField(idx, "condition", e.target.value)}
                    disabled={it.type !== "Part"}
                  >
                    <option value="">{it.type === "Part" ? "Condition *" : "N/A"}</option>
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                    <option value="Reconditioned">Reconditioned</option>
                  </select>
                  {rowErr.condition ? (
                    <div className="mt-1 text-sm text-red-600">{rowErr.condition}</div>
                  ) : null}
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-2">
                    Qty
                  </label>
                  <input
                    className={[
                      "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
                      rowErr.quantity ? "border-red-500" : "border-slate-100",
                    ].join(" ")}
                    placeholder="Qty *"
                    value={it.quantity}
                    onChange={(e) => setItemField(idx, "quantity", e.target.value)}
                  />
                  {rowErr.quantity ? (
                    <div className="mt-1 text-sm text-red-600">{rowErr.quantity}</div>
                  ) : null}
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-2">
                    Unit Price
                  </label>
                  <input
                    className={[
                      "w-full h-12 rounded-2xl px-4 bg-slate-50 border",
                      rowErr.unit_price ? "border-red-500" : "border-slate-100",
                    ].join(" ")}
                    placeholder="Unit Price *"
                    value={it.unit_price}
                    onChange={(e) => setItemField(idx, "unit_price", e.target.value)}
                  />
                  {rowErr.unit_price ? (
                    <div className="mt-1 text-sm text-red-600">{rowErr.unit_price}</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="text-sm text-slate-500">
                  LINE TOTAL: <span className="font-semibold text-cyan-600">${money(rowTotal)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>

    {/* Bottom: Remarks + Valuation */}
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Remarks */}
      <div className="lg:col-span-2 bg-white/80 backdrop-blur border border-slate-100 shadow-sm rounded-[34px] p-6">
        <h2 className="text-lg font-extrabold italic text-slate-900 mb-3">
          LOGBOOK <span className="text-cyan-500">REMARKS</span>
        </h2>

        <textarea
          className="w-full min-h-[170px] rounded-[28px] px-5 py-4 bg-slate-50 border border-slate-100 resize-y"
          placeholder="Operational details for customer..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Valuation */}
      <div className="bg-slate-900 text-white shadow-lg rounded-[34px] p-6 lg:sticky lg:top-24 h-fit">
        <div className="text-lg font-extrabold italic mb-4">
          <span className="text-cyan-400">VALUATION</span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-white/70">
            <span>SUBTOTAL</span>
            <span>${money(subtotal)}</span>
          </div>

          <div className="flex justify-between text-white/70">
            <span>HST (7%)</span>
            <span>${money(hst)}</span>
          </div>

          <div className="flex justify-between items-center text-white/70">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includePST}
                onChange={(e) => setIncludePST(e.target.checked)}
                className="h-4 w-4 accent-cyan-400"
              />
              PST (5%)
            </label>
            <span>${money(pst)}</span>
          </div>

          <div className="border-t border-white/15 pt-4 flex items-end justify-between">
            <div className="text-white/60 text-xs tracking-[0.25em] uppercase">
              GRAND TOTAL
            </div>
            <div className="text-cyan-400 text-3xl font-extrabold italic">
              ${money(total)}
            </div>
          </div>
        </div>

        {/* Bottom actions (mobile friendly) */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            className="h-12 rounded-2xl border border-white/20 text-slate-900/90 hover:bg-white/10 hover:text-white hover:border-white/10 font-semibold"
            onClick={() => navigate("/invoices")}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className={[
              "h-12 rounded-2xl font-semibold shadow-lg",
              saving ? "bg-white/30 cursor-not-allowed" : "bg-cyan-500 hover:bg-cyan-400 text-slate-900",
            ].join(" ")}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </section>
  </form>
)

}

export default CreateInvoice
