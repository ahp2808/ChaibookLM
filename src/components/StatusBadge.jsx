import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { STATUS_LABEL } from "../constants/sourceTypes";

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
      className={`status-badge status-${status}`}
      title={`Status: ${STATUS_LABEL[status] || status}`}
    >
      <Icon
        size={11}
        className={`${cfg.spin ? "animate-spin" : ""}`}
      />
      {STATUS_LABEL[status] || status}
    </span>
  );
}
