export function LoadingInventory() {
  return (
    <section className="state-page" aria-live="polite">
      <div className="sync-icon" aria-hidden="true">↻</div>
      <p className="kicker">State: Loading</p>
      <h1>Syncing inventory</h1>
      <div className="loading-bar"><span /></div>
      <div className="skeleton-rows">
        {Array.from({ length: 3 }).map((_, index) => <span key={index} />)}
      </div>
    </section>
  );
}

export function EmptyInventory({ onRefresh }: { onRefresh: () => void }) {
  return (
    <section className="state-page empty">
      <div className="empty-icon" aria-hidden="true">□</div>
      <p className="kicker">State: Empty</p>
      <h1>No active drops</h1>
      <p>
        Your inventory scope is currently empty. Adjust filters or await the
        next scheduled release window.
      </p>
      <button className="primary-button" onClick={onRefresh}>
        Refresh scope <span aria-hidden="true">↻</span>
      </button>
    </section>
  );
}
