export default function SectionCard({ title, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-border bg-card p-5 ${className ?? ""}`}>
      {title != null && title !== "" && (
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
