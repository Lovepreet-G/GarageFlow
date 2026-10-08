import { Routes, Route, Outlet } from "react-router-dom"
import { useState } from "react"

import Header from "./Components/Header"
import Footer from "./Components/Footer"
import Sidebar from "./Components/Sidebar"
import ProtectedRoute from "./Components/ProtectedRoute"
import SubscriptionRoute from "./Components/SubscriptionRoute"
import SubscriptionBanner from "./Components/SubscriptionBanner"
import AdminRoute from "./Components/AdminRoute"

import Login from "./Pages/Login"
import Register from "./Pages/Register"
import Home from "./Pages/Home"
import Invoices from "./Pages/Invoices"
import Customers from "./Pages/Customers"
import Employees from "./Pages/Employees"
import EmployeesNew from "./Pages/EmployeesNew"
import EmployeeProfile from "./Pages/EmployeeProfile"
import Departments from "./Pages/Departments"
import ScheduleCreate from "./Pages/ScheduleCreate"
import ScheduleView from "./Pages/ScheduleView"
import ScheduleActualHours from "./Pages/ScheduleActualHours"
import Payroll from "./Pages/Payroll"
import PayrollDashboard from "./Pages/PayrollDashboard"
import PayrollEmployeeHistory from "./Pages/PayrollEmployeeHistory"
import Attendance from "./Pages/Attendance"
import CreateInvoice from "./Pages/CreateInvoice"
import InvoiceView from "./Pages/InvoiceView"
import Profile from "./Pages/Profile"
import ResetPassword from "./Pages/ResetPassword"
import Landing from "./Pages/Landing"
import About from "./Pages/About"
import HowItWorks from "./Pages/HowItWorks"
import Pricing from "./Pages/Pricing"
import NotFound from "./Pages/NotFound"
import AdminLogin from "./Pages/AdminLogin"
import AdminPanel from "./Pages/AdminPanel"

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const handleMainClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024 && sidebarOpen) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      <Header
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen((prev) => !prev)}
      />
      <SubscriptionBanner />

      <div className="min-h-screen bg-slate-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          className={[
            "min-h-screen pt-16 transition-all duration-200",
            sidebarOpen ? "lg:pl-64" : "lg:pl-0",
          ].join(" ")}
          onClick={handleMainClick}
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
      <Route path="/about" element={<About />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        }
      />
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
          path="/employees"
          element={
            <ProtectedRoute>
              <SubscriptionRoute requiredPlan="pro">
                <Employees />
              </SubscriptionRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/new"
          element={<ProtectedRoute><SubscriptionRoute requiredPlan="pro"><EmployeesNew /></SubscriptionRoute></ProtectedRoute>}
        />
        <Route
          path="/employees/:id"
          element={<ProtectedRoute><SubscriptionRoute requiredPlan="pro"><EmployeeProfile /></SubscriptionRoute></ProtectedRoute>}
        />
        <Route
          path="/departments"
          element={<ProtectedRoute><SubscriptionRoute requiredPlan="pro"><Departments /></SubscriptionRoute></ProtectedRoute>}
        />
        <Route
          path="/schedule/create"
          element={<ProtectedRoute><SubscriptionRoute requiredPlan="pro"><ScheduleCreate /></SubscriptionRoute></ProtectedRoute>}
        />
        <Route
          path="/schedule"
          element={<ProtectedRoute><SubscriptionRoute requiredPlan="pro"><ScheduleView /></SubscriptionRoute></ProtectedRoute>}
        />
        <Route
          path="/schedule/actual-hours"
          element={<ProtectedRoute><SubscriptionRoute requiredPlan="pro"><ScheduleActualHours /></SubscriptionRoute></ProtectedRoute>}
        />
        <Route
          path="/attendance"
          element={<ProtectedRoute><SubscriptionRoute requiredPlan="pro"><Attendance /></SubscriptionRoute></ProtectedRoute>}
        />
        <Route
          path="/payroll/dashboard"
          element={<ProtectedRoute><SubscriptionRoute requiredPlan="pro"><PayrollDashboard /></SubscriptionRoute></ProtectedRoute>}
        />
        <Route
          path="/payroll"
          element={<ProtectedRoute><SubscriptionRoute requiredPlan="pro"><Payroll /></SubscriptionRoute></ProtectedRoute>}
        />
        <Route
          path="/payroll/:employeeId"
          element={<ProtectedRoute><SubscriptionRoute requiredPlan="pro"><PayrollEmployeeHistory /></SubscriptionRoute></ProtectedRoute>}
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
