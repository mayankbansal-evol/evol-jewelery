import { useState } from "react";
import { FixedSettings, DiamondEntry, GST_RATE } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Gem, CircleDot } from "lucide-react";

interface CalculatorViewProps {
  settings: FixedSettings;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function CalculatorView({ settings }: CalculatorViewProps) {
  const [grossWeight, setGrossWeight] = useState(0);
  const [purity, setPurity] = useState("14");
  const [stones, setStones] = useState<DiamondEntry[]>([
    { id: generateId(), stoneTypeId: settings.stoneTypes[0]?.id ?? "", weight: 0, quantity: 1 },
  ]);

  const goldRate = settings.goldRates.find((g) => g.purity === purity);
  const goldRateValue = goldRate?.rate ?? 0;

  const totalStoneWeight = stones.reduce((sum, d) => sum + d.weight * d.quantity, 0);
  const netGoldWeight = Math.max(0, grossWeight - totalStoneWeight);

  const goldCost = netGoldWeight * goldRateValue;
  const makingCost = netGoldWeight * settings.makingCharge;
  const goldPlusMaking = goldCost + makingCost;

  const getStonePrice = (stoneTypeId: string, weight: number) => {
    const stoneType = settings.stoneTypes.find((s) => s.id === stoneTypeId);
    if (!stoneType) return 0;
    const match = stoneType.slabs.find(
      (sl) => weight >= sl.fromWeight && weight < sl.toWeight
    );
    return match?.pricePerCarat ?? 0;
  };

  const stoneDetails = stones.map((d) => {
    const stoneType = settings.stoneTypes.find((s) => s.id === d.stoneTypeId);
    const pricePerCarat = getStonePrice(d.stoneTypeId, d.weight);
    const totalCost = pricePerCarat * d.weight * d.quantity;
    return { ...d, stoneType, pricePerCarat, totalCost };
  });

  const totalStoneCost = stoneDetails.reduce((s, d) => s + d.totalCost, 0);
  const subTotal = goldPlusMaking + totalStoneCost;
  const gst = subTotal * GST_RATE;
  const total = subTotal + gst;

  const addStone = () => {
    setStones([...stones, { id: generateId(), stoneTypeId: settings.stoneTypes[0]?.id ?? "", weight: 0, quantity: 1 }]);
  };

  const removeStone = (id: string) => {
    if (stones.length > 1) setStones(stones.filter((d) => d.id !== id));
  };

  const updateStone = (id: string, field: keyof DiamondEntry, value: string | number) => {
    setStones(stones.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <section className="bg-card border border-border rounded-xl p-5 space-y-5">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Gem className="w-4 h-4 text-muted-foreground" /> Jewelry Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Gross Weight (g)</label>
            <Input
              type="number"
              step="0.01"
              value={grossWeight || ""}
              onChange={(e) => setGrossWeight(Number(e.target.value))}
              placeholder="e.g. 9.64"
              className="h-10"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Gold Purity</label>
            <Select value={purity} onValueChange={setPurity}>
              <SelectTrigger className="h-10">
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

        {/* Stones */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stones</label>
            <Button variant="outline" size="sm" onClick={addStone} className="h-7 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Stone
            </Button>
          </div>
          <div className="space-y-2">
            {stones.map((d, i) => (
              <div key={d.id} className="flex items-end gap-2 bg-muted/40 p-3 rounded-lg border border-border/50">
                <span className="text-[11px] text-muted-foreground pb-2.5 font-mono min-w-[18px]">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider">Stone Type</label>
                  <Select value={d.stoneTypeId} onValueChange={(v) => updateStone(d.id, "stoneTypeId", v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select stone" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.stoneTypes.map((st) => (
                        <SelectItem key={st.id} value={st.id}>
                          {st.name} ({st.slabs.length} slabs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider">Weight (ct)</label>
                  <Input
                    type="number"
                    step="0.001"
                    value={d.weight || ""}
                    onChange={(e) => updateStone(d.id, "weight", Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="w-16">
                  <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider">Qty</label>
                  <Input
                    type="number"
                    min={1}
                    value={d.quantity}
                    onChange={(e) => updateStone(d.id, "quantity", Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
                <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0 mb-0" onClick={() => removeStone(d.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breakdown */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <CircleDot className="w-4 h-4 text-muted-foreground" /> Price Breakdown
        </h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {/* Gold section */}
          <div className="border-b border-border">
            <div className="px-4 py-2 bg-muted/40">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Gold Details</p>
            </div>
            <div className="divide-y divide-border/60">
              <Row label={`Gold Rate (${goldRate?.label})`} value={`₹${fmt(goldRateValue)}/g`} />
              <Row label="Gross Weight" value={`${fmt(grossWeight)} g`} />
              <Row label="Net Gold Weight" value={`${fmt(netGoldWeight)} g`} sub />
              <Row label={`Gold Cost (${fmt(netGoldWeight)}g × ₹${fmt(goldRateValue)})`} value={`₹${fmt(goldCost)}`} />
              <Row label={`Making Charge (${fmt(netGoldWeight)}g × ₹${fmt(settings.makingCharge)})`} value={`₹${fmt(makingCost)}`} />
              <Row label="Gold + Making" value={`₹${fmt(goldPlusMaking)}`} bold highlight />
            </div>
          </div>

          {/* Stone section */}
          <div className="border-b border-border">
            <div className="px-4 py-2 bg-muted/40">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Stone Details</p>
            </div>
            <div className="divide-y divide-border/60">
              {stoneDetails.map((d, i) => (
                <Row
                  key={d.id}
                  label={
                    <span>
                      <span className="font-medium">{d.stoneType?.name ?? "Unknown"}</span>
                      <span className="text-muted-foreground"> — {d.weight}ct × {d.quantity} @ ₹{fmt(d.pricePerCarat)}/ct</span>
                    </span>
                  }
                  value={`₹${fmt(d.totalCost)}`}
                />
              ))}
              <Row label={`Total Stone Cost (${fmt(totalStoneWeight)} ct)`} value={`₹${fmt(totalStoneCost)}`} bold highlight />
            </div>
          </div>

          {/* Totals */}
          <div className="divide-y divide-border/60">
            <Row label="Sub Total" value={`₹${fmt(subTotal)}`} bold />
            <Row label="GST (3%)" value={`₹${fmt(gst)}`} />
          </div>

          {/* Grand total */}
          <div className="bg-primary text-primary-foreground px-5 py-4 flex justify-between items-center">
            <span className="text-base font-bold tracking-wide">TOTAL</span>
            <span className="text-xl font-bold tabular-nums">₹{fmt(total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
  sub,
}: {
  label: React.ReactNode;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  sub?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center px-4 py-2.5 text-sm ${
        highlight ? "bg-muted/30" : ""
      }`}
    >
      <span className={`${bold ? "font-semibold text-foreground" : "text-muted-foreground"} ${sub ? "pl-3 text-xs italic" : ""}`}>
        {label}
      </span>
      <span className={`tabular-nums ${bold ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
