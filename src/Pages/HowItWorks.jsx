import MarketingShell from "../Components/MarketingShell"

const steps = [
  {
    title: "1. Set up your shop",
    text: "Create your shop account, upload your logo, and configure the business profile you want on invoices and customer communication.",
  },
  {
    title: "2. Add customers and vehicles",
    text: "Save customer details, attach vehicles, and keep service history ready for repeat visits so your team does not start from scratch every time.",
  },
  {
    title: "3. Run daily operations",
    text: "Create invoices, manage employees, build schedules, track attendance, and review weekly actual hours from one connected system.",
  },
  {
    title: "4. Review pay and performance",
    text: "Use payroll and dashboard views to understand worked hours, gross pay, and weekly business movement without bouncing between tools.",
  },
]

export default function HowItWorks() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            How It Works
          </div>
          <h1 className="mt-4 text-4xl font-extrabold italic tracking-tight sm:text-5xl">
            A clean path from <span className="text-sky-500">service</span> to <span className="text-slate-900">payment</span>.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            GarageFlow is built to help your shop move from intake to invoice, from staffing to scheduling,
            and from attendance to pay review without losing context.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {steps.map((step) => (
            <div key={step.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-lg font-extrabold italic text-slate-900">{step.title}</div>
              <div className="mt-3 text-sm leading-6 text-slate-600">{step.text}</div>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  )
}
