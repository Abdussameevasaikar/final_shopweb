const API = "http://localhost:3000";

// =====================================================
// GET CUSTOMER ID FROM URL
// Example:
// customer-details.html?id=1
// =====================================================

const params = new URLSearchParams(window.location.search);

const customerId = params.get("id");


// =====================================================
// GLOBAL DATA
// =====================================================

let customer = null;
let transactions = [];


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    // Check customer ID

    if (
        !customerId ||
        isNaN(Number(customerId))
    ) {

        alert("❌ Invalid customer ID.");

        window.location.href = "customer.html";

        return;
    }


    loadCustomerDetails();

});


// =====================================================
// LOAD CUSTOMER DETAILS
// =====================================================

async function loadCustomerDetails() {

    try {

        // -------------------------------------------------
        // Load all customers
        // -------------------------------------------------

        const customerResponse =
            await fetch(`${API}/customers`);


        if (!customerResponse.ok) {

            throw new Error(
                "Unable to load customers."
            );

        }


        const customers =
            await customerResponse.json();


        // Find selected customer

        customer =
            customers.find(
                item =>
                    Number(item.id) ===
                    Number(customerId)
            );


        if (!customer) {

            alert("❌ Customer not found.");

            window.location.href =
                "customer.html";

            return;
        }


        // -------------------------------------------------
        // Display customer information
        // -------------------------------------------------

        document.getElementById(
            "customerName"
        ).textContent =
            customer.name || "Unknown Customer";


        document.getElementById(
            "customerMobile"
        ).textContent =
            customer.mobile || "No mobile number";


        // -------------------------------------------------
        // Load transactions
        // -------------------------------------------------

        await loadTransactions();

    }

    catch (error) {

        console.error(
            "Customer details error:",
            error
        );


        alert(
            "❌ Unable to load customer details.\n\n" +
            "Make sure your Node.js backend is running."
        );

    }

}


// =====================================================
// LOAD TRANSACTIONS
// =====================================================

async function loadTransactions() {

    try {

        const response =
            await fetch(
                `${API}/customers/${customerId}/transactions`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load transactions."
            );

        }


        transactions =
            await response.json();


        // Make sure we always have an array

        if (!Array.isArray(transactions)) {

            transactions = [];

        }


        calculateSummary();

        displayTransactions();

    }

    catch (error) {

        console.error(
            "Transaction loading error:",
            error
        );


        transactions = [];

        calculateSummary();

        const table =
            document.getElementById(
                "transactionTable"
            );


        if (table) {

            table.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        style="
                            text-align:center;
                            padding:20px;
                        "
                    >

                        Unable to load transactions.

                    </td>

                </tr>

            `;

        }

    }

}


// =====================================================
// CALCULATE CREDIT / PAID / PENDING
// =====================================================

function calculateSummary() {

    let totalCredit = 0;

    let totalPaid = 0;


    transactions.forEach(transaction => {

        const amount =
            Number(transaction.amount) || 0;


        const type =
            String(
                transaction.type || ""
            ).toLowerCase();


        // Credit transaction

        if (
            type === "credit" ||
            type === "sale"
        ) {

            totalCredit += amount;

        }


        // Payment transaction

        else if (
            type === "payment"
        ) {

            totalPaid += amount;

        }

    });


    // Pending = Credit - Paid

    const pending =
        Math.max(
            0,
            totalCredit - totalPaid
        );


    // Display amounts

    document.getElementById(
        "totalCredit"
    ).textContent =
        formatCurrency(totalCredit);


    document.getElementById(
        "totalPaid"
    ).textContent =
        formatCurrency(totalPaid);


    document.getElementById(
        "pendingAmount"
    ).textContent =
        formatCurrency(pending);

}


// =====================================================
// DISPLAY TRANSACTIONS
// =====================================================

function displayTransactions() {

    const table =
        document.getElementById(
            "transactionTable"
        );


    if (!table) return;


    table.innerHTML = "";


    // No transactions

    if (
        !transactions ||
        transactions.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        padding:25px;
                    "
                >

                    No transactions yet.

                </td>

            </tr>

        `;

        return;

    }


    transactions.forEach(
        (transaction, index) => {


            const amount =
                Number(
                    transaction.amount
                ) || 0;


            const type =
                String(
                    transaction.type || ""
                ).toLowerCase();


            // -------------------------------------------------
            // TYPE DISPLAY
            // -------------------------------------------------

            let typeText;

            let typeClass;


            if (
                type === "payment"
            ) {

                typeText = "Payment";

                typeClass = "paid-amount";

            }

            else {

                typeText = "Credit";

                typeClass = "credit-amount";

            }


            // -------------------------------------------------
            // DATE
            // -------------------------------------------------

            const date =
                formatDate(
                    transaction.date
                );


            // -------------------------------------------------
            // BILL NUMBER
            // -------------------------------------------------

            const billNumber =
                transaction.bill_no ||
                transaction.billNo ||
                "-";


            // -------------------------------------------------
            // ROW
            // -------------------------------------------------

            table.innerHTML += `

                <tr>


                    <td>
                        ${index + 1}
                    </td>


                    <td>
                        ${date}
                    </td>


                    <td>

                        <span
                            class="${typeClass}"
                            style="font-weight:600;"
                        >

                            ${typeText}

                        </span>

                    </td>


                    <td>

                        ₹${amount.toFixed(2)}

                    </td>


                    <td>

                        ${escapeHTML(billNumber)}

                    </td>


                </tr>

            `;

        }
    );

}


