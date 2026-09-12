import csv
import io
from datetime import date
from decimal import Decimal, InvalidOperation

from sqlalchemy.orm import Session

from app.services.transaction_service import TransactionService


class CSVService:
    """Import and export transactions using a simple CSV representation."""

    HEADERS = ["type", "amount", "date", "description", "category_id"]

    def __init__(self, db: Session) -> None:
        self.transactions = TransactionService(db)

    def export_transactions(self) -> str:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=self.HEADERS)
        writer.writeheader()
        for transaction in self.transactions.list_all():
            writer.writerow(
                {
                    "type": transaction.type,
                    "amount": transaction.amount,
                    "date": transaction.date.isoformat(),
                    "description": transaction.description or "",
                    "category_id": transaction.category_id or "",
                }
            )
        return output.getvalue()

    def import_transactions(self, content: str) -> int:
        reader = csv.DictReader(io.StringIO(content))
        if reader.fieldnames is None or set(reader.fieldnames) != set(self.HEADERS):
            raise ValueError("CSV must contain type, amount, date, description, and category_id columns")

        imported = 0
        for row_number, row in enumerate(reader, start=2):
            try:
                amount = Decimal(row["amount"])
                transaction_date = date.fromisoformat(row["date"])
                category_text = (row.get("category_id") or "").strip()
                category_id = int(category_text) if category_text else None
                self.transactions.create(
                    transaction_type=row["type"].strip(),
                    amount=amount,
                    transaction_date=transaction_date,
                    description=(row.get("description") or "").strip() or None,
                    category_id=category_id,
                )
                imported += 1
            except (KeyError, ValueError, InvalidOperation) as exc:
                raise ValueError(f"invalid transaction on CSV row {row_number}: {exc}") from exc
        return imported
