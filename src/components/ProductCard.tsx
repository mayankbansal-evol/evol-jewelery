import { useState } from "react";
import { motion } from "motion/react";
import {
  ImageIcon,
  Gem,
  CircleDollarSign,
  ArrowUpRight,
  Scale,
  Sparkles,
  History,
} from "lucide-react";
import { format } from "date-fns";
import type { ProductWithPricing } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatWeight(n: number, decimals = 3) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
  }).format(n);
}

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

function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onLoad,
}: {
  product: ProductWithPricing;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLoad: () => void;
}) {
  const hasStones = product.stoneDetails.some((stone) => stone.weight > 0);
  const stoneChips = Array.from(
    new Map(product.stones.map((stone) => [stone.stoneTypeId, stone.name])).values(),
  );
  const dateLabel = format(new Date(product.last_searched_at), "dd MMM yyyy · hh:mm a");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-sm rounded-2xl gap-0 max-h-[92dvh] flex flex-col">
        <div className="relative w-full aspect-[16/9] bg-[hsl(var(--muted))] overflow-hidden shrink-0 max-h-[35dvh]">
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
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-[hsl(var(--foreground))]/90 text-[hsl(var(--background))] backdrop-blur-sm">
            <CircleDollarSign className="w-3 h-3" />
            {product.purity}K
          </span>
        </div>

        <div className="px-5 pt-4 pb-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          <DialogHeader className="space-y-0.5 text-left">
            <DialogTitle className="text-base font-bold text-[hsl(var(--foreground))] leading-snug">
              {product.product_name}
            </DialogTitle>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]/60">{dateLabel}</p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]/60">
              Searched {product.search_count} {product.search_count === 1 ? "time" : "times"}
            </p>
          </DialogHeader>

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

          {hasStones && (
            <div>
              <p className="text-[9px] font-bold tracking-widest uppercase text-[hsl(var(--muted-foreground))]/50 mb-2">
                Stones
              </p>
              <div className="space-y-2">
                {product.stoneDetails
                  .filter((stone) => stone.weight > 0)
                  .map((stone, index) => (
                    <div key={index} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                          {stone.name}
                        </p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          {formatWeight(stone.weight)} ct · {stone.quantity} pcs
                          {stone.pricePerCarat > 0 && (
                            <span className="ml-1 opacity-60">
                              @ {formatCurrency(stone.pricePerCarat)}/ct
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-[hsl(var(--foreground))] shrink-0">
                        {formatCurrency(stone.cost)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

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
            <div className="mt-2 flex items-center justify-between px-3 py-2.5 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
              <span className="text-xs font-semibold tracking-wide">Total</span>
              <span className="text-base font-bold tabular-nums">{formatCurrency(product.total)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--muted-foreground))]/50">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>Prices calculated with current gold rates</span>
          </div>

          <div className="pt-1">
            <button
              onClick={() => {
                onOpenChange(false);
                onLoad();
              }}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl",
                "text-xs font-semibold tracking-wide",
                "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]",
                "hover:opacity-90 transition-opacity duration-150",
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

export type CardView = "grid" | "list";

interface ProductCardProps {
  product: ProductWithPricing;
  onLoad: (product: ProductWithPricing) => void;
  view?: CardView;
}

export default function ProductCard({ product, onLoad, view = "list" }: ProductCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const purityLabel = `${product.purity}K`;
  const dateLabel = format(new Date(product.last_searched_at), "dd MMM yyyy");
  const stoneChips = Array.from(
    new Map(product.stones.map((stone) => [stone.stoneTypeId, stone.name])).values(),
  );

  const dialog = (
    <ProductDetailDialog
      product={product}
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      onLoad={() => onLoad(product)}
    />
  );

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

            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[hsl(var(--foreground))]/90 text-[hsl(var(--background))] backdrop-blur-sm">
              <CircleDollarSign className="w-2.5 h-2.5" />
              {purityLabel}
            </span>
          </div>

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
            <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]/60">
              <History className="w-2.5 h-2.5" />
              {product.search_count} {product.search_count === 1 ? "search" : "searches"}
            </p>
          </div>
        </motion.div>
      </>
    );
  }

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
          <div className="w-16 sm:w-[88px] shrink-0 relative bg-[hsl(var(--muted))] overflow-hidden">
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

          <div className="flex-1 min-w-0 px-4 py-3.5">
            <p className="font-semibold text-sm text-[hsl(var(--foreground))] leading-snug line-clamp-1 mb-2">
              {product.product_name}
            </p>

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

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/50 mb-0.5">
                  Current Price
                </p>
                <p className="text-lg font-bold tabular-nums text-[hsl(var(--foreground))] leading-none">
                  {formatCurrency(product.total)}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]/60">
                  <History className="w-2.5 h-2.5" />
                  {product.search_count} {product.search_count === 1 ? "search" : "searches"}
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
