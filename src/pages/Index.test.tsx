import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./Index";

function ClaimStub() {
  const [sp] = useSearchParams();
  return <div>CLAIM STUB:{sp.get("code")}</div>;
}

function renderHome() {
  return render(
    <ThemeProvider attribute="class">
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create" element={<div>CREATE STUB</div>} />
          <Route path="/claim" element={<ClaimStub />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("Index page", () => {
  it("renders the hero and the claim form", () => {
    renderHome();
    expect(screen.getByText("🧧 Lucky ADA")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create gift/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter gift code..."),
    ).toBeInTheDocument();
  });

  it("navigates to /create when Create Gift is clicked", () => {
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /create gift/i }));
    expect(screen.getByText("CREATE STUB")).toBeInTheDocument();
  });

  it("navigates to /claim with the entered code", () => {
    renderHome();
    const input = screen.getByPlaceholderText("Enter gift code...");
    fireEvent.change(input, { target: { value: "my-gift-code" } });
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByText("CLAIM STUB:my-gift-code")).toBeInTheDocument();
  });

  it("does not navigate when the claim code is blank", () => {
    renderHome();
    const input = screen.getByPlaceholderText("Enter gift code...");
    fireEvent.submit(input.closest("form")!);
    expect(screen.queryByText(/CLAIM STUB/)).not.toBeInTheDocument();
  });
});
