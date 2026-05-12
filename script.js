let selectedBooks = [];
let tempBooks = [];

function byId(id) {
    return document.getElementById(id);
}

function setValue(id, value) {
    const element = byId(id);
    if (element) element.value = value;
}

function clearDashboardFields() {
    document.querySelectorAll(".content input").forEach(input => {
        if (input.type !== "file") input.value = "";
    });

    const issuedList = byId("issuedList");
    const issueList = byId("issueList");
    if (issuedList) issuedList.innerHTML = "";
    if (issueList) issueList.innerHTML = "";
    selectedBooks = [];
}

function setActiveNav(id) {
    document.querySelectorAll(".nav-list li").forEach(item => item.classList.remove("active"));
    const navText = {
        home: "Home",
        member: "Add Member",
        book: "Add Book",
        issue: "Issue Book",
        return: "Return Book",
        transaction: "Transactions",
        overdue: "Overdue",
        viewMembers: "View Members",
        viewBooks: "View Books"
    }[id];

    document.querySelectorAll(".nav-list li").forEach(item => {
        if (item.textContent.trim() === navText) item.classList.add("active");
    });
}

function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => {
        sec.style.display = "none";
    });

    clearDashboardFields();
    const section = byId(id);
    if (section) section.style.display = "block";
    setActiveNav(id);

    if (id === "home") loadDashboardStats();
    if (id === "viewMembers") loadMembers();
    if (id === "viewBooks") loadBooks();
    if (id === "transaction") getTransactions();
}

function addMember() {
    const name = byId("mname").value;
    const mobile = byId("mmobile").value;

    fetch("http://localhost:3000/addMember", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, mobile })
    })
    .then(res => res.json())
    .then(() => {
        alert("Member added successfully");
        setValue("mname", "");
        setValue("mmobile", "");
        setValue("mid", "");
        loadDashboardStats();
    });
}

function addBook() {
    const name = byId("bname").value;
    const author = byId("bauthor").value;
    const qty = byId("bqty").value;

    fetch("http://localhost:3000/addBook", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, author, qty })
    })
    .then(res => res.json())
    .then(() => {
        alert("Book added successfully");
        setValue("bname", "");
        setValue("bauthor", "");
        setValue("bqty", "");
        setValue("bid", "");
        loadDashboardStats();
    });
}

function issueBook() {
    const memberId = byId("issueMid").value;

    if (selectedBooks.length === 0) {
        alert("Add at least one book");
        return;
    }

    Promise.all(
        selectedBooks.map(bookId =>
            fetch("http://localhost:3000/issueBook", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ memberId, bookId })
            })
        )
    ).then(() => {
        alert("Books issued successfully");
        selectedBooks = [];
        byId("issueList").innerHTML = "";
        setValue("issueMid", "");
        setValue("memberName", "");
        setValue("memberMobile", "");
        loadDashboardStats();
    });
}

function handleMemberEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        fetchIssueMember();
    }
}

function handleBookEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        fetchIssueBook();
    }
}

function handleReturnMember(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        fetchReturnMember();
    }
}

function fetchIssueMember() {
    const id = byId("issueMid").value.trim();
    if (!id) return;

    fetch(`http://localhost:3000/member/${id}`)
    .then(res => res.json())
    .then(data => {
        setValue("memberName", data.name || "");
        setValue("memberMobile", data.mobile || "");
        if (!data.name) alert("Member not found");
    });
}

function fetchIssueBook() {
    const id = byId("issueBid").value.trim();
    if (!id) return;

    fetch(`http://localhost:3000/book/${id}`)
    .then(res => res.json())
    .then(data => {
        setValue("bookName", data.name || "");
        setValue("bookAuthor", data.author || "");
        setValue("bookQty", data.qty || "");
        if (!data.name) alert("Book not found");
    });
}

function fetchReturnMember() {
    const mid = byId("returnMid").value.trim();
    if (!mid) return;

    fetch(`http://localhost:3000/member/${mid}`)
    .then(res => res.json())
    .then(member => {
        setValue("rMemberName", member.name || "");
        if (!member.name) alert("Member not found");
    });

    loadIssuedBooks(mid);
}

function returnSelectedBooks() {
    const mid = byId("returnMid").value;

    if (selectedBooks.length === 0) {
        alert("Select at least one book");
        return;
    }

    fetch("http://localhost:3000/returnMultiple", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            memberId: mid,
            books: selectedBooks
        })
    }).then(() => {
        alert("Books returned");
        setValue("returnMid", "");
        setValue("rMemberName", "");
        byId("issuedList").innerHTML = "";
        selectedBooks = [];
        loadDashboardStats();
    });
}

function loadMembers() {
    fetch("http://localhost:3000/members")
    .then(res => res.json())
    .then(data => {
        const tbody = document.querySelector("#memberTable tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-row">No members found</td></tr>`;
            return;
        }

        data.forEach(m => {
            tbody.innerHTML += `<tr>
                <td>${m.id}</td>
                <td>${m.name}</td>
                <td>${m.mobile}</td>
                <td><button onclick="deleteMember('${m.id}')">Delete</button></td>
            </tr>`;
        });
    });
}

function loadBooks() {
    fetch("http://localhost:3000/books")
    .then(res => res.json())
    .then(data => {
        const tbody = document.querySelector("#bookTable tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No books found</td></tr>`;
            return;
        }

        data.forEach((b, i) => {
            tbody.innerHTML += `<tr>
                <td>${i + 1}</td>
                <td>${b.id}</td>
                <td>${b.name}</td>
                <td>${b.author}</td>
                <td>${b.qty}</td>
                <td><button onclick="deleteBook('${b.id}')">Delete</button></td>
            </tr>`;
        });
    });
}

