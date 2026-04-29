import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TOAST_DURATION_MS, getStoredUser, setToken } from "./app/shared";
import type { SessionUser, Toast } from "./app/shared";
import { AppRoutes } from "./routes";

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(getStoredUser);
  const nav = useNavigate();
  const [toast, setToast] = useState<Toast | null>(null);

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
    <AppRoutes user={user} onLogin={setUser} onLogout={logout} onToast={setToast} />
  </div>;
}
