import { useState, useMemo } from 'react';
import { Badge, Button, FormatNumber, Icon, Select } from '@/components/ui';

// --- Install command ---
// npx kigumi add badge button format-number icon select

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
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

// Sample data: 32 products for meaningful pagination
const PRODUCTS: Product[] = [
  { id: 1, sku: 'WDG-001', name: 'Ergonomic Keyboard', category: 'Electronics', price: 89.99, quantity: 145, status: 'in-stock' },
  { id: 2, sku: 'WDG-002', name: 'Wireless Mouse', category: 'Electronics', price: 34.5, quantity: 312, status: 'in-stock' },
  { id: 3, sku: 'WDG-003', name: 'USB-C Hub', category: 'Electronics', price: 49.99, quantity: 8, status: 'low-stock' },
  { id: 4, sku: 'WDG-004', name: 'Monitor Stand', category: 'Furniture', price: 129.0, quantity: 0, status: 'out-of-stock' },
  { id: 5, sku: 'WDG-005', name: 'Desk Lamp', category: 'Furniture', price: 45.0, quantity: 67, status: 'in-stock' },
  { id: 6, sku: 'WDG-006', name: 'Webcam HD', category: 'Electronics', price: 79.99, quantity: 23, status: 'in-stock' },
  { id: 7, sku: 'WDG-007', name: 'Noise-Canceling Headphones', category: 'Audio', price: 199.99, quantity: 5, status: 'low-stock' },
  { id: 8, sku: 'WDG-008', name: 'Standing Desk Mat', category: 'Furniture', price: 59.0, quantity: 41, status: 'in-stock' },
  { id: 9, sku: 'WDG-009', name: 'Cable Management Kit', category: 'Accessories', price: 19.99, quantity: 200, status: 'in-stock' },
  { id: 10, sku: 'WDG-010', name: 'Portable SSD 1TB', category: 'Storage', price: 109.99, quantity: 0, status: 'out-of-stock' },
  { id: 11, sku: 'WDG-011', name: 'Mechanical Pencil Set', category: 'Stationery', price: 12.5, quantity: 500, status: 'in-stock' },
  { id: 12, sku: 'WDG-012', name: 'Bluetooth Speaker', category: 'Audio', price: 64.99, quantity: 33, status: 'in-stock' },
  { id: 13, sku: 'WDG-013', name: 'Laptop Sleeve 15"', category: 'Accessories', price: 29.99, quantity: 78, status: 'in-stock' },
  { id: 14, sku: 'WDG-014', name: 'Desk Organizer', category: 'Furniture', price: 24.99, quantity: 3, status: 'low-stock' },
  { id: 15, sku: 'WDG-015', name: 'Wireless Charger', category: 'Electronics', price: 39.99, quantity: 91, status: 'in-stock' },
  { id: 16, sku: 'WDG-016', name: 'Screen Protector Pack', category: 'Accessories', price: 9.99, quantity: 0, status: 'out-of-stock' },
  { id: 17, sku: 'WDG-017', name: 'Ethernet Cable 10ft', category: 'Electronics', price: 14.99, quantity: 420, status: 'in-stock' },
  { id: 18, sku: 'WDG-018', name: 'Microphone Arm', category: 'Audio', price: 74.99, quantity: 17, status: 'in-stock' },
  { id: 19, sku: 'WDG-019', name: 'Power Strip 6-Outlet', category: 'Electronics', price: 22.0, quantity: 56, status: 'in-stock' },
  { id: 20, sku: 'WDG-020', name: 'Whiteboard Markers', category: 'Stationery', price: 8.99, quantity: 7, status: 'low-stock' },
  { id: 21, sku: 'WDG-021', name: 'Document Scanner', category: 'Electronics', price: 249.99, quantity: 12, status: 'in-stock' },
  { id: 22, sku: 'WDG-022', name: 'Wrist Rest Pad', category: 'Accessories', price: 18.99, quantity: 64, status: 'in-stock' },
  { id: 23, sku: 'WDG-023', name: 'HDMI Cable 6ft', category: 'Electronics', price: 11.99, quantity: 310, status: 'in-stock' },
  { id: 24, sku: 'WDG-024', name: 'Surge Protector', category: 'Electronics', price: 34.99, quantity: 0, status: 'out-of-stock' },
  { id: 25, sku: 'WDG-025', name: 'Desk Fan', category: 'Furniture', price: 27.5, quantity: 29, status: 'in-stock' },
  { id: 26, sku: 'WDG-026', name: 'Notebook A5 3-Pack', category: 'Stationery', price: 15.99, quantity: 88, status: 'in-stock' },
  { id: 27, sku: 'WDG-027', name: 'USB Flash Drive 64GB', category: 'Storage', price: 12.99, quantity: 4, status: 'low-stock' },
  { id: 28, sku: 'WDG-028', name: 'Privacy Screen Filter', category: 'Accessories', price: 44.99, quantity: 21, status: 'in-stock' },
  { id: 29, sku: 'WDG-029', name: 'Adjustable Phone Stand', category: 'Accessories', price: 16.99, quantity: 130, status: 'in-stock' },
  { id: 30, sku: 'WDG-030', name: 'Condenser Microphone', category: 'Audio', price: 149.99, quantity: 0, status: 'out-of-stock' },
  { id: 31, sku: 'WDG-031', name: 'Trackpad', category: 'Electronics', price: 99.0, quantity: 9, status: 'low-stock' },
  { id: 32, sku: 'WDG-032', name: 'Clip-on Ring Light', category: 'Accessories', price: 21.99, quantity: 55, status: 'in-stock' },
];

