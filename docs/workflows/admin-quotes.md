# Admin Quotes - Status Workflow

```mermaid
flowchart LR
  NEW -- Acknowledge --> ACKNOWLEDGED
  ACKNOWLEDGED -- Submit quote --> QUOTED
  ACKNOWLEDGED -- Drop --> DROPPED
  QUOTED -- Mark actioned --> QUOTE_ACTIONED
```

- Quote status changes are manual admin actions.
