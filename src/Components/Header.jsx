import { useNavigate } from "react-router-dom"

function Header() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("shop")
    navigate("/login")
  }

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        {/* logo later */}
        <div className="font-semibold">GarageFlow</div>
      </div>

      <div className="text-sm text-slate-500">
        Powered by GarageFlow
      </div>

      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded bg-slate-900 text-white"
      >
        Logout
      </button>
    </header>
  )
}

export default Header
