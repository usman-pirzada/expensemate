from datetime import date
from decimal import Decimal
from types import SimpleNamespace

import pytest

from app.services.transaction_csv_codec import TransactionCSVCodec
from app.services.transaction_validator import TransactionValidator


@pytest.mark.parametrize(
    "content",
    [
        "type,amount,date,description,category_id,category_id\n",
        "type,amount,date,description\n",
        "type,amount,date,description,category_id\nExpense,1,2026-01-01,x,1,extra\n",
        "type,amount,date,description,category_id\nExpense,1\n",
        "type,amount,date,description,category_id\nExpense,1,not-a-date,x,1\n",
    ],
)
def test_csv_codec_rejects_invalid_structure_or_missing_values(content):
    with pytest.raises(ValueError):
        TransactionCSVCodec.decode(content)


@pytest.mark.parametrize("amount", ["NaN", "Infinity", "-Infinity", "10000000000.00"])
def test_csv_import_rejects_non_finite_or_out_of_range_amounts(amount):
    decoded = TransactionCSVCodec.decode(
        "type,amount,date,description,category_id\n"
        f"Income,{amount},2026-01-01,Salary,\n"
    )
    transaction_type, parsed_amount, transaction_date, _, category_id = decoded[0]

    validator = TransactionValidator(categories=None)
    with pytest.raises(ValueError):
        validator.validate(
            transaction_type, parsed_amount, transaction_date, category_id
        )


def test_csv_codec_accepts_utf8_bom_and_optional_empty_cells():
    result = TransactionCSVCodec.decode(
        "\ufefftype,amount,date,description,category_id\n"
        "Income,2500.00,2026-01-01,,\n"
    )
    assert result == [
        ("Income", Decimal("2500.00"), date(2026, 1, 1), None, None)
    ]


def test_csv_codec_round_trips_quotes_and_newlines():
    transaction = SimpleNamespace(
        type="Expense",
        amount=Decimal("123.45"),
        date=date(2026, 1, 2),
        description='Lunch, with "team"\nfollow-up',
        category_id=7,
    )
    encoded = TransactionCSVCodec.encode([transaction])
    assert TransactionCSVCodec.decode(encoded) == [
        ("Expense", Decimal("123.45"), date(2026, 1, 2), transaction.description, 7)
    ]
