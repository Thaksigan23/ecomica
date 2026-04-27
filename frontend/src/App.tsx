import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { ReactNode } from "react";
import { Link, Route, Routes, useNavigate, Navigate, useSearchParams, useLocation, useParams } from "react-router-dom";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080/api" });
const FALLBACK_BOOK_IMAGE = "https://images-na.ssl-images-amazon.com/images/I/81-349iYbfL._AC_UF1000,1000_QL80_.jpg";

type Role = "BUYER" | "SELLER" | "ADMIN";
type SessionUser = { role: Role; name: string; email: string };
type Book = {
  id: string;
  title: string;
  author: string;
  price: number;
  description?: string;
  imageUrl?: string;
  categoryId?: string;
  sellerEmail?: string;
  moderationStatus?: string;
  active?: boolean;
};
type Category = { id: string; name: string };
type CartItem = { id: string; bookId: string; quantity: number };
type Review = { id: string; userId: string; bookId: string; rating: number; comment?: string };
type CartRow = CartItem & { book?: Book };
type Address = {
  id: string;
  fullName: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  isDefault?: boolean;
};
type SellerAnalytics = {
  bookCount: number;
  totalSoldUnits: number;
  totalRevenue: number;
  topBooks: Array<{ bookId: string; title: string; soldUnits: number; revenue: number }>;
  lowStock: Array<{ bookId: string; title: string; stock: number }>;
};
type AdminUser = { id: string; name: string; email: string; role: string; blocked?: boolean };
type Toast = { type: "success" | "error"; text: string };
const TOAST_DURATION_MS = 2200;

function SafeImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  return (
    <img
      src={src || FALLBACK_BOOK_IMAGE}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = FALLBACK_BOOK_IMAGE;
      }}
    />
  );
}

