const API = "http://localhost:3000";

let products = [];
let customers = [];
let bill = [];

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadProducts();
        await loadCustomers();

        setupProductSearch();
        setupCustomerSearch();

        const productSelect =
            document.getElementById(
                "productSelect"
            );

        if (productSelect) {

            productSelect.addEventListener(
                "change",
                updateQuantityUnit
            );
        }

        createCustomerNameField();
        handlePaymentMethod();
    }
);

// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

    try {

        const response =
            await fetch(`${API}/items`);

        if (!response.ok) {
            throw new Error(
                "Failed to load products"
            );
        }

        products =
            await response.json();

        renderProductOptions(products);

    } catch (error) {

        console.error(
            "Product loading error:",
            error
        );

        alert(
            "Unable to load products.\n\n" +
            "Make sure the backend server is running."
        );
    }
}

// =====================================================
// DISPLAY PRODUCT OPTIONS
// =====================================================

function renderProductOptions(productList) {

    const select =
        document.getElementById(
            "productSelect"
        );

    if (!select) return;

    select.innerHTML =
        `<option value="">Select Product</option>`;

    productList.forEach(product => {

        const stock =
            Number(product.quantity);

        if (
            !Number.isFinite(stock) ||
            stock <= 0
        ) {
            return;
        }

        const variant =
            product.variant
                ? ` — ${product.variant}`
                : "";

        const unit =
            product.unit || "piece";

        const option =
            document.createElement(
                "option"
            );

        option.value =
            product.id;

        option.textContent =
            `${product.name}${variant} — ₹${Number(
                product.price
            ).toFixed(2)} (Stock: ${stock} ${unit})`;

        select.appendChild(option);
    });
}

// =====================================================
// PRODUCT SEARCH
// =====================================================

function setupProductSearch() {

    const searchInput =
        document.getElementById(
            "productSearch"
        );

    if (!searchInput) return;

    searchInput.addEventListener(
        "input",
        () => {

            const searchText =
                searchInput.value
                    .trim()
                    .toLowerCase();

            if (!searchText) {
                renderProductOptions(products);
                return;
            }

            const filteredProducts =
                products.filter(product => {

                    const name =
                        String(
                            product.name || ""
                        ).toLowerCase();

                    const variant =
                        String(
                            product.variant || ""
                        ).toLowerCase();

                    const category =
                        String(
                            product.category || ""
                        ).toLowerCase();

                    return (
                        name.includes(searchText) ||
                        variant.includes(searchText) ||
                        category.includes(searchText)
                    );
                });

            renderProductOptions(
                filteredProducts
            );
        }
    );
}

// =====================================================
// LOAD CUSTOMERS
// =====================================================

async function loadCustomers() {

    try {

        const response =
            await fetch(`${API}/customers`);

        if (!response.ok) {
            throw new Error(
                "Failed to load customers"
            );
        }

        customers =
            await response.json();

        renderCustomerOptions(
            customers
        );

    } catch (error) {

        console.error(
            "Customer loading error:",
            error
        );

        alert(
            "Unable to load customers."
        );
    }
}

// =====================================================
// CUSTOMER SEARCH
// =====================================================

function setupCustomerSearch() {

    const searchInput =
        document.getElementById(
            "customerSearch"
        );

    if (!searchInput) return;

    searchInput.addEventListener(
        "input",
        () => {

            const searchText =
                searchInput.value
                    .trim()
                    .toLowerCase();

            if (!searchText) {

                renderCustomerOptions(
                    customers
                );

                return;
            }

            const filteredCustomers =
                customers.filter(
                    customer => {

                        const name =
                            String(
                                customer.name || ""
                            ).toLowerCase();

                        const mobile =
                            String(
                                customer.mobile || ""
                            ).toLowerCase();

                        return (
                            name.includes(searchText) ||
                            mobile.includes(searchText)
                        );
                    }
                );

            renderCustomerOptions(
                filteredCustomers
            );
        }
    );
}

// =====================================================
// DISPLAY CUSTOMER OPTIONS
// =====================================================

function renderCustomerOptions(
    customerList
) {

    const select =
        document.getElementById(
            "customerSelect"
        );

    if (!select) return;

    select.innerHTML =
        `<option value="">Select Customer</option>`;

    customerList.forEach(customer => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            customer.id;

        option.textContent =
            `${customer.name} - ${customer.mobile}`;

        select.appendChild(option);
    });
}

// =====================================================
// CREATE CUSTOMER NAME FIELD
// =====================================================

