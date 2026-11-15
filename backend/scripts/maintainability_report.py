"""Compare structural maintainability indicators between two Git refs.

Dependency-free AST report; not a whole-program complexity score.
Run from the repository root:
    python backend/scripts/maintainability_report.py --base-ref origin/assignment-01-baseline --head-ref HEAD
"""

import argparse
import ast
import json
import subprocess

ROUTERS_DIR = "backend/app/routers"
SERVICE_FILES = (
    "backend/app/services/transaction_service.py",
    "backend/app/services/csv_service.py",
)


def git_text(ref: str, path: str) -> str | None:
    result = subprocess.run(
        ["git", "show", f"{ref}:{path}"],
        check=False,
        capture_output=True,
        text=True,
    )
    return result.stdout if result.returncode == 0 else None


def router_paths(ref: str) -> list[str]:
    result = subprocess.run(
        ["git", "ls-tree", "-r", "--name-only", ref, ROUTERS_DIR],
        check=True,
        capture_output=True,
        text=True,
    )
    return [line for line in result.stdout.splitlines() if line.endswith(".py")]


def repository_bypass_files(ref: str) -> list[str]:
    bypasses = []
    for path in router_paths(ref):
        source = git_text(ref, path)
        if source is not None:
            tree = ast.parse(source, filename=path)
            if any(
                isinstance(node, ast.ImportFrom)
                and (node.module or "").startswith("app.repositories")
                for node in ast.walk(tree)
            ):
                bypasses.append(path)
    return bypasses


def class_decision_points(source: str, class_name: str, filename: str) -> int:
    tree = ast.parse(source, filename=filename)
    target = next(
        (
            node
            for node in tree.body
            if isinstance(node, ast.ClassDef) and node.name == class_name
        ),
        None,
    )
    if target is None:
        return 0

    decision_nodes = (ast.If, ast.For, ast.AsyncFor, ast.While, ast.ExceptHandler)
    points = sum(isinstance(node, decision_nodes) for node in ast.walk(target))
    points += sum(
        max(0, len(node.values) - 1)
        for node in ast.walk(target)
        if isinstance(node, ast.BoolOp)
    )
    return points


def orchestration_complexity(ref: str) -> dict[str, int]:
    result = {}
    for path in SERVICE_FILES:
        source = git_text(ref, path)
        class_name = (
            "TransactionService"
            if path.endswith("transaction_service.py")
            else "CSVService"
        )
        result[class_name] = (
            class_decision_points(source, class_name, path)
            if source is not None
            else 0
        )
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-ref", default="assignment-01-baseline")
    parser.add_argument("--head-ref", default="HEAD")
    args = parser.parse_args()

    before_bypasses = repository_bypass_files(args.base_ref)
    after_bypasses = repository_bypass_files(args.head_ref)
    before_complexity = orchestration_complexity(args.base_ref)
    after_complexity = orchestration_complexity(args.head_ref)
    print(
        json.dumps(
            {
                "method": {
                    "repository_bypasses": (
                        "Count of router modules importing app.repositories directly"
                    ),
                    "orchestration_decision_points": (
                        "AST count of if/for/while/except and boolean-operator branches "
                        "in TransactionService and CSVService; lower indicates simpler "
                        "orchestration in these two classes"
                    ),
                },
                "before": {
                    "router_modules_with_repository_bypasses": len(before_bypasses),
                    "repository_bypass_modules": before_bypasses,
                    "service_decision_points": before_complexity,
                    "service_decision_points_total": sum(before_complexity.values()),
                },
                "after": {
                    "router_modules_with_repository_bypasses": len(after_bypasses),
                    "repository_bypass_modules": after_bypasses,
                    "service_decision_points": after_complexity,
                    "service_decision_points_total": sum(after_complexity.values()),
                },
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
