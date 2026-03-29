import { useState } from 'react';
import { Badge, Button, Card, Icon, Input } from '@/components/ui';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

const ALL_PRODUCTS: Product[] = [
  { id: '1', name: 'Wireless Keyboard', sku: 'KB-001', category: 'Peripherals', stock: 142, price: 79.99, status: 'in-stock' },
  { id: '2', name: 'USB-C Hub', sku: 'HB-002', category: 'Accessories', stock: 87, price: 49.99, status: 'in-stock' },
  { id: '3', name: 'Mechanical Mouse', sku: 'MS-003', category: 'Peripherals', stock: 6, price: 59.99, status: 'low-stock' },
  { id: '4', name: '4K Monitor', sku: 'MN-004', category: 'Displays', stock: 0, price: 449.00, status: 'out-of-stock' },
  { id: '5', name: 'Laptop Stand', sku: 'LS-005', category: 'Accessories', stock: 203, price: 34.99, status: 'in-stock' },
  { id: '6', name: 'Webcam HD', sku: 'WC-006', category: 'Peripherals', stock: 4, price: 89.99, status: 'low-stock' },
  { id: '7', name: 'Desk Mat XL', sku: 'DM-007', category: 'Accessories', stock: 55, price: 29.99, status: 'in-stock' },
  { id: '8', name: 'Headset Pro', sku: 'HS-008', category: 'Audio', stock: 0, price: 129.99, status: 'out-of-stock' },
  { id: '9', name: 'HDMI Cable 2m', sku: 'CB-009', category: 'Cables', stock: 320, price: 14.99, status: 'in-stock' },
  { id: '10', name: 'USB-C Charger', sku: 'CH-010', category: 'Accessories', stock: 112, price: 39.99, status: 'in-stock' },
  { id: '11', name: 'Trackpad', sku: 'TP-011', category: 'Peripherals', stock: 9, price: 69.99, status: 'low-stock' },
  { id: '12', name: 'Speaker Bar', sku: 'SP-012', category: 'Audio', stock: 0, price: 199.99, status: 'out-of-stock' },
  { id: '13', name: 'Ethernet Adapter', sku: 'EA-013', category: 'Cables', stock: 78, price: 24.99, status: 'in-stock' },
  { id: '14', name: 'Cable Management Kit', sku: 'CM-014', category: 'Accessories', stock: 145, price: 19.99, status: 'in-stock' },
  { id: '15', name: 'Wrist Rest', sku: 'WR-015', category: 'Accessories', stock: 7, price: 22.99, status: 'low-stock' },
  { id: '16', name: 'Screen Cleaner', sku: 'SC-016', category: 'Accessories', stock: 400, price: 9.99, status: 'in-stock' },
  { id: '17', name: 'Portable SSD 1TB', sku: 'SD-017', category: 'Storage', stock: 33, price: 109.99, status: 'in-stock' },
  { id: '18', name: 'USB Flash Drive', sku: 'FD-018', category: 'Storage', stock: 0, price: 12.99, status: 'out-of-stock' },
  { id: '19', name: 'Docking Station', sku: 'DS-019', category: 'Accessories', stock: 21, price: 179.99, status: 'in-stock' },
  { id: '20', name: 'Mini Projector', sku: 'PJ-020', category: 'Displays', stock: 2, price: 299.99, status: 'low-stock' },
  { id: '21', name: 'Numpad Wireless', sku: 'NP-021', category: 'Peripherals', stock: 64, price: 34.99, status: 'in-stock' },
  { id: '22', name: 'Laptop Sleeve 15"', sku: 'SL-022', category: 'Accessories', stock: 88, price: 27.99, status: 'in-stock' },
  { id: '23', name: 'Monitor Arm', sku: 'MA-023', category: 'Accessories', stock: 0, price: 89.99, status: 'out-of-stock' },
  { id: '24', name: 'Smart Power Strip', sku: 'PS-024', category: 'Power', stock: 15, price: 44.99, status: 'in-stock' },
  { id: '25', name: 'Blue Light Glasses', sku: 'BG-025', category: 'Accessories', stock: 3, price: 39.99, status: 'low-stock' },
];

const ITEMS_PER_PAGE = 10;

function getStatusVariant(status: Product['status']): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'in-stock': return 'success';
    case 'low-stock': return 'warning';
    case 'out-of-stock': return 'danger';
  }
}

function getStatusLabel(status: Product['status']): string {
  switch (status) {
    case 'in-stock': return 'In Stock';
    case 'low-stock': return 'Low Stock';
    case 'out-of-stock': return 'Out of Stock';
  }
}

