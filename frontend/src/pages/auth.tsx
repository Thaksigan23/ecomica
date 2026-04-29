import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, normalizeRole, SafeImage, setToken } from "../app/shared";
import type { Role, SessionUser, Toast } from "../app/shared";

export function Landing() {
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

export function Login({ onLogin, onToast }: { onLogin: (user: SessionUser) => void; onToast: (toast: Toast) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const emailValue = email.trim();
      const { data } = await api.post("/auth/login", { email: emailValue, password });
      setToken(data.token);
      const nextUser = { role: normalizeRole(data.role), name: data.name, email: data.email || emailValue };
      localStorage.setItem("user", JSON.stringify(nextUser));
      onLogin(nextUser);
      const redirect = searchParams.get("redirect") || "";
      const canUseBuyerRedirect = nextUser.role === "BUYER" && redirect.startsWith("/buyer/");
      const canUseSellerRedirect = nextUser.role === "SELLER" && redirect.startsWith("/seller/");
      const canUseAdminRedirect = nextUser.role === "ADMIN" && redirect.startsWith("/admin/");
      if (nextUser.role === "ADMIN") {
        nav("/admin/dashboard");
      } else if (redirect && (canUseBuyerRedirect || canUseSellerRedirect || canUseAdminRedirect)) {
        nav(redirect);
      } else if (nextUser.role === "SELLER") {
        nav("/seller/dashboard");
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
      <span className="muted">Demo buyer 2: buyer2@ecomica.com / buyer234</span>
      <span className="muted">Demo seller 2: seller2@ecomica.com / seller234</span>
      <span className="muted">Demo admin: admin@ecomica.com / admin123</span>
    </form>
  </div>;
}

export function Register({ onToast }: { onToast: (toast: Toast) => void }) {
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
      await api.post("/auth/register", { name: name.trim(), email: email.trim(), password, role });
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
