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
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Invoice</h1>
        <button
          type="submit"
          disabled={saving}
          className={[
            "px-4 py-2 rounded text-white font-semibold",
            saving ? "bg-slate-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700",
          ].join(" ")}
        >
          {saving ? "Saving..." : "Save Invoice"}
        </button>
      </div>

      {errors.general ? <div className="text-sm text-red-600">{errors.general}</div> : null}

      {/* Dates */}
      <div className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Invoice Date *</label>
          <input
            type="date"
            className={[
              "w-full border rounded px-3 py-2",
              errors.invoice_date ? "border-red-500" : "border-slate-300",
            ].join(" ")}
            value={invoice_date}
            onChange={(e) => {
              setInvoiceDate(e.target.value)
              setErrors((p) => ({ ...p, invoice_date: "", general: "" }))
            }}
          />
          {errors.invoice_date ? <div className="mt-1 text-sm text-red-600">{errors.invoice_date}</div> : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            className={[
              "w-full border rounded px-3 py-2",
              errors.due_date ? "border-red-500" : "border-slate-300",
            ].join(" ")}
            value={due_date}
            onChange={(e) => {
              setDueDate(e.target.value)
              setErrors((p) => ({ ...p, due_date: "", general: "" }))
            }}
          />
          {errors.due_date ? <div className="mt-1 text-sm text-red-600">{errors.due_date}</div> : null}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Odometer</label>
          <input
            className={[
              "w-full border rounded px-3 py-2",
              errors.odometer_reading ? "border-red-500" : "border-slate-300",
            ].join(" ")}
            value={odometer_reading}
            onChange={(e) => {
              setOdometer(e.target.value)
              setErrors((p) => ({ ...p, odometer_reading: "", general: "" }))
            }}
            placeholder="e.g. 123456"
          />
          {errors.odometer_reading ? (
            <div className="mt-1 text-sm text-red-600">{errors.odometer_reading}</div>
          ) : null}
        </div>
      </div>

      {/* Customer */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Customer</div>
          <div className="flex gap-2">
            <button
              type="button"
              className={[
                "px-3 py-1 rounded border text-sm",
                customerMode === "existing" ? "bg-slate-900 text-white" : "hover:bg-slate-50",
              ].join(" ")}
              onClick={() => {
                setCustomerMode("existing")
                setErrors((p) => ({ ...p, customer_id: "", customerSearch: "", general: "" }))
              }}
            >
              Existing
            </button>
            <button
              type="button"
              className={[
                "px-3 py-1 rounded border text-sm",
                customerMode === "new" ? "bg-slate-900 text-white" : "hover:bg-slate-50",
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
              Add New
            </button>
          </div>
        </div>

        {customerMode === "existing" ? (
          <div className="space-y-2">
            <input
              className={[
                "w-full border rounded px-3 py-2",
                errors.customerSearch ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              placeholder="Search customer by name or phone..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value)
                setErrors((p) => ({ ...p, customerSearch: "", customer_id: "", general: "" }))
              }}
            />
            {errors.customerSearch ? <div className="text-sm text-red-600">{errors.customerSearch}</div> : null}

            {/* Selected customer pill */}
            {customer_id && selectedCustomerObj ? (
              <div className="flex items-center justify-between border rounded px-3 py-2 bg-slate-50">
                <div className="text-sm">
                  Selected: <b>{selectedCustomerLabel}</b>
                </div>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
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

            {/* Results list */}
            {!customer_id ? (
              <div className="border rounded max-h-56 overflow-auto divide-y">
                {customerLoading ? (
                  <div className="p-3 text-sm text-slate-500">Searching...</div>
                ) : customerResults.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500">No customers found.</div>
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
                      className="w-full text-left p-3 hover:bg-slate-50"
                    >
                      <div className="font-semibold">{c.customer_name}</div>
                      <div className="text-xs text-slate-600">{c.customer_phone}</div>
                    </button>
                  ))
                )}
              </div>
            ) : null}

            {errors.customer_id ? <div className="text-sm text-red-600">{errors.customer_id}</div> : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* same new customer inputs as before */}
            {/* ... kept short for readability (but it's the same logic as before) */}
            <div>
              <input
                className={[
                  "w-full border rounded px-3 py-2",
                  errors.newCustomer.customer_name ? "border-red-500" : "border-slate-300",
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

            <div>
              <input
                className={[
                  "w-full border rounded px-3 py-2",
                  errors.newCustomer.customer_phone ? "border-red-500" : "border-slate-300",
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

            <div>
              <input
                className={[
                  "w-full border rounded px-3 py-2",
                  errors.newCustomer.customer_email ? "border-red-500" : "border-slate-300",
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

            <div>
              <input
                className="w-full border border-slate-300 rounded px-3 py-2"
                placeholder="Address (optional)"
                value={newCustomer.customer_address}
                onChange={(e) => setNewCustomer((p) => ({ ...p, customer_address: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Vehicle */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Vehicle</div>
          <div className="flex gap-2">
            <button
              type="button"
              className={[
                "px-3 py-1 rounded border text-sm",
                vehicleMode === "existing" ? "bg-slate-900 text-white" : "hover:bg-slate-50",
              ].join(" ")}
              onClick={() => {
                setVehicleMode("existing")
                setErrors((p) => ({ ...p, vehicle_id: "", general: "" }))
              }}
              disabled={customerMode === "new"} // existing vehicle requires existing customer selection
              title={customerMode === "new" ? "Create customer first or use Add New vehicle" : ""}
            >
              Existing
            </button>
            <button
              type="button"
              className={[
                "px-3 py-1 rounded border text-sm",
                vehicleMode === "new" ? "bg-slate-900 text-white" : "hover:bg-slate-50",
              ].join(" ")}
              onClick={() => {
                setVehicleMode("new")
                setVehicleId("")
                setErrors((p) => ({ ...p, vehicle_id: "", general: "" }))
              }}
            >
              Add New
            </button>
          </div>
        </div>

        {vehicleMode === "existing" ? (
          <div>
            <select
              className={[
                "w-full border rounded px-3 py-2",
                errors.vehicle_id ? "border-red-500" : "border-slate-300",
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
            {errors.vehicle_id ? <div className="mt-1 text-sm text-red-600">{errors.vehicle_id}</div> : null}
            {!customer_id && customerMode === "existing" ? (
              <div className="mt-1 text-xs text-slate-500">Select a customer to load vehicles.</div>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <input
                className={[
                  "w-full border rounded px-3 py-2",
                  errors.newVehicle.vehicle_vin ? "border-red-500" : "border-slate-300",
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

            <div>
              <input
                className={[
                  "w-full border rounded px-3 py-2",
                  errors.newVehicle.year ? "border-red-500" : "border-slate-300",
                ].join(" ")}
                placeholder="Year"
                value={newVehicle.year}
                onChange={(e) => {
                  setNewVehicle((p) => ({ ...p, year: e.target.value }))
                  setErrors((p) => ({ ...p, newVehicle: { ...p.newVehicle, year: "" }, general: "" }))
                }}
              />
              {errors.newVehicle.year ? <div className="mt-1 text-sm text-red-600">{errors.newVehicle.year}</div> : null}
            </div>

            <input
              className="w-full border border-slate-300 rounded px-3 py-2"
              placeholder="Make"
              value={newVehicle.make}
              onChange={(e) => setNewVehicle((p) => ({ ...p, make: e.target.value }))}
            />
            <input
              className="w-full border border-slate-300 rounded px-3 py-2"
              placeholder="Model"
              value={newVehicle.model}
              onChange={(e) => setNewVehicle((p) => ({ ...p, model: e.target.value }))}
            />
            <input
              className="w-full md:col-span-2 border border-slate-300 rounded px-3 py-2"
              placeholder="License Plate"
              value={newVehicle.license_plate}
              onChange={(e) => setNewVehicle((p) => ({ ...p, license_plate: e.target.value }))}
            />
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Services / Items</div>
          <button
            type="button"
            onClick={addItemRow}
            className="px-3 py-2 rounded border hover:bg-slate-50 text-sm"
          >
            + Add Item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => {
            const rowErr = errors.items?.[idx] || {}
            const rowTotal = Number(it.quantity || 0) * Number(it.unit_price || 0)

            return (
              <div key={idx} className="border rounded-xl p-3">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start">
                  <div className="md:col-span-2">
                    <input
                      className={[
                        "w-full border rounded px-3 py-2",
                        rowErr.item_description ? "border-red-500" : "border-slate-300",
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
                    <select
                      className="w-full border border-slate-300 rounded px-3 py-2"
                      value={it.type}
                      onChange={(e) => setItemField(idx, "type", e.target.value)}
                    >
                      <option value="Labor">Labor</option>
                      <option value="Part">Part</option>
                    </select>
                  </div>

                  <div>
                    <select
                      className={[
                        "w-full border rounded px-3 py-2",
                        rowErr.condition ? "border-red-500" : "border-slate-300",
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
                    <input
                      className={[
                        "w-full border rounded px-3 py-2",
                        rowErr.quantity ? "border-red-500" : "border-slate-300",
                      ].join(" ")}
                      placeholder="Qty *"
                      value={it.quantity}
                      onChange={(e) => setItemField(idx, "quantity", e.target.value)}
                    />
                    {rowErr.quantity ? <div className="mt-1 text-sm text-red-600">{rowErr.quantity}</div> : null}
                  </div>

                  <div>
                    <input
                      className={[
                        "w-full border rounded px-3 py-2",
                        rowErr.unit_price ? "border-red-500" : "border-slate-300",
                      ].join(" ")}
                      placeholder="Unit Price *"
                      value={it.unit_price}
                      onChange={(e) => setItemField(idx, "unit_price", e.target.value)}
                    />
                    {rowErr.unit_price ? <div className="mt-1 text-sm text-red-600">{rowErr.unit_price}</div> : null}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm text-slate-600">
                    Row Total: <b>${money(rowTotal)}</b>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="text-sm text-red-600 hover:underline"
                    disabled={items.length === 1}
                    title={items.length === 1 ? "At least one item required" : ""}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Totals + Taxes */}
      <div className="bg-white border rounded-xl p-4">
        <div className="font-semibold mb-3">Totals</div>

        <div className="space-y-2 max-w-md">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-semibold">${money(subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-600">HST (7%)</span>
            <span className="font-semibold">${money(hst)}</span>
          </div>

          <div className="flex justify-between">
            <label className="text-slate-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={includePST}
                onChange={(e) => setIncludePST(e.target.checked)}
              />
              PST (5%)
            </label>
            <span className="font-semibold">${money(pst)}</span>
          </div>

          <div className="flex justify-between text-base pt-2 border-t">
            <span className="font-bold">Total</span>
            <span className="font-bold">${money(total)}</span>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="bg-white border rounded-xl p-4">
        <div className="font-semibold mb-2">Note</div>
        <textarea
          className="border border-slate-300 rounded px-3 py-2 w-full min-h-[90px]"
          placeholder="Write any note for the customer (appears on invoice)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Bottom actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="px-4 py-2 rounded border hover:bg-slate-50"
          onClick={() => navigate("/invoices")}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className={[
            "px-4 py-2 rounded text-white font-semibold",
            saving ? "bg-slate-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700",
          ].join(" ")}
        >
          {saving ? "Saving..." : "Save Invoice"}
        </button>
      </div>
    </form>
  )
}

export default CreateInvoice
