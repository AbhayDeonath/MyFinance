/* =====================================================
   MYFINANCE — PERSONAL EXPENSE TRACKER
   Updated JavaScript Application
===================================================== */

/* =====================================================
   1. APPLICATION CONFIGURATION
===================================================== */

const STORAGE_KEY = "myFinanceAppData";
const FIRST_TRACKING_MONTH = "2026-01";
const FIRST_TRACKING_DATE = "2026-01-01";
const CURRENCY = "INR";

const EXPENSE_CATEGORIES = [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Education",
    "Bills & Utilities",
    "Health",
    "Entertainment",
    "Other"
];

const INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Pocket Money",
    "Investment",
    "Gift",
    "Other Income"
];

const CATEGORY_META = {
    "Food & Dining": { icon: "🍜", color: "#8B7CF6" },
    "Transportation": { icon: "🚗", color: "#35B98A" },
    "Shopping": { icon: "🛍️", color: "#F5AE57" },
    "Education": { icon: "📚", color: "#5B9BE8" },
    "Bills & Utilities": { icon: "⚡", color: "#ED778A" },
    "Health": { icon: "💊", color: "#38C6C9" },
    "Entertainment": { icon: "🎮", color: "#AF7CE8" },
    "Other": { icon: "◈", color: "#98A0B5" },
    "Salary": { icon: "💼", color: "#35B98A" },
    "Freelance": { icon: "💻", color: "#5B9BE8" },
    "Pocket Money": { icon: "👛", color: "#8B7CF6" },
    "Investment": { icon: "📈", color: "#38C6C9" },
    "Gift": { icon: "🎁", color: "#F5AE57" },
    "Other Income": { icon: "💰", color: "#AF7CE8" }
};

const PAGE_INFO = {
    dashboard: {
        title: "Dashboard",
        subtitle: "Welcome back! Here's your financial overview."
    },
    transactions: {
        title: "Transactions",
        subtitle: "Manage and monitor your financial activities."
    },
    analytics: {
        title: "Analytics",
        subtitle: "Discover insights into your spending habits."
    },
    settings: {
        title: "Settings",
        subtitle: "Personalize your MyFinance experience."
    }
};

/* =====================================================
   2. DATA VALIDATION AND LOCAL STORAGE
===================================================== */

