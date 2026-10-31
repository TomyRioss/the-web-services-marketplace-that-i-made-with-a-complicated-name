export function BrandLogo({
  className = "",
  size = "default",
  inverse = false,
  onPrimaryPanel = false,
}: {
  className?: string;
  size?: "default" | "large";
  inverse?: boolean;
  onPrimaryPanel?: boolean;
}) {
  const isLarge = size === "large";

  return (
    <span
      role="img"
      aria-label="Devta"
      className={`inline-flex shrink-0 items-baseline font-sans font-extrabold italic leading-none tracking-[-0.075em] ${
        inverse
          ? "text-white"
          : onPrimaryPanel
            ? "text-foreground lg:text-primary-foreground"
            : "text-foreground"
      } ${isLarge ? "text-[2rem]" : "text-[1.65rem]"} ${className}`}
    >
      Devta<span aria-hidden="true" className="ml-[0.06em] text-[1.12em] leading-none" style={{ color: "var(--accent-green)" }}>.</span>
    </span>
  );
}
