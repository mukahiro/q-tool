import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  className = "w-40",
  priority = false,
}: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="Q Toolトップページへ"
      className="inline-flex"
    >
      <Image
        src="/q-tool-logo.svg"
        alt="Q Tool"
        width={1200}
        height={400}
        priority={priority}
        className={`h-auto ${className}`}
      />
    </Link>
  );
}