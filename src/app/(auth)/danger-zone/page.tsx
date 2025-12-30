"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, AlertCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRelationship } from "@/hooks/queries/use-relationship";

const DangerZonePage = () => {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { data: relationshipData, isLoading } = useRelationship();

  const hasActiveRelationship = relationshipData?.relationship !== null;

  const handleDeleteAccount = () => {
    router.push("/delete-account");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {/* Header with Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Danger Zone</h1>
          <p className="mt-2 text-sm text-foreground/60 sm:text-base">
            Manage high-risk actions that can permanently affect your account.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="mb-4 sm:mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h2 className="font-semibold text-red-900 dark:text-red-100">
                Danger Zone
              </h2>
              <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                These actions are permanent and cannot be undone. Please proceed
                with caution.
              </p>
            </div>
          </div>
        </div>

        {/* Dangerous Actions */}
        <div className="space-y-4 sm:space-y-6">
          {/* Delete Account Card */}
          <Card className="border-destructive/30 bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
              <CardDescription>
                Once you delete your account, there is no going back. This will
                permanently delete your account, all your posts, and all
                associated data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasActiveRelationship && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Cannot delete account
                    </p>
                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                      You must end your relationship before deleting your
                      account. Visit the{" "}
                      <Link
                        href="/settings?tab=relationship"
                        className="underline font-medium"
                      >
                        Relationship tab
                      </Link>{" "}
                      to manage your relationship settings.
                    </p>
                  </div>
                </div>
              )}

              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={hasActiveRelationship || isLoading}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove all your data from our servers,
                      including:
                    </AlertDialogDescription>
                    <ul className="list-inside list-disc ml-6 mt-2 space-y-1">
                      <li>All your posts</li>
                      <li>All your attachments</li>
                      <li>Your profile information</li>
                    </ul>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DangerZonePage;
