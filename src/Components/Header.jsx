import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import logoHalf from "../assets/logo_half.png"

function toTitleCase(str = "") {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function Header({ onMenuClick }) {
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)

  const shop = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("shop"))
    } catch {
      return null
    }
  }, [])

  const shopName = toTitleCase(shop?.shop_name || "Shop")

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("shop")
    navigate("/login")
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b">
        <div className="h-full px-4 flex items-center justify-between gap-3">
          {/* Left: Hamburger (mobile) + Logo */}
          <div className="flex items-center gap-3 min-w-[120px]">
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-slate-100"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div className="flex items-center gap-2">
              <img src={logoHalf} alt="GarageFlow" className="h-9 w-9 object-contain" />
              <div className="hidden sm:block font-semibold tracking-wide">
                GARAGE<span className="text-cyan-600">FLOW</span>
              </div>
            </div>
          </div>

          {/* Center: Shop name (click -> profile) */}
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="text-center group flex-1"
            title="Open Profile"
          >
            <div className="text-sm md:text-base font-semibold tracking-wide group-hover:underline">
              {shopName}
            </div>
            <div className="text-[11px] text-slate-500">
              ACTIVE <span className="font-semibold text-cyan-600">FLOW</span>
            </div>
          </button>

          {/* Right: Logout */}
          <div className="min-w-[120px] flex justify-end">
            <button
              onClick={() => setShowLogout(true)}
              className="px-4 py-2 rounded-lg border bg-white hover:bg-slate-50 text-sm font-semibold"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      {/* Logout confirmation */}
      {showLogout && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border p-6">
            <div className="text-lg font-bold">Confirm logout</div>
            <div className="text-sm text-slate-600 mt-1">
              Are you sure you want to log out?
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowLogout(false)}
                className="px-4 py-2 rounded-lg border hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
