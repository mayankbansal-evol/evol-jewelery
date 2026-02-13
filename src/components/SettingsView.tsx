import { useState } from "react";
import { FixedSettings, StoneType, Slab } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SettingsViewProps {
  settings: FixedSettings;
  onChange: (settings: FixedSettings) => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function SettingsView({ settings, onChange }: SettingsViewProps) {
  const [editingStoneId, setEditingStoneId] = useState<string | null>(null);

  const updateGoldRate = (index: number, rate: number) => {
    const updated = [...settings.goldRates];
    updated[index] = { ...updated[index], rate };
    onChange({ ...settings, goldRates: updated });
  };

  const updateMaking = (value: number) => {
    onChange({ ...settings, makingCharge: value });
  };

  const updateStoneType = (id: string, updates: Partial<StoneType>) => {
    onChange({
      ...settings,
      stoneTypes: settings.stoneTypes.map((st) =>
        st.id === id ? { ...st, ...updates } : st
      ),
    });
  };

  const addStoneType = () => {
    const newStone: StoneType = {
      id: genId(),
      name: "New Stone",
      stoneId: "",
      type: "Diamond",
      clarity: "",
      color: "",
      slabs: [],
    };
    onChange({ ...settings, stoneTypes: [...settings.stoneTypes, newStone] });
    setEditingStoneId(newStone.id);
  };

  const removeStoneType = (id: string) => {
    onChange({ ...settings, stoneTypes: settings.stoneTypes.filter((st) => st.id !== id) });
    if (editingStoneId === id) setEditingStoneId(null);
  };

  const addSlab = (stoneId: string) => {
    const stone = settings.stoneTypes.find((s) => s.id === stoneId);
    if (!stone) return;
    const newSlab: Slab = { id: genId(), code: "", fromWeight: 0, toWeight: 0, pricePerCarat: 0, discount: 0 };
    updateStoneType(stoneId, { slabs: [...stone.slabs, newSlab] });
  };

  const updateSlab = (stoneId: string, slabIndex: number, updates: Partial<Slab>) => {
    const stone = settings.stoneTypes.find((s) => s.id === stoneId);
    if (!stone) return;
    const slabs = stone.slabs.map((sl, i) => (i === slabIndex ? { ...sl, ...updates } : sl));
    updateStoneType(stoneId, { slabs });
  };

  const removeSlab = (stoneId: string, slabIndex: number) => {
    const stone = settings.stoneTypes.find((s) => s.id === stoneId);
    if (!stone) return;
    updateStoneType(stoneId, { slabs: stone.slabs.filter((_, i) => i !== slabIndex) });
  };

  const editingStone = settings.stoneTypes.find((s) => s.id === editingStoneId);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

  return (
    <div className="space-y-8">
      {/* Gold Rates */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">Gold Rates (per gram)</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/60">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purity</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rate (₹)</th>
              </tr>
            </thead>
            <tbody>
              {settings.goldRates.map((gr, i) => (
                <tr key={gr.purity} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-sm text-foreground font-medium">{gr.label}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Input type="number" value={gr.rate} onChange={(e) => updateGoldRate(i, Number(e.target.value))} className="w-32 ml-auto text-right h-8 text-sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Making Charge */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">Making Charge (per gram)</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">₹</span>
          <Input type="number" value={settings.makingCharge} onChange={(e) => updateMaking(Number(e.target.value))} className="w-40 h-9" />
        </div>
      </section>

      {/* Stone Prices */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Stone Prices</h2>
          <Button variant="outline" size="sm" onClick={addStoneType} className="h-8 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Stone Type
          </Button>
        </div>

        {/* If editing a specific stone */}
        {editingStone ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingStoneId(null)} className="h-8 px-2">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </Button>
              <h3 className="text-sm font-semibold text-foreground">Edit {editingStone.name}</h3>
              <Badge variant={editingStone.type === "Diamond" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                {editingStone.type}
              </Badge>
            </div>

            {/* Stone details */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stone Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                  <Input value={editingStone.name} onChange={(e) => updateStoneType(editingStone.id, { name: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Stone ID</label>
                  <Input value={editingStone.stoneId} onChange={(e) => updateStoneType(editingStone.id, { stoneId: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Clarity</label>
                  <Input value={editingStone.clarity} onChange={(e) => updateStoneType(editingStone.id, { clarity: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                  <Select value={editingStone.type} onValueChange={(v) => updateStoneType(editingStone.id, { type: v as "Diamond" | "Gemstone" })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diamond">Diamond</SelectItem>
                      <SelectItem value="Gemstone">Gemstone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Slabs */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing Slabs</p>
                <Button variant="ghost" size="sm" onClick={() => addSlab(editingStone.id)} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add Slab
                </Button>
              </div>
              {editingStone.slabs.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No slabs yet. Click "Add Slab" to add weight ranges.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-8">#</th>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">From Wt</th>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">To Wt</th>
                        <th className="text-right px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">₹/Carat</th>
                        <th className="text-right px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Discount</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingStone.slabs.map((sl, i) => (
                        <tr key={sl.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-1.5 text-xs text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-1.5">
                            <Input value={sl.code} onChange={(e) => updateSlab(editingStone.id, i, { code: e.target.value })} className="h-7 text-xs" />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input type="number" step="0.0001" value={sl.fromWeight} onChange={(e) => updateSlab(editingStone.id, i, { fromWeight: Number(e.target.value) })} className="h-7 text-xs w-24" />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input type="number" step="0.0001" value={sl.toWeight} onChange={(e) => updateSlab(editingStone.id, i, { toWeight: Number(e.target.value) })} className="h-7 text-xs w-24" />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input type="number" value={sl.pricePerCarat} onChange={(e) => updateSlab(editingStone.id, i, { pricePerCarat: Number(e.target.value) })} className="h-7 text-xs w-24 ml-auto text-right" />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input type="number" value={sl.discount} onChange={(e) => updateSlab(editingStone.id, i, { discount: Number(e.target.value) })} className="h-7 text-xs w-20 ml-auto text-right" />
                          </td>
                          <td className="px-3 py-1.5">
                            <Button variant="ghost" size="sm" onClick={() => removeSlab(editingStone.id, i)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Stone list */
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/60">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stone</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slabs</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {settings.stoneTypes.map((st) => (
                  <tr key={st.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{st.name}</p>
                        <p className="text-[11px] text-muted-foreground">{st.stoneId} {st.clarity && `· ${st.clarity}`}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={st.type === "Diamond" ? "default" : "secondary"}
                        className="text-[10px] font-medium"
                      >
                        {st.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                      {st.slabs.length} {st.slabs.length === 1 ? "Slab" : "Slabs"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => setEditingStoneId(st.id)} className="h-7 text-xs">
                          <Pencil className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeStoneType(st.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
