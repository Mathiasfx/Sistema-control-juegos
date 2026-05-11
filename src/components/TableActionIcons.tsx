import { Eye, Pencil, Trash2, type LucideProps } from "lucide-react";

const iconClass = "h-4 w-4 shrink-0";

export const tableIconButtonClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:pointer-events-none disabled:opacity-40";

export const tableIconButtonDangerClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:pointer-events-none disabled:opacity-40";

export function TableOpenIcon({ className, ...props }: LucideProps) {
  return (
    <Eye
      className={className ? `${iconClass} ${className}` : iconClass}
      aria-hidden
      {...props}
    />
  );
}

export function TableEditIcon({ className, ...props }: LucideProps) {
  return (
    <Pencil
      className={className ? `${iconClass} ${className}` : iconClass}
      aria-hidden
      {...props}
    />
  );
}

export function TableTrashIcon({ className, ...props }: LucideProps) {
  return (
    <Trash2
      className={className ? `${iconClass} ${className}` : iconClass}
      aria-hidden
      {...props}
    />
  );
}
