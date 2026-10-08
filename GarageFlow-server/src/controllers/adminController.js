import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

import pool from "../config/db.js"
import { getEffectivePlan, getSubscriptionSnapshot } from "../services/subscriptionService.js"
import { validatePlan } from "../services/stripeService.js"

function getAdminSecret() {
  return process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET
}

function parseBoolean(value) {
  return value === true || value === 1 || value === "1"
}

function toIso(value) {
  if (!value) return null
  return new Date(value).toISOString()
}

function startOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function daysLeft(endDate) {
  if (!endDate) return 0
  const today = startOfToday()
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

async function ensureSubscriptionRow(shopId) {
  await pool.query(
    `INSERT INTO subscriptions
      (shop_id, plan, status, created_at, updated_at)
     VALUES
      (?, 'starter', 'canceled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
      updated_at = updated_at`,
    [shopId]
  )
}

async function getShopSubscription(shopId) {
  const [rows] = await pool.query(
    `SELECT s.id AS shop_id, s.shop_name, s.shop_email, sub.*
     FROM shops s
     LEFT JOIN subscriptions sub ON sub.shop_id = s.id
     WHERE s.id = ?
     LIMIT 1`,
    [shopId]
  )
  return rows[0] || null
}

async function writeAdminLog({ adminId, action, shopId, reason = null, metadata = null }) {
  await pool.query(
    `INSERT INTO admin_logs (admin_id, action, shop_id, reason, metadata_json)
     VALUES (?, ?, ?, ?, ?)`,
    [adminId, action, shopId, reason || null, metadata ? JSON.stringify(metadata) : null]
  )
}

function mapShopRow(row) {
  const effectivePlan = getEffectivePlan(row)
  return {
    shop_id: row.shop_id,
    shop_name: row.shop_name,
    owner_email: row.shop_email,
    plan: effectivePlan || row.plan || null,
    base_plan: row.plan || null,
    override_plan: row.override_plan || null,
    status: row.status || null,
    trial_end: toIso(row.trial_end),
    current_period_end: toIso(row.current_period_end),
    is_lifetime: parseBoolean(row.is_lifetime),
    is_overridden: parseBoolean(row.is_overridden),
    employee_count: Number(row.employee_count || 0),
    trial_days_left: row.status === "trialing" ? daysLeft(row.trial_end) : 0,
  }
}

export async function adminLogin(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase()
  const password = String(req.body?.password || "")

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" })
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, email, password_hash, role
       FROM admins
       WHERE email = ?
       LIMIT 1`,
      [email]
    )

    const admin = rows[0]
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" })
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      return res.status(401).json({ message: "Invalid admin credentials" })
    }

    const adminToken = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        token_type: "admin",
      },
      getAdminSecret(),
      { expiresIn: "12h" }
    )

    res.json({
      admin_token: adminToken,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to sign in as admin" })
  }
}

export async function getAdminMe(req, res) {
  res.json({
    admin: {
      id: req.admin.id,
      email: req.admin.email,
      role: req.admin.role,
    },
  })
}

export async function getAdminStats(req, res) {
  try {
    const [[shopCount]] = await pool.query(`SELECT COUNT(*) AS total_shops FROM shops`)
    const [[subscriptionCounts]] = await pool.query(
      `SELECT
         SUM(CASE WHEN status = 'active' AND COALESCE(is_lifetime, 0) = 0 THEN 1 ELSE 0 END) AS active_subscriptions,
         SUM(CASE WHEN status = 'trialing' AND COALESCE(is_lifetime, 0) = 0 AND (trial_end IS NULL OR trial_end > NOW()) THEN 1 ELSE 0 END) AS trial_users,
         SUM(CASE WHEN COALESCE(is_lifetime, 0) = 1 THEN 1 ELSE 0 END) AS lifetime_users,
         SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) AS canceled_users
       FROM subscriptions`
    )

    res.json({
      total_shops: Number(shopCount?.total_shops || 0),
      active_subscriptions: Number(subscriptionCounts?.active_subscriptions || 0),
      trial_users: Number(subscriptionCounts?.trial_users || 0),
      lifetime_users: Number(subscriptionCounts?.lifetime_users || 0),
      canceled_users: Number(subscriptionCounts?.canceled_users || 0),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to load admin stats" })
  }
}

export async function getAdminShops(req, res) {
  const search = String(req.query?.q || "").trim()
  const filter = String(req.query?.filter || "").trim().toLowerCase()
  const like = `%${search}%`

  try {
    const [rows] = await pool.query(
      `SELECT
         s.id AS shop_id,
         s.shop_name,
         s.shop_email,
         sub.plan,
         sub.status,
         sub.trial_end,
         sub.current_period_end,
         sub.is_lifetime,
         sub.is_overridden,
         sub.override_plan,
         COALESCE(emp.employee_count, 0) AS employee_count
       FROM shops s
       LEFT JOIN subscriptions sub ON sub.shop_id = s.id
       LEFT JOIN (
         SELECT shop_id, COUNT(*) AS employee_count
         FROM employees
         WHERE deleted_at IS NULL
         GROUP BY shop_id
       ) emp ON emp.shop_id = s.id
       WHERE
         (? = '' OR s.shop_name LIKE ? OR s.shop_email LIKE ?)
         AND (
           ? = ''
           OR (? = 'trial' AND COALESCE(sub.is_lifetime, 0) = 0 AND sub.status = 'trialing' AND (sub.trial_end IS NULL OR sub.trial_end > NOW()))
           OR (? = 'active' AND COALESCE(sub.is_lifetime, 0) = 0 AND sub.status = 'active')
           OR (? = 'lifetime' AND COALESCE(sub.is_lifetime, 0) = 1)
           OR (? = 'canceled' AND sub.status = 'canceled')
           OR (? = 'past_due' AND sub.status = 'past_due')
         )
       ORDER BY s.id DESC`,
      [search, like, like, filter, filter, filter, filter, filter, filter]
    )

    res.json({
      shops: rows.map(mapShopRow),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to load shops" })
  }
}

export async function getAdminLogs(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
         l.id,
         l.action,
         l.reason,
         l.metadata_json,
         l.created_at,
         l.shop_id,
         a.email AS admin_email,
         s.shop_name
       FROM admin_logs l
       INNER JOIN admins a ON a.id = l.admin_id
       INNER JOIN shops s ON s.id = l.shop_id
       ORDER BY l.created_at DESC
       LIMIT 30`
    )

    res.json({
      logs: rows.map((row) => ({
        id: row.id,
        action: row.action,
        reason: row.reason || null,
        metadata:
          typeof row.metadata_json === "string"
            ? JSON.parse(row.metadata_json)
            : row.metadata_json || null,
        created_at: toIso(row.created_at),
        shop_id: row.shop_id,
        shop_name: row.shop_name,
        admin_email: row.admin_email,
      })),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to load admin audit logs" })
  }
}

