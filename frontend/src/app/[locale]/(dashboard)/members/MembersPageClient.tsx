"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/common/PermissionGate";
import { ConfirmDialog } from "@/components/common/Modal/ConfirmDialog";
import { TablePagination } from "@/components/common/DataTable/TablePagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMembers, useMemberMutations } from "@/hooks/useMembers";
import { useAuthStore } from "@/store/authStore";
import { getInitials, formatDate } from "@/lib/utils";
import type { User, UserRole } from "@/types/user";
import type { PaginatedResponse } from "@/types/api";

interface MembersPageClientProps {
  initialData: PaginatedResponse<User> | null;
}

// ── Role Badge ─────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, { label: string; className: string }> = {
    super_admin: {
      label: "Super Admin",
      className:
        "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    },
    librarian: {
      label: "Librarian",
      className:
        "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
    member: {
      label: "Member",
      className:
        "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
  };
  const { label, className } = map[role] ?? map.member;
  return <Badge className={`text-xs ${className}`}>{label}</Badge>;
}

// ── Edit Member Dialog ─────────────────────────────────────────────────────

function EditMemberDialog({
  member,
  open,
  onClose,
  onSuccess,
}: {
  member: User | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { updateMember } = useMemberMutations();
  const [fullName, setFullName] = useState(member?.full_name ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [address, setAddress] = useState(member?.address ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!member) return;
    setSubmitting(true);
    try {
      await updateMember(member.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      toast.success("Member updated.");
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to update member.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>Update member profile details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-address">Address</Label>
            <textarea
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Address"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Change Role Dialog ─────────────────────────────────────────────────────

function ChangeRoleDialog({
  member,
  open,
  onClose,
  onSuccess,
}: {
  member: User | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { updateRole } = useMemberMutations();
  const [role, setRole] = useState<UserRole>(member?.role ?? "member");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!member) return;
    setSubmitting(true);
    try {
      await updateRole(member.id, role);
      toast.success("Role updated.");
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to update role.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Update the role for {member?.full_name ?? "this member"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="librarian">Librarian</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Updating..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Member Dialog ───────────────────────────────────────────────────

function CreateMemberDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { createMember } = useMemberMutations();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.full_name = "Name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    if (!password) errs.password = "Password is required.";
    if (password.length > 0 && password.length < 8)
      errs.password = "Password must be at least 8 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createMember({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      toast.success("Member created successfully.");
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? "Failed to create member.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setFullName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setAddress("");
    setRole("member");
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>Create a new library member account.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="create-name">Full Name *</Label>
            <Input
              id="create-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-email">Email *</Label>
            <Input
              id="create-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-password">Password *</Label>
            <Input
              id="create-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-phone">Phone</Label>
            <Input
              id="create-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-address">Address</Label>
            <textarea
              id="create-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Address"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="librarian">Librarian</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Client ────────────────────────────────────────────────────────────

export function MembersPageClient({ initialData }: MembersPageClientProps) {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const [editMember, setEditMember] = useState<User | null>(null);
  const [changeRoleMember, setChangeRoleMember] = useState<User | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { members, meta, isLoading, mutate } = useMembers(
    {
      page,
      page_size: 20,
      role: roleFilter === "all" ? undefined : roleFilter,
      search: search.trim() || undefined,
      is_active: activeFilter === "all" ? undefined : activeFilter === "active",
    },
    page === 1 && roleFilter === "all" && !search && activeFilter === "all"
      ? initialData ?? undefined
      : undefined
  );

  const { toggleActivate, deleteUser } = useMemberMutations();

  async function handleToggleActivate(member: User) {
    try {
      await toggleActivate(member.id, !member.is_active);
      toast.success(`Member ${!member.is_active ? "activated" : "deactivated"}.`);
      mutate();
    } catch {
      toast.error("Failed to update member status.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteUser(id);
      toast.success("Member deleted.");
      mutate();
    } catch {
      toast.error("Failed to delete member.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-56"
          />
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v as UserRole | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="librarian">Librarian</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={activeFilter}
            onValueChange={(v) => {
              setActiveFilter(v as "all" | "active" | "inactive");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Add Member
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border text-sm text-muted-foreground">
          No members found.
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Email</th>
                <PermissionGate permission="users:role:field">
                  <th className="px-4 py-3">Role</th>
                </PermissionGate>
                <th className="px-4 py-3">Membership ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        {member.avatar_url && (
                          <AvatarImage src={member.avatar_url} alt={member.full_name} />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                  <PermissionGate permission="users:role:field">
                    <td className="px-4 py-3">
                      <RoleBadge role={member.role} />
                    </td>
                  </PermissionGate>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {member.membership_id ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={member.is_active ? "success" : "secondary"}
                      className="text-xs"
                    >
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDate(member.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setEditMember(member)}
                      >
                        Edit
                      </Button>
                      {isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setChangeRoleMember(member)}
                        >
                          Role
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleToggleActivate(member)}
                      >
                        {member.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      {isSuperAdmin && (
                        <ConfirmDialog
                          trigger={
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              Delete
                            </Button>
                          }
                          title="Delete Member"
                          description={`Are you sure you want to delete ${member.full_name}? This action cannot be undone.`}
                          confirmLabel="Delete"
                          variant="destructive"
                          onConfirm={() => handleDelete(member.id)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && (
        <TablePagination
          meta={meta}
          onPageChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* Dialogs */}
      <EditMemberDialog
        member={editMember}
        open={!!editMember}
        onClose={() => setEditMember(null)}
        onSuccess={() => {
          mutate();
          setEditMember(null);
        }}
      />
      <ChangeRoleDialog
        member={changeRoleMember}
        open={!!changeRoleMember}
        onClose={() => setChangeRoleMember(null)}
        onSuccess={() => {
          mutate();
          setChangeRoleMember(null);
        }}
      />
      <CreateMemberDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          mutate();
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
