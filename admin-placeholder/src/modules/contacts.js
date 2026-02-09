export function getContactDetailFields({ item, formatDate, formatPhone, getContactNotes }) {
  return [
    ["Created", formatDate(item.created_at)],
    ["Name", item.name],
    ["Email", item.email],
    ["Phone", formatPhone(item.phone)],
    ["Type", item.type],
    ["Subscribed", item.subscribed],
    ["Sources", item.sources],
    ["First seen", formatDate(item.first_seen_at)],
    ["Last seen", formatDate(item.last_seen_at)],
    ["Last source", item.last_source],
    ["Unsubscribed at", formatDate(item.unsubscribed_at)],
    ["Unsubscribed reason", item.unsubscribed_reason],
    ["Customer notes", getContactNotes(item)],
    ["Updated", formatDate(item.updated_at)],
  ];
}
