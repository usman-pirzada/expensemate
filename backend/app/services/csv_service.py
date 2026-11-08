from sqlalchemy.orm import Session

from app.services.transaction_csv_codec import TransactionCSVCodec
from app.services.transaction_service import TransactionService


class CSVService:
    """Orchestrate CSV import/export through the transaction use case."""

    HEADERS = TransactionCSVCodec.HEADERS

    def __init__(self, db: Session) -> None:
        self.transactions = TransactionService(db)
        self.codec = TransactionCSVCodec()

    def export_transactions(self) -> str:
        return self.codec.encode(self.transactions.list_all())

    def import_transactions(self, content: str) -> int:
        pending = self.codec.decode(content)
        try:
            self.transactions.create_many(pending)
        except ValueError as exc:
            raise ValueError(f"invalid transaction in CSV: {exc}") from exc
        return len(pending)
