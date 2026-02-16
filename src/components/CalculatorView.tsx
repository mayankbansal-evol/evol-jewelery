import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FixedSettings, DiamondEntry, Slab } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  Diamond,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  ImageIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;
const GOLD_PURITIES = ["24", "22", "18", "14"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalculatorViewProps {
  settings: FixedSettings;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function calculateMakingCharge(
  netGoldWeight: number,
  flatRate: number,
  perGramRate: number
): number {
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

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total <= 1 ? 100 : Math.round((current / (total - 1)) * 100);
  return (
    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[hsl(var(--border))] overflow-hidden">
      <motion.div
        className="h-full bg-[hsl(var(--foreground))]"
        initial={{ width: "0%" }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}

function StepPill({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]">
        {current} / {total}
      </span>
      <span className="text-[11px] text-[hsl(var(--muted-foreground))]/50">·</span>
      <span className="text-[11px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]">
        {label}
      </span>
    </div>
  );
}

function BigInput({
  value,
  onChange,
  placeholder,
  type = "text",
  step,
  autoFocus,
  suffix,
  className,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
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
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full bg-transparent text-[2rem] font-light text-[hsl(var(--foreground))]",
          "placeholder:text-[hsl(var(--muted-foreground))]/30",
          "border-0 border-b-2 pb-2 focus:outline-none transition-colors tabular",
          focused
            ? "border-[hsl(var(--foreground))]"
            : "border-[hsl(var(--border))]",
          className
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
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]/30"
      )}
    >
      <span className="text-xl font-semibold">{label}</span>
      <span
        className={cn(
          "text-xs mt-1 tabular",
          selected
            ? "text-[hsl(var(--background))]/70"
            : "text-[hsl(var(--muted-foreground))]"
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

function NavRow({
  onPrev,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  hint,
}: {
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-3">
        {onPrev ? (
          <button
            onClick={onPrev}
            className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}
        <div className="flex-1" />
        <Button
          onClick={onNext}
          disabled={nextDisabled || !onNext}
          className={cn(
            "h-11 px-6 text-sm gap-1.5 transition-all",
            !nextDisabled && onNext
              ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:bg-[hsl(var(--foreground))]/90"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
          )}
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      {hint && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] text-right">
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── Stone row ────────────────────────────────────────────────────────────────

function StoneRow({
  stone,
  index,
  stoneTypes,
  stoneSlabs,
  canRemove,
  onTypeChange,
  onSlabChange,
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
  onSlabChange: (v: string) => void;
  onWeightChange: (v: string) => void;
  onQtyChange: (v: string) => void;
  onRemove: () => void;
}) {
  const [weightFocused, setWeightFocused] = useState(false);
  const [qtyFocused, setQtyFocused] = useState(false);

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
        {canRemove && (
          <button
            onClick={onRemove}
            className="ml-auto flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]/50 hover:text-[hsl(var(--destructive))] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
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

        <div className="space-y-1">
          <label className="text-[10px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/70">
            Slab
          </label>
          <Select
            value={stone.slabId}
            onValueChange={onSlabChange}
            disabled={!stone.stoneTypeId || stoneSlabs.length === 0}
          >
            <SelectTrigger className="h-9 text-sm border-0 border-b border-[hsl(var(--border))] rounded-none bg-transparent px-0 focus:ring-0 focus:border-[hsl(var(--foreground))] transition-colors disabled:opacity-40">
              <SelectValue placeholder="Select slab" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {stoneSlabs.map((sl) => (
                <SelectItem key={sl.code} value={sl.code}>
                  <div className="flex items-center gap-3">
                    <span className="tabular text-xs">
                      {formatNumber(sl.fromWeight, 3)}–{formatNumber(sl.toWeight, 3)} ct
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formatCurrency(sl.pricePerCarat)}/ct
                    </span>
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
            Net Weight
          </label>
          <div className="flex items-baseline gap-1.5">
            <input
              type="number"
              step="0.001"
              value={stone.weight === 0 ? "" : stone.weight}
              onChange={(e) => onWeightChange(e.target.value)}
              onFocus={() => setWeightFocused(true)}
              onBlur={() => setWeightFocused(false)}
              placeholder="0.000"
              className={cn(
                "w-full bg-transparent text-base font-medium text-[hsl(var(--foreground))]",
                "placeholder:text-[hsl(var(--muted-foreground))]/30",
                "border-0 border-b pb-1 focus:outline-none transition-colors tabular",
                weightFocused
                  ? "border-[hsl(var(--foreground))]"
                  : "border-[hsl(var(--border))]"
              )}
            />
            <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0 pb-1">
              ct
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/70">
            Pieces
          </label>
          <input
            type="number"
            step="1"
            min="1"
            value={stone.quantity}
            onChange={(e) => onQtyChange(e.target.value)}
            onFocus={() => setQtyFocused(true)}
            onBlur={() => setQtyFocused(false)}
            className={cn(
              "w-full bg-transparent text-base font-medium text-[hsl(var(--foreground))]",
              "border-0 border-b pb-1 focus:outline-none transition-colors tabular",
              qtyFocused
                ? "border-[hsl(var(--foreground))]"
                : "border-[hsl(var(--border))]"
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Product step (Step 3) ───────────────────────────────────────────────────

function ProductStep({
  productName,
  productImageUrl,
  productNote,
  fileInputRef,
  onNameChange,
  onNoteChange,
  onImageSelect,
  onRemoveImage,
  onPrev,
  onNext,
}: {
  productName: string;
  productImageUrl: string | null;
  productNote: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onNameChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [nameFocused, setNameFocused] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-[1.6rem] font-semibold leading-tight text-[hsl(var(--foreground))]">
          Product details
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5">
          Optional — appears on the summary
        </p>
      </div>

      {/* Image */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold tracking-widest uppercase text-[hsl(var(--muted-foreground))]">
          Product Image
        </label>

        {productImageUrl ? (
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[hsl(var(--muted))]">
              <img
                src={productImageUrl}
                alt="Product"
                className="w-full h-full object-cover"
              />
              <button
                onClick={onRemoveImage}
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
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full h-24 rounded-xl border-2 border-dashed transition-colors",
              "flex flex-col items-center justify-center gap-1.5 focus:outline-none",
              "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
              "border-[hsl(var(--border))] hover:border-[hsl(var(--foreground))]/40"
            )}
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-xs">Click to upload image</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageSelect}
          className="hidden"
        />
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold tracking-widest uppercase text-[hsl(var(--muted-foreground))]">
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
            "w-full bg-transparent text-xl font-light text-[hsl(var(--foreground))]",
            "placeholder:text-[hsl(var(--muted-foreground))]/30",
            "border-0 border-b-2 pb-2 focus:outline-none transition-colors",
            nameFocused
              ? "border-[hsl(var(--foreground))]"
              : "border-[hsl(var(--border))]"
          )}
        />
      </div>

      {/* Note */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold tracking-widest uppercase text-[hsl(var(--muted-foreground))]">
          Note
        </label>
        <textarea
          value={productNote}
          onChange={(e) => onNoteChange(e.target.value)}
          onFocus={() => setNoteFocused(true)}
          onBlur={() => setNoteFocused(false)}
          placeholder="Any additional notes…"
          rows={3}
          className={cn(
            "w-full bg-transparent text-sm text-[hsl(var(--foreground))] resize-none",
            "placeholder:text-[hsl(var(--muted-foreground))]/30",
            "border-0 border-b-2 pb-2 focus:outline-none transition-colors leading-relaxed",
            noteFocused
              ? "border-[hsl(var(--foreground))]"
              : "border-[hsl(var(--border))]"
          )}
        />
      </div>

      <NavRow onPrev={onPrev} onNext={onNext} nextLabel="See Summary" />
    </div>
  );
}

// ─── Results (Step 4) ─────────────────────────────────────────────────────────

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

function ResultsStep({
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

  return (
    <div>
      {/* Step heading */}
      <div className="mb-5">
        <h2 className="text-[1.6rem] font-semibold leading-tight text-[hsl(var(--foreground))]">
          Summary
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Full cost breakdown for this piece
        </p>
      </div>

      {/* ── The single summary card ── */}
      <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">

        {/* Product header */}
        <div className="grid grid-cols-2">
          {/* Image — left half */}
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
          <div className="flex flex-col justify-between px-4 py-4 min-w-0">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-base font-semibold leading-snug",
                  !data.productName.trim()
                    ? "text-[hsl(var(--muted-foreground))]"
                    : "text-[hsl(var(--foreground))]"
                )}
              >
                {displayName}
              </p>
              {data.productNote.trim() && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5 line-clamp-3 leading-relaxed">
                  {data.productNote.trim()}
                </p>
              )}
            </div>

            {/* Total anchored to bottom */}
            <div className="mt-3">
              <p className="text-[10px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/60 mb-0.5">
                Total
              </p>
              <p className="text-xl font-bold tabular text-[hsl(var(--foreground))]">
                {formatCurrency(data.total)}
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
            {formatNumber(data.grossWeight)} g
          </span>
        </div>

        <Separator />

        {/* Gold section */}
        <div className="px-4 py-3 space-y-3">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[hsl(var(--muted-foreground))]/60">
            Gold
          </p>

          {/* Gold stats row */}
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">Net Wt</p>
              <p className="font-medium tabular">{formatNumber(data.netGoldWeight)} g</p>
            </div>
            <div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">Purity</p>
              <p className="font-medium">{data.purity}K</p>
            </div>
            <div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">Rate</p>
              <p className="font-medium tabular">{formatCurrency(data.goldRateValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">Cost</p>
              <p className="font-semibold tabular">{formatCurrency(data.goldCost)}</p>
            </div>
          </div>

          {/* Making charges */}
          <div className="flex justify-between items-center pt-2 border-t border-[hsl(var(--border))]/40">
            <div>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Making Charges
              </span>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]/60 mt-0.5">
                {data.netGoldWeightForMaking > 0 && data.netGoldWeightForMaking <= 2
                  ? "Flat rate (≤ 2g)"
                  : data.netGoldWeightForMaking > 2
                  ? `${formatNumber(data.netGoldWeightForMaking)} g × ${formatCurrency(data.makingChargePerGram)}`
                  : ""}
              </p>
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
                      i < arr.length - 1 && "border-b border-[hsl(var(--border))]/40"
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
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]/40">·</span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {d.quantity} pcs
                      </span>
                      {d.slabInfo && (
                        <>
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))]/40">·</span>
                          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                            {d.slabInfo.code}
                          </span>
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))]/40">·</span>
                          <span className="text-[10px] tabular text-[hsl(var(--muted-foreground))]">
                            {formatNumber(d.slabInfo.fromWeight, 3)}–{formatNumber(d.slabInfo.toWeight, 3)} ct
                          </span>
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))]/40">·</span>
                          <span className="text-[10px] tabular text-[hsl(var(--muted-foreground))]">
                            {formatCurrency(d.slabInfo.pricePerCarat)}/ct
                          </span>
                        </>
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
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Subtotal</span>
            <span className="text-sm tabular font-medium">
              {formatCurrency(data.subTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              GST ({(data.gstRate * 100).toFixed(1)}%)
            </span>
            <span className="text-sm tabular text-[hsl(var(--muted-foreground))]">
              {formatCurrency(data.gst)}
            </span>
          </div>
        </div>

        {/* Grand total bar */}
        <div className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))] px-4 py-4 flex justify-between items-center">
          <span className="text-sm font-medium">Total</span>
          <motion.span
            key={data.total}
            initial={{ opacity: 0.6, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold tabular"
          >
            {formatCurrency(data.total)}
          </motion.span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between pt-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New Calculation
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CalculatorView({ settings }: CalculatorViewProps) {
  // ── Data state ──
  const [netGoldWeight, setNetGoldWeight] = useState(0);
  const [purity, setPurity] = useState("22");
  const [stones, setStones] = useState<DiamondEntry[]>([
    {
      id: generateId(),
      stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "",
      slabId: settings.stoneTypes[0]?.slabs[0]?.code ?? "",
      weight: 0,
      quantity: 1,
    },
  ]);

  // ── Product state ──
  const [productName, setProductName] = useState("");
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productNote, setProductNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Stepper state ──
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // ── Gold rates ──
  const calculatedGoldRates = useMemo(() => {
    return GOLD_PURITIES.map((purityVal) => {
      const percentage = settings.purityPercentages[purityVal] ?? 100;
      const rate = Math.round(settings.goldRate24k * (percentage / 100));
      return { purity: purityVal, label: `${purityVal}K`, rate };
    });
  }, [settings.goldRate24k, settings.purityPercentages]);

  const goldRateValue =
    calculatedGoldRates.find((g) => g.purity === purity)?.rate ?? 0;

  // ── Stone helpers ──
  const getStoneSlabs = useCallback(
    (stoneTypeId: string): Slab[] =>
      settings.stoneTypes.find((s) => s.stoneId === stoneTypeId)?.slabs ?? [],
    [settings.stoneTypes]
  );

  // ── Calculations ──
  const totalStoneWeight = stones.reduce((sum, d) => sum + d.weight, 0);
  const grossWeight = netGoldWeight + totalStoneWeight;
  const goldCost = netGoldWeight * goldRateValue;
  const makingCost = calculateMakingCharge(
    netGoldWeight,
    settings.makingChargeFlat,
    settings.makingChargePerGram
  );
  const goldPlusMaking = goldCost + makingCost;

  const stoneDetails = stones.map((d) => {
    const stoneType = settings.stoneTypes.find((s) => s.stoneId === d.stoneTypeId);
    const slab = getStoneSlabs(d.stoneTypeId).find((sl) => sl.code === d.slabId);
    const pricePerCarat = slab?.pricePerCarat ?? 0;
    const totalCost = pricePerCarat * d.weight;
    return {
      ...d,
      stoneType,
      totalCost,
      slabInfo: slab
        ? {
            code: slab.code,
            fromWeight: slab.fromWeight,
            toWeight: slab.toWeight,
            pricePerCarat: slab.pricePerCarat,
          }
        : null,
    };
  });

  const totalStoneCost = stoneDetails.reduce((s, d) => s + d.totalCost, 0);
  const subTotal = goldPlusMaking + totalStoneCost;
  const gst = subTotal * settings.gstRate;
  const total = subTotal + gst;

  // ── Navigation ──
  const goNext = () => {
    setDirection("forward");
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goPrev = () => {
    setDirection("back");
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const reset = () => {
    setNetGoldWeight(0);
    setPurity("22");
    setStones([
      {
        id: generateId(),
        stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "",
        slabId: settings.stoneTypes[0]?.slabs[0]?.code ?? "",
        weight: 0,
        quantity: 1,
      },
    ]);
    setProductName("");
    setProductNote("");
    if (productImageUrl) {
      URL.revokeObjectURL(productImageUrl);
      setProductImageUrl(null);
    }
    setCurrentStep(0);
    setDirection("forward");
  };

  // ── Stone CRUD ──
  const updateStone = (id: string, field: keyof DiamondEntry, value: string | number) => {
    setStones((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleStoneTypeChange = (id: string, value: string) => {
    const slabs = getStoneSlabs(value);
    setStones((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, stoneTypeId: value, slabId: slabs[0]?.code ?? "" } : d
      )
    );
  };

  const addStone = () => {
    setStones((prev) => [
      ...prev,
      {
        id: generateId(),
        stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "",
        slabId: settings.stoneTypes[0]?.slabs[0]?.code ?? "",
        weight: 0,
        quantity: 1,
      },
    ]);
  };

  const removeStone = (id: string) => {
    setStones((prev) => prev.filter((d) => d.id !== id));
  };

  // ── Image handling ──
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (productImageUrl) URL.revokeObjectURL(productImageUrl);
    setProductImageUrl(URL.createObjectURL(file));
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeImage = () => {
    if (productImageUrl) URL.revokeObjectURL(productImageUrl);
    setProductImageUrl(null);
  };

  // ── Validation ──
  const step1Valid = netGoldWeight > 0;
  const stonesValid =
    stones.length > 0 &&
    stones.some((s) => s.weight > 0) &&
    stones.every((s) => s.weight === 0 || (s.weight > 0 && !!s.slabId));
  // Step 3 (product details) is always optional — always valid

  // ── Slide variants ──
  const slideVariants = {
    enter: (dir: "forward" | "back") => ({
      x: dir === "forward" ? 40 : -40,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: "forward" | "back") => ({
      x: dir === "forward" ? -40 : 40,
      opacity: 0,
    }),
  };

  const stepLabels = ["Gold Details", "Stones", "Product Details", "Summary"];

  // ── Step renderers ──

  const renderGoldStep = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-[1.6rem] font-semibold leading-tight text-[hsl(var(--foreground))]">
          Gold details
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5">
          Enter the net weight and select the purity
        </p>
      </div>

      <BigInput
        type="number"
        step="0.01"
        value={netGoldWeight}
        onChange={(v) => setNetGoldWeight(Number(v))}
        placeholder="0.00"
        suffix="g"
        autoFocus
      />

      <div>
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[hsl(var(--muted-foreground))] mb-3">
          Purity
        </p>
        <div className="grid grid-cols-4 gap-2">
          {calculatedGoldRates.map((g) => (
            <PurityCard
              key={g.purity}
              label={g.label}
              rate={formatCurrency(g.rate)}
              selected={purity === g.purity}
              onClick={() => setPurity(g.purity)}
            />
          ))}
        </div>
      </div>

      <NavRow
        onNext={step1Valid ? goNext : undefined}
        nextDisabled={!step1Valid}
        hint={!step1Valid ? "Enter a weight to continue" : undefined}
      />
    </div>
  );

  const renderStonesStep = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-[1.6rem] font-semibold leading-tight text-[hsl(var(--foreground))]">
          Stone specifications
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5">
          Add each stone with its type, slab, and weight
        </p>
      </div>

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
                onSlabChange={(v) => updateStone(stone.id, "slabId", v)}
                onWeightChange={(v) => updateStone(stone.id, "weight", Number(v))}
                onQtyChange={(v) => updateStone(stone.id, "quantity", Math.max(1, Number(v)))}
                onRemove={() => removeStone(stone.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>

      <button
        onClick={addStone}
        className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors pt-1"
      >
        <div className="w-5 h-5 rounded-full border border-[hsl(var(--border))] flex items-center justify-center hover:border-[hsl(var(--foreground))] transition-colors">
          <Plus className="w-3 h-3" />
        </div>
        Add another stone
      </button>

      <NavRow
        onPrev={goPrev}
        onNext={stonesValid ? goNext : undefined}
        nextDisabled={!stonesValid}
        hint={!stonesValid ? "Enter weight for at least one stone" : undefined}
      />
    </div>
  );

  const renderProductStep = () => (
    <ProductStep
      productName={productName}
      productImageUrl={productImageUrl}
      productNote={productNote}
      fileInputRef={fileInputRef}
      onNameChange={setProductName}
      onNoteChange={setProductNote}
      onImageSelect={handleImageSelect}
      onRemoveImage={removeImage}
      onPrev={goPrev}
      onNext={goNext}
    />
  );

  const renderResultsStep = () => (
    <ResultsStep
      data={{
        productName,
        productImageUrl,
        productNote,
        netGoldWeight,
        purity,
        goldRateValue,
        goldCost,
        makingCost,
        stoneDetails,
        totalStoneCost,
        subTotal,
        gst,
        total,
        gstRate: settings.gstRate,
        grossWeight,
        makingChargePerGram: settings.makingChargePerGram,
        netGoldWeightForMaking: netGoldWeight,
      }}
      onBack={goPrev}
      onReset={reset}
    />
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0: return renderGoldStep();
      case 1: return renderStonesStep();
      case 2: return renderProductStep();
      case 3: return renderResultsStep();
      default: return null;
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <ProgressBar current={currentStep} total={TOTAL_STEPS} />

      <div className="flex items-center justify-between mb-5 pt-4">
        <StepPill
          current={currentStep + 1}
          total={TOTAL_STEPS}
          label={stepLabels[currentStep]}
        />
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl step-card p-7 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
