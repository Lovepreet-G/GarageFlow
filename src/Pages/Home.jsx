import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

function Home() {
  const navigate = useNavigate()

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const getMonday = (d) => {
    const x = new Date(d)
    const day = x.getDay()
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
  const averageDaily = useMemo(() => {
    if (!dailySeries.length) return 0
    return dailySeries.reduce((sum, item) => sum + Number(item.total || 0), 0) / dailySeries.length
  }, [dailySeries])

  const topDay = useMemo(() => {
    if (!dailySeries.length) return null
    return dailySeries.reduce(
      (best, item) => (Number(item.total || 0) > Number(best.total || 0) ? item : best),
      dailySeries[0]
    )
  }, [dailySeries])

  const weeklyTotal = useMemo(
    () => dailySeries.reduce((sum, item) => sum + Number(item.total || 0), 0),
    [dailySeries]
  )

  const dayLabel = (dateStr) => {
    const dayIndex = new Date(dateStr).getDay()
    return ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][dayIndex === 0 ? 6 : dayIndex - 1]
  }

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-4xl font-extrabold italic tracking-tight">
            <span className="text-slate-900">DASH</span>
            <span className="text-cyan-600">BOARD</span>
          </div>
          <div className="mt-1 text-[11px] font-semibold tracking-[0.25em] text-slate-400">
            SYSTEM PERFORMANCE METRICS
          </div>
        </div>

        <button
          onClick={() => navigate("/create-invoice")}
          className="hidden rounded-2xl bg-cyan-600 px-5 py-3 font-bold text-white shadow hover:bg-cyan-700 sm:inline-flex"
        >
          CREATE +
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="relative overflow-hidden rounded-[28px] border bg-white p-5 shadow-sm">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-slate-100" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-slate-400">
                TOTAL SALES
              </div>

              <div className="flex gap-2">
                <select
                  className="rounded-lg border bg-white px-2 py-1 text-xs"
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
                  className="rounded-lg border bg-white px-2 py-1 text-xs"
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
              {loading ? "..." : money(data.totalSales)}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border bg-white p-5 shadow-sm">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-slate-100" />
          <div className="relative">
            <div className="text-[11px] font-semibold tracking-[0.2em] text-slate-400">
              TOTAL UNPAID
            </div>
            <div className="mt-3 text-4xl font-extrabold italic text-cyan-600">
              {loading ? "..." : money(data.totalUnpaid)}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border bg-white p-5 shadow-sm">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-slate-100" />
          <div className="relative">
            <div className="text-[11px] font-semibold tracking-[0.2em] text-slate-400">
              QUICK PROTOCOLS
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/invoices")}
                className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                INVOICES
              </button>
              <button
                onClick={() => navigate("/customers")}
                className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                CUSTOMERS
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border bg-white p-5 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-cyan-50 via-white to-slate-50" />

        <div className="relative">
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
                className="grid h-10 w-10 place-items-center rounded-xl border font-bold hover:bg-slate-50"
                title="Previous week"
              >
                {"<"}
              </button>
              <button
                onClick={() => shiftWeek(7)}
                className="grid h-10 w-10 place-items-center rounded-xl border font-bold hover:bg-slate-50"
                title="Next week"
              >
                {">"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Weekly Total
              </div>
              <div className="mt-2 text-2xl font-extrabold italic text-slate-900">
                {money(weeklyTotal)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Peak Day
              </div>
              <div className="mt-2 text-2xl font-extrabold italic text-cyan-700">
                {topDay ? dayLabel(topDay.day) : "--"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {topDay ? money(topDay.total) : "No activity"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Daily Average
              </div>
              <div className="mt-2 text-2xl font-extrabold italic text-slate-900">
                {money(averageDaily)}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-[linear-gradient(to_top,rgba(226,232,240,0.6)_1px,transparent_1px)] bg-[length:100%_25%] px-3 pb-4 pt-6">
            <div className="grid h-52 grid-cols-7 items-end gap-3">
              {dailySeries.map((d) => {
                const h = Math.max(10, Math.round((d.total / maxDaily) * 100))
                const isTopDay = topDay?.day === d.day

                return (
                  <div key={d.day} className="flex flex-col items-center gap-2">
                    <div
                      className={[
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm",
                        isTopDay ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {money(d.total)}
                    </div>

                    <div className="relative flex h-36 w-full items-end overflow-hidden rounded-[22px] bg-slate-100/90 ring-1 ring-slate-200">
                      <div
                        className={[
                          "w-full rounded-t-[18px] transition-all duration-300",
                          isTopDay
                            ? "bg-gradient-to-t from-cyan-700 via-cyan-500 to-cyan-300"
                            : "bg-gradient-to-t from-slate-900 via-slate-700 to-slate-500",
                        ].join(" ")}
                        style={{ height: `${h}%` }}
                      />
                      {isTopDay ? (
                        <div className="absolute inset-x-2 top-2 rounded-full bg-white/85 px-2 py-1 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-700">
                          Peak
                        </div>
                      ) : null}
                    </div>

                    <div className="text-[10px] font-semibold tracking-[0.16em] text-slate-500">
                      {dayLabel(d.day)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border bg-white p-5 shadow-sm">
        <div className="text-lg font-extrabold italic">
          <span className="text-slate-900">STAGNANT </span>
          <span className="text-cyan-600">ACCOUNTS</span>
        </div>
        <div className="mt-1 text-xs text-slate-400">INVOICES OLDER THAN 7 DAYS</div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
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
                    No reminders
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
                      <span className="rounded-lg bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700">
                        {r.days_open}D
                      </span>
                    </td>
                    <td className="p-3 font-semibold italic">{money(r.total_amount)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/invoices/${r.id}`)}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
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

        <button
          onClick={() => navigate("/create-invoice")}
          className="mt-5 w-full rounded-2xl bg-cyan-600 px-5 py-3 font-bold text-white shadow hover:bg-cyan-700 sm:hidden"
        >
          CREATE +
        </button>
      </div>
    </div>
  )
}

export default Home
