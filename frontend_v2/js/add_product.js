const API = "http://localhost:3000";

let products = [];


// =====================
// PAGE LOAD
// =====================

document.addEventListener("DOMContentLoaded", () => {

    loadCategories();

    const form = document.getElementById("productForm");

    if (form) {
        form.addEventListener("submit", saveProduct);
    }

});


// =====================
// LOAD CATEGORIES
// =====================

async function loadCategories() {

    try {

        const res = await fetch(`${API}/items`);

        if (!res.ok) {
            throw new Error("Failed to load products");
        }

        products = await res.json();

        const select = document.getElementById("category");

        if (!select) {
            return;
        }

        select.innerHTML = `
            <option value="">Select Category</option>
        `;


        const categories = [
            ...new Set(
                products
                    .map(item => item.category)
                    .filter(
                        category =>
                            category &&
                            category.trim() !== ""
                    )
            )
        ].sort((a, b) => a.localeCompare(b));


        categories.forEach(category => {

            const option =
                document.createElement("option");

            option.value = category;

            option.textContent = category;

            select.appendChild(option);

        });

    } catch (err) {

        console.error(
            "Error loading categories:",
            err
        );

    }

}


// =====================
// SAVE PRODUCT
// =====================

async function saveProduct(e) {

    e.preventDefault();


    // =====================
    // GET VALUES
    // =====================

    const name =
        document
            .getElementById("name")
            .value
            .trim();


    let category =
        document
            .getElementById("category")
            .value
            .trim();


    const newCategory =
        document
            .getElementById("newCategory")
            .value
            .trim();


    const variant =
        document
            .getElementById("variant")
            .value
            .trim();


    const quantity =
        Number(
            document
                .getElementById("quantity")
                .value
        );


    const unit =
        document
            .getElementById("unit")
            .value;


    const price =
        Number(
            document
                .getElementById("price")
                .value
        );


    // =====================
    // VALIDATION
    // =====================

    if (name === "") {

        alert(
            "Please enter the product name."
        );

        document
            .getElementById("name")
            .focus();

        return;

    }


    // New category overrides selected category

    if (newCategory !== "") {

        category = newCategory;

    }


    if (category === "") {

        alert(
            "Please select or enter a category."
        );

        document
            .getElementById("category")
            .focus();

        return;

    }
    if (variant === "") {

    alert(
        "Please enter the variant or pack size."
    );

    document
        .getElementById("variant")
        .focus();

    return;

}

    if (
        !Number.isFinite(quantity) ||
        quantity < 0
    ) {

        alert(
            "Please enter a valid stock quantity."
        );

        document
            .getElementById("quantity")
            .focus();

        return;

    }


    if (unit === "") {

        alert(
            "Please select a unit."
        );

        document
            .getElementById("unit")
            .focus();

        return;

    }


    if (
        !Number.isFinite(price) ||
        price < 0
    ) {

        alert(
            "Please enter a valid price."
        );

        document
            .getElementById("price")
            .focus();

        return;

    }


    // =====================
    // PRODUCT OBJECT
    // =====================

    const product = {

        name: name,

        category: category,

        variant: variant,

        quantity: quantity,

        unit: unit,

        price: price

    };


    console.log(
        "Product being sent:",
        product
    );


    // =====================
    // SEND TO BACKEND
    // =====================

    try {

        const res =
            await fetch(
                `${API}/items`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(product)
                }
            );


        let data = {};

        try {

            data =
                await res.json();

        } catch {

            data = {};

        }


        // =====================
        // BACKEND ERROR
        // =====================

        if (!res.ok) {

            console.error(
                "Backend error:",
                data
            );

            alert(
                data.error ||
                data.message ||
                "Failed to add product."
            );

            return;

        }


        // =====================
        // SUCCESS
        // =====================

        alert(
            "✅ Product Added Successfully"
        );


        window.location.href =
            "inventory.html";


    } catch (err) {

        console.error(
            "Error adding product:",
            err
        );

        alert(
            "❌ Unable to connect to the server.\n\n" +
            "Make sure your Node.js backend is running on port 3000."
        );

    }

}