import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      full_name: string;
      role: string;
      permissions: string[];
      avatar_url?: string | null;
    };
  }
}
