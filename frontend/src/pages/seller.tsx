import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SafeImage, api, getErrorMessage } from "../app/shared";
import type { Book, ProfileInfo, SellerAnalytics, Toast } from "../app/shared";
import { PaymentMethodsManager } from "./shared-components";

export function SellerDashboard({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [loadError, setLoadError] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("399");
  const [stock, setStock] = useState("20");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    try {
      const [booksRes, analyticsRes] = await Promise.all([api.get("/seller/books"), api.get("/seller/analytics")]);
      setBooks(booksRes.data);
      setAnalytics(analyticsRes.data);
      setLoadError("");
    } catch (err: any) {
      const msg = getErrorMessage(err, "Could not load seller data.");
      setLoadError(msg);
      onToast({ type: "error", text: msg });
    }
  };
  useEffect(() => { load(); }, []);

  return <div className="page sellerTheme modernDash">
    <div className="dashboardHeader">
      <h2>Seller Dashboard</h2>
      <div className="row">
        <Link to="/seller/profile"><button className="secondary">Profile</button></Link>
        <button className="secondary" onClick={load}>Reload</button>
        <button className="secondary" onClick={onLogout}>Logout</button>
      </div>
    </div>
    {loadError && <p className="errorText">Seller data load failed: {loadError}</p>}
    <div className="landingGrid">
      <div className="productCard">
        <h3>Listed Books</h3>
        <p className="price">{analytics?.bookCount ?? 0}</p>
      </div>
      <div className="productCard">
        <h3>Total Units Sold</h3>
        <p className="price">{analytics?.totalSoldUnits ?? 0}</p>
      </div>
      <div className="productCard">
        <h3>Total Revenue</h3>
        <p className="price">Rs. {Number(analytics?.totalRevenue ?? 0).toFixed(0)}</p>
      </div>
    </div>
    <form className="searchCard sellerCreateForm" onSubmit={async (e) => {
      e.preventDefault();
      const numericPrice = Number(price);
      const numericStock = Number(stock);
      if (!title.trim() || !author.trim() || Number.isNaN(numericPrice) || numericPrice <= 0) {
        onToast({ type: "error", text: "Enter valid title, author and price." });
        return;
      }
      try {
        await api.post("/books", {
          title: title.trim(),
          author: author.trim(),
          price: numericPrice,
          stock: Number.isNaN(numericStock) ? 20 : Math.max(0, numericStock),
          imageUrl: imageUrl.trim(),
          description: description.trim(),
          active: true
        });
        setTitle("");
        setAuthor("");
        setPrice("399");
        setStock("20");
        setImageUrl("");
        setDescription("");
        onToast({ type: "success", text: "Book submitted for moderation." });
        load();
      } catch (err: any) {
        onToast({ type: "error", text: getErrorMessage(err, "Could not create book listing.") });
      }
    }}>
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" />
      <input required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
      <input required type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (Rs.)" />
      <input type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" />
      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <button type="submit">Add Book</button>
    </form>
    <p className="muted sellerHint">Tip: new books are saved and shown here immediately, but appear in buyer catalog after admin approval.</p>
    <div className="detailSection">
      <h3>Top Selling Books</h3>
      {(analytics?.topBooks ?? []).map((tb) => <div className="listRow" key={tb.bookId}>
        <span>{tb.title}</span>
        <span>{tb.soldUnits} sold • Rs. {Number(tb.revenue).toFixed(0)}</span>
      </div>)}
    </div>
    <div className="detailSection">
      <h3>Low Stock Alerts</h3>
      {(analytics?.lowStock ?? []).length === 0 && <p className="muted">No low-stock books.</p>}
      {(analytics?.lowStock ?? []).map((ls) => <div className="listRow" key={ls.bookId}>
        <span>{ls.title}</span>
        <span className="errorText">Stock: {ls.stock}</span>
      </div>)}
    </div>
    <div className="detailSection">
      <h3>Your Listings</h3>
      {books.length === 0 && <p className="muted">No books yet. Add your first listing above.</p>}
    </div>
    {books.map((b) => <div className="listRow" key={b.id}>
      <div>
        <strong>{b.title}</strong>
        <div className="muted">by {b.author} • Rs. {b.price}</div>
      </div>
      <div className="row">
        <span className={b.moderationStatus === "APPROVED" ? "successText" : b.moderationStatus === "REJECTED" ? "errorText" : "muted"}>
          {b.moderationStatus || "PENDING"}
        </span>
        <button onClick={async () => {
          try {
            await api.delete(`/books/${b.id}`);
            onToast({ type: "success", text: "Book deleted." });
            load();
          } catch (err: any) {
            onToast({ type: "error", text: getErrorMessage(err, "Could not delete book.") });
          }
        }}>Delete</button>
      </div>
    </div>)}
  </div>;
}

export function SellerProfile({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  async function load() {
    const [profileRes, analyticsRes] = await Promise.all([
      api.get("/profile/me"),
      api.get("/seller/analytics")
    ]);
    setProfile(profileRes.data);
    setName(profileRes.data?.name || "");
    setPhone(profileRes.data?.phone || "");
    setAvatarUrl(profileRes.data?.avatarUrl || "");
    setAnalytics(analyticsRes.data);
  }
  useEffect(() => { load(); }, []);

  return <div className="page sellerTheme modernDash">
    <div className="dashboardHeader">
      <h2>Seller Profile</h2>
      <div className="row">
        <Link to="/seller/dashboard"><button className="secondary">Back</button></Link>
        <button className="secondary" onClick={onLogout}>Logout</button>
      </div>
    </div>
    <div className="profileGrid">
      <div className="detailSection">
        <h3>Store Profile</h3>
        <div className="profileHeader">
          <SafeImage src={avatarUrl || profile?.avatarUrl} alt={profile?.name || "Seller"} className="avatar" />
          <div>
            <strong>{profile?.name || "Seller"}</strong>
            <div className="muted">{profile?.email}</div>
            <div className="muted">Marketplace Seller Level: Gold</div>
          </div>
        </div>
        <form className="searchCard" onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.patch("/profile/me", { name, phone, avatarUrl });
            onToast({ type: "success", text: "Seller profile updated." });
            load();
          } catch (err: any) {
            onToast({ type: "error", text: getErrorMessage(err, "Could not update seller profile.") });
          }
        }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Store / owner name" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Support phone" />
          <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="Store logo URL" />
          <button type="submit">Save Profile</button>
        </form>
      </div>
      <div className="detailSection">
        <h3>Seller Performance</h3>
        <div className="listRow"><span>Total Units Sold</span><strong>{analytics?.totalSoldUnits ?? 0}</strong></div>
        <div className="listRow"><span>Total Revenue</span><strong>Rs. {Number(analytics?.totalRevenue ?? 0).toFixed(0)}</strong></div>
        <div className="listRow"><span>Low Stock SKUs</span><strong>{analytics?.lowStock?.length ?? 0}</strong></div>
        <div className="listRow"><span>Promotion Suggestion</span><strong>Enable weekend flash deal</strong></div>
      </div>
    </div>
    <PaymentMethodsManager onToast={onToast} />
  </div>;
}
