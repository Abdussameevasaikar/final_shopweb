const API = "http://localhost:3000";

// =====================================================
// GET PRODUCT ID FROM URL
// Example:
// edit_product.html?id=3
// =====================================================

const params = new URLSearchParams(window.location.search);

const id = params.get("id");


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    if (!id || isNaN(Number(id))) {

        alert("❌ Invalid product ID.");

        window.location.href = "inventory.html";

        return;
    }

    loadProduct();

    const form = document.getElementById("editForm");

    if (form) {

        form.addEventListener("submit", updateProduct);

    }

});


// =====================================================
// LOAD PRODUCT
// =====================================================

async function loadProduct() {

    try {

        const res = await fetch(`${API}/items`);

        if (!res.ok) {

            throw new Error("Failed to load products.");

        }

        const items = await res.json();

        const product = items.find(
            item => Number(item.id) === Number(id)
        );


        if (!product) {

            alert("❌ Product not found.");

            window.location.href = "inventory.html";

            return;
        }


        // =================================================
        // PUT PRODUCT DATA INTO FORM
        // =================================================

        document.getElementById("name").value =
            product.name || "";


        document.getElementById("category").value =
            product.category || "";


        document.getElementById("variant").value =
            product.variant || "";


        document.getElementById("quantity").value =
            product.quantity ?? 0;


        document.getElementById("unit").value =
            product.unit || "piece";


        document.getElementById("price").value =
            product.price ?? 0;


    } catch (err) {

        console.error(
            "Error loading product:",
            err
        );

        alert(
            "❌ Unable to load product.\n\n" +
            "Make sure the backend server is running."
        );

        window.location.href = "inventory.html";

    }

}


// =====================================================
// UPDATE PRODUCT
// =====================================================

async function updateProduct(e) {

    e.preventDefault();


    // =================================================
    // GET VALUES
    // =================================================

    const name = document
        .getElementById("name")
        .value
        .trim();


    const category = document
        .getElementById("category")
        .value
        .trim();


    const variant = document
        .getElementById("variant")
        .value
        .trim();


    const quantity = Number(
        document.getElementById("quantity").value
    );


    const unit = document
        .getElementById("unit")
        .value;


    const price = Number(
        document.getElementById("price").value
    );


    // =================================================
    // VALIDATION
    // =================================================

    if (name === "") {

        alert("Please enter the product name.");

        document.getElementById("name").focus();

        return;
    }


    if (category === "") {

        alert("Please enter the category.");

        document.getElementById("category").focus();

        return;
    }


    if (variant === "") {

        alert("Please enter the variant or pack size.");

        document.getElementById("variant").focus();

        return;
    }


    if (!Number.isFinite(quantity) || quantity < 0) {

        alert("Please enter a valid quantity.");

        document.getElementById("quantity").focus();

        return;
    }


    if (!unit) {

        alert("Please select a unit.");

        document.getElementById("unit").focus();

        return;
    }


    if (!Number.isFinite(price) || price < 0) {

        alert("Please enter a valid price.");

        document.getElementById("price").focus();

        return;
    }


    // =================================================
    // PRODUCT DATA
    // =================================================

    const product = {

        name: name,

        category: category,

        variant: variant,

        quantity: quantity,

        unit: unit,

        price: price

    };


    console.log("Updating product:", product);


    // =================================================
    // UPDATE MYSQL THROUGH BACKEND
    // =================================================

    try {

        const res = await fetch(
            `${API}/items/${id}`,
            {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(product)

            }
        );


        let data = {};

        try {

            data = await res.json();

        } catch {

            data = {};

        }


        // =================================================
        // UPDATE FAILED
        // =================================================

        if (!res.ok) {

            console.error(
                "Update error:",
                data
            );

            alert(
                data.error ||
                data.message ||
                "❌ Failed to update product."
            );

            return;
        }


        // =================================================
        // SUCCESS
        // =================================================

        alert(
            "✅ Product updated successfully!"
        );


        window.location.href =
            "inventory.html";


    } catch (err) {

        console.error(
            "Error updating product:",
            err
        );

        alert(
            "❌ Unable to connect to the server.\n\n" +
            "Make sure your Node.js backend is running on port 3000."
        );

    }

}