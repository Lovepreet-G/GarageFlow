import { useNavigate } from "react-router-dom"
import logoHalf from "../assets/logo_half.png"

function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-900">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
            aria-label="GarageFlow Home"
          >
           
            {/* <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm"> */}
              <img src={logoHalf} alt="GarageFlow" className="h-12 w-12 object-contain" />
            {/* </div> */}

            <div className="leading-tight">
              <div className="font-extrabold italic text-lg tracking-tight">
                Garage<span className="text-sky-500">Flow</span>
              </div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Precision Management System
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-xl border bg-white hover:bg-slate-50 text-sm font-semibold"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold shadow-sm"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-20 -left-28 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="absolute -top-10 -right-28 h-80 w-80 rounded-full bg-indigo-200/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-72 w-[80vw] rounded-full bg-slate-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Built for modern auto shops
              </div>

              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold italic tracking-tight leading-[1.05]">
                Run your shop with{" "}
                <span className="text-slate-900">seamless</span>{" "}
                <span className="text-sky-500">invoices</span> and{" "}
                <span className="text-slate-900">customer</span> workflows.
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl">
                GarageFlow helps you create invoices fast, manage customers & vehicles,
                track payment status, send overdue reminders, and protect your data with
                weekly backups — all in one clean system.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/register")}
                  className="px-5 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-sm"
                >
                  Create Your Shop Account
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="px-5 py-3 rounded-2xl border bg-white hover:bg-slate-50 font-semibold"
                >
                  I Already Have an Account
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-white border border-slate-200 rounded-2xl p-3">
                  <div className="font-bold">Fast</div>
                  <div className="text-slate-500 text-xs mt-1">Invoice creation</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-3">
                  <div className="font-bold">Smart</div>
                  <div className="text-slate-500 text-xs mt-1">Overdue tracking</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-3 col-span-2 sm:col-span-1">
                  <div className="font-bold">Safe</div>
                  <div className="text-slate-500 text-xs mt-1">Weekly backups</div>
                </div>
              </div>
            </div>

            {/* Hero image / illustration */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-slate-900/10 to-sky-500/10 blur-xl" />
              <div className="relative bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    GarageFlow Preview
                  </div>
                  <div className="flex gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <IconInvoice />
                      <div className="font-bold italic">Seamless Invoice</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      Create, print, and download invoices with clean formatting.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <IconUsers />
                      <div className="font-bold italic">Customer & Vehicles</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      Store customer details and vehicle profiles for repeat visits.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <IconBell />
                      <div className="font-bold italic">Overdue Reminders</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      Track Approved/Overdue status and follow up faster.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <IconShield />
                      <div className="font-bold italic">Weekly Backups</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      Protect invoices & records with scheduled backups.
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm uppercase tracking-[0.22em] text-white/70">
                        Quick Win
                      </div>
                      <div className="mt-1 text-xl font-extrabold italic">
                        From service entry to invoice — in minutes.
                      </div>
                      <div className="mt-2 text-sm text-white/80">
                        Stay organized, reduce missed payments, and look professional.
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <IconBolt />
                    </div>
                  </div>
                </div>

                {/* Small “image” strip (SVG) */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                  <MiniIllustration />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold italic tracking-tight">
              Features that keep your shop in{" "}
              <span className="text-sky-500">flow</span>.
            </h2>
            <p className="mt-2 text-slate-600 max-w-2xl">
              Everything you need to run day-to-day operations without messy spreadsheets.
            </p>
          </div>

          <button
            onClick={() => navigate("/register")}
            className="px-5 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold w-fit"
          >
            Get Started
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<IconInvoice />}
            title="Seamless invoice creation"
            desc="Generate professional invoices, print, and download PDFs."
          />
          <FeatureCard
            icon={<IconUsers />}
            title="Customer management"
            desc="Save customers, link vehicles, and speed up repeat service."
          />
          <FeatureCard
            icon={<IconBell />}
            title="Overdue invoice reminder"
            desc="Keep track of Approved/Overdue invoices and follow up quickly."
          />
          <FeatureCard
            icon={<IconShield />}
            title="Weekly backups"
            desc="Invoices and data are protected with routine scheduled backups."
          />
          <FeatureCard
            icon={<IconSearch />}
            title="Fast search & filters"
            desc="Find invoices by customer, VIN, date range, or serial."
          />
          <FeatureCard
            icon={<IconChart />}
            title="Clear status oversight"
            desc="Draft, Paid, and Unpaid workflows built for shop operations."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <div className="relative overflow-hidden rounded-[32px] bg-slate-900 text-white p-8 sm:p-10">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-white/70">
                GarageFlow
              </div>
              <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold italic leading-tight">
                Ready to modernize your shop workflow?
              </h3>
              <p className="mt-3 text-white/80">
                Create your account and start managing invoices and customers immediately.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
              <button
                onClick={() => navigate("/register")}
                className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-semibold hover:bg-slate-100"
              >
                Register
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-3 rounded-2xl border border-white/25 bg-white/10 hover:bg-white/15 font-semibold"
              >
                Login
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} GarageFlow • Precision Management Systems
        </div>
      </section>
    </div>
  )
}

/* ---------- Small UI helpers ---------- */

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <div className="font-extrabold italic tracking-tight">{title}</div>
      </div>
      <div className="mt-3 text-sm text-slate-600">{desc}</div>
    </div>
  )
}

function MiniIllustration() {
  return (
    <svg viewBox="0 0 800 180" className="w-full h-auto">
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.08" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="800" height="180" rx="22" fill="url(#g1)" />
      {/* simple invoice card */}
      <rect x="36" y="30" width="240" height="120" rx="16" fill="white" stroke="#E2E8F0" />
      <rect x="58" y="54" width="120" height="10" rx="5" fill="#CBD5E1" />
      <rect x="58" y="74" width="180" height="10" rx="5" fill="#E2E8F0" />
      <rect x="58" y="94" width="160" height="10" rx="5" fill="#E2E8F0" />
      <rect x="58" y="118" width="90" height="18" rx="9" fill="#0F172A" opacity="0.9" />

      {/* flow arrows */}
      <path
        d="M310 90 C 350 90, 350 90, 390 90"
        fill="none"
        stroke="#38BDF8"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M390 90 l-16 -10 v20 z"
        fill="#38BDF8"
      />

      {/* customer card */}
      <rect x="420" y="30" width="340" height="120" rx="16" fill="white" stroke="#E2E8F0" />
      <circle cx="460" cy="78" r="22" fill="#0F172A" opacity="0.9" />
      <rect x="500" y="58" width="180" height="12" rx="6" fill="#CBD5E1" />
      <rect x="500" y="80" width="240" height="10" rx="5" fill="#E2E8F0" />
      <rect x="500" y="100" width="220" height="10" rx="5" fill="#E2E8F0" />
      <rect x="500" y="122" width="110" height="18" rx="9" fill="#38BDF8" opacity="0.9" />
    </svg>
  )
}

/* ---------- Icons (inline SVG, no extra libs) ---------- */
function IconInvoice() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M22 21v-2a4 4 0 0 0-3-3.87"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 15v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 15v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 15v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function IconBolt() {
  return (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none">
      <path
        d="M13 2L3 14h7l-1 8 10-12h-7l1-8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Landing
