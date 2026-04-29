import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ORDER_TIMELINE_STEPS, SafeImage, api, getErrorMessage } from "../app/shared";
import type { Address, Book, CartItem, CartRow, Category, ProfileInfo, Review, Toast } from "../app/shared";
import { PaymentMethodsManager } from "./shared-components";

export function BuyerDashboard({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
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
        <Link to="/buyer/profile"><button className="secondary">Profile</button></Link>
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

export function BookDetails({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
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

export function BuyerProfile({ onLogout, onToast }: { onLogout: () => void; onToast: (toast: Toast) => void }) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  async function load() {
    const [profileRes, ordersRes, wishlistRes] = await Promise.all([
      api.get("/profile/me"),
      api.get("/orders"),
      api.get("/wishlist")
    ]);
    setProfile(profileRes.data);
    setName(profileRes.data?.name || "");
    setPhone(profileRes.data?.phone || "");
    setAvatarUrl(profileRes.data?.avatarUrl || "");
    setOrders(ordersRes.data || []);
    setWishlist(wishlistRes.data || []);
  }
  useEffect(() => { load(); }, []);

  return <div className="page buyerTheme modernDash">
    <div className="dashboardHeader">
      <h2>Buyer Profile</h2>
      <div className="row">
        <Link to="/buyer/dashboard"><button className="secondary">Back</button></Link>
        <button className="secondary" onClick={onLogout}>Logout</button>
      </div>
    </div>
    <div className="profileGrid">
      <div className="detailSection">
        <h3>Account Overview</h3>
        <div className="profileHeader">
          <SafeImage src={avatarUrl || profile?.avatarUrl} alt={profile?.name || "Buyer"} className="avatar" />
          <div>
            <strong>{profile?.name || "Buyer"}</strong>
            <div className="muted">{profile?.email}</div>
            <div className="muted">Prime Reader Tier • Free delivery above Rs. 999</div>
          </div>
        </div>
        <form className="searchCard" onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.patch("/profile/me", { name, phone, avatarUrl });
            onToast({ type: "success", text: "Profile updated." });
            load();
          } catch (err: any) {
            onToast({ type: "error", text: getErrorMessage(err, "Could not update profile.") });
          }
        }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
          <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="Avatar URL" />
          <button type="submit">Save Profile</button>
        </form>
      </div>
      <div className="detailSection">
        <h3>Amazon/Daraz Style Quick Stats</h3>
        <div className="listRow"><span>Orders placed</span><strong>{orders.length}</strong></div>
        <div className="listRow"><span>Wishlist items</span><strong>{wishlist.length}</strong></div>
        <div className="listRow"><span>Today's Offer</span><strong>15% off on Education books</strong></div>
        <div className="listRow"><span>Fast Delivery Benefit</span><strong>Eligible</strong></div>
      </div>
    </div>
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

export function Orders({ onLogout }: { onLogout: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { api.get("/orders").then((r) => setOrders(r.data)); }, []);

  function timelineIndex(status: string) {
    const idx = ORDER_TIMELINE_STEPS.indexOf((status || "PLACED") as (typeof ORDER_TIMELINE_STEPS)[number]);
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
        {ORDER_TIMELINE_STEPS.map((s, index) =>
          <span key={s} className={index <= timelineIndex(o.status) ? "timelineDot active" : "timelineDot"}>{s.replaceAll("_", " ")}</span>
        )}
      </div>
    </div>)}
  </div>;
}
