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
