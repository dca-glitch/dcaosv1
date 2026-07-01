import { useEffect, useState } from "react";
import { ArchiveHubPage } from "../ArchiveHubPage";
import { BriefPage } from "../BriefPage";
import { ArticleApprovalEditor } from "./ArticleApprovalEditor";
import { PendingApprovalsPage } from "./PendingApprovalsPage";
import { parseClientPortalHash } from "./client-portal-api";

export function ClientPortalRouter() {
  const [route, setRoute] = useState(() => parseClientPortalHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseClientPortalHash(window.location.hash));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (route.view === "pending-approvals") {
    return <PendingApprovalsPage />;
  }

  if (route.view === "briefs") {
    return <BriefPage />;
  }

  if (route.view === "approve" && route.deliverableId) {
    return <ArticleApprovalEditor deliverableId={route.deliverableId} />;
  }

  return <ArchiveHubPage />;
}
