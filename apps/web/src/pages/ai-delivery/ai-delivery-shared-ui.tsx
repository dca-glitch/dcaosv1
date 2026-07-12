import React from "react";
import { Alert, Spinner } from "../../components/ui";

export function AiDeliveryInlineLoading({ label }: { label: string }) {
  return (
    <div className="state-panel loading-state-panel" role="status">
      <Spinner size="md" />
      <span>{label}</span>
    </div>
  );
}

export function AiDeliveryInlineAlert({ message, title }: { message: string; title?: string }) {
  return <Alert message={message} title={title ?? "Action blocked"} variant="danger" />;
}

export function AiDeliveryInlineNotice({ children }: { children: React.ReactNode }) {
  return <p className="ai-delivery-inline-notice muted-text text-sm">{children}</p>;
}

export function AiDeliveryInlineEmpty({ children }: { children: React.ReactNode }) {
  return <p className="ai-delivery-inline-empty muted-text">{children}</p>;
}
