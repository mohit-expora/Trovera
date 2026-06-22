import { PermissionGate } from "@/components/common/PermissionGate";
import { RolesPageClient } from "./RolesPageClient";

export default function RolesPage() {
  return (
    <PermissionGate permission="page:roles:view">
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm">
            Configure what each role can access and do. Super admin permissions are fixed.
          </p>
        </div>
        <RolesPageClient />
      </div>
    </PermissionGate>
  );
}
