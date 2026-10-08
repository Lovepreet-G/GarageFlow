import MarketingShell from "../Components/MarketingShell"

function AboutCard({ title, text }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-lg font-extrabold italic text-slate-900">{title}</div>
      <div className="mt-3 text-sm leading-6 text-slate-600">{text}</div>
    </div>
  )
}

export default function About() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            About GarageFlow
          </div>
          <h1 className="mt-4 text-4xl font-extrabold italic tracking-tight sm:text-5xl">
            Built for auto shops that want <span className="text-sky-500">clarity</span>, not clutter.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            GarageFlow is designed to bring invoicing, customer records, employee management,
            scheduling, attendance, and pay data into one connected workspace.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AboutCard
            title="Why we built it"
            text="Most shops juggle paper notes, spreadsheets, reminders, and disconnected tools. GarageFlow brings those moving parts together so work is easier to track and easier to trust."
          />
          <AboutCard
            title="What it solves"
            text="It helps shops run daily operations faster: create invoices, manage customer and vehicle history, organize staff, build schedules, and keep payroll and attendance aligned."
          />
          <AboutCard
            title="How it feels"
            text="Clean, practical, and built around real shop workflows. The goal is simple: less chasing, less duplication, and a smoother path from service to payment."
          />
        </div>
      </section>
    </MarketingShell>
  )
}
