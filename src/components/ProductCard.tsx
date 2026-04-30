import { useState, useRef } from "react";
import { motion } from "motion/react";
import { toPng } from "html-to-image";
import {
  ImageIcon,
  Gem,
  CircleDollarSign,
  ArrowUpRight,
  Scale,
  Sparkles,
  History,
  Download,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import type { ProductWithPricing } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onLoad,
  onDownload,
}: {
  product: ProductWithPricing;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLoad: () => void;
  onDownload?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const hasStones = product.stoneDetails.some((stone) => stone.weight > 0);
  const stoneChips = Array.from(
    new Map(product.stones.map((stone) => [stone.stoneTypeId, stone.name])).values(),
  );

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const slug = product.product_name.trim().replace(/\s+/g, "-").toLowerCase() || "estimate";
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

  const handleLoad = () => {
    onOpenChange(false);
    onLoad();
  };

  const handleDownloadClick = () => {
    if (onDownload) {
      onOpenChange(false);
      onDownload();
    } else {
      handleDownload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-sm rounded-2xl gap-0 max-h-[92dvh] flex flex-col">
        {/* Scrollable wrapper - for user viewing */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Card Content - Ref for PNG download */}
          <div
            ref={cardRef}
            className="rounded-t-xl overflow-hidden bg-[hsl(var(--card))]"
          >
          {/* Branding header */}
          <div className="flex items-center justify-center gap-2 py-3 border-b border-[hsl(var(--border))]">
            <img src="/evol-logo.webp" alt="Evol" className="h-6 w-auto" />
          </div>

          {/* Product header */}
          <div className="grid grid-cols-[3fr_2fr]">
            {/* Image — left side */}
            <div className="relative aspect-square bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden">
              {product.product_image_url ? (
                <img
                  src={product.product_image_url}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-[hsl(var(--muted-foreground))]/30" />
              )}
            </div>

            {/* Name + details — right half */}
            <div className="flex flex-col justify-between px-3 py-3 min-w-0 overflow-hidden">
              <div className="min-w-0 overflow-hidden">
                <p className="text-sm font-semibold leading-snug break-words hyphens-auto line-clamp-3 text-[hsl(var(--foreground))]">
                  {product.product_name}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
                    <CircleDollarSign className="w-2 h-2" />
                    {product.purity}K
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                    <Scale className="w-2 h-2" />
                    {formatWeight(product.net_gold_weight, 2)}g
                  </span>
                  {stoneChips.slice(0, 2).map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                    >
                      <Gem className="w-2 h-2" />
                      {name}
                    </span>
                  ))}
                  {stoneChips.length > 2 && (
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]/60">
                      +{stoneChips.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Total anchored to bottom */}
              <div className="mt-2">
                <p className="text-[9px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/60 mb-0.5">
                  Total
                </p>
                <p className="text-lg font-bold tabular text-[hsl(var(--foreground))] leading-tight">
                  {formatCurrency(product.total)}
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
              {formatWeight(product.net_gold_weight + (product.stoneDetails.reduce((sum, s) => sum + (s.weight || 0), 0) / 5), 3)} g
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
                  {formatWeight(product.net_gold_weight, 3)} g
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">
                  Purity
                </p>
                <p className="font-medium">{product.purity}K</p>
              </div>
              <div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">
                  Rate
                </p>
                <p className="font-medium tabular">
                  {formatCurrency(product.goldRate)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">
                  Cost
                </p>
                <p className="font-semibold tabular">
                  {formatCurrency(product.goldCost)}
                </p>
              </div>
            </div>

            {/* Making charges */}
            <div className="flex justify-between items-center pt-2 border-t border-[hsl(var(--border))]/40">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Making Charges
              </span>
              <span className="text-sm font-semibold tabular">
                {formatCurrency(product.makingCost)}
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

                {product.stoneDetails
                  .filter((d) => d.weight > 0)
                  .map((d, i, arr) => (
                    <div
                      key={i}
                      className={cn(
                        "py-2.5",
                        i < arr.length - 1 && "border-b border-[hsl(var(--border))]/40",
                      )}
                    >
                      {/* Stone name + cost */}
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {d.name}
                        </span>
                        <span className="text-sm font-semibold tabular shrink-0">
                          {formatCurrency(d.cost)}
                        </span>
                      </div>

                      {/* Stone detail chips */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          {formatWeight(d.weight, 3)} ct
                        </span>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]/40">
                          ·
                        </span>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          {d.quantity} pcs
                        </span>
                        {d.pricePerCarat > 0 && (
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                            @ {formatCurrency(d.pricePerCarat)}/ct
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                {/* Stones subtotal */}
                {product.stoneCostTotal > 0 && (
                  <div className="flex justify-between items-center pt-2.5 border-t border-[hsl(var(--border))]/40">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      Total Stones
                    </span>
                    <span className="text-sm font-semibold tabular">
                      {formatCurrency(product.stoneCostTotal)}
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
                {formatCurrency(product.subTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                GST (3%)
              </span>
              <span className="text-sm tabular text-[hsl(var(--muted-foreground))]">
                {formatCurrency(product.gst)}
              </span>
            </div>
          </div>

          {/* Grand total bar */}
          <div className="bg-[hsl(var(--foreground))] text-[hsl(var(--background))] px-4 py-4 flex justify-between items-center">
            <span className="text-sm font-medium">Total</span>
            <span className="text-2xl font-bold tabular">
              {formatCurrency(product.total)}
            </span>
          </div>

          {/* Terms & Conditions */}
          <div className="px-4 py-2 bg-[hsl(var(--muted))]/20 border-t border-[hsl(var(--border))]">
            <p className="text-[9px] font-medium tracking-widest uppercase text-[hsl(var(--muted-foreground))]/60 mb-1">
              Terms & Conditions
            </p>
            <ul className="space-y-0.5">
              <li className="text-[9px] text-[hsl(var(--muted-foreground))] leading-snug flex items-start gap-1.5">
                <span className="text-[hsl(var(--muted-foreground))]/40 mt-0.5">•</span>
                <span>Gold weight estimated might be slightly (5-10%) higher than actual weight of product, invoicing will be as per actuals</span>
              </li>
              <li className="text-[9px] text-[hsl(var(--muted-foreground))] leading-snug flex items-start gap-1.5">
                <span className="text-[hsl(var(--muted-foreground))]/40 mt-0.5">•</span>
                <span>Prices quoted as on today&apos;s date, subject to fluctuations depending on the date of confirmation</span>
              </li>
              <li className="text-[9px] text-[hsl(var(--muted-foreground))] leading-snug flex items-start gap-1.5">
                <span className="text-[hsl(var(--muted-foreground))]/40 mt-0.5">•</span>
                <span>For custom orders, a 50% advance payment is required to confirm the order and 75% to lock the gold rate</span>
              </li>
            </ul>
          </div>
        </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 py-4 flex items-center gap-2 border-t border-[hsl(var(--border))]">
          <button
            onClick={handleDownloadClick}
            disabled={isDownloading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
              "text-xs font-semibold tracking-wide",
              "border border-[hsl(var(--border))] text-[hsl(var(--foreground))]",
              "hover:bg-[hsl(var(--muted))] transition-colors duration-150",
              "disabled:opacity-40",
            )}
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Download
          </button>
          <button
            onClick={handleLoad}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
              "text-xs font-semibold tracking-wide",
              "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]",
              "hover:opacity-90 transition-opacity duration-150",
            )}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Load into Calculator
          </button>
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