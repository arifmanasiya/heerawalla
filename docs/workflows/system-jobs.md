# System Jobs (Cron)

```mermaid
flowchart TD
  A[Every 15 minutes] --> B[ACK queue cron]
  B --> C[Send order + quote ack emails]
  C --> D[Update status -> ACKNOWLEDGED]

  A --> E[Status email sender]
  E --> F[Send status email on change]
  F --> G{Reminder needed?}
  G -- PENDING_CONFIRMATION --> H[Send reminder every 48h up to 3]
  G -- INVOICE_EXPIRED --> I[Send reminder every 48h up to 3]

  A --> J[Shipping monitor]
  J --> K[Check SHIPPED orders every 6h]
  K --> L[Append shipping notes]
  L --> M{Shipping status delivered?}
  M -- Yes --> N[Update status -> DELIVERED]

  A --> O[Unified contacts consolidation]
  O --> P[Merge orders, quotes, customer tickets, subscriptions]
  P --> Q[Upsert unified contacts sheet]
```

- Status email reminders are only for PENDING_CONFIRMATION and INVOICE_EXPIRED.
- Shipping monitor uses the order details sheet and sets last_shipping_check_at.
- Unified contacts consolidation keeps a single contacts sheet up to date across sources.