function createId() {
    return globalThis.crypto?.randomUUID?.() ||
        `transaction-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeTransaction(transaction) {
    if (!transaction || typeof transaction !== "object") return null;

    const amount = Number(transaction.amount);
    const validCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(transaction.date || "");

    if (
        !["income", "expense"].includes(transaction.type) ||
        !validCategories.includes(transaction.category) ||
        !Number.isFinite(amount) || amount <= 0 ||
        !validDate
    ) {
        return null;
    }

    const categoryBelongsToType = transaction.type === "income"
        ? INCOME_CATEGORIES.includes(transaction.category)
        : EXPENSE_CATEGORIES.includes(transaction.category);

    if (!categoryBelongsToType) return null;

    return {
        id: String(transaction.id || createId()),
        title: String(transaction.title || "Untitled").slice(0, 60),
        amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        method: String(transaction.method || "Other"),
        note: String(transaction.note || "").slice(0, 200),
        createdAt: Number(transaction.createdAt) || 0
    };
}

function normalizeProfile(profile) {
    const source = profile && typeof profile === "object" ? profile : {};
    const age = source.age === "" || source.age == null ? "" : Number(source.age);

    return {
        name: String(source.name || "").trim().slice(0, 60),
        age: Number.isInteger(age) && age >= 1 && age <= 120 ? String(age) : "",
        about: String(source.about || "").slice(0, 300)
    };
}

function loadData() {
    const defaults = {
        transactions: [],
        theme: "light",
        profile: { name: "", age: "", about: "" }
    };

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return defaults;

        const parsed = JSON.parse(saved);
        if (!parsed || typeof parsed !== "object") return defaults;

        return {
            transactions: Array.isArray(parsed.transactions)
                ? parsed.transactions.map(normalizeTransaction).filter(Boolean)
                : [],
            theme: parsed.theme === "dark" ? "dark" : "light",
            profile: normalizeProfile(parsed.profile)
        };
    } catch (error) {
        console.error("Unable to load MyFinance data:", error);
        return defaults;
    }
}

const state = loadData();

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            transactions: state.transactions,
            theme: state.theme,
            profile: state.profile
        }));
        return true;
    } catch (error) {
        console.error("Unable to save MyFinance data:", error);
        showToast("Unable to save data. Check your browser storage.");
        return false;
    }
}

/* =====================================================
   3. DOM REFERENCES
===================================================== */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
    sidebar: $("#sidebar"),
    mobileMenuBtn: $("#mobileMenuBtn"),
    themeToggle: $("#themeToggle"),
    themeIcon: $("#themeIcon"),
    pageTitle: $("#pageTitle"),
    pageSubtitle: $("#pageSubtitle"),

    modal: $("#transactionModal"),
    modalTitle: $("#modalTitle"),
    transactionForm: $("#transactionForm"),
    transactionId: $("#transactionId"),
    transactionType: $("#transactionType"),
    transactionTitle: $("#transactionTitle"),
    transactionAmount: $("#transactionAmount"),
    transactionCategory: $("#transactionCategory"),
    transactionDate: $("#transactionDate"),
    transactionMethod: $("#transactionMethod"),
    transactionNote: $("#transactionNote"),

    searchInput: $("#searchInput"),
    monthFilter: $("#monthFilter"),
    expenseCategoryFilter: $("#expenseCategoryFilter"),
    incomeCategoryFilter: $("#incomeCategoryFilter"),

    toast: $("#toast"),
    toastMessage: $("#toastMessage"),

    profileButton: $("#profileButton"),
    profileModal: $("#profileModal"),
    profileForm: $("#profileForm"),
    profileName: $("#profileName"),
    profileSummary: $("#profileSummary"),
    profileNameInput: $("#profileNameInput"),
    profileAgeInput: $("#profileAgeInput"),
    profileAboutInput: $("#profileAboutInput")
};

/* =====================================================
   4. GENERAL HELPERS
===================================================== */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: CURRENCY,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
}

function getToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getMonthKey(dateString) {
    return String(dateString).slice(0, 7);
}

function getCurrentMonth() {
    return getMonthKey(getToday());
}

function getCurrentYear() {
    return new Date().getFullYear();
}

function getTransactionsByMonth(month) {
    return state.transactions.filter(transaction => getMonthKey(transaction.date) === month);
}

function getTotal(transactions, type) {
    return transactions
        .filter(transaction => transaction.type === type)
        .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T12:00:00`);
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function getSortedTransactions(transactions) {
    return [...transactions].sort((a, b) =>
        b.date.localeCompare(a.date) ||
        b.createdAt - a.createdAt ||
        b.id.localeCompare(a.id)
    );
}

function getCategoryIcon(category) {
    return CATEGORY_META[category]?.icon || "◈";
}

function showToast(message) {
    if (!elements.toast || !elements.toastMessage) return;

    elements.toastMessage.textContent = message;
    elements.toast.classList.add("show");
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => {
        elements.toast.classList.remove("show");
    }, 2800);
}

/* =====================================================
   5. NAVIGATION
===================================================== */

function showView(viewName) {
    if (!PAGE_INFO[viewName]) return;

    $$(".view").forEach(view => view.classList.remove("active"));
    const target = $(`#${viewName}-view`);
    if (target) target.classList.add("active");

    $$(".nav-item").forEach(item => {
        item.classList.toggle("active", item.dataset.view === viewName);
    });

    if (elements.pageTitle) elements.pageTitle.textContent = PAGE_INFO[viewName].title;
    if (elements.pageSubtitle) elements.pageSubtitle.textContent = PAGE_INFO[viewName].subtitle;
    elements.sidebar?.classList.remove("open");
}

/* =====================================================
   6. THEME MANAGEMENT
===================================================== */

function applyTheme(theme) {
    state.theme = theme === "dark" ? "dark" : "light";
    document.body.dataset.theme = state.theme;

    if (elements.themeIcon) {
        elements.themeIcon.textContent = state.theme === "dark" ? "☀" : "☾";
    }

    saveData();
}

function toggleTheme() {
    applyTheme(state.theme === "light" ? "dark" : "light");
}

/* =====================================================
   7. TRANSACTION CATEGORY OPTIONS AND TYPE
===================================================== */

