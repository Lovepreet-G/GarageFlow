import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../api"

function InvoiceView() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  // no alerts: inline error messages
  const [error, setError] = useState("")
  const [printing, setPrinting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const money = (v) => `$${Number(v || 0).toFixed(2)}`

  const printInvoicePdf = async () => {
    setError("")
    setPrinting(true)
    try {
      const res = await api.get(`/invoices/${id}/pdf`, {
        responseType: "blob",
      })

      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)

      const printWindow = window.open(url, "_blank")
      if (!printWindow) {
        setError("Popup blocked. Please allow popups to print the invoice.")
        window.URL.revokeObjectURL(url)
        return
      }

      // Some browsers don't fire onload reliably for PDF.
      // We'll attempt print after a short delay too.
      const tryPrint = () => {
        try {
          printWindow.focus()
          printWindow.print()
          printWindow.onafterprint = () => {
            printWindow.close()
            window.URL.revokeObjectURL(url)
          }
        } catch {
          // fallback: keep tab open
        }
      }

      printWindow.onload = tryPrint
      setTimeout(tryPrint, 700)
    } catch (e) {
      console.error(e)
      setError(e.response?.data?.message || "Failed to print invoice.")
    } finally {
      setPrinting(false)
    }
  }

  const downloadInvoicePdf = async (invoiceNumber) => {
    setError("")
    setDownloading(true)
    try {
      const res = await api.get(`/invoices/${id}/pdf`, {
        responseType: "blob",
      })

      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `${invoiceNumber || `INV-${id}`}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      setError(e.response?.data?.message || "Failed to download PDF.")
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      setError("")
      try {
        const res = await api.get(`/invoices/${id}`)
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load invoice.")
        setTimeout(() => navigate("/invoices"), 600)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  if (loading) return <div className="text-sm text-slate-500">Loading...</div>
  if (!data) return null

  const { invoice, items } = data

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4 overflow-x-hidden">
      {/* Top actions (hidden on print) */}
      <div className="no-print">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            onClick={() => navigate("/invoices")}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 w-fit shadow-sm"
          >
            ← Back to list
          </button>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={printInvoicePdf}
              disabled={printing || downloading}
              className={[
                "px-4 py-2 rounded-lg text-white shadow-sm",
                printing || downloading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800",
              ].join(" ")}
            >
              {printing ? "Printing..." : "Print"}
            </button>

            <button
              onClick={() => downloadInvoicePdf(invoice.invoice_number)}
              disabled={printing || downloading}
              className={[
                "px-4 py-2 rounded-lg border border-slate-200 bg-white shadow-sm",
                printing || downloading
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-slate-50",
              ].join(" ")}
            >
              {downloading ? "Downloading..." : "Download"}
            </button>
          </div>
        </div>

        {/* Inline error */}
        {error ? (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        ) : null}
      </div>

      {/* Printable Invoice (paper look + centered like your screenshots) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm w-full max-w-[900px] mx-auto p-4 sm:p-6 lg:p-8 print-page">
        {/* Shop header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            {invoice.logo_url ? (
              <img
                src={"http://localhost:5000" + invoice.logo_url}
                alt="Shop Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain border border-slate-200 rounded-xl shrink-0 bg-white"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 border border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 shrink-0 bg-white">
                GF
              </div>
            )}

            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-bold leading-tight break-words">
                {invoice.shop_name}
              </div>
              <div className="text-sm text-slate-600 whitespace-pre-line break-words">
                {invoice.shop_address}
              </div>
              <div className="text-sm text-slate-600 break-words">
                {invoice.shop_phone ? `Phone: ${invoice.shop_phone}` : ""}
                {invoice.shop_phone && invoice.shop_email ? " • " : ""}
                {invoice.shop_email ? `Email: ${invoice.shop_email}` : ""}
              </div>
              {invoice.tax_id ? (
                <div className="text-sm text-slate-600">GST No. : {invoice.tax_id}</div>
              ) : null}
            </div>
          </div>

          {/* Invoice meta */}
          <div className="md:text-right">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              INVOICE
            </div>
            <div className="text-sm mt-2 space-y-1 text-slate-700">
              <div>
                <span className="font-semibold">Invoice #:</span>{" "}
                {invoice.invoice_number}
              </div>
              <div>
                <span className="font-semibold">Date:</span> {invoice.invoice_date}
              </div>
              {invoice.due_date ? (
                <div>
                  <span className="font-semibold">Due:</span> {invoice.due_date}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <hr className="my-6 border-slate-200" />

        {/* Customer + Vehicle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="text-xs tracking-widest text-slate-500 font-semibold mb-2">
              BILL TO
            </div>
            <div className="text-sm">
              <div className="text-base font-semibold">{invoice.customer_name}</div>
              {invoice.customer_address ? (
                <div className="text-slate-600 whitespace-pre-line break-words mt-1">
                  {invoice.customer_address}
                </div>
              ) : null}
              <div className="text-slate-600 break-words mt-1">
                {invoice.customer_phone ? `Phone: ${invoice.customer_phone}` : ""}
                {invoice.customer_phone && invoice.customer_email ? " • " : ""}
                {invoice.customer_email ? `Email: ${invoice.customer_email}` : ""}
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <div className="text-xs tracking-widest text-slate-500 font-semibold mb-2">
              VEHICLE
            </div>
            <div className="text-sm text-slate-700 space-y-1 break-words">
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
        <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden">
          {/* Keep structure on small screens: horizontal scroll only for table */}
          <div className="w-full overflow-x-auto">
            <table className="min-w-[780px] w-full">
              <thead className="bg-slate-50 text-sm">
                <tr className="text-left text-slate-600">
                  <th className="p-3 font-semibold">Description</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Condition</th>
                  <th className="p-3 font-semibold">Qty</th>
                  <th className="p-3 font-semibold">Unit</th>
                  <th className="p-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-slate-200">
                    <td className="p-3">{it.item_description}</td>
                    <td className="p-3">{it.type}</td>
                    <td className="p-3">{it.condition || "-"}</td>
                    <td className="p-3">{it.quantity}</td>
                    <td className="p-3">{money(it.unit_price)}</td>
                    <td className="p-3 font-semibold">{money(it.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals (right aligned like screenshot) */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-sm">
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-slate-500 tracking-widest text-xs font-semibold">
                SUBTOTAL
              </div>
              <div className="text-right font-semibold">
                {money(invoice.subtotal_amount)}
              </div>

              <div className="text-slate-500 tracking-widest text-xs font-semibold">
                HST (7%)
              </div>
              <div className="text-right font-semibold">{money(invoice.hst_amount)}</div>

              <div className="text-slate-500 tracking-widest text-xs font-semibold">
                PST (5%)
              </div>
              <div className="text-right font-semibold">{money(invoice.pst_amount)}</div>

              <div className="col-span-2 my-2 border-t border-slate-200" />

              <div className="text-slate-700 tracking-widest text-xs font-semibold">
                TOTAL
              </div>
              <div className="text-right text-2xl font-extrabold">
                {money(invoice.total_amount)}
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        {invoice.note ? (
          <div className="mt-6 text-sm text-slate-700">
            <span className="font-semibold">Note:</span>
            <div className="whitespace-pre-line mt-1">{invoice.note}</div>
          </div>
        ) : null}

        {/* Signatures (same structure, responsive) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-24 flex flex-col justify-end">
            <div className="text-[10px] tracking-widest text-slate-400 font-semibold mb-2">
              CUSTOMER SIGNATURE
            </div>
            <div className="border-b border-slate-200" />
          </div>
          <div className="h-24 flex flex-col justify-end">
            <div className="text-[10px] tracking-widest text-slate-400 font-semibold mb-2">
              ADVISOR APPROVAL
            </div>
            <div className="border-b border-slate-200" />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between text-[10px] text-slate-400 tracking-widest">
          <span>© {new Date().getFullYear()} GARAGEFLOW</span>
          <span className="italic">POWERED BY GARAGEFLOW</span>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-page {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }

          /* better print consistency */
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  )
}

export default InvoiceView
