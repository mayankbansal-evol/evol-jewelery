import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import { motion, AnimatePresence } from "motion/react";
import {
  FixedSettings,
  DiamondEntry,
  Slab,
  CatalogueLookupProduct,
} from "@/lib/types";
import { useCalculatorState } from "@/hooks/useCalculatorState";
import { useNumericInput } from "@/hooks/useNumericInput";
import { saveSearchEstimate } from "@/lib/productsApi";
import type { ProductRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCatalogueProductDetails,
  useCatalogueProductSearch,
} from "@/hooks/useCatalogueProductLookup";
import { Button } from "@/components/ui/button";
import { BarcodeScanDialog } from "@/components/BarcodeScanDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  Diamond,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  ImageIcon,
  X,
  Download,
  Loader2,
  CircleDollarSign,
  Gem,
  Package,
  AlertCircle,
  Info,
  History,
  Search,
  MapPinned,
  ScanLine,
  Edit2,
  PlusSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calculateGoldRate,
  computeEstimateFromInputs,
  getStoneSlabs as getStoneSlabsForType,
  resolveAutoSlab,
  type PricingBreakdown,
} from "@/lib/pricing";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import { normalizeCatalogueProduct } from "@/lib/catalogMapping";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD_PURITIES = ["24", "22", "18", "14"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalculatorViewProps {
  settings: FixedSettings;
  initialProduct?: ProductRecord | null;
  onProductLoaded?: () => void; // called after initial product is consumed
}

type EntryMode = "search" | "calculate";

const ENTRY_MODE_STORAGE_KEY = "calculator-entry-mode";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function getStoredEntryMode(): EntryMode {
  try {
    const stored = localStorage.getItem(ENTRY_MODE_STORAGE_KEY);
    return stored === "search" || stored === "calculate" ? stored : "calculate";
  } catch {
    return "calculate";
  }
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

// ─── UI Components ─────────────────────────────────────────────────────────────

function ValidationMessage({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="flex items-center gap-1.5 text-xs text-[hsl(var(--destructive))] mt-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  isComplete,
}: {
  icon: React.ElementType;
  title: string;
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
        </div>
        <span className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--foreground))]">
          {title}
        </span>
      </div>
      {isComplete && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <CheckCircle2 className="w-4 h-4 text-[hsl(var(--foreground))]" />
        </motion.div>
      )}
    </div>
  );
}

function ProgressIndicator({
  sections,
}: {
  sections: { label: string; isComplete: boolean }[];
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {sections.map((section, index) => (
        <div key={section.label} className="flex items-center gap-2">
          <motion.div
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300",
              section.isComplete
                ? "bg-[hsl(var(--foreground))]"
                : "border border-[hsl(var(--border))]",
            )}
            initial={false}
            animate={{
              scale: section.isComplete ? 1.2 : 1,
              backgroundColor: section.isComplete
                ? "hsl(var(--foreground))"
                : "transparent",
            }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          />
          {index < sections.length - 1 && (
            <div className="w-8 h-[1px] bg-[hsl(var(--border))]" />
          )}
        </div>
      ))}
    </div>
  );
}

function BigInput({
  value,
  onChange,
  placeholder,
  type = "text",
  step,
  min,
  autoFocus,
  suffix,
  className,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  min?: string;
  autoFocus?: boolean;
  suffix?: string;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex items-baseline gap-2">
      <input
        type={type}
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full bg-transparent text-xl md:text-[2rem] font-light text-[hsl(var(--foreground))]",
          "placeholder:text-[hsl(var(--muted-foreground))]/30",
          "border-0 border-b-2 pb-2 focus:outline-none transition-colors tabular",
          focused
            ? "border-[hsl(var(--foreground))]"
            : "border-[hsl(var(--border))]",
          className,
        )}
      />
      {suffix && (
        <span className="text-sm text-[hsl(var(--muted-foreground))] shrink-0 pb-2">
          {suffix}
        </span>
      )}
    </div>
  );
}

function PurityCard({
  label,
  rate,
  selected,
  onClick,
}: {
  label: string;
  rate: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-150 focus:outline-none",
        selected
          ? "border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]/30",
      )}
    >
      <span className="text-xl font-semibold">{label}</span>
      <span
        className={cn(
          "text-xs mt-1 tabular",
          selected
            ? "text-[hsl(var(--background))]/70"
            : "text-[hsl(var(--muted-foreground))]",
        )}
      >
        {rate}/g
      </span>
      {selected && (
        <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 opacity-80" />
      )}
    </button>
  );
}

// ─── Auto slab lookup ────────────────────────────────────────────────────────

// ─── Stone row ────────────────────────────────────────────────────────────────

