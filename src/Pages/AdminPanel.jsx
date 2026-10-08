import { useEffect, useMemo, useState } from "react"

import ConfirmModal from "../Components/ConfirmModal"
import adminApi from "../api/adminApi"

function readAdminUser() {
  try {
    return JSON.parse(localStorage.getItem("admin_user") || "null")
  } catch {
    return null
  }
}

function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-CA")
}

function badgeClass(kind) {
  if (kind === "pro" || kind === "active" || kind === "lifetime") return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (kind === "trialing" || kind === "trial") return "bg-amber-50 text-amber-700 border-amber-200"
  if (kind === "starter") return "bg-slate-100 text-slate-700 border-slate-200"
  if (kind === "past_due" || kind === "canceled") return "bg-rose-50 text-rose-700 border-rose-200"
  return "bg-slate-100 text-slate-700 border-slate-200"
}

function StatCard({ label, value, tone = "slate" }) {
  const toneClass =
    tone === "emerald"
      ? "from-emerald-500/15 to-emerald-500/5 border-emerald-100"
      : tone === "amber"
        ? "from-amber-500/15 to-amber-500/5 border-amber-100"
        : tone === "rose"
          ? "from-rose-500/15 to-rose-500/5 border-rose-100"
          : "from-slate-500/10 to-slate-500/5 border-slate-200"

  return (
    <div className={`rounded-[28px] border bg-gradient-to-br ${toneClass} p-5`}>
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</div>
    </div>
  )
}

