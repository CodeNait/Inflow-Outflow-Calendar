document.addEventListener("DOMContentLoaded", function() {
    const currentYear = new Date().getFullYear();
    const yearRange = { start: currentYear - 2, end: currentYear + 2 };
    const today = new Date();

    let selectedYear = today.getFullYear();
    let selectedMonth = today.getMonth();
    let invoices = loadInvoices() || [];
    let invoiceHistory = []; // History stack for undo functionality

    function updateDisplay() {
        document.getElementById('yearDisplay').textContent = selectedYear;
        document.getElementById('monthDisplay').textContent = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' });
        renderCalendar();
        calculateMonthlyTotal();
        applyMonthColor();
    }

    function renderCalendar() {
        const calendar = document.getElementById("calendar");
        calendar.innerHTML = '';

        const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        daysOfWeek.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.textContent = day;
            dayElement.classList.add('day-header');
            calendar.appendChild(dayElement);
        });

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day');
            calendar.appendChild(emptyDay);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.dataset.date = new Date(selectedYear, selectedMonth, day).toISOString().slice(0, 10);

            const dayNumber = document.createElement('div');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            const dailyInvoices = invoices.filter(invoice => invoice.date === dayElement.dataset.date);
            dailyInvoices.forEach(invoice => {
                const invoiceElement = document.createElement('div');
                invoiceElement.textContent = `${invoice.type === 'inflow' ? '+' : '-'}$${invoice.amount}`;
                invoiceElement.classList.add(invoice.type === 'inflow' ? 'inflow' : 'outflow');
                dayElement.appendChild(invoiceElement);
            });

            dayElement.addEventListener('click', function() {
                const rect = dayElement.getBoundingClientRect();
                const modalX = 50;
                const modalY = rect.top + window.pageYOffset - 150;

                showInvoiceForm(dayElement.dataset.date, modalX, modalY);
            });

            calendar.appendChild(dayElement);
        }
    }

    function applyMonthColor() {
        const calendarContainer = document.querySelector('.container');
        const monthClass = `month-${selectedMonth}`;
        calendarContainer.classList.remove(
            'month-0', 'month-1', 'month-2', 'month-3', 'month-4', 'month-5',
            'month-6', 'month-7', 'month-8', 'month-9', 'month-10', 'month-11'
        );
        calendarContainer.classList.add(monthClass);
    }

    function showInvoiceForm(date, x, y) {
        const invoiceModal = document.getElementById('invoiceModal');
        invoiceModal.style.display = 'block';
        document.getElementById('selectedDate').textContent = date;
        invoiceModal.dataset.date = date;

        const modalContent = document.querySelector('.modal-content');
        modalContent.style.left = `${x}px`;
        modalContent.style.top = `${y}px`;

        const closeButton = document.getElementById('closeModal');
        closeButton.style.left = '5px';
        closeButton.style.top = '5px';
    }

    function hideInvoiceForm() {
        const invoiceModal = document.getElementById('invoiceModal');
        invoiceModal.style.display = 'none';
        document.getElementById('invoiceForm').reset();
    }

    function addInvoice(event) {
        event.preventDefault();

        const date = document.getElementById('invoiceModal').dataset.date;
        const description = document.getElementById("description").value;
        const amount = parseFloat(document.getElementById("amount").value);
        const type = document.getElementById("type").value;

        const newInvoice = { date, description, amount, type };
        invoices.push(newInvoice);

        invoiceHistory.push({ action: 'add', invoice: newInvoice });

        saveInvoices(invoices);
        renderCalendar();
        hideInvoiceForm();
        calculateMonthlyTotal();
        applyMonthColor();
    }

    function calculateMonthlyTotal() {
        const inflows = invoices.reduce((total, invoice) => {
            return invoice.type === 'inflow' ? total + parseFloat(invoice.amount) : total;
        }, 0);

        const outflows = invoices.reduce((total, invoice) => {
            return invoice.type === 'outflow' ? total + parseFloat(invoice.amount) : total;
        }, 0);

        const monthlyTotal = inflows - outflows;
        document.getElementById('monthlyTotal').textContent = `$${monthlyTotal.toFixed(2)}`;
    }

    function saveInvoices(data) {
        localStorage.setItem('invoices', JSON.stringify(data));
    }

    function loadInvoices() {
        const data = localStorage.getItem('invoices');
        return data ? JSON.parse(data) : [];
    }

    function resetCalendar() {
        if (confirm("Are you sure you want to reset the calendar? This action cannot be undone.")) {
            invoices = [];
            invoiceHistory = [];
            saveInvoices(invoices);
            updateDisplay();
        }
    }

    function undoLastAction() {
        if (invoiceHistory.length > 0) {
            const lastAction = invoiceHistory.pop();
            if (lastAction.action === 'add') {
                invoices = invoices.filter(invoice => invoice !== lastAction.invoice);
            }
            saveInvoices(invoices);
            updateDisplay();
        } else {
            alert("No actions to undo.");
        }
    }

    function saveTitle() {
        const title = document.getElementById('editableTitle').innerText;
        document.getElementById('pageTitle').innerText = title;
        document.title = title; // Update <title> element
        localStorage.setItem('pageTitle', title); // Save title to localStorage
    }

    // Load saved title on page load
    document.getElementById('editableTitle').innerText = localStorage.getItem('pageTitle') || '5-Year Expense Tracker';
    saveTitle(); // Call saveTitle to update both display and localStorage

    // Update title when editableTitle changes
    document.getElementById('editableTitle').addEventListener('input', saveTitle);

    // Event listeners for navigation buttons
    document.getElementById("prevYear").addEventListener("click", () => {
        if (selectedYear > yearRange.start) {
            selectedYear--;
            updateDisplay();
        }
    });

    document.getElementById("nextYear").addEventListener("click", () => {
        if (selectedYear < yearRange.end) {
            selectedYear++;
            updateDisplay();
        }
    });

    document.getElementById("prevMonth").addEventListener("click", () => {
        if (selectedMonth > 0) {
            selectedMonth--;
        } else if (selectedYear > yearRange.start) {
            selectedMonth = 11;
            selectedYear--;
        }
        updateDisplay();
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
        if (selectedMonth < 11) {
            selectedMonth++;
        } else if (selectedYear < yearRange.end) {
            selectedMonth = 0;
            selectedYear++;
        }
        updateDisplay();
    });

    // Event listener for form submission
    document.getElementById("invoiceForm").addEventListener("submit", addInvoice);

    // Event listener to close modal
    document.getElementById("closeModal").addEventListener("click", hideInvoiceForm);

    // Event listener to reset calendar
    document.getElementById("resetCalendar").addEventListener("click", resetCalendar);

    // Event listener to undo last action
    document.getElementById("undoAction").addEventListener("click", undoLastAction);

    // Initial display update
    updateDisplay();
});