function updateCategoryOptions(selectedCategory = "") {
    if (!elements.transactionCategory) return;

    const categories = elements.transactionType.value === "income"
        ? INCOME_CATEGORIES
        : EXPENSE_CATEGORIES;

    elements.transactionCategory.innerHTML = categories.map(category =>
        `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
    ).join("");

    elements.transactionCategory.value = categories.includes(selectedCategory)
        ? selectedCategory
        : categories[0];
}

function setTransactionType(type, selectedCategory = "") {
    const selectedType = type === "income" ? "income" : "expense";
    elements.transactionType.value = selectedType;

    $$('[data-transaction-type]').forEach(button => {
        const active = button.dataset.transactionType === selectedType;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });

    if (elements.transactionTitle) {
        elements.transactionTitle.placeholder = selectedType === "income"
            ? "e.g. Pocket money"
            : "e.g. Snacks";
    }

    updateCategoryOptions(selectedCategory);
}

$$('[data-transaction-type]').forEach(button => {
    button.addEventListener("click", () => setTransactionType(button.dataset.transactionType));
});

/* =====================================================
   8. TRANSACTION MODAL
===================================================== */

function openModal(transaction = null) {
    elements.transactionForm.reset();
    elements.transactionId.value = "";
    elements.transactionDate.value = getToday();
    elements.transactionDate.min = FIRST_TRACKING_DATE;
    elements.modalTitle.textContent = transaction ? "Edit Transaction" : "Add Transaction";

    if (transaction) {
        elements.transactionId.value = transaction.id;
        setTransactionType(transaction.type, transaction.category);
        elements.transactionTitle.value = transaction.title;
        elements.transactionAmount.value = transaction.amount;
        elements.transactionDate.value = transaction.date;
        elements.transactionMethod.value = transaction.method;
        elements.transactionNote.value = transaction.note || "";
    } else {
        setTransactionType("expense");
    }

    elements.modal.classList.add("active");
    elements.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => elements.transactionTitle.focus(), 120);
}

function closeModal() {
    if (!elements.modal) return;
    elements.modal.classList.remove("active");
    elements.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

/* =====================================================
   9. ADD OR EDIT TRANSACTION
===================================================== */

elements.transactionForm.addEventListener("submit", event => {
    event.preventDefault();

    const id = elements.transactionId.value;
    const type = elements.transactionType.value;
    const title = elements.transactionTitle.value.trim();
    const amount = Number(elements.transactionAmount.value);
    const category = elements.transactionCategory.value;
    const date = elements.transactionDate.value;
    const method = elements.transactionMethod.value;
    const note = elements.transactionNote.value.trim();

    const availableCategories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    if (
        !title || title.length > 60 ||
        !Number.isFinite(amount) || amount <= 0 || amount > Number.MAX_SAFE_INTEGER ||
        !date || date < FIRST_TRACKING_DATE ||
        !availableCategories.includes(category)
    ) {
        showToast("Please enter valid transaction details. Dates must be January 2026 or later.");
        return;
    }

    const existingIndex = state.transactions.findIndex(item => item.id === id);
    const existing = state.transactions[existingIndex];
    const transaction = {
        id: id || createId(),
        title,
        amount,
        type,
        category,
        date,
        method,
        note,
        createdAt: existing ? existing.createdAt : Date.now()
    };

    if (existingIndex !== -1) {
        state.transactions[existingIndex] = transaction;
    } else {
        state.transactions.push(transaction);
    }

    if (!saveData()) return;

    closeModal();
    renderAll();
    showToast(existingIndex !== -1
        ? "Transaction updated successfully!"
        : "Transaction added successfully!");
});

function editTransaction(id) {
    const transaction = state.transactions.find(item => item.id === id);
    if (!transaction) {
        showToast("Transaction not found.");
        return;
    }
    openModal(transaction);
}

function deleteTransaction(id) {
    const transaction = state.transactions.find(item => item.id === id);
    if (!transaction) return;

    if (!confirm(`Are you sure you want to delete "${transaction.title}"?`)) return;

    const previous = state.transactions;
    state.transactions = state.transactions.filter(item => item.id !== id);
    if (!saveData()) {
        state.transactions = previous;
        return;
    }

    renderAll();
    showToast("Transaction deleted successfully.");
}

/* =====================================================
   10. TRANSACTION TABLE MARKUP
===================================================== */

function transactionMarkup(transaction, showActions = false) {
    const isIncome = transaction.type === "income";
    const sign = isIncome ? "+" : "−";
    const amountClass = isIncome ? "amount-income" : "amount-expense";
    const safeId = escapeHTML(transaction.id);

    return `
        <tr>
            <td>
                <div class="transaction-name">
                    <div class="transaction-symbol">${getCategoryIcon(transaction.category)}</div>
                    <div>
                        ${escapeHTML(transaction.title)}
                        <small>${escapeHTML(transaction.method)}</small>
                    </div>
                </div>
            </td>
            <td>${escapeHTML(transaction.category)}</td>
            <td>${formatDate(transaction.date)}</td>
            <td class="${amountClass}">${sign}${formatCurrency(transaction.amount)}</td>
            <td><span class="type-pill ${transaction.type}">${isIncome ? "Income" : "Expense"}</span></td>
            ${showActions ? `
                <td>
                    <div class="action-buttons">
                        <button class="table-action" data-action="edit" data-id="${safeId}" aria-label="Edit transaction">✎</button>
                        <button class="table-action delete" data-action="delete" data-id="${safeId}" aria-label="Delete transaction">×</button>
                    </div>
                </td>
            ` : ""}
        </tr>
    `;
}

/* =====================================================
   11. TRANSACTION FILTERS
===================================================== */

function getAvailableMonths() {
    const months = [];
    const now = new Date();
    const start = new Date(2026, 0, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const date = new Date(start); date <= end; date.setMonth(date.getMonth() + 1)) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        months.push({
            key,
            label: date.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
        });
    }

    return months;
}

function updateFilterOptions() {
    const previousMonth = elements.monthFilter.value;
    const months = getAvailableMonths();

    elements.monthFilter.innerHTML = `
        <option value="all">All months</option>
        ${months.map(month => `<option value="${month.key}">${escapeHTML(month.label)}</option>`).join("")}
    `;
    elements.monthFilter.value = months.some(month => month.key === previousMonth)
        ? previousMonth
        : "all";

    const previousExpense = elements.expenseCategoryFilter.value;
    const previousIncome = elements.incomeCategoryFilter.value;

    elements.expenseCategoryFilter.innerHTML = `
        <option value="all">All expense categories</option>
        ${EXPENSE_CATEGORIES.map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("")}
    `;
    elements.incomeCategoryFilter.innerHTML = `
        <option value="all">All income categories</option>
        ${INCOME_CATEGORIES.map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("")}
    `;

    elements.expenseCategoryFilter.value = EXPENSE_CATEGORIES.includes(previousExpense)
        ? previousExpense
        : "all";
    elements.incomeCategoryFilter.value = INCOME_CATEGORIES.includes(previousIncome)
        ? previousIncome
        : "all";
}

function getFilteredTransactions() {
    const search = elements.searchInput.value.trim().toLowerCase();
    const month = elements.monthFilter.value;
    const expenseCategory = elements.expenseCategoryFilter.value;
    const incomeCategory = elements.incomeCategoryFilter.value;

    return getSortedTransactions(state.transactions.filter(transaction => {
        // The Transactions page begins at January 2026.
        if (transaction.date < FIRST_TRACKING_DATE) return false;

        const searchValues = [transaction.title, transaction.category, transaction.note, transaction.method];
        const matchesSearch = searchValues.some(value =>
            String(value || "").toLowerCase().includes(search)
        );
        const matchesMonth = month === "all" || getMonthKey(transaction.date) === month;
        const matchesCategory = transaction.type === "expense"
            ? expenseCategory === "all" || transaction.category === expenseCategory
            : incomeCategory === "all" || transaction.category === incomeCategory;

        return matchesSearch && matchesMonth && matchesCategory;
    }));
}

/* =====================================================
   12. RENDER TRANSACTION TABLES
===================================================== */

function renderTransactions() {
    const visibleTransactions = state.transactions.filter(transaction => transaction.date >= FIRST_TRACKING_DATE);
    const recent = getSortedTransactions(visibleTransactions).slice(0, 5);

    $("#recentTransactions").innerHTML = recent.length
        ? recent.map(transaction => transactionMarkup(transaction)).join("")
        : `
            <tr><td colspan="5">
                <div class="empty-state">
                    <span>◈</span>
                    <strong>No transactions yet</strong>
                    Add your first transaction from January 2026 onwards.
                </div>
            </td></tr>
        `;

    const filtered = getFilteredTransactions();
    $("#transactionCount").textContent = `${filtered.length} transaction(s) found`;
    $("#allTransactions").innerHTML = filtered.length
        ? filtered.map(transaction => transactionMarkup(transaction, true)).join("")
        : `
            <tr><td colspan="6">
                <div class="empty-state">
                    <span>⌕</span>
                    <strong>No matching transactions</strong>
                    Try changing your search or category filters.
                </div>
            </td></tr>
        `;
}

/* =====================================================
   13. CURRENT-YEAR MONTHS AND INCOME/EXPENSE BAR CHART
===================================================== */

function getYearToDateMonths() {
    const now = new Date();
    const year = now.getFullYear();
    const months = [];

    for (let monthIndex = 0; monthIndex <= now.getMonth(); monthIndex++) {
        const date = new Date(year, monthIndex, 1);
        const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
        months.push({
            key,
            label: date.toLocaleDateString("en-IN", { month: "short" }),
            fullLabel: date.toLocaleDateString("en-IN", { month: "long" })
        });
    }

    return months;
}

function renderYearlyComparisonChart(containerId) {
    const container = $(`#${containerId}`);
    if (!container) return;

    const year = getCurrentYear();
    const months = getYearToDateMonths();

    const chartData = months.map(month => {
        const transactions = getTransactionsByMonth(month.key);
        return {
            ...month,
            income: getTotal(transactions, "income"),
            expense: getTotal(transactions, "expense")
        };
    });

    const maximum = Math.max(
        ...chartData.flatMap(item => [item.income, item.expense]),
        1
    );

    container.style.setProperty("--month-count", String(chartData.length));
    container.innerHTML = chartData.map((item, index) => {
        const incomeHeight = item.income > 0 ? Math.max(2, (item.income / maximum) * 100) : 0;
        const expenseHeight = item.expense > 0 ? Math.max(2, (item.expense / maximum) * 100) : 0;

        return `
            <div class="bar-group" style="animation-delay:${index * 0.035}s">
                <div class="bar-pair">
                    <div class="bar-column" title="${escapeHTML(`${item.fullLabel} income: ${formatCurrency(item.income)}`)}">
                        <div class="bar-fill income-fill" style="height:${incomeHeight}%"></div>
                    </div>
                    <div class="bar-column" title="${escapeHTML(`${item.fullLabel} expenses: ${formatCurrency(item.expense)}`)}">
                        <div class="bar-fill expense-fill" style="height:${expenseHeight}%"></div>
                    </div>
                </div>
                <span class="bar-label">${escapeHTML(item.label)}</span>
            </div>
        `;
    }).join("");

    container.setAttribute(
        "aria-label",
        `${year} monthly income and expense chart. ` + chartData.map(item =>
            `${item.fullLabel}: income ${formatCurrency(item.income)}, expenses ${formatCurrency(item.expense)}`
        ).join("; ")
    );

    const rangeText = months.length
        ? `January–${months[months.length - 1].fullLabel} ${year}`
        : String(year);

    const dashboardDescription = $("#yearChartDescription");
    const dashboardBadge = $("#yearChartBadge");
    const analyticsDescription = $("#analyticsYearDescription");

    if (dashboardDescription) dashboardDescription.textContent = `Monthly comparison: ${rangeText}`;
    if (dashboardBadge) dashboardBadge.textContent = `${year} · YTD`;
    if (analyticsDescription) analyticsDescription.textContent = `Monthly income and expenses: ${rangeText}`;
}

/* =====================================================
   14. CATEGORY DOUGHNUT CHART
===================================================== */

function renderCategoryChart(donutId, totalId, legendId) {
    const donut = $(`#${donutId}`);
    const totalElement = $(`#${totalId}`);
    const legend = $(`#${legendId}`);
    if (!donut || !totalElement || !legend) return;

    const expenses = getTransactionsByMonth(getCurrentMonth())
        .filter(transaction => transaction.type === "expense");

    const categoryTotals = EXPENSE_CATEGORIES.map(category => {
        const amount = expenses
            .filter(transaction => transaction.category === category)
            .reduce((sum, transaction) => sum + transaction.amount, 0);

        return { category, amount, color: CATEGORY_META[category].color };
    }).filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount);

    const total = categoryTotals.reduce((sum, item) => sum + item.amount, 0);
    totalElement.textContent = formatCurrency(total);

    if (total === 0) {
        donut.style.background = "conic-gradient(var(--border) 0deg 360deg)";
        donut.setAttribute("aria-label", "No expense data available this month");
        legend.innerHTML = `
            <div class="empty-state">
                <strong>No spending data yet</strong>
                Add an expense to see your category breakdown.
            </div>
        `;
        return;
    }

    let angle = 0;
    const segments = categoryTotals.map(item => {
        const nextAngle = angle + (item.amount / total) * 360;
        const segment = `${item.color} ${angle}deg ${nextAngle}deg`;
        angle = nextAngle;
        return segment;
    });

    donut.style.background = `conic-gradient(${segments.join(", ")})`;
    donut.setAttribute("aria-label", categoryTotals.map(item =>
        `${item.category}: ${formatCurrency(item.amount)}`
    ).join(", "));

    legend.innerHTML = categoryTotals.map((item, index) => {
        const percentage = (item.amount / total) * 100;
        return `
            <div class="category-legend-item" style="animation-delay:${index * 0.05}s">
                <span class="category-legend-dot" style="background:${item.color}"></span>
                <span class="category-legend-name">
                    ${escapeHTML(item.category)}
                    <span class="category-legend-percent">${percentage.toFixed(1)}%</span>
                </span>
                <span class="category-legend-value">${formatCurrency(item.amount)}</span>
            </div>
        `;
    }).join("");
}

