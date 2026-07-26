import {
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {STATUS_LABEL,TYPE_CONFIG} from "../constants/sourceTypes"
export function StatusBadge({ status }) {
  const iconMap = {
    uploading: { icon: Loader2, spin: true },
    extracting: { icon: Loader2, spin: true },
    chunking: { icon: Loader2, spin: true },
    embedding: { icon: Loader2, spin: true },
    ready: { icon: CheckCircle2, spin: false },
    error: { icon: AlertCircle, spin: false },
  };
  const cfg = iconMap[status] || iconMap.uploading;
  const Icon = cfg.icon;
  return (
    <span
      className={`status-badge status-${status} inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs`}
    >
      <Icon
        size={11}
        className={`spinner-tint ${cfg.spin ? "animate-spin" : ""}`}
      />
      {STATUS_LABEL[status] || status}
    </span>
  );
}
