import axios from "axios";
import type { ReactNode } from "react";

export const api = axios.create({ baseURL: "/api" });
export const FALLBACK_BOOK_IMAGE = "https://images-na.ssl-images-amazon.com/images/I/81-349iYbfL._AC_UF1000,1000_QL80_.jpg";
export const TOAST_DURATION_MS = 2200;
export const ORDER_TIMELINE_STEPS = ["PLACED", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export type Role = "BUYER" | "SELLER" | "ADMIN";
export type SessionUser = { role: Role; name: string; email: string };
export type Book = {
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
export type Category = { id: string; name: string };
export type CartItem = { id: string; bookId: string; quantity: number };
export type Review = { id: string; userId: string; bookId: string; rating: number; comment?: string };
export type CartRow = CartItem & { book?: Book };
export type Address = {
  id: string;
  fullName: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  isDefault?: boolean;
};
export type SellerAnalytics = {
  bookCount: number;
  totalSoldUnits: number;
  totalRevenue: number;
  topBooks: Array<{ bookId: string; title: string; soldUnits: number; revenue: number }>;
  lowStock: Array<{ bookId: string; title: string; stock: number }>;
};
export type AdminUser = { id: string; name: string; email: string; role: string; blocked?: boolean };
export type Toast = { type: "success" | "error"; text: string };
export type PaymentMethod = {
  id: string;
  type: "CARD" | "UPI";
  label?: string;
  provider?: string;
  cardLast4?: string;
  upiId?: string;
  default?: boolean;
};
export type ProfileInfo = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
};

export type GuardProps = { children: ReactNode; allow: Role[] };

export function getErrorMessage(err: any, fallback: string) {
  return err?.response?.data?.message || err?.message || fallback;
}

export function normalizeRole(rawRole: string): Role {
  if (rawRole === "SELLER" || rawRole === "ADMIN") return rawRole;
  return "BUYER";
}

export function getStoredUser(): SessionUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionUser;
    return { ...parsed, role: normalizeRole(parsed.role) };
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function setToken(token: string | null) {
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

export function SafeImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
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
