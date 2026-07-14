import "@testing-library/jest-dom";
import type { KeyboardEvent, ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PriorityList from "@/components/PriorityList";

const mockAdd = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

jest.mock("@/lib/hooks", () => ({
  useCollection: () => ({
    items: [],
    loading: false,
    add: mockAdd,
    update: mockUpdate,
    remove: mockRemove,
  }),
}));

jest.mock("@/lib/context", () => ({
  useMemberNames: () => [{ key: "ambos", label: "Ambos", emoji: "👫" }],
}));

jest.mock("@/lib/useUndoStack", () => ({
  useUndo: () => ({ pushUndo: jest.fn() }),
}));

jest.mock("@/lib/i18n", () => ({
  useT: () => ({ t: (key: string) => key }),
}));

jest.mock("@/components/TabTip", () => function MockTabTip() {
  return null;
});

jest.mock("@/components/AutocompleteInput", () => function MockAutocompleteInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
    />
  );
});

jest.mock("@/components/MiniAvatar", () => function MockMiniAvatar() {
  return <span>avatar</span>;
});

jest.mock("@/components/SwipeableRow", () => function MockSwipeableRow({ children }: { children: ReactNode }) {
  return <>{children}</>;
});

describe("PriorityList add form", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd.mockResolvedValue(undefined);
  });

  it("creates a coisinha with compact price and notes fields", async () => {
    render(<PriorityList />);

    fireEvent.change(screen.getByPlaceholderText("priority.placeholder"), {
      target: { value: "Comprar cortinas" },
    });
    fireEvent.change(screen.getByLabelText("priority.price"), {
      target: { value: "12.50" },
    });
    fireEvent.change(screen.getByLabelText("priority.notes"), {
      target: { value: "Medir primeiro a janela" },
    });
    fireEvent.click(screen.getByRole("button", { name: "+" }));

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
        name: "Comprar cortinas",
        price: 12.5,
        notes: "Medir primeiro a janela",
        done: false,
        order: 1,
        assignee: "ambos",
      }));
    });

    expect(screen.getByPlaceholderText("priority.placeholder")).toHaveValue("");
    expect(screen.getByLabelText("priority.price")).toHaveValue(null);
    expect(screen.getByLabelText("priority.notes")).toHaveValue("");
  });
});
