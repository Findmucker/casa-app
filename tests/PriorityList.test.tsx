import "@testing-library/jest-dom";
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PriorityList from "@/components/PriorityList";
import type { SmallPriorityItem } from "@/lib/hooks";

const mockAdd = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();
let mockItems: SmallPriorityItem[] = [];
let mockError: Error | null = null;

jest.mock("@/lib/hooks", () => ({
  useCollection: () => ({
    items: mockItems,
    loading: false,
    error: mockError,
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
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <input
      ref={inputRef}
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
    mockItems = [];
    mockError = null;
    mockAdd.mockResolvedValue("new-id");
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
    fireEvent.click(screen.getByRole("button", { name: "priority.add" }));

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

    await waitFor(() => {
      expect(screen.getByPlaceholderText("priority.placeholder")).toHaveValue("");
      expect(screen.getByLabelText("priority.price")).toHaveValue(null);
      expect(screen.getByLabelText("priority.notes")).toHaveValue("");
    });
  });

  it("keeps the draft when creation fails and announces the error", async () => {
    mockError = new Error("permission-denied");
    mockAdd.mockResolvedValue(null);
    render(<PriorityList />);

    const nameInput = screen.getByPlaceholderText("priority.placeholder");
    fireEvent.change(nameInput, { target: { value: "Comprar candeeiro" } });
    fireEvent.click(screen.getByRole("button", { name: "priority.add" }));

    await waitFor(() => expect(mockAdd).toHaveBeenCalled());
    expect(nameInput).toHaveValue("Comprar candeeiro");
    expect(screen.getByRole("alert")).toHaveTextContent("priority.saveError");
  });

  it("focuses the add field from the empty-state action", () => {
    render(<PriorityList />);

    fireEvent.click(screen.getByRole("button", { name: "priority.emptyAction" }));

    expect(screen.getByPlaceholderText("priority.placeholder")).toHaveFocus();
  });
});

describe("PriorityList at household scale", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockError = null;
    mockItems = Array.from({ length: 60 }, (_, index) => ({
      id: `item-${index}`,
      name: `Coisinha ${index + 1}`,
      done: false,
      order: index + 1,
      category: "📦 Outros",
      assignee: "ambos",
      createdAt: null,
    }));
  });

  it("renders 60 items with accessible edit and completion actions", () => {
    render(<PriorityList />);

    expect(screen.getAllByRole("button", { name: /^priority\.edit Coisinha/ })).toHaveLength(60);
    expect(screen.getAllByRole("button", { name: /^priority\.markDone Coisinha/ })).toHaveLength(60);
  });
});
