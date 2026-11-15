import csv
import io
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Iterable


class TransactionCSVCodec:
    """Translate between transaction records and the public CSV format."""

    HEADERS = ("type", "amount", "date", "description", "category_id")
    _EXTRA_COLUMNS_KEY = "__extra_columns__"

    @classmethod
    def encode(cls, transactions: Iterable[object]) -> str:
        output = io.StringIO(newline="")
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
        if not isinstance(content, str):
            raise ValueError("CSV content must be text")

        reader = csv.DictReader(
            io.StringIO(content, newline=""),
            restkey=cls._EXTRA_COLUMNS_KEY,
            restval=None,
            strict=True,
        )
        headers = reader.fieldnames
        normalized_headers = (
            [header.lstrip("\ufeff") if header else header for header in headers]
            if headers is not None
            else None
        )
        if (
            normalized_headers is None
            or len(normalized_headers) != len(cls.HEADERS)
            or len(set(normalized_headers)) != len(cls.HEADERS)
            or set(normalized_headers) != set(cls.HEADERS)
        ):
            raise ValueError(
                "CSV must contain each of these columns exactly once: "
                "type, amount, date, description, category_id"
            )

        # Accept an optional UTF-8 BOM on the first column name.
        reader.fieldnames = normalized_headers
        transactions = []
        try:
            for row_number, row in enumerate(reader, start=2):
                if row.get(cls._EXTRA_COLUMNS_KEY) is not None:
                    raise ValueError(
                        f"invalid transaction on CSV row {row_number}: too many columns"
                    )

                transaction_type = row.get("type")
                amount_text = row.get("amount")
                date_text = row.get("date")
                if not transaction_type or not amount_text or not date_text:
                    raise ValueError(
                        f"invalid transaction on CSV row {row_number}: "
                        "type, amount, and date are required"
                    )

                try:
                    amount = Decimal(amount_text.strip())
                    transaction_date = date.fromisoformat(date_text.strip())
                    category_text = (row.get("category_id") or "").strip()
                    category_id = int(category_text) if category_text else None
                except (ValueError, InvalidOperation, TypeError) as exc:
                    raise ValueError(
                        f"invalid transaction on CSV row {row_number}: {exc}"
                    ) from exc

                transactions.append(
                    (
                        transaction_type.strip(),
                        amount,
                        transaction_date,
                        (row.get("description") or "").strip() or None,
                        category_id,
                    )
                )
        except csv.Error as exc:
            raise ValueError(f"invalid CSV format: {exc}") from exc

        return transactions
