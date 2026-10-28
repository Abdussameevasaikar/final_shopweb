
"use strict";

const API_BASE = "";

const tableBody = document.getElementById("historyTableBody");
const statusElement = document.getElementById("historyStatus");
const searchInput = document.getElementById("historySearch");
const paymentSelect = document.getElementById("historyPayment");
const fromInput = document.getElementById("historyFrom");
const toInput = document.getElementById("historyTo");
const modal = document.getElementById("historyModal");
const modalDetails = document.getElementById("historyBillDetails");

let allSales = [];
let allSaleItems = [];

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function money(value) {
    return Number(value || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    });
}

function customerName(sale) {
    const name = String(sale.customer_name || "").trim();
    return name || "Walk-in Customer";
}

function paymentName(method) {
    const normalized = String(method || "cash").toLowerCase().trim();

    if (normalized === "upi") return "UPI";
    if (normalized === "credit") return "Credit / Khata";
    if (normalized === "cash") return "Cash";

    return normalized ? normalized.toUpperCase() : "Unknown";
}

function validDateForFilter(value) {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
    const date = validDateForFilter(value);

    if (!date) return "Date unavailable";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

async function fetchJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        let message = `Request failed (${response.status})`;

        try {
            const body = await response.json();
            message = body.error || body.message || message;
        } catch (_) {
            // Keep the default error message.
        }

        throw new Error(message);
    }

    return response.json();
}

async function loadHistory() {
    statusElement.textContent = "Loading sales history...";
    statusElement.classList.remove("history-error");

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="table-message">
                Loading sales...
            </td>
        </tr>
    `;

    try {
        const results = await Promise.all([
            fetchJSON(`${API_BASE}/sales`),
            fetchJSON(`${API_BASE}/sales/items`)
        ]);

        if (!Array.isArray(results[0]) || !Array.isArray(results[1])) {
            throw new Error("The server returned an unexpected sales response.");
        }

        allSales = results[0];
        allSaleItems = results[1];

        renderHistory();
    } catch (error) {
        console.error("Sales history loading failed:", error);

        allSales = [];
        allSaleItems = [];

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-message">
                    Unable to load sales history.
                </td>
            </tr>
        `;

        statusElement.textContent =
            `Error: ${error.message}. Check that the backend is running.`;

        statusElement.classList.add("history-error");
    }
}

function getFilteredSales() {
    const search = searchInput.value.trim().toLowerCase();
    const payment = paymentSelect.value;
    const fromDate = fromInput.value;
    const toDate = toInput.value;

    return allSales.filter(sale => {
        const invoice = String(sale.invoice_no || "").toLowerCase();
        const customer = customerName(sale).toLowerCase();
        const method = String(sale.payment_method || "cash").toLowerCase();
        const date = validDateForFilter(sale.date);

        if (
            search &&
            !invoice.includes(search) &&
            !customer.includes(search)
        ) {
            return false;
        }

        if (payment !== "all" && method !== payment) {
            return false;
        }

        if (!date && (fromDate || toDate)) {
            return false;
        }

        if (date && fromDate) {
            const start = new Date(`${fromDate}T00:00:00`);

            if (date < start) return false;
        }

        if (date && toDate) {
            const end = new Date(`${toDate}T23:59:59.999`);

            if (date > end) return false;
        }

        return true;
    });
}

function paymentDetail(method) {
    if (method === "credit") {
        return "Recorded as customer credit";
    }

    if (method === "upi") {
        return "Paid via UPI";
    }

    if (method === "cash") {
        return "Paid in cash";
    }

    return "Recorded payment method";
}

