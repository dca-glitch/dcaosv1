import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveWordPressDraftAuthorMapping,
  WORDPRESS_AUTHOR_MAPPING_MODE,
  WORDPRESS_AUTHOR_TENANT_MAPPING_DESIGN
} from "./wordpress-author-tenant-mapping";

describe("wordpress-author-tenant-mapping (G299)", () => {
  it("keeps author mapping design-only with null draft author id", () => {
    assert.equal(WORDPRESS_AUTHOR_TENANT_MAPPING_DESIGN.mode, WORDPRESS_AUTHOR_MAPPING_MODE);
    assert.equal(WORDPRESS_AUTHOR_TENANT_MAPPING_DESIGN.draftAuthorId, null);
    assert.equal(
      WORDPRESS_AUTHOR_TENANT_MAPPING_DESIGN.ownershipBoundary,
      "tenant_client_publication_target"
    );
    assert.ok(
      WORDPRESS_AUTHOR_TENANT_MAPPING_DESIGN.forbiddenNow.includes("live_wordpress_user_lookup")
    );
    assert.ok(
      WORDPRESS_AUTHOR_TENANT_MAPPING_DESIGN.forbiddenNow.includes(
        "author_id_in_prepared_draft_payload"
      )
    );
    assert.match(WORDPRESS_AUTHOR_TENANT_MAPPING_DESIGN.note, /Design-only/);
  });

  it("resolves draft author mapping without live WordPress user IDs", () => {
    const mapping = resolveWordPressDraftAuthorMapping({
      tenantId: "tenant-1",
      publicationTargetId: "target-1",
      operatorUserId: "user-1"
    });

    assert.equal(mapping.mode, "deferred_design");
    assert.equal(mapping.draftAuthorId, null);
    const serialized = JSON.stringify(mapping);
    assert.equal(serialized.includes('"authorId":'), false);
    assert.equal(serialized.includes("live_wordpress"), false);
  });
});
