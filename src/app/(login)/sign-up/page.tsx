"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSignUp } from "@/hooks/mutations/use-auth-mutations";
import { useValidateInvite } from "@/hooks/queries/use-relationship";
import { handleApiError } from "@/lib/error-handler";
import { Heart } from "lucide-react";

declare global {
  interface Window {
    turnstile: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const signUpSchema = z
  .object({
    email: z.email("Please enter a valid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be less than 50 characters"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
    turnstileToken: z
      .string()
      .min(1, "Please complete the security verification"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [error, setError] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");
  const signUpMutation = useSignUp();

  // Validate invite code using TanStack Query
  const {
    data: inviteValidation,
    isLoading: isValidatingInvite,
    error: inviteError,
  } = useValidateInvite(inviteCode);

  const inviter = inviteValidation?.inviter;
  const inviteValid = inviteValidation?.valid;

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      turnstileToken: "",
    },
  });

  // Set error if invite validation fails
  useEffect(() => {
    if (inviteCode && !isValidatingInvite && inviteError) {
      setError("Failed to validate invitation code");
    } else if (
      inviteCode &&
      !isValidatingInvite &&
      inviteValidation &&
      !inviteValidation.valid
    ) {
      setError("Invalid or expired invitation code");
    }
  }, [inviteCode, inviteValidation, isValidatingInvite, inviteError]);

  useEffect(() => {
    // Don't initialize if widget already exists
    if (widgetIdRef.current) {
      return;
    }

    // Check if script is already loaded
    const existingScript = document.querySelector(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
    ) as HTMLScriptElement | null;

    const initializeTurnstile = () => {
      // Double-check widget doesn't exist before rendering
      if (turnstileRef.current && window.turnstile && !widgetIdRef.current) {
        const widgetId = window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            form.setValue("turnstileToken", token, { shouldValidate: true });
          },
          "error-callback": () => {
            form.setValue("turnstileToken", "", { shouldValidate: true });
          },
          "expired-callback": () => {
            form.setValue("turnstileToken", "", { shouldValidate: true });
          },
        });
        widgetIdRef.current = widgetId;
      }
    };

    let script: HTMLScriptElement | null = null;
    let loadHandler: (() => void) | null = null;

    if (existingScript) {
      // Script already exists, just initialize if turnstile is available
      if (window.turnstile) {
        initializeTurnstile();
      } else {
        // Wait for script to load
        loadHandler = initializeTurnstile;
        existingScript.addEventListener("load", loadHandler);
      }
    } else {
      // Load Turnstile script
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;

      loadHandler = initializeTurnstile;
      script.onload = loadHandler;

      document.body.appendChild(script);
    }

    return () => {
      // Cleanup event listener if it was added
      if (loadHandler && existingScript) {
        existingScript.removeEventListener("load", loadHandler);
      }
      // Cleanup widget
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - form is stable from react-hook-form

  const onSubmit = async (data: SignUpFormValues) => {
    setError("");

    try {
      await signUpMutation.mutateAsync({
        email: data.email,
        username: data.username,
        password: data.password,
        turnstileToken: data.turnstileToken,
        inviteCode: inviteCode || undefined,
      });
    } catch (err) {
      setError(handleApiError(err));
      // Reset Turnstile widget on error
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        form.setValue("turnstileToken", "", { shouldValidate: true });
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card className="w-full p-8 shadow-warm-hover">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Create an account
            </h2>
            {inviter && inviteValid ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-secondary p-4">
                <Heart className="h-5 w-5 text-primary" fill="currentColor" />
                <Avatar className="h-10 w-10">
                  <AvatarImage src={inviter.avatar || undefined} />
                  <AvatarFallback>
                    {inviter.displayName?.[0] || inviter.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">
                    {inviter.displayName || inviter.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    is inviting you to join
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Sign up to get started
              </p>
            )}
          </div>

          <Form {...form}>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="Enter your email"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          autoComplete="username"
                          placeholder="Choose a username"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        Password
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          autoComplete="new-password"
                          placeholder="Create a password"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          autoComplete="new-password"
                          placeholder="Confirm your password"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="turnstileToken"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <div
                          ref={turnstileRef}
                          className="w-full flex justify-center"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {error && (
                <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12"
                disabled={signUpMutation.isPending}
              >
                {signUpMutation.isPending ? "Creating account..." : "Sign up"}
              </Button>
            </form>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center text-sm font-semibold text-primary hover:underline"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
