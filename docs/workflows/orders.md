# Orders - End-to-End

```mermaid
flowchart TD
  subgraph Customer
    A[Browse product] --> B[Begin purchase page]
    B --> C[Enter required details + sizing]
    C --> D[Turnstile verification]
    D --> E[POST /order]
  end

  subgraph Worker
    E --> F{Validate fields + turnstile}
    F -- ok --> G[Append order sheet row - status NEW]
    G --> H[Append contact row]
    H --> I[Queue order ack]
    F -- error --> J[Return 4xx or 5xx]
  end

  subgraph SystemCron
    I --> K[ACK queue cron]
    K --> L[Send order ack email]
    L --> M[Update status -> ACKNOWLEDGED]
  end

  subgraph Admin
    M --> N[Admin workflow]
  end

  subgraph CustomerLifecycle
    N --> O[Status update emails + reminders]
    O --> P[Delivered email includes authenticity link]
  end
```

- Admin workflow details are in `docs/workflows/admin-orders.md`.
- Confirmation and cancel flows are in `docs/workflows/order-confirmation.md` and `docs/workflows/order-cancel.md`.
- Shipping, certificates, care, warranty, and service details are stored in the order details sheet.
