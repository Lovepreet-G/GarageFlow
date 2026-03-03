import { useEffect, useState } from 'react'
import attendanceApi from '../api/attendanceApi'

function getMonday(d){ const x=new Date(d); const day=x.getDay(); const diff=(day===0?-6:1)-day; x.setDate(x.getDate()+diff); return x }
function fmt(d){ return new Date(d).toISOString().slice(0,10) }

export default function Attendance(){
  const [weekStart, setWeekStart] = useState(fmt(getMonday(new Date())))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async ()=>{
    setLoading(true)
    try{ const r = await attendanceApi.getAttendance({ weekStart }); setRows(r.data.attendance || []) }catch(e){}
    setLoading(false)
  }

  useEffect(()=>{ load() }, [weekStart])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><div className="text-2xl font-extrabold">Attendance</div><div className="text-xs text-slate-400">Auto-generated from schedule</div></div>
        <div className="flex items-center gap-2"><input type="date" value={weekStart} onChange={e=>setWeekStart(e.target.value)} className="border p-2 rounded" /></div>
      </div>

      <div className="bg-white border rounded-[20px] p-4">
        {loading? <div>Loading...</div> : rows.length===0? <div className="p-4 text-slate-400">No attendance</div> : (
          <table className="min-w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="p-3">Employee</th><th className="p-3">Date</th><th className="p-3">Scheduled</th><th className="p-3">Punch In</th><th className="p-3">Punch Out</th></tr></thead>
            <tbody>{rows.map(r=> <tr key={r.id} className="border-t"><td className="p-3">{r.employee_id}</td><td className="p-3">{r.work_date}</td><td className="p-3">{r.scheduled_start} - {r.scheduled_end}</td><td className="p-3">{r.punch_in}</td><td className="p-3">{r.punch_out}</td></tr>)}</tbody></table>
        )}
      </div>
    </div>
  )
}
