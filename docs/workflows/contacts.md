# Contacts - End-to-End

```mermaid
flowchart TD
  A[Customer submits contact form] --> B[POST /contact-submit]
  B --> C{Validate payload}
  C -- ok --> D[Append customer tickets sheet row (status NEW)]
  D --> E[Forward to internal inbox]
  E --> F[Send contact ack email]
  F --> G[Upsert unified contacts sheet]
  G --> H[Admin workflow]
  C -- error --> I[Return 4xx or 5xx]
```

- Admin workflow details are in `docs/workflows/admin-contacts.md`.
