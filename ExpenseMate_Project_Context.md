# ExpenseMate --- Project Context & Frontend Handoff

> **Purpose:** This document is a machine-readable handoff/context file
> for OpenCode and other coding agents working on the ExpenseMate
> project.
>
> **Important:** Treat the existing repository implementation as the
> source of truth for backend behavior. Do not invent or redesign
> backend APIs when implementing the frontend.
>
> **Status:** The frontend is implemented (see §40 for the as-built
> inventory). The mock/real backend switch is controlled by the
> `USE_MOCK` flag in `frontend/src/services/expenseService.js` (see
> §41). A follow-up UX change — expense-only entry plus a single locked
> monthly income — is planned but is **pending discussion with the
> backend teammate** before implementation (see §§42-43).

------------------------------------------------------------------------

# FOR AI AGENTS — WHERE TO PICK UP (READ THIS FIRST)

If you are a coding agent starting work on this repository, do not
assume the frontend is unfinished scaffolding. It is implemented and
building.

## Current state in one paragraph

`expensemate/frontend` is a complete React + Vite + Tailwind v4 app
covering Dashboard, Transactions, Budget, Analytics, and CSV
Import/Export. Pages talk to `frontend/src/services/expenseService.js`
only. That module currently runs against static sample data
(`USE_MOCK = true`) but can be flipped to the real FastAPI backend by
setting it to `false`. The next planned piece of work (§42) was drafted
and then fully reverted because the backend teammate must first agree on
where an "income lock" lives (§43).

## Reading order

``` text
§6   Current frontend status (incl. as-built note)
§7   Backend data model            (income/expense/category rules)
§40  What has been built  — the as-built inventory
§41  USE_MOCK + real backend switch + commands
§42  What is going to be done next — the planned UX change
§43  Open decision blocking §42    — income lock: frontend vs backend
```

Read §36 ("Key Decisions That Must Not Be Accidentally Reversed") before
modifying anything.

## What to do

-   To review/verify frontend work: use `npm run build` and `npm run
    dev` (see §41 for exact commands).
-   To implement ordinary frontend changes: work from the as-built
    state in §40 and keep importing only from `expenseService.js`.
-   To implement §42 (expense-only entry + single locked monthly
    income): **do not start until the backend teammate agrees where the
    lock lives (§43)**. Until that is resolved, leave `USE_MOCK`, the
    current transaction flow, and the transactions table behavior
    untouched. Nothing from the earlier draft remains in the codebase.
    Do not try to resurrect it from memory; re-derive it from §42-43 once
    unblocked.

## Hard guardrails

``` text
1. Pages/components import ONLY from frontend/src/services/expenseService.js.
2. Do NOT modify backend code unless explicitly asked.
3. Do NOT create categories UI; categories are predefined (GET /categories).
4. Expense requires category_id; Income must use category_id = null.
5. Allocation total cannot exceed the overall budget (backend-enforced).
6. Budget approach alert threshold 90%, exceeded 100% (dynamic, no table).
7. Do NOT bypass the API to touch SQLite from React.
8. Run the affected UI after meaningful changes; never silently swallow API errors.
```

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

### As-built status

The frontend described in the remainder of this document has been fully
implemented inside `expensemate/frontend` and `npm run build` passes.

Everything is documented as-built in §40, the mock/real backend switch
is documented in §41, and the next planned work (expense-only entry +
single locked monthly income) is documented in §§42-43.

Do not redesign the frontend from scratch; modify the existing
implementation.

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

The implementation sequence below is now **complete**. The frontend has
been built against the existing backend, renders correctly with the
sample data, and `npm run build` passes.

``` text
1. Inspect existing frontend files.               [done]
2. Configure/verify Tailwind v4.                  [done]
3. Set up React Router.                           [done]
4. Establish the application layout/navigation.   [done]
5. Establish API service/base configuration.      [done]
6. Build Dashboard.                               [done]
7. Build Transactions UI.                         [done]
8. Build Budget UI.                               [done]
9. Build Analytics UI.                            [done]
10. Build CSV Import/Export UI.                   [done]
11. Integrate and test all flows.                 [done]
12. Polish responsive/accessibility/error states. [done]
```

See §40 for the as-built inventory, §41 for how to switch between the
sample data and the real FastAPI backend, and §§42-43 for the next
planned UX change and the open decision that must first be discussed
with the backend teammate.

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