function getTransactions() {
    const type = byId("filterType").value;
    const selectedDate = byId("dateFilter").value;

    fetch("http://localhost:3000/transactions")
    .then(res => res.json())
    .then(data => {
        let filtered = data;

        if (type) filtered = filtered.filter(t => t.status === type);

        if (selectedDate) {
            filtered = filtered.filter(t => {
                const d = new Date(t.date).toISOString().split("T")[0];
                return d === selectedDate;
            });
        }

        const tbody = document.querySelector("#transTable tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No transactions found</td></tr>`;
            return;
        }

        filtered.forEach((t, i) => {
            const statusClass = t.status === "returned" ? "status-returned" : "status-issued";
            tbody.innerHTML += `<tr>
                <td>${i + 1}</td>
                <td>${t.memberId}</td>
                <td>${t.bookId}</td>
                <td><span class="status-pill ${statusClass}">${t.status}</span></td>
                <td>${new Date(t.date).toLocaleString()}</td>
            </tr>`;
        });
    });
}

async function login(e) {
    e.preventDefault();

    const username = byId("username").value;
    const password = byId("password").value;

    const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
        window.location.href = "dashboard.html";
    } else {
        byId("error").innerText = "Invalid username or password";
    }
}

function togglePassword() {
    const pass = byId("password");
    const toggle = document.querySelector(".password-box button");

    if (!pass) return;

    pass.type = pass.type === "password" ? "text" : "password";
    if (toggle) toggle.innerText = pass.type === "password" ? "Show" : "Hide";
}

function addBookToList() {
    const bookId = byId("issueBid").value;

    if (!bookId) {
        alert("Enter Book ID");
        return;
    }

    selectedBooks.push(bookId);

    const li = document.createElement("li");
    li.innerText = bookId;
    byId("issueList").appendChild(li);

    setValue("issueBid", "");
    setValue("bookName", "");
    setValue("bookAuthor", "");
    setValue("bookQty", "");
}

function deleteMember(id) {
    if (!confirm("Are you sure you want to delete this member?")) return;

    fetch(`http://localhost:3000/deleteMember/${id}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(() => {
        alert("Member deleted");
        loadMembers();
        loadDashboardStats();
    });
}

function deleteBook(id) {
    if (!confirm("Are you sure you want to delete this book?")) return;

    fetch(`http://localhost:3000/deleteBook/${id}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(() => {
        alert("Book deleted");
        loadBooks();
        loadDashboardStats();
    });
}

function loadIssuedBooks(mid) {
    fetch("http://localhost:3000/transactions")
    .then(res => res.json())
    .then(data => {
        const list = byId("issuedList");
        list.innerHTML = "";
        selectedBooks = [];

        const issuedMap = {};

        data.forEach(t => {
            if (t.memberId == mid) {
                if (t.status === "issued") issuedMap[t.bookId] = true;
                if (t.status === "returned") delete issuedMap[t.bookId];
            }
        });

        const books = Object.keys(issuedMap);

        if (books.length === 0) {
            list.innerHTML = "<li>No record of issued book</li>";
            return;
        }

        books.forEach(bookId => {
            const li = document.createElement("li");
            li.innerText = bookId;

            li.onclick = function () {
                if (selectedBooks.includes(bookId)) {
                    selectedBooks = selectedBooks.filter(b => b !== bookId);
                    li.classList.remove("selected");
                } else {
                    selectedBooks.push(bookId);
                    li.classList.add("selected");
                }
            };

            list.appendChild(li);
        });
    });
}

function logout() {
    if (confirm("Are you sure you want to logout?")) {
        window.location.href = "login.html";
    }
}

function updateDateTime() {
    const element = byId("datetime");
    if (!element) return;

    element.innerText = new Date().toLocaleString();
}

function addBookToGrid() {
    const name = byId("bname").value;
    const author = byId("bauthor").value;
    const qty = byId("bqty").value;

    if (!name || !author || !qty) {
        alert("Fill all fields");
        return;
    }

    tempBooks.push({ name, author, qty });
    renderBookGrid();

    setValue("bname", "");
    setValue("bauthor", "");
    setValue("bqty", "");
}

function renderBookGrid() {
    const tbody = document.querySelector("#bookGrid tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    tempBooks.forEach((b, i) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${b.name}</td>
            <td>${b.author}</td>
            <td>${b.qty}</td>
            <td>
                <button onclick="editBook(${i})">Edit</button>
                <button onclick="removeBook(${i})">Delete</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function removeBook(index) {
    tempBooks.splice(index, 1);
    renderBookGrid();
}

function saveAllBooks() {
    if (tempBooks.length === 0) {
        alert("No books to save");
        return;
    }

    Promise.all(
        tempBooks.map(book =>
            fetch("http://localhost:3000/addBook", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(book)
            })
        )
    ).then(() => {
        alert("All books added successfully");
        tempBooks = [];
        renderBookGrid();
        loadDashboardStats();
    });
}

function editBook(index) {
    const book = tempBooks[index];

    setValue("bname", book.name);
    setValue("bauthor", book.author);
    setValue("bqty", book.qty);

    tempBooks.splice(index, 1);
    renderBookGrid();
}

async function uploadExcel() {
    const fileInput = byId("excelFile");
    const file = fileInput ? fileInput.files[0] : null;

    if (!file) {
        showToast("Please select Excel file", "error");
        return;
    }

    await refreshData();
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        let added = 0;
        let skipped = 0;

        json.forEach(row => {
            const name = String(row.Name || row.name || "").trim();
            const author = String(row.Author || row.author || "").trim();
            const qty = row.Qty ?? row.qty;

            if (!name || !author || !isValidQty(qty)) {
                skipped++;
                return;
            }

            const book = { name, author, qty: Number(qty) };
            const existsInList = tempBooks.some(item => sameBook(item, book));
            const existsInStock = appData.books.some(item => sameBook(item, book));

            if (existsInList || existsInStock) {
                skipped++;
                return;
            }

            tempBooks.push(book);
            added++;
        });

        renderBookGrid();
        showToast(`Excel loaded: ${added} added${skipped ? `, ${skipped} skipped` : ""}`);
    };

    reader.readAsArrayBuffer(file);
}

