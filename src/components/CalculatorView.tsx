import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FixedSettings, DiamondEntry, StoneType, Slab } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  Diamond,
  Trash2,
  Plus,
} from "lucide-react";

interface CalculatorViewProps {
  settings: FixedSettings;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function calculateMakingCharge(netGoldWeight: number, flatRate: number, perGramRate: number): number {
  if (netGoldWeight <= 0) return 0;
  if (netGoldWeight <= 2) return flatRate;
  return netGoldWeight * perGramRate;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n: number, decimals = 2) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
  }).format(n);
}

const GOLD_PURITIES = ["24", "22", "18", "14"];

export default function CalculatorView({ settings }: CalculatorViewProps) {
  const [netGoldWeight, setNetGoldWeight] = useState(0);
  const [purity, setPurity] = useState("22");
  const [stones, setStones] = useState<DiamondEntry[]>([
    { id: generateId(), stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "", slabId: "", weight: 0, quantity: 1 },
  ]);

  const calculatedGoldRates = useMemo(() => {
    return GOLD_PURITIES.map((purityVal) => {
      const percentage = settings.purityPercentages[purityVal] ?? 100;
      const rate = Math.round(settings.goldRate24k * (percentage / 100));
      return { purity: purityVal, label: `${purityVal}K`, rate };
    });
  }, [settings.goldRate24k, settings.purityPercentages]);

  const goldRate = calculatedGoldRates.find((g) => g.purity === purity);
  const goldRateValue = goldRate?.rate ?? 0;

  const totalStoneWeight = stones.reduce((sum, d) => sum + d.weight * d.quantity, 0);
  const grossWeight = netGoldWeight + totalStoneWeight;

  const goldCost = netGoldWeight * goldRateValue;
  const makingCost = calculateMakingCharge(netGoldWeight, settings.makingChargeFlat, settings.makingChargePerGram);
  const goldPlusMaking = goldCost + makingCost;

  const getStonePrice = (stoneTypeId: string, slabId: string) => {
    const stoneType = settings.stoneTypes.find((s) => s.stoneId === stoneTypeId);
    if (!stoneType) return { pricePerCarat: 0, slab: null };
    const slab = stoneType.slabs.find((sl) => sl.code === slabId);
    return { pricePerCarat: slab?.pricePerCarat ?? 0, slab };
  };

  const stoneDetails = stones.map((d) => {
    const stoneType = settings.stoneTypes.find((s) => s.stoneId === d.stoneTypeId);
    const { pricePerCarat, slab } = getStonePrice(d.stoneTypeId, d.slabId);
    const totalCost = pricePerCarat * d.weight * d.quantity;
    return { 
      ...d, 
      stoneType, 
      pricePerCarat, 
      totalCost,
      slabInfo: slab ? { code: slab.code, range: `${formatNumber(slab.fromWeight, 4)}-${formatNumber(slab.toWeight, 4)}ct` } : null
    };
  });

  const totalStoneCost = stoneDetails.reduce((s, d) => s + d.totalCost, 0);
  const subTotal = goldPlusMaking + totalStoneCost;
  const gst = subTotal * settings.gstRate;
  const total = subTotal + gst;

  const addStone = () => {
    setStones([...stones, { id: generateId(), stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "", slabId: "", weight: 0, quantity: 1 }]);
  };

  const removeStone = (id: string) => {
    if (stones.length > 1) {
      setStones(stones.filter((d) => d.id !== id));
    }
  };

  const updateStone = (id: string, field: keyof DiamondEntry, value: string | number) => {
    setStones(stones.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const getStoneSlabs = (stoneTypeId: string): Slab[] => {
    const stoneType = settings.stoneTypes.find((s) => s.stoneId === stoneTypeId);
    return stoneType?.slabs ?? [];
  };

  const handleStoneTypeChange = (id: string, value: string) => {
    const stoneSlabs = getStoneSlabs(value);
    const defaultSlabId = stoneSlabs[0]?.code ?? "";
    setStones(stones.map((d) => (d.id === id ? { ...d, stoneTypeId: value, slabId: defaultSlabId } : d)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Input Section */}
      <Card className="border border-[hsl(var(--border))]">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <h2 className="text-sm font-medium text-[hsl(var(--foreground))]">Jewelry Details</h2>
          </div>

          {/* Gold Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                Net Gold Weight (g)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  value={netGoldWeight || ""}
                  onChange={(e) => setNetGoldWeight(Number(e.target.value))}
                  placeholder="0.00"
                  className="h-9 pr-4 text-sm border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                Gold Purity
              </label>
              <Select value={purity} onValueChange={setPurity}>
                <SelectTrigger className="h-9 border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {calculatedGoldRates.map((g) => (
                    <SelectItem key={g.purity} value={g.purity}>
                      <div className="flex items-center justify-between w-full gap-6">
                        <span className="text-sm">{g.label}</span>
                        <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
                          {formatCurrency(g.rate)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stones */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                Stones
              </label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={addStone} 
                className="h-7 text-xs gap-1.5 hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Stone
              </Button>
            </div>

            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {stones.map((d, i) => {
                  const stoneSlabs = getStoneSlabs(d.stoneTypeId);
                  return (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-end gap-2 p-3 bg-[hsl(var(--muted))] rounded-md flex-wrap"
                    >
                      <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] w-5">
                        {i + 1}
                      </span>
                      
                      <div className="flex-1 min-w-[140px] space-y-1">
                        <label className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide block">
                          Stone Type
                        </label>
                        <Select 
                          value={d.stoneTypeId} 
                          onValueChange={(v) => handleStoneTypeChange(d.id, v)}
                        >
                          <SelectTrigger className="h-8 text-xs border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]">
                            <SelectValue placeholder="Select stone" />
                          </SelectTrigger>
                          <SelectContent>
                            {settings.stoneTypes.map((st) => (
                              <SelectItem key={st.stoneId} value={st.stoneId}>
                                <div className="flex items-center gap-2">
                                  {st.type === "Diamond" ? (
                                    <Diamond className="w-3 h-3" />
                                  ) : (
                                    <span className="w-3 h-3 rounded-full bg-[hsl(var(--muted-foreground))]" />
                                  )}
                                  <span className="text-sm">{st.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1 min-w-[140px] space-y-1">
                        <label className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide block">
                          Slab
                        </label>
                        <Select 
                          value={d.slabId} 
                          onValueChange={(v) => updateStone(d.id, "slabId", v)}
                        >
                          <SelectTrigger className="h-8 text-xs border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]">
                            <SelectValue placeholder="Select slab" />
                          </SelectTrigger>
                          <SelectContent>
                            {stoneSlabs.map((sl) => (
                              <SelectItem key={sl.code} value={sl.code}>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-xs">{formatNumber(sl.fromWeight, 3)}-{formatNumber(sl.toWeight, 3)} ct</span>
                                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{sl.code}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-20 space-y-1">
                        <label className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide block">
                          Net Wt
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.001"
                            value={d.weight || ""}
                            onChange={(e) => updateStone(d.id, "weight", Number(e.target.value))}
                            className="h-8 text-xs border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 pr-4 text-right focus:ring-0 focus:border-[hsl(var(--foreground))]"
                          />
                        </div>
                      </div>

                      <div className="w-14 space-y-1">
                        <label className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide block">
                          Pcs
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={d.quantity}
                          onChange={(e) => updateStone(d.id, "quantity", Number(e.target.value))}
                          className="h-8 text-xs border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 text-center focus:ring-0 focus:border-[hsl(var(--foreground))]"
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStone(d.id)}
                        disabled={stones.length <= 1}
                        className="h-8 w-8 p-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-transparent disabled:opacity-30"
                        aria-label="Remove stone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card className="border border-[hsl(var(--border))]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-medium text-[hsl(var(--foreground))]">Price Breakdown</h2>
          </div>

          {/* Gross Weight */}
          <div className="flex justify-between items-center py-2 px-3 bg-[hsl(var(--muted))] rounded-md">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Gross Weight</span>
            <span className="text-sm font-mono text-[hsl(var(--foreground))]">{formatNumber(grossWeight)} g</span>
          </div>

          <Separator />

          {/* Gold Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide px-1">
              Gold
            </h3>
            <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-[hsl(var(--muted))] rounded-md">
              <div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide block">
                  Net Wt
                </span>
                <span className="text-sm font-mono text-[hsl(var(--foreground))]">{formatNumber(netGoldWeight)} g</span>
              </div>
              <div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide block">
                  Purity
                </span>
                <span className="text-sm font-mono text-[hsl(var(--foreground))]">{purity}K</span>
              </div>
              <div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide block">
                  Rate
                </span>
                <span className="text-sm font-mono text-[hsl(var(--foreground))]">{formatCurrency(goldRateValue)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-1 px-1">
              <span className="text-sm text-[hsl(var(--foreground))]">Gold Cost</span>
              <span className="text-sm font-mono text-[hsl(var(--foreground))]">{formatCurrency(goldCost)}</span>
            </div>
          </div>

          {/* Making Charges */}
          <div className="flex justify-between items-center py-2 px-3 bg-[hsl(var(--muted))] rounded-md">
            <div>
              <span className="text-sm text-[hsl(var(--foreground))]">Making Charges</span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] block">
                {netGoldWeight <= 2 && netGoldWeight > 0 
                  ? `Flat rate (≤2g)` 
                  : netGoldWeight > 2 
                    ? `${formatNumber(netGoldWeight)}g × ${formatCurrency(settings.makingChargePerGram)}` 
                    : ''}
              </span>
            </div>
            <span className="text-sm font-mono text-[hsl(var(--foreground))]">{formatCurrency(makingCost)}</span>
          </div>

          <Separator />

          {/* Stones Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide px-1">
              Stones
            </h3>
            {stoneDetails.length > 0 ? (
              stoneDetails.map((d) => (
                <div key={d.id} className="flex justify-between items-center py-1 px-2">
                  <div>
                    <span className="text-sm text-[hsl(var(--foreground))]">
                      {d.stoneType?.name ?? "Unknown"}
                    </span>
                    {d.slabInfo && (
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] block">
                        {d.slabInfo.code} · {d.slabInfo.range}
                      </span>
                    )}
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {formatNumber(d.weight)}ct × {d.quantity} pcs
                    </span>
                  </div>
                  <span className="text-sm font-mono text-[hsl(var(--foreground))]">
                    {formatCurrency(d.totalCost)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))] py-2 px-2">No stones added</p>
            )}
            {totalStoneCost > 0 && (
              <div className="flex justify-between items-center py-1 px-2">
                <span className="text-sm text-[hsl(var(--foreground))] font-medium">Total Stones</span>
                <span className="text-sm font-mono text-[hsl(var(--foreground))] font-medium">
                  {formatCurrency(totalStoneCost)}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 py-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[hsl(var(--foreground))]">Subtotal</span>
              <span className="text-sm font-mono text-[hsl(var(--foreground))]">{formatCurrency(subTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">GST ({settings.gstRate * 100}%)</span>
              <span className="text-sm font-mono text-[hsl(var(--muted-foreground))]">{formatCurrency(gst)}</span>
            </div>
          </div>

          {/* Grand Total */}
          <motion.div
            className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))] -mx-4 -mb-4 px-4 py-3 flex justify-between items-center mt-2"
            initial={false}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span className="text-sm font-medium">Total</span>
            <motion.span
              key={total}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold font-mono"
            >
              {formatCurrency(total)}
            </motion.span>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