# 40. What Has Been Built (Frontend — As-Built Inventory)

The frontend is fully implemented. Pages import **only** from
`src/services/expenseService.js`; they never touch `api.js` or
`mockData.js` directly.

## As-built file tree

``` text
frontend/src/
├── main.jsx                       # React root (StrictMode), mounts <App/>
├── App.jsx                        # BrowserRouter + ThemeProvider + MonthProvider + routes
├── index.css                      # Tailwind v4 entry, brand palette, custom dark variant
│
├── components/
│   ├── common/
│   │   ├── AlertBanner.jsx        # approaching/exceeded alert banner
│   │   ├── Badge.jsx              # tonal badge (e.g. Income=green, Expense=red)
│   │   ├── BudgetBar.jsx          # single horizontal bar; grows past 100%, shows overage
│   │   ├── Button.jsx             # primary/secondary/danger/ghost × sm/md/lg
│   │   ├── Card.jsx               # Card + CardHeader (title/subtitle/action)
│   │   ├── EmptyState.jsx         # icon + title + message + optional action
│   │   ├── Icons.jsx              # inline SVG icon set
│   │   ├── Modal.jsx              # overlay modal (open, onClose, title)
│   │   └── StatCard.jsx           # label + value (income/expense tones) + optional sub
│   ├── layout/
│   │   ├── Layout.jsx             # shared shell: sidebar, header, main Outlet
│   │   ├── MonthSelector.jsx      # prev/next month stepper (uses useMonth)
│   │   ├── Sidebar.jsx            # desktop + mobile drawer navigation
│   │   └── ThemeToggle.jsx        # light/dark toggle button (uses useTheme)
│   ├── transactions/
│   │   ├── TransactionForm.jsx    # type switch (Income/Expense), amount/date/category/description
│   │   └── TransactionTable.jsx   # monthly transaction rows with edit/delete actions
│   └── budget/
│       ├── BudgetForm.jsx         # overall monthly budget amount form
│       └── AllocationForm.jsx     # per-category allocation form
│
├── context/
│   ├── MonthContext.jsx           # selected {year, month}, label, previousMonth/nextMonth
│   └── ThemeContext.jsx           # dark flag persisted in localStorage("expensemate-theme")
│
├── hooks/
│   └── useRequest.js              # useRequest(loader, deps) -> {data, loading, error, reload}
│
├── pages/
│   ├── Dashboard.jsx
│   ├── Transactions.jsx
│   ├── Budget.jsx
│   ├── Analytics.jsx
│   └── ImportExport.jsx
│
├── services/
│   ├── api.js                     # real HTTP layer (fetch wrapper + ApiError)
│   ├── expenseService.js          # domain service; owns the USE_MOCK switch
│   └── mockData.js                # static September 2026 sample dataset
│
└── utils/
    ├── colors.js                  # fixed category palette + categoryColor(index)
    └── format.js                  # MONTH_NAMES(_SHORT), formatCurrency, formatPercent, formatDate, toISODate
```

## Routing (App.jsx)

``` text
/               -> redirect to /dashboard
/dashboard
/transactions
/budget
/analytics
/import-export
*               -> "Page not found"
```

Providers order: `ThemeProvider` → `MonthProvider` → routes. The shared
`Layout` (sidebar + header) wraps every page via an outlet route.

## Header (Layout.jsx)

Contains:

-   page title
-   `MonthSelector` (global selected month)
-   `ThemeToggle` (light/dark)
-   **Add Transaction** button → navigates to `/transactions?new=1`,
    which auto-opens the transaction modal and clears the query param.
    This button is the target of the upcoming redesign (§42).

## State management

-   **Selected month** — `MonthContext`; defaults to the current real
    month, exposes `{year, month, label}`, `previousMonth()`,
    `nextMonth()`. Used by every data-fetching page.
-   **Theme** — `ThemeContext`; defaults to
    `prefers-color-scheme: dark` on first visit, then persists to
    `localStorage["expensemate-theme"]`; toggles the `dark` class on
    `document.documentElement`.
-   **Data fetching** — `useRequest(loader, deps)`; keeps the loader in
    a ref so a new inline function does not trigger extra reloads, and
    returns `reload()` for after-write refresh.

## Pages and behavior

### Dashboard

-   Stat cards: Total Income, Total Spending, Balance.
-   Overall monthly budget bar (only when a budget exists; otherwise an
    empty state that still allows recording transactions).
