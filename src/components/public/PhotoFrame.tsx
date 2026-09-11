import Image from "next/image";

export function PhotoFrame({
  label,
  src,
  aspect = "landscape",
  className = "",
  study = false,
}: {
  label: string;
  src: string | null;
  aspect?: "landscape" | "portrait" | "square" | "hero";
  className?: string;
  study?: boolean;
}) {
  return (
    <figure className={`pub-frame pub-frame-${aspect} ${className}`.trim()}>
      {src ? (
        <Image
          src={src}
          alt={study ? `${label} — visual study of the intended environment` : label}
          fill
          sizes="(max-width: 800px) 100vw, 70vw"
          className="pub-frame-photo"
        />
      ) : (
        <div className="pub-frame-empty" aria-hidden="true">
          <span className="pub-frame-grain" />
          <span className="pub-frame-cross" />
        </div>
      )}
      <figcaption>
        <span>{label}</span>
        {!src ? (
          <span className="pub-frame-status">To be published</span>
        ) : study ? (
          <span className="pub-frame-status">Visual study</span>
        ) : null}
      </figcaption>
    </figure>
  );
}