export default function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [shops, setShops] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("")
  const [actionKey, setActionKey] = useState("")
  const [error, setError] = useState("")
  const [confirmAction, setConfirmAction] = useState(null)
  const [lifetimeTarget, setLifetimeTarget] = useState(null)
  const [lifetimeReason, setLifetimeReason] = useState("")

  const adminUser = useMemo(() => readAdminUser(), [])

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const res = await adminApi.getStats()
      setStats(res.data)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin stats.")
    } finally {
      setStatsLoading(false)
    }
  }

  const loadShops = async (nextQuery = query, nextFilter = filter) => {
    setLoading(true)
    try {
      const res = await adminApi.getShops({
        q: nextQuery,
        filter: nextFilter,
      })
      setShops(res.data.shops || [])
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load shops.")
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await adminApi.getLogs()
      setLogs(res.data.logs || [])
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin logs.")
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    loadShops("", "")
    loadLogs()
  }, [])

  const runAndRefresh = async (key, task) => {
    try {
      setError("")
      setActionKey(key)
      await task()
      await Promise.all([loadStats(), loadShops(query, filter), loadLogs()])
    } catch (err) {
      setError(err.response?.data?.message || "Admin action failed.")
    } finally {
      setActionKey("")
      setConfirmAction(null)
      setLifetimeTarget(null)
      setLifetimeReason("")
    }
  }

  const onSearchSubmit = async (event) => {
    event.preventDefault()
    setQuery(search.trim())
    await loadShops(search.trim(), filter)
  }

  const onFilterChange = async (value) => {
    setFilter(value)
    await loadShops(query, value)
  }

  const signOut = () => {
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_user")
    window.location.href = "/admin/login"
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                GarageFlow Super Admin
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                Subscription command center
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Review every shop, control plan access, protect lifetime decisions from Stripe
                syncs, and keep a stable view of trials and active subscriptions.
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:items-end">
              <div>
                Signed in as <span className="font-semibold text-slate-900">{adminUser?.email || "Admin"}</span>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Shops" value={statsLoading ? "..." : stats?.total_shops ?? 0} />
          <StatCard label="Active Subscriptions" value={statsLoading ? "..." : stats?.active_subscriptions ?? 0} tone="emerald" />
          <StatCard label="Trial Users" value={statsLoading ? "..." : stats?.trial_users ?? 0} tone="amber" />
          <StatCard label="Lifetime Users" value={statsLoading ? "..." : stats?.lifetime_users ?? 0} tone="emerald" />
          <StatCard label="Canceled Users" value={statsLoading ? "..." : stats?.canceled_users ?? 0} tone="rose" />
        </div>

        <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Shops</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Search by shop name or owner email, then filter by trial, active, lifetime, or
                billing status.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <form onSubmit={onSearchSubmit} className="flex flex-1 gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search shop or owner email"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Search
                </button>
              </form>

              <select
                value={filter}
                onChange={(e) => onFilterChange(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              >
                <option value="">All statuses</option>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="lifetime">Lifetime</option>
                <option value="canceled">Canceled</option>
                <option value="past_due">Past Due</option>
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-[1180px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
                  <th className="pb-3 pr-4 font-semibold">Shop</th>
                  <th className="pb-3 pr-4 font-semibold">Plan</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 pr-4 font-semibold">Trial Ends</th>
                  <th className="pb-3 pr-4 font-semibold">Current Period</th>
                  <th className="pb-3 pr-4 font-semibold">Employees</th>
                  <th className="pb-3 pr-4 font-semibold">Flags</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">
                      Loading shops...
                    </td>
                  </tr>
                ) : shops.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">
                      No shops matched this view.
                    </td>
                  </tr>
                ) : (
                  shops.map((shop) => {
                    const rowKey = String(shop.shop_id)
                    return (
                      <tr key={shop.shop_id} className="border-b border-slate-100 align-top">
                        <td className="py-4 pr-4">
                          <div className="font-semibold text-slate-900">{shop.shop_name}</div>
                          <div className="mt-1 text-xs text-slate-500">{shop.owner_email}</div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass(shop.plan)}`}>
                              {(shop.plan || "none").toUpperCase()}
                            </span>
                            {shop.base_plan && shop.base_plan !== shop.plan ? (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                                Stripe: {shop.base_plan.toUpperCase()}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass(shop.is_lifetime ? "lifetime" : shop.status)}`}>
                            {shop.is_lifetime ? "LIFETIME" : (shop.status || "unknown").toUpperCase()}
                          </span>
                          {shop.trial_days_left > 0 ? (
                            <div className="mt-2 text-xs text-amber-700">{shop.trial_days_left} days left</div>
                          ) : null}
                        </td>
                        <td className="py-4 pr-4 text-slate-700">{formatDate(shop.trial_end)}</td>
                        <td className="py-4 pr-4 text-slate-700">{formatDate(shop.current_period_end)}</td>
                        <td className="py-4 pr-4 text-slate-700">{shop.employee_count}</td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-wrap gap-2">
                            {shop.is_overridden ? (
                              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                Override
                              </span>
                            ) : null}
                            {shop.is_lifetime ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Lifetime
                              </span>
                            ) : null}
                            {!shop.is_overridden && !shop.is_lifetime ? (
                              <span className="text-xs text-slate-400">—</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={actionKey === `starter-${rowKey}`}
                              onClick={() =>
                                runAndRefresh(`starter-${rowKey}`, () =>
                                  adminApi.overridePlan({ shop_id: shop.shop_id, plan: "starter" })
                                )
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionKey === `starter-${rowKey}` ? "Saving..." : "Make Starter"}
                            </button>
                            <button
                              type="button"
                              disabled={actionKey === `pro-${rowKey}`}
                              onClick={() =>
                                runAndRefresh(`pro-${rowKey}`, () =>
                                  adminApi.overridePlan({ shop_id: shop.shop_id, plan: "pro" })
                                )
                              }
                              className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionKey === `pro-${rowKey}` ? "Saving..." : "Make Pro"}
                            </button>
                            <button
                              type="button"
                              disabled={actionKey === `life-${rowKey}`}
                              onClick={() => {
                                setLifetimeTarget(shop)
                                setLifetimeReason("")
                              }}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Give Lifetime
                            </button>
                            {shop.is_overridden ? (
                              <button
                                type="button"
                                disabled={actionKey === `remove-override-${rowKey}`}
                                onClick={() =>
                                  setConfirmAction({
                                    title: "Remove plan override",
                                    message: `Remove the manual plan override for ${shop.shop_name}? Access will fall back to its normal subscription state.`,
                                    onConfirm: () =>
                                      runAndRefresh(`remove-override-${rowKey}`, () =>
                                        adminApi.removeOverride({ shop_id: shop.shop_id })
                                      ),
                                  })
                                }
                                className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Remove Override
                              </button>
                            ) : null}
                            {shop.is_lifetime ? (
                              <button
                                type="button"
                                disabled={actionKey === `remove-life-${rowKey}`}
                                onClick={() =>
                                  setConfirmAction({
                                    title: "Remove lifetime access",
                                    message: `Remove lifetime access for ${shop.shop_name}? Stripe status and any override rules will take effect again.`,
                                    onConfirm: () =>
                                      runAndRefresh(`remove-life-${rowKey}`, () =>
                                        adminApi.removeLifetime({ shop_id: shop.shop_id })
                                      ),
                                  })
                                }
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Remove Lifetime
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Recent admin activity</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Every override and lifetime action is logged so you can track who changed what.
              </p>
            </div>
            <button
              type="button"
              onClick={loadLogs}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Refresh logs
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {logsLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Loading admin logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                No admin actions have been logged yet.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {log.shop_name} · {log.action.replaceAll("_", " ")}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        By {log.admin_email} · {formatDate(log.created_at)}
                      </div>
                      {log.reason ? (
                        <div className="mt-2 text-sm text-slate-600">Reason: {log.reason}</div>
                      ) : null}
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                      #{log.shop_id}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {confirmAction ? (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmAction.onConfirm}
        />
      ) : null}

      {lifetimeTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="text-xl font-black tracking-tight text-slate-900">Grant lifetime access</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              Add a reason for giving lifetime access to <span className="font-semibold text-slate-900">{lifetimeTarget.shop_name}</span>.
            </div>

            <textarea
              value={lifetimeReason}
              onChange={(e) => setLifetimeReason(e.target.value)}
              rows={4}
              placeholder="Example: Beta launch partner"
              className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLifetimeTarget(null)
                  setLifetimeReason("")
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!lifetimeReason.trim() || actionKey === `life-${lifetimeTarget.shop_id}`}
                onClick={() =>
                  runAndRefresh(`life-${lifetimeTarget.shop_id}`, () =>
                    adminApi.setLifetime({
                      shop_id: lifetimeTarget.shop_id,
                      reason: lifetimeReason.trim(),
                    })
                  )
                }
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionKey === `life-${lifetimeTarget.shop_id}` ? "Granting..." : "Grant Lifetime"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
