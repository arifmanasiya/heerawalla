export function getTicketDetailFields({ item, formatDate, formatPhone }) {
  return [
    ["Request ID", item.request_id],
    ["Created", formatDate(item.created_at)],
    ["Status", item.status],
    ["Name", item.name],
    ["Email", item.email],
    ["Phone", formatPhone(item.phone)],
    ["Interests", item.interests],
    ["Contact preference", item.contact_preference],
    ["Customer notes", item.notes],
  ];
}
