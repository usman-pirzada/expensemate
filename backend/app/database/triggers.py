from sqlalchemy import text
from sqlalchemy.engine import Connection


SQLITE_INSERT_TRIGGER = text(
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

SQLITE_UPDATE_TRIGGER = text(
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
            - CASE WHEN NEW.budget_id = OLD.budget_id THEN OLD.amount ELSE 0 END
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

POSTGRES_FUNCTION = text(
    """
    CREATE OR REPLACE FUNCTION enforce_budget_allocation_limit()
    RETURNS TRIGGER AS $$
    DECLARE
        budget_limit NUMERIC(12, 2);
        already_allocated NUMERIC(12, 2);
    BEGIN
        -- Serialize writers for the same budget before calculating the total.
        SELECT overall_amount INTO budget_limit
        FROM budgets
        WHERE id = NEW.budget_id
        FOR UPDATE;

        IF budget_limit IS NULL THEN
            RAISE EXCEPTION 'Budget % does not exist', NEW.budget_id;
        END IF;

        IF TG_OP = 'UPDATE' THEN
            SELECT COALESCE(SUM(amount), 0) INTO already_allocated
            FROM budget_allocations
            WHERE budget_id = NEW.budget_id AND id <> OLD.id;
        ELSE
            SELECT COALESCE(SUM(amount), 0) INTO already_allocated
            FROM budget_allocations
            WHERE budget_id = NEW.budget_id;
        END IF;

        IF already_allocated + NEW.amount > budget_limit THEN
            RAISE EXCEPTION 'Category allocations cannot exceed the overall monthly budget'
                USING ERRCODE = 'check_violation';
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """
)


def create_budget_triggers(connection: Connection) -> None:
    """Install database-specific guards for aggregate budget allocation limits."""
    dialect = connection.dialect.name
    if dialect == "sqlite":
        connection.execute(SQLITE_INSERT_TRIGGER)
        connection.execute(SQLITE_UPDATE_TRIGGER)
        return

    if dialect == "postgresql":
        connection.execute(POSTGRES_FUNCTION)
        connection.execute(
            text("DROP TRIGGER IF EXISTS prevent_budget_allocation_overflow ON budget_allocations")
        )
        connection.execute(
            text(
                """
                CREATE TRIGGER prevent_budget_allocation_overflow
                BEFORE INSERT OR UPDATE OF budget_id, amount ON budget_allocations
                FOR EACH ROW EXECUTE FUNCTION enforce_budget_allocation_limit()
                """
            )
        )
        return

    raise RuntimeError(f"Budget allocation integrity triggers are not implemented for {dialect}")
