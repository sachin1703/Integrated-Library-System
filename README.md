# Integrated Library System

A web-based Library Management System built using HTML, CSS, JavaScript, Node.js, and Express.js. The system helps manage library books, members, book issuing, returns, overdue records, fines, transaction history, and dashboard reports using JSON-based local storage.

## Features

- Admin login system
- Dashboard with library summary reports
- Add and manage members
- Add and manage books
- Auto-generated member IDs
- Auto-generated book IDs
- View all members
- View all books
- Delete members
- Delete books
- Prevent deleting members with active issued books
- Prevent deleting books with active issued copies
- Issue books to registered members
- Issue multiple books
- Return multiple books
- 14-day default due date
- Due date tracking
- Overdue record tracking
- Fine calculation for late returns
- Fine collection record in transactions
- Transaction history
- Filter issued and returned transactions
- Low-stock and out-of-stock report counts
- Today’s issued and returned book count
- JSON-based local data storage
- C backend demo using linked list for book operations

## Tech Stack

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- JSON
- C

## Project Structure

```text
Library/
├── backend/
│   └── library.c
├── data/
│   ├── books.json
│   ├── member.json
│   ├── members.json
│   └── transactions.json
├── frontend/
│   ├── login.html
│   ├── dashboard.html
│   ├── style.css
│   └── script.js
├── middleware/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── README.md
└── .gitignore

Installation
Clone the repository:

git clone https://github.com/your-username/Integrated-Library-System.git
cd Integrated-Library-System
Go to the middleware folder:

cd middleware
Install dependencies:

npm install
Start the server:

npm start
Open the app in your browser:

http://localhost:3000/login.html
Default Admin Login
Username: admin
Password: admin123
API Features
The Express server provides endpoints for:

Admin login
Generate next member and book IDs
Add member
View members
Update member
Delete member
Add book
View books
Update book
Delete book
Issue book
Return multiple books
View transactions
View overdue records
View dashboard summary reports
Data Storage
The project stores data locally in JSON files inside the data folder:

books.json
members.json
member.json
transactions.json
Fine Calculation
The system uses a fine amount of:

₹5 per overdue day
A book is issued with a default due date of 14 days from the issue date.

C Backend Demo
The backend/library.c file contains a simple C program that demonstrates book management using a linked list.

It supports:

Add book
Display books
Search book
To compile it:

gcc backend/library.c -o library
To run it:

./library
On Windows:

library.exe
Important Note
Do not upload node_modules to GitHub. It can be regenerated using:

npm install
If your JSON files contain real member or transaction data, clear them before uploading publicly.

Author
Created by Sachin.


**Recommended `.gitignore`**

```gitignore
node_modules/
npm-debug.log*
.env

.DS_Store
Thumbs.db

*.exe
*.o
*.out

.vscode/
.idea/

# Optional: ignore local/private data if needed
# data/*.json
Files You Should Upload

Upload these:

backend/library.c
data/books.json
data/member.json
data/members.json
data/transactions.json
frontend/login.html
frontend/dashboard.html
frontend/style.css
frontend/script.js
middleware/server.js
middleware/package.json
middleware/package-lock.json
README.md
.gitignore
Do Not Upload These

middleware/node_modules/
npm-debug.log
.env
*.exe
*.o
*.out
GitHub About Section

Description:
A web-based integrated library management system using HTML, CSS, JavaScript, Node.js, Express.js, JSON storage, and a C linked-list backend demo.
