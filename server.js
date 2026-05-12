const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const FINE_PER_DAY = 5;

const DATA_DIR = path.join(__dirname, "../data");
const MEMBER_FILE = path.join(DATA_DIR, "members.json");
const BOOK_FILE = path.join(DATA_DIR, "books.json");
const TRANS_FILE = path.join(DATA_DIR, "transactions.json");

app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});
app.use(express.static(path.join(__dirname, "../frontend")));

function readData(file) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
        return [];
    }
}

function writeData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function normalizeId(value) {
    return String(value || "").trim().toUpperCase();
}

function normalizeText(value) {
    return String(value || "").trim();
}

function generateSequentialID(prefix, data) {
    const max = data.reduce((highest, item) => {
        const number = parseInt(String(item.id || "").replace(prefix, ""), 10);
        return Number.isFinite(number) ? Math.max(highest, number) : highest;
    }, 0);

    return prefix + String(max + 1).padStart(3, "0");
}

function defaultDueDate() {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString();
}

function calculateFine(dueDate, returnDate = new Date()) {
    if (!dueDate) return 0;
    const lateDays = Math.ceil((new Date(returnDate) - new Date(dueDate)) / 86400000);
    return lateDays > 0 ? lateDays * FINE_PER_DAY : 0;
}

function activeIssues(transactions) {
    const open = new Map();

    transactions.forEach(transaction => {
        const key = `${transaction.memberId}-${transaction.bookId}`;
        if (transaction.status === "issued") open.set(key, transaction);
        if (transaction.status === "returned") open.delete(key);
    });

    return Array.from(open.values());
}

function validateMemberInput(body) {
    const name = normalizeText(body.name);
    const mobile = normalizeText(body.mobile);

    if (!name) return { error: "Member name is required" };
    if (!/^[0-9]{10}$/.test(mobile)) return { error: "Mobile number must be 10 digits" };

    return { value: { name, mobile } };
}

function validateBookInput(body) {
    const name = normalizeText(body.name);
    const author = normalizeText(body.author);
    const qty = Number(body.qty);

    if (!name) return { error: "Book name is required" };
    if (!author) return { error: "Author is required" };
    if (!Number.isInteger(qty) || qty < 0) return { error: "Quantity must be a whole number 0 or more" };

    return { value: { name, author, qty } };
}

function getReports() {
    const books = readData(BOOK_FILE);
    const members = readData(MEMBER_FILE);
    const transactions = readData(TRANS_FILE);
    const openIssues = activeIssues(transactions);
    const today = new Date();

    const overdue = openIssues
        .filter(issue => issue.dueDate && new Date(issue.dueDate) < today)
        .map(issue => {
            const book = books.find(item => item.id === issue.bookId) || {};
            const member = members.find(item => item.id === issue.memberId) || {};
            return {
                ...issue,
                bookName: book.name || "",
                memberName: member.name || "",
                mobile: member.mobile || "",
                fine: calculateFine(issue.dueDate, today)
            };
        });

    const todayKey = today.toISOString().split("T")[0];
    const issuedToday = transactions.filter(t =>
        t.status === "issued" && new Date(t.date).toISOString().split("T")[0] === todayKey
    ).length;
    const returnedToday = transactions.filter(t =>
        t.status === "returned" && new Date(t.date).toISOString().split("T")[0] === todayKey
    ).length;

    return {
        totalBooks: books.length,
        totalMembers: members.length,
        totalTransactions: transactions.length,
        activeIssued: openIssues.length,
        overdueCount: overdue.length,
        fineDue: overdue.reduce((sum, item) => sum + Number(item.fine || 0), 0),
        fineCollected: transactions.reduce((sum, item) => sum + Number(item.fine || 0), 0),
        lowStock: books.filter(book => Number(book.qty || 0) > 0 && Number(book.qty || 0) <= 2).length,
        outOfStock: books.filter(book => Number(book.qty || 0) <= 0).length,
        issuedToday,
        returnedToday
    };
}

