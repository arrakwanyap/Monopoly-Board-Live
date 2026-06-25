interface Props {
  emoji: string;
  name?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function isTokenImage(emoji: string): boolean {
  return emoji.startsWith("/tokens/") || emoji.startsWith("/team_");
}

export default function TeamToken({ emoji, name, size = 28, className, style }: Props) {
  if (isTokenImage(emoji)) {
    return (
      <img
        src={emoji}
        alt={name ?? "team token"}
        title={name}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: "contain", display: "inline-block", ...style }}
        draggable={false}
      />
    );
  }
  return (
    <span
      className={className}
      title={name}
      style={{ fontSize: size * 0.75, lineHeight: 1, display: "inline-block", ...style }}
    >
      {emoji}
    </span>
  );
}
