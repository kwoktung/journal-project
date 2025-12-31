"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Heart } from "lucide-react";
import {
  useResumeRelationship,
  useCancelResumeRequest,
} from "@/hooks/mutations/use-relationship-mutations";
import { handleApiError } from "@/lib/error-handler";
import { useSession } from "@/hooks/queries/use-auth";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

interface GracePeriodBannerProps {
  permanentDeletionAt: string;
  resumeRequest: {
    requestedBy: number;
    requestedAt: string;
  } | null;
  partnerName: string;
}

export const GracePeriodBanner = ({
  permanentDeletionAt,
  resumeRequest,
  partnerName,
}: GracePeriodBannerProps) => {
  const { data: currentUser } = useSession();
  const resumeRelationshipMutation = useResumeRelationship();
  const cancelRequestMutation = useCancelResumeRequest();
  const [ConfirmDialog, confirm] = useConfirmDialog();

  const currentUserId = currentUser?.id;

  // Determine state
  const getResumeState = () => {
    if (!resumeRequest) return "none";
    if (resumeRequest.requestedBy === currentUserId) return "you_requested";
    return "partner_requested";
  };

  const state = getResumeState();

  const handleResumeOrAccept = async () => {
    let confirmed = false;

    if (state === "partner_requested") {
      confirmed = await confirm({
        title: "Accept Resume Request?",
        description: `${partnerName} wants to resume your relationship. All shared posts will remain.`,
        confirmText: "Accept & Resume",
      });
    } else {
      confirmed = await confirm({
        title: "Resume Relationship?",
        description: "Send a request to resume your relationship?",
        confirmText: "Send Request",
      });
    }

    if (!confirmed) return;

    try {
      await resumeRelationshipMutation.mutateAsync();
    } catch (err) {
      console.error("Resume relationship error:", err);
      await confirm({
        title: "Error",
        description: handleApiError(err),
        confirmText: "OK",
      });
    }
  };

  const handleCancel = async () => {
    const confirmed = await confirm({
      title: "Cancel Resume Request?",
      description:
        "Are you sure you want to cancel your request to resume the relationship?",
      confirmText: "Yes, Cancel Request",
      variant: "destructive",
    });

    if (!confirmed) return;

    try {
      await cancelRequestMutation.mutateAsync();
    } catch (err) {
      console.error("Cancel request error:", err);
      await confirm({
        title: "Error",
        description: handleApiError(err),
        confirmText: "OK",
      });
    }
  };

  // State 1: No request
  if (state === "none") {
    return (
      <>
        <ConfirmDialog />
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 shadow-warm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">
                Relationship Ended - Grace Period Active
              </h3>
              <p className="mt-1 text-sm text-destructive/90">
                All posts and memories will be permanently deleted on{" "}
                <strong>
                  {new Date(permanentDeletionAt).toLocaleString(undefined, {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </strong>
                . You have until then to cancel the deletion and restore your
                relationship.
              </p>
              <Button
                onClick={handleResumeOrAccept}
                disabled={resumeRelationshipMutation.isPending}
                variant="destructive"
                size="sm"
                className="mt-3"
              >
                {resumeRelationshipMutation.isPending
                  ? "Sending Request..."
                  : "Resume Relationship"}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // State 2: You requested
  if (state === "you_requested") {
    return (
      <>
        <ConfirmDialog />
        <div className="mb-6 rounded-xl border border-border bg-secondary p-4 shadow-warm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                Resume Request Sent
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You requested to resume the relationship on{" "}
                <strong>
                  {new Date(resumeRequest!.requestedAt).toLocaleString(
                    undefined,
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    },
                  )}
                </strong>
                . Waiting for {partnerName} to accept.
              </p>
              <Button
                onClick={handleCancel}
                disabled={cancelRequestMutation.isPending}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                {cancelRequestMutation.isPending
                  ? "Cancelling..."
                  : "Cancel Request"}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // State 3: Partner requested
  return (
    <>
      <ConfirmDialog />
      <div className="mb-6 rounded-xl border border-border bg-secondary p-4 shadow-warm">
        <div className="flex items-start gap-3">
          <Heart
            className="h-5 w-5 flex-shrink-0 text-primary"
            fill="currentColor"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              Partner Wants to Resume
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <strong>{partnerName}</strong> wants to resume the relationship.
              If you accept, your relationship will be restored and all shared
              posts will remain.
            </p>
            <Button
              onClick={handleResumeOrAccept}
              disabled={resumeRelationshipMutation.isPending}
              variant="default"
              size="sm"
              className="mt-3"
            >
              {resumeRelationshipMutation.isPending
                ? "Resuming..."
                : "Accept & Resume Relationship"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