function createCustomerNameField() {

    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        );

    if (!paymentMethod) return;

    if (
        document.getElementById(
            "walkInCustomerGroup"
        )
    ) {
        return;
    }

    const group =
        document.createElement("div");

    group.className =
        "form-group";

    group.id =
        "walkInCustomerGroup";

    group.style.display =
        "none";

    group.innerHTML = `

        <label for="walkInCustomerName">
            Customer Name
        </label>

        <input
            type="text"
            id="walkInCustomerName"
            placeholder="Enter customer name"
            autocomplete="off"
        >

        <small style="
            display:block;
            margin-top:6px;
            color:#64748b;
        ">
            Optional for Cash / UPI
        </small>

    `;

    paymentMethod
        .closest(".form-group")
        .insertAdjacentElement(
            "afterend",
            group
        );
}

// =====================================================
// PAYMENT METHOD
// =====================================================

function handlePaymentMethod() {

    const paymentMethodElement =
        document.getElementById(
            "paymentMethod"
        );

    if (!paymentMethodElement) return;

    const paymentMethod =
        paymentMethodElement.value;

    const customerGroup =
        document.getElementById(
            "customerGroup"
        );

    const customerSelect =
        document.getElementById(
            "customerSelect"
        );

    const walkInGroup =
        document.getElementById(
            "walkInCustomerGroup"
        );

    const walkInName =
        document.getElementById(
            "walkInCustomerName"
        );

    // CREDIT

    if (paymentMethod === "credit") {

        if (customerGroup) {
            customerGroup.style.display =
                "block";
        }

        if (walkInGroup) {
            walkInGroup.style.display =
                "none";
        }

        if (walkInName) {
            walkInName.value = "";
        }
    }

    // CASH / UPI

    else if (
        paymentMethod === "cash" ||
        paymentMethod === "upi"
    ) {

        if (customerGroup) {
            customerGroup.style.display =
                "none";
        }

        if (customerSelect) {
            customerSelect.value = "";
        }

        const customerSearch =
            document.getElementById(
                "customerSearch"
            );

        if (customerSearch) {
            customerSearch.value = "";
        }

        if (walkInGroup) {
            walkInGroup.style.display =
                "block";
        }
    }

    // NOTHING SELECTED

    else {

        if (customerGroup) {
            customerGroup.style.display =
                "none";
        }

        if (walkInGroup) {
            walkInGroup.style.display =
                "none";
        }

        if (customerSelect) {
            customerSelect.value = "";
        }
    }
}

// =====================================================
// UPDATE QUANTITY UNIT
// =====================================================

function updateQuantityUnit() {

    const productSelect =
        document.getElementById(
            "productSelect"
        );

    const qtyUnit =
        document.getElementById(
            "qtyUnit"
        );

    if (!productSelect || !qtyUnit) {
        return;
    }

    const productId =
        Number(productSelect.value);

    const product =
        products.find(
            item =>
                Number(item.id) ===
                productId
        );

    if (!product) {

        qtyUnit.innerHTML = `
            <option value="">
                Select Unit
            </option>
        `;

        return;
    }

    const unit =
        String(
            product.unit || "piece"
        ).toLowerCase();

    if (unit === "kg") {

        qtyUnit.innerHTML = `

            <option value="g">
                Gram (g)
            </option>

            <option value="kg">
                Kilogram (kg)
            </option>

        `;
    }

    else if (unit === "l") {

        qtyUnit.innerHTML = `

            <option value="ml">
                Millilitre (ml)
            </option>

            <option value="L">
                Litre (L)
            </option>

        `;
    }

    else {

        qtyUnit.innerHTML = `

            <option value="piece">
                Piece
            </option>

        `;
    }
}

// =====================================================
// ADD PRODUCT TO BILL
// =====================================================

