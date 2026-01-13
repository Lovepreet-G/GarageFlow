import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-xl text-2xl font-semibold">
        GarageFlow is running 🚗
      </div>
    </div>
  )
}

export default App