export function ProductInventoryTable({
  products = PRODUCTS,
}: {
  products?: Product[];
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(products.length / pageSize);
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, products.length);

  const paginatedProducts = useMemo(
    () => products.slice(start, end),
    [products, start, end],
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
  const numericCellStyle = {
    ...cellStyle,
    textAlign: 'right' as const,
    fontVariantNumeric: 'tabular-nums',
  };
  const numericHeaderStyle = {
    ...headerStyle,
    textAlign: 'right' as const,
  };

  return (
    <div className="wa-stack wa-gap-m">
      <div className="wa-split wa-align-items-center">
        <h2>Product Inventory ({products.length})</h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          className="wa-zebra-rows wa-hover-rows"
          style={{ width: '100%', minWidth: '700px' }}
        >
          <caption className="wa-visually-hidden">
            Product inventory with SKU, category, price, quantity, and stock
            status
          </caption>
          <thead>
            <tr>
              <th scope="col" style={headerStyle}>
                SKU
              </th>
              <th scope="col" style={headerStyle}>
                Product
              </th>
              <th scope="col" style={headerStyle}>
                Category
              </th>
              <th scope="col" style={numericHeaderStyle}>
                Price
              </th>
              <th scope="col" style={numericHeaderStyle}>
                Qty
              </th>
              <th scope="col" style={headerStyle}>
                Status
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
                <td
                  style={{
                    ...cellStyle,
                    fontFamily: 'var(--wa-font-mono)',
                    fontSize: 'var(--wa-font-size-s)',
                  }}
                >
                  {product.sku}
                </td>
                <td style={cellStyle}>{product.name}</td>
                <td style={cellStyle}>{product.category}</td>
                <td style={numericCellStyle}>
                  <FormatNumber
                    value={product.price}
                    type="currency"
                    currency="USD"
                  />
                </td>
                <td style={numericCellStyle}>
                  <FormatNumber value={product.quantity} />
                </td>
                <td style={cellStyle}>
                  <Badge variant={statusVariant[product.status]}>
                    {statusLabel[product.status]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <nav aria-label="Table pagination">
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
              onChange={(e: CustomEvent) =>
                handlePageSizeChange(
                  Number((e.target as HTMLSelectElement).value),
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
              onClick={() => setPage(1)}
              aria-label="First page"
            >
              <Icon name="chevrons-left" />
            </Button>
            <Button
              variant="neutral"
              size="small"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <Icon name="chevron-left" label="Previous page" />
            </Button>
            <span
              style={{
                fontSize: 'var(--wa-font-size-s)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
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
            <Button
              variant="neutral"
              size="small"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              aria-label="Last page"
            >
              <Icon name="chevrons-right" />
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}
