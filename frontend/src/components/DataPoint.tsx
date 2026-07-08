export function DataPoint({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="data-point">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
