# GHOST//ARCHIVE 👻

> **Every repository is haunted by code that used to exist.**

**GHOST//ARCHIVE** is a local-first AI archaeology tool that explores Git history, discovers deleted source files, restores the code that existed immediately before deletion, and uses **Gemma 3 through Ollama** to investigate what the recovered code did.

The project was built for the **Hacktoberfest 2026 Open-Source AI Challenge — Week 4: Ghost in the Machine**.

## Live project

- **Web app:** https://ghost-archive-mvp.onrender.com/
- **API documentation:** https://ghost-archive-mvp-backend.vercel.app/docs
- **Source code:** https://github.com/Njorodev/ghost-archive-mvp

> **Important:** the hosted site is a public demonstration of the archive workflow. Full arbitrary local-repository scanning and local Gemma inference require running GHOST//ARCHIVE locally.

---

## Why GHOST//ARCHIVE?

Source control remembers things the current codebase no longer shows:

- deleted modules
- retired functions
- abandoned implementations
- historical commit messages
- source code that disappeared during refactors

GHOST//ARCHIVE treats those traces as **digital ghosts**.

Instead of asking an AI model to invent a story about old code, the application first reconstructs evidence from Git and then clearly separates:

### Verified archive evidence
Facts derived directly from repository history:

- historical file path
- deletion commit
- deletion date
- commit message
- recovered source code
- detected symbols

### AI interpretation / hypothesis
Gemma explains what the code appears to do and what the history may suggest, but uncertain conclusions remain explicitly labelled as interpretation.

The model is instructed to say:

> **The archive does not establish this.**

when repository evidence is insufficient.

---

## Features

- 🔎 Scans Git history for deleted files.
- ♻️ Recovers the exact source from the parent of the deletion commit.
- 🧭 Uses Git rename detection so ordinary renames are not treated as deleted artifacts.
- 🧩 Extracts likely Python and JavaScript/TypeScript symbols.
- 👻 Investigates recovered code with Gemma 3 through Ollama.
- 🧠 Separates verified Git evidence from AI hypotheses.
- 📝 Renders Gemma investigation reports as Markdown.
- 📋 Lets users copy recovered historical source.
- 🔍 Provides search across recovered artifacts.
- 🧪 Includes automated tests for core archive behavior and AI failure handling.
- 🎭 Includes a one-click haunted demo archive.
- 🔐 Executes Git through argument arrays without shell execution.
- 🖥️ Provides both a full local mode and a lightweight hosted demo mode.

---

## Architecture

```text
                         LOCAL MODE

┌────────────────────┐
│ React + Vite UI    │
│ localhost:5173     │
└─────────┬──────────┘
          │ HTTP
          ▼
┌────────────────────┐
│ FastAPI backend    │
│ localhost:8000     │
└──────┬────────┬────┘
       │        │
       │        └──────────────► Ollama
       │                         │
       │                         ▼
       │                     Gemma 3
       │
       ▼
 Local Git repository
       │
       ▼
 Git history / deleted artifacts


                      HOSTED DEMO MODE

┌────────────────────┐
│ React + Vite       │
│ Render             │
└─────────┬──────────┘
          │ HTTPS
          ▼
┌────────────────────┐
│ FastAPI API        │
│ Vercel             │
└─────────┬──────────┘
          │
          ▼
 Synthetic demo artifact
```

### Why two modes?

A browser-hosted backend cannot directly access a visitor's Windows filesystem, and a Vercel serverless function cannot use the Ollama server running on the visitor's `localhost`.

For that reason:

| Capability | Local mode | Hosted demo |
|---|:---:|:---:|
| Create demo archive | ✅ | ✅ |
| Scan the included demo | ✅ | ✅ |
| Scan arbitrary local Git repositories | ✅ | ❌ |
| Recover real Git history | ✅ | Demo-only |
| Local Gemma / Ollama investigation | ✅ | ❌ |
| Verified evidence UI | ✅ | ✅ |
| Publicly accessible interface | ❌ | ✅ |

The **intended privacy-sensitive workflow is local mode**. The hosted deployment exists so judges and visitors can explore the interface and archive flow without installing the stack first.

