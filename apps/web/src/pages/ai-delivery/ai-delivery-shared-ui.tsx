import React from "react";
import { Alert, LoadingState } from "../../components/ui";

export function AiDeliveryInlineLoading({ label }: { label: string }) {
  return <LoadingState label={label} variant="inline" />;
}

export function AiDeliveryInlineAlert({ message, title }: { message: string; title?: string }) {
  return <Alert message={message} title={title ?? "Action blocked"} variant="danger" />;
}

export function AiDeliveryInlineNotice({ children }: { children: React.ReactNode }) {
  return <p className="ai-delivery-inline-notice muted-text text-sm">{children}</p>;
}

/** Domain empty copy as children; chrome uses shared inline-empty styling. */
export function AiDeliveryInlineEmpty({ children }: { children: React.ReactNode }) {
  return <div className="inline-empty muted-text">{children}</div>;
}
