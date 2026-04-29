import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, getErrorMessage } from "../app/shared";
import type { PaymentMethod, Toast } from "../app/shared";

export function PaymentMethodsManager({ onToast }: { onToast: (toast: Toast) => void }) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [type, setType] = useState<"CARD" | "UPI">("CARD");
  const [label, setLabel] = useState("");
  const [provider, setProvider] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [upiId, setUpiId] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  async function loadMethods() {
    try {
      const { data } = await api.get("/payment-methods");
      setMethods(data);
    } catch (err: any) {
      onToast({ type: "error", text: getErrorMessage(err, "Could not load payment methods.") });
    }
  }
  useEffect(() => { loadMethods(); }, []);

  async function saveMethod(e: FormEvent) {
    e.preventDefault();
    if (type === "CARD" && cardLast4.trim().length !== 4) {
      onToast({ type: "error", text: "Card last 4 digits required." });
      return;
    }
    if (type === "UPI" && !upiId.trim()) {
      onToast({ type: "error", text: "UPI ID is required." });
      return;
    }
    try {
      await api.post("/payment-methods", {
        type,
        label: label.trim(),
        provider: provider.trim(),
        cardLast4: type === "CARD" ? cardLast4.trim() : "",
        upiId: type === "UPI" ? upiId.trim() : "",
        default: isDefault
      });
      setLabel("");
      setProvider("");
      setCardLast4("");
      setUpiId("");
      setIsDefault(false);
      onToast({ type: "success", text: "Payment method saved." });
      loadMethods();
    } catch (err: any) {
      onToast({ type: "error", text: getErrorMessage(err, "Could not save payment method.") });
    }
  }

  return <>
    <div className="detailSection">
      <h3>Saved Payment Methods</h3>
      {methods.length === 0 && <p className="muted">No saved payment methods yet.</p>}
      {methods.map((m) => <div key={m.id} className="listRow">
        <span>
          {m.type === "CARD" ? `Card •••• ${m.cardLast4 || "----"}` : `UPI • ${m.upiId || "-"}`}
          {" "}• {m.provider || "Generic"} {m.label ? `(${m.label})` : ""}
        </span>
        <div className="row">
          {m.default ? <span className="successText">Default</span> : <button className="secondary" onClick={async () => {
            try {
              await api.patch(`/payment-methods/${m.id}/default`);
              loadMethods();
              onToast({ type: "success", text: "Default payment method updated." });
            } catch (err: any) {
              onToast({ type: "error", text: getErrorMessage(err, "Could not set default payment method.") });
            }
          }}>Set Default</button>}
          <button className="secondary" onClick={async () => {
            try {
              await api.delete(`/payment-methods/${m.id}`);
              loadMethods();
              onToast({ type: "success", text: "Payment method removed." });
            } catch (err: any) {
              onToast({ type: "error", text: getErrorMessage(err, "Could not remove payment method.") });
            }
          }}>Delete</button>
        </div>
      </div>)}
    </div>
    <form className="searchCard" onSubmit={saveMethod}>
      <select value={type} onChange={(e) => setType(e.target.value as "CARD" | "UPI")}>
        <option value="CARD">Card</option>
        <option value="UPI">UPI</option>
      </select>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (Home / Work)" />
      <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Provider (Visa / GPay)" />
      {type === "CARD" ? (
        <input value={cardLast4} onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Last 4 digits" />
      ) : (
        <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="UPI ID (name@bank)" />
      )}
      <label className="muted"><input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Set as default</label>
      <button type="submit">Save Method</button>
    </form>
  </>;
}
