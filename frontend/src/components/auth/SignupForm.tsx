"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/types/api";
import { cn } from "@/lib/utils";

const signupSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    try {
      await api.post<ApiSuccess<{ message: string }>>("/auth/register", {
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/verify-email`);
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const message =
        error?.response?.data?.error?.message ?? "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="space-y-1">
              <p className="font-semibold text-lg">Account created!</p>
              <p className="text-sm text-muted-foreground">
                Check your email to verify your account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Full name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              disabled={isLoading}
              className={cn(errors.full_name && "border-destructive focus-visible:ring-destructive")}
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isLoading}
              className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
              className={cn(errors.password && "border-destructive focus-visible:ring-destructive")}
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Min 8 characters, one uppercase letter, one number.
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
              className={cn(
                errors.confirm_password && "border-destructive focus-visible:ring-destructive"
              )}
              {...register("confirm_password")}
            />
            {errors.confirm_password && (
              <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pb-6">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/${locale}/login`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
