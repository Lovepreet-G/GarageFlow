import { Link, useLocation, useNavigate } from "react-router-dom"
import logoHalf from "../assets/logo_half.png"

const navItems = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/about", label: "About" },
  { to: "/pricing", label: "Pricing" },
]

export default function MarketingShell({ children }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
            aria-label="GarageFlow Home"
          >
            <img src={logoHalf} alt="GarageFlow" className="h-12 w-12 object-contain" />

            <div className="leading-tight text-left">
              <div className="text-lg font-extrabold italic tracking-tight">
                Garage<span className="text-sky-500">Flow</span>
              </div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                All Services In One Place
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1 md:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={[
                    "rounded-xl px-4 py-2 text-sm font-semibold transition",
                    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Register
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 pb-3 md:hidden sm:px-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600",
                ].join(" ")}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-semibold text-slate-700">GarageFlow</div>
            <div className="mt-1">Auto shop operations, organized in one clean system.</div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link to="/how-it-works" className="hover:text-slate-900">
              How It Works
            </Link>
            <Link to="/about" className="hover:text-slate-900">
              About
            </Link>
            <Link to="/pricing" className="hover:text-slate-900">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
