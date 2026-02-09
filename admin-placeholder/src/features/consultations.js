export function createConsultations({ ui, apiFetch, showToast }) {
  const getDays = () => {
    if (!ui.consultationsRange) return "30";
    return ui.consultationsRange.value || "30";
  };

  const setStat = (node, value) => {
    if (!node) return;
    node.textContent = value ?? "--";
  };

  const renderSourceTable = (rows) => {
    if (!ui.consultationsSource) return;
    ui.consultationsSource.innerHTML = rows
      .map((row) => {
        const total = row.total || 0;
        const becameQuotes = row.became_quotes || 0;
        const conversionRate = total ? ((becameQuotes / total) * 100).toFixed(1) : "0.0";
        return `
          <tr>
            <td>${row.source || "Unknown"}</td>
            <td>${total}</td>
            <td>${row.completed || 0}</td>
            <td>${becameQuotes}</td>
            <td>${row.became_orders || 0}</td>
            <td>${conversionRate}%</td>
          </tr>
        `;
      })
      .join("");
  };

  const renderCampaignTable = (rows) => {
    if (!ui.consultationsCampaign) return;
    ui.consultationsCampaign.innerHTML = rows
      .map((row) => {
        const bookings = row.bookings || 0;
        const conversions = row.conversions || 0;
        const conversionRate = bookings ? ((conversions / bookings) * 100).toFixed(1) : "0.0";
        return `
          <tr>
            <td>${row.utm_campaign || "N/A"}</td>
            <td>${row.utm_source || "N/A"}</td>
            <td>${row.utm_medium || "N/A"}</td>
            <td>${bookings}</td>
            <td>${conversions}</td>
            <td>${conversionRate}%</td>
          </tr>
        `;
      })
      .join("");
  };

  const renderHearTable = (rows) => {
    if (!ui.consultationsHear) return;
    ui.consultationsHear.innerHTML = rows
      .map((row) => {
        return `
          <tr>
            <td>${row.how_heard_about_us || "Not specified"}</td>
            <td>${row.count || 0}</td>
          </tr>
        `;
      })
      .join("");
  };

  const loadConsultations = async () => {
    const days = getDays();
    try {
      const result = await apiFetch(`/consultations/analytics?days=${days}`);
      const data = result?.data || result;
      if (!data) {
        throw new Error("Missing analytics data");
      }
      const sourceStats = data.sourceStats || [];
      const campaignStats = data.campaignStats || [];
      const hearAboutStats = data.hearAboutStats || [];

      let total = 0;
      let completed = 0;
      let becameQuotes = 0;
      let becameOrders = 0;
      sourceStats.forEach((row) => {
        total += row.total || 0;
        completed += row.completed || 0;
        becameQuotes += row.became_quotes || 0;
        becameOrders += row.became_orders || 0;
      });

      setStat(ui.consultationsTotal, total);
      setStat(ui.consultationsCompleted, completed);
      setStat(ui.consultationsQuotes, becameQuotes);
      setStat(ui.consultationsOrders, becameOrders);

      renderSourceTable(sourceStats);
      renderCampaignTable(campaignStats);
      renderHearTable(hearAboutStats);
    } catch (error) {
      showToast("Failed to load consultations analytics.", "error");
    }
  };

  const bindConsultations = () => {
    if (ui.consultationsRefresh) {
      ui.consultationsRefresh.addEventListener("click", loadConsultations);
    }
    if (ui.consultationsRange) {
      ui.consultationsRange.addEventListener("change", loadConsultations);
    }
  };

  return { bindConsultations, loadConsultations };
}
