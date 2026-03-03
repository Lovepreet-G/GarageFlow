import { useNavigate } from 'react-router-dom'
import EmployeeForm from '../components/EmployeeForm'

export default function EmployeesNew(){
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold">Add Employee</div>
        </div>
      </div>

      <div className="bg-white border rounded-[20px] p-6">
        <EmployeeForm onSaved={() => navigate('/employees')} />
      </div>
    </div>
  )
}