/* =====================================================
   15. DASHBOARD AND ANALYTICS
===================================================== */

function renderDashboard() {
    const allIncome = getTotal(state.transactions, "income");
    const allExpense = getTotal(state.transactions, "expense");
    const currentMonthTransactions = getTransactionsByMonth(getCurrentMonth());
    const monthlyIncome = getTotal(currentMonthTransactions, "income");
    const monthlyExpense = getTotal(currentMonthTransactions, "expense");

    $("#totalBalance").textContent = formatCurrency(allIncome - allExpense);
    $("#totalIncome").textContent = formatCurrency(monthlyIncome);
    $("#totalExpense").textContent = formatCurrency(monthlyExpense);
    $("#monthlySavings").textContent = formatCurrency(monthlyIncome - monthlyExpense);
    $("#currentDate").textContent = new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    renderYearlyComparisonChart("monthlyChart");
    renderCategoryChart("categoryDonut", "categoryDonutTotal", "categoryLegend");
}

function renderAnalytics() {
    renderYearlyComparisonChart("analyticsMonthlyChart");
    renderCategoryChart("analyticsDonut", "analyticsDonutTotal", "analyticsCategoryLegend");
    renderFinancialInsights();
}

function renderFinancialInsights() {
    const year = getCurrentYear();
    const yearTransactions = state.transactions.filter(transaction =>
        transaction.date.startsWith(`${year}-`)
    );
    const income = getTotal(yearTransactions, "income");
    const expense = getTotal(yearTransactions, "expense");
    const balance = income - expense;

    $("#financialInsights").innerHTML = `
        <div class="insight-grid">
            <div class="insight-item">
                <span>${year} Income</span>
                <strong style="color:var(--success)">${formatCurrency(income)}</strong>
            </div>
            <div class="insight-item">
                <span>${year} Expenses</span>
                <strong style="color:var(--danger)">${formatCurrency(expense)}</strong>
            </div>
            <div class="insight-item">
                <span>${year} Net Balance</span>
                <strong>${formatCurrency(balance)}</strong>
            </div>
        </div>
        <div class="insight-description">
            You have recorded <strong>${yearTransactions.length}</strong> transaction(s) this year.
        </div>
    `;
}

