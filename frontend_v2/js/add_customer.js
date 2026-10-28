const API = "http://localhost:3000";

// =====================================================
// CHECK WHETHER THIS PAGE IS ADD OR EDIT
// =====================================================

const params = new URLSearchParams(window.location.search);

const customerId = params.get("id");

const isEditMode =
    customerId !== null &&
    customerId !== "" &&
    !isNaN(Number(customerId));


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById("customerForm");


    if (form) {

        form.addEventListener(
            "submit",
            saveCustomer
        );

    }


    // If an ID exists, load customer
    if (isEditMode) {

        loadCustomer();

    }

});


// =====================================================
// LOAD CUSTOMER FOR EDITING
// =====================================================

async function loadCustomer() {

    try {

        const response =
            await fetch(`${API}/customers`);


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const customers =
            await response.json();


        const customer =
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


        // Fill existing customer data

        document.getElementById("name").value =
            customer.name || "";


        document.getElementById("mobile").value =
            customer.mobile || "";


        // Change page heading

        const heading =
            document.querySelector(".header h1");


        if (heading) {

            heading.innerHTML = `
                <i class="fa-solid fa-user-pen"></i>
                Edit Customer
            `;

        }


        // Change submit button

        const submitButton =
            document.querySelector(
                '#customerForm button[type="submit"]'
            );


        if (submitButton) {

            submitButton.innerHTML = `
                <i class="fa-solid fa-save"></i>
                Update Customer
            `;

        }

    }

    catch (error) {

        console.error(
            "Error loading customer:",
            error
        );


        alert(
            "❌ Unable to load customer.\n\n" +
            "Make sure your Node.js backend is running."
        );

        window.location.href =
            "customer.html";

    }

}


// =====================================================
// SAVE / UPDATE CUSTOMER
// =====================================================

async function saveCustomer(e) {

    e.preventDefault();


    // =================================================
    // GET VALUES
    // =================================================

    const name =
        document
            .getElementById("name")
            .value
            .trim();


    const mobile =
        document
            .getElementById("mobile")
            .value
            .trim();


    // =================================================
    // VALIDATE NAME
    // =================================================

    if (name === "") {

        alert(
            "Please enter the customer name."
        );

        document
            .getElementById("name")
            .focus();

        return;

    }


    // =================================================
    // VALIDATE MOBILE
    // =================================================

    if (!/^[0-9]{10}$/.test(mobile)) {

        alert(
            "Please enter a valid 10-digit mobile number."
        );

        document
            .getElementById("mobile")
            .focus();

        return;

    }


    // =================================================
    // CUSTOMER DATA
    // =================================================

    const customer = {

        name: name,

        mobile: mobile

    };


    try {

        let response;


        // =================================================
        // EDIT CUSTOMER
        // =================================================

        if (isEditMode) {

            response =
                await fetch(
                    `${API}/customers/${customerId}`,
                    {

                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(customer)

                    }
                );

        }


        // =================================================
        // ADD CUSTOMER
        // =================================================

        else {

            response =
                await fetch(
                    `${API}/customers`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(customer)

                    }
                );

        }


        // =================================================
        // READ RESPONSE
        // =================================================

        let result = {};

        try {

            result =
                await response.json();

        }

        catch {

            result = {};

        }


        // =================================================
        // HANDLE ERROR
        // =================================================

        if (!response.ok) {

            console.error(
                "Customer API error:",
                result
            );


            alert(
                result.error ||
                result.message ||
                (
                    isEditMode
                        ? "Failed to update customer."
                        : "Failed to add customer."
                )
            );

            return;

        }


        // =================================================
        // SUCCESS
        // =================================================

        if (isEditMode) {

            alert(
                "✅ Customer updated successfully!"
            );

        }

        else {

            alert(
                "✅ Customer added successfully!"
            );

        }


        // Return to customer list

        window.location.href =
            "customer.html";

    }

    catch (error) {

        console.error(
            "Customer save error:",
            error
        );


        alert(
            "❌ Unable to connect to the server.\n\n" +
            "Make sure your Node.js backend is running on port 3000."
        );

    }

}