---

## How the Git archaeology works

GHOST//ARCHIVE searches repository history for deletions using Git:

```text
git log --all --find-renames --diff-filter=D --name-status
```

`--find-renames` helps distinguish file renames from genuine deletions.

For every deleted artifact, the application records:

```text
commit hash
deletion date
commit subject
historical path
```

The source is then recovered from the commit immediately before deletion:

```text
git show <deletion-commit>^:<historical-path>
```

Recovered source is treated as historical, untrusted data and is **never executed** by GHOST//ARCHIVE.

The current release intentionally focuses on deleted artifacts. Ordinary modifications are not classified as ghosts.

---

## Evidence-first AI investigation

GHOST//ARCHIVE does not treat AI output as repository truth.

The backend generates an evidence collection before presenting Gemma's interpretation.

Example:

```text
VERIFIED
Deletion commit
4d91a8f...

VERIFIED
Historical path
legacy.py

VERIFIED
Deletion date
2026-10-29

SUPPORTED CLUE
Commit message
Remove legacy billing module after billing refactor
```

Gemma then receives the recovered source plus repository metadata with instructions to:

1. explain what the code does;
2. identify evidence directly visible in the source;
3. separate historical clues from speculation;
4. state what remains unknown;
5. avoid claiming developer intent without evidence.

The frontend visually separates **Verified Archive Evidence** from **AI Interpretation / Hypothesis**.

---

## Tech stack

### Frontend

- React
- Vite
- Lucide React
- React Markdown
- remark-gfm

### Backend

- Python
- FastAPI
- Pydantic
- Requests
- Git CLI

### AI

- Gemma 3
- Ollama

### Testing

- Pytest
- FastAPI TestClient
- HTTPX

### Deployment

- Render — frontend
- Vercel — FastAPI backend / hosted demo API

---

## Requirements for full local mode

- Windows 10/11
- Git for Windows
- Python 3.10+
- Node.js 20.19+ or 22.12+
- Ollama
- Gemma 3 model

The project can also be adapted to macOS or Linux, but the current setup instructions are focused on Windows.

---

## Local installation

### 1. Clone the repository

```powershell
git clone https://github.com/Njorodev/ghost-archive-mvp.git
cd ghost-archive-mvp
```

### 2. Install Gemma with Ollama

Install Ollama, then run:

```powershell
ollama pull gemma3:1b
ollama run gemma3:1b
```

`gemma3:1b` is the default model because it is substantially more practical on CPU-only machines.

After the model has loaded, you can exit the interactive session. Ollama normally exposes its local API at:

```text
http://127.0.0.1:11434
```

The backend communicates with:

```text
POST /api/generate
```

on that local Ollama server.

---

## 3. Start the backend

Open PowerShell in the repository root:

```powershell
cd backend

py -m venv .venv
.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

If PowerShell blocks virtual-environment activation:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Local API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 4. Start the frontend

Open a second PowerShell terminal:

```powershell
cd frontend

npm install
npm run dev
```

Vite normally starts the frontend at:

```text
http://localhost:5173
```

The frontend uses:

```text
VITE_API_URL
```

when provided, and falls back to:

```text
http://127.0.0.1:8000
```

for local development.

---

## 5. Try the built-in demo

From the UI:

```text
Create demo archive
        ↓
Scan archive
        ↓
Select legacy.py
        ↓
Inspect recovered source
        ↓
Interrogate
        ↓
Review evidence + Gemma hypothesis
```

The local backend creates a real temporary Git repository containing a historical Python billing module, commits it, deletes it in a later commit, and then allows GHOST//ARCHIVE to recover it from Git history.

---

## Scan a real repository

Run GHOST//ARCHIVE locally and enter an absolute repository path such as:

```text
C:\dev\my-project
```

Then choose:

```text
Scan archive
```

GHOST//ARCHIVE will inspect deletion history without executing source code.

Only scan repositories you own or are authorized to inspect.

---

## API

### Health

```text
GET /api/health
```

### Create demo archive

```text
POST /api/demo
```

### Scan archive

```text
POST /api/scan
```

Example request:

```json
{
  "repo_path": "C:\\dev\\my-project"
}
```

### Investigate artifact

```text
POST /api/investigate
```

The local implementation sends the selected recovered artifact to the Ollama API running on the same computer.

---

## Automated tests

Activate the backend virtual environment and run:

```powershell
cd backend
pytest -q
```

The current test suite covers:

- deleted file recovery;
- edited files not being misclassified as deletions;
- renamed files not being misclassified as deletions;
- empty repositories;
- unavailable Ollama / AI failure handling;
- evidence confidence classification.

---

## Project structure

```text
ghost-archive-mvp/
├── .gitignore
├── LICENSE
├── README.md
├── package-lock.json
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── tests/
│       └── test_archive.py
│
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── main.jsx
        └── style.css
