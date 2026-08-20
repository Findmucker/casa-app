import { fireEvent, render, screen } from "@testing-library/react";
import Inventory from "@/components/Inventory";

describe("Inventory", () => {
  const inventory = [{ itemId: "helm_flower", count: 1 }];

  it("keeps another member's inventory strictly read-only", () => {
    const onEquip = jest.fn();
    const onUnequip = jest.fn();
    render(<Inventory inventory={inventory} equipped={{}} onEquip={onEquip} onUnequip={onUnequip} readOnly />);

    const item = screen.getByRole("button", { name: /Coroa de Flores/i });
    expect(item).toHaveProperty("disabled", true);
    fireEvent.click(item);
    expect(onEquip).not.toHaveBeenCalled();
    expect(onUnequip).not.toHaveBeenCalled();
  });

  it("still equips owned items in the editable profile", () => {
    const onEquip = jest.fn();
    render(<Inventory inventory={inventory} equipped={{}} onEquip={onEquip} onUnequip={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Coroa de Flores/i }));
    expect(onEquip).toHaveBeenCalledWith("helm_flower", "helmet");
  });
});
