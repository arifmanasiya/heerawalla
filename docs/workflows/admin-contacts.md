# Admin Customer Tickets - Status Workflow

```mermaid
flowchart LR
  NEW -- Mark pending --> PENDING
  PENDING -- Mark resolved --> RESOLVED
```

- Customer ticket status changes are manual admin actions.
