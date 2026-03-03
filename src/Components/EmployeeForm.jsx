import { useEffect, useState } from 'react'
import departmentsApi from '../api/departmentsApi'
import employeesApi from '../api/employeesApi'

export default function EmployeeForm({ initial = {}, onSaved }) {
  const [form, setForm] = useState({
    first_name: initial.first_name || '',
    last_name: initial.last_name || '',
    email: initial.email || '',
    phone: initial.phone || '',
    department_id: initial.department_id || '',
    role_id: initial.role_id || '',
    hourly_rate: initial.hourly_rate || '',
  })
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    departmentsApi.listDepartments().then(r => setDepartments(r.data.departments || [])).catch(()=>{})
  }, [])

  const submit = async () => {
    try {
      if (initial.id) {
        await employeesApi.updateEmployee(initial.id, form)
      } else {
        await employeesApi.createEmployee(form)
      }
      onSaved && onSaved()
    } catch (e) {
      alert(e?.response?.data?.message || 'Error')
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input value={form.first_name} onChange={e=>setForm({...form, first_name:e.target.value})} className="border p-2 rounded" placeholder="First name" />
        <input value={form.last_name} onChange={e=>setForm({...form, last_name:e.target.value})} className="border p-2 rounded" placeholder="Last name" />
        <input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="border p-2 rounded" placeholder="Email" />
        <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="border p-2 rounded" placeholder="Phone" />
        <select value={form.department_id} onChange={e=>setForm({...form, department_id:e.target.value})} className="border p-2 rounded">
          <option value="">None</option>
          {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={form.role_id} onChange={e=>setForm({...form, role_id:e.target.value})} className="border p-2 rounded">
          <option value="">Select role</option>
          <option value="1">Owner</option>
          <option value="2">Admin</option>
          <option value="3">Manager</option>
          <option value="4">Technician</option>
          <option value="5">ServiceAdvisor</option>
        </select>
        <input value={form.hourly_rate} onChange={e=>setForm({...form, hourly_rate:e.target.value})} className="border p-2 rounded" placeholder="Hourly rate" />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={submit} className="px-4 py-2 rounded-xl bg-cyan-600 text-white">Save</button>
      </div>
    </div>
  )
}
