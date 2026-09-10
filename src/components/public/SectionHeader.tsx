export function SectionHeader({
  index,
  eyebrow,
  title,
  body,
  align = "left",
  light = false,
}: {
  index?: string;
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "left" | "center";
  light?: boolean;
}) {
  return (
    <header
      className={`pub-section-header${align === "center" ? " is-center" : ""}${
        light ? " is-light" : ""
      }`}
    >
      {(index || eyebrow) && (
        <p className="pub-eyebrow">
          <span className="pub-rule" aria-hidden="true" />
          {index ? <span className="pub-index">{index}</span> : null}
          {eyebrow}
        </p>
      )}
      <h2 className="pub-h2">{title}</h2>
      {body ? <p className="pub-lede">{body}</p> : null}
    </header>
  );
}
