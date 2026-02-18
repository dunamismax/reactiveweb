import { describe, expect, it } from "vitest";
import {
  actionBadgeVariant,
  badgeVariantClasses,
  confirmToneClasses,
  roleBadgeVariant,
  roleProgressBarClass,
  statToneClasses,
  statusBadgeVariant,
  toastVariantClasses,
} from "../app/lib/semantic-styles";

describe("semantic style contracts", () => {
  it("maps role, status, and action values to shared badge variants", () => {
    expect(roleBadgeVariant("owner")).toBe("owner");
    expect(roleBadgeVariant("unknown")).toBe("default");

    expect(statusBadgeVariant("active")).toBe("active");
    expect(statusBadgeVariant("inactive")).toBe("default");

    expect(actionBadgeVariant("Created")).toBe("admin");
    expect(actionBadgeVariant("Updated")).toBe("editor");
    expect(actionBadgeVariant("Activated")).toBe("active");
    expect(actionBadgeVariant("Suspended")).toBe("suspended");
    expect(actionBadgeVariant("Seeded")).toBe("default");
  });

  it("keeps shared class contracts stable for palette-bound UI semantics", () => {
    expect({
      badgeDefault: badgeVariantClasses.default,
      badgeViewer: badgeVariantClasses.viewer,
      confirmDanger: confirmToneClasses.danger,
      statGood: statToneClasses.good,
      toastError: toastVariantClasses.error,
      progressOwner: roleProgressBarClass("owner"),
      progressFallback: roleProgressBarClass("unknown"),
    }).toMatchInlineSnapshot(`
      {
        "badgeDefault": "border-[var(--border)] text-[var(--foreground)]",
        "badgeViewer": "border-[var(--role-viewer-border)] bg-[var(--role-viewer-bg)] text-[var(--role-viewer-fg)]",
        "confirmDanger": "border-[var(--tone-error-border)] bg-[var(--tone-error-bg)] text-[var(--tone-error-fg)] hover:opacity-90",
        "progressFallback": "bg-[var(--accent)]",
        "progressOwner": "bg-[var(--role-owner-fg)]",
        "statGood": "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]",
        "toastError": {
          "bar": "bg-[var(--tone-error-fg)]",
          "container": "border-[var(--tone-error-border)] bg-[var(--tone-error-bg)] text-[var(--tone-error-fg)]",
        },
      }
    `);
  });
});
