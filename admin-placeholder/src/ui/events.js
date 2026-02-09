export function createEventBindings({
  state,
  ui,
  setTab,
  loadCurrentView,
  setAutoRefresh,
  updateSyncLine,
  clearSelection,
  handleBulkAction,
  exportData,
  updateBulkActions,
  renderList,
  getItemKey,
  canEditCurrentTab,
  getActionEndpoint,
  showToast,
  apiFetch,
  buildDeletePayload,
  detailUrl,
  populateDrawer,
  openDrawer,
  bindDrawerEvents,
  runAction,
  triggerSiteRebuild,
  applyDiscountControlState,
  applyGoldOnlyQuoteState,
  setQuoteMetalSelection,
  syncQuoteMetalInput,
  updatePrimaryActionState,
  scheduleQuotePricingUpdate,
  getDiamondRowsFromDom,
  renderDiamondBreakdownRows,
  syncDiamondBreakdownField,
  setDiamondBreakdownRowsFromField,
  getDiamondBreakdownField,
  syncSizingToSizeField,
  prepareConfirmation,
  saveDetails,
  saveNotes,
  saveOrderDetails,
  saveStatus,
  closeConfirmModal,
  sendConfirmation,
  quotePriceFields,
  quotePricingFields,
}) {
  const bindEvents = () => {
    ui.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setTab(tab.dataset.tab);
      });
    });

    ui.filters.forEach((input) => {
      input.addEventListener("change", () => {
        if (input.dataset.filter === "limit") {
          state.limit = Number(input.value) || state.limit;
        } else {
          state.filters[input.dataset.filter] = input.value.trim();
        }
        state.offset = 0;
        loadCurrentView();
      });
      if (input.tagName === "INPUT") {
        input.addEventListener("input", () => {
          if (input.dataset.filter !== "limit") {
            state.filters[input.dataset.filter] = input.value.trim();
          }
          state.offset = 0;
          loadCurrentView();
        });
      }
    });

    ui.prev.addEventListener("click", () => {
      state.offset = Math.max(state.offset - state.limit, 0);
      loadCurrentView();
    });
    ui.next.addEventListener("click", () => {
      if (state.offset + state.limit >= state.total) return;
      state.offset += state.limit;
      loadCurrentView();
    });

    ui.refresh.addEventListener("click", () => {
      if (ui.autoRefresh?.checked) return;
      loadCurrentView();
    });

    if (ui.bulkActions) {
      ui.bulkActions.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.dataset.bulkClear !== undefined) {
          clearSelection();
          return;
        }
        const bulkAction = target.dataset.bulkAction;
        if (bulkAction) handleBulkAction(bulkAction);
      });
    }

    if (ui.exportButtons.length) {
      ui.exportButtons.forEach((button) => {
        button.addEventListener("click", () => {
          exportData(button.dataset.export || "csv");
        });
      });
    }

    if (ui.autoRefresh) {
      ui.autoRefresh.addEventListener("change", () => {
        setAutoRefresh(ui.autoRefresh.checked);
        updateSyncLine();
      });
    }

    if (ui.triggerDeploy) {
      ui.triggerDeploy.addEventListener("click", triggerSiteRebuild);
    }

    ui.list.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest(".inline-input")) {
        return;
      }
      const inlineEdit = target.dataset.inlineEdit;
      if (inlineEdit) {
        const row = target.closest(".list-row");
        if (!row) return;
        if (!canEditCurrentTab()) return;
        const inputs = Array.from(row.querySelectorAll(".inline-input"));
        const displays = Array.from(row.querySelectorAll("[data-inline-display]"));
        const isEditing = row.classList.contains("is-editing");
        const endpoint = getActionEndpoint();
        if (!endpoint) return;
        if (!isEditing) {
          row.classList.add("is-editing");
          inputs.forEach((input) => input.classList.remove("is-hidden"));
          displays.forEach((display) => display.classList.add("is-hidden"));
          const first = inputs[0];
          if (first) {
            first.focus();
            first.select();
          }
          return;
        }
        const rowNumber =
          row.dataset.row ||
          row.querySelector(".inline-input")?.dataset.rowNumber ||
          "";
        if (!rowNumber) return;
        const fields = {};
        inputs.forEach((input) => {
          const key = input.dataset.inlineField || "";
          if (!key) return;
          fields[key] = input.value;
        });
        apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify({
            action: "edit",
            rowNumber,
            fields,
          }),
        })
          .then((result) => {
            if (result.ok) {
              const item = state.items.find(
                (entry) => String(entry.row_number) === String(rowNumber)
              );
              if (item) {
                Object.keys(fields).forEach((key) => {
                  item[key] = fields[key];
                });
              }
              inputs.forEach((input) => {
                const display = input
                  .closest(".cell")
                  ?.querySelector("[data-inline-display]");
                if (display) display.textContent = input.value;
              });
              showToast("Saved");
              row.classList.remove("is-editing");
              inputs.forEach((input) => input.classList.add("is-hidden"));
              displays.forEach((display) => display.classList.remove("is-hidden"));
              return;
            }
            showToast("Update failed", "error");
          })
          .catch(() => {
            showToast("Update failed", "error");
          });
        return;
      }
      if (target instanceof HTMLInputElement && target.hasAttribute("data-bulk-select-all")) {
        const allIds = state.items.map((item) => getItemKey(item)).filter(Boolean);
        if (target.checked) {
          state.selectedItems = allIds;
        } else {
          state.selectedItems = [];
        }
        updateBulkActions();
        renderList();
        return;
      }
      if (target instanceof HTMLInputElement && target.dataset.bulkSelectItem !== undefined) {
        const id = target.dataset.bulkSelectItem;
        if (!id) return;
        if (target.checked) {
          if (!state.selectedItems.includes(id)) state.selectedItems.push(id);
        } else {
          state.selectedItems = state.selectedItems.filter((item) => item !== id);
        }
        updateBulkActions();
        renderList();
        return;
      }
      const deleteId = target.dataset.delete;
      if (deleteId) {
        if (!canEditCurrentTab()) return;
        if (!window.confirm("Delete this record? This cannot be undone.")) return;
        const endpoint = getActionEndpoint();
        if (!endpoint) {
          showToast("No actions available.", "error");
          return;
        }
        apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(buildDeletePayload(state.tab, deleteId)),
        })
          .then((result) => {
            if (result.ok) {
              showToast("Record deleted");
              loadCurrentView();
              return;
            }
            showToast("Delete failed", "error");
          })
          .catch(() => {
            showToast("Delete failed", "error");
          });
        return;
      }
      const viewId = target.dataset.view;
      if (viewId) {
        window.location.href = detailUrl(viewId);
        return;
      }
      const row = target.closest(".list-row");
      if (row) {
        if (
          state.tab === "cost-chart" ||
          state.tab === "diamond-price-chart"
        ) {
          return;
        }
        const rowId = row.dataset.row || row.dataset.slug || row.dataset.id || "";
        if (rowId) {
          window.location.href = detailUrl(rowId);
        } else {
          showToast("Missing record ID for detail view.", "error");
        }
      }
    });

    ui.list.addEventListener("keydown", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!target.classList.contains("inline-input")) return;
      if (event.key === "Enter") {
        event.preventDefault();
        const row = target.closest(".list-row");
        const editButton = row?.querySelector("[data-inline-edit]");
        if (editButton instanceof HTMLElement) {
          editButton.click();
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        const display = target.closest(".cell")?.querySelector("[data-inline-display]");
        if (display) {
          target.value = display.textContent || "";
          display.classList.remove("is-hidden");
        }
        target.classList.add("is-hidden");
      }
    });

    if (ui.addRowButton) {
      ui.addRowButton.addEventListener("click", () => {
        window.location.href = detailUrl("new");
      });
    }

    bindDrawerEvents();

    ui.actionButtons.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.dataset.action;
      const confirmText = target.dataset.confirm;
      if (!action) return;
      if (confirmText && !window.confirm(confirmText)) return;
      runAction(action);
    });

    ui.editFields.forEach((field) => {
      const handler = () => {
        const key = field.dataset.field || "";
        if (key === "metal") {
          updatePrimaryActionState();
          setQuoteMetalSelection(ui.quoteMetalInput ? ui.quoteMetalInput.value : "", field.value);
        }
        if (key === "quote_discount_type") {
          applyDiscountControlState();
        }
        if (key === "stone_weight" || key === "diamond_breakdown") {
          applyGoldOnlyQuoteState();
        }
        if (state.tab === "quotes" && key) {
          if (quotePriceFields.has(key)) {
            if (field.value) {
              field.dataset.auto = "false";
              field.dataset.manual = "true";
            } else {
              field.dataset.manual = "";
              field.dataset.auto = "true";
              scheduleQuotePricingUpdate();
            }
          } else if (quotePricingFields.has(key)) {
            scheduleQuotePricingUpdate();
          }
        }
        updatePrimaryActionState();
      };
      field.addEventListener("input", handler);
      field.addEventListener("change", handler);
    });

    ui.quoteMetals.forEach((input) => {
      input.addEventListener("change", () => {
        syncQuoteMetalInput();
        updatePrimaryActionState();
      });
    });

    if (ui.diamondBreakdownAdd) {
      ui.diamondBreakdownAdd.addEventListener("click", () => {
        const current = getDiamondRowsFromDom();
        current.push({ weight: "", count: "" });
        renderDiamondBreakdownRows(current);
        scheduleQuotePricingUpdate();
      });
    }

    if (ui.diamondBreakdownRows) {
      ui.diamondBreakdownRows.addEventListener("input", (event) => {
        if (!(event.target instanceof HTMLInputElement)) return;
        if (
          !event.target.hasAttribute("data-diamond-weight") &&
          !event.target.hasAttribute("data-diamond-count")
        ) {
          return;
        }
        syncDiamondBreakdownField();
        updatePrimaryActionState();
        scheduleQuotePricingUpdate();
      });
      ui.diamondBreakdownRows.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.hasAttribute("data-diamond-remove")) return;
        const row = target.closest("[data-diamond-row]");
        if (row) row.remove();
        syncDiamondBreakdownField();
        updatePrimaryActionState();
        scheduleQuotePricingUpdate();
        if (!ui.diamondBreakdownRows.querySelector("[data-diamond-row]")) {
          renderDiamondBreakdownRows([]);
        }
      });
    }

    const diamondField = getDiamondBreakdownField();
    if (diamondField) {
      diamondField.addEventListener("input", () => {
        setDiamondBreakdownRowsFromField();
        updatePrimaryActionState();
        scheduleQuotePricingUpdate();
      });
    }

    [ui.sizeRing, ui.sizeBracelet, ui.sizeChain].forEach((input) => {
      if (!input) return;
      ["input", "change"].forEach((eventName) => {
        input.addEventListener(eventName, () => {
          syncSizingToSizeField();
          scheduleQuotePricingUpdate();
          updatePrimaryActionState();
        });
      });
    });

    if (ui.primaryAction) {
      ui.primaryAction.addEventListener("click", () => {
        if (state.tab !== "orders") {
          if (window.confirm("Save updates to this record?")) saveDetails();
          return;
        }
        prepareConfirmation();
      });
    }

    if (ui.notesSave) {
      ui.notesSave.addEventListener("click", () => {
        if (window.confirm("Save internal notes?")) saveNotes();
      });
    }

    if (ui.detailsSave) {
      ui.detailsSave.addEventListener("click", () => {
        if (window.confirm("Save fulfillment details?")) saveOrderDetails();
      });
    }

    ui.statusSave.addEventListener("click", () => {
      if (window.confirm("Update status for this record?")) saveStatus();
    });

    if (ui.confirmClose) {
      ui.confirmClose.addEventListener("click", closeConfirmModal);
    }

    if (ui.confirmModal) {
      ui.confirmModal.addEventListener("click", (event) => {
        if (event.target === ui.confirmModal) closeConfirmModal();
      });
    }

    if (ui.confirmSend) {
      ui.confirmSend.addEventListener("click", () => {
        if (window.confirm("Send confirmation to customer?")) sendConfirmation();
      });
    }
  };

  return { bindEvents };
}
