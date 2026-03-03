import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

function getMonday(d) {
  const x = new Date(d)
  const day = x.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  x.setDate(x.getDate() + diff)
  return x.toISOString().slice(0, 10)
}

function Employees() {
  const navigate = useNavigate()
  const [q, setQ] = useState("")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    pay_rate: "",
    job_type: "Part-time",
    sin_number: "",
  })

  const [showSchedule, setShowSchedule] = useState(false)
  const [schedEmployee, setSchedEmployee] = useState(null)
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [entries, setEntries] = useState(() => {
    const m = []
    for (let i = 0; i < 7; i++) m.push({ day: "", start_time: "", end_time: "", role: "", notes: "" })
    return m
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get("/employees", { params: { q } })
      setRows(res.data.employees || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const openNew = () => {
    setEditing(null)
    setForm({ name: "", mobile: "", email: "", pay_rate: "", job_type: "Part-time", sin_number: "" })
    setShowForm(true)
  }

  const openEdit = (r) => {
    setEditing(r.id)
    setForm({ name: r.name || "", mobile: r.mobile || "", email: r.email || "", pay_rate: r.pay_rate || "", job_type: r.job_type || "Part-time", sin_number: r.sin_number || "" })
    setShowForm(true)
  }

  const save = async () => {
    try {
      if (editing) {
        await api.patch(`/employees/${editing}`, form)
      } else {
        await api.post(`/employees`, form)
      }
      setShowForm(false)
      load()
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || 'Error')
    }
  }

  const remove = async (id) => {
    if (!confirm('Soft delete this employee?')) return
    try {
      await api.delete(`/employees/${id}`)
      load()
    } catch (e) {
      console.error(e)
      alert('Error')
    }
  }

  const openSched = (r) => {
    setSchedEmployee(r)
    setWeekStart(getMonday(new Date()))
    // initialize entries with days
    const base = new Date(getMonday(new Date()))
    const e = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      e.push({ day: d.toISOString().slice(0, 10), start_time: "", end_time: "", role: "", notes: "" })
    }
    setEntries(e)
    setShowSchedule(true)
  }

  const loadSchedule = async () => {
    if (!schedEmployee) return
    try {
      const res = await api.get(`/employees/${schedEmployee.id}/schedules`, { params: { weekStart } })
      const s = (res.data.schedules && res.data.schedules[0]) || null
      if (s) setEntries(s.entries.map((it) => ({ day: it.day, start_time: it.start_time || "", end_time: it.end_time || "", role: it.role || "", notes: it.notes || "" })))
      else {
        // keep current entries days aligned to weekStart
        const base = new Date(weekStart)
        const e = []
        for (let i = 0; i < 7; i++) {
          const d = new Date(base)
          d.setDate(base.getDate() + i)
          e.push({ day: d.toISOString().slice(0, 10), start_time: "", end_time: "", role: "", notes: "" })
        }
        setEntries(e)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const saveSchedule = async () => {
    try {
      await api.post(`/employees/${schedEmployee.id}/schedules`, { weekStart, entries })
      alert('Saved')
    } catch (e) {
      console.error(e)
      alert('Error')
    }
  }

  const downloadPdf = async () => {
    try {
      const res = await api.get(`/employees/${schedEmployee.id}/schedule/pdf`, { params: { weekStart }, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `schedule_${schedEmployee.id}_${weekStart}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      console.error(e)
      alert('Error downloading PDF')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold">EMPLOYEES</div>
          <div className="text-xs text-slate-400">Manage employee records and schedules</div>
        </div>

        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="border rounded-lg px-3 py-2 text-sm" />
          <button onClick={openNew} className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold">Add</button>
        </div>
      </div>

      <div className="bg-white border rounded-[20px] p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr className="text-left">
                <th className="p-3">NAME</th>
                <th className="p-3">MOBILE</th>
                <th className="p-3">EMAIL</th>
                <th className="p-3">JOB</th>
                <th className="p-3">RATE</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-4 text-slate-400">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-slate-400">No employees</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-semibold">{r.name}</td>
                  <td className="p-3 text-slate-500">{r.mobile}</td>
                  <td className="p-3 text-slate-500">{r.email}</td>
                  <td className="p-3">{r.job_type}</td>
                  <td className="p-3">{r.pay_rate}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => openEdit(r)} className="px-3 py-1 rounded-xl border mr-2">Edit</button>
                    <button onClick={() => openSched(r)} className="px-3 py-1 rounded-xl border mr-2">Schedule</button>
                    <button onClick={() => remove(r.id)} className="px-3 py-1 rounded-xl bg-rose-600 text-white">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl">
            <h3 className="text-lg font-bold mb-3">{editing ? 'Edit' : 'New'} Employee</h3>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="border p-2 rounded" />
              <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Mobile" className="border p-2 rounded" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border p-2 rounded" />
              <input value={form.pay_rate} onChange={(e) => setForm({ ...form, pay_rate: e.target.value })} placeholder="Pay rate" className="border p-2 rounded" />
              <select value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })} className="border p-2 rounded">
                <option>Part-time</option>
                <option>Full-time</option>
              </select>
              <input value={form.sin_number} onChange={(e) => setForm({ ...form, sin_number: e.target.value })} placeholder="SIN" className="border p-2 rounded" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border">Cancel</button>
              <button onClick={save} className="px-4 py-2 rounded-xl bg-cyan-600 text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule modal */}
      {showSchedule && schedEmployee && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Schedule - {schedEmployee.name}</h3>
              <div className="flex items-center gap-2">
                <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="border p-2 rounded" />
                <button onClick={loadSchedule} className="px-3 py-2 rounded border">Load</button>
              </div>
            </div>

            <div className="mt-4">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr className="text-left">
                    <th className="p-2">Date</th>
                    <th className="p-2">Start</th>
                    <th className="p-2">End</th>
                    <th className="p-2">Role</th>
                    <th className="p-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{e.day}</td>
                      <td className="p-2"><input className="border p-1 rounded text-sm" value={e.start_time} onChange={(ev) => { const copy = [...entries]; copy[i].start_time = ev.target.value; setEntries(copy) }} type="time" /></td>
                      <td className="p-2"><input className="border p-1 rounded text-sm" value={e.end_time} onChange={(ev) => { const copy = [...entries]; copy[i].end_time = ev.target.value; setEntries(copy) }} type="time" /></td>
                      <td className="p-2"><input className="border p-1 rounded text-sm" value={e.role} onChange={(ev) => { const copy = [...entries]; copy[i].role = ev.target.value; setEntries(copy) }} /></td>
                      <td className="p-2"><input className="border p-1 rounded text-sm" value={e.notes} onChange={(ev) => { const copy = [...entries]; copy[i].notes = ev.target.value; setEntries(copy) }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowSchedule(false)} className="px-4 py-2 rounded-xl border">Close</button>
              <button onClick={saveSchedule} className="px-4 py-2 rounded-xl bg-cyan-600 text-white">Save</button>
              <button onClick={downloadPdf} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees
