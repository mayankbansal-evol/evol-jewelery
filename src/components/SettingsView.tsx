import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FixedSettings, StoneType, Slab } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Diamond,
  Percent,
} from "lucide-react";

interface SettingsViewProps {
  settings: FixedSettings;
  onChange: (settings: FixedSettings) => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const GOLD_PURITIES = ["24", "22", "18", "14"];

export default function SettingsView({ settings, onChange }: SettingsViewProps) {
  const [editingStoneId, setEditingStoneId] = useState<string | null>(null);
  const [stoneToDelete, setStoneToDelete] = useState<string | null>(null);
  const [goldExpanded, setGoldExpanded] = useState(true);
  const [makingExpanded, setMakingExpanded] = useState(true);
  const [taxExpanded, setTaxExpanded] = useState(true);
  const [stonesExpanded, setStonesExpanded] = useState(true);

  const calculatedGoldRates = useMemo(() => {
    return GOLD_PURITIES.map((purity) => {
      const percentage = settings.purityPercentages[purity] ?? 100;
      const rate = Math.round(settings.goldRate24k * (percentage / 100));
      return { purity, label: `${purity}K`, rate, percentage };
    });
  }, [settings.goldRate24k, settings.purityPercentages]);

  const updateGoldRate24k = (value: number) => {
    onChange({ ...settings, goldRate24k: value });
  };

  const updatePurityPercentage = (purity: string, value: number) => {
    onChange({
      ...settings,
      purityPercentages: {
        ...settings.purityPercentages,
        [purity]: value,
      },
    });
  };

  const updateMakingFlat = (value: number) => {
    onChange({ ...settings, makingChargeFlat: value });
  };

  const updateMakingPerGram = (value: number) => {
    onChange({ ...settings, makingChargePerGram: value });
  };

  const updateGstRate = (value: number) => {
    onChange({ ...settings, gstRate: value / 100 });
  };

  const updateStoneType = (stoneId: string, updates: Partial<StoneType>) => {
    onChange({
      ...settings,
      stoneTypes: settings.stoneTypes.map((st) =>
        st.stoneId === stoneId ? { ...st, ...updates } : st
      ),
    });
  };

  const addStoneType = () => {
    const newStone: StoneType = {
      stoneId: genId(),
      name: "New Stone",
      type: "Diamond",
      clarity: "",
      color: "",
      slabs: [],
    };
    onChange({ ...settings, stoneTypes: [...settings.stoneTypes, newStone] });
    setEditingStoneId(newStone.stoneId);
  };

  const confirmRemoveStoneType = (stoneId: string) => {
    onChange({ ...settings, stoneTypes: settings.stoneTypes.filter((st) => st.stoneId !== stoneId) });
    if (editingStoneId === stoneId) setEditingStoneId(null);
    setStoneToDelete(null);
  };

  const addSlab = (stoneId: string) => {
    const stone = settings.stoneTypes.find((s) => s.stoneId === stoneId);
    if (!stone) return;
    const newSlab: Slab = { code: "", fromWeight: 0, toWeight: 0, pricePerCarat: 0, discount: 0 };
    updateStoneType(stoneId, { slabs: [...stone.slabs, newSlab] });
  };

  const updateSlab = (stoneId: string, slabIndex: number, updates: Partial<Slab>) => {
    const stone = settings.stoneTypes.find((s) => s.stoneId === stoneId);
    if (!stone) return;
    const slabs = stone.slabs.map((sl, i) => (i === slabIndex ? { ...sl, ...updates } : sl));
    updateStoneType(stoneId, { slabs });
  };

  const removeSlab = (stoneId: string, slabIndex: number) => {
    const stone = settings.stoneTypes.find((s) => s.stoneId === stoneId);
    if (!stone) return;
    updateStoneType(stoneId, { slabs: stone.slabs.filter((_, i) => i !== slabIndex) });
  };

  const editingStone = settings.stoneTypes.find((s) => s.stoneId === editingStoneId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Gold Rates */}
      <Card className="border border-[hsl(var(--border))]">
        <CardContent className="p-4">
          <Collapsible open={goldExpanded} onOpenChange={setGoldExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-1 hover:bg-[hsl(var(--muted))] rounded px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[hsl(var(--foreground))] uppercase tracking-wide">
                    Gold Rates
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[hsl(var(--foreground))]">
                    Base: 24K
                  </span>
                  {goldExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[hsl(var(--foreground))]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[hsl(var(--foreground))]" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4 space-y-3">
                <div className="p-3 bg-[hsl(var(--muted))] rounded-md">
                  <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide block mb-2">
                    24K Gold Rate (Base)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">₹</span>
                    <Input
                      type="number"
                      value={settings.goldRate24k}
                      onChange={(e) => updateGoldRate24k(Number(e.target.value))}
                      className="w-32 h-9 text-sm border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                    />
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">/g</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                    Purity Percentages
                  </p>
                  {calculatedGoldRates.map((gr) => (
                    <div
                      key={gr.purity}
                      className="flex items-center justify-between py-2 px-3 bg-[hsl(var(--muted))]/50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
                          {gr.purity}K
                        </span>
                        <span className="text-sm text-[hsl(var(--foreground))]">{gr.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={gr.percentage}
                          onChange={(e) => updatePurityPercentage(gr.purity, Number(e.target.value))}
                          className="w-16 h-8 text-xs text-right border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                        />
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">%</span>
                        <span className="text-sm font-mono text-[hsl(var(--muted-foreground))] ml-2">
                          {formatCurrency(gr.rate)}/g
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Making Charges */}
      <Card className="border border-[hsl(var(--border))]">
        <CardContent className="p-4">
          <Collapsible open={makingExpanded} onOpenChange={setMakingExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-1 hover:bg-[hsl(var(--muted))] rounded px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[hsl(var(--foreground))] uppercase tracking-wide">
                    Making Charges
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-[hsl(var(--foreground))]">
                    Flat: {formatCurrency(settings.makingChargeFlat)} | {formatCurrency(settings.makingChargePerGram)}/g
                  </span>
                  {makingExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[hsl(var(--foreground))]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[hsl(var(--foreground))]" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4 space-y-4">
                <div className="p-3 bg-[hsl(var(--muted))] rounded-md">
                  <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide block mb-2">
                    Flat Fee (≤ 2g)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">₹</span>
                    <Input
                      type="number"
                      value={settings.makingChargeFlat}
                      onChange={(e) => updateMakingFlat(Number(e.target.value))}
                      className="w-32 h-9 text-sm border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                    />
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">flat</span>
                  </div>
                </div>

                <div className="p-3 bg-[hsl(var(--muted))] rounded-md">
                  <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide block mb-2">
                    Per Gram (&gt; 2g)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">₹</span>
                    <Input
                      type="number"
                      value={settings.makingChargePerGram}
                      onChange={(e) => updateMakingPerGram(Number(e.target.value))}
                      className="w-32 h-9 text-sm border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                    />
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">/g</span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* GST / Tax */}
      <Card className="border border-[hsl(var(--border))]">
        <CardContent className="p-4">
          <Collapsible open={taxExpanded} onOpenChange={setTaxExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-1 hover:bg-[hsl(var(--muted))] rounded px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[hsl(var(--foreground))] uppercase tracking-wide">
                    Tax (GST)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-[hsl(var(--foreground))]">
                    {settings.gstRate * 100}%
                  </span>
                  {taxExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[hsl(var(--foreground))]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[hsl(var(--foreground))]" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4">
                <div className="p-3 bg-[hsl(var(--muted))] rounded-md">
                  <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide block mb-2">
                    GST Percentage
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.gstRate * 100}
                      onChange={(e) => updateGstRate(Number(e.target.value))}
                      className="w-24 h-9 text-sm border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                    />
                    <Percent className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Stone Prices */}
      <Card className="border border-[hsl(var(--border))]">
        <CardContent className="p-4">
          <Collapsible open={stonesExpanded} onOpenChange={setStonesExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-1 hover:bg-[hsl(var(--muted))] rounded px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[hsl(var(--foreground))] uppercase tracking-wide">
                    Stone Types
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addStoneType();
                    }}
                    className="h-7 text-xs gap-1 hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </Button>
                  <span className="text-xs text-[hsl(var(--foreground))]">
                    {settings.stoneTypes.length}
                  </span>
                  {stonesExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[hsl(var(--foreground))]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[hsl(var(--foreground))]" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4">
                {editingStone ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setEditingStoneId(null)}
                      className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to list
                    </button>

                    <div className="flex items-center gap-3 pb-3 border-b border-[hsl(var(--border))]">
                      <h3 className="text-base font-medium text-[hsl(var(--foreground))]">{editingStone.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {editingStone.type}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-[hsl(var(--muted-foreground))]">Name</label>
                        <Input
                          value={editingStone.name}
                          onChange={(e) => updateStoneType(editingStone.stoneId, { name: e.target.value })}
                          className="h-9 text-sm border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-[hsl(var(--muted-foreground))]">Stone ID</label>
                        <Input
                          value={editingStone.stoneId}
                          onChange={(e) => updateStoneType(editingStone.stoneId, { stoneId: e.target.value })}
                          className="h-9 text-sm border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-[hsl(var(--muted-foreground))]">Clarity</label>
                        <Input
                          value={editingStone.clarity}
                          onChange={(e) => updateStoneType(editingStone.stoneId, { clarity: e.target.value })}
                          className="h-9 text-sm border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-[hsl(var(--muted-foreground))]">Type</label>
                        <Select
                          value={editingStone.type}
                          onValueChange={(v) => updateStoneType(editingStone.stoneId, { type: v as "Diamond" | "Gemstone" })}
                        >
                          <SelectTrigger className="h-9 text-sm border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Diamond">Diamond</SelectItem>
                            <SelectItem value="Gemstone">Gemstone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-[hsl(var(--foreground))]">Pricing Slabs</h4>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {editingStone.slabs.length} {editingStone.slabs.length === 1 ? "slab" : "slabs"} defined
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addSlab(editingStone.stoneId)}
                          className="h-8 text-xs gap-1 hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                        >
                          <Plus className="w-3 h-3" />
                          Add Slab
                        </Button>
                      </div>

                      {editingStone.slabs.length === 0 ? (
                        <div className="text-center py-6 bg-[hsl(var(--muted))] rounded-md">
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">No slabs configured</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addSlab(editingStone.stoneId)}
                            className="mt-2 hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add first slab
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {editingStone.slabs.map((sl, i) => (
                            <motion.div
                              key={sl.code}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="grid grid-cols-6 gap-2 items-end p-3 bg-[hsl(var(--muted))] rounded-md"
                            >
                              <div className="space-y-1">
                                <label className="text-[10px] text-[hsl(var(--muted-foreground))] block">ID</label>
                                <Input
                                  value={sl.code}
                                  onChange={(e) => updateSlab(editingStone.stoneId, i, { code: e.target.value })}
                                  className="h-8 text-xs border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-[hsl(var(--muted-foreground))] block">From (ct)</label>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  value={sl.fromWeight}
                                  onChange={(e) => updateSlab(editingStone.stoneId, i, { fromWeight: Number(e.target.value) })}
                                  className="h-8 text-xs border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-[hsl(var(--muted-foreground))] block">To (ct)</label>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  value={sl.toWeight}
                                  onChange={(e) => updateSlab(editingStone.stoneId, i, { toWeight: Number(e.target.value) })}
                                  className="h-8 text-xs border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-[hsl(var(--muted-foreground))] block">₹/Carat</label>
                                <Input
                                  type="number"
                                  value={sl.pricePerCarat}
                                  onChange={(e) => updateSlab(editingStone.stoneId, i, { pricePerCarat: Number(e.target.value) })}
                                  className="h-8 text-xs border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSlab(editingStone.stoneId, i)}
                                className="h-8 w-8 p-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-transparent"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    className="space-y-2 pt-2"
                  >
                    {settings.stoneTypes.length === 0 ? (
                      <div className="text-center py-6 bg-[hsl(var(--muted))] rounded-md">
                        <Diamond className="w-8 h-8 text-[hsl(var(--muted-foreground))] mx-auto mb-2" />
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">No stone types configured</p>
                        <Button variant="ghost" size="sm" onClick={addStoneType} className="mt-2 text-[hsl(var(--foreground))]">
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add stone type
                        </Button>
                      </div>
                    ) : (
                      settings.stoneTypes.map((st) => (
                        <motion.div
                          key={st.stoneId}
                          layout
                          className="flex items-center justify-between p-3 bg-[hsl(var(--muted))] rounded-md group"
                        >
                          <div className="flex items-center gap-3">
                            <Diamond className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                            <div>
                              <p className="text-sm font-medium text-[hsl(var(--foreground))]">{st.name}</p>
                              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                                {st.stoneId} {st.clarity && `· ${st.clarity}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">
                              {st.type}
                            </Badge>
                            <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
                              {st.slabs.length} slabs
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingStoneId(st.stoneId)}
                                className="h-8 text-xs hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStoneToDelete(st.stoneId)}
                                className="h-8 w-8 p-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-transparent"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!stoneToDelete} onOpenChange={() => setStoneToDelete(null)}>
        <AlertDialogContent className="border border-[hsl(var(--border))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[hsl(var(--foreground))]">Delete Stone Type?</AlertDialogTitle>
            <AlertDialogDescription className="text-[hsl(var(--muted-foreground))]">
              This will permanently delete this stone type and all its pricing slabs.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => stoneToDelete && confirmRemoveStoneType(stoneToDelete)}
              className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:bg-[hsl(var(--foreground))]/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