/* =====================================================
   16. MY ACCOUNT / PROFILE
===================================================== */

function renderProfile() {
    const name = state.profile.name.trim() || "My Account";
    const summary = state.profile.age
        ? `Age ${escapeHTML(state.profile.age)}`
        : "Personal workspace";

    if (elements.profileName) elements.profileName.textContent = name;
    if (elements.profileSummary) elements.profileSummary.textContent = summary;
}

function openProfileModal() {
    elements.profileNameInput.value = state.profile.name;
    elements.profileAgeInput.value = state.profile.age;
    elements.profileAboutInput.value = state.profile.about;
    elements.profileModal.classList.add("active");
    elements.profileModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => elements.profileNameInput.focus(), 120);
}

function closeProfileModal() {
    elements.profileModal.classList.remove("active");
    elements.profileModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

elements.profileForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = elements.profileNameInput.value.trim();
    const ageValue = elements.profileAgeInput.value.trim();
    const age = ageValue === "" ? "" : Number(ageValue);
    const about = elements.profileAboutInput.value.trim();

    if (name.length > 60 || (age !== "" && (!Number.isInteger(age) || age < 1 || age > 120)) || about.length > 300) {
        showToast("Please check your name, age, and about details.");
        return;
    }

    const previousProfile = state.profile;
    state.profile = { name, age: age === "" ? "" : String(age), about };

    if (!saveData()) {
        state.profile = previousProfile;
        return;
    }

    renderProfile();
    closeProfileModal();
    showToast("Your profile has been saved.");
});