function addToBill() {

    const productSelect =
        document.getElementById(
            "productSelect"
        );

    const qtyInput =
        document.getElementById(
            "qty"
        );

    const qtyUnitSelect =
        document.getElementById(
            "qtyUnit"
        );

    if (!productSelect || !qtyInput) {
        return;
    }

    const productId =
        Number(productSelect.value);

    const qty =
        Number(qtyInput.value);

    const qtyUnit =
        qtyUnitSelect
            ? qtyUnitSelect.value
            : "piece";

    if (!productId) {

        alert(
            "Please select a product."
        );

        return;
    }

    if (
        !Number.isFinite(qty) ||
        qty <= 0
    ) {

        alert(
            "Please enter a valid quantity."
        );

        qtyInput.focus();

        return;
    }

    const product =
        products.find(
            item =>
                Number(item.id) ===
                productId
        );

    if (!product) {

        alert(
            "Product not found."
        );

        return;
    }

    const productUnit =
        String(
            product.unit || "piece"
        ).toLowerCase();

    // Convert to base unit

    let quantityInBaseUnit =
        qty;

    if (productUnit === "kg") {

        if (qtyUnit === "g") {
            quantityInBaseUnit =
                qty / 1000;
        }
    }

    else if (productUnit === "l") {

        if (qtyUnit === "ml") {
            quantityInBaseUnit =
                qty / 1000;
        }
    }

    if (
        !Number.isFinite(
            quantityInBaseUnit
        ) ||
        quantityInBaseUnit <= 0
    ) {

        alert(
            "Invalid quantity."
        );

        return;
    }

    // STOCK CHECK

    const stock =
        Number(product.quantity);

    if (
        quantityInBaseUnit >
        stock
    ) {

        alert(
            `Only ${stock} ${productUnit} available in stock.`
        );

        return;
    }

    // EXISTING PRODUCT

    const existingItem =
        bill.find(
            item =>
                Number(item.id) ===
                productId
        );

    if (existingItem) {

        const newQuantity =
            Number(existingItem.qty) +
            quantityInBaseUnit;

        if (
            newQuantity >
            stock
        ) {

            alert(
                `Stock limit exceeded.\n\n` +
                `Only ${stock} ${productUnit} available.`
            );

            return;
        }

        existingItem.qty =
            newQuantity;

        existingItem.qtyDisplay =
            formatQuantity(
                newQuantity,
                productUnit
            );

    } else {

        bill.push({

            id:
                Number(product.id),

            name:
                product.name,

            variant:
                product.variant || "",

            price:
                Number(product.price),

            unit:
                productUnit,

            qty:
                quantityInBaseUnit,

            qtyDisplay:
                `${qty} ${qtyUnit}`
        });
    }

    renderBill();

    productSelect.value = "";
    qtyInput.value = "";

    if (qtyUnitSelect) {

        qtyUnitSelect.innerHTML = `
            <option value="">
                Select Unit
            </option>
        `;
    }
}

// =====================================================
// FORMAT QUANTITY
// =====================================================

function formatQuantity(
    quantity,
    unit
) {

    const rounded =
        Number(quantity)
            .toFixed(3)
            .replace(/\.?0+$/, "");

    return `${rounded} ${unit}`;
}

// =====================================================
// DISPLAY BILL
// =====================================================

