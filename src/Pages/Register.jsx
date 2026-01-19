import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api"

function Register() {
  const navigate = useNavigate()
  const [shopName, setShopName] = useState("")
  const [gst, setGst] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agree, setAgree] = useState(false)

  // ✅ If already logged in, go to home
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) navigate("/")
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!agree) return alert("Please accept terms and conditions")
    if (email !== confirmEmail) return alert("Emails do not match")
    if (password !== confirmPassword) return alert("Passwords do not match")

    try {
      await api.post("/auth/register", {
        shop_name: shopName,
        shop_address: address,
        shop_phone: phone,
        shop_email: email,
        password,
        tax_id: gst,
      })

      alert("Account created. Please login.")
      navigate("/login")
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
      <h1 className="text-3xl font-bold mb-8">GarageFlow</h1>

      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-xl">
        <h2 className="text-xl font-semibold mb-6 text-center">
          Create Shop Account
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input
            className="border p-2 rounded"
            placeholder="Shop Name"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="GST Number"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
          />

          <input
            className="border p-2 rounded col-span-2"
            placeholder="Shop Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Confirm Email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span className="text-sm">I accept the terms and conditions</span>
          </div>

          <button className="col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-700">
            Create Account
          </button>

          <p className="col-span-2 text-center text-sm">
            Already registered?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Register
