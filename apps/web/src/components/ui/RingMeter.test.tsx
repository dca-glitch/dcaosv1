import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RingMeter } from "./RingMeter";

describe("RingMeter", () => {
  it("exposes label and numeric value to assistive tech", () => {
    render(<RingMeter label="Blocked" value={3} max={10} tone="blocked" />);
    expect(screen.getByRole("img", { name: /Blocked: 3 of 10 \(30%\)/i })).toBeTruthy();
  });

  it("clamps values above max to 100%", () => {
    render(<RingMeter label="Ready" value={150} max={100} />);
    expect(screen.getByRole("img", { name: /Ready: 150 of 100 \(100%\)/i })).toBeTruthy();
  });

  it("treats invalid value/max as empty ring", () => {
    render(<RingMeter label="Overdue" value={Number.NaN} max={0} />);
    expect(screen.getByRole("img", { name: /Overdue: 0 of 100 \(0%\)/i })).toBeTruthy();
  });

  it("clamps negative values to zero", () => {
    render(<RingMeter label="In Progress" value={-4} max={8} />);
    expect(screen.getByRole("img", { name: /In Progress: 0 of 8 \(0%\)/i })).toBeTruthy();
  });
});
