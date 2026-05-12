import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ModernDashHeader, SellerStatIcons, ThemeStatTile } from "../app/dash-layout";
import { SafeImage, api, getErrorMessage } from "../app/shared";
import type { Book, ProfileInfo, SellerAnalytics, Toast } from "../app/shared";
import { PaymentMethodsManager } from "./shared-components";

type SellerOrderLine = { bookId?: string; title?: string; quantity?: number; subtotal?: number };
type SellerOrderRow = {
  orderId?: string;
  orderDate?: string;
  status?: string;
  buyerUserId?: string;
  totalAmount?: number;
  lines?: SellerOrderLine[];
};

export function SellerDashboard({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [sellerOrders, setSellerOrders] = useState<SellerOrderRow[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadError, setLoadError] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("399");
  const [stock, setStock] = useState("20");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isbn, setIsbn] = useState("");
  const [language, setLanguage] = useState("");
  const [format, setFormat] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publicationYear, setPublicationYear] = useState("");

  const load = async () => {
    try {
      const [booksRes, analyticsRes, ordRes, catRes] = await Promise.all([
        api.get("/seller/books"),
        api.get("/seller/analytics"),
        api.get("/seller/orders"),
        api.get("/categories"),
      ]);
      setBooks(booksRes.data);
      setAnalytics(analyticsRes.data);
      setSellerOrders(Array.isArray(ordRes.data) ? ordRes.data : []);
      setCategories(catRes.data || []);
      setLoadError("");
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Could not load seller data.");
      setLoadError(msg);
      onToast({ type: "error", text: msg });
    }
  };
  useEffect(() => { load(); }, []);

  const lowStock = analytics?.lowStock?.length ?? 0;

  return <div className="page sellerTheme modernDash">
    <ModernDashHeader
      theme="seller"
      eyebrow="Storefront"
      title="Seller workspace"
      subhead="Track performance, publish new titles, and keep your storefront story in sync."
      actions={
        <div className="row">
          <Link to="/seller/profile"><button type="button" className="secondary">Profile</button></Link>
          <button type="button" className="secondary" onClick={() => void load()}>Reload</button>
          <button type="button" className="secondary" onClick={onLogout}>Logout</button>
        </div>
      }
    />
    {loadError ? <div className="sellerErrorBanner" role="alert">Seller data load failed: {loadError}</div> : null}
    <div className="dashStatGrid adminStatGrid">
      <ThemeStatTile theme="seller" label="Listed books" value={analytics?.bookCount ?? 0} hint="Including pending moderation" icon={<SellerStatIcons.box />} />
      <ThemeStatTile theme="seller" label="Units sold" value={analytics?.totalSoldUnits ?? 0} hint="All-time quantity" icon={<SellerStatIcons.trend />} />
      <ThemeStatTile
        theme="seller"
        label="Revenue"
        value={`Rs. ${Number(analytics?.totalRevenue ?? 0).toFixed(0)}`}
        hint="Recorded from orders"
        icon={<SellerStatIcons.rupee />}
      />
      <ThemeStatTile theme="seller" label="Low stock" value={lowStock} hint="SKUs that may need restock" icon={<SellerStatIcons.alert />} />
    </div>

    <section className="dashPanel sellerFormPanel">
      <div className="dashPanelHead">
        <h3>Add new listing</h3>
        <span className="muted">Goes live for buyers after approval</span>
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
        const py = publicationYear.trim() ? Number(publicationYear) : NaN;
        const body: Record<string, unknown> = {
          title: title.trim(),
          author: author.trim(),
          price: numericPrice,
          stock: Number.isNaN(numericStock) ? 20 : Math.max(0, numericStock),
          imageUrl: imageUrl.trim(),
          description: description.trim(),
          active: true,
        };
        if (categoryId) body.categoryId = categoryId;
        if (isbn.trim()) body.isbn = isbn.trim();
        if (language.trim()) body.language = language.trim();
        if (format.trim()) body.format = format.trim();
        if (publisher.trim()) body.publisher = publisher.trim();
        if (!Number.isNaN(py) && py > 0) body.publicationYear = py;
        await api.post("/books", body);
        setTitle("");
        setAuthor("");
        setPrice("399");
        setStock("20");
        setImageUrl("");
        setDescription("");
        setCategoryId("");
        setIsbn("");
        setLanguage("");
        setFormat("");
        setPublisher("");
        setPublicationYear("");
        onToast({ type: "success", text: "Book submitted for moderation." });
        load();
      } catch (err: unknown) {
        onToast({ type: "error", text: getErrorMessage(err, "Could not create book listing.") });
      }
    }}>
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" />
      <input required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
      <input required type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (Rs.)" />
      <input type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" />
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">Category (optional)</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <input value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="ISBN (optional)" />
      <input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Language e.g. English" />
      <select value={format} onChange={(e) => setFormat(e.target.value)}>
        <option value="">Format (optional)</option>
        <option value="PAPERBACK">Paperback</option>
        <option value="HARDCOVER">Hardcover</option>
        <option value="EBOOK">Ebook</option>
      </select>
      <input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="Publisher" />
      <input type="number" value={publicationYear} onChange={(e) => setPublicationYear(e.target.value)} placeholder="Publication year" min="1000" max="2100" />
      <button type="submit">Add book</button>
    </form>
    <p className="muted sellerHint">Tip: new books are saved and shown here immediately, but appear in buyer catalog after admin approval.</p>
    </section>

    <section className="dashPanel">
      <div className="dashPanelHead">
        <h3>Orders with your titles</h3>
        <span className="muted">{sellerOrders.length} orders</span>
      </div>
      {sellerOrders.length === 0 ? <p className="muted">No orders yet containing your listings.</p> : null}
      {sellerOrders.map((o) => (
        <div className="listRow modernDataRow sellerOrderRow" key={o.orderId}>
          <div>
            <strong>Order {(o.orderId || "").slice(0, 8)}</strong>
            <div className="muted smallPrint">
              {o.orderDate ? new Date(o.orderDate).toLocaleString() : ""}
              {o.status ? ` · ${o.status}` : ""}
              {o.buyerUserId ? ` · buyer ${o.buyerUserId}` : ""}
            </div>
            <ul className="sellerOrderLines muted smallPrint">
              {(o.lines || []).map((ln, i) => (
                <li key={`${o.orderId}-${ln.bookId}-${i}`}>
                  {ln.title || ln.bookId} × {ln.quantity ?? 0}
                  {ln.subtotal != null ? ` · Rs.${Number(ln.subtotal).toFixed(0)}` : ""}
                </li>
              ))}
            </ul>
          </div>
          <div className="buyerPill">Total Rs.{Number(o.totalAmount ?? 0).toFixed(0)}</div>
        </div>
      ))}
    </section>

    <section className="dashPanel">
      <div className="dashPanelHead">
        <h3>Insights &amp; catalogue</h3>
        <span className="muted">{books.length} listings · analytics snapshot</span>
      </div>
    <div className="detailSection">
      <h3>Top Selling Books</h3>
      {(analytics?.topBooks ?? []).map((tb) => <div className="listRow modernDataRow" key={tb.bookId}>
        <span>{tb.title}</span>
        <span>{tb.soldUnits} sold • Rs. {Number(tb.revenue).toFixed(0)}</span>
      </div>)}
    </div>
    <div className="detailSection">
      <h3>Low stock alerts</h3>
      {(analytics?.lowStock ?? []).length === 0 && <p className="muted">No low-stock books.</p>}
      {(analytics?.lowStock ?? []).map((ls) => <div className="listRow modernDataRow" key={ls.bookId}>
        <span>{ls.title}</span>
        <span className="errorText">Stock: {ls.stock}</span>
      </div>)}
    </div>
    {books.length === 0 && <p className="muted">No books yet. Add your first listing above.</p>}
    {books.map((b) => <div className="listRow modernDataRow" key={b.id}>
      <div>
        <strong>{b.title}</strong>
        <div className="muted">by {b.author} • Rs. {b.price}</div>
      </div>
      <div className="row">
        <span className={b.moderationStatus === "APPROVED" ? "successText" : b.moderationStatus === "REJECTED" ? "errorText" : "muted"}>
          {b.moderationStatus || "PENDING"}
        </span>
        <button type="button" onClick={async () => {
          try {
            await api.delete(`/books/${b.id}`);
            onToast({ type: "success", text: "Book deleted." });
            load();
          } catch (err: unknown) {
            onToast({ type: "error", text: getErrorMessage(err, "Could not delete book.") });
          }
        }}>Delete</button>
      </div>
    </div>)}
    </section>
  </div>;
}

