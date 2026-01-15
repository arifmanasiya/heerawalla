# Admin Orders - Status Workflow

```mermaid
flowchart LR
  NEW -- Acknowledge --> ACKNOWLEDGED
  ACKNOWLEDGED -- Request confirmation --> PENDING_CONFIRMATION
  ACKNOWLEDGED -- Send invoice --> INVOICED
  PENDING_CONFIRMATION -- Send invoice --> INVOICED
  INVOICED -- Mark paid --> INVOICE_PAID
  INVOICED -- Mark invoice expired --> INVOICE_EXPIRED
  INVOICE_EXPIRED -- Send invoice --> INVOICED
  INVOICE_PAID -- Mark processing --> PROCESSING
  PROCESSING -- Mark shipped --> SHIPPED
  SHIPPED -- Mark delivered --> DELIVERED
  NEW -- Cancel --> CANCELLED
  ACKNOWLEDGED -- Cancel --> CANCELLED
  PENDING_CONFIRMATION -- Cancel --> CANCELLED
  INVOICED -- Cancel --> CANCELLED
  INVOICE_EXPIRED -- Cancel --> CANCELLED
  CANCELLED -- Send invoice --> INVOICED
```

- PENDING_CONFIRMATION can only be set by "Get Customer Confirmation."
- Changing price, timeline, metal, stone, or stone_weight requires confirmation.
- Mark shipped requires fulfillment details: shipping_carrier, tracking_number, certificates, care_details, warranty_details, service_details.
- Order details are stored in the order details sheet and reused in shipped/delivered emails.
