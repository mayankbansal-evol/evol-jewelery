import { useState } from "react";
import { motion } from "motion/react";
import {
  Trash2,
  ImageIcon,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

// ─── Breakdown row ────────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between py-1.5", bold && "font-semibold")}>
      <span className={cn("text-xs", muted ? "text-[hsl(var(--muted-foreground))]" : "text-[hsl(var(--foreground))]")}>
        {label}
      </span>
      <span className={cn("text-xs tabular-nums", bold ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]")}>
        {value}
      </span>
    </div>
  );
}

// ─── Detail dialog content ────────────────────────────────────────────────────

function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onLoad,
  onDeleteConfirmed,
}: {
  product: ProductWithPricing;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLoad: () => void;
  onDeleteConfirmed: () => void;
}) {
  const hasStones = product.stoneDetails.some((s) => s.weight > 0);
  const stoneChips = Array.from(
    new Map(product.stones.map((s) => [s.stoneTypeId, s.name])).values()
  );
  const dateLabel = format(new Date(product.created_at), "dd MMM yyyy · hh:mm a");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-sm rounded-2xl gap-0">
        {/* Image header */}
        <div className="relative w-full aspect-[16/9] bg-[hsl(var(--muted))] overflow-hidden">
          {product.product_image_url ? (
            <img
              src={product.product_image_url}
              alt={product.product_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-[hsl(var(--muted-foreground))]/20" />
            </div>
          )}
          {/* Purity badge */}
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-[hsl(var(--foreground))]/90 text-[hsl(var(--background))] backdrop-blur-sm">
            <CircleDollarSign className="w-3 h-3" />
            {product.purity}K
          </span>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-5 space-y-4">
          {/* Name + meta */}
          <DialogHeader className="space-y-0.5 text-left">
            <DialogTitle className="text-base font-bold text-[hsl(var(--foreground))] leading-snug">
              {product.product_name}
            </DialogTitle>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]/60">{dateLabel}</p>
          </DialogHeader>

          {/* Attribute badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
              <Scale className="w-2.5 h-2.5" />
              {formatWeight(product.net_gold_weight, 2)}g
            </span>
            {stoneChips.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
              >
                <Gem className="w-2.5 h-2.5" />
                {name}
              </span>
            ))}
          </div>

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
                    <div key={i} className="flex items-center justify-between gap-2">
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
              <BreakdownRow label="Subtotal" value={formatCurrency(product.subTotal)} bold />
              <BreakdownRow label="GST" value={formatCurrency(product.gst)} muted />
            </div>
            {/* Total bar */}
            <div className="mt-2 flex items-center justify-between px-3 py-2.5 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
              <span className="text-xs font-semibold tracking-wide">Total</span>
              <span className="text-base font-bold tabular-nums">{formatCurrency(product.total)}</span>
            </div>
          </div>

          {/* Live pricing note */}
          <div className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--muted-foreground))]/50">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>Prices calculated with current gold rates</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {/* Delete with AlertDialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium",
                    "border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]",
                    "hover:border-[hsl(var(--destructive))]/40 hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/5",
                    "transition-all duration-150"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete product?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="font-medium text-[hsl(var(--foreground))]">
                      "{product.product_name}"
                    </span>{" "}
                    will be permanently removed. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onOpenChange(false);
                      onDeleteConfirmed();
                    }}
                    className="bg-[hsl(var(--destructive))] text-white hover:bg-[hsl(var(--destructive))]/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Load into calculator */}
            <button
              onClick={() => {
                onOpenChange(false);
                onLoad();
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
                "text-xs font-semibold tracking-wide",
                "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]",
                "hover:opacity-90 transition-opacity duration-150"
              )}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Load into Calculator
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export type CardView = "grid" | "list";

interface ProductCardProps {
  product: ProductWithPricing;
  onDelete: (id: string) => void;
  onLoad: (product: ProductWithPricing) => void;
  view?: CardView;
}

export default function ProductCard({ product, onDelete, onLoad, view = "list" }: ProductCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    await onDelete(product.id);
    setDeleting(false);
  };

  const handleLoad = () => {
    onLoad(product);
  };

  const purityLabel = `${product.purity}K`;
  const dateLabel = format(new Date(product.created_at), "dd MMM yyyy");
  const stoneChips = Array.from(
    new Map(product.stones.map((s) => [s.stoneTypeId, s.name])).values()
  );

  // ── Shared dialog ──────────────────────────────────────────────────────────
  const dialog = (
    <ProductDetailDialog
      product={product}
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      onLoad={handleLoad}
      onDeleteConfirmed={handleDeleteConfirmed}
    />
  );

  // ── Grid Card ──────────────────────────────────────────────────────────────
  if (view === "grid") {
    return (
      <>
        {dialog}
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.93 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          onClick={() => setDialogOpen(true)}
          className="group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
        >
          {/* Image area */}
          <div className="relative w-full aspect-[4/3] bg-[hsl(var(--muted))] overflow-hidden">
            {product.product_image_url ? (
              <img
                src={product.product_image_url}
                alt={product.product_name}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-[hsl(var(--muted-foreground))]/25" />
              </div>
            )}

            {/* Purity badge */}
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[hsl(var(--foreground))]/90 text-[hsl(var(--background))] backdrop-blur-sm">
              <CircleDollarSign className="w-2.5 h-2.5" />
              {purityLabel}
            </span>

            {/* Deleting spinner overlay */}
            {deleting && (
              <div className="absolute inset-0 bg-[hsl(var(--background))]/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--foreground))]" />
              </div>
            )}
          </div>

          {/* Card body */}
          <div className="px-3.5 pt-3 pb-3.5">
            <p className="font-semibold text-sm text-[hsl(var(--foreground))] leading-snug line-clamp-1 mb-1">
              {product.product_name}
            </p>
            <p className="text-xl font-bold tabular-nums text-[hsl(var(--foreground))] leading-none mb-2.5">
              {formatCurrency(product.total)}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                <Scale className="w-2.5 h-2.5" />
                {formatWeight(product.net_gold_weight, 2)}g
              </span>
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
            <p className="mt-2 text-[10px] text-[hsl(var(--muted-foreground))]/40 font-medium">
              {dateLabel}
            </p>
          </div>
        </motion.div>
      </>
    );
  }

  // ── List Card ──────────────────────────────────────────────────────────────
  return (
    <>
      {dialog}
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={() => setDialogOpen(true)}
        className="group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden hover:shadow-sm transition-shadow duration-200 cursor-pointer"
      >
        <div className="flex items-stretch select-none">
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
            {deleting && (
              <div className="absolute inset-0 bg-[hsl(var(--background))]/60 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--foreground))]" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 px-4 py-3.5">
            <p className="font-semibold text-sm text-[hsl(var(--foreground))] leading-snug line-clamp-1 mb-2">
              {product.product_name}
            </p>

            {/* Attribute badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
                <CircleDollarSign className="w-2.5 h-2.5" />
                {purityLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                <Scale className="w-2.5 h-2.5" />
                {formatWeight(product.net_gold_weight, 2)}g
              </span>
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

            {/* Price + date */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/50 mb-0.5">
                  Current Price
                </p>
                <p className="text-lg font-bold tabular-nums text-[hsl(var(--foreground))] leading-none">
                  {formatCurrency(product.total)}
                </p>
              </div>
              <p className="text-[9px] text-[hsl(var(--muted-foreground))]/40 font-medium">{dateLabel}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