function loadDashboardStats() {
    if (!byId("totalBooks")) return;

    Promise.all([
        fetch("http://localhost:3000/books").then(res => res.json()).catch(() => []),
        fetch("http://localhost:3000/members").then(res => res.json()).catch(() => []),
        fetch("http://localhost:3000/transactions").then(res => res.json()).catch(() => [])
    ]).then(([books, members, transactions]) => {
        byId("totalBooks").innerText = books.length;
        byId("totalMembers").innerText = members.length;
        byId("totalTransactions").innerText = transactions.length;
    });
}

function getVisibleSection() {
    return Array.from(document.querySelectorAll(".section"))
        .find(section => section.style.display !== "none");
}

function getSectionFocusables() {
    const section = getVisibleSection();
    if (!section) return [];

    return Array.from(section.querySelectorAll("input, select, textarea, button"))
        .filter(element => {
            const style = window.getComputedStyle(element);
            return !element.disabled &&
                element.type !== "hidden" &&
                element.type !== "file" &&
                style.display !== "none" &&
                style.visibility !== "hidden";
        });
}

function moveFormFocus(direction) {
    const focusables = getSectionFocusables();
    const active = document.activeElement;
    const index = focusables.indexOf(active);

    if (index === -1) return false;

    const nextIndex = Math.max(0, Math.min(index + direction, focusables.length - 1));
    if (nextIndex === index) return true;

    focusables[nextIndex].focus();
    return true;
}

function handleFormNavigation(e) {
    const active = document.activeElement;
    const isFormField = active && (
        active.tagName === "INPUT" ||
        active.tagName === "SELECT" ||
        active.tagName === "TEXTAREA"
    );

    if (!isFormField || !active.closest(".content")) return;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopImmediatePropagation();
        moveFormFocus(1);
        return;
    }

    if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopImmediatePropagation();
        moveFormFocus(-1);
        return;
    }

    if (e.key !== "Enter") return;

    const actionByField = {
        mmobile: addMember,
        bqty: addBookToGrid,
        bookQty: issueBook,
        issueMid: fetchIssueMember,
        issueBid: fetchIssueBook,
        returnMid: fetchReturnMember
    };

    e.preventDefault();
    e.stopImmediatePropagation();

    if (actionByField[active.id]) {
        actionByField[active.id]();
    }

    if (!["mmobile", "bqty", "bookQty"].includes(active.id)) {
        moveFormFocus(1);
    }
}

function bindDashboardEvents() {
    const mmobile = byId("mmobile");
    const bqty = byId("bqty");
    const bookQty = byId("bookQty");

    document.addEventListener("keydown", handleFormNavigation, true);

    if (mmobile) {
        mmobile.addEventListener("keydown", function(e) {
            if (e.key === "Enter") e.preventDefault();
        });
    }

    if (bqty) {
        bqty.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                addBookToGrid();
            }
        });
    }

    if (bookQty) {
        bookQty.addEventListener("keydown", function(e) {
            if (e.key === "Enter") e.preventDefault();
        });
    }

    document.addEventListener("keydown", function(e) {
        if (!byId("return")) return;

        if (e.key !== "Enter") return;

        const active = document.activeElement;
        const returnSectionVisible = byId("return").style.display === "block";

        if (active.id === "returnMid") {
            handleReturnMember(e);
            e.preventDefault();
            return;
        }

        if (returnSectionVisible && selectedBooks.length > 0) {
            returnSelectedBooks();
            e.preventDefault();
        }
    });
}

document.addEventListener("DOMContentLoaded", function() {
    bindDashboardEvents();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    loadDashboardStats();
});

// ================= ENHANCED SYSTEM FEATURES =================
var appData = { books: [], members: [], transactions: [], reports: {}, overdue: [] };
var confirmResolver = null;
var currentEdit = null;
const FINE_PER_DAY = 5;

function getValue(id) {
    const element = byId(id);
    return element ? element.value.trim() : "";
}

function apiGet(path) {
    return fetch(`http://localhost:3000${path}`).then(res => res.json());
}

