export default function SectionTitle({ children, action, className = "" }) {
  return (
    <div className={`flex items-end justify-between gap-4 mb-4 ${className}`}>
      <h2 className="font-display font-semibold text-xl md:text-2xl tracking-tight">
        {children}
      </h2>
      {action}
    </div>
  );
}
