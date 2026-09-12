# ExpenseMate --- Project Context & Frontend Handoff

> **Purpose:** This document is a machine-readable handoff/context file
> for OpenCode and other coding agents working on the ExpenseMate
> project.
>
> **Important:** Treat the existing repository implementation as the
> source of truth for backend behavior. Do not invent or redesign
> backend APIs when implementing the frontend.

------------------------------------------------------------------------

## 1. Project Identity

**Project:** ExpenseMate --- Personal Expense Manager

**Repository:** `https://github.com/usman-pirzada/expensemate`

**Primary branch currently being developed/reviewed:** `staging`

**Repository branch URL:**
`https://github.com/usman-pirzada/expensemate/tree/staging`

**Course/project:** Software Construction and Development (SCD)

**Team size:** 2

### Project goal

ExpenseMate is a small, local, single-user personal expense-management
application. It allows a user to:

-   record income
-   record expenses
-   create monthly budgets
-   optionally allocate portions of a monthly budget to selected
    categories
-   view budget status
-   receive dynamic budget alerts
-   view monthly spending analytics
-   view category-wise expense analysis
-   import transaction data from CSV
-   export transaction data to CSV

The application is intentionally local and does not require
authentication, cloud storage, online payments, or an internet
connection for normal operation.

------------------------------------------------------------------------

# 2. High-Level Architecture

## Architectural style

The overall architecture is:

**Local Client--Server architecture**

The frontend is a web client running locally and communicates with a
local FastAPI backend over HTTP.

Backend uses a **layered architecture**:

``` text
React Frontend
      |
      | REST / HTTP / JSON
      v
FastAPI API / Routers
      |
      v
Services / Business Logic
      |
      v
Repositories / Data Access
      |
      v
SQLAlchemy ORM
      |
      v
SQLite Database
```

### Important architectural rule

The frontend must communicate through the FastAPI API.

Do not access SQLite directly from React.

Do not duplicate backend business rules in a way that makes frontend
behavior inconsistent with the backend.

Frontend validation is desirable for UX, but backend validation remains
authoritative.

------------------------------------------------------------------------

# 3. Technology Stack

## Backend

-   Python
-   FastAPI
-   SQLAlchemy ORM
-   SQLite
-   REST API
-   JSON
-   layered architecture

## Frontend

-   React
-   Vite
-   Tailwind CSS v4
-   React Router
-   Recharts
-   browser `fetch()` for HTTP communication unless there is a concrete
    reason to add another HTTP library

## Database

SQLite with SQLAlchemy ORM.

Database entities:

``` text
categories
transactions
budgets
budget_allocations
```

------------------------------------------------------------------------

# 4. Frontend Environment

The frontend lives inside the repository:

``` text
expensemate/
├── backend/
├── frontend/
└── ...
```

The frontend has its own npm project.

Expected frontend structure at a high level:

``` text
frontend/
├── node_modules/
├── public/
├── src/
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

### Dependency isolation

Node.js/npm are system development tools.

Project packages are installed locally inside `frontend/node_modules`.

Normal project installation:

``` bash
cd frontend
npm install <package>
```

Do NOT install React, Vite, Tailwind, etc. globally.

Do not use `npm install -g` for project dependencies.

------------------------------------------------------------------------

# 5. Frontend Packages

The intended frontend stack is:

### Runtime dependencies

-   `react`
-   `react-dom`
-   `react-router-dom`
-   `recharts`

### Development/build dependencies

-   `vite`
-   `@vitejs/plugin-react`
-   `tailwindcss`
-   `@tailwindcss/vite`

Tailwind is **version 4 style configuration**.

Do not blindly follow old Tailwind v3 tutorials that require the old
`tailwind.config.js` + PostCSS setup.

The Vite integration uses:

``` javascript
import tailwindcss from '@tailwindcss/vite'
```

and the CSS entry uses:

``` css
@import "tailwindcss";
```

------------------------------------------------------------------------

# 6. Current Frontend Status

The frontend folder was initially accidentally created twice: once
inside `expensemate` and once outside it. The outside folder was the one
where npm commands were executed.

The duplicate `frontend` inside `expensemate` was deleted.

The correctly initialized frontend directory was then moved into
`expensemate`.

Therefore the current intended project is:

``` text
expensemate/frontend
```

The npm packages and generated files belong to this directory.

`npm run dev` has been tested and works successfully.

Do not recreate the frontend project or run `npm create vite` again.

------------------------------------------------------------------------

# 7. Backend Data Model

## Category

Categories are predefined.

**The user cannot create new categories.**

Frontend transaction forms should therefore use a category dropdown
populated from:

``` http
GET /categories
```

Do not create a "Create Category" UI unless the backend is explicitly
changed to support it.

------------------------------------------------------------------------

## Transaction

A transaction has:

-   ID
-   type
-   amount
-   date
-   category_id (nullable depending on type)

Transaction type is one of:

``` text
Income
Expense
```

### Critical transaction rule

For an **Expense**:

``` text
category_id is REQUIRED
```

For an **Income**:

``` text
category_id MUST be NULL
```

The database enforces this with a check constraint, and the backend also
validates it.

Frontend behavior should match this exactly:

-   when Type = Expense → show category selector and require it
-   when Type = Income → hide/remove category selection and submit
    category as `null`/omitted according to the API schema

Do not allow an Income to have a category.

### Amount

Amount must be greater than zero.

### Date

The transaction form should use a date input/calendar.

Default date should be the current date, but the user can change it.

------------------------------------------------------------------------

# 8. Budget Model

A budget represents the **overall monthly budget**.

Conceptually:

``` text
Budget
├── year
├── month
└── overall amount
```

A monthly budget may optionally have category allocations.

Category allocations are stored separately:

``` text
Budget
    |
    +---- BudgetAllocation -> Category A
    |
    +---- BudgetAllocation -> Category B
    |
    +---- BudgetAllocation -> Category C
