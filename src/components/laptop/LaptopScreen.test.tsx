import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { site } from "@/content";
import { LaptopScreen } from "./LaptopScreen";

function renderLaptop() {
  render(
    <LaptopScreen>
      <svg data-testid="drawing" />
    </LaptopScreen>,
  );
  return screen.getByRole("button", { name: "Can it run Doom? Open the laptop terminal" });
}

function openTerminal() {
  const opener = renderLaptop();
  fireEvent.click(opener);
  const dialog = document.querySelector("dialog")!;
  return { opener, dialog, input: within(dialog).getByLabelText("Command") };
}

function typeCommand(input: HTMLElement, command: string) {
  fireEvent.change(input, { target: { value: command } });
  fireEvent.submit(input.closest("form")!);
}

describe("LaptopScreen", () => {
  it("renders only the drawing on the server", () => {
    const html = renderToString(
      <LaptopScreen>
        <svg />
      </LaptopScreen>,
    );
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<dialog");
  });

  it("opens the terminal with the banner and focuses the input", () => {
    const { dialog, input } = openTerminal();
    expect(dialog.open).toBe(true);
    expect(input).toHaveFocus();
    expect(within(dialog).getByRole("log")).toHaveTextContent("can it run doom?");
  });

  it("prints the site name for whoami", () => {
    const { dialog, input } = openTerminal();
    typeCommand(input, "whoami");
    expect(within(dialog).getByRole("log")).toHaveTextContent(site.name);
    expect(input).toHaveValue("");
  });

  it("runs a command from the button row", () => {
    const { dialog } = openTerminal();
    fireEvent.click(within(dialog).getByRole("button", { name: "help" }));
    expect(within(dialog).getByRole("log")).toHaveTextContent("yes, it runs doom");
  });

  it("returns focus to the opener when closed", () => {
    const { opener, dialog } = openTerminal();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close terminal" }));
    expect(dialog.open).toBe(false);
    expect(opener).toHaveFocus();
  });

  it("closes on exit and keeps the log for the next open", () => {
    const { opener, dialog, input } = openTerminal();
    typeCommand(input, "exit");
    expect(dialog.open).toBe(false);
    expect(opener).toHaveFocus();
    fireEvent.click(opener);
    expect(within(dialog).getByRole("log")).toHaveTextContent("exit");
  });

  it("closes on a press that starts and ends on the backdrop", () => {
    const { dialog } = openTerminal();
    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);
    expect(dialog.open).toBe(false);
  });

  it("stays open when a drag from inside the terminal ends on the backdrop", () => {
    const { dialog } = openTerminal();
    fireEvent.pointerDown(within(dialog).getByRole("log"));
    fireEvent.click(dialog);
    expect(dialog.open).toBe(true);
  });

  it("announces the banner once the dialog is open", async () => {
    const { dialog } = openTerminal();
    const status = within(dialog).getByRole("status");
    expect(status).toHaveTextContent("");
    await act(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))));
    expect(status).toHaveTextContent("can it run doom?");
  });

  it("lets the dialog close on Escape in the terminal", () => {
    const { dialog } = openTerminal();
    const cancel = new Event("cancel", { cancelable: true });
    act(() => {
      dialog.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(false);
  });

  it("never prevents Tab", async () => {
    const { dialog, input } = openTerminal();
    expect(fireEvent.keyDown(input, { key: "Tab", code: "Tab" })).toBe(true);

    fireEvent.click(within(dialog).getByRole("button", { name: "› doom" }));
    const canvas = await within(dialog).findByRole("img", { name: /Doom-like maze/ });
    expect(canvas).toHaveFocus();
    expect(fireEvent.keyDown(canvas, { key: "Tab", code: "Tab" })).toBe(true);

    // Escape on the canvas goes back to the terminal instead of closing.
    expect(fireEvent.keyDown(canvas, { key: "Escape", code: "Escape" })).toBe(false);
    expect(dialog.open).toBe(true);
    expect(within(dialog).getByRole("log")).toHaveTextContent("doom: quit.");
    expect(within(dialog).getByRole("status")).toHaveTextContent("doom: quit.");
    expect(within(dialog).getByLabelText("Command")).toHaveFocus();
  });

  it("goes back to the terminal when the dialog is cancelled during the game", async () => {
    const { dialog } = openTerminal();
    fireEvent.click(within(dialog).getByRole("button", { name: "› doom" }));
    await within(dialog).findByRole("img", { name: /Doom-like maze/ });
    const cancel = new Event("cancel", { cancelable: true });
    act(() => {
      dialog.dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(within(dialog).getByRole("log")).toHaveTextContent("doom: quit.");
  });
});
