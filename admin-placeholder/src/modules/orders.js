export function getOrderDetailSections({
  item,
  formatDate,
  formatPhone,
  formatPrice,
  formatDelayWeeks,
  formatGrams,
  formatSignedGrams,
  buildMetalWeightLabel,
  buildMetalWeightAdjustmentLabel,
  buildSizingRows,
  renderQuoteMediaSlot,
}) {
  return [
    {
      title: "Request",
      rows: [
        ["Request ID", item.request_id],
        ["Created", formatDate(item.created_at)],
        ["Status", item.status],
      ],
    },
    {
      title: "Client",
      rows: [
        ["Name", item.name],
        ["Email", item.email],
        ["Phone", formatPhone(item.phone)],
      ],
    },
    {
      title: "Piece",
      rows: [
        ["Product", item.product_name],
        ["Images", renderQuoteMediaSlot()],
        ["Design code", item.design_code],
        ["Metal", item.metal],
        [buildMetalWeightLabel(item.metal), formatGrams(item.metal_weight)],
        [buildMetalWeightAdjustmentLabel(item.metal), formatSignedGrams(item.metal_weight_adjustment)],
        ["Stone", item.stone],
        ["Stone weight", item.stone_weight],
        ["Diamond breakdown", item.diamond_breakdown],
        ...buildSizingRows(item),
      ],
    },
    {
      title: "Timeline & Pricing",
      rows: [
        ["Price", formatPrice(item.price)],
        ["Timeline", item.timeline],
        ["Timeline delay", formatDelayWeeks(item.timeline_adjustment_weeks)],
      ],
    },
    {
      title: "Address",
      rows: [
        ["Address", item.address_line1],
        ["City", item.city],
        ["State", item.state],
        ["Postal code", item.postal_code],
        ["Country", item.country],
      ],
    },
    {
      title: "Preferences",
      rows: [
        ["Interests", item.interests],
        ["Contact preference", item.contact_preference],
        ["Subscription", item.subscription_status],
      ],
    },
  ];
}