```

### Category allocation rules

Category allocations are **exact monetary amounts**, not percentages.

Example:

``` text
Overall monthly budget = 100,000

Food allocation       = 30,000
Transport allocation   = 20,000
Entertainment          = 10,000
```

Total allocated = 60,000.

The remaining 40,000 is not stored as a fake category allocation.

It is calculated as the unallocated portion of the overall budget.

### Important constraint

The sum of explicit category allocations cannot exceed the overall
monthly budget.

The backend enforces this.

Actual spending **can** exceed the budget.

Do not prevent a user from recording an expense merely because the
budget would be exceeded.

------------------------------------------------------------------------

# 9. Budget Behavior and Display

Budget status is month-based.

If no category allocations exist:

``` text
Overall monthly budget bar
```

should be shown.

If only some categories have explicit allocations:

``` text
Overall monthly budget bar
Category A budget bar
Category B budget bar
...
```

Only explicitly allocated categories need their own category budget
bars.

Categories without explicit allocations consume from the
remaining/unallocated monthly budget.

### Budget bar visual behavior

A budget should be represented by a single horizontal bar.

It should visually communicate:

``` text
[==========------]
 used       remaining
```

There should not be separate vertical UI elements for "budget" and
"remaining".

If spending exceeds the budget:

``` text
[==========][=====]
    budget    overage
