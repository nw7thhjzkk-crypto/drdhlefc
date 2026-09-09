import Image from "next/image";
import { site } from "@/lib/site";

type Mark = "monogram" | "full";

export function BrandMark({
  mark = "monogram",
  size = 40,
  className,
  priority = false,
}: {
  mark?: Mark;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  if (mark === "full") {
    return (
      <Image
        src={site.brand.fullLogo}
        alt={site.name}
        width={size}
        height={size}
        className={className}
        priority={priority}
        sizes={`(max-width: 860px) min(100vw, ${size}px), ${size}px`}
        style={{ height: "auto", maxWidth: "100%" }}
      />
    );
  }

  const width = size;
  const height = Math.round(size * (1183 / 1330));

  return (
    <Image
      src={site.brand.monogram}
      alt=""
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={`${width}px`}
    />
  );
}
