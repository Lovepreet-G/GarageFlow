import { useNavigate } from "react-router-dom"
import MarketingShell from "../Components/MarketingShell"

function LandingFeature({ title, desc, tone = "slate" }) {
  const toneClass =
    tone === "dark"
      ? "bg-slate-900 text-white border-slate-900"
      : tone === "sky"
        ? "bg-sky-50 text-slate-900 border-sky-100"
        : "bg-white text-slate-900 border-slate-200"

  return (
    <div className={`rounded-[28px] border p-5 shadow-sm ${toneClass}`}>
      <div className="text-lg font-extrabold italic">{title}</div>
      <div className={`mt-3 text-sm leading-6 ${tone === "dark" ? "text-white/75" : "text-slate-600"}`}>
        {desc}
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <MarketingShell>
      <section className="relative overflow-hidden">
        <div className="absolute -left-24 -top-16 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                Built for modern garages and repair shops
              </div>

              <h1 className="mt-5 text-4xl font-extrabold italic tracking-tight sm:text-6xl sm:leading-[1.02]">
                All services in one place, from <span className="text-sky-500">invoice</span> to <span className="text-slate-900">pay data</span>.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                GarageFlow brings invoicing, employee management, scheduling, attendance,
                and payroll visibility into one clean system made for real auto shop work.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate("/register")}
                  className="rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Create Your Shop Account
                </button>
                <button
                  onClick={() => navigate("/how-it-works")}
                  className="rounded-2xl border bg-white px-6 py-3 font-semibold hover:bg-slate-50"
                >
                  See How It Works
                </button>
              </div>
            </div>

            <div className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <LandingFeature
                  title="Invoicing"
                  desc="Create invoices, print PDFs, and keep customer and vehicle service records linked."
                  tone="sky"
                />
                <LandingFeature
                  title="Employee Management"
                  desc="Maintain employee profiles, departments, and staff details in one place."
                />
                <LandingFeature
                  title="Scheduling"
                  desc="Create weekly schedules, review actual hours, and keep shift planning organized."
                />
                <LandingFeature
                  title="Pay Data"
                  desc="Review worked hours, payroll summaries, and employee-level pay history clearly."
                  tone="dark"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-extrabold italic tracking-tight sm:text-3xl">
            Built around the daily flow of a <span className="text-sky-500">busy shop</span>.
          </h2>
          <p className="mt-3 text-slate-600">
            Instead of using different tools for each task, GarageFlow keeps the core parts
            of your operation connected and easier to trust.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LandingFeature
            title="Customer + Vehicle Records"
            desc="Keep service history ready for repeat visits and faster intake."
          />
          <LandingFeature
            title="Attendance to Payroll Visibility"
            desc="Move from actual punched hours into pay review with less manual work."
          />
          <LandingFeature
            title="Weekly Dashboards"
            desc="Track business movement, unpaid invoices, and operational status cleanly."
          />
          <LandingFeature
            title="One Shared Workflow"
            desc="Reduce duplication between office work, service records, and staff management."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="rounded-[34px] bg-slate-900 p-8 text-white shadow-sm sm:p-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-white/70">GarageFlow</div>
              <h3 className="mt-2 text-3xl font-extrabold italic sm:text-4xl">
                One place for the work your shop does every day.
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/80 sm:text-base">
                Start with invoicing and records today, then grow into staff scheduling,
                attendance tracking, and payroll visibility as your workflow expands.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
              <button
                onClick={() => navigate("/register")}
                className="rounded-2xl bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100"
              >
                Register
              </button>
              <button
                onClick={() => navigate("/pricing")}
                className="rounded-2xl border border-white/25 bg-white/10 px-6 py-3 font-semibold hover:bg-white/15"
              >
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
