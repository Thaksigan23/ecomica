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
