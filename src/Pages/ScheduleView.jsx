import { useEffect, useMemo, useState } from 'react'
import scheduleApi from '../api/scheduleApi'
import employeesApi from '../api/employeesApi'
import ScheduleGrid from '../components/ScheduleGrid'

function getMonday(d){ const x=new Date(d); const day=x.getDay(); const diff=(day===0?-6:1)-day; x.setDate(x.getDate()+diff); return x }
function fmt(d){ return new Date(d).toISOString().slice(0,10) }

export default function ScheduleView(){
  const [weekStart, setWeekStart] = useState(fmt(getMonday(new Date())))
  const [employees, setEmployees] = useState([])
  const [schedulesMap, setSchedulesMap] = useState({})
  const [loading, setLoading] = useState(false)

  const week = useMemo(()=>{ const start=new Date(weekStart); const arr=[]; for(let i=0;i<7;i++){ const d=new Date(start); d.setDate(start.getDate()+i); arr.push(d.toISOString().slice(0,10)) } return arr }, [weekStart])

  const load = async ()=>{
    setLoading(true)
    try{
      const [eRes, sRes] = await Promise.all([ employeesApi.listEmployees(), scheduleApi.getSchedules({ weekStart }) ])
      const em = eRes.data.employees || []
      const scheds = sRes.data.schedules || []
      const map = {}
      for(const s of scheds) map[`${s.employee_id}_${s.work_date}`] = s
      setEmployees(em)
      setSchedulesMap(map)
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [weekStart])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><div className="text-2xl font-extrabold">Schedule</div><div className="text-xs text-slate-400">View weekly schedule</div></div>
        <div className="flex items-center gap-2">
          <input type="date" value={weekStart} onChange={e=>setWeekStart(e.target.value)} className="border p-2 rounded" />
        </div>
      </div>

      <div className="bg-white border rounded-[20px] p-4">
        {loading? <div>Loading...</div> : <ScheduleGrid employees={employees} week={week} schedules={schedulesMap} readOnly={true} />}
      </div>
    </div>
  )
}
