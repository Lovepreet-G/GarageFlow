import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

function Home() {
  const navigate = useNavigate()

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-12
  const [year, setYear] = useState(now.getFullYear())

  // weekStart (Monday)
  const getMonday = (d) => {
    const x = new Date(d)
    const day = x.getDay() // 0 Sun .. 6 Sat
    const diff = (day === 0 ? -6 : 1) - day
    x.setDate(x.getDate() + diff)
    return x.toISOString().slice(0, 10)
  }

  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [loading, setLoading] = useState(true)

  const [data, setData] = useState({
    totalSales: 0,
    totalUnpaid: 0,
    dailySales: [],
    reminders: [],
  })

  const money = (v) => `$${Number(v || 0).toFixed(2)}`

  const days = useMemo(() => {
    const start = new Date(weekStart)
    const arr = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      arr.push(d.toISOString().slice(0, 10))
    }
    return arr
  }, [weekStart])

  const dailyMap = useMemo(() => {
    const m = new Map()
    for (const r of data.dailySales) m.set(r.day, r.total)
    return m
  }, [data.dailySales])

  const dailySeries = useMemo(() => {
    return days.map((d) => ({ day: d, total: dailyMap.get(d) ?? 0 }))
  }, [days, dailyMap])

  const maxDaily = Math.max(1, ...dailySeries.map((x) => x.total))

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get("/dashboard", { params: { month, year, weekStart } })
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
    const d = new Date(weekStart)
    d.setDate(d.getDate() + deltaDays)
    setWeekStart(d.toISOString().slice(0, 10))
  }

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i)

  const weekLabel = `${days[0]} to ${days[6]}`

  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-4xl font-extrabold italic tracking-tight">
            <span className="text-slate-900">DASH</span>
            <span className="text-cyan-600">BOARD</span>
          </div>
          <div className="text-[11px] tracking-[0.25em] text-slate-400 font-semibold mt-1">
            SYSTEM PERFORMANCE METRICS
          </div>
        </div>

        <button
          onClick={() => navigate("/create-invoice")}
          className="hidden sm:inline-flex px-5 py-3 rounded-2xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow"
        >
          CREATE +
        </button>
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Total Sales */}
        <div className="relative bg-white border rounded-[28px] p-5 shadow-sm overflow-hidden">
          {/* corner accent */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-slate-100" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] tracking-[0.2em] text-slate-400 font-semibold">
                TOTAL SALES
              </div>

              <div className="flex gap-2">
                <select
                  className="border rounded-lg px-2 py-1 text-xs bg-white"
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
                  className="border rounded-lg px-2 py-1 text-xs bg-white"
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

            <div className="mt-3 text-4xl font-extrabold italic text-slate-900">
              {loading ? "…" : money(data.totalSales)}
            </div>
          </div>
        </div>

        {/* Total Unpaid */}
        <div className="relative bg-white border rounded-[28px] p-5 shadow-sm overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-slate-100" />
          <div className="relative">
            <div className="text-[11px] tracking-[0.2em] text-slate-400 font-semibold">
              TOTAL UNPAID
            </div>
            <div className="mt-3 text-4xl font-extrabold italic text-cyan-600">
              {loading ? "…" : money(data.totalUnpaid)}
            </div>
          </div>
        </div>

        {/* Quick Protocols */}
        <div className="relative bg-white border rounded-[28px] p-5 shadow-sm overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-slate-100" />
          <div className="relative">
            <div className="text-[11px] tracking-[0.2em] text-slate-400 font-semibold">
              QUICK PROTOCOLS
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/invoices")}
                className="px-4 py-3 rounded-xl border bg-white hover:bg-slate-50 font-semibold text-sm"
              >
                INVOICES
              </button>
              <button
                onClick={() => navigate("/customers")}
                className="px-4 py-3 rounded-xl border bg-white hover:bg-slate-50 font-semibold text-sm"
              >
                CUSTOMERS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Velocity (chart card) */}
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold italic">
              <span className="text-slate-900">WEEKLY </span>
              <span className="text-cyan-600">VELOCITY</span>
            </div>
            <div className="text-xs text-slate-400">{weekLabel}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftWeek(-7)}
              className="h-10 w-10 rounded-xl border hover:bg-slate-50 grid place-items-center font-bold"
              title="Previous week"
            >
              ‹
            </button>
            <button
              onClick={() => shiftWeek(7)}
              className="h-10 w-10 rounded-xl border hover:bg-slate-50 grid place-items-center font-bold"
              title="Next week"
            >
              ›
            </button>
          </div>
        </div>

        {/* Bars */}
        <div className="mt-6 grid grid-cols-7 gap-3 items-end h-44">
          {dailySeries.map((d) => {
            const h = Math.round((d.total / maxDaily) * 100)
            return (
              <div key={d.day} className="flex flex-col items-center gap-2">
                <div className="text-[10px] text-slate-400">{money(d.total)}</div>

                <div className="w-full h-32 bg-slate-100 rounded-2xl overflow-hidden flex items-end">
                  <div className="w-full bg-slate-900" style={{ height: `${h}%` }} />
                </div>

                <div className="text-[10px] text-slate-400 font-semibold">
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][new Date(d.day).getDay() === 0 ? 6 : new Date(d.day).getDay() - 1]}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reminders */}
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="text-lg font-extrabold italic">
          <span className="text-slate-900">STAGNANT </span>
          <span className="text-cyan-600">ACCOUNTS</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">INVOICES OLDER THAN 7 DAYS</div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr className="text-left">
                <th className="p-3">INVOICE #</th>
                <th className="p-3">DATE</th>
                <th className="p-3">CUSTOMER</th>
                <th className="p-3">VIN</th>
                <th className="p-3">DAYS</th>
                <th className="p-3">AMOUNT</th>
                <th className="p-3 text-right">ACCESS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : data.reminders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-slate-400">
                    No reminders 🎉
                  </td>
                </tr>
              ) : (
                data.reminders.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-semibold">{r.invoice_number}</td>
                    <td className="p-3 text-slate-500">{r.invoice_date}</td>
                    <td className="p-3 font-semibold">{r.customer_name}</td>
                    <td className="p-3 text-slate-500">{r.vehicle_vin}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 text-xs font-bold">
                        {r.days_open}D
                      </span>
                    </td>
                    <td className="p-3 font-semibold italic">{money(r.total_amount)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/invoices/${r.id}`)}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold"
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile create button */}
        <button
          onClick={() => navigate("/create-invoice")}
          className="sm:hidden w-full mt-5 px-5 py-3 rounded-2xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow"
        >
          CREATE +
        </button>
      </div>
    </div>
  )
}

export default Home
