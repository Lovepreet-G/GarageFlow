import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../api"

function InvoiceView() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/invoices/${id}`)
        setData(res.data)
      } catch (err) {
        alert(err.response?.data?.message || "Failed to load invoice")
        navigate("/invoices")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  if (loading) return <div className="text-sm text-slate-500">Loading...</div>
  if (!data) return null

  const { invoice, items } = data

  const money = (v) => `$${Number(v || 0).toFixed(2)}`

  return (
    <div className="space-y-4">
      {/* Top actions (hidden on print) */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => navigate("/invoices")}
          className="px-4 py-2 rounded border bg-white hover:bg-slate-50"
        >
          ← Back
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800"
        >
          Print
        </button>
      </div>

      {/* Printable Invoice */}
      <div className="bg-white border rounded-xl p-6 print-page">
        {/* Shop header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Logo */}
            {invoice.logo_url ? (
              <img
                src={invoice.logo_url}
                alt="Shop Logo"
                className="w-20 h-20 object-contain border rounded"
              />
            ) : (
              <div className="w-20 h-20 border rounded flex items-center justify-center text-xs text-slate-400">
                Logo
              </div>
            )}

            <div>
              <div className="text-2xl font-bold leading-tight">
                {invoice.shop_name}
              </div>
              <div className="text-sm text-slate-600 whitespace-pre-line">
                {invoice.shop_address}
              </div>
              <div className="text-sm text-slate-600">
                {invoice.shop_phone ? `Phone: ${invoice.shop_phone}` : ""}
                {invoice.shop_phone && invoice.shop_email ? " • " : ""}
                {invoice.shop_email ? `Email: ${invoice.shop_email}` : ""}
              </div>
              {invoice.tax_id ? (
                <div className="text-sm text-slate-600">GST/HST: {invoice.tax_id}</div>
              ) : null}
            </div>
          </div>

          {/* Invoice meta */}
          <div className="text-right">
            <div className="text-3xl font-bold">INVOICE</div>
            <div className="text-sm mt-1">
              <div>
                <span className="font-semibold">Invoice #:</span>{" "}
                {invoice.invoice_number}
              </div>
              <div>
                <span className="font-semibold">Date:</span>{" "}
                {invoice.invoice_date}
              </div>
              {invoice.due_date ? (
                <div>
                  <span className="font-semibold">Due:</span> {invoice.due_date}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <hr className="my-5" />

        {/* Customer + Vehicle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-2">Bill To</div>
            <div className="text-sm">
              <div className="font-medium">{invoice.customer_name}</div>
              {invoice.customer_address ? (
                <div className="text-slate-600 whitespace-pre-line">
                  {invoice.customer_address}
                </div>
              ) : null}
              <div className="text-slate-600">
                {invoice.customer_phone ? `Phone: ${invoice.customer_phone}` : ""}
                {invoice.customer_phone && invoice.customer_email ? " • " : ""}
                {invoice.customer_email ? `Email: ${invoice.customer_email}` : ""}
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-2">Vehicle</div>
            <div className="text-sm text-slate-700 space-y-1">
              <div>
                <span className="font-semibold">VIN:</span> {invoice.vehicle_vin}
              </div>
              <div>
                <span className="font-semibold">Make/Model:</span>{" "}
                {[invoice.make, invoice.model].filter(Boolean).join(" ")}
              </div>
              <div>
                <span className="font-semibold">Year:</span> {invoice.year || "-"}
              </div>
              <div>
                <span className="font-semibold">Plate:</span>{" "}
                {invoice.license_plate || "-"}
              </div>
              <div>
                <span className="font-semibold">Odometer:</span>{" "}
                {invoice.odometer_reading ?? "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-5 border rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50 text-sm">
              <tr className="text-left">
                <th className="p-3">Description</th>
                <th className="p-3">Type</th>
                <th className="p-3">Condition</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="p-3">{it.item_description}</td>
                  <td className="p-3">{it.type}</td>
                  <td className="p-3">{it.condition || "-"}</td>
                  <td className="p-3">{it.quantity}</td>
                  <td className="p-3">{money(it.unit_price)}</td>
                  <td className="p-3 font-medium">{money(it.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-sm border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">{money(invoice.subtotal_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">HST/GST</span>
              <span className="font-semibold">{money(invoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-bold">Total</span>
              <span className="font-bold">{money(invoice.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Warranty */}
        <div className="mt-5 text-sm text-slate-700">
          <span className="font-semibold">Warranty:</span>{" "}
          {invoice.warranty_statement || "90 days or 5,000 km"}
        </div>

        {/* Signatures */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 h-28">
            <div className="text-xs text-slate-500 mb-2">Customer Signature</div>
            <div className="h-16 border-b border-dashed" />
          </div>
          <div className="border rounded-lg p-4 h-28">
            <div className="text-xs text-slate-500 mb-2">Mechanic Signature</div>
            <div className="h-16 border-b border-dashed" />
          </div>
          <div className="border rounded-lg p-4 h-28">
            <div className="text-xs text-slate-500 mb-2">Stamp</div>
            <div className="h-16 border border-dashed rounded" />
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-xs text-slate-500 text-center">
          Powered by GarageFlow
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page {
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default InvoiceView
