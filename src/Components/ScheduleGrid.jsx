import { useState } from 'react'

export default function ScheduleGrid({ employees = [], week = [], schedules = {}, readOnly=false, onCellClick }){
  // schedules: map by `${employee_id}_${date}` => schedule
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="p-2">Employee</th>{week.map(d=> <th key={d} className="p-2">{d}</th>)}</tr></thead>
        <tbody>
          {employees.map(emp=> (
            <tr key={emp.id} className="border-t">
              <td className="p-2 font-semibold">{emp.first_name} {emp.last_name}</td>
              {week.map(d=>{
                const key = `${emp.id}_${d}`
                const s = schedules[key]
                return (
                  <td key={d} className="p-2">
                    <div className="min-h-[40px]" onClick={()=>!readOnly && onCellClick && onCellClick(emp, d)}>
                      {s? `${s.start_time} - ${s.end_time}` : <span className="text-slate-400">—</span>}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
