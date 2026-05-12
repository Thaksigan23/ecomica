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

  useEffect(() => { load(); }, []);
  const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const pendingBooksCount = books.filter((b) => (b.moderationStatus || "PENDING").toUpperCase() === "PENDING").length;
  const filteredBooks = books.filter((b) => {
    const statusMatch = bookFilter === "ALL" || (b.moderationStatus || "PENDING").toUpperCase() === bookFilter;
    const search = bookSearch.trim().toLowerCase();
    const text = `${b.title || ""} ${b.sellerEmail || ""}`.toLowerCase();
    const searchMatch = !search || text.includes(search);
    return statusMatch && searchMatch;
  });
  const visibleBooks = filteredBooks.slice(0, visibleBookCount);

  useEffect(() => {
    setVisibleBookCount(MODERATION_PAGE_SIZE);
  }, [bookFilter, bookSearch, books.length]);

  async function moderateBook(bookId: string, status: "APPROVED" | "REJECTED" | "PENDING") {
    try {
      await api.patch(`/admin/books/${bookId}/moderation`, { status });
      onToast({ type: "success", text: `Book marked as ${status}.` });
      load();
    } catch {
      onToast({ type: "error", text: "Could not update book moderation status." });
    }
  }

  async function toggleUserBlock(user: AdminUser) {
    try {
      const nextBlocked = !user.blocked;
      await api.patch(`/admin/users/${user.id}/block`, { blocked: nextBlocked });
      onToast({ type: "success", text: nextBlocked ? "User blocked successfully." : "User unblocked successfully." });
      load();
    } catch {
      onToast({ type: "error", text: "Could not update user block status." });
    }
  }

  const timelineDays = useMemo(() => ordersTimelineSeries(orders, 14), [orders]);
  const paymentStatusRows = useMemo(() => countByLabels(orders, (o) => String(o.paymentStatus || "Unknown")), [orders]);
  const paymentMethodRows = useMemo(() => countByLabels(orders, (o) => String(o.paymentMethod || "Unknown")), [orders]);
  const orderStatusRows = useMemo(() => countByLabels(orders, (o) => String(o.status || "Unknown")), [orders]);
  const userRoleRows = useMemo(() => countByLabels(users, (u) => String(u.role || "Unknown")), [users]);
  const moderationRows = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const b of books) {
      const s = (b.moderationStatus || "PENDING").toUpperCase();
      if (s === "APPROVED") approved += 1;
      else if (s === "REJECTED") rejected += 1;
      else pending += 1;
    }
    return [
      { label: "Pending", value: pending },
      { label: "Approved", value: approved },
      { label: "Rejected", value: rejected },
    ];
  }, [books]);

  return (
    <div className="page adminTheme modernDash adminDashPage">
      <header className="dashboardHeader adminDashHeader">
        <div className="adminDashHeaderLead">
          <p className="adminDashEyebrow">Operations</p>
          <h2>Command center</h2>
          <p className="dashSubhead">
            Live overview of accounts, orders, and catalogue health.
            {lastRefreshed && !loading && !error ? (
              <>
                {" "}
                <span className="adminDashUpdated">Refreshed {formatClock(lastRefreshed)}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="dashHeaderActions adminDashHeaderActions">
          <div className="adminSegToggle" role="tablist" aria-label="Dashboard layout">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "table"}
              className={viewMode === "table" ? "is-active" : ""}
              onClick={() => setViewMode("table")}
            >
              Data
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "graph"}
              className={viewMode === "graph" ? "is-active" : ""}
              onClick={() => setViewMode("graph")}
            >
              Insights
            </button>
          </div>
          <button
            type="button"
            className={`secondary adminIconBtn${loading ? " adminIconBtn--spinning" : ""}`}
            onClick={() => void load()}
            disabled={loading}
            title="Refresh data"
            aria-busy={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
          </button>
          <button type="button" className="secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {error ? <div className="adminErrorBanner" role="alert">{error}</div> : null}

      <div className="dashStatGrid adminStatGrid">
        <AdminStatTile
          loading={loading}
          label="Total users"
          value={users.length}
          hint="Registered buyers, sellers & admins"
          icon={<AdminStatIconUsers />}
        />
        <AdminStatTile
          loading={loading}
          label="Total orders"
          value={orders.length}
          hint="Across the marketplace"
          icon={<AdminStatIconOrders />}
        />
        <AdminStatTile
          loading={loading}
          label="Total revenue"
          value={`Rs. ${revenue.toFixed(0)}`}
          hint="Sum of recorded order totals"
          icon={<AdminStatIconRevenue />}
        />
        <AdminStatTile
          loading={loading}
          label="Pending approvals"
          value={pendingBooksCount}
          hint="Listings awaiting review"
          icon={<AdminStatIconPending />}
        />
      </div>

      {viewMode === "graph" && !error && (
        <>
          <p className="dashGraphHint adminGraphHint">
            Visual summaries from the same dataset as Data view. Switch to Data to block users or moderate listings.
          </p>
          <div className="adminChartGrid">
            <OrdersPerDayChart days={timelineDays} />
            <HorizontalBarBlock title="Payment status" subtitle="Order count" rows={paymentStatusRows} />
            <HorizontalBarBlock title="Payment method" subtitle="Order count" rows={paymentMethodRows} />
            <HorizontalBarBlock title="Order status" subtitle="Fulfillment pipeline" rows={orderStatusRows} />
            <HorizontalBarBlock title="User roles" subtitle="Registered accounts" rows={userRoleRows} />
            <HorizontalBarBlock title="Book moderation" subtitle="Catalogue state" rows={moderationRows} />
          </div>
        </>
      )}