-   Per-category budget bars for explicitly allocated categories.
-   Spending-by-category donut (Recharts `PieChart`).
-   Dynamic alerts (`approaching` ≥ 90%, `exceeded` ≥ 100%) from the
    analytics alerts payload; rendered by `AlertBanner`.
-   Loading and error states for the combined dashboard request.

### Transactions

-   Monthly list for the selected month.
-   Stat cards: Income, Spending, Net (computed client-side from the
    listed rows).
-   Full CRUD. Add/Edit open `TransactionForm` in a modal; delete is
    immediate. Success/error banners with a dismiss action.
-   `TransactionForm` has an Income/Expense type switch: switching to
    **Income** hides and clears the category; **Expense** requires a
    category, amount > 0, and a valid date.
-   `?new=1` query param opens the form automatically.

### Budget

-   Shows "No budget for {month}" empty state with a Create budget
    action when no budget exists for the selected month.
-   Create/update/delete the overall monthly budget.
-   Add/edit/delete category allocations (exact monetary amounts).
    Editing a budget or allocation always reloads budget, allocations,
    category-budget-status, and summary.
-   Overall bar + one `BudgetBar` per allocation (used/spent vs amount);
    "allocated / unallocated" split is computed, not stored.
-   The Add-allocation button is hidden when there is nothing left to
    allocate (all categories allocated or full amount used).

### Analytics

-   Stat cards: Total Income, Total Spending, Balance, Budget Used (%),
    with a sub-line "X over budget" or "X remaining".
-   Income-vs-spending grouped bar chart for the **last 3 months**
    (including the selected month).
-   Spending-by-category donut (Recharts).
-   Category-wise spending breakdown list with share percentage badges.

### Import / Export

-   **Export**: fetches CSV text and triggers a browser download.
-   **Import**: file picker (`.csv`), sends file content as
    `{content}`, reports imported-row count or the error message.
-   Inline documentation table of the expected CSV columns
    (`type, amount, date, description, category_id`), with
    Expense-requires-category / Income-null rules.

## Common components

-   `BudgetBar` — single horizontal bar per the spec: shows used/remaining
    up to 100%, continues growing past 100% with a red overage segment, and
    prints "over budget" vs "remaining".
-   `Button` — variants `primary | secondary | danger | ghost`, sizes
    `sm | md | lg`, disabled/aria-disabled support.
-   `Badge` — tonal labels.
-   `Modal`, `Card`/`CardHeader`, `EmptyState`, `AlertBanner`,
    `StatCard` — used across all pages.

## Styling

-   Tailwind CSS **v4** configured through `@tailwindcss/vite` and
    `@import "tailwindcss"` in `index.css`.
-   Custom **emerald "brand"** palette defined via `@theme`
    (`--color-brand-50 … --color-brand-900`).
-   Dark mode uses the v4 custom-variant
    `@custom-variant dark (&:where(.dark, .dark *));` and every
    component carries `dark:` variants.
-   Global `body` background/text switch between light and dark.

## Verification

-   `npm run build` passes (only a harmless chunk-size warning).
-   `npm run dev` serves the app on http://localhost:5173.

------------------------------------------------------------------------

# 41. Switching Between Mock Data and the Real Backend (USE_MOCK)

The frontend ships with sample data so the UI can be reviewed without
running the backend, and a **single flag** flips the whole app to the
real FastAPI API.

## The flag

``` javascript
// frontend/src/services/expenseService.js
export const USE_MOCK = true
```

``` text
USE_MOCK = true   -> every service function returns sample data from
                     frontend/src/services/mockData.js (static
                     September 2026 dataset).
USE_MOCK = false  -> every service function calls the live FastAPI
                     backend through frontend/src/services/api.js.
```

**This is the intended way to review with sample data now and switch to
the real backend later.** No page or component needs to change.

## How it works

-   `src/pages/*` import only from `src/services/expenseService.js`.
-   Each exported function in `expenseService.js` branches on
    `USE_MOCK` (e.g. `getTransactions`, `createTransaction`,
    `getBudget`, `getDashboard`, `exportCsv`, …).
-   To go live: set `USE_MOCK = false`, start the backend, and restart
    the Vite dev server if the dev server was already running.

## Backend base URL

``` javascript
// frontend/src/services/api.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
```

-   Default: `http://localhost:8000/api` (FastAPI runs with the `/api`
    prefix).