function renderHistory() {
    const sales = getFilteredSales();

    sales.sort((a, b) => {
        const dateA = validDateForFilter(a.date)?.getTime() || 0;
        const dateB = validDateForFilter(b.date)?.getTime() || 0;

        return dateB - dateA || Number(b.id || 0) - Number(a.id || 0);
    });

    if (!sales.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-message">
                    No sales match your search or filters.
                </td>
            </tr>
        `;

        statusElement.textContent =
            `Showing 0 of ${allSales.length} bills.`;

        return;
    }

    tableBody.innerHTML = sales.map(sale => {
        const method = String(sale.payment_method || "cash").toLowerCase();
        const badgeClass = ["cash", "upi", "credit"].includes(method)
            ? `payment-${method}`
            : "";

        const invoice = sale.invoice_no || `Sale #${sale.id}`;

        return `
            <tr>
                <td>
                    <button
                        type="button"
                        class="history-action"
                        data-sale-id="${escapeHTML(sale.id)}"
                    >
                        ${escapeHTML(invoice)}
                    </button>
                </td>

                <td>${escapeHTML(formatDate(sale.date))}</td>

                <td>${escapeHTML(customerName(sale))}</td>

                <td>
                    <span class="payment-badge ${badgeClass}">
                        ${escapeHTML(paymentName(method))}
                    </span>
                </td>

                <td>${escapeHTML(money(sale.total))}</td>

                <td>
                    <div class="payment-detail">
                        ${escapeHTML(paymentDetail(method))}
                    </div>

                    <button
                        type="button"
                        class="history-action"
                        data-sale-id="${escapeHTML(sale.id)}"
                    >
                        View bill
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    statusElement.textContent =
        `Showing ${sales.length} of ${allSales.length} bills.`;
}

function showBillDetails(saleId) {
    const sale = allSales.find(
        item => String(item.id) === String(saleId)
    );

    if (!sale) {
        modalDetails.textContent = "The selected bill could not be found.";
        modal.style.display = "block";
        return;
    }

    const items = allSaleItems.filter(
        item => String(item.sale_id) === String(sale.id)
    );

    const method = String(sale.payment_method || "cash").toLowerCase();

    const itemRows = items.length
        ? items.map(item => {
            const quantity = Number(item.quantity || 0);
            const price = Number(item.price || 0);

            return `
                <tr>
                    <td>
                        ${escapeHTML(
                            item.product_name || `Product #${item.item_id}`
                        )}
                    </td>
                    <td>${escapeHTML(quantity)}</td>
                    <td>${escapeHTML(money(price))}</td>
                    <td>${escapeHTML(money(quantity * price))}</td>
                </tr>
            `;
        }).join("")
        : `
            <tr>
                <td colspan="4" class="table-message">
                    No product details found for this bill.
                </td>
            </tr>
        `;

    const invoice = sale.invoice_no || `Sale #${sale.id}`;

    modalDetails.innerHTML = `
        <div class="history-detail-grid">
            <div class="history-detail-card">
                <small>Invoice number</small>
                <strong>${escapeHTML(invoice)}</strong>
            </div>

            <div class="history-detail-card">
                <small>Date &amp; time</small>
                <strong>${escapeHTML(formatDate(sale.date))}</strong>
            </div>

            <div class="history-detail-card">
                <small>Customer</small>
                <strong>${escapeHTML(customerName(sale))}</strong>
            </div>

            <div class="history-detail-card">
                <small>Payment method</small>
                <strong>${escapeHTML(paymentName(method))}</strong>
            </div>

            <div class="history-detail-card">
                <small>Payment detail</small>
                <strong>${escapeHTML(paymentDetail(method))}</strong>
            </div>

            <div class="history-detail-card">
                <small>Bill total</small>
                <strong>${escapeHTML(money(sale.total))}</strong>
            </div>
        </div>

        <h3>Products in this bill</h3>

        <div class="table-scroll">
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Line Total</th>
                    </tr>
                </thead>

                <tbody>
                    ${itemRows}
                </tbody>
            </table>
        </div>

        <h3 class="history-total">
            Total: ${escapeHTML(money(sale.total))}
        </h3>
    `;

    document.getElementById("historyModalTitle").textContent =
        `Bill Details — ${invoice}`;

    modal.style.display = "block";
}

function closeHistoryModal() {
    modal.style.display = "none";
}

/* Open the selected bill */
tableBody.addEventListener("click", event => {
    const button = event.target.closest("[data-sale-id]");

    if (button) {
        showBillDetails(button.dataset.saleId);
    }
});

/* Close modal */
document.getElementById("historyClose").addEventListener(
    "click",
    closeHistoryModal
);

modal.addEventListener("click", event => {
    if (event.target === modal) {
        closeHistoryModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeHistoryModal();
    }
});

/* Live filters */
[searchInput, paymentSelect, fromInput, toInput].forEach(element => {
    element.addEventListener("input", renderHistory);
    element.addEventListener("change", renderHistory);
});

/* Reset filters */
document.getElementById("historyReset").addEventListener("click", () => {
    searchInput.value = "";
    paymentSelect.value = "all";
    fromInput.value = "";
    toInput.value = "";

    renderHistory();
});

/* Reload sales from the backend */
document.getElementById("historyRefresh").addEventListener(
    "click",
    loadHistory
);

/* Initial load */
loadHistory();
