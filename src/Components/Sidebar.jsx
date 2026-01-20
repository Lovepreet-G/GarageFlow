import { NavLink } from "react-router-dom"

function Sidebar() {
  const linkClass = ({ isActive }) =>
    [
      "block px-4 py-2 rounded",
      isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
    ].join(" ")

  return (
    <aside className="fixed top-16 left-0 w-64 h-[calc(100vh-64px)] bg-white border-r p-4 z-40">
      <nav className="space-y-2">
        <NavLink to="/" className={linkClass}>
          Dashboard
        </NavLink>

        <NavLink to="/invoices" className={linkClass}>
          Invoices
        </NavLink>

        <NavLink to="/customers" className={linkClass}>
          Customers
        </NavLink>

        <div className="pt-2">
          <NavLink
            to="/create-invoice"
            className={({ isActive }) =>
              [
                "block px-4 py-2 rounded font-semibold text-center",
                isActive
                  ? "bg-green-700 text-white"
                  : "bg-green-600 text-white hover:bg-green-700",
              ].join(" ")
            }
          >
            Create +
          </NavLink>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
