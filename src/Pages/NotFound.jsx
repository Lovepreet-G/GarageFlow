import { useNavigate } from "react-router-dom"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center">
      <h1 className="text-6xl font-extrabold text-slate-900">404</h1>
      <p className="mt-3 text-lg text-slate-600">The page you are looking for does not exist.</p>

      <button
        onClick={() => navigate(-1)}
        className="mt-6 px-6 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
      >
        Go Back
      </button>
    </div>
  )
}