```

The portion beyond the budget should be visually indicated as an
exceeded/alert state (red is acceptable if consistent with the design).

The bar may continue growing beyond 100% rather than being artificially
capped.

Actual spending is allowed to exceed the budget.

------------------------------------------------------------------------

# 10. Budget Alerts

Alerts are **dynamic**.

There is **no alert table** in the database.

Alerts are calculated from the current budget/spending state.

Threshold:

``` text
>= 90% usage -> approaching budget
>= 100% usage -> exceeded budget
```

The user should receive an alert when a new transaction causes the
relevant budget to approach or exceed its threshold.

The backend exposes alert information through:

``` http
GET /analytics/alerts/{year}/{month}
```

and the dashboard endpoint also includes alert data.

Frontend should display these alerts rather than trying to maintain a
separate alert database.

------------------------------------------------------------------------

# 11. Analytics

Analytics are **month-based**.

There is no requirement for per-day analytics.

## Category expense distribution

For a selected month, expenses by category should be visualized with a:

**Pie Chart**

Example conceptual data:

``` text
Food          35%
Transport     20%
Shopping      25%
Other         20%
```

Use Recharts.

------------------------------------------------------------------------

## Monthly analytics

Overall monthly information should include things such as:

-   total income
-   total spending
-   overall budget
-   budget used
-   budget remaining
-   whether budget is exceeded
-   usage percentage
-   balance

These can be presented as statistic cards/text.

A **Bar Chart** is intended for overall monthly analytics where a
comparison between monthly metrics is useful.

Do not introduce day-by-day charts unless requirements are explicitly
changed.

------------------------------------------------------------------------

# 12. Existing Backend API

The frontend should use the actual endpoints already implemented in the
backend.

## Categories

``` http
GET /categories
```

Returns the available predefined categories.

------------------------------------------------------------------------

## Transactions

``` http
POST /transactions
GET /transactions
GET /transactions/{id}
PUT /transactions/{id}
DELETE /transactions/{id}
```

Transaction listing supports optional year/month filtering.

------------------------------------------------------------------------

## Budgets

``` http
POST /budgets
GET /budgets
GET /budgets/month/{year}/{month}
GET /budgets/{id}
PUT /budgets/{id}
DELETE /budgets/{id}
```

### Budget allocations

``` http
POST /budgets/{budget_id}/allocations
GET /budgets/{budget_id}/allocations
PUT /budgets/allocations/{allocation_id}
DELETE /budgets/allocations/{allocation_id}
```

------------------------------------------------------------------------

## Analytics

``` http
GET /analytics/summary/{year}/{month}
GET /analytics/categories/{year}/{month}
GET /analytics/category-budgets/{year}/{month}
GET /analytics/alerts/{year}/{month}
GET /analytics/dashboard/{year}/{month}
```

The dashboard endpoint is particularly useful because it combines
dashboard-related information.

It includes information such as:

-   summary
-   budget ID
-   category spending
-   category budget status
-   alerts

Prefer the combined dashboard endpoint for the dashboard page where
appropriate instead of making unnecessary duplicate API requests.

------------------------------------------------------------------------

## CSV

Export:

``` http
GET /transactions/csv/export
```

Import:

``` http
POST /transactions/csv/import
```

CSV import accepts transaction data and provides an error report for
invalid rows.

The frontend should expose a usable import workflow that lets the user
understand which rows failed.

------------------------------------------------------------------------

# 13. Important Backend/Frontend Separation

Backend owns:

-   data persistence
-   database constraints
-   business-rule enforcement
-   budget allocation validation
-   transaction validation
-   analytics calculations
-   alert calculations
-   CSV processing

Frontend owns:

-   UI
-   navigation
-   forms
-   client-side validation for good UX
-   loading/error states
-   displaying analytics
-   displaying alerts
-   sending API requests
-   presenting backend errors clearly

Do not move backend business logic into React just to make the UI work.

------------------------------------------------------------------------

# 14. Recommended Frontend Structure

The intended architecture is:

``` text
src/
├── components/
│   ├── common/
│   ├── layout/
│   ├── transactions/
│   ├── budget/
│   ├── analytics/
│   └── dashboard/
│
├── pages/
│   ├── Dashboard.jsx
│   ├── Transactions.jsx
│   ├── Budget.jsx
│   ├── Analytics.jsx
│   └── ImportExport.jsx
│
├── services/
│   ├── api.js
│   ├── transactionService.js
│   ├── budgetService.js
│   ├── analyticsService.js
│   └── categoryService.js
│
├── hooks/
│
├── utils/
│
├── App.jsx
├── main.jsx
└── index.css
```

This is a recommended organization, not a rigid requirement.

Do not create unnecessary abstractions simply to fill directories.

------------------------------------------------------------------------

# 15. Routing

React Router is being used.

Likely application routes:

``` text
/dashboard
/transactions
/budget
/analytics
/import-export
```

Exact routing and navigation can be refined during UI implementation.

A shared layout is recommended so that the application can have a
consistent:

-   sidebar/navigation
-   header
-   content area

------------------------------------------------------------------------

# 16. State Management

Do not introduce Redux/Zustand/etc. unless the application genuinely
requires it.

The current plan is to use React's built-in state mechanisms:

-   `useState`
-   `useEffect`
-   custom hooks where useful

State should be kept close to the components/pages that own it unless it
is genuinely shared.

For example:

-   transaction form state → transaction form/component
-   selected month → page/layout/dashboard context as appropriate
-   dashboard data → dashboard page/hook
-   categories → shared data/service/hook where needed

Avoid premature global state.

------------------------------------------------------------------------

# 17. API Service Organization

Prefer separating API calls from UI components.

For example:

``` text
components/pages
      |
      v
service functions
      |
      v
fetch()
      |
      v
FastAPI
```

A central API utility can handle:

-   base URL
-   JSON parsing
-   common error handling
-   HTTP status handling

Then domain-specific service modules can expose functions such as:

``` text
getTransactions()
createTransaction()
updateTransaction()
deleteTransaction()

