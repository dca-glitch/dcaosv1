import React from "react";
import { Alert, EmptyState, LoadingState } from "../../components/ui";

export function AiDeliveryInlineLoading({ label }: { label: string }) {
  return <LoadingState label={label} variant="inline" />;
}

export function AiDeliveryInlineAlert({ message, title }: { message: string; title?: string }) {
  return <Alert message={message} title={title ?? "Action blocked"} variant="danger" />;
}

export function AiDeliveryInlineNotice({ children }: { children: React.ReactNode }) {
  return <p className="ai-delivery-inline-notice muted-text text-sm">{children}</p>;
}

/**
 * Thin domain adapter → canonical EmptyState.
 * Preserves exact children copy as message-only inline empty (first-use default).
 */
export function AiDeliveryInlineEmpty({
  children,
  kind = "first-use",
}: {
  children: React.ReactNode;
  kind?: "empty" | "no-results" | "filtered" | "first-use";
}) {
  const message =
    typeof children === "string"
      ? children.trim()
      : Array.isArray(children)
        ? children.map((c) => (typeof c === "string" ? c : "")).join("").trim()
        : typeof children === "number"
          ? String(children)
          : "";

  return <EmptyState kind={kind} message={message || "Nothing here yet. Add an item to get started."} variant="inline" />;
}
