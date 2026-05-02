import { FileText } from "lucide-react";

type SourceChipProps = {
  text: string;
};

export default function SourceChip({ text }: SourceChipProps) {
  return (
    <span aria-label={text} className="source-chip">
      <FileText aria-hidden="true" size={14} color="#0F6E56" strokeWidth={1.8} />
      {text}
    </span>
  );
}
