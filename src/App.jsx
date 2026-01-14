import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './Components/Header'
import Footer from './Components/Footer'
import Sidebar from './Components/Sidebar'

import Login from './Pages/Login'
import Register from './Pages/Register'
import Home from './Pages/Home'
import Invoices from './Pages/Invoices'
import Customers from './Pages/Customers'
import CreateInvoice from './Pages/CreateInvoice'

function App() {
  const location = useLocation()
  const noLayout = ['/login', '/register'].includes(location.pathname)

  return (
    <>
      {!noLayout && <Header />}

      <div className="flex">
        {!noLayout && <Sidebar />}

        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/create-invoice" element={<CreateInvoice />} />
          </Routes>
        </main>
      </div>

      {!noLayout && <Footer />}
    </>
  )
}

export default App
