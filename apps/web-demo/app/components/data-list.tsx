type DataListItem = {
  label: string;
  value: string;
};

type DataListProps = {
  items: DataListItem[];
};

export function DataList({ items }: DataListProps) {
  return (
    <dl className="grid gap-2 text-sm">
      {items.map((item, i) => (
        <div
          className={`flex justify-between gap-2 ${i < items.length - 1 ? "border-b border-[var(--border)] pb-2" : ""}`}
          key={item.label}
        >
          <dt className="text-[var(--muted)]">{item.label}</dt>
          <dd className="text-right">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
