import { useEffect, useState } from "react";
import { api } from "../app/shared";
import type { AdminUser, Book, Toast } from "../app/shared";

export function AdminDashboard({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const MODERATION_PAGE_SIZE = 10;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookFilter, setBookFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [bookSearch, setBookSearch] = useState("");
  const [visibleBookCount, setVisibleBookCount] = useState(MODERATION_PAGE_SIZE);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [usersRes, ordersRes, booksRes] = await Promise.all([api.get("/admin/users"), api.get("/admin/orders"), api.get("/admin/books")]);
      setUsers(usersRes.data);
      setOrders(ordersRes.data);
      setBooks(booksRes.data);
      setError("");
    } catch {
      setError("Admin data could not be loaded. Login with admin account.");
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

  return <div className="page adminTheme modernDash">
    <div className="dashboardHeader">
      <div>
        <h2>Admin dashboard</h2>
        <p className="dashSubhead">Monitor users, revenue, and catalogue quality in one place.</p>
      </div>
      <button className="secondary" onClick={onLogout}>Logout</button>
    </div>
    {error && <p className="errorText">{error}</p>}
    <div className="dashStatGrid">
      <div className="statTile">
        <h3>Total users</h3>
        <p className="price">{users.length}</p>
        <p className="statHint">Registered buyers, sellers &amp; admins</p>
      </div>
      <div className="statTile">
        <h3>Total orders</h3>
        <p className="price">{orders.length}</p>
        <p className="statHint">Across the marketplace</p>
      </div>
      <div className="statTile">
        <h3>Total revenue</h3>
        <p className="price">Rs. {revenue.toFixed(0)}</p>
        <p className="statHint">Sum of recorded order totals</p>
      </div>
      <div className="statTile">
        <h3>Pending approvals</h3>
        <p className="price">{pendingBooksCount}</p>
        <p className="statHint">Seller listings awaiting review</p>
      </div>
    </div>

    <section className="dashPanel">
      <div className="dashPanelHead">
        <h3>Recent orders</h3>
        <span className="muted">Latest {Math.min(10, orders.length)}</span>
      </div>
      {orders.slice(0, 10).map((o) => <div key={o.id} className="listRow">
        <span>{o.userId} · {o.paymentMethod} · {o.paymentStatus}</span>
        <span>Rs. {o.totalAmount}</span>
      </div>)}
      {orders.length === 0 && <p className="muted">No orders yet.</p>}
    </section>

    <section className="dashPanel">
      <div className="dashPanelHead">
        <h3>Users</h3>
        <span className="muted">Showing {Math.min(10, users.length)} of {users.length}</span>
      </div>
      {users.slice(0, 10).map((u) => <div key={u.id} className="listRow">
        <span>{u.name} ({u.email}) · {u.role}</span>
        <div className="row">
          <span className={u.blocked ? "errorText" : "successText"}>{u.blocked ? "Blocked" : "Active"}</span>
          <button className="secondary" onClick={() => toggleUserBlock(u)}>{u.blocked ? "Unblock" : "Block"}</button>
        </div>
      </div>)}
    </section>

    <section className="dashPanel">
      <div className="dashPanelHead">
        <h3>Book moderation</h3>
        <span className="muted">{filteredBooks.length} in current view</span>
      </div>
      <div className="searchCard">
        <input
          value={bookSearch}
          onChange={(e) => setBookSearch(e.target.value)}
          placeholder="Search by book title or seller email"
        />
      </div>
      <div className="row">
        <button className={bookFilter === "ALL" ? "" : "secondary"} onClick={() => setBookFilter("ALL")}>All ({books.length})</button>
        <button className={bookFilter === "PENDING" ? "" : "secondary"} onClick={() => setBookFilter("PENDING")}>
          Pending ({pendingBooksCount})
        </button>
        <button className={bookFilter === "APPROVED" ? "" : "secondary"} onClick={() => setBookFilter("APPROVED")}>
          Approved ({books.filter((b) => (b.moderationStatus || "PENDING").toUpperCase() === "APPROVED").length})
        </button>
        <button className={bookFilter === "REJECTED" ? "" : "secondary"} onClick={() => setBookFilter("REJECTED")}>
          Rejected ({books.filter((b) => (b.moderationStatus || "PENDING").toUpperCase() === "REJECTED").length})
        </button>
      </div>
      {visibleBooks.map((b) => <div key={b.id} className="listRow">
        <span>{b.title} · {b.sellerEmail || "N/A"} · {b.moderationStatus || "PENDING"}</span>
        <div className="row">
          <button className="secondary" onClick={() => moderateBook(b.id, "APPROVED")}>Approve</button>
          <button className="secondary" onClick={() => moderateBook(b.id, "REJECTED")}>Reject</button>
          <button className="secondary" onClick={() => moderateBook(b.id, "PENDING")}>Reset</button>
        </div>
      </div>)}
      {filteredBooks.length === 0 && <p className="muted">No books in this moderation filter.</p>}
      {filteredBooks.length > visibleBooks.length && (
        <div className="row dashPanelActions">
          <button onClick={() => setVisibleBookCount((c) => c + MODERATION_PAGE_SIZE)}>
            Load more ({filteredBooks.length - visibleBooks.length} remaining)
          </button>
        </div>
      )}
    </section>
  </div>;
}
