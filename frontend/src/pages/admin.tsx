import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../app/shared";
import type { AdminUser, Book, Toast } from "../app/shared";

type AdminOrder = {
  id: string;
  userId?: string;
  orderDate?: string;
  totalAmount?: number | string;
  paymentStatus?: string;
  paymentMethod?: string;
  status?: string;
};

function localDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ordersTimelineSeries(orders: AdminOrder[], dayCount: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const keys: string[] = [];
  const bucket = new Map<string, { count: number; revenue: number }>();
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = localDateKey(d);
    keys.push(key);
    bucket.set(key, { count: 0, revenue: 0 });
  }
  for (const o of orders) {
    if (!o.orderDate) continue;
    const od = new Date(o.orderDate);
    if (Number.isNaN(od.getTime())) continue;
    const key = localDateKey(od);
    const cell = bucket.get(key);
    if (!cell) continue;
    cell.count += 1;
    cell.revenue += Number(o.totalAmount || 0);
  }
  return keys.map((key) => {
    const cell = bucket.get(key)!;
    const [, month, day] = key.split("-");
    return { key, label: `${month}/${day}`, count: cell.count, revenue: cell.revenue };
  });
}


function countByLabels<T>(items: T[], labelFn: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const label = labelFn(item) || "—";
    map.set(label, (map.get(label) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function AdminStatIconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function AdminStatIconOrders() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function AdminStatIconRevenue() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function AdminStatIconPending() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function AdminStatTile({
  loading,
  label,
  value,
  hint,
  icon,
}: {
  loading: boolean;
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className={`statTile adminStatTile${loading ? " adminStatTile--loading" : ""}`}>
      <div className="adminStatTileTop">
        <h3>{label}</h3>
        <span className="adminStatIconWrap" aria-hidden>
          {icon}
        </span>
      </div>
      <p className="price">{loading ? <span className="adminSkeletonLine" /> : value}</p>
      <p className="statHint">{hint}</p>
    </div>
  );
}

function HorizontalBarBlock({ title, subtitle, rows }: { title: string; subtitle?: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="dashPanel adminGraphPanel">
      <div className="dashPanelHead adminGraphPanelHead">
        <h3>{title}</h3>
        {subtitle ? <span className="muted">{subtitle}</span> : null}
      </div>
      {rows.length === 0 ? (
        <p className="muted">No data for this chart yet.</p>
      ) : (
        rows.map((r) => (
          <div key={r.label} className="adminHBarRow">
            <span className="adminHBarLabel" title={r.label}>
              {r.label}
            </span>
            <div className="adminHBarTrack" aria-hidden>
              <div className="adminHBarFill" style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
            <span className="adminHBarValue">{r.value}</span>
          </div>
        ))
      )}
    </section>
  );
}

function OrdersPerDayChart({ days }: { days: ReturnType<typeof ordersTimelineSeries> }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const barMaxPx = 118;
  return (
    <section className="dashPanel adminGraphPanel adminGraphPanel--wide">
      <div className="dashPanelHead adminGraphPanelHead">
        <h3>Orders per day</h3>
        <span className="muted">Last {days.length} days (local time)</span>
      </div>
      <div className="adminVBarChart" role="img" aria-label="Order count per day">
        {days.map((d) => {
          const h = d.count === 0 ? 0 : Math.max(6, (d.count / max) * barMaxPx);
          const title = `${d.key}: ${d.count} orders · Rs. ${d.revenue.toFixed(0)} revenue`;
          return (
            <div key={d.key} className="adminVBarWrap" title={title}>
              <div className="adminVBar" style={{ height: `${h}px` }} />
              <span className="adminVBarLab">{d.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AdminPill({ children, tone = "neutral" }: { children: string; tone?: "neutral" | "ok" | "bad" | "warn" }) {
  return <span className={`adminPill adminPill--${tone}`}>{children}</span>;
}

function formatClock(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function moderationTone(status: string): "neutral" | "ok" | "bad" | "warn" {
  const s = status.toUpperCase();
  if (s === "APPROVED") return "ok";
  if (s === "REJECTED") return "bad";
  if (s === "PENDING") return "warn";
  return "neutral";
}

function roleTone(role: string): "neutral" | "ok" | "bad" | "warn" {
  const r = role.toUpperCase();
  if (r === "ADMIN") return "warn";
  if (r === "BUYER") return "ok";
  if (r === "SELLER") return "neutral";
  return "neutral";
}

export function AdminDashboard({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const MODERATION_PAGE_SIZE = 10;
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookFilter, setBookFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [bookSearch, setBookSearch] = useState("");
  const [visibleBookCount, setVisibleBookCount] = useState(MODERATION_PAGE_SIZE);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [usersRes, ordersRes, booksRes] = await Promise.all([api.get("/admin/users"), api.get("/admin/orders"), api.get("/admin/books")]);
      setUsers(usersRes.data);
      setOrders(ordersRes.data);
      setBooks(booksRes.data);
      setError("");
      setLastRefreshed(new Date());
    } catch {
      setError("Admin data could not be loaded. Login with admin account.");
    } finally {
      setLoading(false);
    }
  }