export function SellerProfile({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeWebsiteUrl, setStoreWebsiteUrl] = useState("");

  async function load() {
    const [profileRes, analyticsRes] = await Promise.all([
      api.get("/profile/me"),
      api.get("/seller/analytics")
    ]);
    const p = profileRes.data as ProfileInfo;
    setProfile(p);
    setName(p?.name || "");
    setPhone(p?.phone || "");
    setAvatarUrl(p?.avatarUrl || "");
    setStoreName(p?.storeName || "");
    setStoreDescription(p?.storeDescription || "");
    setStoreWebsiteUrl(p?.storeWebsiteUrl || "");
    setAnalytics(analyticsRes.data);
  }
  useEffect(() => { load(); }, []);

  const displayStoreTitle = storeName.trim() || profile?.storeName?.trim() || profile?.name || "Your store";
  const listedBooks = analytics?.bookCount ?? 0;

  return <div className="page sellerTheme modernDash">
    <ModernDashHeader
      theme="seller"
      eyebrow="Branding"
      title="Seller profile"
      subhead="Storefront story, payouts, and performance at a glance."
      actions={
        <div className="row">
          <Link to="/seller/dashboard"><button type="button" className="secondary">Back</button></Link>
          <button type="button" className="secondary" onClick={onLogout}>Logout</button>
        </div>
      }
    />
    <form
      className="profileGrid"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api.patch("/profile/me", {
            name,
            phone,
            avatarUrl,
            storeName,
            storeDescription,
            storeWebsiteUrl
          });
          onToast({ type: "success", text: "Seller profile updated." });
          load();
        } catch (err: unknown) {
          onToast({ type: "error", text: getErrorMessage(err, "Could not update seller profile.") });
        }
      }}
    >
      <div className="detailSection">
        <h3>Contact & branding</h3>
        <div className="profileHeader">
          <SafeImage src={avatarUrl || profile?.avatarUrl} alt={profile?.name || "Seller"} className="avatar" />
          <div>
            <strong>{profile?.name || "Seller"}</strong>
            <div className="muted">{profile?.email}</div>
            <div className="muted">Marketplace seller • {listedBooks} active listings</div>
          </div>
        </div>
        <div className="searchCard profileFormStack">
          <label className="fieldLabel">Owner / legal display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name shown on invoices & support" />
          <label className="fieldLabel">Support phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Buyers may see this for order issues" />
          <label className="fieldLabel">Store logo URL</label>
          <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://… square image works best" />
        </div>
      </div>
      <div className="detailSection">
        <h3>Performance</h3>
        <div className="listRow modernDataRow"><span>Listed books</span><strong>{listedBooks}</strong></div>
        <div className="listRow modernDataRow"><span>Total units sold</span><strong>{analytics?.totalSoldUnits ?? 0}</strong></div>
        <div className="listRow modernDataRow"><span>Total revenue</span><strong>Rs. {Number(analytics?.totalRevenue ?? 0).toFixed(0)}</strong></div>
        <div className="listRow modernDataRow"><span>Low-stock SKUs</span><strong>{analytics?.lowStock?.length ?? 0}</strong></div>
        <div className="listRow modernDataRow"><span>Growth tip</span><strong>Complete your storefront story below</strong></div>
        <div className="profileQuickLinks">
          <Link to="/seller/dashboard"><button type="button" className="secondary">Manage listings</button></Link>
        </div>
      </div>
      <div className="detailSection profileSpan2">
        <h3>Storefront</h3>
        <p className="muted smallPrint">Shoppers see your books first — this section is for your public story and links (shown as a preview card).</p>
        <div className="searchCard profileFormStack">
          <label className="fieldLabel">Store display name</label>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="e.g. Bluebird Books Chennai"
            maxLength={120}
          />
          <label className="fieldLabel">Store story</label>
          <textarea
            className="profileTextarea"
            value={storeDescription}
            onChange={(e) => setStoreDescription(e.target.value)}
            placeholder="What you specialize in, shipping regions, return policy highlights…"
            rows={5}
            maxLength={2000}
          />
          <label className="fieldLabel">Website or social link</label>
          <input
            value={storeWebsiteUrl}
            onChange={(e) => setStoreWebsiteUrl(e.target.value)}
            placeholder="https://instagram.com/yourshop or your site"
            maxLength={500}
          />
        </div>
        <button type="submit" className="profileSaveWide">Save storefront & contact</button>
      </div>
      <div className="detailSection profileSpan2 sellerStorePreview">
        <h3>Store preview</h3>
        <p className="muted smallPrint">How your storefront card may appear next to your catalogue.</p>
        <div className="storePreviewCard">
          <div className="storePreviewHeader">
            <SafeImage src={avatarUrl || profile?.avatarUrl} alt="" className="storePreviewLogo" />
            <div>
              <div className="storePreviewTitle">{displayStoreTitle}</div>
              <div className="muted smallPrint">{profile?.email}</div>
            </div>
          </div>
          {storeDescription.trim() ? (
            <p className="storePreviewBody">{storeDescription.trim()}</p>
          ) : (
            <p className="muted smallPrint">Add a store story above — it shows here for buyers.</p>
          )}
          {storeWebsiteUrl.trim() ? (
            <a
              className="storePreviewLink"
              href={storeWebsiteUrl.trim().startsWith("http") ? storeWebsiteUrl.trim() : `https://${storeWebsiteUrl.trim()}`}
              target="_blank"
              rel="noreferrer"
            >
              Visit shop link →
            </a>
          ) : null}
        </div>
      </div>
    </form>
    <PaymentMethodsManager onToast={onToast} />
  </div>;
}