app.post("/login", (req, res) => {
    if (req.body.username === "admin" && req.body.password === "admin123") {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Invalid username or password" });
    }
});

app.get("/nextIds", (req, res) => {
    res.json({
        memberId: generateSequentialID("M", readData(MEMBER_FILE)),
        bookId: generateSequentialID("B", readData(BOOK_FILE))
    });
});

app.get("/reports/summary", (req, res) => {
    res.json(getReports());
});

app.get("/overdue", (req, res) => {
    const books = readData(BOOK_FILE);
    const members = readData(MEMBER_FILE);
    const transactions = readData(TRANS_FILE);
    const today = new Date();

    const rows = activeIssues(transactions)
        .filter(issue => issue.dueDate && new Date(issue.dueDate) < today)
        .map(issue => {
            const book = books.find(item => item.id === issue.bookId) || {};
            const member = members.find(item => item.id === issue.memberId) || {};
            return {
                memberId: issue.memberId,
                memberName: member.name || "",
                mobile: member.mobile || "",
                bookId: issue.bookId,
                bookName: book.name || "",
                dueDate: issue.dueDate,
                fine: calculateFine(issue.dueDate, today)
            };
        });

    res.json(rows);
});

app.post("/addMember", (req, res) => {
    const validation = validateMemberInput(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });

    const members = readData(MEMBER_FILE);
    const duplicate = members.find(member => member.mobile === validation.value.mobile);
    if (duplicate) return res.status(409).json({ success: false, message: "A member with this mobile already exists" });

    const member = { id: generateSequentialID("M", members), ...validation.value };
    members.push(member);
    writeData(MEMBER_FILE, members);

    res.json({ success: true, member });
});

app.get("/members", (req, res) => {
    res.json(readData(MEMBER_FILE));
});

app.get("/member/:id", (req, res) => {
    const id = normalizeId(req.params.id);
    const member = readData(MEMBER_FILE).find(item => item.id === id);
    res.json(member || {});
});

app.put("/member/:id", (req, res) => {
    const validation = validateMemberInput(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });

    const id = normalizeId(req.params.id);
    const members = readData(MEMBER_FILE);
    const member = members.find(item => item.id === id);

    if (!member) return res.status(404).json({ success: false, message: "Member not found" });

    const duplicate = members.find(item => item.id !== id && item.mobile === validation.value.mobile);
    if (duplicate) return res.status(409).json({ success: false, message: "A member with this mobile already exists" });

    member.name = validation.value.name;
    member.mobile = validation.value.mobile;
    writeData(MEMBER_FILE, members);

    res.json({ success: true, member });
});

app.delete("/deleteMember/:id", (req, res) => {
    const id = normalizeId(req.params.id);
    const transactions = readData(TRANS_FILE);
    const hasActiveIssue = activeIssues(transactions).some(issue => issue.memberId === id);

    if (hasActiveIssue) {
        return res.status(409).json({ success: false, message: "Return this member's active books before deleting" });
    }

    const members = readData(MEMBER_FILE);
    writeData(MEMBER_FILE, members.filter(member => member.id !== id));

    res.json({ success: true, message: "Member deleted" });
});

app.post("/addBook", (req, res) => {
    const validation = validateBookInput(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });

    const books = readData(BOOK_FILE);
    const duplicate = books.find(book =>
        book.name.toLowerCase() === validation.value.name.toLowerCase() &&
        String(book.author || "").toLowerCase() === validation.value.author.toLowerCase()
    );

    if (duplicate) return res.status(409).json({ success: false, message: "This book already exists" });

    const book = { id: generateSequentialID("B", books), ...validation.value };
    books.push(book);
    writeData(BOOK_FILE, books);

    res.json({ success: true, book });
});

app.get("/books", (req, res) => {
    res.json(readData(BOOK_FILE));
});

