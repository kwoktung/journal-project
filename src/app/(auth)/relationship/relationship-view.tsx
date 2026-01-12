import { useState } from "react";
import { Calendar, AlertCircle, AlertTriangle, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useSession } from "@/hooks/queries/use-auth";
import {
  useEndRelationship,
  useResumeRelationship,
  useCancelResumeRequest,
  useUpdateRelationshipStartDate,
} from "@/hooks/mutations/use-relationship-mutations";
import { getUserInitials } from "@/lib/format/user";
import { handleApiError } from "@/lib/error-handler";
import { formatDistanceToNow } from "date-fns";
import type { RelationshipInfo } from "@/hooks/queries/use-relationship";

interface RelationshipViewProps {
  relationship: RelationshipInfo;
}

export function RelationshipView({ relationship }: RelationshipViewProps) {
  const { data: currentUser } = useSession();
  const [startDate, setStartDate] = useState("");
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [error, setError] = useState("");

  const endRelationshipMutation = useEndRelationship();
  const resumeRelationshipMutation = useResumeRelationship();
  const cancelResumeRequestMutation = useCancelResumeRequest();
  const updateStartDateMutation = useUpdateRelationshipStartDate();

  const isPendingDeletion = relationship.status === "pending_deletion";
  const hasResumeRequest = relationship.resumeRequest !== null;
  const isRequestedByMe =
    relationship.resumeRequest?.requestedBy === currentUser?.id;

  const handleEndRelationship = async () => {
    setError("");
    try {
      await endRelationshipMutation.mutateAsync();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleResumeRelationship = async () => {
    setError("");
    try {
      await resumeRelationshipMutation.mutateAsync();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleCancelResumeRequest = async () => {
    setError("");
    try {
      await cancelResumeRequestMutation.mutateAsync();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleUpdateStartDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!startDate) {
      setError("Please enter a valid date");
      return;
    }

    try {
      await updateStartDateMutation.mutateAsync({ startDate });
      setIsEditingDate(false);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleEditDate = () => {
    setIsEditingDate(true);
    setStartDate(
      relationship.relationshipStartDate
        ? new Date(relationship.relationshipStartDate)
            .toISOString()
            .split("T")[0]
        : "",
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Status Banner */}
          {isPendingDeletion && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    Relationship Ending Soon
                  </h3>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                    {relationship.permanentDeletionAt &&
                      `Your relationship will be permanently deleted ${formatDistanceToNow(
                        new Date(relationship.permanentDeletionAt),
                        { addSuffix: true },
                      )}. You can resume it before then.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resume Request Banner */}
          {hasResumeRequest && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    {isRequestedByMe
                      ? "Resume Request Sent"
                      : "Resume Request Received"}
                  </h3>
                  <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                    {isRequestedByMe
                      ? "Waiting for your partner to accept the request"
                      : "Your partner wants to resume the relationship"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Partner Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User2 className="size-5" />
                Partner Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage
                    src={relationship.partner.avatar ?? undefined}
                    alt={
                      relationship.partner.displayName ||
                      relationship.partner.username
                    }
                  />
                  <AvatarFallback>
                    {getUserInitials({
                      displayName: relationship.partner.displayName,
                      username: relationship.partner.username,
                    })}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-lg font-semibold">
                    {relationship.partner.displayName ||
                      relationship.partner.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{relationship.partner.username}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Relationship Start Date Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                Relationship Start Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditingDate ? (
                <form onSubmit={handleUpdateStartDate} className="space-y-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={updateStartDateMutation.isPending}
                    >
                      {updateStartDateMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingDate(false)}
                      disabled={updateStartDateMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    {relationship.relationshipStartDate ? (
                      <>
                        <p className="text-lg font-semibold">
                          {new Date(
                            relationship.relationshipStartDate,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            const startDate = new Date(
                              relationship.relationshipStartDate,
                            );
                            const now = new Date();
                            const diffTime =
                              now.getTime() - startDate.getTime();
                            const diffDays = Math.floor(
                              diffTime / (1000 * 60 * 60 * 24),
                            );
                            return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
                          })()}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No start date set
                      </p>
                    )}
                  </div>
                  <Button variant="outline" onClick={handleEditDate}>
                    Edit Date
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                Relationship Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPendingDeletion ? (
                <>
                  {hasResumeRequest ? (
                    <>
                      {isRequestedByMe ? (
                        <Button
                          variant="outline"
                          onClick={handleCancelResumeRequest}
                          disabled={cancelResumeRequestMutation.isPending}
                          className="w-full"
                        >
                          {cancelResumeRequestMutation.isPending
                            ? "Cancelling..."
                            : "Cancel Resume Request"}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleResumeRelationship}
                          disabled={resumeRelationshipMutation.isPending}
                          className="w-full"
                        >
                          {resumeRelationshipMutation.isPending
                            ? "Resuming..."
                            : "Accept Resume Request"}
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={handleResumeRelationship}
                      disabled={resumeRelationshipMutation.isPending}
                      className="w-full"
                    >
                      {resumeRelationshipMutation.isPending
                        ? "Resuming..."
                        : "Resume Relationship"}
                    </Button>
                  )}
                </>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      End Relationship
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to end this relationship?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will hide all shared posts and memories.
                        You&apos;ll have 7 days to resume the relationship
                        before everything is permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleEndRelationship}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {endRelationshipMutation.isPending
                          ? "Ending..."
                          : "End Relationship"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
