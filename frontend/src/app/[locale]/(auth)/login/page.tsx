import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Heading */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to Trovera</p>
        </div>

        {/* Email / password form */}
        <LoginForm />

        {/* Divider */}
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-border" />
          <span className="mx-4 flex-shrink text-xs text-muted-foreground">or</span>
          <div className="flex-grow border-t border-border" />
        </div>

        {/* Google OAuth */}
        <GoogleLoginButton />
      </div>
    </div>
  );
}
