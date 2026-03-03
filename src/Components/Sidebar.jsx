import { NavLink, useNavigate } from "react-router-dom"
import { useState } from "react"

function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const [openManage, setOpenManage] = useState(false)
  const [openSchedule, setOpenSchedule] = useState(false)

  const linkClass = ({ isActive }) =>
    [
      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold",
      isActive ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-100",
    ].join(" ")

  const goCreate = () => {
    onClose?.()
    navigate("/create-invoice")
  }

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />

      <aside
        className={[
          "fixed top-16 left-0 z-50 h-[calc(100vh-64px)] w-64 bg-white border-r",
          "p-4 flex flex-col",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-200",
        ].join(" ")}
      >
        {/* ✅ Scrollable nav */}
        <nav className="space-y-2 overflow-y-auto flex-1 pr-1">
          <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
            <span>▦</span> <span>DASHBOARD</span>
          </NavLink>

          <NavLink to="/invoices" className={linkClass} onClick={onClose}>
            <span>🧾</span> <span>INVOICES</span>
          </NavLink>

          <NavLink to="/customers" className={linkClass} onClick={onClose}>
            <span>👥</span> <span>CUSTOMERS</span>
          </NavLink>

          <NavLink to="/profile" className={linkClass} onClick={onClose}>
            <span>👤</span> <span>PROFILE</span>
          </NavLink>

          <div className="border-t pt-3">
            <button
              type="button"
              onClick={() => setOpenManage((s) => !s)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              <span>👥</span>
              <span>EMPLOYEE MANAGEMENT</span>
              <span className="ml-auto">▾</span>
            </button>

            <div className={["mt-2 space-y-1", openManage ? "block" : "hidden"].join(" ")}>
              {/* ✅ end fixes highlight bug */}
              <NavLink to="/employees" end className={linkClass} onClick={onClose}>
                <span>•</span> <span>Employees</span>
              </NavLink>

              <NavLink to="/employees/new" className={linkClass} onClick={onClose}>
                <span>•</span> <span>Add Employee</span>
              </NavLink>

              <NavLink to="/departments" className={linkClass} onClick={onClose}>
                <span>•</span> <span>Departments</span>
              </NavLink>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => setOpenSchedule((s) => !s)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              <span>📅</span>
              <span>SCHEDULE</span>
              <span className="ml-auto">▾</span>
            </button>

            <div className={["mt-2 space-y-1", openSchedule ? "block" : "hidden"].join(" ")}>
              <NavLink to="/schedule/create" className={linkClass} onClick={onClose}>
                <span>•</span> <span>Create Schedule</span>
              </NavLink>
              <NavLink to="/schedule" className={linkClass} onClick={onClose}>
                <span>•</span> <span>View Schedule</span>
              </NavLink>
              <NavLink to="/attendance" className={linkClass} onClick={onClose}>
                <span>•</span> <span>Attendance</span>
              </NavLink>
            </div>
          </div>
        </nav>

        <button
          type="button"
          onClick={goCreate}
          className="w-full mt-4 px-4 py-3 rounded-2xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow"
        >
          CREATE +
        </button>
      </aside>
    </>
  )
}

export default Sidebar