import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Calculator } from "lucide-react";
import SettingsView from "@/components/SettingsView";
import CalculatorView from "@/components/CalculatorView";
import { useSettings } from "@/hooks/useSettings";

const Index = () => {
  const { settings, setSettings } = useSettings();
  const [tab, setTab] = useState("calculator");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            💎 Diamond Jewelry Calculator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calculate pricing with gold rates, making charges, and diamond costs
          </p>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="calculator" className="gap-2">
              <Calculator className="w-4 h-4" /> Calculator
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <CalculatorView settings={settings} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsView settings={settings} onChange={setSettings} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
