import csv
import io
from datetime import date
from decimal import Decimal, InvalidOperation


class TransactionCSVCodec:
    """Translate between transaction records and the public CSV format."""

    HEADERS = ("type", "amount", "date", "description", "category_id")

    @classmethod
    def encode(cls, transactions) -> str:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=cls.HEADERS)
        writer.writeheader()
        for transaction in transactions:
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

    @classmethod
    def decode(
        cls, content: str
    ) -> list[tuple[str, Decimal, date, str | None, int | None]]:
        reader = csv.DictReader(io.StringIO(content))
        if reader.fieldnames is None or set(reader.fieldnames) != set(cls.HEADERS):
            raise ValueError(
                "CSV must contain type, amount, date, description, and category_id columns"
            )

        transactions = []
        for row_number, row in enumerate(reader, start=2):
            try:
                amount = Decimal(row["amount"])
                transaction_date = date.fromisoformat(row["date"])
                category_text = (row.get("category_id") or "").strip()
                category_id = int(category_text) if category_text else None
                transactions.append(
                    (
                        row["type"].strip(),
                        amount,
                        transaction_date,
                        (row.get("description") or "").strip() or None,
                        category_id,
                    )
                )
            except (KeyError, ValueError, InvalidOperation) as exc:
                raise ValueError(
                    f"invalid transaction on CSV row {row_number}: {exc}"
                ) from exc
        return transactions
