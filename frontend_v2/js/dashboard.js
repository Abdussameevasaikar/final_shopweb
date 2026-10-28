const API = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", loadDashboard);

async function loadDashboard() {

    try {

        // Load items and customers at the same time
        const [itemsRes, customersRes] = await Promise.all([
            fetch(`${API}/items`),
            fetch(`${API}/customers`)
        ]);

        if (!itemsRes.ok) {
            throw new Error("Unable to load items.");
        }

        if (!customersRes.ok) {
            throw new Error("Unable to load customers.");
        }

        const items = await itemsRes.json();
        const customers = await customersRes.json();

        console.log("Dashboard Items:", items);
        console.log("Dashboard Customers:", customers);

        // Update dashboard cards
        updateCards(items, customers);

        // Show recent activity
        showRecentActivity(items);

    } catch (err) {

        console.error("Dashboard error:", err);
        alert("Unable to connect to server.");

    }

}


function updateCards(items, customers) {

    console.log("updateCards called", items, customers);

    // -----------------------------
    // TOTAL PRODUCTS
    // -----------------------------

    const totalProducts = items.length;

    // -----------------------------
    // TOTAL STOCK
    // -----------------------------

    let totalStock = 0;

    // -----------------------------
    // STOCK VALUE
    // -----------------------------

    let stockValue = 0;

    items.forEach(item => {

        totalStock += Number(item.quantity);

        stockValue +=
            Number(item.quantity) *
            Number(item.price);

    });


    // -----------------------------
    // UPDATE PRODUCT CARD
    // -----------------------------

    document.getElementById("totalItems").textContent =
        totalProducts;


    // -----------------------------
    // UPDATE STOCK CARD
    // -----------------------------

    document.getElementById("totalStock").textContent =
        totalStock;


    // -----------------------------
    // UPDATE STOCK VALUE CARD
    // -----------------------------

    document.getElementById("stockValue").textContent =
        "₹" + stockValue.toFixed(2);


    // -----------------------------
    // UPDATE CUSTOMER CARD
    // -----------------------------

    document.getElementById("totalCustomers").textContent =
        customers.length;

}


function showRecentActivity(items) {

    const table =
        document.getElementById("activityTable");

    table.innerHTML = "";


    if (!items.length) {

        table.innerHTML = `

            <tr>

                <td>No products available.</td>

            </tr>

        `;

        return;

    }


    const latest =
        items.slice(-5).reverse();


    latest.forEach(item => {

        table.innerHTML += `

            <tr>

                <td>

                    📦 <strong>${item.name}</strong>

                    <br>

                    Category:
                    ${item.category}

                    <br>

                    Quantity:
                    ${item.quantity}

                </td>

            </tr>

        `;

    });

}