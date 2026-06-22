export type UserRole = "super_admin" | "librarian" | "member";
export type AuthProvider = "local" | "google";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  auth_provider: AuthProvider;
  role: UserRole;
  is_active: boolean;
  is_email_verified: boolean;
  phone?: string | null;
  address?: string | null;
  membership_id?: string | null;
  created_at: string;
}

export interface UserProfile extends User {
  permissions: string[];
}