function renderBill() {

    const tbody =
        document.getElementById(
            "billBody"
        );

    const grandTotal =
        document.getElementById(
            "grandTotal"
        );

    if (!tbody || !grandTotal) {
        return;
    }

    tbody.innerHTML = "";

    let total = 0;

    bill.forEach(
        (item, index) => {

            const price =
                Number(item.price);

            const quantity =
                Number(item.qty);

            const itemTotal =
                price * quantity;

            if (
                !Number.isFinite(
                    itemTotal
                )
            ) {
                return;
            }

            total += itemTotal;

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHTML(item.name)}

                    ${
                        item.variant
                            ? `
                                <br>
                                <small>
                                    ${escapeHTML(item.variant)}
                                </small>
                            `
                            : ""
                    }
                </td>

                <td>
                    ₹${price.toFixed(2)}
                </td>

                <td>
                    ${escapeHTML(
                        item.qtyDisplay ||
                        formatQuantity(
                            quantity,
                            item.unit
                        )
                    )}
                </td>

                <td>
                    ₹${itemTotal.toFixed(2)}
                </td>

                <td>
                    <button
                        class="action-btn delete-btn"
                        onclick="removeItem(${item.id})"
                    >
                        Remove
                    </button>
                </td>

            `;

            tbody.appendChild(row);
        }
    );

    grandTotal.textContent =
        total.toFixed(2);
}

// =====================================================
// REMOVE PRODUCT
// =====================================================

function removeItem(id) {

    bill =
        bill.filter(
            item =>
                Number(item.id) !==
                Number(id)
        );

    renderBill();
}

// =====================================================
// CHECKOUT
// =====================================================

async function checkout() {

    if (!bill.length) {

        alert(
            "No products added to the bill."
        );

        return;
    }

    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        ).value;

    if (!paymentMethod) {

        alert(
            "Please select a payment method."
        );

        return;
    }

    // =================================================
    // CUSTOMER ID
    // =================================================

    let customerId = null;

    if (
        paymentMethod === "credit"
    ) {

        customerId =
            Number(
                document.getElementById(
                    "customerSelect"
                ).value
            );

        if (!customerId) {

            alert(
                "Please select a customer for Credit (Khata)."
            );

            return;
        }

        const customer =
            customers.find(
                item =>
                    Number(item.id) ===
                    customerId
            );

        if (!customer) {

            alert(
                "Selected customer was not found."
            );

            return;
        }
    }

    // =================================================
    // CUSTOMER NAME
    // =================================================

    let customerName = null;

    // CASH / UPI NAME

    if (
        paymentMethod === "cash" ||
        paymentMethod === "upi"
    ) {

        const nameInput =
            document.getElementById(
                "walkInCustomerName"
            );

        if (nameInput) {
            customerName =
                nameInput.value.trim();
        }
    }

    // CREDIT CUSTOMER NAME

    if (
        paymentMethod === "credit" &&
        customerId
    ) {

        const customer =
            customers.find(
                item =>
                    Number(item.id) ===
                    customerId
            );

        if (customer) {
            customerName =
                customer.name;
        }
    }

    // =================================================
    // CALCULATE TOTAL
    // =================================================

    const total =
        bill.reduce(
            (
                sum,
                item
            ) => {

                const price =
                    Number(item.price);

                const qty =
                    Number(item.qty);

                if (
                    !Number.isFinite(price) ||
                    !Number.isFinite(qty)
                ) {
                    return sum;
                }

                return (
                    sum +
                    price * qty
                );

            },
            0
        );

    if (
        !Number.isFinite(total) ||
        total <= 0
    ) {

        alert(
            "Invalid sale total."
        );

        console.error(
            "Invalid bill:",
            bill
        );

        return;
    }

    // =================================================
    // FINAL STOCK CHECK
    // =================================================

    for (
        const item of bill
    ) {

        const product =
            products.find(
                product =>
                    Number(product.id) ===
                    Number(item.id)
            );

        if (!product) {

            alert(
                `Product "${item.name}" is no longer available.`
            );

            return;
        }

        if (
            Number(item.qty) >
            Number(product.quantity)
        ) {

            alert(
                `Not enough stock for "${item.name}".`
            );

            return;
        }
    }

    // =================================================
    // CONFIRM
    // =================================================

    let confirmationText =
        `Generate bill?\n\n` +
        `Total: ₹${total.toFixed(2)}\n` +
        `Payment: ${getPaymentMethodName(paymentMethod)}`;

    if (customerName) {

        confirmationText +=
            `\nCustomer: ${customerName}`;
    }

    const confirmed =
        confirm(
            confirmationText
        );

    if (!confirmed) {
        return;
    }

    // =================================================
    // SEND SALE
    // =================================================

    try {

        const saleItems =
            bill.map(
                item => ({
                    id:
                        Number(item.id),

                    qty:
                        Number(item.qty),

                    price:
                        Number(item.price)
                })
            );

        console.log(
            "Sending sale:",
            {
                items: saleItems,
                total: total,
                paymentMethod:
                    paymentMethod,
                customerId:
                    customerId,
                customerName:
                    customerName
            }
        );

        const response =
            await fetch(
                `${API}/sales`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            items:
                                saleItems,

                            total:
                                Number(
                                    total.toFixed(2)
                                ),

                            paymentMethod:
                                paymentMethod,

                            customerId:
                                customerId,

                            customerName:
                                customerName || null
                        })
                }
            );

        const data =
            await response.json();

        console.log(
            "Backend response:",
            data
        );

        if (!response.ok) {

            alert(
                data.error ||
                data.message ||
                "Sale could not be completed."
            );

            return;
        }

        if (data.success) {

            const invoice =
                data.invoice ||
                data.bill_no ||
                "Generated";

            alert(
                `✅ Sale Completed Successfully!\n\n` +
                `Invoice: ${invoice}\n` +
                `Customer: ${customerName || "Walk-in Customer"}\n` +
                `Total: ₹${total.toFixed(2)}\n` +
                `Payment: ${getPaymentMethodName(paymentMethod)}`
            );

            // CLEAR BILL

            bill = [];

            renderBill();

            // RESET PAYMENT

            const paymentElement =
                document.getElementById(
                    "paymentMethod"
                );

            if (paymentElement) {
                paymentElement.value = "";
            }

            const customerSelect =
                document.getElementById(
                    "customerSelect"
                );

            if (customerSelect) {
                customerSelect.value = "";
            }

            const customerSearch =
                document.getElementById(
                    "customerSearch"
                );

            if (customerSearch) {
                customerSearch.value = "";
            }

            const walkInName =
                document.getElementById(
                    "walkInCustomerName"
                );

            if (walkInName) {
                walkInName.value = "";
            }

            handlePaymentMethod();

            // RELOAD STOCK

            await loadProducts();

            // CLEAR PRODUCT SEARCH

            const productSearch =
                document.getElementById(
                    "productSearch"
                );

            if (productSearch) {
                productSearch.value = "";
            }

        } else {

            alert(
                data.message ||
                "Sale failed."
            );
        }

    } catch (error) {

        console.error(
            "Checkout error:",
            error
        );

        alert(
            "Server error.\n\n" +
            "Check the backend terminal for the exact error."
        );
    }
}

// =====================================================
// PAYMENT DISPLAY NAME
// =====================================================

function getPaymentMethodName(
    method
) {

    switch (method) {

        case "cash":
            return "Cash";

        case "upi":
            return "UPI";

        case "credit":
            return "Credit (Khata)";

        default:
            return method;
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