getMonthlyBudget()
createBudget()
createBudgetAllocation()

getDashboard()
getCategoryAnalytics()
getAlerts()

getCategories()
```

Do not put raw fetch calls throughout every component if a small service
abstraction can keep things clear.

------------------------------------------------------------------------

# 18. Validation

Validation should happen in both places:

``` text
Frontend -> UX validation
Backend  -> authoritative validation
Database -> integrity constraints
```

Example:

Expense form:

``` text
type = Expense
amount > 0
date valid
category selected
```

Income form:

``` text
type = Income
amount > 0
date valid
category = null
```

Frontend should show understandable validation messages before
submitting, but must still handle backend validation errors.

------------------------------------------------------------------------

# 19. Error Handling

The UI should explicitly handle:

-   failed API request
-   failed save
-   invalid form input
-   backend validation errors
-   unavailable backend/server
-   failed CSV import
-   invalid CSV rows
-   empty analytics data
-   no budget for selected month

One of the SCD non-functional requirements is that the user should be
alerted if saving/updating an entry fails.

Therefore do not silently swallow failed requests.

------------------------------------------------------------------------

# 20. Empty States

The frontend should handle legitimate empty states.

Examples:

### No transactions

Show an appropriate message and a clear action to add a transaction.

### No budget

Show that no budget exists for the selected month and provide an action
to create one.

### No category allocations

Show only the overall monthly budget.

### No expenses for a month

The pie chart should not crash or display misleading data.

### No alerts

Do not display an empty/false alert state as an error.

------------------------------------------------------------------------

# 21. Date/Month Handling

The application is fundamentally month-oriented for budgets and
analytics.

The UI should make the selected month obvious.

Examples:

``` text
September 2026
```

rather than forcing the user to understand raw year/month parameters.

When communicating with the backend, convert the selected month into:

``` text
year
month
```

as required by the API.

Transaction dates are still individual dates.

------------------------------------------------------------------------

# 22. Important Edge Cases

The frontend must account for these cases.

### Transaction type switching

If user selects:

``` text
Expense
```

show category.

If user switches to:

``` text
Income
```

hide category and clear the previously selected category so it is not
accidentally submitted.

------------------------------------------------------------------------

### Budget allocations exactly equal overall budget

Allowed.

Example:

``` text
Overall = 100,000
Food = 60,000
Transport = 40,000
Allocated = 100,000
Remaining unallocated = 0
```

------------------------------------------------------------------------

### Budget allocation less than overall budget

Allowed.

Example:

``` text
Overall = 100,000
Food = 30,000
Transport = 20,000
Allocated = 50,000
Unallocated = 50,000
```

Do not create a fake `Unallocated` database allocation just to display
this.

------------------------------------------------------------------------

### Budget allocation greater than overall budget

Not allowed.

The backend rejects it.

Frontend should ideally prevent the obvious invalid submission and
clearly display the backend error if it occurs.

------------------------------------------------------------------------

### Actual spending greater than budget

Allowed.

Do not disable expense recording.

Instead:

-   display exceeded status
-   display alert
-   show over-budget portion visually

------------------------------------------------------------------------

### Spending reaches exactly 90%

This is the approaching threshold.

------------------------------------------------------------------------

### Spending reaches exactly 100%

This is exceeded status.

------------------------------------------------------------------------

### Spending is greater than 100%

Still allowed; display the overage clearly.

------------------------------------------------------------------------

### No category budget

An expense in a category with no explicit allocation is not
automatically invalid.

It consumes from the remaining/unallocated monthly budget.

------------------------------------------------------------------------

### No budget for the month

Transactions can still be recorded.

Budget-related UI should indicate that no budget has been configured
rather than treating transaction recording as invalid.

------------------------------------------------------------------------

### No internet

The application is local and should not require external internet access
for normal operation.

The frontend communicates with the local FastAPI server.

------------------------------------------------------------------------

# 23. CSV Import/Export

CSV functionality is already supported by the backend.

Frontend should provide:

## Export

A clear action such as:

``` text
Export Transactions
```

which requests:

``` http
GET /transactions/csv/export
```

and handles the resulting file download.

## Import

A file picker/upload UI.

After import:

-   show successful import information
-   show errors if any rows failed
-   do not hide row-level validation errors
-   refresh relevant transaction/dashboard data after a successful
    import

The backend remains responsible for actual CSV validation and
persistence.

------------------------------------------------------------------------

# 24. Dashboard Concept

The dashboard is intended to provide a quick monthly overview.

Possible structure:

``` text
------------------------------------------------
ExpenseMate          Selected Month: Sep 2026
------------------------------------------------

