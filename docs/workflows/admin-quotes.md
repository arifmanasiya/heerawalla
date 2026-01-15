# Admin Quotes - Status Workflow

```mermaid
flowchart LR
  NEW -- Acknowledge --> ACKNOWLEDGED
  ACKNOWLEDGED -- Submit quote --> QUOTED
  ACKNOWLEDGED -- Drop --> DROPPED
  QUOTED -- Convert to order --> CONVERTED
```

- Quote status changes are manual admin actions.
