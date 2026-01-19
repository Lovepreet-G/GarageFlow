import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './Components/Header'
import Footer from './Components/Footer'
import Sidebar from './Components/Sidebar'
import ProtectedRoute from "./Components/ProtectedRoute"

import Login from './Pages/Login'
import Register from './Pages/Register'
import Home from './Pages/Home'
import Invoices from './Pages/Invoices'
import Customers from './Pages/Customers'
import CreateInvoice from './Pages/CreateInvoice'
import InvoiceView from "./pages/InvoiceView"

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
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <Invoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute>
                  <InvoiceView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/create-invoice"
              element={
                <ProtectedRoute>
                  <CreateInvoice />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>

      {!noLayout && <Footer />}
    </>
  )
}

export default App
