import { useNavigate } from "react-router-dom"

function Header() {
  const navigate = useNavigate()
  const shop = JSON.parse(localStorage.getItem("shop") || "null")

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("shop")
    navigate("/login")
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center justify-between px-6 z-50">
      {/* Left: Logo (if uploaded) */}
      <div className="w-32 flex items-center">
        {shop?.logo_url ? (
          <img
            src={shop.logo_url}
            alt="Shop Logo"
            className="h-10 object-contain"
          />
        ) : (
          <div className="text-xs text-slate-400"> </div>
        )}
      </div>

      {/* Center */}
      <div className="text-center leading-tight">
        <div className="text-sm font-semibold lowercase">
          {shop?.shop_name || "shop"}
        </div>
        <div className="text-xs text-slate-500">Powered by GarageFlow</div>
      </div>

      {/* Right */}
      <div className="w-32 flex justify-end">
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default Header