/* =====================================================
   17. CSV EXPORT
===================================================== */

function exportCSV() {
    if (state.transactions.length === 0) {
        showToast("There are no transactions to export.");
        return;
    }

    const headers = ["Transaction Name", "Amount (INR)", "Type", "Category", "Date", "Payment Method", "Note"];

    function csvEscape(value) {
        let safeValue = String(value ?? "");
        if (/^[\s]*[=+\-@]/.test(safeValue)) safeValue = "'" + safeValue;
        return `"${safeValue.replace(/"/g, '""')}"`;
    }

    const rows = state.transactions.map(transaction => [
        transaction.title,
        transaction.amount,
        transaction.type,
        transaction.category,
        transaction.date,
        transaction.method,
        transaction.note
    ]);

    const csv = [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `myfinance-transactions-${getToday()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("CSV file exported successfully!");
}

/* =====================================================
   18. CLEAR ALL DATA
===================================================== */

function clearAllData() {
    if (!confirm("Are you sure you want to delete all transactions? This action cannot be undone.")) return;

    const previous = state.transactions;
    state.transactions = [];
    if (!saveData()) {
        state.transactions = previous;
        return;
    }

    renderAll();
    showView("dashboard");
    showToast("All financial data has been cleared.");
}

/* =====================================================
   19. RENDER ALL
===================================================== */

function renderAll() {
    updateFilterOptions();
    renderDashboard();
    renderTransactions();
    renderAnalytics();
    renderProfile();
}

/* =====================================================
   20. GLOBAL CLICK ACTIONS
===================================================== */

document.addEventListener("click", event => {
    const navButton = event.target.closest("[data-view]");
    if (navButton) {
        showView(navButton.dataset.view);
        return;
    }

    const viewLink = event.target.closest("[data-view-link]");
    if (viewLink) {
        showView(viewLink.dataset.viewLink);
        return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id;

    if (action === "add") openModal();
    if (action === "edit") editTransaction(id);
    if (action === "delete") deleteTransaction(id);
    if (action === "account") openProfileModal();
});

/* =====================================================
   21. FILTER, THEME, MODAL AND SETTINGS LISTENERS
===================================================== */

elements.searchInput.addEventListener("input", renderTransactions);
elements.monthFilter.addEventListener("change", renderTransactions);
elements.expenseCategoryFilter.addEventListener("change", renderTransactions);
elements.incomeCategoryFilter.addEventListener("change", renderTransactions);

elements.themeToggle.addEventListener("click", toggleTheme);

$("#closeModal").addEventListener("click", closeModal);
$("#cancelModal").addEventListener("click", closeModal);
elements.modal.addEventListener("click", event => {
    if (event.target === elements.modal) closeModal();
});

$("#closeProfileModal").addEventListener("click", closeProfileModal);
$("#cancelProfileModal").addEventListener("click", closeProfileModal);
elements.profileModal.addEventListener("click", event => {
    if (event.target === elements.profileModal) closeProfileModal();
});

elements.mobileMenuBtn.addEventListener("click", () => {
    elements.sidebar.classList.toggle("open");
});

$("#exportBtn").addEventListener("click", exportCSV);
$("#clearDataBtn").addEventListener("click", clearAllData);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeModal();
        closeProfileModal();
        elements.sidebar.classList.remove("open");
    }
});

/* =====================================================
   22. APPLICATION INITIALIZATION
===================================================== */

function initializeApp() {
    applyTheme(state.theme);
    setTransactionType("expense");
    renderAll();
    showView("dashboard");
    console.log("MyFinance initialized successfully.");
}

initializeApp();
