import { useEffect, useState } from "react"
import departmentsApi from "../api/departmentsApi"
import ConfirmModal from "../components/ConfirmModal"

export default function Departments() {
  const [rows, setRows] = useState([])
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [loading, setLoading] = useState(false)

  const [confirm, setConfirm] = useState({ open: false, dept: null })

  const load = async () => {
    setLoading(true)
    try {
      const r = await departmentsApi.listDepartments()
      setRows(r.data.departments || [])
    } catch (e) {
      console.error(e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!name.trim()) return alert("Department name is required")
    try {
      await departmentsApi.createDepartment({ name: name.trim(), description: desc.trim() || null })
      setName("")
      setDesc("")
      await load()
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || "Failed to add department")
    }
  }

  const openDelete = (dept) => setConfirm({ open: true, dept })
  const closeDelete = () => setConfirm({ open: false, dept: null })

  const remove = async () => {
    if (!confirm.dept) return
    try {
      await departmentsApi.deleteDepartment(confirm.dept.id)
      closeDelete()
      await load()
    } catch (e) {
      console.error(e)
      // common case: department in use
      alert(e?.response?.data?.message || "Failed to delete department. If employees are assigned, move them first.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold">Departments</div>
          <div className="text-xs text-slate-400">List, add, and delete departments</div>
        </div>
      </div>

      <div className="bg-white border rounded-[20px] p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded"
            placeholder="Department name"
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="border p-2 rounded"
            placeholder="Description (optional)"
          />
          <button onClick={add} className="px-4 py-2 rounded-xl bg-cyan-600 text-white">
            Add
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[20px] p-4">
        {loading ? (
          <div className="p-4 text-slate-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-slate-400">No departments</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-semibold">{r.name}</td>
                    <td className="p-3 text-slate-600">{r.description || "—"}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openDelete(r)}
                        className="px-3 py-1 rounded-xl bg-rose-600 text-white"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirm.open && (
        <ConfirmModal
          title="Delete department"
          message={`Delete "${confirm.dept?.name}"? If employees are assigned to this department, you may need to move them first.`}
          onCancel={closeDelete}
          onConfirm={remove}
        />
      )}
    </div>
  )
}
