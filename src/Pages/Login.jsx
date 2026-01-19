import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api"

function Login() {
  const navigate = useNavigate()
  const [shop_email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  //If already logged in, go to home
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) navigate("/")
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const res = await api.post("/auth/login", { shop_email, password })

      localStorage.setItem("token", res.data.token)
      localStorage.setItem("shop", JSON.stringify(res.data.shop))

      navigate("/")
    } catch (err) {
      alert(err.response?.data?.message || "Invalid credentials")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
      <h1 className="text-3xl font-bold mb-8">GarageFlow</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={shop_email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Login
        </button>

        <p className="text-center text-sm">
          No account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  )
}

export default Login
