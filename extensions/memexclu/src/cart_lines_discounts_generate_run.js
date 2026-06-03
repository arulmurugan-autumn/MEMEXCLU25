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


  // 4. Get message from discount metafield (JSON)
  const metafieldRaw = input.discount.metafield?.value;
  let discountMessage = "";

  try {
    const parsed = JSON.parse(metafieldRaw || "{}");
    discountMessage = parsed.discountMessage?.trim() || "";
  } catch {
    discountMessage = "";
  }

  if (!discountMessage) {
    return { operations: [] };
  }
  // 5. Build candidates only for eligible lines
  const candidates = [];

  for (const line of input.cart.lines) {
    const merchandise = line.merchandise;

    // Skip non-ProductVariant lines
    if (!merchandise || merchandise.__typename !== "ProductVariant") continue;

    const product = merchandise.product;

    // 6. Check custom.discount metafield is non-empty
    const metafieldValue = product.metafield?.value;
    if (!metafieldValue || metafieldValue.trim() === "") continue;

    // 7. Parse percentage value
    const percentage = parseFloat(metafieldValue);
    if (isNaN(percentage) || percentage <= 0) continue;

    // 8. Add as a discount candidate
    candidates.push({
      message: discountMessage,
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