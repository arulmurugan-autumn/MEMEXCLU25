# MEMEXCLU25

# Shopify Membership Product Discount Function

A Shopify Function that automatically applies product-level percentage discounts for logged-in customers based on a product metafield.

## Overview

This function reads a discount percentage from a product metafield (`custom.discount`) and applies the corresponding product discount to eligible cart lines when a customer is logged in.

The discount message displayed in the cart and checkout is:

```
MEMEXCLU25
```

## Features

* Applies discounts only for authenticated customers.
* Reads discount percentages dynamically from product metafields.
* Supports different discount percentages per product.
* Ignores products without a valid discount metafield.
* Uses Shopify Functions for high-performance discount calculations.
* Automatically displays a custom discount message.

---

## Metafield Configuration

Create a product metafield with:

| Property  | Value                     |
| --------- | ------------------------- |
| Namespace | `custom`                  |
| Key       | `discount`                |
| Type      | Number / Single line text |

### Example Values

| Product   | Metafield Value |
| --------- | --------------- |
| Product A | `10`            |
| Product B | `15`            |
| Product C | `25`            |

The value represents the percentage discount to apply.

---

## Function Logic

### Validation Flow

1. Verify customer is logged in.
2. Verify cart contains products.
3. Verify the discount is configured with the Product discount class.
4. Loop through all cart lines.
5. Check whether the product contains the metafield:

   ```
   custom.discount
   ```
6. Parse the metafield value as a percentage.
7. Create a discount candidate for each eligible cart line.
8. Return all discount candidates to Shopify.

---

## Example

### Product Metafields

| Product       | Discount |
| ------------- | -------- |
| Running Shoes | 10       |
| Backpack      | 15       |
| Water Bottle  | Empty    |

### Cart

| Product       | Qty |
| ------------- | --- |
| Running Shoes | 1   |
| Backpack      | 1   |
| Water Bottle  | 1   |

### Applied Discounts

| Product       | Discount    |
| ------------- | ----------- |
| Running Shoes | 10%         |
| Backpack      | 15%         |
| Water Bottle  | No Discount |

---

## Discount Message

The following message is shown for all generated discounts:

```javascript
const DISCOUNT_MESSAGE = "MEMEXCLU25";
```

---

## GraphQL Input Query

```graphql
query CartInput {
  cart {
    buyerIdentity {
      customer {
        id
      }
    }
    lines {
      id
      cost {
        subtotalAmount {
          amount
        }
      }
      merchandise {
        __typename
        ... on ProductVariant {
          id
          product {
            metafield(namespace: "custom", key: "discount") {
              value
            }
          }
        }
      }
    }
  }
  discount {
    discountClasses
  }
}
```

---

## Example Discount Configuration

```graphql
mutation {
  discountAutomaticAppCreate(
    automaticAppDiscount: {
      title: "Membership Discount"
      functionId: "<FUNCTION_ID>"
      discountClasses: [PRODUCT]
      startsAt: "2025-01-01T00:00:00Z"
    }
  ) {
    automaticAppDiscount {
      discountId
    }
    userErrors {
      field
      message
    }
  }
}
```

---

## Requirements

* Shopify Functions
* Product Discount API
* Product metafield:

  * Namespace: `custom`
  * Key: `discount`
* Customer must be logged in

---

## Limitations

* Discounts are applied only to logged-in customers.
* Products without the `custom.discount` metafield are ignored.
* Invalid or non-numeric metafield values are ignored.
* Supports percentage-based discounts only.

---

## Repository Structure

```text
shopify-function/
├── src/
│   ├── run.js
│   └── run.graphql
├── generated/
├── shopify.extension.toml
├── package.json
└── README.md
```

---

## License

MIT License
