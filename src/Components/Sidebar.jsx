import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [openManage, setOpenManage] = useState(false)
  const [openSchedule, setOpenSchedule] = useState(false)

  useEffect(() => {
    const path = location.pathname

    if (path.startsWith("/employees") || path.startsWith("/departments")) {
      setOpenManage(true)
    }

    if (path.startsWith("/schedule") || path.startsWith("/attendance")) {
      setOpenSchedule(true)
    }
  }, [location.pathname])

  const linkClass = ({ isActive }) =>
    [
      "flex items-center rounded-lg px-3 py-2 text-[13px] font-semibold transition",
      isActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100",
    ].join(" ")

  const dropdownBtnClass = (active) =>
    [
      "flex w-full items-center rounded-lg px-3 py-2 text-[13px] font-semibold transition",
      active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100",
    ].join(" ")

  const goCreate = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose?.()
    }
    navigate("/create-invoice")
  }

  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose?.()
    }
  }

  const manageActive =
    location.pathname.startsWith("/employees") || location.pathname.startsWith("/departments")

  const scheduleActive =
    location.pathname.startsWith("/schedule") || location.pathname.startsWith("/attendance")

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-black/35 lg:hidden transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />

      <aside
        className={[
          "fixed top-16 left-0 z-50 flex h-[calc(100vh-64px)] w-64 flex-col border-r bg-white shadow-sm",
          "px-3 py-4 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          <NavLink to="/dashboard" className={linkClass} onClick={handleNavClick}>
            <span>DASHBOARD</span>
          </NavLink>

          <NavLink to="/invoices" className={linkClass} onClick={handleNavClick}>
            <span>INVOICES</span>
          </NavLink>

          <NavLink to="/customers" className={linkClass} onClick={handleNavClick}>
            <span>CUSTOMERS</span>
          </NavLink>

          <NavLink to="/profile" className={linkClass} onClick={handleNavClick}>
            <span>PROFILE</span>
          </NavLink>

          <div className="border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => setOpenManage((state) => !state)}
              className={dropdownBtnClass(manageActive)}
            >
              <span>EMPLOYEE MANAGEMENT</span>
              <span className={`ml-auto text-slate-400 transition-transform ${openManage ? "rotate-180" : ""}`}>
                ^
              </span>
            </button>

            <div className={["mt-1 space-y-1 overflow-hidden", openManage ? "block" : "hidden"].join(" ")}>
              <NavLink to="/employees" end className={linkClass} onClick={handleNavClick}>
                <span>Employees</span>
              </NavLink>

              <NavLink to="/employees/new" className={linkClass} onClick={handleNavClick}>
                <span>Add Employee</span>
              </NavLink>

              <NavLink to="/departments" className={linkClass} onClick={handleNavClick}>
                <span>Departments</span>
              </NavLink>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setOpenSchedule((state) => !state)}
              className={dropdownBtnClass(scheduleActive)}
            >
              <span>SCHEDULE</span>
              <span className={`ml-auto text-slate-400 transition-transform ${openSchedule ? "rotate-180" : ""}`}>
                ^
              </span>
            </button>

            <div className={["mt-1 space-y-1 overflow-hidden", openSchedule ? "block" : "hidden"].join(" ")}>
              <NavLink to="/schedule/create" className={linkClass} onClick={handleNavClick}>
                <span>Create Schedule</span>
              </NavLink>
              <NavLink to="/schedule" end className={linkClass} onClick={handleNavClick}>
                <span>View Schedule</span>
              </NavLink>
              <NavLink to="/schedule/actual-hours" className={linkClass} onClick={handleNavClick}>
                <span>Actual Hours</span>
              </NavLink>
              <NavLink to="/attendance" className={linkClass} onClick={handleNavClick}>
                <span>Attendance</span>
              </NavLink>
            </div>
          </div>
        </nav>

        <button
          type="button"
          onClick={goCreate}
          className="mt-4 w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white shadow hover:bg-cyan-700"
        >
          CREATE +
        </button>
      </aside>
    </>
  )
}

export default Sidebar