function setToken(token: string | null) {
  if (token) {
    localStorage.setItem("token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;
  }
}
const initialToken = localStorage.getItem("token");
if (initialToken) setToken(initialToken);

function Landing() {
  const heroSlides = [
    { title: "Today's Book Deals", subtitle: "Up to 60% off on top picks for buyers and learners.", className: "slideDeals" },
    { title: "Exam Prep Week", subtitle: "Competitive and placement books at limited-time prices.", className: "slideExam" },
    { title: "Manga Mania", subtitle: "Explore best-selling manga collections and comics.", className: "slideManga" }
  ];
  const [slideIndex, setSlideIndex] = useState(0);

  function nextSlide() {
    setSlideIndex((prev) => (prev + 1) % heroSlides.length);
  }

  function prevSlide() {
    setSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }

  useEffect(() => {
    const timer = window.setInterval(nextSlide, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const currentSlide = heroSlides[slideIndex];

  return <div className="page">
    <div className="amazonHeaderWrap">
      <div className="amazonHeader">
      <div className="brand">ecomica</div>
      <div className="headerSearch">
        <select>
          <option>All</option>
          <option>Books</option>
          <option>Education</option>
          <option>Comics</option>
        </select>
        <input placeholder="Search books, authors and categories" />
        <button>Search</button>
      </div>
      <div className="headerLinks">
        <span>Best Sellers</span>
        <span>New Releases</span>
        <span>Gift Ideas</span>
      </div>
    </div>
      <div className="signinPopover">
        <button>Sign in</button>
        <p>New customer? <Link to="/register">Start here.</Link></p>
      </div>
    </div>

    <div className="categoryStrip">
      <span>Fiction</span>
      <span>Self-Help</span>
      <span>Exam Prep</span>
      <span>Programming</span>
      <span>Manga</span>
      <span>Kids</span>
    </div>

    <div className={`heroBanner amazonHero ${currentSlide.className}`}>
      <button className="heroArrow heroArrowLeft" onClick={prevSlide}>‹</button>
      <div>
        <h2>{currentSlide.title}</h2>
        <p>{currentSlide.subtitle}</p>
      </div>
      <button className="heroArrow heroArrowRight" onClick={nextSlide}>›</button>
    </div>

    <div className="landingGrid landingCards">
      <Link className="cardLink" to="/buyer/dashboard?q=top%20picks">
      <div className="productCard clickableCard">
        <h3>Top Picks For You</h3>
        <div className="tileGrid">
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9781847941831-L.jpg" alt="Atomic Habits" />
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9780061122415-L.jpg" alt="The Alchemist" />
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9781591163596-L.jpg" alt="Naruto" />
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9781617291203-L.jpg" alt="Spring Boot in Action" />
        </div>
      </div>
      </Link>
      <Link className="cardLink" to="/buyer/dashboard?q=independent%20publishers">
      <div className="productCard clickableCard">
        <h3>Seller Spotlight</h3>
        <div className="tileGrid">
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9781612681139-L.jpg" alt="Seller book 1" />
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9780439785969-L.jpg" alt="Seller book 2" />
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg" alt="Seller book 3" />
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9780593230251-L.jpg" alt="Seller book 4" />
        </div>
      </div>
      </Link>
      <Link className="cardLink" to="/buyer/dashboard?category=Education">
      <div className="productCard clickableCard">
        <h3>Study Zone</h3>
        <div className="tileGrid">
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9780143127741-L.jpg" alt="Study book 1" />
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg" alt="Study book 2" />
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9780241309728-L.jpg" alt="Study book 3" />
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9780671027032-L.jpg" alt="Study book 4" />
        </div>
      </div>
      </Link>
      <Link className="cardLink" to="/buyer/dashboard?category=Comics">
      <div className="productCard clickableCard">
        <h3>Comics & Manga</h3>
        <div className="tileGrid">
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9781421539898-L.jpg" alt="Manga 1" />
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9781421560748-L.jpg" alt="Manga 2" />
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9781421576091-L.jpg" alt="Manga 3" />
          <SafeImage src="https://covers.openlibrary.org/b/isbn/9781591163596-L.jpg" alt="Manga 4" />
        </div>
      </div>
      </Link>
    </div>

    <div className="authActions">
      <Link to="/login"><button>Login</button></Link>
      <Link to="/register"><button className="secondary">Register</button></Link>
    </div>
    <button className="backToTop" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      Back to top
    </button>
  </div>;
}

function BuyerDashboard({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [searchParams] = useSearchParams();

  async function load() {
    const queryFromUrl = searchParams.get("q") || "";
    const effectiveQuery = query || queryFromUrl;
    const params: Record<string, string> = {};
    if (effectiveQuery) params.q = effectiveQuery;
    if (categoryId) params.categoryId = categoryId;
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
    <div className="dashboardHeader">
      <h2>Buyer Dashboard</h2>
      <div className="row">
        <Link to="/buyer/cart"><button>Cart & Payment</button></Link>
        <Link to="/buyer/orders"><button className="secondary">Orders</button></Link>
        <button className="secondary" onClick={onLogout}>Logout</button>
      </div>
    </div>
    <div className="searchCard">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search books" />
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">All Categories</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button onClick={load}>Search</button>
    </div>
    <div className="grid">
      {books.map((b) => <div key={b.id} className="productCard">
        <SafeImage src={b.imageUrl} alt={b.title} />
        <h3>{b.title}</h3>
        <p className="author">by {b.author}</p>
        <p className="price">Rs. {b.price}</p>
        <p className="description">{b.description}</p>
        <div className="row">
          <Link to={`/buyer/book/${b.id}`}><button className="secondary">View Details</button></Link>
          <button onClick={() => addToCart(b.id)}>Add to Cart</button>
          <button className="secondary" onClick={() => addToWishlist(b.id)}>Wishlist</button>
        </div>
      </div>)}
    </div>
  </div>;
}

function BookDetails({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Book[]>([]);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  async function load() {
    if (!id) return;
    const [bookRes, reviewsRes, booksRes] = await Promise.all([
      api.get(`/books/${id}`),
      api.get(`/reviews/${id}`),
      api.get("/books")
    ]);
    const loadedBook: Book = bookRes.data;
    setBook(loadedBook);
    setReviews(reviewsRes.data);
    setRelated(
      (booksRes.data as Book[])
        .filter((x) => x.id !== id && x.categoryId === loadedBook.categoryId)
        .slice(0, 4)
    );
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

  if (!book) {
    return <div className="page buyerTheme modernDash"><p>Loading book details...</p></div>;
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
    : "0.0";

  return <div className="page buyerTheme modernDash">
    <div className="dashboardHeader">
      <h2>Book Details</h2>
      <div className="row">
        <Link to="/buyer/dashboard"><button className="secondary">Back</button></Link>
        <button className="secondary" onClick={onLogout}>Logout</button>
      </div>
    </div>
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
        <div className="row">
          <button onClick={addCurrentBookToCart}>Add to Cart</button>
          <button className="secondary" onClick={addCurrentBookToWishlist}>Wishlist</button>
        </div>
      </div>
    </div>

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
      {reviews.map((r) => <div key={r.id} className="listRow">
        <span>★ {r.rating} - {r.comment || "No comment"}</span>
        <span className="muted">{r.userId}</span>
      </div>)}
    </div>

    <div className="detailSection">
      <h3>Related books</h3>
      <div className="grid">
        {related.map((rb) => <div key={rb.id} className="productCard">
          <SafeImage src={rb.imageUrl} alt={rb.title} />
          <h3>{rb.title}</h3>
          <p className="author">{rb.author}</p>
          <p className="price">Rs. {rb.price}</p>
          <Link to={`/buyer/book/${rb.id}`}><button className="secondary">View</button></Link>
        </div>)}
      </div>
    </div>
  </div>;
}

function SellerDashboard({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    const [booksRes, analyticsRes] = await Promise.all([api.get("/seller/books"), api.get("/seller/analytics")]);
    setBooks(booksRes.data);
    setAnalytics(analyticsRes.data);
  };
  useEffect(() => { load(); }, []);

  return <div className="page sellerTheme modernDash">
    <div className="dashboardHeader">
      <h2>Seller Dashboard</h2>
      <button className="secondary" onClick={onLogout}>Logout</button>
    </div>
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
    <form className="searchCard" onSubmit={async (e) => {
      e.preventDefault();
      try {
        await api.post("/books", { title, author, price: Number(price), stock: 20, imageUrl, description, active: true });
        setTitle(""); setAuthor(""); setPrice(""); setImageUrl(""); setDescription("");
        onToast({ type: "success", text: "Book submitted for moderation." });
        load();
      } catch {
        onToast({ type: "error", text: "Could not create book listing." });
      }
    }}>
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" />
      <input required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
      <input required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <button type="submit">Add Book</button>
    </form>
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
    {books.map((b) => <div className="listRow" key={b.id}>
      <span>{b.title} - Rs. {b.price}</span>
      <button onClick={async () => {
        try {
          await api.delete(`/books/${b.id}`);
          onToast({ type: "success", text: "Book deleted." });
          load();
        } catch {
          onToast({ type: "error", text: "Could not delete book." });
        }
      }}>Delete</button>
    </div>)}
  </div>;
}

function CartAndPayment({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
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
  const shippingFee = items.length ? 49 : 0;
  const tax = Math.round(subtotal * 0.05);
  const orderTotal = subtotal + shippingFee + tax;

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
    const payload = { paymentMethod, cardNumber, cardName, expiry, cvv, shippingAddress: finalAddress };
    try {
      const { data } = await api.post("/orders/checkout", payload);
      onToast({ type: "success", text: `Order placed. Payment: ${data.paymentStatus}.` });
      setStep(1);
      load();
    } catch {
      onToast({ type: "error", text: "Could not place order." });
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
    <div className="dashboardHeader">
      <h2>Cart & Payment</h2>
      <div className="row">
        <Link to="/buyer/dashboard"><button className="secondary">Back</button></Link>
        <button className="secondary" onClick={onLogout}>Logout</button>
      </div>
    </div>
    <div className="cartLayout">
      <div>
        {items.length === 0 && <div className="listRow"><span>Your cart is empty.</span></div>}
        {items.map((i) => <div key={i.id} className="listRow cartRow">
          <div className="cartBookInfo">
            <SafeImage src={i.book?.imageUrl} alt={i.book?.title || i.bookId} className="cartThumb" />
            <div>
              <strong>{i.book?.title || i.bookId}</strong>
              <div className="muted">by {i.book?.author || "Unknown"}</div>
              <div className="muted">Unit: Rs. {i.book?.price || 0}</div>
            </div>
          </div>
          <div className="cartActions">
            <button className="secondary" onClick={() => changeQuantity(i, i.quantity - 1)}>-</button>
            <span>{i.quantity}</span>
            <button className="secondary" onClick={() => changeQuantity(i, i.quantity + 1)}>+</button>
            <strong>Rs. {(Number(i.book?.price || 0) * i.quantity).toFixed(0)}</strong>
            <button onClick={async () => {
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
        <div className="summaryLine"><span>Shipping</span><strong>Rs. {shippingFee}</strong></div>
        <div className="summaryLine"><span>Tax (5%)</span><strong>Rs. {tax}</strong></div>
        <div className="summaryLine totalLine"><span>Total</span><strong>Rs. {orderTotal.toFixed(0)}</strong></div>
      </div>
    </div>
    <div className="formCard">
      <div className="checkoutSteps">
        <button className={step === 1 ? "" : "secondary"} onClick={() => setStep(1)}>1. Address</button>
        <button className={step === 2 ? "" : "secondary"} onClick={() => setStep(2)}>2. Payment</button>
        <button className={step === 3 ? "" : "secondary"} onClick={() => setStep(3)}>3. Review</button>
      </div>

      {step === 1 && <>
        <h3>Address Book</h3>
        {addresses.map((a) => <label key={a.id} className="listRow addressRow">
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
        <button onClick={() => setStep(2)} disabled={!selectedAddressId}>Continue to Payment</button>
      </>}

      {step === 2 && <>
        <h3>Payment Method</h3>
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
          <button className="secondary" onClick={() => setStep(1)}>Back</button>
          <button onClick={() => setStep(3)}>Continue to Review</button>
        </div>
      </>}

      {step === 3 && <>
        <h3>Review Order</h3>
        <p className="muted"><strong>Deliver to:</strong> {selectedAddress ? `${selectedAddress.fullName}, ${selectedAddress.line1}, ${selectedAddress.city}` : "No address selected"}</p>
        <p className="muted"><strong>Payment:</strong> {paymentMethod}</p>
        <p className="muted"><strong>Total:</strong> Rs. {orderTotal.toFixed(0)}</p>
        <div className="row">
          <button className="secondary" onClick={() => setStep(2)}>Back</button>
          <button onClick={checkout} disabled={items.length === 0 || !selectedAddressId}>Pay & Place Order</button>
        </div>
      </>}
    </div>
  </div>;
}

function Orders({ onLogout }: { onLogout: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { api.get("/orders").then((r) => setOrders(r.data)); }, []);

  function timelineIndex(status: string) {
    const steps = ["PLACED", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
    const idx = steps.indexOf(status || "PLACED");
    return idx < 0 ? 0 : idx;
  }

  return <div className="page buyerTheme modernDash">
    <div className="dashboardHeader">
      <h2>Order History</h2>
      <div className="row">
        <Link to="/buyer/dashboard"><button className="secondary">Back</button></Link>
        <button className="secondary" onClick={onLogout}>Logout</button>
      </div>
    </div>
    {orders.map((o) => <div className="listRow orderTimelineCard" key={o.id}>
      <div>
        <strong>Order {o.id.slice(0, 8)}</strong>
        <div className="muted">Rs. {o.totalAmount} • {o.paymentMethod} • {o.paymentStatus}</div>
      </div>
      <div className="timeline">
        {["PLACED", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].map((s, index) =>
          <span key={s} className={index <= timelineIndex(o.status) ? "timelineDot active" : "timelineDot"}>{s.replaceAll("_", " ")}</span>
        )}
      </div>
    </div>)}
  </div>;
}

function AdminDashboard({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
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
      <h2>Admin Dashboard</h2>
      <button className="secondary" onClick={onLogout}>Logout</button>
    </div>
    {error && <p className="errorText">{error}</p>}
    <div className="landingGrid">
      <div className="productCard">
        <h3>Total Users</h3>
        <p className="price">{users.length}</p>
      </div>
      <div className="productCard">
        <h3>Total Orders</h3>
        <p className="price">{orders.length}</p>
      </div>
      <div className="productCard">
        <h3>Total Revenue</h3>
        <p className="price">Rs. {revenue.toFixed(0)}</p>
      </div>
      <div className="productCard">
        <h3>Pending Approvals</h3>
        <p className="price">{pendingBooksCount}</p>
      </div>
    </div>
    <h3>Recent Orders</h3>
    {orders.slice(0, 10).map((o) => <div key={o.id} className="listRow">
      <span>{o.userId} | {o.paymentMethod} | {o.paymentStatus}</span>
      <span>Rs. {o.totalAmount}</span>
    </div>)}
    <h3>Users</h3>
    {users.slice(0, 10).map((u) => <div key={u.id} className="listRow">
      <span>{u.name} ({u.email}) • {u.role}</span>
      <div className="row">
        <span className={u.blocked ? "errorText" : "successText"}>{u.blocked ? "Blocked" : "Active"}</span>
        <button className="secondary" onClick={() => toggleUserBlock(u)}>{u.blocked ? "Unblock" : "Block"}</button>
      </div>
    </div>)}
    <h3>Book Moderation</h3>
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
      <span>{b.title} • {b.sellerEmail || "N/A"} • {b.moderationStatus || "PENDING"}</span>
      <div className="row">
        <button className="secondary" onClick={() => moderateBook(b.id, "APPROVED")}>Approve</button>
        <button className="secondary" onClick={() => moderateBook(b.id, "REJECTED")}>Reject</button>
        <button className="secondary" onClick={() => moderateBook(b.id, "PENDING")}>Reset</button>
      </div>
    </div>)}
    {filteredBooks.length === 0 && <p className="muted">No books in this moderation filter.</p>}
    {filteredBooks.length > visibleBooks.length && (
      <div className="row">
        <button onClick={() => setVisibleBookCount((c) => c + MODERATION_PAGE_SIZE)}>
          Load more ({filteredBooks.length - visibleBooks.length} remaining)
        </button>
      </div>
    )}
  </div>;
}

function Login({ onLogin, onToast }: { onLogin: (user: SessionUser) => void; onToast: (toast: Toast) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  function normalizeRole(rawRole: string): Role {
    if (rawRole === "SELLER" || rawRole === "ADMIN") return rawRole;
    return "BUYER";
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setToken(data.token);
      const nextUser = { role: normalizeRole(data.role), name: data.name, email: data.email };
      localStorage.setItem("user", JSON.stringify(nextUser));
      onLogin(nextUser);
      const redirect = searchParams.get("redirect") || "";
      const canUseBuyerRedirect = (nextUser.role === "BUYER" || nextUser.role === "ADMIN") && redirect.startsWith("/buyer/");
      const canUseSellerRedirect = (nextUser.role === "SELLER" || nextUser.role === "ADMIN") && redirect.startsWith("/seller/");
      const canUseAdminRedirect = nextUser.role === "ADMIN" && redirect.startsWith("/admin/");
      if (redirect && (canUseBuyerRedirect || canUseSellerRedirect || canUseAdminRedirect)) {
        nav(redirect);
      } else if (nextUser.role === "SELLER") {
        nav("/seller/dashboard");
      } else if (nextUser.role === "ADMIN") {
        nav("/admin/dashboard");
      } else {
        nav("/buyer/dashboard");
      }
      setError("");
      onToast({ type: "success", text: "Login successful." });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "Login failed. Check backend is running and credentials are correct.";
      setError(errorMessage);
      onToast({ type: "error", text: errorMessage });
    }
  }
  return <div className="page authPage">
    <div className="authTopBar">
      <Link to="/"><button className="secondary">← Back to Landing</button></Link>
    </div>
    <form className="formCard modernAuthCard" onSubmit={submit}>
      <h2>Sign In</h2>
      <p className="muted">Access buyer, seller, or admin dashboards.</p>
      <input required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Login</button>
      {error && <span className="errorText">{error}</span>}
      <span className="muted">Demo buyer: buyer@ecomica.com / buyer123</span>
      <span className="muted">Demo seller: seller@ecomica.com / seller123</span>
      <span className="muted">Demo admin: admin@ecomica.com / admin123</span>
    </form>
  </div>;
}

function Register({ onToast }: { onToast: (toast: Toast) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("BUYER");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const nav = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post("/auth/register", { name, email, password, role });
      setOk("Registration successful. Please login.");
      setError("");
      onToast({ type: "success", text: "Registration successful. Please login." });
      nav("/login");
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "Registration failed. Email may already be used.";
      setError(errorMessage);
      setOk("");
      onToast({ type: "error", text: errorMessage });
    }
  }
  return <div className="page authPage">
    <div className="authTopBar">
      <Link to="/"><button className="secondary">← Back to Landing</button></Link>
    </div>
    <form className="formCard modernAuthCard" onSubmit={submit}>
      <h2>Create Account</h2>
      <p className="muted">Register as buyer or seller in seconds.</p>
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <input required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
        <option value="BUYER">Buyer account</option>
        <option value="SELLER">Seller account</option>
      </select>
      <button type="submit">Register</button>
      {error && <span className="errorText">{error}</span>}
      {ok && <span className="successText">{ok}</span>}
    </form>
  </div>;
}

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) as SessionUser : null;
  });
  const nav = useNavigate();
  const [toast, setToast] = useState<Toast | null>(null);
  const canBuy = user?.role === "BUYER" || user?.role === "ADMIN";
  const canSell = user?.role === "SELLER" || user?.role === "ADMIN";

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("user");
    nav("/");
  }

  function BuyerGuard({ children }: { children: ReactNode }) {
    const location = useLocation();
    if (canBuy) return children;
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  function SellerGuard({ children }: { children: ReactNode }) {
    const location = useLocation();
    if (canSell) return children;
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  function AdminGuard({ children }: { children: ReactNode }) {
    const location = useLocation();
    if (user?.role === "ADMIN") return children;
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <div>
    {toast && (
      <div className={`floatingToast ${toast.type === "success" ? "toastSuccess" : "toastError"}`}>
        <div className="toastBody">
          <span className="toastIcon" aria-hidden="true">{toast.type === "success" ? "✓" : "!"}</span>
          <span>{toast.text}</span>
        </div>
        <button className="secondary toastClose" onClick={() => setToast(null)}>x</button>
        <div className="toastProgress" style={{ animationDuration: `${TOAST_DURATION_MS}ms` }} />
      </div>
    )}
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login onLogin={setUser} onToast={setToast} />} />
      <Route path="/register" element={<Register onToast={setToast} />} />
      <Route path="/buyer/dashboard" element={<BuyerGuard><BuyerDashboard onLogout={logout} onToast={setToast} /></BuyerGuard>} />
      <Route path="/buyer/book/:id" element={<BuyerGuard><BookDetails onLogout={logout} onToast={setToast} /></BuyerGuard>} />
      <Route path="/buyer/cart" element={<BuyerGuard><CartAndPayment onLogout={logout} onToast={setToast} /></BuyerGuard>} />
      <Route path="/buyer/orders" element={<BuyerGuard><Orders onLogout={logout} /></BuyerGuard>} />
      <Route path="/seller/dashboard" element={<SellerGuard><SellerDashboard onLogout={logout} onToast={setToast} /></SellerGuard>} />
      <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard onLogout={logout} onToast={setToast} /></AdminGuard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </div>;
}
