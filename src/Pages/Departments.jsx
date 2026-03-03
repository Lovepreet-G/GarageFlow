import { useEffect, useState } from 'react'
import departmentsApi from '../api/departmentsApi'
import ConfirmModal from '../components/ConfirmModal'

export default function Departments(){
  const [rows, setRows] = useState([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = async ()=>{
    setLoading(true)
    try{ const r = await departmentsApi.listDepartments(); setRows(r.data.departments || []) }catch(e){}
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  const add = async ()=>{
    if(!name) return alert('Name required')
    try{ await departmentsApi.createDepartment({name, description:desc}); setName(''); setDesc(''); load() }catch(e){ alert('Error') }
  }

  const remove = async (id)=>{
    if(!confirm) { setConfirm(id); return }
    try{ await departmentsApi.deleteDepartment(id); setConfirm(null); load() }catch(e){ alert('Error') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><div className="text-2xl font-extrabold">Departments</div><div className="text-xs text-slate-400">Manage departments</div></div>
      </div>

      <div className="bg-white border rounded-[20px] p-4">
        <div className="grid grid-cols-3 gap-3">
          <input value={name} onChange={e=>setName(e.target.value)} className="border p-2 rounded" placeholder="Name" />
          <input value={desc} onChange={e=>setDesc(e.target.value)} className="border p-2 rounded" placeholder="Description (optional)" />
          <button onClick={add} className="px-4 py-2 rounded-xl bg-cyan-600 text-white">Add</button>
        </div>
      </div>

      <div className="bg-white border rounded-[20px] p-4">
        {loading? <div>Loading...</div> : rows.length===0? <div className="p-4 text-slate-400">No departments</div> : (
          <table className="min-w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="p-3">Name</th><th className="p-3">Description</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody>{rows.map(r=> <tr key={r.id} className="border-t"><td className="p-3 font-semibold">{r.name}</td><td className="p-3 text-slate-600">{r.description}</td><td className="p-3 text-right"><button onClick={()=>remove(r.id)} className="px-3 py-1 rounded-xl bg-rose-600 text-white">Delete</button></td></tr>)}</tbody></table>
        )}
      </div>

      {confirm && <ConfirmModal title="Delete department" message="Are you sure?" onCancel={()=>setConfirm(null)} onConfirm={()=>remove(confirm)} />}
    </div>
  )
}
