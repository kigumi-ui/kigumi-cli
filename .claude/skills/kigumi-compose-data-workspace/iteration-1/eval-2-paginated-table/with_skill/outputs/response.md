# Eval 2: Paginated Product Inventory Table

## Install Dependencies

```bash
npx kigumi add badge button icon select format-number
```

## Implementation

A paginated table for product inventory displaying 10 items per page with page navigation, a page-size selector, and a "Showing X-Y of Z" summary. Uses native HTML `<table>` (no `<wa-table>` exists) with WA utility classes and tokens.

```tsx
import { useState, useMemo } from 'react';
import { Badge, Button, FormatNumber, Icon, Select } from '@/components/ui';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

const statusVariant = {
  'in-stock': 'success',
  'low-stock': 'warning',
  'out-of-stock': 'danger',
} as const;

const statusLabel = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
} as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function ProductInventoryTable({ products }: { products: Product[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(products.length / pageSize);
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, products.length);

  const paginatedProducts = useMemo(
    () => products.slice(start, end),
    [products, start, end]
  );

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setPage(1);
  }

  const cellStyle = { padding: 'var(--wa-space-s) var(--wa-space-m)' };
  const headerStyle = {
    ...cellStyle,
    borderBottom: '2px solid var(--wa-color-surface-border)',
    textAlign: 'left' as const,
  };
  const numericCell = { ...cellStyle, textAlign: 'right' as const };
  const numericHeader = { ...headerStyle, textAlign: 'right' as const };

  return (
    <div className="wa-stack wa-gap-m">
      <div className="wa-split wa-align-items-center">
        <h2>Product Inventory ({products.length})</h2>
        <Button variant="brand" size="small">
          <Icon slot="start" name="plus" />
          Add Product
        </Button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          class="wa-zebra-rows wa-hover-rows"
          style={{ width: '100%', minWidth: '700px' }}
        >
          <caption className="wa-sr-only">
            Product inventory with name, SKU, price, stock level, and status
          </caption>
          <thead>
            <tr>
              <th scope="col" style={headerStyle}>
                Product
              </th>
              <th scope="col" style={headerStyle}>
                SKU
              </th>
              <th scope="col" style={numericHeader}>
                Price
              </th>
              <th scope="col" style={numericHeader}>
                Stock
              </th>
              <th scope="col" style={headerStyle}>
                Status
              </th>
              <th
                scope="col"
                style={{
                  ...cellStyle,
                  borderBottom: '2px solid var(--wa-color-surface-border)',
                }}
              >
                <span className="wa-sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => (
              <tr
                key={product.id}
                style={{
                  borderBottom: '1px solid var(--wa-color-surface-border)',
                }}
              >
                <td style={cellStyle}>{product.name}</td>
                <td
                  style={{
                    ...cellStyle,
                    fontFamily: 'var(--wa-font-mono)',
                    fontSize: 'var(--wa-font-size-s)',
                  }}
                >
                  {product.sku}
                </td>
                <td style={numericCell}>
                  <FormatNumber
                    value={product.price}
                    type="currency"
                    currency="USD"
                  />
                </td>
                <td style={numericCell}>
                  <FormatNumber value={product.stock} />
                </td>
                <td style={cellStyle}>
                  <Badge variant={statusVariant[product.status]}>
                    {statusLabel[product.status]}
                  </Badge>
                </td>
                <td style={cellStyle}>
                  <Button
                    variant="neutral"
                    size="small"
                    appearance="plain"
                    aria-label={`Edit ${product.name}`}
                  >
                    <Icon name="pen" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="wa-split wa-align-items-center">
        <span
          style={{
            color: 'var(--wa-color-text-quiet)',
            fontSize: 'var(--wa-font-size-s)',
          }}
        >
          Showing {start + 1}-{end} of {products.length}
        </span>
        <div className="wa-cluster wa-gap-s wa-align-items-center">
          <Select
            value={String(pageSize)}
            onWaChange={(e: CustomEvent) =>
              handlePageSizeChange(
                Number((e.target as HTMLSelectElement).value)
              )
            }
            size="small"
            style={{ width: '80px' }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
          <Button
            variant="neutral"
            size="small"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <Icon name="chevron-left" label="Previous page" />
          </Button>
          <span style={{ fontSize: 'var(--wa-font-size-s)' }}>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="neutral"
            size="small"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <Icon name="chevron-right" label="Next page" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Usage

```tsx
const products: Product[] = [
  {
    id: 1,
    name: 'Wireless Headphones',
    sku: 'WH-1001',
    price: 79.99,
    stock: 243,
    status: 'in-stock',
  },
  {
    id: 2,
    name: 'USB-C Hub',
    sku: 'UC-2050',
    price: 49.99,
    stock: 8,
    status: 'low-stock',
  },
  {
    id: 3,
    name: 'Mechanical Keyboard',
    sku: 'MK-3020',
    price: 129.99,
    stock: 0,
    status: 'out-of-stock',
  },
  {
    id: 4,
    name: 'Webcam Pro',
    sku: 'WC-4010',
    price: 89.99,
    stock: 56,
    status: 'in-stock',
  },
  {
    id: 5,
    name: 'Monitor Stand',
    sku: 'MS-5005',
    price: 34.99,
    stock: 112,
    status: 'in-stock',
  },
  {
    id: 6,
    name: 'Desk Lamp',
    sku: 'DL-6001',
    price: 24.99,
    stock: 5,
    status: 'low-stock',
  },
  {
    id: 7,
    name: 'Mouse Pad XL',
    sku: 'MP-7002',
    price: 19.99,
    stock: 340,
    status: 'in-stock',
  },
  {
    id: 8,
    name: 'Laptop Sleeve 15"',
    sku: 'LS-8015',
    price: 29.99,
    stock: 67,
    status: 'in-stock',
  },
  {
    id: 9,
    name: 'Cable Organizer',
    sku: 'CO-9003',
    price: 12.99,
    stock: 0,
    status: 'out-of-stock',
  },
  {
    id: 10,
    name: 'Ergonomic Chair',
    sku: 'EC-1100',
    price: 399.99,
    stock: 15,
    status: 'in-stock',
  },
  {
    id: 11,
    name: 'Standing Desk',
    sku: 'SD-1200',
    price: 549.99,
    stock: 3,
    status: 'low-stock',
  },
  {
    id: 12,
    name: 'Noise Machine',
    sku: 'NM-1300',
    price: 39.99,
    stock: 88,
    status: 'in-stock',
  },
];

<ProductInventoryTable products={products} />;
```

## Key Points

- **No `<wa-table>` component exists.** Uses a native HTML `<table>` with WA utility classes (`wa-zebra-rows`, `wa-hover-rows`) and CSS custom properties for consistent theming.
- **Accessible:** visually hidden `<caption>`, `scope="col"` on every `<th>`, and labeled icon buttons for pagination and actions.
- **Responsive:** wrapped in `<div>` with `overflowX: 'auto'` and a `minWidth` on the table.
- **`FormatNumber`** handles both currency (price column, `type="currency" currency="USD"`) and plain decimal (stock column) formatting automatically with locale-aware separators.
- **`Badge`** maps inventory status to semantic color variants: in-stock = success, low-stock = warning, out-of-stock = danger.
- **`Select`** (WA web component) for page size lets the user choose 10, 25, or 50 items per page. Changing page size resets to page 1.
- **Pagination math:** `start`, `end`, and `totalPages` are derived from the current page and page size. Previous/Next buttons are disabled at boundaries.
