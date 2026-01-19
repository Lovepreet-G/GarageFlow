import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

function CreateInvoice() {
  const navigate = useNavigate()

  // customer search + select
  const [customerQ, setCustomerQ] = useState("")
  const [customers, setCustomers] = useState([])
  const [customerId, setCustomerId] = useState("")

  // new customer form
  const [newCustomer, setNewCustomer] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
  })

  // vehicles for selected customer
  const [vehicles, setVehicles] = useState([])
  const [vehicleId, setVehicleId] = useState("")
  const [newVehicle, setNewVehicle] = useState({
    vehicle_vin: "",
    make: "",
    model: "",
    year: "",
    license_plate: "",
  })

  // invoice meta
  const today = new Date().toISOString().slice(0, 10)
  const [invoice_date, setInvoiceDate] = useState(today)
  const [due_date, setDueDate] = useState("")
  const [odometer_reading, setOdometer] = useState("")

  // items
  const [items, setItems] = useState([
    { item_description: "", type: "Labor", condition: "", quantity: 1, unit_price: 0, total_price: 0 },
  ])

  // Load customers (search)
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/customers", { params: { q: customerQ } })
        setCustomers(res.data || [])
      } catch (e) {
        // ignore
      }
    }, 300)
    return () => clearTimeout(t)
  }, [customerQ])

  // Load vehicles when customer selected
  useEffect(() => {
    const loadVehicles = async () => {
      if (!customerId) {
        setVehicles([])
        setVehicleId("")
        return
      }
      const res = await api.get(`/customers/${customerId}/vehicles`)
      setVehicles(res.data || [])
      setVehicleId("")
    }
    loadVehicles()
  }, [customerId])

  const recalcItems = (next) => {
    return next.map((it) => {
      const qty = Number(it.quantity || 0)
      const unit = Number(it.unit_price || 0)
      return { ...it, total_price: Number((qty * unit).toFixed(2)) }
    })
  }

  const subtotal = useMemo(() => {
    return recalcItems(items).reduce((sum, it) => sum + Number(it.total_price || 0), 0)
  }, [items])

  const tax = useMemo(() => Number((subtotal * 0.12).toFixed(2)), [subtotal])
  const total = useMemo(() => Number((subtotal + tax).toFixed(2)), [subtotal, tax])

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { item_description: "", type: "Labor", condition: "", quantity: 1, unit_price: 0, total_price: 0 },
    ])
  }

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateItem = (idx, field, value) => {
    setItems((prev) => {
      const next = prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
      return recalcItems(next)
    })
  }

  const createCustomer = async () => {
    const res = await api.post("/customers", newCustomer)
    setCustomerId(String(res.data.id))
    alert("Customer created")
  }

  const createVehicle = async () => {
    if (!customerId) return alert("Select a customer first")
    const payload = {
      customer_id: Number(customerId),
      vehicle_vin: newVehicle.vehicle_vin,
      make: newVehicle.make,
      model: newVehicle.model,
      year: newVehicle.year ? Number(newVehicle.year) : null,
      license_plate: newVehicle.license_plate,
    }
    const res = await api.post("/vehicles", payload)
    // reload vehicles
    const v = await api.get(`/customers/${customerId}/vehicles`)
    setVehicles(v.data || [])
    setVehicleId(String(res.data.id))
    alert("Vehicle created")
  }

  const saveInvoice = async () => {
    if (!customerId) return alert("Select or create a customer")
    if (!vehicleId) return alert("Select or create a vehicle")

    // simple invoice number generator (replace later)
    const invoice_number = `INV-${Date.now()}`

    // validate items
    if (items.some((it) => !it.item_description || Number(it.quantity) <= 0)) {
      return alert("Please fill item description and quantity")
    }

    const payload = {
      invoice_number,
      customer_id: Number(customerId),
      vehicle_id: Number(vehicleId),
      invoice_date,
      due_date: due_date || null,
      odometer_reading: odometer_reading ? Number(odometer_reading) : null,
      subtotal_amount: Number(subtotal.toFixed(2)),
      tax_amount: Number(tax.toFixed(2)),
      total_amount: Number(total.toFixed(2)),
      status: "Draft",
      items: items.map((it) => ({
        item_description: it.item_description,
        type: it.type,
        condition: it.type === "Part" ? (it.condition || null) : null,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        total_price: Number(it.total_price),
      })),
    }

    try {
      const res = await api.post("/invoices", payload)
      navigate(`/invoices/${res.data.invoice_id}`)
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save invoice")
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Create Invoice</h1>

      {/* Customer */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="font-semibold">Customer</div>

        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Search customer by name/phone..."
          value={customerQ}
          onChange={(e) => setCustomerQ(e.target.value)}
        />

        <select
          className="border rounded px-3 py-2 w-full"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">Select customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.customer_name} ({c.customer_phone})
            </option>
          ))}
        </select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <input className="border rounded px-3 py-2" placeholder="New customer name"
            value={newCustomer.customer_name}
            onChange={(e)=>setNewCustomer({...newCustomer, customer_name:e.target.value})} />
          <input className="border rounded px-3 py-2" placeholder="Phone (unique)"
            value={newCustomer.customer_phone}
            onChange={(e)=>setNewCustomer({...newCustomer, customer_phone:e.target.value})} />

          <input className="border rounded px-3 py-2" placeholder="Email"
            value={newCustomer.customer_email}
            onChange={(e)=>setNewCustomer({...newCustomer, customer_email:e.target.value})} />
          <input className="border rounded px-3 py-2" placeholder="Address"
            value={newCustomer.customer_address}
            onChange={(e)=>setNewCustomer({...newCustomer, customer_address:e.target.value})} />

          <button
            type="button"
            onClick={createCustomer}
            className="md:col-span-2 px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800"
          >
            + Add Customer
          </button>
        </div>
      </div>

      {/* Vehicle */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="font-semibold">Vehicle</div>

        <select
          className="border rounded px-3 py-2 w-full"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          disabled={!customerId}
        >
          <option value="">{customerId ? "Select vehicle" : "Select customer first"}</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.vehicle_vin} — {v.make || ""} {v.model || ""} {v.year || ""}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <input className="border rounded px-3 py-2" placeholder="VIN"
            value={newVehicle.vehicle_vin}
            onChange={(e)=>setNewVehicle({...newVehicle, vehicle_vin:e.target.value})} />
          <input className="border rounded px-3 py-2" placeholder="Make"
            value={newVehicle.make}
            onChange={(e)=>setNewVehicle({...newVehicle, make:e.target.value})} />

          <input className="border rounded px-3 py-2" placeholder="Model"
            value={newVehicle.model}
            onChange={(e)=>setNewVehicle({...newVehicle, model:e.target.value})} />
          <input className="border rounded px-3 py-2" placeholder="Year"
            value={newVehicle.year}
            onChange={(e)=>setNewVehicle({...newVehicle, year:e.target.value})} />

          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="License Plate"
            value={newVehicle.license_plate}
            onChange={(e)=>setNewVehicle({...newVehicle, license_plate:e.target.value})} />

          <button
            type="button"
            onClick={createVehicle}
            className="md:col-span-2 px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800"
          >
            + Add Vehicle
          </button>
        </div>
      </div>

      {/* Invoice meta */}
      <div className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-slate-600">Invoice Date</label>
          <input className="border rounded px-3 py-2 w-full" type="date"
            value={invoice_date} onChange={(e)=>setInvoiceDate(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-600">Due Date</label>
          <input className="border rounded px-3 py-2 w-full" type="date"
            value={due_date} onChange={(e)=>setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-600">Odometer</label>
          <input className="border rounded px-3 py-2 w-full" placeholder="e.g. 120000"
            value={odometer_reading} onChange={(e)=>setOdometer(e.target.value)} />
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Services / Parts</div>
          <button onClick={addItem} className="px-3 py-2 rounded border hover:bg-slate-50">
            + Add Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="p-2">Description</th>
                <th className="p-2">Type</th>
                <th className="p-2">Condition</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Total</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">
                    <input className="border rounded px-2 py-1 w-72"
                      value={it.item_description}
                      onChange={(e)=>updateItem(idx,"item_description",e.target.value)} />
                  </td>
                  <td className="p-2">
                    <select className="border rounded px-2 py-1"
                      value={it.type}
                      onChange={(e)=>updateItem(idx,"type",e.target.value)}>
                      <option value="Labor">Labor</option>
                      <option value="Part">Part</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select className="border rounded px-2 py-1"
                      value={it.condition}
                      disabled={it.type !== "Part"}
                      onChange={(e)=>updateItem(idx,"condition",e.target.value)}>
                      <option value="">-</option>
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                      <option value="Reconditioned">Reconditioned</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input type="number" className="border rounded px-2 py-1 w-20"
                      value={it.quantity}
                      onChange={(e)=>updateItem(idx,"quantity",e.target.value)} />
                  </td>
                  <td className="p-2">
                    <input type="number" className="border rounded px-2 py-1 w-24"
                      value={it.unit_price}
                      onChange={(e)=>updateItem(idx,"unit_price",e.target.value)} />
                  </td>
                  <td className="p-2 font-medium">${Number(it.total_price || 0).toFixed(2)}</td>
                  <td className="p-2">
                    <button onClick={()=>removeItem(idx)} className="text-red-600 hover:underline">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm text-sm space-y-2 border rounded-lg p-4">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">HST (12%)</span>
              <span className="font-semibold">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-bold">Total</span>
              <span className="font-bold">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={saveInvoice}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Save Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateInvoice
