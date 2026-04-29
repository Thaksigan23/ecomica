import { Navigate, Route, Routes } from "react-router-dom";
import { RoleGuard } from "./app/RoleGuard";
import type { SessionUser, Toast } from "./app/shared";
import { AdminDashboard } from "./pages/admin";
import { Landing, Login, Register } from "./pages/auth";
import { BookDetails, BuyerDashboard, BuyerProfile, CartAndPayment, Orders } from "./pages/buyer";
import { SellerDashboard, SellerProfile } from "./pages/seller";

type AppRoutesProps = {
  user: SessionUser | null;
  onLogin: (user: SessionUser) => void;
  onLogout: () => void;
  onToast: (toast: Toast) => void;
};

export function AppRoutes({ user, onLogin, onLogout, onToast }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login onLogin={onLogin} onToast={onToast} />} />
      <Route path="/register" element={<Register onToast={onToast} />} />
      <Route path="/buyer/dashboard" element={<RoleGuard allow={["BUYER", "ADMIN"]} user={user}><BuyerDashboard onLogout={onLogout} onToast={onToast} /></RoleGuard>} />
      <Route path="/buyer/profile" element={<RoleGuard allow={["BUYER", "ADMIN"]} user={user}><BuyerProfile onLogout={onLogout} onToast={onToast} /></RoleGuard>} />
      <Route path="/buyer/book/:id" element={<RoleGuard allow={["BUYER", "ADMIN"]} user={user}><BookDetails onLogout={onLogout} onToast={onToast} /></RoleGuard>} />
      <Route path="/buyer/cart" element={<RoleGuard allow={["BUYER", "ADMIN"]} user={user}><CartAndPayment onLogout={onLogout} onToast={onToast} /></RoleGuard>} />
      <Route path="/buyer/orders" element={<RoleGuard allow={["BUYER", "ADMIN"]} user={user}><Orders onLogout={onLogout} /></RoleGuard>} />
      <Route path="/seller/dashboard" element={<RoleGuard allow={["SELLER", "ADMIN"]} user={user}><SellerDashboard onLogout={onLogout} onToast={onToast} /></RoleGuard>} />
      <Route path="/seller/profile" element={<RoleGuard allow={["SELLER", "ADMIN"]} user={user}><SellerProfile onLogout={onLogout} onToast={onToast} /></RoleGuard>} />
      <Route path="/admin/dashboard" element={<RoleGuard allow={["ADMIN"]} user={user}><AdminDashboard onLogout={onLogout} onToast={onToast} /></RoleGuard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
