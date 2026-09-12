const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

/** Shown above checkout so nobody mistakes a test payment for a real one. */
export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        Checkout is not finished being set up yet, so payments cannot be taken right now.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
        Payments are in test mode — no money changes hands. Use card 4242 4242 4242 4242 with any
        future expiry and any CVC.
      </div>
    );
  }
  return null;
}
