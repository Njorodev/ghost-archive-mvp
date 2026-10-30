# GHOST//ARCHIVE 👻

**A local-first AI archaeologist for forgotten code.** Explore deleted files in Git history, recover the exact historical source, and ask a local Gemma model to explain what the evidence shows.

## MVP features
- Scans a local Git repository for deleted files.
- Recovers source from the parent of the deletion commit.
- Extracts likely Python/JavaScript function names for quick investigation.
- Uses Ollama's local API for AI explanations; the source code is sent to `localhost` only.
- Includes a one-click demo repository generator.
- Keeps facts and hypotheses separate in the investigation prompt.

## Requirements
- Windows 10/11
- Git for Windows
- Python 3.10+
- Node.js 20.19+ or 22.12+
- Ollama (optional for scanning; required for AI investigation)

## 1. Install and start Ollama
Install from https://ollama.com/download/windows, then open PowerShell:

```powershell
ollama pull gemma3:1b
ollama run gemma3:1b
```

You can exit the interactive model after it loads. Ollama normally serves its local API at `http://localhost:11434`.

If `gemma3:4b` is too slow for your hardware, try a smaller available Gemma model from the Ollama library. You can change the model in the app's AI Model field.

## 2. Start the backend
Open PowerShell in the project directory:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

If PowerShell blocks activation, run this once in the current terminal:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Backend API docs: http://127.0.0.1:8000/docs

## 3. Start the frontend
Open a **second** PowerShell window in the project directory:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally http://localhost:5173.

## 4. Try the demo
Click **Create demo archive**. The backend creates a small Git repository with a file that is later deleted. Then click **Scan archive**, select the recovered artifact, and click **Interrogate with local AI**.

Scanning works without Ollama. AI investigation requires Ollama to be running and the selected model to be pulled.

## Privacy and safety
- The MVP accepts a local filesystem path and invokes Git using argument arrays, not a shell.
- Use only repositories you are authorized to inspect.
- AI inference calls `http://127.0.0.1:11434/api/generate`; it does not intentionally send code to a hosted service.
- Do not expose the backend port to the public internet. This MVP is designed for local use, not multi-user deployment.
- Treat AI output as a hypothesis. The app displays commit evidence separately and does not claim to know why a deletion happened unless the commit history establishes it.

## Project structure
```text
ghost-archive-mvp/
├── README.md
├── LICENSE
├── .gitignore
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── main.jsx
        └── style.css
```

## Next steps before submission
1. Create a **new GitHub repository during the official challenge window** and push this project there.
2. Run the complete workflow on your own Windows machine and capture screenshots / a short demo.
3. Add tests, a clear architecture diagram, and any known limitations.
4. Publish a DEV post using the Week 4 challenge's official submission template and tags: `devchallenge` and `hf26challenge`.
5. Disclose any AI-assisted code generation and verify the final submission rules yourself.

## License
MIT. See `LICENSE`.
