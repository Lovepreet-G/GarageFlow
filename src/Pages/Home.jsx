import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

const toYMDLocal = (date) => date.toLocaleDateString("en-CA") // YYYY-MM-DD (local)

function Home() {
  const navigate = useNavigate()

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  // ✅ weekStart Monday (local, no UTC shift)
  const getMondayYMD = (d) => {
    const x = new Date(d)
    const day = x.getDay() // 0 Sun .. 6 Sat
    const diff = (day === 0 ? -6 : 1) - day
    x.setDate(x.getDate() + diff)
    return toYMDLocal(x)
  }

  const [weekStart, setWeekStart] = useState(getMondayYMD(new Date()))

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    totalSales: 0,
    totalUnpaid: 0,
    dailySales: [],
    reminders: [],
  })

  const money = (v) => `$${Number(v || 0).toFixed(2)}`

  // ✅ Build 7 days locally (no ISO timezone shift)
  const days = useMemo(() => {
    const [y, m, d] = weekStart.split("-").map(Number)
    const start = new Date(y, m - 1, d)
    const arr = []
    for (let i = 0; i < 7; i++) {
      const dt = new Date(start)
      dt.setDate(start.getDate() + i)
      arr.push(toYMDLocal(dt))
    }
    return arr
  }, [weekStart])

  // backend now already returns 7 days, but this keeps UI safe anyway
  const dailyMap = useMemo(() => {
    const m = new Map()
    for (const r of data.dailySales || []) m.set(r.day, r.total)
    return m
  }, [data.dailySales])

  const dailySeries = useMemo(() => {
    return days.map((d) => ({ day: d, total: dailyMap.get(d) ?? 0 }))
  }, [days, dailyMap])

  const maxDaily = Math.max(1, ...dailySeries.map((x) => x.total))

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get("/dashboard", {
        params: { month, year, weekStart },
      })
      setData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, weekStart])

  const shiftWeek = (deltaDays) => {
    const [y, m, d] = weekStart.split("-").map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() + deltaDays)
    setWeekStart(toYMDLocal(dt))
  }

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i)

  const weekLabel = `${days[0]} to ${days[6]}`

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <button
          onClick={() => navigate("/create-invoice")}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        >
          Create Invoice +
        </button>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Sales (month/year) */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-slate-500">Total Sales</div>

            <div className="flex gap-2">
              <select
                className="border rounded px-2 py-1 text-sm"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>

              <select
                className="border rounded px-2 py-1 text-sm"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-3xl font-bold mt-2">{loading ? "…" : money(data.totalSales)}</div>
          <div className="text-xs text-slate-500 mt-1">Paid invoices in selected month/year</div>
        </div>

        {/* Unpaid total */}
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">Total Unpaid Amount</div>
          <div className="text-3xl font-bold mt-2">{loading ? "…" : money(data.totalUnpaid)}</div>
          <div className="text-xs text-slate-500 mt-1">Approved + Overdue</div>
        </div>

        {/* Quick action */}
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">Quick Actions</div>
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={() => navigate("/invoices")}
              className="px-4 py-2 rounded border hover:bg-slate-50"
            >
              View Invoices
            </button>
            <button
              onClick={() => navigate("/customers")}
              className="px-4 py-2 rounded border hover:bg-slate-50"
            >
              View Customers
            </button>
          </div>
        </div>
      </div>

      {/* Daily sales chart */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-semibold">Daily Sales (Week)</div>
            <div className="text-xs text-slate-500">{weekLabel}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftWeek(-7)}
              className="px-3 py-2 rounded border hover:bg-slate-50"
              title="Previous week"
            >
              ←
            </button>
            <button
              onClick={() => shiftWeek(7)}
              className="px-3 py-2 rounded border hover:bg-slate-50"
              title="Next week"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 items-end h-40">
          {dailySeries.map((d) => {
            const h = Math.round((d.total / maxDaily) * 100)
            return (
              <div key={d.day} className="flex flex-col items-center gap-1">
                <div className="text-[10px] text-slate-500">{money(d.total)}</div>
                <div className="w-full border rounded bg-slate-100 h-28 flex items-end overflow-hidden">
                  <div className="w-full bg-slate-900" style={{ height: `${h}%` }} />
                </div>
                <div className="text-[10px] text-slate-500">{d.day.slice(5)}</div>
              </div>
            )
          })}
        </div>

        <div className="text-xs text-slate-500 mt-3">Paid invoices grouped by invoice date.</div>
      </div>

      {/* Reminder window */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Reminders</div>
            <div className="text-xs text-slate-500">
              Approved invoices older than 7 days (not paid)
            </div>
          </div>

          <button
            onClick={() => navigate("/invoices")}
            className="px-4 py-2 rounded border hover:bg-slate-50"
          >
            Open Invoices
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="p-2">Invoice #</th>
                <th className="p-2">Date</th>
                <th className="p-2">Customer</th>
                <th className="p-2">VIN</th>
                <th className="p-2">Days</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Open</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-3 text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : data.reminders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-3 text-slate-500">
                    No reminders 🎉
                  </td>
                </tr>
              ) : (
                data.reminders.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.invoice_number}</td>
                    <td className="p-2">{r.invoice_date}</td>
                    <td className="p-2">{r.customer_name}</td>
                    <td className="p-2">{r.vehicle_vin}</td>
                    <td className="p-2">{r.days_open}</td>
                    <td className="p-2 font-medium">{money(r.total_amount)}</td>
                    <td className="p-2">
                      <button
                        onClick={() => navigate(`/invoices/${r.id}`)}
                        className="px-3 py-1 rounded bg-slate-900 text-white hover:bg-slate-800"
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
    </div>
  )
}

export default Home