export async function overrideShopPlan(req, res) {
  const shopId = Number(req.body?.shop_id)
  const plan = String(req.body?.plan || "").trim().toLowerCase()

  if (!Number.isInteger(shopId) || shopId <= 0) {
    return res.status(400).json({ message: "A valid shop_id is required" })
  }

  if (!validatePlan(plan)) {
    return res.status(400).json({ message: "Invalid override plan" })
  }

  try {
    await ensureSubscriptionRow(shopId)

    const shopSubscription = await getShopSubscription(shopId)
    if (!shopSubscription) {
      return res.status(404).json({ message: "Shop not found" })
    }

    await pool.query(
      `UPDATE subscriptions
       SET is_overridden = 1,
           override_plan = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE shop_id = ?`,
      [plan, shopId]
    )

    await writeAdminLog({
      adminId: req.admin.id,
      action: "override_plan",
      shopId,
      metadata: {
        previous_override_plan: shopSubscription.override_plan || null,
        next_override_plan: plan,
      },
    })

    const snapshot = await getSubscriptionSnapshot(shopId)
    res.json({
      message: `Override applied. ${shopSubscription.shop_name} now has ${plan.toUpperCase()} access.`,
      subscription: snapshot.subscription,
      access: snapshot.access,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to override shop plan" })
  }
}

export async function setLifetimeAccess(req, res) {
  const shopId = Number(req.body?.shop_id)
  const reason = String(req.body?.reason || "").trim()

  if (!Number.isInteger(shopId) || shopId <= 0) {
    return res.status(400).json({ message: "A valid shop_id is required" })
  }

  if (!reason) {
    return res.status(400).json({ message: "A reason is required when granting lifetime access" })
  }

  try {
    await ensureSubscriptionRow(shopId)

    const shopSubscription = await getShopSubscription(shopId)
    if (!shopSubscription) {
      return res.status(404).json({ message: "Shop not found" })
    }

    await pool.query(
      `UPDATE subscriptions
       SET is_lifetime = 1,
           status = 'active',
           current_period_end = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE shop_id = ?`,
      [shopId]
    )

    await writeAdminLog({
      adminId: req.admin.id,
      action: "lifetime_given",
      shopId,
      reason,
      metadata: {
        previous_status: shopSubscription.status || null,
      },
    })

    const snapshot = await getSubscriptionSnapshot(shopId)
    res.json({
      message: `Lifetime access granted to ${shopSubscription.shop_name}.`,
      subscription: snapshot.subscription,
      access: snapshot.access,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to grant lifetime access" })
  }
}

export async function removeOverride(req, res) {
  const shopId = Number(req.body?.shop_id)

  if (!Number.isInteger(shopId) || shopId <= 0) {
    return res.status(400).json({ message: "A valid shop_id is required" })
  }

  try {
    const shopSubscription = await getShopSubscription(shopId)
    if (!shopSubscription) {
      return res.status(404).json({ message: "Shop not found" })
    }

    await pool.query(
      `UPDATE subscriptions
       SET is_overridden = 0,
           override_plan = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE shop_id = ?`,
      [shopId]
    )

    await writeAdminLog({
      adminId: req.admin.id,
      action: "removed_override",
      shopId,
      metadata: {
        previous_override_plan: shopSubscription.override_plan || null,
      },
    })

    const snapshot = await getSubscriptionSnapshot(shopId)
    res.json({
      message: `Plan override removed for ${shopSubscription.shop_name}.`,
      subscription: snapshot.subscription,
      access: snapshot.access,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to remove override" })
  }
}

export async function removeLifetime(req, res) {
  const shopId = Number(req.body?.shop_id)

  if (!Number.isInteger(shopId) || shopId <= 0) {
    return res.status(400).json({ message: "A valid shop_id is required" })
  }

  try {
    const shopSubscription = await getShopSubscription(shopId)
    if (!shopSubscription) {
      return res.status(404).json({ message: "Shop not found" })
    }

    await pool.query(
      `UPDATE subscriptions
       SET is_lifetime = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE shop_id = ?`,
      [shopId]
    )

    await writeAdminLog({
      adminId: req.admin.id,
      action: "removed_lifetime",
      shopId,
      metadata: {
        previous_is_lifetime: parseBoolean(shopSubscription.is_lifetime),
      },
    })

    const snapshot = await getSubscriptionSnapshot(shopId)
    res.json({
      message: `Lifetime access removed for ${shopSubscription.shop_name}.`,
      subscription: snapshot.subscription,
      access: snapshot.access,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to remove lifetime access" })
  }
}
