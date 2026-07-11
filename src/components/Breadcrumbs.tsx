import { ChevronRight } from "lucide-react";
import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="パンくずリスト" className="text-sm text-slate-600">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            <BreadcrumbLabel item={item} />
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 text-slate-400"
            />
          </li>
        ))}
      </ol>
    </nav>
  );
}

function BreadcrumbLabel({ item }: { item: BreadcrumbItem }) {
  if (!item.href) {
    return <span className="font-medium text-slate-600">{item.label}</span>;
  }

  return (
    <Link
      href={item.href}
      className="font-medium text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
    >
      {item.label}
    </Link>
  );
}
