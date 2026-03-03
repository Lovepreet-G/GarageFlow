import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import employeesApi from '../api/employeesApi'
import EmployeeForm from '../components/EmployeeForm'
import ConfirmModal from '../components/ConfirmModal'

export default function EmployeeProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    employeesApi
      .getEmployee(id)
      .then(r => {
        setData(r.data.employee)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const remove = async () => {
    try {
      await employeesApi.deleteEmployee(id)
      navigate('/employees')
    } catch (e) {
      alert('Error')
    }
  }

  if (loading) return <div>Loading...</div>
  if (!data) return <div>Employee not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold">
            {data.first_name} {data.last_name}
          </div>
          <div className="text-xs text-slate-400">Employee profile</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="px-3 py-2 rounded-xl border">
            Edit
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            className="px-3 py-2 rounded-xl bg-rose-600 text-white"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[20px] p-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <strong>Email</strong>
            <div className="text-slate-600">{data.email}</div>
          </div>

          <div>
            <strong>Phone</strong>
            <div className="text-slate-600">{data.mobile || data.phone}</div>
          </div>

          {/* ✅ NEW: SIN (masked) */}
          <div>
            <strong>SIN</strong>
            <div className="text-slate-600">
              {data.sin ? `***-***-${String(data.sin).slice(-3)}` : ''}
            </div>
          </div>

          <div>
            <strong>Role</strong>
            <div className="text-slate-600">{data.job_type || data.role_id}</div>
          </div>

          <div>
            <strong>Hourly rate</strong>
            <div className="text-slate-600">{data.hourly_rate || ''}</div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="bg-white border rounded-[20px] p-6">
          <h4 className="font-bold mb-2">Edit</h4>
          <EmployeeForm
            initial={data}
            onSaved={() => {
              setEditing(false)
              employeesApi.getEmployee(id).then(r => setData(r.data.employee))
            }}
          />
        </div>
      )}

      {confirmOpen && (
        <ConfirmModal
          title="Remove employee"
          message="Are you sure you want to remove this employee?"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={remove}
        />
      )}
    </div>
  )
}