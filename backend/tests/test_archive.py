import pytest
import subprocess
from pathlib import Path
from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


def git(repo: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(repo), *args],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def make_repo(tmp_path: Path) -> Path:
    repo = tmp_path / "repo"
    repo.mkdir()
    git(repo, "init", "-b", "main")
    git(repo, "config", "user.name", "Ghost Tester")
    git(repo, "config", "user.email", "ghost@example.test")
    return repo


def commit_all(repo: Path, message: str):
    git(repo, "add", "-A")
    git(repo, "commit", "-m", message)


def test_deleted_file_is_recovered(tmp_path):
    repo = make_repo(tmp_path)
    f = repo / "legacy.py"
    f.write_text("def vanished():\n    return 42\n", encoding="utf-8")
    commit_all(repo, "Add legacy helper")
    f.unlink()
    commit_all(repo, "Remove legacy helper")

    response = client.post("/api/scan", json={"repo_path": str(repo)})
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["artifacts"][0]["path"] == "legacy.py"
    assert "def vanished" in body["artifacts"][0]["source"]


def test_edit_history_does_not_look_like_deletion(tmp_path):
    repo = make_repo(tmp_path)
    f = repo / "active.py"
    f.write_text("def value():\n    return 1\n", encoding="utf-8")
    commit_all(repo, "Add active helper")
    f.write_text("def value():\n    return 2\n", encoding="utf-8")
    commit_all(repo, "Edit active helper")

    response = client.post("/api/scan", json={"repo_path": str(repo)})
    assert response.status_code == 200
    assert response.json()["count"] == 0


def test_renamed_file_is_not_classified_as_deleted(tmp_path):
    repo = make_repo(tmp_path)
    old = repo / "old_name.py"
    old.write_text("def keeper():\n    return 'alive'\n", encoding="utf-8")
    commit_all(repo, "Add helper")
    git(repo, "mv", "old_name.py", "new_name.py")
    commit_all(repo, "Rename helper")

    response = client.post("/api/scan", json={"repo_path": str(repo)})
    assert response.status_code == 200
    assert response.json()["count"] == 0


def test_empty_repository_returns_zero_artifacts(tmp_path):
    repo = make_repo(tmp_path)
    # Git log requires at least one commit, so create an empty initial commit.
    git(repo, "commit", "--allow-empty", "-m", "Initial empty commit")

    response = client.post("/api/scan", json={"repo_path": str(repo)})
    assert response.status_code == 200
    assert response.json()["count"] == 0


def test_ai_failure_is_reported_cleanly(monkeypatch):
    class Boom(Exception):
        pass

    def fake_post(*args, **kwargs):
        import requests
        raise requests.ConnectionError("offline")

    monkeypatch.setattr(main.requests, "post", fake_post)

    artifact = {
        "path": "legacy.py",
        "commit": "a" * 40,
        "date": "2026-10-29",
        "subject": "Remove old helper",
        "source": "def old():\n    return 1\n",
        "symbols": ["old"],
    }
    response = client.post(
        "/api/investigate",
        json={"artifact": artifact, "model": "gemma3:1b"},
    )
    assert response.status_code == 503
    assert "Cannot reach Ollama" in response.json()["detail"]


def test_evidence_labels_commit_message_as_supported():
    evidence = main.build_evidence(
        {
            "path": "legacy.py",
            "commit": "abc123",
            "date": "2026-10-29",
            "subject": "Remove legacy helper after refactor",
        }
    )
    message = next(item for item in evidence if item["label"] == "Commit message")
    assert message["kind"] == "supported"