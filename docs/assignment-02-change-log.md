# Assignment 02 — Change Log

Repository: `usman-pirzada/expensemate`  
Assignment 01 baseline: branch `assignment-01-baseline`, commit `b26c524bd699ea54159326a18437ebd48d361597`  
Assignment 02 implementation: branch `assignment-02-completion`  
Target comparison branch: `staging`

| Commit | Files / components affected | Change and reason |
|---|---|---|
| `c652219f2e74bff59d6f007f3f706883ef6de8cf` | `.env.example`, `Dockerfile`, `docker-compose.yml`, database connection/init/triggers, category router/service, transaction and CSV services, new validator and codec, migration script, backend tests | Introduced SQLite-to-PostgreSQL migration path; made DB setup dialect-aware; removed direct category-router repository access; extracted transaction validation and CSV conversion to separate components. |
| `bb0d4d321b868b68b0b2fd0ba993b96f5cbf103a` | `docker-compose.yml`, `backend/tests/test_refactoring.py` | Corrected Compose interpolation and migration test fixture details found during review. |
| `f0c8e99545db77c4eccce59566499e219200a7e4` | `docker-compose.yml` | Corrected escaping for Compose health-check environment variables. |
| `e787245987f99e76f658a0776751d1ca84b79b05` | Compose health-check configuration | Deferred environment variable expansion to the database container shell. |
| `a1083ec6f05fcf3017293dfa8bbd01865241d0a6` | `docker-compose.yml` | Escaped health-check shell variables to prevent Compose-side interpolation. |
| `ae336e9f463f731fdf000e50e8de34ec94822325` | `docker-compose.yml` | Closed the PostgreSQL health-check command string and corrected its YAML command definition. |
| `df420e31d9cc5ebb11797dd969212b571d82a9b1` | CSV codec and validator, backend test configuration, CSV and PostgreSQL tests, maintainability script, CI workflow, Dockerfile, implementation notes | Hardened malformed CSV and decimal validation; added live PostgreSQL migration verification; added reproducible maintainability comparison and automated backend/frontend verification. |
| `3de68e4d04e7af1d00cd82ea839b376ded849547` | `backend/tests/test_api.py` | Corrected CSV API test fixture to use real line breaks so the API test exercises the intended invalid-amount case. |
| `ae3a7c9f900cead566e4bbb2bd541575b15f60a1` | `.github/workflows/ci.yml`, `docs/assignment-02-implementation.md` | Added Docker Compose PostgreSQL application smoke test and documented the measured before/after architecture. |

## Verification record

CI run [43667589460](https://github.com/usman-pirzada/expensemate/actions/runs/43667589460) for commit `ae3a7c9f900cead566e4bbb2bd541575b15f60a1` completed successfully:
- Backend: 47 passed.
- Frontend: 14 passed across 3 test files; production build succeeded.
- Docker Compose: application/PostgreSQL startup and health/API smoke test succeeded.

## Version-control arrangement

The Assignment 01 baseline is retained on `assignment-01-baseline`. Assignment 02 changes are on `assignment-02-completion`; the original `assignment-02-refactor` branch remains available. `main` and `staging` remain unchanged by these Assignment 02 commits. The implementation branch is ten commits ahead of `staging` at the time this change log was prepared.

## Team contribution record

Task ownership must be entered by the team members based on the work they actually performed. Git commit author data can identify repository commits but does not, by itself, establish the complete division of team work.
