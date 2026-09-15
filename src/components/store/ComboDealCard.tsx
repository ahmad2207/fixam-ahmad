'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import { computeComboPricing, type ComboDealWithComponents } from '@/lib/comboPricing';
import { AddToCartDialog } from './AddToCartDialog';

export function ComboDealCard({ combo }: { combo: ComboDealWithComponents }) {
  const { addCombo } = useCart();
  const [showDialog, setShowDialog] = useState(false);
  const pricing = computeComboPricing(combo);
  const componentNames = combo.components.filter((c) => c.product).map((c) => c.product!.name).join(' + ');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!pricing.available) return;
    addCombo({
      comboId: combo.id,
      slug: combo.slug,
      name: combo.name,
      price: combo.price,
      imageUrl: combo.imageUrl,
      quantity: 1,
      maxQuantity: pricing.maxQuantity,
      components: combo.components
        .filter((c) => c.product)
        .map((c) => ({ productId: c.product!.id, name: c.product!.name, quantity: c.quantity, imageUrl: c.product!.imageUrl })),
    });
    setShowDialog(true);
  };

  return (
    <>
      <Link href={`/combo-deals/${combo.slug}`} className="group block h-full">
        <div className="h-full bg-white overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">

          <div className="relative aspect-square bg-gray-50 overflow-hidden">
            {combo.imageUrl ? (
              <Image
                src={combo.imageUrl}
                alt={combo.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-5xl text-gray-200">🎁</div>
            )}

            <span className="absolute top-1.5 left-1.5 z-10 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
              Bundle
            </span>

            {!pricing.available && (
              <div className="absolute inset-0 z-10 bg-black/20 flex items-end justify-center pb-2">
                <span className="bg-black/60 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  Unavailable
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col px-2.5 pt-2 pb-2.5 gap-1.5">
            <h3 className="text-[13px] font-normal leading-snug text-gray-800 line-clamp-2">
              {combo.name}
            </h3>
            {componentNames && (
              <p className="text-[11px] text-gray-400 line-clamp-1">{componentNames}</p>
            )}

            <div className="flex items-center justify-between gap-1 mt-auto">
              <div className="min-w-0">
                <span className="text-lg font-semibold text-primary leading-none">
                  {formatCurrency(combo.price)}
                </span>
                {pricing.savings > 0 && (
                  <span className="text-xs text-gray-400 line-through leading-none ml-1">
                    {formatCurrency(pricing.sumOfParts)}
                  </span>
                )}
              </div>
              {pricing.available && (
                <button
                  onClick={handleAddToCart}
                  className="flex-shrink-0 p-0.5 text-gray-900 hover:text-primary transition-colors"
                >
                  <ShoppingCart className="h-6 w-6" />
                </button>
              )}
            </div>
            {pricing.savings > 0 && (
              <span className="text-[10px] font-bold text-emerald-700">Save {formatCurrency(pricing.savings)}</span>
            )}
          </div>
        </div>
      </Link>

      <AddToCartDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        productName={combo.name}
        productImage={combo.imageUrl}
        quantity={1}
        price={combo.price}
      />
    </>
  );
}
