import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import logoHalf from "../assets/logo_half.png"

function toTitleCase(str = "") {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function Header({ onMenuClick, sidebarOpen }) {
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
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-white">
        <div className="flex h-full items-center justify-between gap-3 px-4">
          <div className="flex min-w-[120px] items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              ≡
            </button>

            <div className="flex items-center gap-2">
              <img src={logoHalf} alt="GarageFlow" className="h-9 w-9 object-contain" />
              <div className="hidden font-semibold tracking-wide sm:block">
                GARAGE<span className="text-cyan-600">FLOW</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="group flex-1 text-center"
            title="Open Profile"
          >
            <div className="text-sm font-semibold tracking-wide group-hover:underline md:text-base">
              {shopName}
            </div>
            <div className="text-[11px] text-slate-500">
              ACTIVE <span className="font-semibold text-cyan-600">FLOW</span>
            </div>
          </button>

          <div className="flex min-w-[120px] justify-end">
            <button
              onClick={() => setShowLogout(true)}
              className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      {showLogout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border bg-white p-6">
            <div className="text-lg font-bold">Confirm logout</div>
            <div className="mt-1 text-sm text-slate-600">Are you sure you want to log out?</div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowLogout(false)}
                className="rounded-lg border px-4 py-2 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-red-700"
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
