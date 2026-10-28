// ============================================================
// VASAIKAR BAKALA
// PROFESSIONAL REPORTS
// ============================================================


let currentPeriod = "day";


// ============================================================
// ELEMENTS
// ============================================================

const reportDate =
    document.getElementById("reportDate");

const periodDisplay =
    document.getElementById("periodDisplay");

const errorMessage =
    document.getElementById("errorMessage");

const heroRevenue =
    document.getElementById("heroRevenue");

const heroSubtitle =
    document.getElementById("heroSubtitle");

const cashIncome =
    document.getElementById("cashIncome");

const upiIncome =
    document.getElementById("upiIncome");

const creditSales =
    document.getElementById("creditSales");

const totalBills =
    document.getElementById("totalBills");

const totalStockSold =
    document.getElementById("totalStockSold");

const creditPending =
    document.getElementById("creditPending");

const cashBreakdown =
    document.getElementById("cashBreakdown");

const upiBreakdown =
    document.getElementById("upiBreakdown");

const creditBreakdown =
    document.getElementById("creditBreakdown");

const cashBar =
    document.getElementById("cashBar");

const upiBar =
    document.getElementById("upiBar");

const creditBar =
    document.getElementById("creditBar");

const summaryBills =
    document.getElementById("summaryBills");

const averageBill =
    document.getElementById("averageBill");

const refreshReportBtn =
    document.getElementById(
        "refreshReportBtn"
    );


// ============================================================
// TODAY
// ============================================================

function getTodayString() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ============================================================
// RUPEES
// ============================================================

function formatRupees(value) {

    return (
        "₹" +
        Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );

}


// ============================================================
// NUMBER
// ============================================================

function formatNumber(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 3
        }
    );

}


// ============================================================
// DISPLAY DATE
// ============================================================

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const parts =
        dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ============================================================
// ACTIVE BUTTON
// ============================================================

function updateActiveButton() {

    document
        .querySelectorAll(
            ".report-period-btn"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.period ===
                    currentPeriod
            );

        });

}


// ============================================================
// ERROR
// ============================================================

function showError(message) {

    errorMessage.textContent =
        message;

    errorMessage.style.display =
        "block";

}


function hideError() {

    errorMessage.style.display =
        "none";

}


// ============================================================
// LOADING
// ============================================================

function setLoading(loading) {

    const container =
        document.querySelector(
            ".reports-page"
        );

    if (loading) {

        container.classList.add(
            "report-loading"
        );

    } else {

        container.classList.remove(
            "report-loading"
        );

    }

}


// ============================================================
// PERIOD LABEL
// ============================================================

function updatePeriodLabel(data) {

    const start =
        formatDate(
            data.periodStart
        );

    const end =
        formatDate(
            data.periodEnd
        );


    if (currentPeriod === "day") {

        periodDisplay.textContent =
            `Day Report • ${start}`;

    }

    else if (currentPeriod === "weekly") {

        periodDisplay.textContent =
            `Weekly Report • ${start} – ${end}`;

    }

    else if (currentPeriod === "monthly") {

        periodDisplay.textContent =
            `Monthly Report • ${start} – ${end}`;

    }

    else if (currentPeriod === "annual") {

        periodDisplay.textContent =
            `Annual Report • ${start} – ${end}`;

    }


    heroSubtitle.textContent =
        periodDisplay.textContent;

}


// ============================================================
// PAYMENT BREAKDOWN
// ============================================================

function updatePaymentBreakdown(data) {

    const cash =
        Number(
            data.cashIncome || 0
        );

    const upi =
        Number(
            data.upiIncome || 0
        );

    const credit =
        Number(
            data.creditSales || 0
        );

    const total =
        cash +
        upi +
        credit;


    cashBreakdown.textContent =
        formatRupees(cash);

    upiBreakdown.textContent =
        formatRupees(upi);

    creditBreakdown.textContent =
        formatRupees(credit);


    if (total <= 0) {

        cashBar.style.width = "0%";
        upiBar.style.width = "0%";
        creditBar.style.width = "0%";

        return;

    }


    cashBar.style.width =
        `${(cash / total) * 100}%`;

    upiBar.style.width =
        `${(upi / total) * 100}%`;

    creditBar.style.width =
        `${(credit / total) * 100}%`;

}


// ============================================================
// LOAD REPORT
// ============================================================

async function  loadReport() {

    const selectedDate =
        reportDate.value;


    if (!selectedDate) {

        showError(
            "Please select a date."
        );

        return;

    }


    hideError();

    setLoading(true);


    try {

        
const API = "http://localhost:3000";

const url =
    `${API}/reports/summary?period=${encodeURIComponent(
        currentPeriod
    )}&date=${encodeURIComponent(
        selectedDate
    )}`;



        const response =
            await fetch(url);


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Unable to load report."
            );

        }


        // ====================================================
        // REVENUE
        // ====================================================

        heroRevenue.textContent =
            formatRupees(
                data.totalRevenue
            );


        // ====================================================
        // KPI
        // ====================================================

        cashIncome.textContent =
            formatRupees(
                data.cashIncome
            );


        upiIncome.textContent =
            formatRupees(
                data.upiIncome
            );


        creditSales.textContent =
            formatRupees(
                data.creditSales
            );


        totalBills.textContent =
            formatNumber(
                data.totalBills
            );


        // ====================================================
        // QUICK SUMMARY
        // ====================================================

        totalStockSold.textContent =
            formatNumber(
                data.totalStockSold
            );


        summaryBills.textContent =
            `${formatNumber(
                data.totalBills
            )} bills`;


        const revenue =
            Number(
                data.totalRevenue || 0
            );

        const bills =
            Number(
                data.totalBills || 0
            );


        const average =
            bills > 0
                ? revenue / bills
                : 0;


        averageBill.textContent =
            formatRupees(
                average
            );


        // ====================================================
        // CREDIT
        // ====================================================

        creditPending.textContent =
            formatRupees(
                data.creditPending
            );


        // ====================================================
        // PERIOD
        // ====================================================

        updatePeriodLabel(
            data
        );


        // ====================================================
        // PAYMENT BREAKDOWN
        // ====================================================

        updatePaymentBreakdown(
            data
        );

    }


    catch (error) {

        console.error(
            "Reports error:",
            error
        );


        showError(
            error.message ||
            "Unable to load report."
        );

    }


    finally {

        setLoading(false);

    }

}


// ============================================================
// PERIOD BUTTONS
// ============================================================

document
    .querySelectorAll(
        ".report-period-btn"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                currentPeriod =
                    button.dataset.period;

                updateActiveButton();

                loadReport();

            }
        );

    });


// ============================================================
// DATE CHANGE
// ============================================================

reportDate.addEventListener(
    "change",
    loadReport
);


// ============================================================
// REFRESH
// ============================================================

refreshReportBtn.addEventListener(
    "click",
    loadReport
);


// ============================================================
// INITIAL LOAD
// ============================================================

reportDate.value =
    getTodayString();

reportDate.max =
    getTodayString();

updateActiveButton();

loadReport();