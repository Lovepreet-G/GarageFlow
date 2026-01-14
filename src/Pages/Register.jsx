import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({})

  const handleChange = e => {
    setForm({ ...form, [e.target.placeholder.replace(/ /g, '_').toLowerCase()]: e.target.value })
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (form.email !== form.confirm_email)
      return alert('Emails do not match')

    if (form.password !== form.confirm_password)
      return alert('Passwords do not match')

    try {
      await api.post('/auth/register', {
        shop_name: form.shop_name,
        shop_address: form.shop_address,
        shop_phone: form.phone,
        shop_email: form.email,
        password: form.password,
        tax_id: form.gst_number,
      })

      alert('Account created')
      navigate('/login')
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
      <h1 className="text-3xl font-bold mb-8">GarageFlow</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-full max-w-xl grid grid-cols-2 gap-4">

        <input placeholder="Shop Name" onChange={handleChange} className="border p-2 rounded" />
        <input placeholder="GST Number" onChange={handleChange} className="border p-2 rounded" />
        <input placeholder="Shop Address" onChange={handleChange} className="border p-2 rounded col-span-2" />
        <input placeholder="Phone" onChange={handleChange} className="border p-2 rounded" />
        <input placeholder="Email" onChange={handleChange} className="border p-2 rounded" />
        <input placeholder="Confirm Email" onChange={handleChange} className="border p-2 rounded" />
        <input type="password" placeholder="Password" onChange={handleChange} className="border p-2 rounded" />
        <input type="password" placeholder="Confirm Password" onChange={handleChange} className="border p-2 rounded" />

        <button className="col-span-2 bg-green-600 text-white py-2 rounded">
          Create Account
        </button>

        <p className="col-span-2 text-center text-sm">
          Already registered? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </form>
    </div>
  )
}

export default Register
