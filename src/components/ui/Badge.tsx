import clsx from "clsx";

type BadgeProps = {
  variant: "misleading" | "true" | "unverifiable";
  children: React.ReactNode;
};

const variantClass = {
  misleading: "badge-misleading",
  true: "badge-true",
  unverifiable: "badge-unverifiable",
};

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={clsx(variantClass[variant])}
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1,
        padding: "7px 12px",
      }}
    >
      {children}
    </span>
  );
}
