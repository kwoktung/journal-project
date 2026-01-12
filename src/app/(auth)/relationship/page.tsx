"use client";

import { useRelationship } from "@/hooks/queries/use-relationship";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { NoRelationshipState } from "./no-relationship-state";
import { RelationshipView } from "./relationship-view";

export default function RelationshipPage() {
  const {
    data: relationshipData,
    isLoading,
    error,
    refetch,
  } = useRelationship();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  const relationship = relationshipData?.relationship;

  if (!relationship) {
    return <NoRelationshipState />;
  }

  return <RelationshipView relationship={relationship} />;
}
