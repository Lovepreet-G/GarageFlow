import { Routes, Route, useLocation } from "react-router-dom"
import { useState } from "react"

import Header from "./Components/Header"
import Footer from "./Components/Footer"
import Sidebar from "./Components/Sidebar"
import ProtectedRoute from "./Components/ProtectedRoute"

import Login from "./Pages/Login"
import Register from "./Pages/Register"
import Home from "./Pages/Home"
import Invoices from "./Pages/Invoices"
import Customers from "./Pages/Customers"
import CreateInvoice from "./Pages/CreateInvoice"
import InvoiceView from "./Pages/InvoiceView"
import Profile from "./Pages/Profile"
import ResetPassword from "./Pages/ResetPassword"
import Landing from "./Pages/Landing"

function App() {
  const location = useLocation()
  const noLayout = ["/login", "/register", "/reset-password", "/"].includes(location.pathname)

  const [sidebarOpen, setSidebarOpen] = useState(false)

 // ✅ AUTH PAGES: no header/footer/sidebar, no flex wrapper
  if (noLayout) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Landing />} />
      </Routes>
    )
  }


  return (
    <>
      {!noLayout && (
        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />
      )}

      <div className="min-h-screen bg-slate-50">
        {!noLayout && (
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <main
          className={[
            "min-h-screen",
            noLayout ? "" : "pt-16 lg:pl-64", // header height + sidebar desktop width
          ].join(" ")}
          onClick={() => sidebarOpen && setSidebarOpen(false)}
        >
          <div className={noLayout ? "" : "p-4 sm:p-6"}>
            <Routes>
              {/* Public */}
              {/* <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} /> */}
              
              {/* Protected */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
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
          </div>
        </main>

        {!noLayout && <Footer />}
      </div>
    </>
  )
}

export default App
