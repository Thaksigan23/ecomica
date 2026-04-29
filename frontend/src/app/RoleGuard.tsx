import type { GuardProps, Role, SessionUser } from "./shared";
import { Navigate, useLocation } from "react-router-dom";

type Props = GuardProps & { user: SessionUser | null };

export function RoleGuard({ children, allow, user }: Props) {
  const location = useLocation();
  if (user?.role && (allow as Role[]).includes(user.role)) return children;
  return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
}
