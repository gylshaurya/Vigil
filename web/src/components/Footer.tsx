export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Vigil — a circuit breaker for your wallet. Built for the Decentralized Coordination Layers, Censorship Resistance, and Self-Sovereignty tracks.</p>
        <p>No private key is ever sent to your browser · veto and test actions are signed by a server holding only small testnet funds.</p>
      </div>
    </footer>
  );
}
