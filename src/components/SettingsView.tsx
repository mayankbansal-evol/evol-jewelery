import { FixedSettings, StonePrice } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface SettingsViewProps {
  settings: FixedSettings;
  onChange: (settings: FixedSettings) => void;
}

export default function SettingsView({ settings, onChange }: SettingsViewProps) {
  const updateGoldRate = (index: number, rate: number) => {
    const updated = [...settings.goldRates];
    updated[index] = { ...updated[index], rate };
    onChange({ ...settings, goldRates: updated });
  };

  const updateMaking = (value: number) => {
    onChange({ ...settings, makingCharge: value });
  };

  const updateStone = (index: number, field: keyof StonePrice, value: string | number) => {
    const updated = [...settings.stonePrices];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...settings, stonePrices: updated });
  };

  const addStone = () => {
    const newId = String(settings.stonePrices.length + 1);
    onChange({
      ...settings,
      stonePrices: [
        ...settings.stonePrices,
        { id: newId, code: "", fromWeight: 0, toWeight: 0, pricePerCarat: 0 },
      ],
    });
  };

  const removeStone = (index: number) => {
    onChange({
      ...settings,
      stonePrices: settings.stonePrices.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-8">
      {/* Gold Rates */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Gold Rates (per gram)</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Purity</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Rate (₹)</th>
              </tr>
            </thead>
            <tbody>
              {settings.goldRates.map((gr, i) => (
                <tr key={gr.purity} className="border-t border-border">
                  <td className="px-4 py-3 text-sm text-foreground">{gr.label}</td>
                  <td className="px-4 py-3 text-right">
                    <Input
                      type="number"
                      value={gr.rate}
                      onChange={(e) => updateGoldRate(i, Number(e.target.value))}
                      className="w-32 ml-auto text-right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Making Charge */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Making Charge (per gram)</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">₹</span>
          <Input
            type="number"
            value={settings.makingCharge}
            onChange={(e) => updateMaking(Number(e.target.value))}
            className="w-40"
          />
        </div>
      </section>

      {/* Stone Prices */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Diamond Stone Prices</h2>
          <Button variant="outline" size="sm" onClick={addStone}>
            <Plus className="w-4 h-4 mr-1" /> Add Row
          </Button>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-3 py-3 text-sm font-medium text-muted-foreground w-8">#</th>
                <th className="text-left px-3 py-3 text-sm font-medium text-muted-foreground">Code</th>
                <th className="text-left px-3 py-3 text-sm font-medium text-muted-foreground">From Wt</th>
                <th className="text-left px-3 py-3 text-sm font-medium text-muted-foreground">To Wt</th>
                <th className="text-right px-3 py-3 text-sm font-medium text-muted-foreground">₹/Carat</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {settings.stonePrices.map((sp, i) => (
                <tr key={sp.id} className="border-t border-border">
                  <td className="px-3 py-2 text-sm text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Input
                      value={sp.code}
                      onChange={(e) => updateStone(i, "code", e.target.value)}
                      className="w-full text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="0.0001"
                      value={sp.fromWeight}
                      onChange={(e) => updateStone(i, "fromWeight", Number(e.target.value))}
                      className="w-24 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="0.0001"
                      value={sp.toWeight}
                      onChange={(e) => updateStone(i, "toWeight", Number(e.target.value))}
                      className="w-24 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      value={sp.pricePerCarat}
                      onChange={(e) => updateStone(i, "pricePerCarat", Number(e.target.value))}
                      className="w-28 ml-auto text-right text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="sm" onClick={() => removeStone(i)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
