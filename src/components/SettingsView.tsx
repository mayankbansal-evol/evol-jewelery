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
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useSyncFromSheet } from "@/hooks/useSyncFromSheet";
import { useToast } from "@/hooks/use-toast";

interface SettingsViewProps {
  settings: FixedSettings;
  onChange: (settings: FixedSettings) => void;
  lastSynced: string | null;
  onApplySync: (newSettings: FixedSettings, syncedAt: string) => void;
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

export default function SettingsView({ settings, onChange, lastSynced, onApplySync }: SettingsViewProps) {
  const { sync, isSyncing, syncError } = useSyncFromSheet();
  const { toast } = useToast();

  const handleSync = async () => {
    const result = await sync(settings, onApplySync);
    if (result.success) {
      toast({
        title: "Synced successfully",
        description: "Prices have been updated from Google Sheets.",
      });
    } else {
      toast({
        title: "Sync failed",
        description: result.error ?? "Could not fetch data from Google Sheets.",
        variant: "destructive",
      });
    }
  };

  const lastSyncedLabel = (() => {
    if (!lastSynced) return "Never synced";
    const diff = Math.floor((Date.now() - new Date(lastSynced).getTime()) / 1000);
    if (diff < 60) return "Last Synced just now";
    if (diff < 3600) return `Last Synced ${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `Last Synced ${Math.floor(diff / 3600)}h ago`;
    return `Last Synced ${Math.floor(diff / 86400)}d ago`;
  })();

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
    <div className="space-y-4">
      {/* Sync Banner */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40">
        <div className="flex items-center gap-2 min-w-0">
          {syncError ? (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          ) : lastSynced ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          ) : (
            <RefreshCw className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0" />
          )}
          <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">
            {syncError ? syncError : lastSyncedLabel}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="ml-3 h-7 text-xs shrink-0 gap-1.5 border-[hsl(var(--border))]"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing…" : "Sync"}
        </Button>
      </div>

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
                      inputMode="decimal"
                      step="0.001"
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
                      className="flex items-center justify-between py-2 px-3 bg-[hsl(var(--muted))]/50 rounded-md gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] shrink-0">
                          {gr.purity}K
                        </span>
                        <span className="text-sm text-[hsl(var(--foreground))] shrink-0">{gr.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          value={gr.percentage}
                          onChange={(e) => updatePurityPercentage(gr.purity, Number(e.target.value))}
                          className="w-14 h-8 text-xs text-right border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                        />
                        <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">%</span>
                        <span className="text-sm font-mono text-[hsl(var(--muted-foreground))] whitespace-nowrap shrink-0">
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
                <div className="flex flex-col items-start gap-0.5 min-w-0">
                  <span className="text-xs font-medium text-[hsl(var(--foreground))] uppercase tracking-wide">
                    Making Charges
                  </span>
                  <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] truncate max-w-[200px] sm:max-w-none">
                    Flat {formatCurrency(settings.makingChargeFlat)} · {formatCurrency(settings.makingChargePerGram)}/g
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
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
                      inputMode="decimal"
                      step="0.001"
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
                      inputMode="decimal"
                      step="0.001"
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
                      inputMode="decimal"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                              key={sl.code + i}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-3 bg-[hsl(var(--muted))] rounded-md space-y-3"
                            >
                              {/* Slab number + delete row */}
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold tracking-widest uppercase text-[hsl(var(--muted-foreground))]/60">
                                  Slab {i + 1}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSlab(editingStone.stoneId, i)}
                                  className="h-7 w-7 p-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-transparent"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              {/* Fields: 2-col grid that works on all screen sizes */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-[hsl(var(--muted-foreground))] block">ID / Code</label>
                                  <Input
                                    value={sl.code}
                                    onChange={(e) => updateSlab(editingStone.stoneId, i, { code: e.target.value })}
                                    className="h-8 text-xs border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-[hsl(var(--muted-foreground))] block">₹/Carat</label>
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.001"
                                    value={sl.pricePerCarat}
                                    onChange={(e) => updateSlab(editingStone.stoneId, i, { pricePerCarat: Number(e.target.value) })}
                                    className="h-8 text-xs border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-[hsl(var(--muted-foreground))] block">From (ct)</label>
                                  <Input
                                    type="number"
                                    inputMode="decimal"
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
                                    inputMode="decimal"
                                    step="0.0001"
                                    value={sl.toWeight}
                                    onChange={(e) => updateSlab(editingStone.stoneId, i, { toWeight: Number(e.target.value) })}
                                    className="h-8 text-xs border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))]"
                                  />
                                </div>
                              </div>
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
                          className="p-3 bg-[hsl(var(--muted))] rounded-md"
                        >
                          {/* Row 1: name + actions */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <Diamond className="w-4 h-4 text-[hsl(var(--muted-foreground))] mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[hsl(var(--foreground))] break-words leading-snug">
                                  {st.name}
                                </p>
                                <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                                  {st.stoneId}{st.clarity && ` · ${st.clarity}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingStoneId(st.stoneId)}
                                className="h-8 text-xs hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] px-2.5"
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
                          {/* Row 2: type badge + slabs count */}
                          <div className="flex items-center gap-2 mt-2 pl-6">
                            <Badge variant="secondary" className="text-xs">
                              {st.type}
                            </Badge>
                            <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
                              {st.slabs.length} slabs
                            </span>
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
    </div>
  );
}
