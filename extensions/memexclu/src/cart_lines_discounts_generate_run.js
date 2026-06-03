import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

/**
 * @typedef {import("../generated/api").CartInput} RunInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

/**
 * @param {RunInput} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */

const DISCOUNT_MESSAGE = "MEMEXCLU25";

export function cartLinesDiscountsGenerateRun(input) {
  // 1. Customer must be logged in
  const customer = input.cart.buyerIdentity?.customer;
  if (!customer?.id) {
    return { operations: [] };
  }

  // 2. No cart lines, return early
  if (!input.cart.lines.length) {
    return { operations: [] };
  }

  // 3. Check if Product discount class is available
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  if (!hasProductDiscountClass) {
    return { operations: [] };
  }

  // 4. Build candidates only for eligible lines
  const candidates = [];

  for (const line of input.cart.lines) {
    const merchandise = line.merchandise;

    // Skip non-ProductVariant lines
    if (!merchandise || merchandise.__typename !== "ProductVariant") continue;

    const product = merchandise.product;

    // 5. Check custom.discount metafield is non-empty
    const metafieldValue = product.metafield?.value;
    if (!metafieldValue || metafieldValue.trim() === "") continue;

    // 6. Parse percentage value
    const percentage = parseFloat(metafieldValue);
    if (isNaN(percentage) || percentage <= 0) continue;

    // 7. Add as a discount candidate
    candidates.push({
      message: DISCOUNT_MESSAGE,
      targets: [
        {
          cartLine: {
            id: line.id,
          },
        },
      ],
      value: {
        percentage: {
          value: percentage,
        },
      },
    });
  }

  // No eligible lines found
  if (!candidates.length) {
    return { operations: [] };
  }

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates,
          selectionStrategy: ProductDiscountSelectionStrategy.First,
        },
      },
    ],
  };
}