const API = "http://localhost:3000";

let inventory = [];

let deleteId = null;


// =====================================================
// INITIALIZE PAGE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadItems();

    }
);


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadItems() {

    try {

        const response =
            await fetch(`${API}/items`);


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        inventory =
            await response.json();


        populateCategories();

        applyFiltersAndSort();

    }

    catch (error) {

        console.error(
            "Error loading products:",
            error
        );


        alert(
            "Unable to load products. Make sure the server is running."
        );

    }

}


// =====================================================
// DISPLAY PRODUCTS
// =====================================================


function displayItems(items) {
    const tableBody = document.getElementById("tableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!items || items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:20px;">
                    No products found.
                </td>
            </tr>
        `;
        return;
    }

    items.forEach((item, index) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const unit = String(item.unit || "piece");
        const variant = String(item.variant || "");

        const formattedQuantity = formatQuantity(quantity);

        let status;
        let statusClass;

        if (quantity <= 5) {
            status = "Out Of Stock";
            statusClass = "out-stock";
        } else if (quantity <= 15) {
            status = "low-stock";
            statusClass = "low-stock";
        } else {
            status = "In Stock";
            statusClass = "in-stock";
        }

        const variantDisplay = variant.trim() !== ""
            ? escapeHTML(variant)
            : "-";

        const unitDisplay = formatUnit(unit);

        tableBody.innerHTML += `
            <tr>
                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHTML(item.name)}
                </td>

                <td>
                    ${variantDisplay}
                </td>

                <td>
                    ${escapeHTML(item.category)}
                </td>

                <td>
                    ${formattedQuantity}${unitDisplay}
                </td>

                <td>
                    ₹${price.toFixed(2)}
                </td>

                <td>
                    <span class="badge ${statusClass}">
                        ${status}
                    </span>
                </td>

                <td>
                    <button
                        class="action-btn edit-btn"
                        onclick="editItem(${item.id})"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Edit
                    </button>

                    <button
                        class="action-btn delete-btn"
                        onclick="deleteItem(${item.id})"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}



// =====================================================
// FORMAT QUANTITY
// =====================================================

function formatQuantity(quantity) {

    if (
        Number.isInteger(quantity)
    ) {

        return String(quantity);

    }


    return Number(
        quantity.toFixed(3)
    ).toString();

}


// =====================================================
// FORMAT UNIT
// =====================================================

function formatUnit(unit) {

    const value = String(unit || "")
        .trim()
        .toLowerCase();


    switch (value) {

        case "kg":
            return " kg";

        case "l":
            return " L";

        case "piece":
            return " pieces";

        case "":
            return "";

        default:
            return ` ${unit}`;

    }

}



// =====================================================
// PIECE LABEL
// =====================================================

function quantityLabel(unit) {

    if (unit === "piece") {

        return " pieces";

    }

    return ` ${unit}`;

}


// =====================================================
// POPULATE CATEGORY FILTER
// =====================================================

function populateCategories() {

    const select =
        document.getElementById(
            "categoryFilter"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            All Categories
        </option>

    `;


    const categories = [

        ...new Set(

            inventory

                .map(
                    item =>
                        item.category
                )

                .filter(
                    category =>
                        category &&
                        category.trim() !== ""
                )

        )

    ];


    categories.sort(
        (a, b) =>
            a.localeCompare(b)
    );


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category;


            option.textContent =
                category;


            select.appendChild(
                option
            );

        }
    );

}


// =====================================================
// SEARCH
// =====================================================

function searchItems() {

    applyFiltersAndSort();

}


// =====================================================
// CATEGORY FILTER
// =====================================================

function filterItems() {

    applyFiltersAndSort();

}


// =====================================================
// SORT
// =====================================================

function sortItems() {

    applyFiltersAndSort();

}


// =====================================================
// APPLY SEARCH + FILTER + SORT
// =====================================================

function applyFiltersAndSort() {

    const searchInput =
        document.getElementById(
            "search"
        );


    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    const sortSelect =
        document.getElementById(
            "sortBy"
        );


    const keyword =
        searchInput

            ? searchInput.value
                .trim()
                .toLowerCase()

            : "";


    const selectedCategory =
        categoryFilter
            ? categoryFilter.value
            : "";


    const selectedSort =
        sortSelect
            ? sortSelect.value
            : "";


    // ---------------------------------------------
    // SEARCH
    // ---------------------------------------------

    let filtered =
        inventory.filter(
            item => {


                const name =
                    String(
                        item.name || ""
                    )
                    .toLowerCase();


                const category =
                    String(
                        item.category || ""
                    )
                    .toLowerCase();


                const variant =
                    String(
                        item.variant || ""
                    )
                    .toLowerCase();


                const matchesSearch =

                    name.includes(
                        keyword
                    )

                    ||

                    category.includes(
                        keyword
                    )

                    ||

                    variant.includes(
                        keyword
                    );


                const matchesCategory =

                    selectedCategory === ""

                    ||

                    item.category ===
                    selectedCategory;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    // ---------------------------------------------
    // SORT
    // ---------------------------------------------

    switch (
        selectedSort
    ) {


        case "name":

            filtered.sort(
                (a, b) =>
                    String(a.name)
                        .localeCompare(
                            String(b.name)
                        )
            );

            break;


        case "price":

            filtered.sort(
                (a, b) =>
                    Number(a.price) -
                    Number(b.price)
            );

            break;


        case "quantity":

            filtered.sort(
                (a, b) =>
                    Number(a.quantity) -
                    Number(b.quantity)
            );

            break;


        case "category":

            filtered.sort(
                (a, b) =>
                    String(a.category)
                        .localeCompare(
                            String(b.category)
                        )
            );

            break;

    }


    displayItems(
        filtered
    );

}


// =====================================================
// EDIT PRODUCT
// =====================================================

function editItem(id) {

    window.location.href =
        `edit_product.html?id=${id}`;

}


// =====================================================
// DELETE PRODUCT
// =====================================================

function deleteItem(id) {

    deleteId = id;


    const product =
        inventory.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!product) {

        alert(
            "Product not found."
        );

        return;

    }


    const deleteText =
        document.getElementById(
            "deleteText"
        );


    if (deleteText) {

        deleteText.textContent =
            `Delete "${product.name}${product.variant ? " - " + product.variant : ""}"?`;

    }


    const modal =
        document.getElementById(
            "deleteModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }

}


// =====================================================
// CLOSE DELETE MODAL
// =====================================================

function closeModal() {

    const modal =
        document.getElementById(
            "deleteModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }


    deleteId = null;

}


// =====================================================
// CONFIRM DELETE
// =====================================================

async function confirmDelete() {

    if (
        deleteId === null
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API}/items/${deleteId}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                "Delete failed"
            );

        }


        closeModal();

        await loadItems();

    }

    catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            "Unable to delete product."
        );

    }

}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );

}