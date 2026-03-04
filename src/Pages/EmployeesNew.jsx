import { useNavigate } from "react-router-dom"
import EmployeeForm from "../components/EmployeeForm"

export default function EmployeesNew() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold">Add Employee</div>
          <div className="text-xs text-slate-400">Create a new employee</div>
        </div>
        <button onClick={() => navigate("/employees")} className="px-3 py-2 rounded-xl border">
          Back
        </button>
      </div>

      <div className="bg-white border rounded-[20px] p-6">
        <EmployeeForm onSaved={() => navigate("/employees")} onCancel={() => navigate("/employees")} />
      </div>
    </div>
  )
}