[ Total Income ] [ Total Spending ] [ Balance ]

[ Overall Budget Status / Budget Bar ]

[ Category Budget Bars ]

[ Spending by Category Pie Chart ]

[ Alerts ]

------------------------------------------------
```

The exact visual design is still open for implementation.

Use the existing dashboard endpoint where appropriate:

``` http
GET /analytics/dashboard/{year}/{month}
```

------------------------------------------------------------------------

# 25. Transactions Page Concept

The transaction area should support:

-   viewing transactions
-   adding income
-   adding expense
-   editing
-   deleting
-   filtering by month/year if supported by the backend

Transaction form fields:

``` text
Type
Amount
Date
Category (Expense only)
```

Date defaults to today but can be changed.

Category is a dropdown of predefined categories.

------------------------------------------------------------------------

# 26. Budget Page Concept

Should support:

-   selecting month
-   viewing overall monthly budget
-   creating/updating monthly budget
-   adding category allocations
-   editing category allocations
-   deleting category allocations
-   viewing current usage/status

Remember:

**category allocations are monetary amounts, not percentages.**

------------------------------------------------------------------------

# 27. Analytics Page Concept

Should display monthly analytics.

Potential sections:

-   total income
-   total expenses
-   balance
-   budget usage
-   category spending
-   pie chart for category distribution
-   monthly comparisons/summary where appropriate

Avoid adding unsupported analytics such as daily spending trends unless
requirements are explicitly expanded.

------------------------------------------------------------------------

# 28. Import/Export Page Concept

Provide:

``` text
Import CSV
Export CSV
```

For import, include clear feedback about:

-   imported rows
-   failed rows
-   validation errors

------------------------------------------------------------------------

# 29. Styling Guidelines

Tailwind CSS is the primary styling system.

Prefer:

-   consistent spacing
-   clear hierarchy
-   reusable components
-   responsive layout
-   accessible form controls
-   clear error/success states
-   restrained visual complexity

Do not introduce a UI component library unless there is a concrete
project need.

Avoid unnecessary CSS duplication.

------------------------------------------------------------------------

# 30. Coding Standards

Use clear, conventional naming.

### React components

PascalCase:

``` text
TransactionForm.jsx
BudgetCard.jsx
Dashboard.jsx
```

### Functions/variables

camelCase:

``` javascript
getTransactions()
selectedMonth
handleSubmit()
```

### Constants

Use appropriate constant naming:

``` javascript
API_BASE_URL
```

### Comments/docstrings

Comments and documentation are expected where they clarify non-obvious
behavior.

Do not write comments that merely restate obvious code.

------------------------------------------------------------------------

# 31. Development Rules for Coding Agents

When modifying the frontend:

1.  **Inspect the existing repository before making assumptions.**
2.  **Do not modify backend code unless explicitly requested.**
3.  **Do not change the database schema unless explicitly requested.**
4.  **Use the existing FastAPI endpoints.**
5.  **Do not invent endpoint names or response formats.**
6.  If an endpoint's exact request/response schema is needed, inspect
    the backend implementation/Pydantic schemas first.
7.  Keep the frontend architecture simple and understandable.
8.  Avoid unnecessary dependencies.
9.  Do not globally install npm packages.
10. Keep project packages inside `frontend/package.json`.
11. Run the frontend after meaningful changes.
12. Test the affected UI behavior.
13. Do not silently ignore API errors.
14. Preserve existing functionality when adding new functionality.
15. Do not perform broad refactors unless explicitly requested.

------------------------------------------------------------------------

# 32. Git Workflow

The repository uses feature branches.

Do not directly push changes to `staging` unless explicitly instructed.

Typical workflow:

``` text
staging
   |
   +---- feature/frontend-dashboard
   |
   +---- feature/frontend-transactions
   |
   +---- feature/frontend-budget
```

The exact branch naming convention can be chosen consistently with the
existing repository.

------------------------------------------------------------------------

# 33. Deployment/Integration Intent

The intended final deployment can be a local application where:

``` text
Browser
   |
   v
FastAPI
   |
   +--> API routes
   |
   +--> serves React static build (if straightforward)
   |
   v
