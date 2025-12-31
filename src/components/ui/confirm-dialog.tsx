"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Continue",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === "destructive"
                ? "bg-destructive text-white hover:bg-destructive/90"
                : ""
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook to use confirmation dialogs
 * Returns [ConfirmDialogComponent, confirm function]
 *
 * Usage:
 * const [ConfirmDialog, confirm] = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: "Delete Post?",
 *     description: "This action cannot be undone.",
 *   });
 *   if (confirmed) {
 *     // proceed with deletion
 *   }
 * };
 *
 * return (
 *   <>
 *     <ConfirmDialog />
 *     <button onClick={handleDelete}>Delete</button>
 *   </>
 * );
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    resolve?: (value: boolean) => void;
  }>({
    open: false,
    title: "",
    description: "",
  });

  const confirm = (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        ...options,
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    dialogState.resolve?.(true);
    setDialogState((prev) => ({ ...prev, open: false }));
  };

  const handleCancel = () => {
    dialogState.resolve?.(false);
    setDialogState((prev) => ({ ...prev, open: false }));
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={dialogState.open}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
      title={dialogState.title}
      description={dialogState.description}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      variant={dialogState.variant}
      onConfirm={handleConfirm}
    />
  );

  return [ConfirmDialogComponent, confirm] as const;
}
