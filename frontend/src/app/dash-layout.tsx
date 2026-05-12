import type { ReactNode } from "react";

export function ModernDashHeader({
  eyebrow,
  title,
  subhead,
  theme,
  actions,
}: {
  eyebrow: string;
  title: string;
  subhead: string;
  theme: "buyer" | "seller";
  actions: ReactNode;
}) {
  return (
    <header className={`dashboardHeader modernDashHeader modernDashHeader--${theme}`}>
      <div className="modernDashHeaderLead">
        <p className={`dashEyebrow dashEyebrow--${theme}`}>{eyebrow}</p>
        <h2>{title}</h2>
        <p className="dashSubhead">{subhead}</p>
      </div>
      <div className="dashHeaderActions modernDashToolbar">{actions}</div>
    </header>
  );
}

function StatIconBooks() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function StatIconCart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
function StatIconOrders() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function StatIconHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function StatIconBox() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.27 6.96 8.73 5.05 8.73-5.05M12 22.08V12" />
    </svg>
  );
}
function StatIconTrend() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M22 7l-8.97 8.97a2.12 2.12 0 0 1-3 0L9 14l-6 6" />
      <path d="M16 7h6v6" />
    </svg>
  );
}
function StatIconAlert() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
    </svg>
  );
}
function StatIconRupee() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export const BuyerStatIcons = { books: StatIconBooks, cart: StatIconCart, orders: StatIconOrders, heart: StatIconHeart };
export const SellerStatIcons = { box: StatIconBox, trend: StatIconTrend, rupee: StatIconRupee, alert: StatIconAlert };

export function ThemeStatTile({
  theme,
  label,
  value,
  hint,
  icon,
}: {
  theme: "buyer" | "seller";
  label: string;
  value: ReactNode;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className={`statTile modernStatTile modernStatTile--${theme}`}>
      <div className="modernStatTileTop">
        <h3>{label}</h3>
        <span className={`modernStatIconWrap modernStatIconWrap--${theme}`} aria-hidden>
          {icon}
        </span>
      </div>
      <p className="price">{value}</p>
      <p className="statHint">{hint}</p>
    </div>
  );
}
