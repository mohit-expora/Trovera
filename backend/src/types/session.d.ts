import 'express-session';

// Shape of the user object stored in the session after login.
// Permissions are embedded at login time (from ROLE_PERMISSIONS) to avoid per-request DB lookups.
export interface SessionUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  permissions: string[];
  avatar_url?: string | null;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}