SQLite
```

During development, Vite can serve the frontend separately while FastAPI
runs on its own local port.

The final integration can build the React frontend into static assets
and have FastAPI serve them if this remains straightforward and
compatible with the existing backend.

------------------------------------------------------------------------

# 34. SCD Requirements Context

Core functional requirements:

``` text
FR1  Record Income
FR2  Record Expense
FR3  Create Budget
FR4  View Budget Status
FR5  Receive Budget Alerts
FR6  View Spending Charts
FR7  View Category-wise Analysis
FR8  Import CSV
FR9  Export CSV
```

Relevant non-functional requirements include:

``` text
NFR1  Save/update entry within 1 minute target
NFR2  Updated analytics within 30 seconds
NFR3  Alert if save/update fails
NFR4  Startup <= 40 seconds
NFR5  First-time user can learn basic operation within 10 minutes;
      visual guidance on first startup
NFR6  Local client-server; no internet/cloud dependency
NFR7  Transaction cannot be recorded without valid amount/date,
      and expense requires category
```

Use cases correspond directly to the major FRs.

------------------------------------------------------------------------

# 35. What Is NOT in Scope

Unless requirements are explicitly changed, do not add:

-   authentication/login
-   multiple users
-   cloud synchronization
-   online payments
-   user-created categories
-   percentage-based category budgets
-   per-day analytics
-   cryptocurrency functionality
-   bank account integration
-   external financial APIs
-   unnecessary state-management libraries
-   unnecessary UI frameworks

------------------------------------------------------------------------

# 36. Key Decisions That Must Not Be Accidentally Reversed

These decisions were discussed and settled:

1.  **Frontend = React**
2.  **Build tooling = Vite**
3.  **Styling = Tailwind CSS v4**
4.  **Routing = React Router**
5.  **Charts = Recharts**
6.  **HTTP = REST over HTTP using JSON**
7.  **HTTP client = native `fetch()` initially**
8.  **Backend = FastAPI**
9.  **Database = SQLite**
10. **ORM = SQLAlchemy**
11. **Backend architecture = layered**
12. **Application architecture = local client-server**
13. **Categories = predefined; users do not create categories**
14. **Category allocations = exact monetary amounts**
15. **Budget allocations are optional**
16. **Allocation total cannot exceed overall budget**
17. **Actual spending may exceed budget**
18. **Budget approach threshold = 90%**
19. **Alerts are dynamically calculated; no alert table**
20. **Analytics are month-based**
21. **Income has no category**
22. **Expense requires a category**
23. **Frontend and backend both validate**
24. **Do not bypass the API and access SQLite from React**

------------------------------------------------------------------------

# 37. Working Principle for OpenCode

The goal is to construct the frontend **around the backend that already
exists**, not to redesign ExpenseMate.

Before implementing any feature:

``` text
1. Understand the requirement.
2. Inspect the relevant backend endpoint/schema.
3. Determine the exact request/response format.
4. Design the smallest appropriate React components.
5. Put API communication in services.
6. Implement UI state and validation.
7. Handle loading, success, empty, and error states.
8. Test the feature.
9. Avoid unrelated changes.
```

When backend behavior and this document appear to conflict, **inspect
the actual backend code and treat the repository implementation as
authoritative**. If the implementation appears inconsistent with the
intended requirements, do not silently rewrite it; flag the discrepancy.

------------------------------------------------------------------------

# 38. Immediate Frontend Development Direction

The frontend environment is already installed and `npm run dev` works.

The next sensible implementation sequence is:

``` text
1. Inspect existing frontend files.
2. Configure/verify Tailwind v4.
3. Set up React Router.
4. Establish the application layout/navigation.
5. Establish API service/base configuration.
6. Build Dashboard.
7. Build Transactions UI.
8. Build Budget UI.
9. Build Analytics UI.
10. Build CSV Import/Export UI.
11. Integrate and test all flows.
12. Polish responsive/accessibility/error states.
```

Do not create all components/pages blindly before understanding the
required UI.

------------------------------------------------------------------------

# 39. Repository

Official project repository:

`https://github.com/usman-pirzada/expensemate`

Current working branch:

`staging`

Frontend location:

``` text
expensemate/frontend
```

Backend location:

``` text
expensemate/backend
```

The repository's existing implementation should be inspected directly
before making API assumptions.

------------------------------------------------------------------------

# END OF HANDOFF DOCUMENT
