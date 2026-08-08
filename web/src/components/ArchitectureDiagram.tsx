const GREEN = "#22c55e";
const AMBER = "#f5a524";
const RED = "#ef4444";
const VIOLET = "#a78bfa";

export function ArchitectureDiagram() {
  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 1000 700"
        role="img"
        aria-label="Owner key calls propose() on VigilVault. The policy engine sends plain, small, allowlisted transfers straight through to the recipient. Everything else — large transfers, contract calls, or changes to the vault's own policy — becomes a pending action with a countdown timer that the guardian key can veto, or that anyone can execute once the delay elapses. Actions that target the vault itself feed back into the policy engine, rewriting its own rules, which is why disabling the guard must pass through the exact same gate."
        className="w-full h-auto"
        style={{ maxWidth: "100%" }}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
          </marker>
          <marker id="arrowGreen" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={GREEN} />
          </marker>
          <marker id="arrowAmber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={AMBER} />
          </marker>
          <marker id="arrowRed" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={RED} />
          </marker>
          <marker id="arrowViolet" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={VIOLET} />
          </marker>
        </defs>

        <text x="20" y="28" fontSize="13" fill="currentColor" opacity="0.55" fontFamily="ui-monospace, monospace">
          VigilVault.sol
        </text>

        {/* Owner key */}
        <rect x="30" y="46" width="170" height="58" rx="10" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
        <text x="115" y="70" textAnchor="middle" fontSize="13" fill="currentColor" fontWeight="600">Owner key</text>
        <text x="115" y="88" textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.6">hot / everyday device</text>

        <line x1="115" y1="104" x2="115" y2="150" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <text x="128" y="130" fontSize="11" fill="currentColor" opacity="0.75" fontFamily="ui-monospace, monospace">propose(target, value, data)</text>

        {/* Policy engine */}
        <rect x="30" y="150" width="340" height="90" rx="12" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="200" y="178" textAnchor="middle" fontSize="14" fill="currentColor" fontWeight="700">Policy engine</text>
        <text x="200" y="198" textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.65">plain ETH? ≤ threshold? inside rolling window?</text>
        <text x="200" y="214" textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.65">recipient allowlisted? target = the vault itself?</text>

        {/* branch: instant */}
        <line x1="120" y1="240" x2="120" y2="300" stroke={GREEN} strokeWidth="2" markerEnd="url(#arrowGreen)" />
        <text x="132" y="272" fontSize="11" fill={GREEN} fontWeight="600">yes → instant</text>

        <rect x="30" y="300" width="180" height="56" rx="10" fill={GREEN} fillOpacity="0.08" stroke={GREEN} strokeWidth="1.5" />
        <text x="120" y="323" textAnchor="middle" fontSize="12.5" fill="currentColor" fontWeight="600">Execute now</text>
        <text x="120" y="340" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">same block, no delay</text>

        {/* Execute now -> Recipient, clear straight run down the left rail */}
        <line x1="120" y1="356" x2="120" y2="600" stroke={GREEN} strokeWidth="2" markerEnd="url(#arrowGreen)" />

        {/* branch: queued */}
        <line x1="300" y1="240" x2="380" y2="300" stroke={AMBER} strokeWidth="2" markerEnd="url(#arrowAmber)" />
        <text x="330" y="270" fontSize="11" fill={AMBER} fontWeight="600">no → queue it</text>

        <rect x="250" y="300" width="290" height="64" rx="10" fill={AMBER} fillOpacity="0.08" stroke={AMBER} strokeWidth="1.5" />
        <text x="395" y="323" textAnchor="middle" fontSize="12.5" fill="currentColor" fontWeight="600">Pending action</text>
        <text x="395" y="340" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.65">id, target, value, data, readyAt = now + delay</text>
        <text x="395" y="354" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.65">rolling-window spend recorded regardless</text>

        {/* guardian veto column, directly below the amber box, no overlap with the left rail */}
        <line x1="330" y1="364" x2="330" y2="410" stroke={RED} strokeWidth="2" markerEnd="url(#arrowRed)" />
        <text x="343" y="392" fontSize="11" fill={RED} fontWeight="600">veto()</text>

        <rect x="250" y="410" width="160" height="54" rx="10" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
        <text x="330" y="432" textAnchor="middle" fontSize="12.5" fill="currentColor" fontWeight="600">Guardian key</text>
        <text x="330" y="448" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">can only cancel</text>

        <line x1="330" y1="464" x2="330" y2="500" stroke={RED} strokeWidth="2" markerEnd="url(#arrowRed)" />
        <rect x="250" y="500" width="160" height="48" rx="10" fill={RED} fillOpacity="0.1" stroke={RED} strokeWidth="1.5" />
        <text x="330" y="529" textAnchor="middle" fontSize="12.5" fill="currentColor" fontWeight="700">Blocked ✕</text>

        {/* delay elapses -> executeAction */}
        <line x1="470" y1="364" x2="560" y2="410" stroke={AMBER} strokeWidth="2" markerEnd="url(#arrowAmber)" />
        <text x="475" y="392" fontSize="11" fill={AMBER} fontWeight="600">delay elapses, not vetoed</text>

        <rect x="460" y="410" width="220" height="58" rx="10" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
        <text x="570" y="433" textAnchor="middle" fontSize="12.5" fill="currentColor" fontWeight="600">executeAction(id)</text>
        <text x="570" y="450" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">callable by anyone</text>

        {/* executeAction -> Recipient, orthogonal route clear of the guardian/blocked column */}
        <polyline
          points="570,468 570,627 230,627"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          markerEnd="url(#arrow)"
        />
        <text x="580" y="600" fontSize="10.5" fill="currentColor" opacity="0.6">target = recipient</text>

        {/* Recipient sink */}
        <rect x="30" y="600" width="200" height="54" rx="10" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
        <text x="130" y="622" textAnchor="middle" fontSize="12.5" fill="currentColor" fontWeight="600">Recipient</text>
        <text x="130" y="639" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">funds actually move</text>

        {/* recursive self-governance path */}
        <line x1="680" y1="439" x2="760" y2="439" stroke={VIOLET} strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arrowViolet)" />
        <text x="720" y="427" textAnchor="middle" fontSize="9.5" fill={VIOLET} fontWeight="600">target = vault</text>

        <rect x="700" y="150" width="270" height="120" rx="12" fill={VIOLET} fillOpacity="0.08" stroke={VIOLET} strokeWidth="1.5" />
        <text x="835" y="176" textAnchor="middle" fontSize="13" fill="currentColor" fontWeight="700">Vault&apos;s own policy</text>
        <text x="835" y="196" textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.7">setThreshold · setDelay</text>
        <text x="835" y="212" textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.7">setAllowlisted · setGuardian</text>
        <text x="835" y="228" textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.7">disableGuard / reenableGuard</text>
        <text x="835" y="250" textAnchor="middle" fontSize="10" fill={VIOLET} fontWeight="600">only callable by the vault itself</text>

        <rect x="760" y="410" width="200" height="58" rx="10" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
        <text x="860" y="433" textAnchor="middle" fontSize="12.5" fill="currentColor" fontWeight="600">Rules rewritten</text>
        <text x="860" y="450" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">next propose() uses new policy</text>

        <line x1="860" y1="410" x2="860" y2="270" stroke={VIOLET} strokeWidth="1.5" strokeDasharray="5 4" />
        <path d="M 700 200 C 550 200, 450 200, 370 200" stroke={VIOLET} strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#arrowViolet)" fill="none" opacity="0.85" />
        <text x="540" y="192" textAnchor="middle" fontSize="10" fill={VIOLET} opacity="0.9">feeds back into the same policy engine</text>

        <text x="500" y="680" textAnchor="middle" fontSize="11.5" fill="currentColor" opacity="0.55">
          Disabling the guard is a self-targeted action too — it waits out the same delay and can be vetoed like anything else.
        </text>
      </svg>
      <figcaption className="mt-4 text-sm text-white/50 text-center max-w-2xl mx-auto">
        The owner key can only <span className="text-white/70">propose</span> — small plain transfers execute
        instantly, everything else queues behind a delay the guardian can veto. Actions that target the vault
        itself rewrite its own policy through that exact same gate, so turning the guard off is never a shortcut.
      </figcaption>
    </figure>
  );
}
