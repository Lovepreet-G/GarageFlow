import { NavLink, useNavigate } from "react-router-dom"

function Sidebar({ open, onClose }) {
  const navigate = useNavigate()

  const linkClass = ({ isActive }) =>
    [
      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold",
      isActive
        ? "bg-slate-900 text-white shadow"
        : "text-slate-600 hover:bg-slate-100",
    ].join(" ")

  const goCreate = () => {
    onClose?.()
    navigate("/create-invoice")
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={[
          "fixed top-16 left-0 z-50 h-[calc(100vh-64px)] w-64 bg-white border-r",
          "p-4 flex flex-col",
          // desktop always visible
          "lg:translate-x-0",
          // mobile drawer
          open ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-200",
        ].join(" ")}
      >
        <nav className="space-y-2">
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

          <button
            type="button"
            onClick={goCreate}
            className="w-full mt-4 px-4 py-3 rounded-2xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow"
          >
            CREATE +
          </button>
        </nav>

        
      </aside>
    </>
  )
}

export default Sidebar