export function ProductInventoryTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  const filtered = ALL_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearch = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setSearch(value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="wa-stack wa-gap-m" style={{ padding: 'var(--wa-space-l)' }}>
      <div className="wa-cluster wa-justify-content-space-between wa-align-items-center">
        <div className="wa-stack wa-gap-2xs">
          <h2 className="wa-heading-m" style={{ margin: 0 }}>
            Product Inventory
          </h2>
          <p className="wa-body-s" style={{ margin: 0, color: 'var(--wa-color-neutral-60)' }}>
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'} found
          </p>
        </div>

        <div style={{ width: '280px' }}>
          <Input
            placeholder="Search by name, SKU, or category..."
            size="medium"
            value={search}
            onInput={handleSearch}
            with-clear
            onClear={() => { setSearch(''); setCurrentPage(1); }}
          >
            <wa-icon slot="start" name="magnifying-glass" />
          </Input>
        </div>
      </div>

      <Card appearance="outlined" style={{ overflow: 'hidden' }}>
        <div slot="header" className="wa-cluster wa-justify-content-space-between wa-align-items-center">
          <span className="wa-label-m">
            Page {safePage} of {totalPages}
          </span>
          <span className="wa-caption-s" style={{ color: 'var(--wa-color-neutral-60)' }}>
            Showing {pageItems.length === 0 ? 0 : startIndex + 1}–{startIndex + pageItems.length} of {filtered.length}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--wa-font-size-s)',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid var(--wa-color-neutral-20)',
                  background: 'var(--wa-color-neutral-5)',
                }}
              >
                {(['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status'] as const).map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: 'var(--wa-space-s) var(--wa-space-m)',
                      textAlign: col === 'Price' || col === 'Stock' ? 'right' : 'left',
                      fontWeight: 'var(--wa-font-weight-semibold)' as React.CSSProperties['fontWeight'],
                      color: 'var(--wa-color-neutral-80)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 'var(--wa-space-2xl)',
                      textAlign: 'center',
                      color: 'var(--wa-color-neutral-50)',
                    }}
                  >
                    <div className="wa-stack wa-align-items-center wa-gap-s">
                      <Icon name="box-open" style={{ fontSize: '2rem' }} />
                      <span className="wa-body-m">No products match your search.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((product, index) => (
                  <tr
                    key={product.id}
                    style={{
                      borderBottom: index < pageItems.length - 1 ? '1px solid var(--wa-color-neutral-15)' : 'none',
                      background: index % 2 === 0 ? 'transparent' : 'var(--wa-color-neutral-3)',
                    }}
                  >
                    <td style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}>
                      <span className="wa-body-s" style={{ fontWeight: 'var(--wa-font-weight-medium)' as React.CSSProperties['fontWeight'] }}>
                        {product.name}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}>
                      <code
                        style={{
                          fontSize: 'var(--wa-font-size-xs)',
                          color: 'var(--wa-color-neutral-70)',
                          background: 'var(--wa-color-neutral-10)',
                          padding: '2px 6px',
                          borderRadius: 'var(--wa-border-radius-s)',
                        }}
                      >
                        {product.sku}
                      </code>
                    </td>
                    <td style={{ padding: 'var(--wa-space-s) var(--wa-space-m)', color: 'var(--wa-color-neutral-70)' }}>
                      {product.category}
                    </td>
                    <td
                      style={{
                        padding: 'var(--wa-space-s) var(--wa-space-m)',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      ${product.price.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: 'var(--wa-space-s) var(--wa-space-m)',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        color: product.stock === 0 ? 'var(--wa-color-danger-60)' : product.stock <= 10 ? 'var(--wa-color-warning-60)' : 'inherit',
                      }}
                    >
                      {product.stock}
                    </td>
                    <td style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}>
                      <Badge
                        variant={getStatusVariant(product.status)}
                        appearance="filled-outlined"
                        pill
                      >
                        {getStatusLabel(product.status)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          slot="footer"
          className="wa-cluster wa-justify-content-space-between wa-align-items-center"
          style={{ padding: 'var(--wa-space-s) 0' }}
        >
          <Button
            appearance="outlined"
            size="small"
            disabled={safePage <= 1}
            onClick={() => goToPage(safePage - 1)}
            aria-label="Previous page"
          >
            <Icon slot="start" name="chevron-left" />
            Previous
          </Button>

          <div className="wa-cluster wa-gap-xs">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (totalPages <= 7) return true;
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - safePage) <= 1) return true;
                return false;
              })
              .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === 'number' && (page as number) - (arr[idx - 1] as number) > 1) {
                  acc.push('ellipsis');
                }
                acc.push(page);
                return acc;
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="wa-body-s"
                    style={{
                      padding: '0 var(--wa-space-2xs)',
                      color: 'var(--wa-color-neutral-50)',
                      lineHeight: '32px',
                    }}
                  >
                    &hellip;
                  </span>
                ) : (
                  <Button
                    key={item}
                    size="small"
                    appearance={item === safePage ? 'filled' : 'plain'}
                    variant={item === safePage ? 'brand' : 'neutral'}
                    onClick={() => goToPage(item as number)}
                    aria-label={`Page ${item}`}
                    aria-current={item === safePage ? 'page' : undefined}
                  >
                    {item}
                  </Button>
                )
              )}
          </div>

          <Button
            appearance="outlined"
            size="small"
            disabled={safePage >= totalPages}
            onClick={() => goToPage(safePage + 1)}
            aria-label="Next page"
          >
            Next
            <Icon slot="end" name="chevron-right" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
