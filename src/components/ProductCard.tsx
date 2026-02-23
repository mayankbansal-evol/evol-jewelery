import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trash2,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Gem,
  CircleDollarSign,
  ArrowUpRight,
  Loader2,
  Scale,
  Sparkles,
} from "lucide-react";
import type { ProductWithPricing } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatWeight(n: number, decimals = 3) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: decimals }).format(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  value,
  muted,
  bold,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1.5",
        bold && "font-semibold"
      )}
    >
      <span
        className={cn(
          "text-xs",
          muted
            ? "text-[hsl(var(--muted-foreground))]"
            : "text-[hsl(var(--foreground))]"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-xs tabular-nums",
          accent
            ? "text-[hsl(var(--foreground))] font-bold text-sm"
            : bold
            ? "text-[hsl(var(--foreground))]"
            : "text-[hsl(var(--muted-foreground))]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: ProductWithPricing;
  onDelete: (id: string) => void;
  onLoad: (product: ProductWithPricing) => void;
}

export default function ProductCard({ product, onDelete, onLoad }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${product.product_name}"?`)) return;
    setDeleting(true);
    await onDelete(product.id);
    setDeleting(false);
  };

  const handleLoad = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLoad(product);
  };

  const purityLabel = `${product.purity}K`;
  const dateLabel = format(new Date(product.created_at), "dd MMM yyyy");
  const timeLabel = format(new Date(product.created_at), "hh:mm a");

  // Deduplicate stone names for chips
  const stoneChips = Array.from(
    new Map(product.stones.map((s) => [s.stoneTypeId, s.name])).values()
  );

  const hasStones = product.stoneDetails.some((s) => s.weight > 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden",
        "transition-shadow duration-200 hover:shadow-sm"
      )}
    >
      {/* Collapsed header — always visible */}
      <div
        className="flex items-stretch gap-0 cursor-pointer select-none"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Product image — left strip */}
        <div className="w-[88px] shrink-0 relative bg-[hsl(var(--muted))] overflow-hidden">
          {product.product_image_url ? (
            <img
              src={product.product_image_url}
              alt={product.product_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-[hsl(var(--muted-foreground))]/30" />
            </div>
          )}
        </div>

        {/* Content — right side */}
        <div className="flex-1 min-w-0 px-4 py-3.5">
          {/* Top row: name + actions */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-semibold text-sm text-[hsl(var(--foreground))] leading-snug line-clamp-1 flex-1">
              {product.product_name}
            </p>
            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDelete}
                disabled={deleting}
                title="Delete product"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/8 transition-all disabled:opacity-40"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Attribute row */}
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            {/* Purity badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
              <CircleDollarSign className="w-2.5 h-2.5" />
              {purityLabel}
            </span>

            {/* Gold weight */}
            <span className="inline-flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
              <Scale className="w-2.5 h-2.5" />
              {formatWeight(product.net_gold_weight, 2)}g
            </span>

            {/* Stone chips */}
            {stoneChips.slice(0, 2).map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
              >
                <Gem className="w-2.5 h-2.5" />
                {name}
              </span>
            ))}
            {stoneChips.length > 2 && (
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]/60">
                +{stoneChips.length - 2}
              </span>
            )}
          </div>

          {/* Price + date row */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/50 mb-0.5">
                Current Price
              </p>
              <p className="text-lg font-bold tabular-nums text-[hsl(var(--foreground))] leading-none">
                {formatCurrency(product.total)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[9px] text-[hsl(var(--muted-foreground))]/50 font-medium">{dateLabel}</p>
                <p className="text-[9px] text-[hsl(var(--muted-foreground))]/40">{timeLabel}</p>
              </div>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]/50 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]/50 shrink-0" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded detail panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[hsl(var(--border))]/60 mx-0">
              <div className="px-4 pt-4 pb-1 space-y-4">

                {/* Stone breakdown */}
                {hasStones && (
                  <div>
                    <p className="text-[9px] font-bold tracking-widest uppercase text-[hsl(var(--muted-foreground))]/50 mb-2">
                      Stones
                    </p>
                    <div className="space-y-2">
                      {product.stoneDetails
                        .filter((s) => s.weight > 0)
                        .map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                                {s.name}
                              </p>
                              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                {formatWeight(s.weight)} ct · {s.quantity} pcs
                                {s.pricePerCarat > 0 && (
                                  <span className="ml-1 opacity-60">
                                    @ {formatCurrency(s.pricePerCarat)}/ct
                                  </span>
                                )}
                              </p>
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-[hsl(var(--foreground))] shrink-0">
                              {formatCurrency(s.cost)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Cost breakdown */}
                <div>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-[hsl(var(--muted-foreground))]/50 mb-1">
                    Live Breakdown
                  </p>
                  <div className="divide-y divide-[hsl(var(--border))]/40">
                    <BreakdownRow label="Gold" value={formatCurrency(product.goldCost)} muted />
                    <BreakdownRow label="Making" value={formatCurrency(product.makingCost)} muted />
                    {product.stoneCostTotal > 0 && (
                      <BreakdownRow label="Stones" value={formatCurrency(product.stoneCostTotal)} muted />
                    )}
                    <BreakdownRow label="Subtotal" value={formatCurrency(product.subTotal)} />
                    <BreakdownRow label="GST" value={formatCurrency(product.gst)} muted />
                  </div>
                  {/* Total bar */}
                  <div className="mt-2 flex items-center justify-between px-3 py-2.5 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
                    <span className="text-xs font-semibold tracking-wide">Total</span>
                    <span className="text-base font-bold tabular-nums">{formatCurrency(product.total)}</span>
                  </div>
                </div>

                {/* Live pricing note */}
                <div className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--muted-foreground))]/50 pb-1">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>Prices calculated with current gold rates</span>
                </div>
              </div>

              {/* Load into Calculator CTA */}
              <div className="px-4 pb-4">
                <button
                  onClick={handleLoad}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl",
                    "text-xs font-semibold tracking-wide",
                    "border border-[hsl(var(--foreground))]/20 text-[hsl(var(--foreground))]",
                    "hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))] hover:border-[hsl(var(--foreground))]",
                    "transition-all duration-150"
                  )}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Load into Calculator
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