-   To point elsewhere, set `VITE_API_URL` in `frontend/.env` (e.g.
    `VITE_API_URL=http://localhost:8000/api`). Vite reads env vars at
    build/start, so **restart the dev server** after changing it.
-   `api.js` wraps `fetch()`, sets JSON content-type, parses JSON or
    text, and throws `ApiError(status, detail)` on non-2xx responses.
-   `expenseService.getBudget` converts a `404` into `null`, so "no
    budget for the month" is an empty state, not an error.

## Behavioral differences while in mock mode

-   The sample dataset is **static** — create/update/delete reflect in
    memory for that request only; a page reload restores the seeded
    September 2026 data.
-   Month filtering returns the September sample for the current month
    and empty results for other months.
-   `importCsv` reports `{ imported: 5 }`; it does not actually persist
    rows.

------------------------------------------------------------------------

# 42. What We Are Going to Do Next (Pending UX Change)

The SCD feature scope is functionally complete and building. The next
change is a **UX redesign of income/expense entry** that was discussed
and drafted, then **fully reverted** because it depends on how income is
modeled/stored — which must be agreed with the **backend teammate before
implementation**.

Nothing from that draft remains in the codebase (the temporary files
were deleted and the mock/utilities were restored).

## The planned changes

### 1. Replace "Add Transaction" with "Add Expense"

-   The header **Add Transaction** button (and the transactions page)
    should become **Add Expense**.
-   It opens an **expense-only** form: Amount, Date, **Category
    (required)**, Description (optional).
-   Income would no longer be entered through the generic transaction
    form. No type toggle on the add-expense flow.

### 2. Add "Enter Income" with "Confirm & Lock"

-   A separate **Enter Income** button in the header opens an income
    flow.
-   Only **a single income figure per month** may be set.
-   Flow: enter an amount → confirmation modal showing the amount with
    an unmissable warning text along the lines of:
    > "You cannot change this income after pressing this button."
-   A danger **"Confirm & Lock"** button creates the income transaction
    and locks it.

### 3. Income is locked afterward

-   A locked monthly income **cannot be edited or deleted** in the UI.
-   The Enter Income button reflects the locked state (e.g. disabled /
    "Income locked").
-   The only way to change it is to reset the month (see below).

### 4. "Reset month" to re-enter

-   A **Reset month** action (planned on the Dashboard) deletes the
    selected month's data — income, expenses, budget, and category
    allocations — so the user can re-enter income and start over.
-   It should be a destructive, clearly-confirmed action (e.g. a modal
    listing what will be deleted, requiring an explicit typed
    confirmation such as `RESET` before the red confirm button
    enables).

------------------------------------------------------------------------

# 43. Open Decision — Where the Income Lock Lives

The single most important thing to settle with the backend teammate is
**where the lock is enforced**, since it determines whether this prompt
can be implemented entirely in the frontend or needs new backend work.
The options discussed:

## Option A — Frontend only (Recommended while unblocked)

-   Derive the lock from data: a month is "locked" whenever an Income
    transaction exists for it. No new storage, no new API.
-   Implementation notes (from the draft):
    -   Income modeled as **one Income transaction** dated on the 1st
        of the month (e.g. `2026-09-01`) with description "Monthly
        income" and `category_id: null`.
    -   An `IncomeContext` computes `income` / `incomeLocked` for the
        selected month from the analytics summary, driving the header
        Enter Income button.
    -   Reset month = delete allocations → budget → month transactions
        (all existing DELETE endpoints), then reload.
-   Pros: works immediately against the current API and the mock;
    simplest to implement and demo.
-   Cons: it is a UI convention, not backend enforcement. If the
    backend were later to allow multiple incomes, or income edit/delete,
    the backend would not prevent it.

## Option B — With the backend

-   Requires the backend teammate to add support, e.g. any of:
    -   a dedicated "monthly income" concept/endpoint,
    -   a uniqueness constraint (one income per month), and/or
    -   an explicit locked flag stored per month.
-   The frontend then reads/writes that API and the backend is
    authoritative.
-   Pros: authoritative; survives multiple clients.
-   Cons: needs cross-team agreement and backend changes before the
    frontend work can start.

## Status

Chosen direction at the time: **Option A (frontend only)**, the draft
was implemented for a test, then **reverted in full**. Implementation is
on hold until the lock/confirm behavior is agreed with the backend
teammate.

------------------------------------------------------------------------

# END OF HANDOFF DOCUMENT
