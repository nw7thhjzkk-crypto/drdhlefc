import { BrandMark } from "./BrandMark";

/** Official full logo presented as a reception wall plaque.
 *  The source artwork has a white field — we do not redraw it.
 */
export function LogoPlaque({
  size = 360,
  priority = false,
  caption = "Reception",
}: {
  size?: number;
  priority?: boolean;
  caption?: string;
}) {
  return (
    <figure className="logo-plaque">
      <div className="logo-plaque-face">
        <BrandMark mark="full" size={size} priority={priority} />
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
