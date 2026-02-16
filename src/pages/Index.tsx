import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Calculator, Gem } from "lucide-react";
import SettingsView from "@/components/SettingsView";
import CalculatorView from "@/components/CalculatorView";
import { useSettings } from "@/hooks/useSettings";

const tabVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const Index = () => {
  const { settings, setSettings } = useSettings();
  const [tab, setTab] = useState("calculator");

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <Gem className="w-6 h-6 text-[hsl(var(--foreground))]" />
            <h1 className="text-xl font-medium text-[hsl(var(--foreground))] tracking-tight">
              Jewelry Calculator
            </h1>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 ml-9">
            Calculate pricing with gold rates, making charges, and stone costs
          </p>
        </motion.header>

        <Tabs value={tab} onValueChange={setTab}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <TabsList className="mb-4 w-full sm:w-auto bg-[hsl(var(--muted))] p-1 rounded-md">
              <TabsTrigger 
                value="calculator" 
                className="gap-2 flex-1 sm:flex-none data-[state=active]:bg-[hsl(var(--background))] data-[state=active]:text-[hsl(var(--foreground))] data-[state=active]:shadow-sm"
              >
                <Calculator className="w-4 h-4" />
                <span>Calculator</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="gap-2 flex-1 sm:flex-none data-[state=active]:bg-[hsl(var(--background))] data-[state=active]:text-[hsl(var(--foreground))] data-[state=active]:shadow-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <AnimatePresence mode="wait">
            <TabsContent value="calculator" asChild>
              <motion.div
                key="calculator"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <CalculatorView settings={settings} />
              </motion.div>
            </TabsContent>

            <TabsContent value="settings" asChild>
              <motion.div
                key="settings"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                <SettingsView settings={settings} onChange={setSettings} />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
