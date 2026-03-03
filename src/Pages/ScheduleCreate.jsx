import { useEffect, useMemo, useState } from 'react'
import scheduleApi from '../api/scheduleApi'
import employeesApi from '../api/employeesApi'
import ScheduleGrid from '../components/ScheduleGrid'
import ScheduleShiftModal from '../components/ScheduleShiftModal'

function getMonday(d){ const x=new Date(d); const day=x.getDay(); const diff=(day===0?-6:1)-day; x.setDate(x.getDate()+diff); return x }
function fmt(d){ return new Date(d).toISOString().slice(0,10) }

export default function ScheduleCreate(){
  const [weekStart, setWeekStart] = useState(fmt(getMonday(new Date())))
  const [employees, setEmployees] = useState([])
  const [schedulesMap, setSchedulesMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({open:false, employee:null, date:null, existing:null})

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

  const openCell = (emp, date)=>{
    const existing = schedulesMap[`${emp.id}_${date}`] || null
    setModal({ open:true, employee:emp, date, existing })
  }

  const closeModal = ()=> setModal({ open:false, employee:null, date:null, existing:null })

  const saveShift = async (payload)=>{
    try{
      await scheduleApi.createSchedule(payload)
      await load()
      closeModal()
    }catch(e){ alert(e?.response?.data?.message || 'Error') }
  }

  const deleteShift = async (id)=>{
    try{ await scheduleApi.deleteSchedule(id); await load(); closeModal() }catch(e){ alert('Error') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><div className="text-2xl font-extrabold">Create Schedule</div><div className="text-xs text-slate-400">Weekly scheduling grid</div></div>
        <div className="flex items-center gap-2">
          <input type="date" value={weekStart} onChange={e=>setWeekStart(e.target.value)} className="border p-2 rounded" />
        </div>
      </div>

      <div className="bg-white border rounded-[20px] p-4">
        {loading? <div>Loading...</div> : <ScheduleGrid employees={employees} week={week} schedules={schedulesMap} onCellClick={openCell} />}
      </div>

      <ScheduleShiftModal open={modal.open} onClose={closeModal} date={modal.date} employee={modal.employee||{}} existing={modal.existing} onSave={saveShift} onDelete={deleteShift} />
    </div>
  )
}
