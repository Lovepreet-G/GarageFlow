import { useState } from 'react'

export default function ScheduleShiftModal({ open, onClose, date, employee, existing, onSave, onDelete }){
  const [start, setStart] = useState(existing?.start_time || '')
  const [end, setEnd] = useState(existing?.end_time || '')
  const [breakStart, setBreakStart] = useState(existing?.break_start || '')
  const [breakEnd, setBreakEnd] = useState(existing?.break_end || '')
  const [notes, setNotes] = useState(existing?.notes || '')

  if(!open) return null

  const save = ()=>{
    if(!start || !end) return alert('Start and end required')
    if(end <= start) return alert('End must be after start')
    onSave({ employee_id: employee.id, work_date: date, start_time: start, end_time: end, break_start: breakStart || null, break_end: breakEnd || null, notes })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <h3 className="text-lg font-bold">Shift — {employee.first_name} {employee.last_name} — {date}</h3>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs">Start</label>
            <input type="time" value={start} onChange={e=>setStart(e.target.value)} className="border p-2 rounded w-full" />
          </div>
          <div>
            <label className="text-xs">End</label>
            <input type="time" value={end} onChange={e=>setEnd(e.target.value)} className="border p-2 rounded w-full" />
          </div>
          <div>
            <label className="text-xs">Break start</label>
            <input type="time" value={breakStart} onChange={e=>setBreakStart(e.target.value)} className="border p-2 rounded w-full" />
          </div>
          <div>
            <label className="text-xs">Break end</label>
            <input type="time" value={breakEnd} onChange={e=>setBreakEnd(e.target.value)} className="border p-2 rounded w-full" />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs">Notes</label>
          <input value={notes} onChange={e=>setNotes(e.target.value)} className="border p-2 rounded w-full" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {existing && <button onClick={()=>onDelete(existing.id)} className="px-3 py-2 rounded-xl border">Delete</button>}
          <button onClick={onClose} className="px-3 py-2 rounded-xl border">Cancel</button>
          <button onClick={save} className="px-3 py-2 rounded-xl bg-cyan-600 text-white">Save</button>
        </div>
      </div>
    </div>
  )
}
