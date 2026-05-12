import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { BuyerStatIcons, ModernDashHeader, ThemeStatTile } from "../app/dash-layout";
import { FLAT_SHIPPING, FREE_SHIPPING_THRESHOLD, ORDER_TIMELINE_STEPS, SafeImage, TAX_RATE, api, getErrorMessage, getStoredUser } from "../app/shared";
import type { Address, Book, CartItem, CartRow, Category, ProductQuestion, ProfileInfo, Review, SessionUser, Toast } from "../app/shared";
import { PaymentMethodsManager } from "./shared-components";

function estimateCheckoutTotals(merchandiseSubtotal: number, couponTrim: string) {
  const c = couponTrim.trim().toUpperCase();
  let discount = 0;
  let after = merchandiseSubtotal;
  if (c === "SAVE10") {
    discount = Math.round(merchandiseSubtotal * 10) / 100;
    after = merchandiseSubtotal - discount;
  } else if (c === "WELCOME15" && merchandiseSubtotal >= 500) {
    discount = Math.round(merchandiseSubtotal * 15) / 100;
    after = merchandiseSubtotal - discount;
  }
  const shipping = after >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const tax = Math.round(after * TAX_RATE * 100) / 100;
  const total = Math.round((after + shipping + tax) * 100) / 100;
  return { discount, merchandiseSubtotal, afterCoupon: after, shipping, tax, total };
}

