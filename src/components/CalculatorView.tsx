import { useState } from "react";
import { FixedSettings, DiamondEntry, GST_RATE } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface CalculatorViewProps {
  settings: FixedSettings;
}

const SHAPES = ["Round", "Princess", "Oval", "Marquise", "Pear", "Cushion", "Emerald", "Heart"];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function CalculatorView({ settings }: CalculatorViewProps) {
  const [grossWeight, setGrossWeight] = useState(0);
  const [purity, setPurity] = useState("14");
  const [diamonds, setDiamonds] = useState<DiamondEntry[]>([
    { id: generateId(), shape: "Round", weight: 0, quantity: 1 },
  ]);

  const goldRate = settings.goldRates.find((g) => g.purity === purity);
  const goldRateValue = goldRate?.rate ?? 0;

  const totalDiamondWeight = diamonds.reduce((sum, d) => sum + d.weight * d.quantity, 0);
  const netGoldWeight = Math.max(0, grossWeight - totalDiamondWeight);

  const goldCost = netGoldWeight * goldRateValue;
  const makingCost = netGoldWeight * settings.makingCharge;
  const goldPlusMaking = goldCost + makingCost;

  const getDiamondPrice = (weight: number) => {
    const match = settings.stonePrices.find(
      (sp) => weight >= sp.fromWeight && weight < sp.toWeight
    );
    return match?.pricePerCarat ?? 0;
  };

  const diamondDetails = diamonds.map((d) => {
    const pricePerCarat = getDiamondPrice(d.weight);
    const totalCost = pricePerCarat * d.weight * d.quantity;
    return { ...d, pricePerCarat, totalCost };
  });

  const totalDiamondCost = diamondDetails.reduce((s, d) => s + d.totalCost, 0);
  const subTotal = goldPlusMaking + totalDiamondCost;
  const gst = subTotal * GST_RATE;
  const total = subTotal + gst;

  const addDiamond = () => {
    setDiamonds([...diamonds, { id: generateId(), shape: "Round", weight: 0, quantity: 1 }]);
  };

  const removeDiamond = (id: string) => {
    if (diamonds.length > 1) setDiamonds(diamonds.filter((d) => d.id !== id));
  };

  const updateDiamond = (id: string, field: keyof DiamondEntry, value: string | number) => {
    setDiamonds(diamonds.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Jewelry Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Gross Weight (grams)</label>
            <Input
              type="number"
              step="0.01"
              value={grossWeight || ""}
              onChange={(e) => setGrossWeight(Number(e.target.value))}
              placeholder="e.g. 9.64"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Gold Purity</label>
            <Select value={purity} onValueChange={setPurity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settings.goldRates.map((g) => (
                  <SelectItem key={g.purity} value={g.purity}>
                    {g.label} — ₹{fmt(g.rate)}/g
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Diamonds */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground">Diamonds</label>
            <Button variant="outline" size="sm" onClick={addDiamond}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-3">
            {diamonds.map((d, i) => (
              <div key={d.id} className="flex items-end gap-3 bg-muted/50 p-3 rounded-lg">
                <span className="text-xs text-muted-foreground pb-2 min-w-[20px]">{i + 1}</span>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Shape</label>
                  <Select value={d.shape} onValueChange={(v) => updateDiamond(d.id, "shape", v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHAPES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28">
                  <label className="text-xs text-muted-foreground mb-1 block">Weight (ct)</label>
                  <Input
                    type="number"
                    step="0.001"
                    value={d.weight || ""}
                    onChange={(e) => updateDiamond(d.id, "weight", Number(e.target.value))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="w-20">
                  <label className="text-xs text-muted-foreground mb-1 block">Qty</label>
                  <Input
                    type="number"
                    min={1}
                    value={d.quantity}
                    onChange={(e) => updateDiamond(d.id, "quantity", Number(e.target.value))}
                    className="h-9 text-sm"
                  />
                </div>
                <Button variant="ghost" size="sm" className="text-destructive mb-0.5" onClick={() => removeDiamond(d.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breakdown */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Price Breakdown</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody className="text-sm">
              <tr className="border-b border-border">
                <td className="px-4 py-3 text-muted-foreground">Gold Rate ({goldRate?.label})</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">₹{fmt(goldRateValue)}/g</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-3 text-muted-foreground">Gross Weight</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(grossWeight)} g</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-3 text-muted-foreground">Net Gold Weight</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(netGoldWeight)} g</td>
              </tr>
              <tr className="border-b border-border bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">Gold + Making (₹{fmt(settings.makingCharge)}/g)</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">₹{fmt(goldPlusMaking)}</td>
              </tr>

              {diamondDetails.map((d, i) => (
                <tr key={d.id} className="border-b border-border">
                  <td className="px-4 py-3 text-muted-foreground">
                    Diamond {i + 1}: {d.shape} — {d.weight}ct × {d.quantity} @ ₹{fmt(d.pricePerCarat)}/ct
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">₹{fmt(d.totalCost)}</td>
                </tr>
              ))}

              <tr className="border-b border-border bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">Total Diamond Cost ({fmt(totalDiamondWeight)} ct)</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">₹{fmt(totalDiamondCost)}</td>
              </tr>

              <tr className="border-b border-border">
                <td className="px-4 py-3 text-muted-foreground">Sub Total</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">₹{fmt(subTotal)}</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-3 text-muted-foreground">GST (3%)</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">₹{fmt(gst)}</td>
              </tr>
              <tr className="bg-primary/5">
                <td className="px-4 py-4 font-bold text-foreground text-base">TOTAL</td>
                <td className="px-4 py-4 text-right font-bold text-foreground text-base">₹{fmt(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