function apiSend(path, method, body) {
    return fetch(`http://localhost:3000${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    }).then(res => res.json());
}

function getApiMessage(result, fallback) {
    return result && (result.message || result.msg || result.error) ? (result.message || result.msg || result.error) : fallback;
}

function isApiFailure(result) {
    return result && result.success === false;
}

function sameBook(first, second) {
    return String(first.name || "").trim().toLowerCase() === String(second.name || "").trim().toLowerCase() &&
        String(first.author || "").trim().toLowerCase() === String(second.author || "").trim().toLowerCase();
}

function showToast(message, type = "success") {
    const host = byId("toastHost");
    if (!host) {
        alert(message);
        return;
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    host.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 20);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 250);
    }, 2600);
}

async function refreshData() {
    const [books, members, transactions, reports, overdue] = await Promise.all([
        apiGet("/books").catch(() => []),
        apiGet("/members").catch(() => []),
        apiGet("/transactions").catch(() => []),
        apiGet("/reports/summary").catch(() => ({})),
        apiGet("/overdue").catch(() => [])
    ]);
    appData = { books, members, transactions, reports, overdue };
    populateSuggestions();
    await updateIdPreviews();
}

async function updateIdPreviews() {
    const ids = await apiGet("/nextIds").catch(() => ({}));
    if (byId("mid") && !getValue("mid")) setValue("mid", ids.memberId || nextLocalId("M", appData.members));
    if (byId("bid") && !getValue("bid")) setValue("bid", ids.bookId || nextLocalId("B", appData.books));
}

function nextLocalId(prefix, rows) {
    const max = rows.reduce((highest, item) => {
        const number = parseInt(String(item.id || "").replace(prefix, ""), 10);
        return Number.isFinite(number) ? Math.max(highest, number) : highest;
    }, 0);
    return prefix + String(max + 1).padStart(3, "0");
}

function populateSuggestions() {
    const members = byId("memberSuggestions");
    const books = byId("bookSuggestions");
    if (members) {
        members.innerHTML = appData.members.map(m =>
            `<option value="${m.id}">${m.name || ""} ${m.mobile || ""}</option>`
        ).join("");
    }
    if (books) {
        books.innerHTML = appData.books.map(b =>
            `<option value="${b.id}">${b.name || ""} ${b.author || ""}</option>`
        ).join("");
    }
}

function setDefaultDueDate() {
    const due = byId("dueDate");
    if (!due) return;
    const d = new Date();
    d.setDate(d.getDate() + 14);
    due.value = d.toISOString().split("T")[0];
}

async function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
    clearDashboardFields();
    const section = byId(id);
    if (section) section.style.display = "block";
    setActiveNav(id);
    await refreshData();
    if (id === "home") renderDashboard();
    if (id === "member" || id === "book") updateIdPreviews();
    if (id === "viewMembers") loadMembers();
    if (id === "viewBooks") loadBooks();
    if (id === "transaction") getTransactions();
    if (id === "overdue") loadOverdue();
}

function clearDashboardFields() {
    document.querySelectorAll(".content input").forEach(input => {
        if (input.type !== "file" && !["memberSearch", "bookSearch", "bookStatusFilter", "transactionSearch", "dateFilter", "overdueSearch"].includes(input.id)) {
            input.value = "";
        }
    });
    const issuedList = byId("issuedList");
    const issueList = byId("issueList");
    if (issuedList) issuedList.innerHTML = "";
    if (issueList) issueList.innerHTML = "";
    selectedBooks = [];
    setDefaultDueDate();
}

function clearFields(ids) {
    ids.forEach(id => setValue(id, ""));
}

function clearIssueForm() {
    clearFields(["issueMid", "memberName", "memberMobile", "issueBid", "bookName", "bookAuthor", "bookQty"]);
    const issueList = byId("issueList");
    if (issueList) issueList.innerHTML = "";
    selectedBooks = [];
    setDefaultDueDate();
}

function clearReturnForm() {
    clearFields(["returnMid", "rMemberName"]);
    const issuedList = byId("issuedList");
    if (issuedList) issuedList.innerHTML = "";
    selectedBooks = [];
}

function clearBookForm() {
    clearFields(["bname", "bauthor", "bqty"]);
    const excelFile = byId("excelFile");
    if (excelFile) excelFile.value = "";
    updateIdPreviews();
}

function isValidMobile(value) {
    return /^[0-9]{10}$/.test(value);
}

function isValidQty(value) {
    return Number.isInteger(Number(value)) && Number(value) >= 0;
}

function getActiveIssues() {
    const open = {};
    appData.transactions.forEach(t => {
        const key = `${t.memberId}-${t.bookId}`;
        if (t.status === "issued") open[key] = t;
        if (t.status === "returned") delete open[key];
    });
    return Object.values(open);
}

async function addMember() {
    const name = getValue("mname");
    const mobile = getValue("mmobile");
    if (!name || !mobile) {
        showToast("Enter member name and mobile", "error");
        return;
    }
    if (!isValidMobile(mobile)) {
        showToast("Mobile number must be 10 digits", "error");
        return;
    }
    const result = await apiSend("/addMember", "POST", { name, mobile });
    if (isApiFailure(result)) {
        showToast(getApiMessage(result, "Member could not be added"), "error");
        return;
    }
    showToast("Member added successfully");
    clearFields(["mid", "mname", "mmobile"]);
    await refreshData();
    updateIdPreviews();
    renderDashboard();
}

function addBookToGrid() {
    const name = getValue("bname");
    const author = getValue("bauthor");
    const qty = getValue("bqty");
    if (!name || !author || !qty) {
        showToast("Fill all book fields", "error");
        return;
    }
    if (!isValidQty(qty)) {
        showToast("Quantity must be 0 or more", "error");
        return;
    }
    if (tempBooks.some(book => sameBook(book, { name, author }))) {
        showToast("This book is already in the save list", "error");
        return;
    }
    if (appData.books.some(book => sameBook(book, { name, author }))) {
        showToast("This book already exists in inventory", "error");
        return;
    }
    tempBooks.push({ name, author, qty: Number(qty) });
    renderBookGrid();
    clearBookForm();
}

function renderBookGrid() {
    const tbody = document.querySelector("#bookGrid tbody");
    if (!tbody) return;
    if (tempBooks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No books added to save list</td></tr>`;
        return;
    }
    tbody.innerHTML = tempBooks.map((b, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${b.name}</td>
            <td>${b.author}</td>
            <td>${b.qty}</td>
            <td class="action-cell">
                <button class="mini-button edit-button" onclick="editBook(${i})">Edit</button>
                <button class="mini-button danger-button" onclick="removeBook(${i})">Delete</button>
            </td>
        </tr>
    `).join("");
}

async function saveAllBooks() {
    if (tempBooks.length === 0) {
        showToast("No books to save", "error");
        return;
    }
    await refreshData();
    const duplicate = tempBooks.find(book => appData.books.some(existing => sameBook(existing, book)));
    if (duplicate) {
        showToast(`${duplicate.name} already exists in inventory`, "error");
        tempBooks = tempBooks.filter(book => !appData.books.some(existing => sameBook(existing, book)));
        renderBookGrid();
        return;
    }
    const results = await Promise.all(tempBooks.map(book => apiSend("/addBook", "POST", book)));
    const failed = results.find(result => isApiFailure(result));
    if (failed) {
        showToast(getApiMessage(failed, "Some books could not be saved"), "error");
        await refreshData();
        tempBooks = tempBooks.filter(book => !appData.books.some(existing => sameBook(existing, book)));
        renderBookGrid();
        return;
    }
    tempBooks = [];
    renderBookGrid();
    clearBookForm();
    await refreshData();
    updateIdPreviews();
    renderDashboard();
    showToast("All books added successfully");
}

async function fetchIssueMember() {
    const id = getValue("issueMid");
    if (!id) return;
    const member = await apiGet(`/member/${id}`);
    setValue("memberName", member.name || "");
    setValue("memberMobile", member.mobile || "");
    showToast(member.name ? "Member loaded" : "Member not found", member.name ? "success" : "error");
}

async function fetchIssueBook() {
    const id = getValue("issueBid");
    if (!id) return;
    const book = await apiGet(`/book/${id}`);
    setValue("bookName", book.name || "");
    setValue("bookAuthor", book.author || "");
    setValue("bookQty", book.qty ?? "");
    if (!book.name) {
        showToast("Book not found", "error");
        return;
    }
    showToast(Number(book.qty || 0) > 0 ? "Book loaded" : "Book is out of stock", Number(book.qty || 0) > 0 ? "success" : "error");
}

async function fetchReturnMember() {
    const id = getValue("returnMid");
    if (!id) return;
    const member = await apiGet(`/member/${id}`);
    setValue("rMemberName", member.name || "");
    showToast(member.name ? "Member loaded" : "Member not found", member.name ? "success" : "error");
    loadIssuedBooks(id);
}

function addBookToList() {
    const bookId = getValue("issueBid");
    const memberId = getValue("issueMid");
    const book = appData.books.find(b => b.id === bookId);
    if (!memberId || !getValue("memberName")) {
        showToast("Load a valid member before adding books", "error");
        return;
    }
    if (!book) {
        showToast("Enter a valid Book ID", "error");
        return;
    }
    if (Number(book.qty || 0) <= 0) {
        showToast("This book is out of stock", "error");
        return;
    }
    if (selectedBooks.includes(bookId)) {
        showToast("Book already added", "error");
        return;
    }
    const alreadyIssued = getActiveIssues().some(issue => issue.memberId === memberId && issue.bookId === bookId);
    if (alreadyIssued) {
        showToast("This member already has this book issued", "error");
        return;
    }
    selectedBooks.push(bookId);
    const li = document.createElement("li");
    li.innerHTML = `<strong>${bookId}</strong> ${book.name || ""}`;
    byId("issueList").appendChild(li);
    setValue("issueBid", "");
    setValue("bookName", "");
    setValue("bookAuthor", "");
    setValue("bookQty", "");
}

async function issueBook() {
    const memberId = getValue("issueMid");
    const dueDate = getValue("dueDate");
    if (!memberId || selectedBooks.length === 0) {
        showToast("Enter member and add at least one book", "error");
        return;
    }
    if (!getValue("memberName")) {
        showToast("Find a valid member before issuing", "error");
        return;
    }
    if (!dueDate) {
        showToast("Select a due date", "error");
        return;
    }
    await refreshData();
    const duplicateIssue = selectedBooks.find(bookId =>
        getActiveIssues().some(issue => issue.memberId === memberId && issue.bookId === bookId)
    );
    if (duplicateIssue) {
        showToast("This member already has one selected book issued", "error");
        return;
    }
    const unavailable = selectedBooks
        .map(bookId => appData.books.find(b => b.id === bookId))
        .find(book => !book || Number(book.qty || 0) <= 0);
    if (unavailable) {
        showToast(`${unavailable.name || "Selected book"} is out of stock`, "error");
        return;
    }
    const results = await Promise.all(selectedBooks.map(bookId =>
        apiSend("/issueBook", "POST", { memberId, bookId, dueDate })
    ));
    const failed = results.find(result => isApiFailure(result));
    if (failed) {
        showToast(getApiMessage(failed, "Book is not available"), "error");
        await refreshData();
        renderDashboard();
        return;
    }
    selectedBooks = [];
    byId("issueList").innerHTML = "";
    clearIssueForm();
    showToast("Books issued successfully");
    await refreshData();
    renderDashboard();
}

function calculateFine(dueDate, returnDate = new Date()) {
    if (!dueDate) return 0;
    const lateDays = Math.ceil((new Date(returnDate) - new Date(dueDate)) / 86400000);
    return lateDays > 0 ? lateDays * FINE_PER_DAY : 0;
}

async function returnSelectedBooks() {
    const memberId = getValue("returnMid");
    if (!memberId || selectedBooks.length === 0) {
        showToast("Select at least one issued book", "error");
        return;
    }
    const result = await apiSend("/returnMultiple", "POST", { memberId, books: selectedBooks });
    if (isApiFailure(result)) {
        showToast(result.message || "No active issued books selected", "error");
        await refreshData();
        renderDashboard();
        return;
    }
    showToast(`Books returned${result.totalFine ? `. Fine: Rs. ${result.totalFine}` : ""}`);
    clearReturnForm();
    await refreshData();
    renderDashboard();
}

function loadIssuedBooks(mid) {
    const list = byId("issuedList");
    if (!list) return;
    selectedBooks = [];
    const open = {};
    appData.transactions.forEach(t => {
        const key = `${t.memberId}-${t.bookId}`;
        if (t.memberId == mid && t.status === "issued") open[key] = t;
        if (t.memberId == mid && t.status === "returned") delete open[key];
    });
    const rows = Object.values(open);
    if (rows.length === 0) {
        list.innerHTML = "<li>No active issued books</li>";
        return;
    }
    list.innerHTML = "";
    rows.forEach(t => {
        const book = appData.books.find(b => b.id === t.bookId);
        const fine = calculateFine(t.dueDate);
        const li = document.createElement("li");
        li.innerHTML = `<strong>${t.bookId}</strong> ${book ? book.name : ""}<span>Due: ${formatDateOnly(t.dueDate)} | Fine: Rs. ${fine}</span>`;
        li.onclick = function () {
            if (selectedBooks.includes(t.bookId)) {
                selectedBooks = selectedBooks.filter(id => id !== t.bookId);
                li.classList.remove("selected");
            } else {
                selectedBooks.push(t.bookId);
                li.classList.add("selected");
            }
        };
        list.appendChild(li);
    });
}

function getBookStatus(book) {
    const qty = Number(book.qty || 0);
    if (qty <= 0) return { label: "Out of Stock", className: "status-out" };
    if (qty <= 2) return { label: "Low Stock", className: "status-low" };
    return { label: "Available", className: "status-available" };
}

function loadBooks() {
    const tbody = document.querySelector("#bookTable tbody");
    if (!tbody) return;
    const q = getValue("bookSearch").toLowerCase();
    const statusFilter = getValue("bookStatusFilter");
    const rows = appData.books.filter(b => {
        const status = getBookStatus(b).label;
        const matchesSearch = [b.id, b.name, b.author, status].some(v => String(v || "").toLowerCase().includes(q));
        const matchesStatus = !statusFilter || status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    tbody.innerHTML = rows.length ? rows.map((b, i) => {
        const status = getBookStatus(b);
        return `<tr>
            <td>${i + 1}</td><td>${b.id}</td><td>${b.name}</td><td>${b.author || ""}</td><td>${b.qty}</td>
            <td><span class="status-pill ${status.className}">${status.label}</span></td>
            <td class="action-cell">
                <button class="mini-button" onclick="showBookDetails('${b.id}')">View</button>
                <button class="mini-button edit-button" onclick='openEditModal("book", ${JSON.stringify(b)})'>Edit</button>
                <button class="mini-button danger-button" onclick="deleteBook('${b.id}')">Delete</button>
            </td>
        </tr>`;
    }).join("") : `<tr><td colspan="7" class="empty-row">No books found</td></tr>`;
}

function loadMembers() {
    const tbody = document.querySelector("#memberTable tbody");
    if (!tbody) return;
    const q = getValue("memberSearch").toLowerCase();
    const activeIssues = getActiveIssues();
    const rows = appData.members.filter(m => {
        const issuedCount = activeIssues.filter(issue => issue.memberId === m.id).length;
        return [m.id, m.name, m.mobile, issuedCount].some(v => String(v || "").toLowerCase().includes(q));
    });
    tbody.innerHTML = rows.length ? rows.map(m => `<tr>
        <td>${m.id}</td><td>${m.name}</td><td>${m.mobile || ""}</td>
        <td><span class="count-pill">${activeIssues.filter(issue => issue.memberId === m.id).length}</span></td>
        <td class="action-cell">
            <button class="mini-button" onclick="showMemberDetails('${m.id}')">View</button>
            <button class="mini-button edit-button" onclick='openEditModal("member", ${JSON.stringify(m)})'>Edit</button>
            <button class="mini-button danger-button" onclick="deleteMember('${m.id}')">Delete</button>
        </td>
    </tr>`).join("") : `<tr><td colspan="5" class="empty-row">No members found</td></tr>`;
}

function getTransactions() {
    const tbody = document.querySelector("#transTable tbody");
    if (!tbody) return;
    const type = getValue("filterType");
    const date = getValue("dateFilter");
    const q = getValue("transactionSearch").toLowerCase();
    let rows = appData.transactions;
    if (type) rows = rows.filter(t => t.status === type);
    if (date) rows = rows.filter(t => new Date(t.date).toISOString().split("T")[0] === date);
    if (q) rows = rows.filter(t => [t.memberId, memberName(t.memberId), t.bookId, bookName(t.bookId), t.status, t.dueDate].some(v => String(v || "").toLowerCase().includes(q)));
    tbody.innerHTML = rows.length ? rows.map((t, i) => {
        const statusClass = t.status === "returned" ? "status-returned" : "status-issued";
        return `<tr>
            <td>${i + 1}</td><td>${t.memberId}</td><td>${t.bookId}</td>
            <td><span class="status-pill ${statusClass}">${t.status}</span></td>
            <td>${formatDateOnly(t.dueDate)}</td><td>Rs. ${Number(t.fine || 0)}</td>
            <td>${new Date(t.date).toLocaleString()}</td>
        </tr>`;
    }).join("") : `<tr><td colspan="7" class="empty-row">No transactions found</td></tr>`;
}

function loadOverdue() {
    const tbody = document.querySelector("#overdueTable tbody");
    if (!tbody) return;
    const q = getValue("overdueSearch").toLowerCase();
    const rows = appData.overdue.filter(row =>
        [row.memberId, row.memberName, row.mobile, row.bookId, row.bookName, row.dueDate, row.fine]
            .some(value => String(value || "").toLowerCase().includes(q))
    );

    tbody.innerHTML = rows.length ? rows.map(row => `
        <tr>
            <td>${row.memberId}</td>
            <td>${row.memberName || "-"}</td>
            <td>${row.mobile || "-"}</td>
            <td>${row.bookId}</td>
            <td>${row.bookName || "-"}</td>
            <td>${formatDateOnly(row.dueDate)}</td>
            <td>Rs. ${Number(row.fine || 0)}</td>
        </tr>
    `).join("") : `<tr><td colspan="7" class="empty-row">No overdue books</td></tr>`;
}

function formatDateOnly(value) {
    return value ? new Date(value).toLocaleDateString() : "-";
}

function renderDashboard() {
    if (!byId("totalBooks")) return;
    byId("totalBooks").innerText = appData.books.length;
    byId("totalMembers").innerText = appData.members.length;
    byId("totalTransactions").innerText = appData.transactions.length;
    if (byId("totalOverdue")) byId("totalOverdue").innerText = (appData.reports && appData.reports.overdueCount) || appData.overdue.length || 0;
    renderCharts();
}

async function loadDashboardStats() {
    await refreshData();
    renderDashboard();
}

function renderCharts() {
    const issued = appData.transactions.filter(t => t.status === "issued").length;
    const returned = appData.transactions.filter(t => t.status === "returned").length;
    const total = Math.max(issued + returned, 1);
    const issuedPercent = Math.round((issued / total) * 100);
    const donut = byId("statusDonut");
    if (donut) {
        donut.style.background = `conic-gradient(#2454d6 0 ${issuedPercent}%, #0f766e ${issuedPercent}% 100%)`;
        donut.innerHTML = `<span>${issuedPercent}%<small>issued</small></span>`;
    }
    if (byId("chartSummary")) byId("chartSummary").textContent = `${issued} / ${returned}`;
    const availability = {
        available: appData.books.filter(b => Number(b.qty || 0) > 2).length,
        low: appData.books.filter(b => Number(b.qty || 0) > 0 && Number(b.qty || 0) <= 2).length,
        out: appData.books.filter(b => Number(b.qty || 0) <= 0).length
    };
    if (byId("availabilitySummary")) byId("availabilitySummary").textContent = `${availability.available} available`;
    if (byId("availabilityChart")) {
        byId("availabilityChart").innerHTML = `
            <div><span>Available</span><strong>${availability.available}</strong></div>
            <div><span>Low Stock</span><strong>${availability.low}</strong></div>
            <div><span>Out</span><strong>${availability.out}</strong></div>`;
    }
    const counts = {};
    appData.transactions.filter(t => t.status === "issued").forEach(t => counts[t.bookId] = (counts[t.bookId] || 0) + 1);
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const max = Math.max(...top.map(([, c]) => c), 1);
    if (byId("topBooksChart")) {
        byId("topBooksChart").innerHTML = top.length ? top.map(([id, c]) => `
            <div class="bar-row"><span>${bookName(id) || id}</span><div><b style="width:${Math.max((c / max) * 100, 8)}%"></b></div><strong>${c}</strong></div>
        `).join("") : `<p class="empty-row">No issue activity yet</p>`;
    }
}

function bookName(id) {
    const b = appData.books.find(book => book.id === id);
    return b ? b.name : "";
}

function memberName(id) {
    const m = appData.members.find(member => member.id === id);
    return m ? m.name : "";
}

function showMemberDetails(id) {
    const member = appData.members.find(m => m.id === id);
    const history = appData.transactions.filter(t => t.memberId === id);
    openDetailModal(`<p class="eyebrow">Member Profile</p><h2>${member.name}</h2>
        <div class="detail-grid"><span>ID<strong>${member.id}</strong></span><span>Mobile<strong>${member.mobile || "-"}</strong></span><span>Transactions<strong>${history.length}</strong></span></div>
        <h3>History</h3>${history.map(t => `<p class="detail-line">${t.bookId} - ${t.status} - ${new Date(t.date).toLocaleString()}</p>`).join("") || "<p>No history yet.</p>"}`);
}

function showBookDetails(id) {
    const book = appData.books.find(b => b.id === id);
    const history = appData.transactions.filter(t => t.bookId === id);
    openDetailModal(`<p class="eyebrow">Book Detail</p><h2>${book.name}</h2>
        <div class="detail-grid"><span>ID<strong>${book.id}</strong></span><span>Author<strong>${book.author || "-"}</strong></span><span>Quantity<strong>${book.qty}</strong></span><span>Status<strong>${getBookStatus(book).label}</strong></span></div>
        <h3>History</h3>${history.map(t => `<p class="detail-line">${t.memberId} - ${t.status} - ${new Date(t.date).toLocaleString()}</p>`).join("") || "<p>No history yet.</p>"}`);
}

function openDetailModal(html) {
    if (!byId("detailModal")) return;
    byId("detailContent").innerHTML = html;
    byId("detailModal").classList.add("open");
}

function closeDetailModal() {
    if (byId("detailModal")) byId("detailModal").classList.remove("open");
}

function openEditModal(type, record) {
    currentEdit = { type, id: record.id };
    byId("editEyebrow").textContent = type === "book" ? "Inventory" : "Member";
    byId("editTitle").textContent = type === "book" ? "Edit Book" : "Edit Member";
    byId("editFields").innerHTML = type === "book"
        ? `<label>Book Name</label><input id="editName" value="${record.name || ""}"><label>Author</label><input id="editAuthor" value="${record.author || ""}"><label>Quantity</label><input id="editQty" type="number" value="${record.qty || 0}">`
        : `<label>Name</label><input id="editName" value="${record.name || ""}"><label>Mobile</label><input id="editMobile" value="${record.mobile || ""}">`;
    byId("editModal").classList.add("open");
}

function closeEditModal() {
    byId("editModal").classList.remove("open");
    currentEdit = null;
}

async function saveEdit() {
    if (!currentEdit) return;
    if (currentEdit.type === "book") {
        const result = await apiSend(`/book/${currentEdit.id}`, "PUT", { name: getValue("editName"), author: getValue("editAuthor"), qty: Number(getValue("editQty") || 0) });
        if (isApiFailure(result)) {
            showToast(getApiMessage(result, "Book could not be updated"), "error");
            return;
        }
        showToast("Book updated");
        closeEditModal();
        await refreshData();
        loadBooks();
    } else {
        const result = await apiSend(`/member/${currentEdit.id}`, "PUT", { name: getValue("editName"), mobile: getValue("editMobile") });
        if (isApiFailure(result)) {
            showToast(getApiMessage(result, "Member could not be updated"), "error");
            return;
        }
        showToast("Member updated");
        closeEditModal();
        await refreshData();
        loadMembers();
    }
    renderDashboard();
}

function openConfirm(title, message) {
    if (!byId("confirmModal")) return Promise.resolve(confirm(message));
    byId("confirmTitle").textContent = title;
    byId("confirmMessage").textContent = message;
    byId("confirmModal").classList.add("open");
    return new Promise(resolve => confirmResolver = resolve);
}

function closeConfirm(result) {
    byId("confirmModal").classList.remove("open");
    if (confirmResolver) confirmResolver(result);
    confirmResolver = null;
}

async function deleteMember(id) {
    if (!(await openConfirm("Delete member?", "This will remove the member record."))) return;
    const result = await apiSend(`/deleteMember/${id}`, "DELETE", {});
    if (isApiFailure(result)) {
        showToast(getApiMessage(result, "Member could not be deleted"), "error");
        return;
    }
    showToast("Member deleted");
    await refreshData();
    loadMembers();
    renderDashboard();
}

async function deleteBook(id) {
    if (!(await openConfirm("Delete book?", "This will remove the book record."))) return;
    const result = await apiSend(`/deleteBook/${id}`, "DELETE", {});
    if (isApiFailure(result)) {
        showToast(getApiMessage(result, "Book could not be deleted"), "error");
        return;
    }
    showToast("Book deleted");
    await refreshData();
    loadBooks();
    renderDashboard();
}

function exportCsv(type) {
    let rows = [];
    let filename = `${type}.csv`;
    if (type === "members") rows = [["ID", "Name", "Mobile"], ...appData.members.map(m => [m.id, m.name, m.mobile || ""])];
    if (type === "books") rows = [["ID", "Name", "Author", "Quantity", "Status"], ...appData.books.map(b => [b.id, b.name, b.author || "", b.qty, getBookStatus(b).label])];
    if (type === "transactions") rows = [["Member ID", "Book ID", "Status", "Due Date", "Fine", "Date"], ...appData.transactions.map(t => [t.memberId, t.bookId, t.status, t.dueDate || "", t.fine || 0, t.date])];
    if (type === "overdue") rows = [["Member ID", "Member", "Mobile", "Book ID", "Book", "Due Date", "Fine"], ...appData.overdue.map(row => [row.memberId, row.memberName, row.mobile, row.bookId, row.bookName, row.dueDate || "", row.fine || 0])];
    if (rows.length === 0) {
        showToast("No data to export", "error");
        return;
    }
    const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = filename;
    link.click();
    showToast("CSV exported");
}

function printReport(sectionId) {
    const section = byId(sectionId);
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Integrated Library System Report</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}button,input,select,.section-note{display:none}</style></head><body><h1>Integrated Library System Report</h1>${section.innerHTML}</body></html>`);
    win.document.close();
    win.print();
}

function bindDashboardEvents() {
    document.addEventListener("keydown", handleFormNavigation, true);
}

document.addEventListener("DOMContentLoaded", async function() {
    bindDashboardEvents();
    setDefaultDueDate();
    renderBookGrid();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    await refreshData();
    renderDashboard();
});
