import { NavLink, useNavigate } from "react-router-dom"

function Aside() {
  const navigate = useNavigate()

  const linkClass = ({ isActive }) =>
    [
      "block px-4 py-2 rounded-lg text-sm",
      isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
    ].join(" ")

  return (
    <aside className="fixed top-16 left-0 z-40 w-64 h-[calc(100vh-64px)] bg-white border-r p-4">
      <nav className="space-y-1">
        <NavLink to="/" className={linkClass}>
          Dashboard
        </NavLink>

        <NavLink to="/invoices" className={linkClass}>
          Invoices
        </NavLink>

        <NavLink to="/customers" className={linkClass}>
          Customers
        </NavLink>

        {/* ✅ NEW: Profile */}
        <NavLink to="/profile" className={linkClass}>
          Profile
        </NavLink>

        <button
          type="button"
          onClick={() => navigate("/create-invoice")}
          className="w-full mt-3 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
        >
          Create +
        </button>
      </nav>
    </aside>
  )
}

export default Aside