function StoneRow({
  stone,
  index,
  stoneTypes,
  stoneSlabs,
  canRemove,
  onTypeChange,
  onWeightChange,
  onQtyChange,
  onRemove,
}: {
  stone: DiamondEntry;
  index: number;
  stoneTypes: FixedSettings["stoneTypes"];
  stoneSlabs: Slab[];
  canRemove: boolean;
  onTypeChange: (v: string) => void;
  onWeightChange: (v: string) => void;
  onQtyChange: (v: string) => void;
  onRemove: () => void;
}) {
  const weightInput = useNumericInput(
    stone.weight,
    (n) => onWeightChange(String(n)),
    {
      allowDecimal: true,
      min: 0,
    },
  );

  const qtyInput = useNumericInput(
    stone.quantity,
    (n) => onQtyChange(String(Math.max(1, n))),
    {
      allowDecimal: false,
      min: 1,
    },
  );

  const autoSlab = resolveAutoSlab(stoneSlabs, stone.weight, stone.quantity);
  const hasWeight = stone.weight > 0;
  const noSlabMatch = hasWeight && !autoSlab && stoneSlabs.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      className="group"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-[hsl(var(--muted-foreground))]/60">
          Stone {index + 1}
        </span>

        {/* Auto-resolved slab info tooltip */}
        {hasWeight && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-medium transition-colors focus:outline-none",
                    autoSlab
                      ? "text-[hsl(var(--foreground))]/50 hover:text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--destructive))]/70 hover:text-[hsl(var(--destructive))]",
                  )}
                >
                  <Info className="w-3 h-3" />
                  {autoSlab ? (
                    <span className="tabular">
                      {formatNumber(autoSlab.fromWeight, 3)}–
                      {formatNumber(autoSlab.toWeight, 3)} ct
                    </span>
                  ) : (
                    <span>No slab matched</span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[220px]">
                {autoSlab ? (
                  <div className="space-y-0.5">
                    <p className="font-semibold">Slab Applied</p>
                    <p className="font-mono text-[11px] text-[hsl(var(--muted-foreground))]">
                      {autoSlab.code}
                    </p>
                    <p>
                      {formatNumber(autoSlab.fromWeight, 3)}–
                      {formatNumber(autoSlab.toWeight, 3)} ct per piece
                    </p>
                    <p className="font-medium">
                      {formatCurrency(autoSlab.pricePerCarat)}/ct
                    </p>
                    <p className="text-[hsl(var(--muted-foreground))] text-[10px] pt-0.5">
                      Per-piece weight:{" "}
                      {formatNumber(
                        stone.weight / Math.max(1, stone.quantity),
                        4,
                      )}{" "}
                      ct
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[hsl(var(--destructive))]">
                      No slab matched
                    </p>
                    <p className="text-[hsl(var(--muted-foreground))]">
                      Per-piece weight{" "}
                      {formatNumber(
                        stone.weight / Math.max(1, stone.quantity),
                        4,
                      )}{" "}
                      ct falls outside all defined slabs.
                    </p>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {canRemove && (
          <button
            onClick={onRemove}
            className="ml-auto flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]/50 hover:text-[hsl(var(--destructive))] transition-colors md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
        )}
      </div>

      <div className="mb-3">
        <div className="space-y-1">
          <label className="text-[10px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/70">
            Type
          </label>
          <Select value={stone.stoneTypeId} onValueChange={onTypeChange}>
            <SelectTrigger className="h-9 text-sm border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))] transition-colors">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {stoneTypes.map((st) => (
                <SelectItem key={st.stoneId} value={st.stoneId}>
                  <div className="flex items-center gap-2">
                    {st.type === "Diamond" ? (
                      <Diamond className="w-3 h-3 shrink-0 text-[hsl(var(--muted-foreground))]" />
                    ) : (
                      <span className="w-3 h-3 rounded-full bg-[hsl(var(--muted-foreground))]/40 shrink-0" />
                    )}
                    <span>{st.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/70">
            Stone Net Weight
          </label>
          <div className="flex items-baseline gap-1.5">
            <input
              type="text"
              inputMode="decimal"
              value={weightInput.display}
              onChange={weightInput.handleChange}
              onFocus={weightInput.handleFocus}
              onBlur={weightInput.handleBlur}
              placeholder="0.000"
              className={cn(
                "w-full bg-transparent text-base font-medium text-[hsl(var(--foreground))]",
                "placeholder:text-[hsl(var(--muted-foreground))]/30",
                "border-0 border-b pb-1 focus:outline-none transition-colors tabular",
                weightInput.isFocused
                  ? "border-[hsl(var(--foreground))]"
                  : "border-[hsl(var(--border))]",
              )}
            />
            <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0 pb-1">
              ct
            </span>
          </div>
          {noSlabMatch && (
            <ValidationMessage message="Weight outside slab range" />
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/70">
            Total Pieces
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={qtyInput.display}
            onChange={qtyInput.handleChange}
            onFocus={qtyInput.handleFocus}
            onBlur={qtyInput.handleBlur}
            placeholder="1"
            className={cn(
              "w-full bg-transparent text-base font-medium text-[hsl(var(--foreground))]",
              "placeholder:text-[hsl(var(--muted-foreground))]/30",
              "border-0 border-b pb-1 focus:outline-none transition-colors tabular",
              qtyInput.isFocused
                ? "border-[hsl(var(--foreground))]"
                : "border-[hsl(var(--border))]",
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Product Section ──────────────────────────────────────────────────────────

function ProductSection({
  productName,
  productImageUrl,
  productNote,
  fileInputRef,
  onNameChange,
  onNoteChange,
  onImageFile,
  onRemoveImage,
}: {
  productName: string;
  productImageUrl: string | null;
  productNote: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onNameChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onImageFile: (file: File) => void;
  onRemoveImage: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            onImageFile(file);
            break;
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onImageFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onImageFile(file);
    },
    [onImageFile],
  );

  return (
    <div className="space-y-4">
      {/* Image */}
      <div className="space-y-2">
        {productImageUrl ? (
          <div className="flex items-center gap-4">
            <div
              className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[hsl(var(--muted))] cursor-pointer group"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <img
                src={productImageUrl}
                alt="Product"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[hsl(var(--foreground))]/0 group-hover:bg-[hsl(var(--foreground))]/20 transition-colors" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage();
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[hsl(var(--foreground))]/70 text-[hsl(var(--background))] flex items-center justify-center hover:bg-[hsl(var(--foreground))] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline underline-offset-4 transition-colors"
            >
              Change image
            </button>
          </div>
        ) : (
          <motion.div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            animate={{
              scale: isDragOver ? 1.02 : 1,
              borderColor: isDragOver
                ? "hsl(var(--foreground))"
                : "hsl(var(--border))",
              backgroundColor: isDragOver
                ? "hsl(var(--foreground) / 0.05)"
                : "transparent",
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "w-full h-20 rounded-xl border-2 border-dashed cursor-pointer",
              "flex flex-col items-center justify-center gap-1.5 focus:outline-none",
              "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
            )}
          >
            <motion.div
              animate={{ scale: isDragOver ? 1.1 : 1 }}
              transition={{ duration: 0.15 }}
            >
              <ImageIcon className="w-5 h-5" />
            </motion.div>
            <div className="text-center">
              <span className="text-xs font-medium">
                {isDragOver ? "Drop image here" : "Drag, paste, or click"}
              </span>
            </div>
          </motion.div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageFile(file);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/70">
          Product Name
        </label>
        <input
          type="text"
          value={productName}
          onChange={(e) => onNameChange(e.target.value)}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          placeholder="e.g. Solitaire Ring"
          className={cn(
            "w-full bg-transparent text-lg font-light text-[hsl(var(--foreground))]",
            "placeholder:text-[hsl(var(--muted-foreground))]/30",
            "border-0 border-b-2 pb-2 focus:outline-none transition-colors",
            nameFocused
              ? "border-[hsl(var(--foreground))]"
              : "border-[hsl(var(--border))]",
          )}
        />
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/70">
          Note
        </label>
        <textarea
          value={productNote}
          onChange={(e) => onNoteChange(e.target.value)}
          onFocus={() => setNoteFocused(true)}
          onBlur={() => setNoteFocused(false)}
          placeholder="Any additional notes…"
          rows={2}
          className={cn(
            "w-full bg-transparent text-sm text-[hsl(var(--foreground))] resize-none",
            "placeholder:text-[hsl(var(--muted-foreground))]/30",
            "border-0 border-b-2 pb-2 focus:outline-none transition-colors leading-relaxed",
            noteFocused
              ? "border-[hsl(var(--foreground))]"
              : "border-[hsl(var(--border))]",
          )}
        />
      </div>
    </div>
  );
}

// ─── Form View ─────────────────────────────────────────────────────────────────

function EstimateBreakdownCard({
  productName,
  productImageUrl,
  productNote,
  purity,
  pricing,
  gstRate,
  externalPrice,
  externalCurrency,
  grossWeightOverride,
  meta,
}: {
  productName: string;
  productImageUrl: string | null;
  productNote: string;
  purity: string;
  pricing: PricingBreakdown;
  gstRate: number;
  externalPrice?: number | null;
  externalCurrency?: string;
  grossWeightOverride?: number;
  meta?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden bg-[hsl(var(--card))]">
      <div className="p-4 flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[hsl(var(--muted))] shrink-0">
          {productImageUrl ? (
            <img
              src={productImageUrl}
              alt={productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-[hsl(var(--muted-foreground))]/40" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{productName}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {purity}K
          </p>
          {productNote.trim() && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-1">
              {productNote.trim()}
            </p>
          )}
          {meta}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2.5 text-sm">
        {externalPrice != null && (
          <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--muted))]/50 px-3 py-2">
            <span className="text-[hsl(var(--muted-foreground))]">
              Catalogue Price
            </span>
            <span className="font-semibold tabular">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: externalCurrency || "INR",
                maximumFractionDigits: 0,
              }).format(externalPrice)}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-[hsl(var(--muted-foreground))]">
            Gross Weight
          </span>
          <span className="font-medium tabular">
            {formatNumber(grossWeightOverride ?? pricing.grossWeight)} g
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[hsl(var(--muted-foreground))]">Gold</span>
          <span className="font-medium tabular">
            {formatCurrency(pricing.goldCost)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[hsl(var(--muted-foreground))]">Making</span>
          <span className="font-medium tabular">
            {formatCurrency(pricing.makingCost)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[hsl(var(--muted-foreground))]">Stones</span>
          <span className="font-medium tabular">
            {formatCurrency(pricing.totalStoneCost)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[hsl(var(--muted-foreground))]">
            GST ({(gstRate * 100).toFixed(1)}%)
          </span>
          <span className="font-medium tabular">
            {formatCurrency(pricing.gst)}
          </span>
        </div>
      </div>

      <div className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))] px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium">Local Estimate</span>
        <span className="text-xl font-bold tabular">
          {formatCurrency(pricing.total)}
        </span>
      </div>
    </div>
  );
}

function CatalogueLookupSection({ settings }: { settings: FixedSettings }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const savedLookupKeyRef = useRef<string | null>(null);

  const searchQuery = useCatalogueProductSearch(submittedCode, hasSearched);
  const selectedResult = searchQuery.data;
  const detailsQuery = useCatalogueProductDetails(
    selectedResult?.slug ?? null,
    !!selectedResult,
  );

  const normalizedEstimate = useMemo(() => {
    if (!detailsQuery.data) return null;
    return normalizeCatalogueProduct(detailsQuery.data, settings);
  }, [detailsQuery.data, settings]);

  const normalizedProduct: CatalogueLookupProduct | null =
    normalizedEstimate?.product ?? null;
  const hasIssues = (normalizedEstimate?.issues.length ?? 0) > 0;

  const submitLookupCode = (rawCode: string) => {
    const code = normalizeDecodedId(rawCode);
    if (!code) return false;

    setSearchInput(code);

    if (hasSearched && code === submittedCode) {
      searchQuery.refetch();
      if (selectedResult?.slug) {
        detailsQuery.refetch();
      }
      return true;
    }

    savedLookupKeyRef.current = null;
    setHasSearched(true);
    setSubmittedCode(code);
    return true;
  };

  useEffect(() => {
    if (!normalizedEstimate || !submittedCode) return;
    if (savedLookupKeyRef.current === normalizedEstimate.product.lookupKey)
      return;

    savedLookupKeyRef.current = normalizedEstimate.product.lookupKey;

    saveSearchEstimate({
      barcodeId: submittedCode,
      slug: normalizedEstimate.product.slug,
      productName: normalizedEstimate.product.productName,
      productImageUrl: normalizedEstimate.product.imageUrl,
      purity: normalizedEstimate.product.purity,
      netGoldWeight: normalizedEstimate.product.netGoldWeight,
      stones: normalizedEstimate.stones.map((stone) => ({
        stoneTypeId: stone.stoneTypeId,
        name:
          settings.stoneTypes.find((s) => s.stoneId === stone.stoneTypeId)
            ?.name ?? "",
        weight: stone.weight,
        quantity: stone.quantity,
      })),
    }).then(({ error }) => {
      if (error) {
        toast({
          title: "Could not save lookup estimate",
          description: error,
          variant: "destructive",
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }
    });
  }, [
    normalizedEstimate,
    queryClient,
    settings.stoneTypes,
    submittedCode,
    toast,
  ]);

  const handleSearch = () => {
    submitLookupCode(searchInput);
  };

  const isLoading = searchQuery.isFetching || detailsQuery.isFetching;
  const notFound =
    hasSearched && !isLoading && submittedCode && searchQuery.data === null;
  const errorMessage =
    searchQuery.error?.message ?? detailsQuery.error?.message ?? null;

  return (
    <div className="py-6">
      <SectionHeader
        icon={Search}
        title="Code Lookup"
        isComplete={!!normalizedEstimate && !hasIssues}
      />

      <div className="space-y-4">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/25 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="enter barcode to search"
              className="flex-1 h-11 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm font-medium uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-[hsl(var(--foreground))]/10"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScannerOpen(true)}
              className="h-11 px-4 gap-2"
            >
              <ScanLine className="w-4 h-4" />
              <span>Scan</span>
            </Button>
            <Button
              onClick={handleSearch}
              disabled={!searchInput.trim() || isLoading}
              className="h-11 px-5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </div>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            Fetch product details by code and compute a fresh estimate using
            current local rates.
          </p>
        </div>

        <BarcodeScanDialog
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          onDecoded={(code) => {
            submitLookupCode(code);
          }}
        />

        {errorMessage && (
          <div className="rounded-xl border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/8 px-4 py-3 text-sm text-[hsl(var(--destructive))]">
            {errorMessage}
          </div>
        )}

        {notFound && (
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
            No product found for code{" "}
            <span className="font-semibold text-[hsl(var(--foreground))]">
              {submittedCode}
            </span>
            .
          </div>
        )}

        {normalizedProduct && (
          <div className="space-y-4">
            <EstimateBreakdownCard
              productName={normalizedProduct.productName}
              productImageUrl={normalizedProduct.imageUrl}
              productNote={normalizedProduct.description}
              purity={normalizedProduct.purity}
              pricing={normalizedEstimate!.pricing}
              gstRate={settings.gstRate}
              externalPrice={normalizedProduct.sourcePrice}
              externalCurrency={normalizedProduct.sourceCurrency}
              grossWeightOverride={normalizedProduct.grossWeight}
              meta={
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]">
                  <span>{normalizedProduct.productCode}</span>
                  <span>•</span>
                  <span>{normalizedProduct.categoryLabel}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPinned className="w-3 h-3" />
                    {normalizedProduct.location}
                  </span>
                </div>
              }
            />

            <div className="rounded-2xl border border-[hsl(var(--border))] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Stone Mapping</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {normalizedProduct.stones.length} lines
                </p>
              </div>
              <div className="space-y-2">
                {normalizedProduct.stones.map((stone) => (
                  <div
                    key={stone.id}
                    className="flex items-start justify-between gap-3 rounded-xl bg-[hsl(var(--muted))]/35 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{stone.code}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {formatNumber(stone.weight, 3)} ct • {stone.quantity}{" "}
                        pcs
                        {stone.stoneName !== "Unknown"
                          ? ` • ${stone.stoneName}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Source
                      </p>
                      <p className="text-sm font-medium tabular">
                        {formatCurrency(stone.sourceAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {hasIssues && (
                <div className="rounded-xl border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/8 px-4 py-3">
                  <p className="text-sm font-semibold text-[hsl(var(--destructive))]">
                    Estimate blocked
                  </p>
                  <div className="mt-1 space-y-1">
                    {normalizedEstimate!.issues.map((issue) => (
                      <p
                        key={`${issue.code}:${issue.reason}`}
                        className="text-xs text-[hsl(var(--destructive))]"
                      >
                        {issue.code}: {issue.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogueLookupModeSection({
  settings,
  active,
  resetSignal,
  onSummaryReady,
}: {
  settings: FixedSettings;
  active: boolean;
  resetSignal: number;
  onSummaryReady: (summary: SummaryState) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const savedLookupKeyRef = useRef<string | null>(null);
  const openedSummaryKeyRef = useRef<string | null>(null);

  const searchQuery = useCatalogueProductSearch(submittedCode, hasSearched);
  const selectedResult = searchQuery.data;
  const detailsQuery = useCatalogueProductDetails(
    selectedResult?.slug ?? null,
    !!selectedResult,
  );

  const normalizedEstimate = useMemo(() => {
    if (!detailsQuery.data) return null;
    return normalizeCatalogueProduct(detailsQuery.data, settings);
  }, [detailsQuery.data, settings]);

  const normalizedProduct: CatalogueLookupProduct | null =
    normalizedEstimate?.product ?? null;
  const hasIssues = (normalizedEstimate?.issues.length ?? 0) > 0;

  const submitLookupCode = (rawCode: string) => {
    const code = normalizeDecodedId(rawCode);
    if (!code) return false;

    setSearchInput(code);
    openedSummaryKeyRef.current = null;

    if (hasSearched && code === submittedCode) {
      searchQuery.refetch();
      if (selectedResult?.slug) {
        detailsQuery.refetch();
      }
      return true;
    }

    savedLookupKeyRef.current = null;
    setHasSearched(true);
    setSubmittedCode(code);
    return true;
  };

  useEffect(() => {
    if (!normalizedEstimate || !active || !submittedCode) return;

    const lookupKey = normalizedEstimate.product.lookupKey;
    if (savedLookupKeyRef.current === lookupKey) return;

    savedLookupKeyRef.current = lookupKey;

    saveSearchEstimate({
      barcodeId: submittedCode,
      slug: normalizedEstimate.product.slug,
      productName: normalizedEstimate.product.productName,
      productImageUrl: normalizedEstimate.product.imageUrl,
      purity: normalizedEstimate.product.purity,
      netGoldWeight: normalizedEstimate.product.netGoldWeight,
      stones: normalizedEstimate.stones.map((stone) => ({
        stoneTypeId: stone.stoneTypeId,
        name:
          settings.stoneTypes.find((s) => s.stoneId === stone.stoneTypeId)
            ?.name ?? "",
        weight: stone.weight,
        quantity: stone.quantity,
      })),
    }).then(({ error }) => {
      if (error) {
        toast({
          title: "Could not save lookup estimate",
          description: error,
          variant: "destructive",
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }
    });
  }, [
    active,
    normalizedEstimate,
    queryClient,
    settings.stoneTypes,
    submittedCode,
    toast,
  ]);

  useEffect(() => {
    if (!normalizedEstimate || hasIssues || !active) return;

    const lookupKey = normalizedEstimate.product.lookupKey;
    if (openedSummaryKeyRef.current === lookupKey) return;

    openedSummaryKeyRef.current = lookupKey;

    onSummaryReady({
      origin: "search",
      data: buildSummaryData({
        productName: normalizedEstimate.product.productName,
        productImageUrl: normalizedEstimate.product.imageUrl,
        productNote: normalizedEstimate.product.description,
        netGoldWeight: normalizedEstimate.product.netGoldWeight,
        purity: normalizedEstimate.product.purity,
        pricing: normalizedEstimate.pricing,
        gstRate: settings.gstRate,
        makingChargePerGram: settings.makingChargePerGram,
      }),
    });
  }, [
    active,
    hasIssues,
    normalizedEstimate,
    onSummaryReady,
    settings.gstRate,
    settings.makingChargePerGram,
  ]);

  useEffect(() => {
    setSearchInput("");
    setSubmittedCode("");
    setHasSearched(false);
    setIsScannerOpen(false);
    savedLookupKeyRef.current = null;
    openedSummaryKeyRef.current = null;
  }, [resetSignal]);

  const handleSearch = () => {
    submitLookupCode(searchInput);
  };

  const isLoading = searchQuery.isFetching || detailsQuery.isFetching;
  const notFound =
    hasSearched && !isLoading && submittedCode && searchQuery.data === null;
  const errorMessage =
    searchQuery.error?.message ?? detailsQuery.error?.message ?? null;

  return (
    <div className="py-6">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsScannerOpen(true)}
            className="h-11 w-full justify-center gap-2 rounded-xl px-4"
          >
            <ScanLine className="h-4 w-4" />
            <span>Search Barcode</span>
          </Button>

          <div className="flex min-w-0 items-center gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="enter barcode to search"
              className="h-11 min-w-0 flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm font-medium uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-[hsl(var(--foreground))]/10"
            />
            <Button
              type="button"
              onClick={handleSearch}
              disabled={!searchInput.trim() || isLoading}
              className="h-11 w-11 shrink-0 rounded-xl px-0"
              aria-label="Search by product code"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <BarcodeScanDialog
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          onDecoded={(code) => {
            submitLookupCode(code);
          }}
        />

        {errorMessage && (
          <div className="rounded-xl border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/8 px-4 py-3 text-sm text-[hsl(var(--destructive))]">
            {errorMessage}
          </div>
        )}

        {notFound && (
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
            No product found for code{" "}
            <span className="font-semibold text-[hsl(var(--foreground))]">
              {submittedCode}
            </span>
            .
          </div>
        )}

        {normalizedProduct && hasIssues && (
          <div className="rounded-2xl border border-[hsl(var(--border))] p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {normalizedProduct.productName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]">
                  <span>{normalizedProduct.productCode}</span>
                  <span>•</span>
                  <span>{normalizedProduct.categoryLabel}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPinned className="w-3 h-3" />
                    {normalizedProduct.location}
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[hsl(var(--muted))] px-2 py-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                {normalizedProduct.stones.length} stone lines
              </span>
            </div>

            <div className="rounded-xl border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/8 px-4 py-3">
              <p className="text-sm font-semibold text-[hsl(var(--destructive))]">
                Estimate blocked
              </p>
              <div className="mt-1 space-y-1">
                {normalizedEstimate!.issues.map((issue) => (
                  <p
                    key={`${issue.code}:${issue.reason}`}
                    className="text-xs text-[hsl(var(--destructive))]"
                  >
                    {issue.code}: {issue.reason}
                  </p>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {normalizedProduct.stones.map((stone) => (
                <div
                  key={stone.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-[hsl(var(--muted))]/35 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{stone.code}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formatNumber(stone.weight, 3)} ct • {stone.quantity} pcs
                      {stone.stoneName !== "Unknown"
                        ? ` • ${stone.stoneName}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Source
                    </p>
                    <p className="text-sm font-medium tabular">
                      {formatCurrency(stone.sourceAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface FormViewProps {
  settings: FixedSettings;
  formState: {
    netGoldWeight: number;
    purity: string;
    stones: DiamondEntry[];
    productName: string;
    productNote: string;
  };
  productImageUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  updateNetGoldWeight: (v: number) => void;
  updatePurity: (v: string) => void;
  updateStones: React.Dispatch<React.SetStateAction<DiamondEntry[]>>;
  updateProductName: (v: string) => void;
  updateProductNote: (v: string) => void;
  handleImageFile: (file: File) => void;
  removeImage: () => void;
  onCalculate: () => void;
  onReset: () => void;
}

function FormView({
  settings,
  formState,
  productImageUrl,
  fileInputRef,
  updateNetGoldWeight,
  updatePurity,
  updateStones,
  updateProductName,
  updateProductNote,
  handleImageFile,
  removeImage,
  onCalculate,
  onReset,
}: FormViewProps) {
  const { netGoldWeight, purity, stones, productName, productNote } = formState;
  const [weightTouched, setWeightTouched] = useState(false);

  const goldWeightInput = useNumericInput(netGoldWeight, updateNetGoldWeight, {
    allowDecimal: true,
    min: 0,
  });

  const calculatedGoldRates = useMemo(() => {
    return GOLD_PURITIES.map((purityVal) => {
      const rate = calculateGoldRate(
        settings.goldRate24k,
        purityVal,
        settings.purityPercentages,
      );
      return { purity: purityVal, label: `${purityVal}K`, rate };
    });
  }, [settings.goldRate24k, settings.purityPercentages]);

  const getStoneSlabs = useCallback(
    (stoneTypeId: string): Slab[] =>
      getStoneSlabsForType(settings.stoneTypes, stoneTypeId),
    [settings.stoneTypes],
  );

  const updateStone = (
    id: string,
    field: keyof DiamondEntry,
    value: string | number,
  ) => {
    updateStones((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  const handleStoneTypeChange = (id: string, value: string) => {
    updateStones((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stoneTypeId: value } : d)),
    );
  };

  const addStone = () => {
    updateStones((prev) => [
      ...prev,
      {
        id: generateId(),
        stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "",
        weight: 0,
        quantity: 1,
      },
    ]);
  };

  const removeStone = (id: string) => {
    updateStones((prev) => prev.filter((d) => d.id !== id));
  };

  // A stone row is valid when it has a weight and the auto-slab resolves successfully
  const stonesValid =
    stones.length > 0 &&
    stones.some((s) => s.weight > 0) &&
    stones.every((s) => {
      if (s.weight === 0) return true; // empty rows are ignored
      const slab = resolveAutoSlab(
        getStoneSlabs(s.stoneTypeId),
        s.weight,
        s.quantity,
      );
      return slab !== null;
    });

  const progressSections = [
    { label: "Gold", isComplete: netGoldWeight > 0 },
    { label: "Stones", isComplete: stonesValid },
    { label: "Product", isComplete: !!(productImageUrl || productName.trim()) },
  ];

  const canCalculate = netGoldWeight > 0 && stonesValid;
  const weightError =
    weightTouched && netGoldWeight <= 0 ? "Enter net gold weight" : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
      className="space-y-0"
    >
      <div className="flex my-2 pl-2 gap-2 justify-between items-center">
        <ProgressIndicator sections={progressSections} />
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </Button>
      </div>

      {/* Gold Section */}
      <div className="py-6">
        <SectionHeader
          icon={CircleDollarSign}
          title="Gold"
          isComplete={netGoldWeight > 0}
        />

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/70 mb-1.5 block">
              Gold Net Weight
            </label>
            <div className="flex items-baseline gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={goldWeightInput.display}
                onChange={goldWeightInput.handleChange}
                onFocus={(e) => {
                  goldWeightInput.handleFocus(e);
                }}
                onBlur={() => {
                  goldWeightInput.handleBlur();
                  setWeightTouched(true);
                }}
                placeholder="0.000"
                className={cn(
                  "w-full bg-transparent text-xl md:text-[2rem] font-light text-[hsl(var(--foreground))]",
                  "placeholder:text-[hsl(var(--muted-foreground))]/30",
                  "border-0 border-b-2 pb-2 focus:outline-none transition-colors tabular",
                  goldWeightInput.isFocused
                    ? "border-[hsl(var(--foreground))]"
                    : "border-[hsl(var(--border))]",
                )}
              />
              <span className="text-sm text-[hsl(var(--muted-foreground))] shrink-0 pb-2">
                g
              </span>
            </div>
            <ValidationMessage message={weightError} />
          </div>

          <div>
            <label className="text-[10px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/70 mb-3 block">
              Purity
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {calculatedGoldRates.map((g) => (
                <PurityCard
                  key={g.purity}
                  label={g.label}
                  rate={formatCurrency(g.rate)}
                  selected={purity === g.purity}
                  onClick={() => updatePurity(g.purity)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Stones Section */}
      <div className="py-6">
        <SectionHeader icon={Gem} title="Stones" isComplete={stonesValid} />

        <div className="space-y-5">
          <AnimatePresence mode="popLayout" initial={false}>
            {stones.map((stone, i) => (
              <div key={stone.id}>
                {i > 0 && <Separator className="mb-5" />}
                <StoneRow
                  stone={stone}
                  index={i}
                  stoneTypes={settings.stoneTypes}
                  stoneSlabs={getStoneSlabs(stone.stoneTypeId)}
                  canRemove={stones.length > 1}
                  onTypeChange={(v) => handleStoneTypeChange(stone.id, v)}
                  onWeightChange={(v) =>
                    updateStone(stone.id, "weight", Number(v))
                  }
                  onQtyChange={(v) =>
                    updateStone(stone.id, "quantity", Math.max(1, Number(v)))
                  }
                  onRemove={() => removeStone(stone.id)}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>

        <button
          onClick={addStone}
          className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors pt-4 mt-2"
        >
          <div className="w-5 h-5 rounded-full border border-[hsl(var(--border))] flex items-center justify-center hover:border-[hsl(var(--foreground))] transition-colors">
            <Plus className="w-3 h-3" />
          </div>
          Add another stone
        </button>
      </div>

      <Separator />

      {/* Product Section */}
      <div className="py-6">
        <SectionHeader
          icon={Package}
          title="Product (Optional)"
          isComplete={!!(productImageUrl || productName.trim())}
        />

        <ProductSection
          productName={productName}
          productImageUrl={productImageUrl}
          productNote={productNote}
          fileInputRef={fileInputRef}
          onNameChange={updateProductName}
          onNoteChange={updateProductNote}
          onImageFile={handleImageFile}
          onRemoveImage={removeImage}
        />
      </div>

      {/* Calculate Button */}
      <div className="py-6 space-y-3">
        <AnimatePresence>
          {!canCalculate &&
            (netGoldWeight > 0 || stones.some((s) => s.weight > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2.5 rounded-lg border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/8 px-3.5 py-3">
                  <AlertCircle className="w-4 h-4 text-[hsl(var(--destructive))] shrink-0 mt-0.5" />
                  <p className="text-sm text-[hsl(var(--destructive))] leading-snug">
                    {!netGoldWeight
                      ? "Enter gold net weight to continue"
                      : "Enter stone weight and pieces — slab will be matched automatically"}
                  </p>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        <Button
          onClick={onCalculate}
          disabled={!canCalculate}
          className={cn(
            "w-full h-12 text-sm font-medium transition-all",
            canCalculate
              ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:bg-[hsl(var(--foreground))]/90"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed",
          )}
        >
          Calculate
        </Button>

        {!canCalculate &&
          !netGoldWeight &&
          !stones.some((s) => s.weight > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-1.5 text-xs text-[hsl(var(--destructive))]"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Enter gold weight and stone details to continue</span>
            </motion.div>
          )}
      </div>
    </motion.div>
  );
}

// ─── Results (Summary) View ───────────────────────────────────────────────────

interface ResultsData {
  productName: string;
  productImageUrl: string | null;
  productNote: string;
  netGoldWeight: number;
  purity: string;
  goldRateValue: number;
  goldCost: number;
  makingCost: number;
  stoneDetails: Array<{
    id: string;
    stoneType?: { name: string };
    slabInfo: {
      code: string;
      fromWeight: number;
      toWeight: number;
      pricePerCarat: number;
    } | null;
    weight: number;
    quantity: number;
    totalCost: number;
  }>;
  totalStoneCost: number;
  subTotal: number;
  gst: number;
  total: number;
  gstRate: number;
  grossWeight: number;
  makingChargePerGram: number;
  netGoldWeightForMaking: number;
}

interface SummaryState {
  origin: EntryMode;
  data: ResultsData;
}

function buildSummaryData({
  productName,
  productImageUrl,
  productNote,
  netGoldWeight,
  purity,
  pricing,
  gstRate,
  makingChargePerGram,
}: {
  productName: string;
  productImageUrl: string | null;
  productNote: string;
  netGoldWeight: number;
  purity: string;
  pricing: PricingBreakdown;
  gstRate: number;
  makingChargePerGram: number;
}): ResultsData {
  return {
    productName,
    productImageUrl,
    productNote,
    netGoldWeight,
    purity,
    goldRateValue: pricing.goldRateValue,
    goldCost: pricing.goldCost,
    makingCost: pricing.makingCost,
    stoneDetails: pricing.stoneDetails,
    totalStoneCost: pricing.totalStoneCost,
    subTotal: pricing.subTotal,
    gst: pricing.gst,
    total: pricing.total,
    gstRate,
    grossWeight: pricing.grossWeight,
    makingChargePerGram,
    netGoldWeightForMaking: netGoldWeight,
  };
}

function SummaryView({
  data,
  onBack,
  onReset,
}: {
  data: ResultsData;
  onBack: () => void;
  onReset: () => void;
}) {
  const hasStones = data.stoneDetails.some((d) => d.weight > 0);
  const displayName = data.productName.trim() || "Untitled Piece";
  const displaySubTotal = Math.round(data.subTotal);
  const displayGst = Math.round(data.gst);
  const displayTotal = displaySubTotal + displayGst;
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const slug =
        data.productName.trim().replace(/\s+/g, "-").toLowerCase() || "summary";
      const date = new Date().toISOString().slice(0, 10);
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `jewelry-${slug}-${date}.png`;
      a.click();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="flex w-full justify-between items-center mb-4 gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          <Edit2 className="w-3.5 h-3.5" />
          Edit Details
        </Button>
        <Button variant="outline" size="sm" onClick={onReset}>
          <PlusSquare className="w-3.5 h-3.5" />
          New Calculation
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <h2 className="text-xl md:text-[1.6rem] font-semibold leading-tight text-[hsl(var(--foreground))]">
          Summary
        </h2>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          title="Download summary"
          className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))] transition-all disabled:opacity-40 shrink-0 mt-1"
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Summary Card */}
      <div
        ref={cardRef}
        className="rounded-xl border border-[hsl(var(--border))] overflow-hidden bg-[hsl(var(--card))]"
      >
        {/* Branding header */}
        <div className="flex items-center justify-center gap-2 py-3 border-b border-[hsl(var(--border))]">
          <img src="/evol-logo.webp" alt="Evol" className="h-6 w-auto" />
        </div>

        {/* Product header */}
        <div className="grid grid-cols-[3fr_2fr]">
          {/* Image — left side */}
          <div className="relative aspect-square bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden">
            {data.productImageUrl ? (
              <img
                src={data.productImageUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-[hsl(var(--muted-foreground))]/30" />
            )}
          </div>

          {/* Name + note + total — right half */}
          <div className="flex flex-col justify-between px-3 py-3 min-w-0 overflow-hidden">
            <div className="min-w-0 overflow-hidden">
              <p
                className={cn(
                  "text-sm font-semibold leading-snug break-words hyphens-auto line-clamp-3",
                  !data.productName.trim()
                    ? "text-[hsl(var(--muted-foreground))]"
                    : "text-[hsl(var(--foreground))]",
                )}
              >
                {displayName}
              </p>
              {data.productNote.trim() && (
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1.5 line-clamp-2 leading-relaxed">
                  {data.productNote.trim()}
                </p>
              )}
            </div>

            {/* Total anchored to bottom */}
            <div className="mt-2">
              <p className="text-[9px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/60 mb-0.5">
                Total
              </p>
              <p className="text-lg font-bold tabular text-[hsl(var(--foreground))] leading-tight">
                {formatCurrency(displayTotal)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Gross weight */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[hsl(var(--muted))]/40">
          <span className="text-xs font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]">
            Gross Weight
          </span>
          <span className="text-sm font-semibold tabular text-[hsl(var(--foreground))]">
            {formatNumber(data.grossWeight, 3)} g
          </span>
        </div>

        <Separator />

        {/* Gold section */}
        <div className="px-4 py-3 space-y-3">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[hsl(var(--muted-foreground))]/60">
            Gold
          </p>

          {/* Gold stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2.5 text-sm">
            <div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">
                Net Wt
              </p>
              <p className="font-medium tabular">
                {formatNumber(data.netGoldWeight, 3)} g
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">
                Purity
              </p>
              <p className="font-medium">{data.purity}K</p>
            </div>
            <div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">
                Rate
              </p>
              <p className="font-medium tabular">
                {formatCurrency(data.goldRateValue)}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">
                Cost
              </p>
              <p className="font-semibold tabular">
                {formatCurrency(data.goldCost)}
              </p>
            </div>
          </div>

          {/* Making charges */}
          <div className="flex justify-between items-center pt-2 border-t border-[hsl(var(--border))]/40">
            <div>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Making Charges
              </span>
            </div>
            <span className="text-sm font-semibold tabular">
              {formatCurrency(data.makingCost)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Stones section */}
        {hasStones && (
          <>
            <div className="px-4 py-3 space-y-0">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[hsl(var(--muted-foreground))]/60 mb-2.5">
                Stones
              </p>

              {data.stoneDetails
                .filter((d) => d.weight > 0)
                .map((d, i, arr) => (
                  <div
                    key={d.id}
                    className={cn(
                      "py-2.5",
                      i < arr.length - 1 &&
                        "border-b border-[hsl(var(--border))]/40",
                    )}
                  >
                    {/* Stone name + cost */}
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {d.stoneType?.name ?? "Unknown"}
                      </span>
                      <span className="text-sm font-semibold tabular shrink-0">
                        {formatCurrency(d.totalCost)}
                      </span>
                    </div>

                    {/* Stone detail chips */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {formatNumber(d.weight, 3)} ct
                      </span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]/40">
                        ·
                      </span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {d.quantity} pcs
                      </span>
                      {d.slabInfo?.pricePerCarat > 0 && (
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          @ {formatCurrency(d.slabInfo.pricePerCarat)}/ct
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {/* Stones subtotal */}
              {data.totalStoneCost > 0 && (
                <div className="flex justify-between items-center pt-2.5 border-t border-[hsl(var(--border))]/40">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    Total Stones
                  </span>
                  <span className="text-sm font-semibold tabular">
                    {formatCurrency(data.totalStoneCost)}
                  </span>
                </div>
              )}
            </div>

            <Separator />
          </>
        )}

        {/* Subtotal + GST */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              Subtotal
            </span>
            <span className="text-sm tabular font-medium">
              {formatCurrency(displaySubTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              GST ({(data.gstRate * 100).toFixed(1)}%)
            </span>
            <span className="text-sm tabular text-[hsl(var(--muted-foreground))]">
              {formatCurrency(displayGst)}
            </span>
          </div>
        </div>

        {/* Grand total bar */}
        <div className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))] px-4 py-4 flex justify-between items-center">
          <span className="text-sm font-medium">Total</span>
          <motion.span
            key={displayTotal}
            initial={{ opacity: 0.6, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold tabular"
          >
            {formatCurrency(displayTotal)}
          </motion.span>
        </div>

        {/* Terms & Notes */}
        <div className="px-4 py-2 bg-[hsl(var(--muted))]/20 border-t border-[hsl(var(--border))]">
          <p className="text-[9px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/60 mb-1">
            Terms & Conditions
          </p>
          <ul className="space-y-0.5">
            <li className="text-[9px] text-[hsl(var(--muted-foreground))] leading-snug flex items-start gap-1.5">
              <span className="text-[hsl(var(--muted-foreground))]/40 mt-0.5">
                •
              </span>
              <span>
                Gold weight estimated might be slightly (5-10%) higher than
                actual weight of product, invoicing will be as per actuals
              </span>
            </li>
            <li className="text-[9px] text-[hsl(var(--muted-foreground))] leading-snug flex items-start gap-1.5">
              <span className="text-[hsl(var(--muted-foreground))]/40 mt-0.5">
                •
              </span>
              <span>
                Prices quoted as on today&apos;s date, subject to fluctuations
                depending on the date of confirmation
              </span>
            </li>
            <li className="text-[9px] text-[hsl(var(--muted-foreground))] leading-snug flex items-start gap-1.5">
              <span className="text-[hsl(var(--muted-foreground))]/40 mt-0.5">
                •
              </span>
              <span>
                For custom orders, a 50% advance payment is required to confirm
                the order and 75% to lock the gold rate
              </span>
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CalculatorView({
  settings,
  initialProduct,
  onProductLoaded,
}: CalculatorViewProps) {
  // ── Data state (persisted) ──
  const {
    formState,
    updateNetGoldWeight,
    updatePurity,
    updateStones,
    updateProductName,
    updateProductNote,
  } = useCalculatorState({ stoneTypes: settings.stoneTypes });

  const { netGoldWeight, purity, stones, productName, productNote } = formState;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Product image state ──
  // productImageUrl: ObjectURL for a newly selected file (revoked on cleanup)
  // existingImageUrl: URL already stored in Supabase (from a loaded product)
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const productImageFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── "Loaded from history" banner ──
  const [loadedFromName, setLoadedFromName] = useState<string | null>(null);

  // ── View state ──
  const [entryMode, setEntryMode] = useState<EntryMode>(() =>
    getStoredEntryMode(),
  );
  const [screen, setScreen] = useState<"entry" | "summary">("entry");
  const [summaryState, setSummaryState] = useState<SummaryState | null>(null);
  const [searchResetSignal, setSearchResetSignal] = useState(0);

  // ── Load initial product from history (pre-fill form) ──
  useEffect(() => {
    try {
      localStorage.setItem(ENTRY_MODE_STORAGE_KEY, entryMode);
    } catch {
      // ignore persistence failures
    }
  }, [entryMode]);

  useEffect(() => {
    if (!initialProduct) return;

    updateNetGoldWeight(initialProduct.net_gold_weight);
    updatePurity(initialProduct.purity);
    updateProductName(initialProduct.product_name);

    // Map ProductStoneEntry → DiamondEntry (add local id)
    const mappedStones = initialProduct.stones.map((s) => ({
      id: generateId(),
      stoneTypeId: s.stoneTypeId,
      weight: s.weight,
      quantity: s.quantity,
    }));
    updateStones(
      mappedStones.length > 0
        ? mappedStones
        : [
            {
              id: generateId(),
              stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "",
              weight: 0,
              quantity: 1,
            },
          ],
    );

    // Show existing image from Supabase URL (no File object)
    setExistingImageUrl(initialProduct.product_image_url);
    // Clear any locally selected file
    if (productImageUrl) URL.revokeObjectURL(productImageUrl);
    setProductImageUrl(null);
    productImageFileRef.current = null;

    setLoadedFromName(initialProduct.product_name);
    setEntryMode("calculate");
    setSummaryState(null);
    setScreen("entry");
    onProductLoaded?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProduct]);

  // ── Gold rates ──
  const calculatedGoldRates = useMemo(() => {
    return GOLD_PURITIES.map((purityVal) => {
      const rate = calculateGoldRate(
        settings.goldRate24k,
        purityVal,
        settings.purityPercentages,
      );
      return { purity: purityVal, label: `${purityVal}K`, rate };
    });
  }, [settings.goldRate24k, settings.purityPercentages]);

  const goldRateValue =
    calculatedGoldRates.find((g) => g.purity === purity)?.rate ?? 0;

  // ── Stone helpers ──
  const getStoneSlabs = useCallback(
    (stoneTypeId: string): Slab[] =>
      getStoneSlabsForType(settings.stoneTypes, stoneTypeId),
    [settings.stoneTypes],
  );

  // ── Calculations ──
  const pricing = useMemo(
    () => computeEstimateFromInputs(settings, netGoldWeight, purity, stones),
    [settings, netGoldWeight, purity, stones],
  );
  const {
    grossWeight,
    goldCost,
    makingCost,
    stoneDetails,
    totalStoneCost,
    subTotal,
    gst,
    total,
  } = pricing;

  // The effective image url to display (new local blob takes priority over existing URL)
  const displayImageUrl = productImageUrl ?? existingImageUrl;

  // ── Navigation ──
  const goToManualSummary = () => {
    const manualSummary = buildSummaryData({
      productName,
      productImageUrl: displayImageUrl,
      productNote,
      netGoldWeight,
      purity,
      pricing,
      gstRate: settings.gstRate,
      makingChargePerGram: settings.makingChargePerGram,
    });

    window.scrollTo({ top: 0, left: 0 });
    setEntryMode("calculate");
    setSummaryState({ origin: "calculate", data: manualSummary });
    setScreen("summary");
  };

  const handleSearchSummaryReady = useCallback((summary: SummaryState) => {
    window.scrollTo({ top: 0, left: 0 });
    setEntryMode("search");
    setSummaryState(summary);
    setScreen("summary");
  }, []);

  const goToEntry = () => {
    window.scrollTo({ top: 0, left: 0 });
    setEntryMode(summaryState?.origin ?? entryMode);
    setScreen("entry");
  };

  const reset = () => {
    const nextMode = summaryState?.origin ?? entryMode;
    updateNetGoldWeight(0);
    updatePurity("22");
    updateStones([
      {
        id: generateId(),
        stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "",
        weight: 0,
        quantity: 1,
      },
    ]);
    updateProductName("");
    updateProductNote("");
    if (productImageUrl) {
      URL.revokeObjectURL(productImageUrl);
      setProductImageUrl(null);
    }
    setExistingImageUrl(null);
    productImageFileRef.current = null;
    setLoadedFromName(null);
    setSummaryState(null);
    setEntryMode(nextMode);
    setSearchResetSignal((value) => value + 1);
    setScreen("entry");
  };

  const clearForm = useCallback(() => {
    updateNetGoldWeight(0);
    updatePurity("22");
    updateStones([
      {
        id: generateId(),
        stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "",
        weight: 0,
        quantity: 1,
      },
    ]);
    updateProductName("");
    updateProductNote("");
    if (productImageUrl) {
      URL.revokeObjectURL(productImageUrl);
      setProductImageUrl(null);
    }
    setExistingImageUrl(null);
    productImageFileRef.current = null;
    setLoadedFromName(null);
  }, [
    settings.stoneTypes,
    updateNetGoldWeight,
    updatePurity,
    updateStones,
    updateProductName,
    updateProductNote,
    productImageUrl,
  ]);

  // ── Image handling ──
  const handleImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      // Revoke previous local blob
      if (productImageUrl) URL.revokeObjectURL(productImageUrl);
      // Clear existing URL — user has chosen a new image
      setExistingImageUrl(null);
      productImageFileRef.current = file;
      setProductImageUrl(URL.createObjectURL(file));
    },
    [productImageUrl],
  );

  const removeImage = () => {
    if (productImageUrl) URL.revokeObjectURL(productImageUrl);
    productImageFileRef.current = null;
    setProductImageUrl(null);
    setExistingImageUrl(null);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* "Loaded from history" banner */}
      <AnimatePresence>
        {loadedFromName && screen === "entry" && entryMode === "calculate" && (
          <motion.div
            key="loaded-banner"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden mb-3"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--foreground))]/6 border border-[hsl(var(--foreground))]/10">
              <div className="flex items-center gap-2 min-w-0">
                <History className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] shrink-0" />
                <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                  Pre-filled from{" "}
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    {loadedFromName}
                  </span>
                </span>
              </div>
              <button
                onClick={() => setLoadedFromName(null)}
                className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[hsl(var(--card))] rounded-2xl step-card p-4 md:p-7 overflow-hidden">
        <div className={cn(screen === "entry" ? "block" : "hidden")}>
          <Tabs
            value={entryMode}
            onValueChange={(value) => setEntryMode(value as EntryMode)}
            className="w-full"
          >
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-[hsl(var(--muted))] p-1">
              <TabsTrigger value="search" className="gap-2 rounded-lg text-sm">
                <Search className="h-4 w-4" />
                Search
              </TabsTrigger>
              <TabsTrigger
                value="calculate"
                className="gap-2 rounded-lg text-sm"
              >
                <CircleDollarSign className="h-4 w-4" />
                Calculate
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="search"
              forceMount
              className={cn(
                "mt-0",
                entryMode === "search" ? "block" : "hidden",
              )}
            >
              <CatalogueLookupModeSection
                settings={settings}
                active={screen === "entry" && entryMode === "search"}
                resetSignal={searchResetSignal}
                onSummaryReady={handleSearchSummaryReady}
              />
            </TabsContent>

            <TabsContent
              value="calculate"
              forceMount
              className={cn(
                "mt-0",
                entryMode === "calculate" ? "block" : "hidden",
              )}
            >
              <FormView
                settings={settings}
                formState={formState}
                productImageUrl={displayImageUrl}
                fileInputRef={fileInputRef}
                updateNetGoldWeight={updateNetGoldWeight}
                updatePurity={updatePurity}
                updateStones={updateStones}
                updateProductName={updateProductName}
                updateProductNote={updateProductNote}
                handleImageFile={handleImageFile}
                removeImage={removeImage}
                onCalculate={goToManualSummary}
                onReset={() => {
                  updateNetGoldWeight(0);
                  updatePurity("22");
                  updateStones([
                    {
                      id: generateId(),
                      stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "",
                      weight: 0,
                      quantity: 1,
                    },
                  ]);
                  updateProductName("");
                  updateProductNote("");
                  if (productImageUrl) {
                    URL.revokeObjectURL(productImageUrl);
                    setProductImageUrl(null);
                  }
                  setExistingImageUrl(null);
                  productImageFileRef.current = null;
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        <AnimatePresence mode="wait">
          {screen === "summary" && summaryState && (
            <SummaryView
              key={`${summaryState.origin}-${summaryState.data.productName}-${summaryState.data.total}`}
              data={summaryState.data}
              onBack={goToEntry}
              onReset={reset}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