export function BuyerDashboard({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [searchParams] = useSearchParams();
  const [cartCount, setCartCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [format, setFormat] = useState("");
  const [language, setLanguage] = useState("");

  async function load() {
    const queryFromUrl = searchParams.get("q") || "";
    const effectiveQuery = query || queryFromUrl;
    const params: Record<string, string> = {};
    if (effectiveQuery) params.q = effectiveQuery;
    if (categoryId) params.categoryId = categoryId;
    if (minPrice.trim()) params.minPrice = minPrice.trim();
    if (maxPrice.trim()) params.maxPrice = maxPrice.trim();
    if (inStockOnly) params.inStockOnly = "true";
    if (format) params.format = format;
    if (language) params.language = language;
    const [b, c] = await Promise.all([api.get("/books", { params }), api.get("/categories")]);
    const loadedCategories: Category[] = c.data;
    setBooks(b.data);
    setCategories(loadedCategories);

    const categoryName = searchParams.get("category");
    if (effectiveQuery && !query) {
      setQuery(effectiveQuery);
    }
    if (categoryName && !categoryId) {
      const match = loadedCategories.find((x) => x.name.toLowerCase() === categoryName.toLowerCase());
      if (match) {
        setCategoryId(match.id);
        const withCategory = await api.get("/books", { params: { ...params, categoryId: match.id } });
        setBooks(withCategory.data);
      }
    }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cartRes, orderRes, wishRes] = await Promise.all([
          api.get("/cart"),
          api.get("/orders"),
          api.get("/wishlist")
        ]);
        if (cancelled) return;
        setCartCount((cartRes.data as CartItem[])?.length ?? 0);
        setOrderCount((orderRes.data as { id?: string }[])?.length ?? 0);
        setWishlistCount((wishRes.data as { id?: string }[])?.length ?? 0);
      } catch {
        if (!cancelled) {
          setCartCount(0);
          setOrderCount(0);
          setWishlistCount(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function addToCart(bookId: string) {
    try {
      await api.post("/cart", { bookId, quantity: 1 });
      onToast({ type: "success", text: "Book added to cart." });
    } catch {
      onToast({ type: "error", text: "Could not add book to cart." });
    }
  }

  async function addToWishlist(bookId: string) {
    try {
      await api.post(`/wishlist/${bookId}`);
      onToast({ type: "success", text: "Book added to wishlist." });
    } catch {
      onToast({ type: "error", text: "Could not add book to wishlist." });
    }
  }

  return <div className="page buyerTheme modernDash">
    <ModernDashHeader
      theme="buyer"
      eyebrow="Marketplace"
      title="Discover & shop"
      subhead="Search the catalogue, manage your cart, and track orders in one calm workspace."
      actions={
        <div className="row">
          <Link to="/buyer/profile"><button type="button" className="secondary">Profile</button></Link>
          <Link to="/buyer/cart"><button type="button">Cart &amp; payment</button></Link>
          <Link to="/buyer/orders"><button type="button" className="secondary">Orders</button></Link>
          <button type="button" className="secondary" onClick={onLogout}>Logout</button>
        </div>
      }
    />

    <div className="dashStatGrid adminStatGrid">
      <ThemeStatTile theme="buyer" label="In this view" value={books.length} hint="Titles matching your filters" icon={<BuyerStatIcons.books />} />
      <ThemeStatTile theme="buyer" label="Cart lines" value={cartCount} hint="Items ready for checkout" icon={<BuyerStatIcons.cart />} />
      <ThemeStatTile theme="buyer" label="Orders" value={orderCount} hint="Your purchase history" icon={<BuyerStatIcons.orders />} />
      <ThemeStatTile theme="buyer" label="Wishlist" value={wishlistCount} hint="Saved for later" icon={<BuyerStatIcons.heart />} />
    </div>

    <section className="dashPanel">
      <div className="dashPanelHead">
        <h3>Browse catalogue</h3>
        <span className="muted">{categories.length} categories</span>
      </div>
      <div className="searchCard modernBrowseBar">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search books" />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="button" onClick={() => void load()}>Search</button>
      </div>
      <div className="searchCard modernBrowseBar buyerFilterRow">
        <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min Rs." type="number" min="0" />
        <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max Rs." type="number" min="0" />
        <label className="buyerCheckLabel">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
          In stock only
        </label>
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="">Any format</option>
          <option value="PAPERBACK">Paperback</option>
          <option value="HARDCOVER">Hardcover</option>
          <option value="EBOOK">Ebook</option>
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">Any language</option>
          <option value="English">English</option>
          <option value="Tamil">Tamil</option>
        </select>
        <button type="button" className="secondary" onClick={() => void load()}>Apply filters</button>
      </div>
      <div className="grid">
        {books.map((b) => <div key={b.id} className="productCard">
          <SafeImage src={b.imageUrl} alt={b.title} />
          <h3>{b.title}</h3>
          <p className="author">by {b.author}</p>
          <p className="price">Rs. {b.price}</p>
          <p className="description">{b.description}</p>
          <div className="row">
            <Link to={`/buyer/book/${b.id}`}><button type="button" className="secondary">View details</button></Link>
            <button type="button" onClick={() => addToCart(b.id)}>Add to cart</button>
            <button type="button" className="secondary" onClick={() => addToWishlist(b.id)}>Wishlist</button>
          </div>
        </div>)}
      </div>
    </section>
  </div>;
}

export function BookDetails({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Book[]>([]);
  const [alsoBought, setAlsoBought] = useState<Book[]>([]);
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [questionDraft, setQuestionDraft] = useState("");
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  async function load() {
    if (!id) return;
    try {
      const [bookRes, reviewsRes, alsoRes, qRes] = await Promise.all([
        api.get(`/books/${id}`),
        api.get(`/reviews/${id}`),
        api.get(`/books/${id}/also-bought`),
        api.get(`/books/${id}/questions`),
      ]);
      const loadedBook: Book = bookRes.data;
      setBook(loadedBook);
      setReviews(reviewsRes.data);
      setAlsoBought(Array.isArray(alsoRes.data) ? alsoRes.data : []);
      setQuestions(Array.isArray(qRes.data) ? qRes.data : []);

      let relatedBooks: Book[] = [];
      if (loadedBook.categoryId) {
        const catRes = await api.get("/books", { params: { categoryId: loadedBook.categoryId } });
        relatedBooks = (catRes.data as Book[]).filter((x) => x.id !== id).slice(0, 4);
      }
      setRelated(relatedBooks);
    } catch {
      onToast({ type: "error", text: "Could not load this book." });
    }
  }

  useEffect(() => { load(); }, [id]);

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      await api.post(`/reviews/${id}`, { rating: Number(rating), comment });
      setComment("");
      onToast({ type: "success", text: "Review submitted successfully." });
      load();
    } catch {
      onToast({ type: "error", text: "Could not submit review." });
    }
  }

  async function addCurrentBookToCart() {
    if (!book) return;
    try {
      await api.post("/cart", { bookId: book.id, quantity: 1 });
      onToast({ type: "success", text: "Book added to cart." });
    } catch {
      onToast({ type: "error", text: "Could not add book to cart." });
    }
  }

  async function addCurrentBookToWishlist() {
    if (!book) return;
    try {
      await api.post(`/wishlist/${book.id}`);
      onToast({ type: "success", text: "Book added to wishlist." });
    } catch {
      onToast({ type: "error", text: "Could not add book to wishlist." });
    }
  }

  const session = getStoredUser();

  function canPostQuestion(u: SessionUser | null): boolean {
    return Boolean(u && (u.role === "BUYER" || u.role === "ADMIN"));
  }

  function canAnswerForBook(u: SessionUser | null, b: Book): boolean {
    if (!u) return false;
    if (u.role === "ADMIN") return true;
    if (u.role !== "SELLER") return false;
    return Boolean(b.sellerEmail && u.email && b.sellerEmail.toLowerCase() === u.email.toLowerCase());
  }

  async function submitQuestion(e: FormEvent) {
    e.preventDefault();
    if (!id || !questionDraft.trim()) return;
    try {
      await api.post(`/books/${id}/questions`, { question: questionDraft.trim() });
      setQuestionDraft("");
      onToast({ type: "success", text: "Question posted." });
      load();
    } catch (err: unknown) {
      onToast({ type: "error", text: getErrorMessage(err, "Could not post question.") });
    }
  }

  async function submitAnswer(questionId: string) {
    if (!id) return;
    const text = (answerDrafts[questionId] || "").trim();
    if (text.length < 2) {
      onToast({ type: "error", text: "Answer is too short." });
      return;
    }
    try {
      await api.patch(`/books/${id}/questions/${questionId}/answer`, { answer: text });
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
      onToast({ type: "success", text: "Answer saved." });
      load();
    } catch (err: unknown) {
      onToast({ type: "error", text: getErrorMessage(err, "Could not save answer.") });
    }
  }

  if (!book) {
    return (
      <div className="page buyerTheme modernDash">
        <ModernDashHeader
          theme="buyer"
          eyebrow="Catalogue"
          title="Book details"
          subhead="Loading this title…"
          actions={
            <div className="row">
              <Link to="/buyer/dashboard"><button type="button" className="secondary">Back</button></Link>
              <button type="button" className="secondary" onClick={onLogout}>Logout</button>
            </div>
          }
        />
        <div className="dashPanel">
          <p className="muted">Loading book details…</p>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
    : "0.0";

  return <div className="page buyerTheme modernDash">
    <ModernDashHeader
      theme="buyer"
      eyebrow="Catalogue"
      title="Book details"
      subhead="Reviews, seller story, and quick add to cart or wishlist."
      actions={
        <div className="row">
          <Link to="/buyer/dashboard"><button type="button" className="secondary">Back</button></Link>
          <button type="button" className="secondary" onClick={onLogout}>Logout</button>
        </div>
      }
    />
    <div className="detailLayout">
      <div className="detailImageCard">
        <SafeImage src={book.imageUrl} alt={book.title} />
      </div>
      <div className="detailInfoCard">
        <h2>{book.title}</h2>
        <p className="author">by {book.author}</p>
        <p className="price">Rs. {book.price}</p>
        <p className="rating">★ {avgRating} ({reviews.length} reviews)</p>
        <p className="description">{book.description || "No description available."}</p>
        {(book.isbn || book.language || book.format || book.publisher || book.publicationYear) ? (
          <dl className="bookMetaDl muted smallPrint">
            {book.isbn ? <><dt>ISBN</dt><dd>{book.isbn}</dd></> : null}
            {book.language ? <><dt>Language</dt><dd>{book.language}</dd></> : null}
            {book.format ? <><dt>Format</dt><dd>{book.format}</dd></> : null}
            {book.publisher ? <><dt>Publisher</dt><dd>{book.publisher}</dd></> : null}
            {book.publicationYear != null ? <><dt>Year</dt><dd>{book.publicationYear}</dd></> : null}
          </dl>
        ) : null}
        <div className="row">
          <button type="button" onClick={addCurrentBookToCart}>Add to Cart</button>
          <button type="button" className="secondary" onClick={addCurrentBookToWishlist}>Wishlist</button>
        </div>
      </div>
    </div>

    {(book.sellerStoreName || book.sellerEmail) && (
      <div className="detailSection bookSellerSection">
        <h3>Sold by</h3>
        <p className="muted smallPrint">This shop is run by an independent seller on Ecomica.</p>
        <div className="storePreviewCard soldByCardNeutral">
          <div className="storePreviewHeader">
            <SafeImage src={book.sellerLogoUrl || book.imageUrl} alt="" className="storePreviewLogo soldByLogoRing" />
            <div>
              <div className="storePreviewTitle soldByTitle">{book.sellerStoreName || book.sellerEmail}</div>
              <div className="muted smallPrint">{book.sellerEmail}</div>
            </div>
          </div>
          {book.sellerStoreDescription?.trim() ? (
            <p className="storePreviewBody soldByBody">{book.sellerStoreDescription.trim()}</p>
          ) : (
            <p className="muted smallPrint">This seller has not added a storefront story yet.</p>
          )}
          {book.sellerStoreWebsiteUrl?.trim() ? (
            <a
              className="storePreviewLink soldByLink"
              href={
                book.sellerStoreWebsiteUrl.trim().startsWith("http")
                  ? book.sellerStoreWebsiteUrl.trim()
                  : `https://${book.sellerStoreWebsiteUrl.trim()}`
              }
              target="_blank"
              rel="noreferrer"
            >
              Visit seller link →
            </a>
          ) : null}
        </div>
      </div>
    )}

    {alsoBought.length > 0 ? (
      <div className="detailSection">
        <h3>Customers also bought</h3>
        <div className="grid">
          {alsoBought.map((rb) => <div key={rb.id} className="productCard">
            <SafeImage src={rb.imageUrl} alt={rb.title} />
            <h3>{rb.title}</h3>
            <p className="author">{rb.author}</p>
            <p className="price">Rs. {rb.price}</p>
            <Link to={`/buyer/book/${rb.id}`}><button type="button" className="secondary">View</button></Link>
          </div>)}
        </div>
      </div>
    ) : null}

    <div className="detailSection">
      <h3>Write a review</h3>
      <form className="searchCard" onSubmit={submitReview}>
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Very good</option>
          <option value="3">3 - Good</option>
          <option value="2">2 - Fair</option>
          <option value="1">1 - Poor</option>
        </select>
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write your review" />
        <button type="submit">Submit</button>
      </form>
    </div>

    <div className="detailSection">
      <h3>Customer reviews</h3>
      {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      {reviews.map((r) => <div key={r.id} className="listRow modernDataRow">
        <span>
          ★ {r.rating} — {r.comment || "No comment"}
          {r.verifiedPurchase ? <span className="verifiedPurchaseBadge" title="Purchased on Ecomica">Verified purchase</span> : null}
        </span>
        <span className="muted">{r.userId}</span>
      </div>)}
    </div>

    <div className="detailSection">
      <h3>Questions &amp; answers</h3>
      <p className="muted smallPrint">Ask about condition, edition, or delivery. Sellers (and admins) can reply publicly.</p>
      {canPostQuestion(session) ? (
        <form className="searchCard qaAskForm" onSubmit={submitQuestion}>
          <textarea
            value={questionDraft}
            onChange={(e) => setQuestionDraft(e.target.value)}
            placeholder="Your question…"
            rows={3}
            maxLength={800}
          />
          <button type="submit">Ask</button>
        </form>
      ) : (
        <p className="muted smallPrint">Sign in as a buyer to ask a question.</p>
      )}
      {questions.length === 0 && <p className="muted">No questions yet.</p>}
      {questions.map((q) => (
        <div key={q.id} className="listRow modernDataRow qaBlock">
          <div className="qaQ">
            <strong>{q.askerName || "Reader"}</strong>
            <span className="muted smallPrint">{q.createdAt ? new Date(q.createdAt).toLocaleString() : ""}</span>
            <p>{q.question}</p>
            {q.answer ? (
              <div className="qaA">
                <span className="muted smallPrint">Answer{q.answeredBy ? ` from ${q.answeredBy}` : ""}</span>
                <p>{q.answer}</p>
              </div>
            ) : canAnswerForBook(session, book) ? (
              <div className="searchCard qaAnswerForm">
                <textarea
                  value={answerDrafts[q.id] || ""}
                  onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Your public answer…"
                  rows={2}
                  maxLength={2000}
                />
                <button type="button" onClick={() => void submitAnswer(q.id)}>Post answer</button>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>

    <div className="detailSection">
      <h3>Related books</h3>
      <div className="grid">
        {related.map((rb) => <div key={rb.id} className="productCard">
          <SafeImage src={rb.imageUrl} alt={rb.title} />
          <h3>{rb.title}</h3>
          <p className="author">{rb.author}</p>
          <p className="price">Rs. {rb.price}</p>
          <Link to={`/buyer/book/${rb.id}`}><button type="button" className="secondary">View</button></Link>
        </div>)}
      </div>
    </div>
  </div>;
}

type OrderSummary = { id?: string; totalAmount?: number };

export function BuyerProfile({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [wishlist, setWishlist] = useState<{ id?: string }[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteGenres, setFavoriteGenres] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  async function load() {
    const [profileRes, ordersRes, wishlistRes] = await Promise.all([
      api.get("/profile/me"),
      api.get("/orders"),
      api.get("/wishlist")
    ]);
    const p = profileRes.data as ProfileInfo;
    setProfile(p);
    setName(p?.name || "");
    setPhone(p?.phone || "");
    setAvatarUrl(p?.avatarUrl || "");
    setBio(p?.bio || "");
    setFavoriteGenres(p?.favoriteGenres || "");
    setNewsletterOptIn(Boolean(p?.newsletterOptIn));
    setOrders(ordersRes.data || []);
    setWishlist(wishlistRes.data || []);
  }
  useEffect(() => { load(); }, []);

  const totalSpend = orders.reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0);
  const memberSince =
    profile?.createdAt && !Number.isNaN(Date.parse(profile.createdAt))
      ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
      : "—";

  return <div className="page buyerTheme modernDash">
    <ModernDashHeader
      theme="buyer"
      eyebrow="Account"
      title="Your reader profile"
      subhead="Account details, reader preferences, and payment methods."
      actions={
        <div className="row">
          <Link to="/buyer/dashboard"><button type="button" className="secondary">Back</button></Link>
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
            bio,
            favoriteGenres,
            newsletterOptIn
          });
          onToast({ type: "success", text: "Profile updated." });
          load();
        } catch (err: unknown) {
          onToast({ type: "error", text: getErrorMessage(err, "Could not update profile.") });
        }
      }}
    >
      <div className="detailSection">
        <h3>Account overview</h3>
        <div className="profileHeader">
          <SafeImage src={avatarUrl || profile?.avatarUrl} alt={profile?.name || "Buyer"} className="avatar" />
          <div>
            <strong>{profile?.name || "Buyer"}</strong>
            <div className="muted">{profile?.email}</div>
            <div className="muted">Member since {memberSince}</div>
            <div className="muted">Loyalty points: <strong>{profile?.loyaltyPoints ?? 0}</strong></div>
            <div className="muted">Prime Reader tier • Free delivery above Rs. 999</div>
          </div>
        </div>
        <div className="searchCard profileFormStack">
          <label className="fieldLabel">Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          <label className="fieldLabel">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
          <label className="fieldLabel">Avatar image URL</label>
          <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <div className="detailSection">
        <h3>Shopping snapshot</h3>
        <div className="listRow modernDataRow"><span>Orders placed</span><strong>{orders.length}</strong></div>
        <div className="listRow modernDataRow"><span>Estimated lifetime spend</span><strong>Rs. {totalSpend.toFixed(0)}</strong></div>
        <div className="listRow modernDataRow"><span>Wishlist items</span><strong>{wishlist.length}</strong></div>
        <div className="listRow modernDataRow"><span>Deals for you</span><strong>15% off Education this week</strong></div>
        <div className="listRow modernDataRow"><span>Fast delivery</span><strong>Eligible on Rs. 999+</strong></div>
        <div className="profileQuickLinks">
          <Link to="/buyer/orders"><button type="button" className="secondary">Order history</button></Link>
          <Link to="/buyer/cart"><button type="button" className="secondary">Go to cart</button></Link>
          <Link to="/buyer/dashboard"><button type="button" className="secondary">Browse books</button></Link>
        </div>
      </div>
      <div className="detailSection profileSpan2">
        <h3>Reader profile & preferences</h3>
        <p className="muted smallPrint">Tell us what you like — we use this for tailored picks and optional email offers.</p>
        <div className="searchCard profileFormStack">
          <label className="fieldLabel">About you</label>
          <textarea
            className="profileTextarea"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A few lines about your reading taste, studies, or favorite authors…"
            rows={4}
            maxLength={600}
          />
          <label className="fieldLabel">Favorite genres (comma-separated)</label>
          <input
            value={favoriteGenres}
            onChange={(e) => setFavoriteGenres(e.target.value)}
            placeholder="Fiction, Manga, Exam prep, Self-help…"
            maxLength={240}
          />
          <label className="checkRow">
            <input type="checkbox" checked={newsletterOptIn} onChange={(e) => setNewsletterOptIn(e.target.checked)} />
            <span>Email me deals, restocks, and reading lists (optional)</span>
          </label>
        </div>
        <button type="submit" className="profileSaveWide">Save all profile changes</button>
      </div>
    </form>
    <PaymentMethodsManager onToast={onToast} />
  </div>;
}

export function CartAndPayment({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const [items, setItems] = useState<CartRow[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [shippingAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    phone: ""
  });

  const load = async () => {
    const [cartRes, booksRes, addrRes] = await Promise.all([api.get("/cart"), api.get("/books"), api.get("/addresses")]);
    const books: Book[] = booksRes.data;
    const loadedAddresses: Address[] = addrRes.data;
    const rows: CartRow[] = (cartRes.data as CartItem[]).map((item) => ({
      ...item,
      book: books.find((b) => b.id === item.bookId)
    }));
    setItems(rows);
    setAddresses(loadedAddresses);
    if (!selectedAddressId && loadedAddresses.length) {
      setSelectedAddressId(loadedAddresses[0].id);
    }
  };
  useEffect(() => { load(); }, []);

  const subtotal = items.reduce((sum, item) => sum + (Number(item.book?.price || 0) * item.quantity), 0);
  const est = useMemo(() => {
    if (items.length === 0) {
      return { discount: 0, merchandiseSubtotal: 0, afterCoupon: 0, shipping: 0, tax: 0, total: 0 };
    }
    return estimateCheckoutTotals(subtotal, couponCode);
  }, [items.length, subtotal, couponCode]);
  const shippingFee = est.shipping;
  const tax = est.tax;
  const orderTotal = est.total;

  async function changeQuantity(item: CartRow, nextQuantity: number) {
    try {
      if (nextQuantity <= 0) {
        await api.delete(`/cart/${item.id}`);
        onToast({ type: "success", text: "Item removed from cart." });
      } else {
        await api.patch(`/cart/${item.id}`, { quantity: nextQuantity });
      }
      load();
    } catch {
      onToast({ type: "error", text: "Could not update cart item." });
    }
  }

  async function checkout() {
    const selected = addresses.find((a) => a.id === selectedAddressId);
    const finalAddress = selected
      ? `${selected.fullName}, ${selected.line1}, ${selected.city}, ${selected.state} - ${selected.postalCode}, ${selected.phone}`
      : shippingAddress;
    const payload = {
      paymentMethod,
      cardNumber,
      cardName,
      expiry,
      cvv,
      shippingAddress: finalAddress,
      couponCode: couponCode.trim() || undefined,
    };
    try {
      const { data } = await api.post("/orders/checkout", payload);
      onToast({ type: "success", text: `Order placed. Total Rs. ${Number(data.totalAmount).toFixed(0)} · ${data.paymentStatus}.` });
      setCouponCode("");
      setStep(1);
      load();
    } catch (err: unknown) {
      onToast({ type: "error", text: getErrorMessage(err, "Could not place order.") });
    }
  }

  async function addAddress(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post("/addresses", newAddress);
      setNewAddress({ fullName: "", line1: "", city: "", state: "", postalCode: "", phone: "" });
      onToast({ type: "success", text: "Address added." });
      load();
    } catch {
      onToast({ type: "error", text: "Could not add address." });
    }
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return <div className="page buyerTheme modernDash">
    <ModernDashHeader
      theme="buyer"
      eyebrow="Checkout"
      title="Cart & payment"
      subhead="Review items, choose an address, then pay and place your order."
      actions={
        <div className="row">
          <Link to="/buyer/dashboard"><button type="button" className="secondary">Back</button></Link>
          <button type="button" className="secondary" onClick={onLogout}>Logout</button>
        </div>
      }
    />
    <div className="cartLayout">
      <div>
        {items.length === 0 && <div className="listRow modernDataRow"><span>Your cart is empty.</span></div>}
        {items.map((i) => <div key={i.id} className="listRow cartRow modernDataRow">
          <div className="cartBookInfo">
            <SafeImage src={i.book?.imageUrl} alt={i.book?.title || i.bookId} className="cartThumb" />
            <div>
              <strong>{i.book?.title || i.bookId}</strong>
              <div className="muted">by {i.book?.author || "Unknown"}</div>
              <div className="muted">Unit: Rs. {i.book?.price || 0}</div>
            </div>
          </div>
          <div className="cartActions">
            <button type="button" className="secondary" onClick={() => changeQuantity(i, i.quantity - 1)}>-</button>
            <span>{i.quantity}</span>
            <button type="button" className="secondary" onClick={() => changeQuantity(i, i.quantity + 1)}>+</button>
            <strong>Rs. {(Number(i.book?.price || 0) * i.quantity).toFixed(0)}</strong>
            <button type="button" onClick={async () => {
              try {
                await api.delete(`/cart/${i.id}`);
                onToast({ type: "success", text: "Item removed from cart." });
                load();
              } catch {
                onToast({ type: "error", text: "Could not remove item." });
              }
            }}>Remove</button>
          </div>
        </div>)}
      </div>
      <div className="formCard orderSummary">
        <h3>Order Summary</h3>
        <div className="summaryLine"><span>Subtotal</span><strong>Rs. {subtotal.toFixed(0)}</strong></div>
        {est.discount > 0 ? <div className="summaryLine"><span>Coupon discount</span><strong>- Rs. {est.discount.toFixed(0)}</strong></div> : null}
        <div className="summaryLine"><span>Shipping</span><strong>Rs. {shippingFee}</strong></div>
        <div className="summaryLine"><span>Tax (5%)</span><strong>Rs. {tax}</strong></div>
        <div className="summaryLine totalLine"><span>Total</span><strong>Rs. {orderTotal.toFixed(0)}</strong></div>
      </div>
    </div>
    <div className="formCard dashPanel">
      <div className="checkoutSeg" role="tablist" aria-label="Checkout steps">
        <button type="button" className={step === 1 ? "" : "secondary"} onClick={() => setStep(1)}>1 · Address</button>
        <button type="button" className={step === 2 ? "" : "secondary"} onClick={() => setStep(2)}>2 · Payment</button>
        <button type="button" className={step === 3 ? "" : "secondary"} onClick={() => setStep(3)}>3 · Review</button>
      </div>

      {step === 1 && <>
        <h3>Address Book</h3>
        {addresses.map((a) => <label key={a.id} className="listRow addressRow modernDataRow">
          <input
            type="radio"
            checked={selectedAddressId === a.id}
            onChange={() => setSelectedAddressId(a.id)}
          />
          <span>{a.fullName}, {a.line1}, {a.city}, {a.state} - {a.postalCode}</span>
        </label>)}
        <form className="searchCard" onSubmit={addAddress}>
          <input value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} placeholder="Full name" required />
          <input value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} placeholder="Address line" required />
          <input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="City" required />
          <input value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} placeholder="State" required />
          <input value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} placeholder="Postal code" required />
          <input value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} placeholder="Phone" required />
          <button type="submit">Add Address</button>
        </form>
        <button type="button" onClick={() => setStep(2)} disabled={!selectedAddressId}>Continue to Payment</button>
      </>}

      {step === 2 && <>
        <h3>Payment Method</h3>
        <div className="searchCard" style={{ marginBottom: 12 }}>
          <label className="muted" style={{ display: "block", marginBottom: 6 }}>Promo code (optional)</label>
          <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="SAVE10 or WELCOME15 (min Rs.500)" />
          <p className="muted smallPrint">Free shipping on merchandise Rs.{FREE_SHIPPING_THRESHOLD}+ after coupon.</p>
        </div>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="COD">Cash on Delivery</option>
          <option value="CARD">Card Payment</option>
          <option value="UPI">UPI</option>
        </select>
        {paymentMethod === "CARD" && <>
          <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Card number" />
          <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Card holder name" />
          <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" />
          <input value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="CVV" />
        </>}
        <div className="row">
          <button type="button" className="secondary" onClick={() => setStep(1)}>Back</button>
          <button type="button" onClick={() => setStep(3)}>Continue to Review</button>
        </div>
      </>}

      {step === 3 && <>
        <h3>Review Order</h3>
        <p className="muted"><strong>Deliver to:</strong> {selectedAddress ? `${selectedAddress.fullName}, ${selectedAddress.line1}, ${selectedAddress.city}` : "No address selected"}</p>
        <p className="muted"><strong>Payment:</strong> {paymentMethod}</p>
        {couponCode.trim() ? <p className="muted"><strong>Promo:</strong> {couponCode.trim()}</p> : null}
        <div className="searchCard" style={{ marginTop: 8 }}>
          <div className="summaryLine"><span>Merchandise</span><strong>Rs. {subtotal.toFixed(0)}</strong></div>
          {est.discount > 0 ? <div className="summaryLine"><span>Discount</span><strong>- Rs. {est.discount.toFixed(0)}</strong></div> : null}
          <div className="summaryLine"><span>Shipping</span><strong>Rs. {shippingFee}</strong></div>
          <div className="summaryLine"><span>Tax (5%)</span><strong>Rs. {tax}</strong></div>
          <div className="summaryLine totalLine"><span>Total</span><strong>Rs. {orderTotal.toFixed(0)}</strong></div>
        </div>
        <div className="row">
          <button type="button" className="secondary" onClick={() => setStep(2)}>Back</button>
          <button type="button" onClick={checkout} disabled={items.length === 0 || !selectedAddressId}>Pay & Place Order</button>
        </div>
      </>}
    </div>
  </div>;
}

type BuyerOrderRow = {
  id: string;
  status?: string;
  totalAmount?: number;
  merchandiseSubtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingAmount?: number;
  couponCode?: string;
  paymentMethod?: string;
  paymentStatus?: string;
};

export function Orders({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const [orders, setOrders] = useState<BuyerOrderRow[]>([]);

  async function refresh() {
    const r = await api.get("/orders");
    setOrders(r.data);
  }

  useEffect(() => { void refresh(); }, []);

  async function cancelOrder(orderId: string) {
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      onToast({ type: "success", text: "Order cancelled." });
      await refresh();
    } catch (err: unknown) {
      onToast({ type: "error", text: getErrorMessage(err, "Could not cancel order.") });
    }
  }

  function timelineIndex(status: string) {
    const idx = ORDER_TIMELINE_STEPS.indexOf((status || "PLACED") as (typeof ORDER_TIMELINE_STEPS)[number]);
    return idx < 0 ? 0 : idx;
  }

  return <div className="page buyerTheme modernDash">
    <ModernDashHeader
      theme="buyer"
      eyebrow="Purchases"
      title="Order history"
      subhead="Track status from placed to delivered for every purchase."
      actions={
        <div className="row">
          <Link to="/buyer/dashboard"><button type="button" className="secondary">Back</button></Link>
          <button type="button" className="secondary" onClick={onLogout}>Logout</button>
        </div>
      }
    />
    {orders.map((o) => <div className="listRow modernDataRow orderCardModern" key={o.id}>
      <div className="orderCardModernLead">
        <strong>Order {o.id.slice(0, 8)}</strong>
        <div className="orderMetaPills">
          <span className="buyerPill">Rs. {Number(o.totalAmount ?? 0).toFixed(0)}</span>
          <span className="buyerPill">{o.paymentMethod}</span>
          <span className="buyerPill">{o.paymentStatus}</span>
          {o.status === "PLACED" ? (
            <button type="button" className="secondary" onClick={() => void cancelOrder(o.id)}>Cancel order</button>
          ) : null}
        </div>
      </div>
      {(o.merchandiseSubtotal != null || o.discountAmount != null || o.couponCode) ? (
        <div className="orderBreakdown muted smallPrint">
          {o.merchandiseSubtotal != null ? <span>Merchandise Rs.{Number(o.merchandiseSubtotal).toFixed(0)}</span> : null}
          {o.discountAmount != null && Number(o.discountAmount) > 0 ? <span> · Discount -Rs.{Number(o.discountAmount).toFixed(0)}</span> : null}
          {o.shippingAmount != null ? <span> · Ship Rs.{Number(o.shippingAmount).toFixed(0)}</span> : null}
          {o.taxAmount != null ? <span> · Tax Rs.{Number(o.taxAmount).toFixed(0)}</span> : null}
          {o.couponCode ? <span> · Code {o.couponCode}</span> : null}
        </div>
      ) : null}
      <div className="timeline">
        {ORDER_TIMELINE_STEPS.map((s, index) =>
          <span key={s} className={index <= timelineIndex(o.status || "") ? "timelineDot active" : "timelineDot"}>{s.replaceAll("_", " ")}</span>
        )}
      </div>
    </div>)}
  </div>;
}