// =====================================================
// OPEN PAYMENT MODAL
// =====================================================

function openPaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );


    const input =
        document.getElementById(
            "paymentAmount"
        );


    if (!modal) return;


    modal.style.display = "flex";


    if (input) {

        input.value = "";

        input.focus();

    }

}


// =====================================================
// CLOSE PAYMENT MODAL
// =====================================================

function closePaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (modal) {

        modal.style.display = "none";

    }

}


// =====================================================
// RECORD PAYMENT
// =====================================================

async function recordPayment() {

    const input =
        document.getElementById(
            "paymentAmount"
        );


    if (!input) return;


    const amount =
        Number(input.value);


    // -------------------------------------------------
    // Validate amount
    // -------------------------------------------------

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        alert(
            "Please enter a valid payment amount."
        );

        input.focus();

        return;

    }


    // -------------------------------------------------
    // Calculate current pending
    // -------------------------------------------------

    let totalCredit = 0;

    let totalPaid = 0;


    transactions.forEach(transaction => {

        const transactionAmount =
            Number(transaction.amount) || 0;


        const type =
            String(
                transaction.type || ""
            ).toLowerCase();


        if (
            type === "credit" ||
            type === "sale"
        ) {

            totalCredit +=
                transactionAmount;

        }

        else if (
            type === "payment"
        ) {

            totalPaid +=
                transactionAmount;

        }

    });


    const pending =
        Math.max(
            0,
            totalCredit - totalPaid
        );


    // -------------------------------------------------
    // Don't allow payment above pending
    // -------------------------------------------------

    if (pending <= 0) {

        alert(
            "This customer has no pending amount."
        );

        return;

    }


    if (amount > pending) {

        alert(
            `Payment cannot be more than the pending amount of ${formatCurrency(pending)}.`
        );

        input.focus();

        return;

    }


    // -------------------------------------------------
    // Confirmation
    // -------------------------------------------------

    const confirmed =
        confirm(
            `Record payment of ${formatCurrency(amount)} for ${customer.name}?`
        );


    if (!confirmed) {

        return;

    }


    // -------------------------------------------------
    // Send payment to backend
    // -------------------------------------------------

    try {

        const response =
            await fetch(
                `${API}/customers/${customerId}/payment`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        amount: amount

                    })

                }
            );


        // Read response

        let result = {};


        try {

            result =
                await response.json();

        }

        catch {

            result = {};

        }


        // -------------------------------------------------
        // Backend error
        // -------------------------------------------------

        if (!response.ok) {

            console.error(
                "Payment error:",
                result
            );


            alert(
                result.error ||
                result.message ||
                "Failed to record payment."
            );

            return;

        }


        // -------------------------------------------------
        // Success
        // -------------------------------------------------

        alert(
            "✅ Payment recorded successfully!"
        );


        closePaymentModal();


        // Reload transactions

        await loadTransactions();

    }

    catch (error) {

        console.error(
            "Record payment error:",
            error
        );


        alert(
            "❌ Unable to connect to the server.\n\n" +
            "Make sure your Node.js backend is running on port 3000."
        );

    }

}


// =====================================================
// FORMAT CURRENCY
// =====================================================

function formatCurrency(amount) {

    return `₹${Number(amount).toFixed(2)}`;

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {

        return String(value);

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}