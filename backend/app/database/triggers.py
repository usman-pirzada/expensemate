from sqlalchemy import text
from sqlalchemy.engine import Connection


BUDGET_ALLOCATION_INSERT_TRIGGER = text(
    """
    CREATE TRIGGER IF NOT EXISTS prevent_budget_allocation_overflow_insert
    BEFORE INSERT ON budget_allocations
    BEGIN
        SELECT CASE
            WHEN (
                SELECT COALESCE(SUM(amount), 0)
                FROM budget_allocations
                WHERE budget_id = NEW.budget_id
            ) + NEW.amount > (
                SELECT overall_amount
                FROM budgets
                WHERE id = NEW.budget_id
            )
            THEN RAISE(ABORT, 'Category allocations cannot exceed the overall monthly budget')
        END;
    END;
    """
)

BUDGET_ALLOCATION_UPDATE_TRIGGER = text(
    """
    CREATE TRIGGER IF NOT EXISTS prevent_budget_allocation_overflow_update
    BEFORE UPDATE OF budget_id, amount ON budget_allocations
    BEGIN
        SELECT CASE
            WHEN (
                SELECT COALESCE(SUM(amount), 0)
                FROM budget_allocations
                WHERE budget_id = NEW.budget_id
            )
            - CASE
                WHEN NEW.budget_id = OLD.budget_id THEN OLD.amount
                ELSE 0
              END
            + NEW.amount > (
                SELECT overall_amount
                FROM budgets
                WHERE id = NEW.budget_id
            )
            THEN RAISE(ABORT, 'Category allocations cannot exceed the overall monthly budget')
        END;
    END;
    """
)


def create_budget_triggers(connection: Connection) -> None:
    """Create database triggers used for cross-row budget integrity rules."""
    connection.execute(BUDGET_ALLOCATION_INSERT_TRIGGER)
    connection.execute(BUDGET_ALLOCATION_UPDATE_TRIGGER)
