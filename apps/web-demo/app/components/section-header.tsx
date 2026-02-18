type SectionHeaderProps = {
  caption: string;
  title: string;
  description?: string;
};

export function SectionHeader({ caption, title, description }: SectionHeaderProps) {
  return (
    <header className="border-b border-[var(--border)] pb-4">
      <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">{caption}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] md:text-base">{description}</p>
      ) : null}
    </header>
  );
}
