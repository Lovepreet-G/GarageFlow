import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import garageflowLogo from "../assets/garageflow-logo.png"

function toTitleCase(str = "") {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function Header() {
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)

  const shop = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("shop"))
    } catch {
      return null
    }
  }, [])

  const shopName = toTitleCase(shop?.shop_name || "")

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("shop")
    navigate("/login")
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left: GarageFlow logo */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <img
              src={garageflowLogo}
              alt="GarageFlow"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Center: Shop name */}
        <button
        type="button"
        onClick={() => navigate("/profile")}
        className="text-center group"
        title="Open Profile"
        >
        <div className="text-sm md:text-base font-semibold tracking-wide group-hover:underline">
            {shopName || "Shop"}
        </div>
        <div className="text-xs text-slate-500">
            Powered by <span className="font-medium">GarageFlow</span>
        </div>
        </button>
          {/* Right: Logout */}
          <div className="min-w-[200px] flex justify-end">
            <button
              onClick={() => setShowLogout(true)}
              className="px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Logout confirmation modal */}
      {showLogout && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-sm rounded-xl border p-5">
            <div className="text-lg font-bold">Confirm logout</div>
            <div className="text-sm text-slate-600 mt-1">
              Are you sure you want to log out?
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowLogout(false)}
                className="px-4 py-2 rounded border hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
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
