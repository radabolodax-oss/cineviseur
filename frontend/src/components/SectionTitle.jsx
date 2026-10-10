export default function SectionTitle({ children, action, className = "" }) {
  return (
    <div className={`flex items-end justify-between gap-4 mb-4 ${className}`}>
      <h2 className="section-title">
        {children}
      </h2>
      {action}
    </div>
  );
}
