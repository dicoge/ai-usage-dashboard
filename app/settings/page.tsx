export const metadata = { title: "Settings — AI Usage Dashboard" };

export default function SettingsPage() {
  return (
    <main>
      <div className="section-title" style={{ marginTop: 0 }}>
        Settings
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        This dashboard runs entirely in your browser. There is no server-side account, no upload, and
        no database — your Claude Code logs are parsed locally and cached in this browser&apos;s{" "}
        <span className="code">localStorage</span>.
      </p>

      <div className="section-title">How to get your Claude Code logs</div>
      <div className="card">
        <div className="settings-item">
          <h3>Find the JSONL session logs</h3>
          <p>
            Claude Code stores per-session logs as <span className="code">.jsonl</span> files under{" "}
            <span className="code">~/.claude/projects</span> (one folder per project).
          </p>
          <p>
            On the <span className="code">Claude</span> page, click{" "}
            <span className="code">Choose JSONL files</span> and select any number of them (you can
            multi-select across folders). Usage, cost estimates, and the daily chart are computed on
            the spot.
          </p>
        </div>
        <div className="settings-item">
          <h3>Your data stays local</h3>
          <p>
            Parsing happens in the browser via the File API. The computed summary is saved to{" "}
            <span className="code">localStorage</span> so it survives a page refresh. Use{" "}
            <span className="code">Clear</span> on the Claude page to remove it.
          </p>
        </div>
      </div>

      <div className="section-title">Cost estimates</div>
      <div className="card">
        <div className="settings-item">
          <p>
            Costs are estimated by applying public per-model API list prices to the tokens in your
            logs. Claude Max is a flat subscription, so this figure represents the equivalent
            pay-as-you-go spend rather than an actual bill.
          </p>
        </div>
      </div>
    </main>
  );
}