app.get("/book/:id", (req, res) => {
    const id = normalizeId(req.params.id);
    const book = readData(BOOK_FILE).find(item => item.id === id);
    res.json(book || {});
});

app.put("/book/:id", (req, res) => {
    const validation = validateBookInput(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });

    const id = normalizeId(req.params.id);
    const books = readData(BOOK_FILE);
    const book = books.find(item => item.id === id);

    if (!book) return res.status(404).json({ success: false, message: "Book not found" });

    book.name = validation.value.name;
    book.author = validation.value.author;
    book.qty = validation.value.qty;
    writeData(BOOK_FILE, books);

    res.json({ success: true, book });
});

app.delete("/deleteBook/:id", (req, res) => {
    const id = normalizeId(req.params.id);
    const transactions = readData(TRANS_FILE);
    const hasActiveIssue = activeIssues(transactions).some(issue => issue.bookId === id);

    if (hasActiveIssue) {
        return res.status(409).json({ success: false, message: "Return active copies before deleting this book" });
    }

    const books = readData(BOOK_FILE);
    writeData(BOOK_FILE, books.filter(book => book.id !== id));

    res.json({ success: true });
});

app.post("/issueBook", (req, res) => {
    const memberId = normalizeId(req.body.memberId);
    const bookId = normalizeId(req.body.bookId);
    const dueDate = req.body.dueDate || defaultDueDate();
    const books = readData(BOOK_FILE);
    const members = readData(MEMBER_FILE);
    const transactions = readData(TRANS_FILE);
    const member = members.find(item => item.id === memberId);
    const book = books.find(item => item.id === bookId);

    if (!member) return res.status(404).json({ success: false, msg: "Member not found" });
    if (!book) return res.status(404).json({ success: false, msg: "Book not found" });
    if (Number(book.qty || 0) <= 0) return res.status(400).json({ success: false, msg: "Book is out of stock" });

    const duplicate = activeIssues(transactions).find(issue => issue.memberId === memberId && issue.bookId === bookId);
    if (duplicate) {
        return res.status(409).json({ success: false, msg: "This member already has this book issued" });
    }

    book.qty -= 1;
    transactions.push({
        memberId,
        bookId,
        status: "issued",
        dueDate,
        fine: 0,
        date: new Date()
    });

    writeData(BOOK_FILE, books);
    writeData(TRANS_FILE, transactions);

    res.json({ success: true, msg: "Issued" });
});

app.post("/returnMultiple", (req, res) => {
    const memberId = normalizeId(req.body.memberId);
    const bookIds = Array.isArray(req.body.books) ? req.body.books.map(normalizeId) : [];
    const transactions = readData(TRANS_FILE);
    const books = readData(BOOK_FILE);
    let totalFine = 0;
    let returnedCount = 0;

    bookIds.forEach(bookId => {
        const transaction = activeIssues(transactions).find(issue => issue.memberId === memberId && issue.bookId === bookId);

        if (!transaction) return;

        const fine = calculateFine(transaction.dueDate);
        transaction.status = "returned";
        transaction.returnDate = new Date();
        transaction.date = new Date();
        transaction.fine = fine;
        totalFine += fine;

        const book = books.find(item => item.id === bookId);
        if (book) book.qty = Number(book.qty || 0) + 1;
        returnedCount += 1;
    });

    if (returnedCount === 0) {
        return res.status(400).json({ success: false, message: "No active issued books selected" });
    }

    writeData(TRANS_FILE, transactions);
    writeData(BOOK_FILE, books);

    res.json({ success: true, totalFine, returnedCount });
});

app.get("/transactions", (req, res) => {
    let transactions = readData(TRANS_FILE);

    if (req.query.type === "issued") transactions = transactions.filter(item => item.status === "issued");
    if (req.query.type === "returned") transactions = transactions.filter(item => item.status === "returned");

    res.json(transactions);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
