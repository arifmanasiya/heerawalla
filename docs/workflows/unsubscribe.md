# Unsubscribe - End-to-End

```mermaid
flowchart TD
  A[Customer enters email] --> B[POST /unsubscribe]
  B --> C{Validate email}
  C -- ok --> D[Update unified contacts sheet]
  D --> E[Sync Google contact (optional)]
  C -- error --> F[Return 4xx or 5xx]
```

- Unsubscribe sets subscribed = False only on explicit unsubscribe.
