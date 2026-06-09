import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Layout } from "./Layout";

function renderLayout() {
  return render(
    <ThemeProvider attribute="class">
      <MemoryRouter>
        <Layout>
          <p>page content</p>
        </Layout>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("Layout", () => {
  it("renders the brand and its children", () => {
    renderLayout();
    expect(screen.getByText("Lucky ADA")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("renders the nav links to Create and My Gifts", () => {
    renderLayout();
    expect(screen.getByRole("link", { name: "Create" })).toHaveAttribute(
      "href",
      "/create",
    );
    expect(screen.getByRole("link", { name: "My Gifts" })).toHaveAttribute(
      "href",
      "/my-gifts",
    );
  });
});