```

---

## Privacy and safety

### Local mode

The full local workflow is designed around source-code privacy:

- Git operations happen on the developer's computer.
- Ollama inference happens on the developer's computer.
- No hosted AI API is required.
- Git commands are invoked with argument arrays rather than through a shell.
- Recovered source is inspected as text and is never executed.
- AI conclusions are displayed separately from verified Git evidence.

### Hosted demo

The public hosted application should be treated as a **demonstration environment**, not as the private-repository workflow.

Do not paste proprietary source code, secrets, credentials, API keys, or sensitive repository content into a public hosted service.

For private code, clone the project and run the complete stack locally.

---

## Known limitations

GHOST//ARCHIVE is an MVP built during the Hacktoberfest challenge window.

Current limitations include:

- The archaeology engine currently detects **deletions**, not general edit history.
- Symbol extraction is intentionally lightweight and currently targets common Python and JavaScript/TypeScript patterns.
- Source previews are capped to protect the model context window.
- The hosted Vercel backend cannot access Git repositories on a visitor's computer.
- The hosted backend cannot access a visitor's local Ollama instance.
- The hosted demo therefore uses a deterministic synthetic artifact rather than a private local repository.
- AI interpretation can still be wrong; Git evidence remains authoritative.
- Local Ollama inference performance depends heavily on available CPU/GPU and memory.

---

## Why open-weight AI matters

This project handles source code, which may contain proprietary algorithms, unreleased features, internal architecture, or security-sensitive logic.

Using Gemma through Ollama allows the complete investigation workflow to run locally:

```text
repository → Git archaeology → recovered source → Gemma
```

without requiring the code to be sent to a closed hosted model.

It also means developers can:

- run the application without a paid AI API;
- choose a model appropriate for their hardware;
- swap Gemma variants;
- inspect and control the complete inference path;
- keep private repositories on infrastructure they control.

That local control is not an add-on to GHOST//ARCHIVE — it is part of the product's core design.

---

## Hacktoberfest 2026 — Ghost in the Machine

GHOST//ARCHIVE was created for the **Hacktoberfest Open-Source AI Challenge 2026, Week 4: Ghost in the Machine**.

The project interprets the theme literally:

> software projects are haunted by code that no longer exists in the current version, but still survives inside Git history.

The open-source AI component is **Gemma 3**, running locally through **Ollama**.

The project also uses **Render** for the public frontend deployment.

Relevant challenge categories include:

- Overall — Ghost in the Machine
- Best Use of Gemma
- Best Use of Render

---

## Roadmap

Possible post-challenge improvements:

- modified-code archaeology;
- commit-to-commit function comparison;
- file resurrection timelines;
- AST-based symbol detection;
- public GitHub repository cloning in cloud demo mode;
- model-performance presets;
- exportable investigation reports;
- richer evidence citations;
- repository-wide historical search.

---

## Contributing

Issues and pull requests are welcome.

When contributing:

1. create a branch;
2. keep recovered code read-only;
3. add tests for changes to Git-history behavior;
4. preserve the evidence-versus-hypothesis distinction;
5. avoid introducing hosted source-code transmission without making it explicit.

---

## License

Released under the **MIT License**.

See [`LICENSE`](LICENSE).

---

## Closing thought

> **Some code never truly dies.**

Functions disappear. Files are deleted. Architectures change. Developers move on.

Git remembers.

GHOST//ARCHIVE gives those forgotten lines one more chance to speak.
