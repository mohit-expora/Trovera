import { Badge } from "@trovera/ui";
import type { FineStatus } from "@/types/transaction";

interface FinesBadgeProps {
  amount: number;
  status: FineStatus;
}

export function FinesBadge({ amount, status }: FinesBadgeProps) {
  if (status === "paid") {
    return (
      <Badge variant="success" className="text-xs">
        Paid
      </Badge>
    );
  }

  if (status === "waived") {
    return (
      <Badge variant="secondary" className="text-xs">
        Waived
      </Badge>
    );
  }

  // pending
  return (
    <Badge variant="destructive" className="text-xs">
      ₹{amount.toFixed(2)}
    </Badge>
  );
}
