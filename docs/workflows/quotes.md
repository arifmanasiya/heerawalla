# Quotes - End-to-End

```mermaid
flowchart TD
  A[Customer fills inspiration quote form] --> B[Turnstile verification]
  B --> C[POST /submit (source=quote)]
  C --> D{Validate payload}
  D -- ok --> E[Append quote sheet row (status NEW)]
  E --> F[Append contact row]
  F --> G[Queue quote ack]
  D -- error --> H[Return 4xx or 5xx]
  G --> I[ACK queue cron]
  I --> J[Send quote ack email]
  J --> K[Update status -> ACKNOWLEDGED]
  K --> L[Admin workflow]
```

- Admin workflow details are in `docs/workflows/admin-quotes.md`.
