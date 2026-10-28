const API = "http://localhost:3000";

let customers = [];


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    loadCustomers();

});


// =====================================================
// LOAD CUSTOMERS
// =====================================================

async function loadCustomers() {

    try {

        const response =
            await fetch(`${API}/customers`);


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        customers =
            await response.json();


        displayCustomers(customers);

    }

    catch (error) {

        console.error(
            "Error loading customers:",
            error
        );


        const table =
            document.getElementById(
                "customerTable"
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

                        Unable to load customers.

                    </td>

                </tr>

            `;

        }

    }

}


// =====================================================
// DISPLAY CUSTOMERS
// =====================================================

function displayCustomers(data) {

    const table =
        document.getElementById(
            "customerTable"
        );


    if (!table) return;


    table.innerHTML = "";


    // =================================================
    // NO CUSTOMERS
    // =================================================

    if (!data || data.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        padding:25px;
                    "
                >

                    No customers found.

                </td>

            </tr>

        `;

        return;

    }


    // =================================================
    // DISPLAY CUSTOMER ROWS
    // =================================================

    data.forEach((customer, index) => {


        // Display serial number,
        // NOT the MySQL ID.

        const serialNumber =
            index + 1;


        // Pending amount

        const pending =
            Number(customer.pending) || 0;


        table.innerHTML += `

            <tr>


                <!-- SERIAL NUMBER -->

                <td>
                    ${serialNumber}
                </td>


                <!-- CUSTOMER NAME -->

                <td>
                    ${escapeHTML(customer.name)}
                </td>


                <!-- MOBILE -->

                <td>
                    ${escapeHTML(customer.mobile)}
                </td>


                <!-- PENDING -->

                <td>
                    ₹${pending.toFixed(2)}
                </td>


                <!-- ACTIONS -->

                <td>


                    <!-- EDIT -->

                    <button
                        class="action-btn edit-btn"
                        onclick="editCustomer(${customer.id})"
                    >

                        <i class="fa-solid fa-pen"></i>

                        Edit

                    </button>


                    <!-- DELETE -->

                    <button
                        class="action-btn delete-btn"
                        onclick="deleteCustomer(${customer.id})"
                    >

                        <i class="fa-solid fa-trash"></i>

                        Delete

                    </button>


                    <!-- VIEW -->

                    <button
                        class="action-btn"
                        onclick="viewCustomer(${customer.id})"
                    >

                        <i class="fa-solid fa-eye"></i>

                        View

                    </button>


                </td>


            </tr>

        `;

    });

}


// =====================================================
// SEARCH CUSTOMERS
// =====================================================

function searchCustomers() {

    const searchInput =
        document.getElementById("search");


    if (!searchInput) return;


    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    const filtered =
        customers.filter(customer => {


            const name =
                String(customer.name || "")
                    .toLowerCase();


            const mobile =
                String(customer.mobile || "")
                    .toLowerCase();


            return (
                name.includes(keyword) ||
                mobile.includes(keyword)
            );

        });


    displayCustomers(filtered);

}


// =====================================================
// VIEW CUSTOMER
// =====================================================

function viewCustomer(id) {

    // Use the REAL MySQL customer ID

    window.location.href =
        `customer-details.html?id=${id}`;

}


// =====================================================
// EDIT CUSTOMER
// =====================================================

function editCustomer(id) {

    // IMPORTANT:
    // Your actual page uses underscore.

    window.location.href =
        `add_customer.html?id=${id}`;

}


// =====================================================
// DELETE CUSTOMER
// =====================================================

async function deleteCustomer(id) {


    // Find customer

    const customer =
        customers.find(
            item =>
                Number(item.id) === Number(id)
        );


    const customerName =
        customer
            ? customer.name
            : "this customer";


    // Confirmation

    const confirmed =
        confirm(
            `Delete "${customerName}"?`
        );


    if (!confirmed) {

        return;

    }


    try {


        const response =
            await fetch(
                `${API}/customers/${id}`,
                {
                    method: "DELETE"
                }
            );


        let result = {};


        try {

            result =
                await response.json();

        }

        catch {

            result = {};

        }


        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                "Delete failed"
            );

        }


        // Reload customer list

        await loadCustomers();


    }

    catch (error) {

        console.error(
            "Delete customer error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete customer."
        );

    }

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