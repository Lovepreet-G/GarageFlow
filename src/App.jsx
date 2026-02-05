import { Routes, Route, Outlet } from "react-router-dom"
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
import NotFound from "./Pages/NotFound"

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="min-h-screen bg-slate-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          className="min-h-screen pt-16 lg:pl-64"
          onClick={() => sidebarOpen && setSidebarOpen(false)}
        >
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public (NO layout) */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected (WITH layout) */}
      <Route element={<AppLayout />}>
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
      </Route>

      {/* 404 (NO layout) */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}