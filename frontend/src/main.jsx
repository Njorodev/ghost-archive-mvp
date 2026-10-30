import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Ghost, ScanSearch, FolderGit2, ShieldCheck, Activity, Search,
  Sparkles, Terminal, ChevronRight, FileCode2, Clock3, GitCommit,
  LoaderCircle, AlertTriangle, Copy, Check, Github, Skull, Radio,
} from "lucide-react";
import "./style.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [repoPath, setRepoPath] = useState("");
  const [model, setModel] = useState("gemma3:4b");
  const [artifacts, setArtifacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => artifacts.filter((a) =>
    `${a.path} ${a.subject} ${a.symbols.join(" ")}`.toLowerCase().includes(search.toLowerCase())
  ), [artifacts, search]);

  async function request(path, body) {
    const response = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || `Request failed (${response.status})`);
    return data;
  }

  async function makeDemo() {
    setBusy("demo"); setError(""); setNotice(""); setAnalysis("");
    try {
      const data = await request("/api/demo", {});
      setRepoPath(data.repo_path);
      setNotice("Demo archive created. The forgotten code is waiting.");
    } catch (e) { setError(e.message); }
    finally { setBusy(""); }
  }

  async function scan() {
    if (!repoPath.trim()) { setError("Enter a local Git repository path, or create the demo archive."); return; }
    setBusy("scan"); setError(""); setNotice(""); setAnalysis(""); setSelected(null);
    try {
      const data = await request("/api/scan", { repo_path: repoPath.trim() });
      setArtifacts(data.artifacts || []);
      if (data.artifacts?.length) {
        setSelected(data.artifacts[0]);
        setNotice(`Archive scanned. ${data.count} recoverable artifact${data.count === 1 ? "" : "s"} found.`);
      } else setNotice("The archive yielded no deleted files in the visible Git history.");
      if (data.warnings?.length) setError(data.warnings.join("\n"));
    } catch (e) { setError(e.message); }
    finally { setBusy(""); }
  }

  async function investigate() {
    if (!selected) return;
    setBusy("ai"); setError(""); setAnalysis("");
    try {
      const data = await request("/api/investigate", { artifact: selected, model });
      setAnalysis(data.response || "The model returned an empty response.");
    } catch (e) { setError(e.message); }
    finally { setBusy(""); }
  }

  async function copySource() {
    try {
      await navigator.clipboard.writeText(selected?.source || "");
      setCopied(true); setTimeout(() => setCopied(false), 1400);
    } catch { setError("Clipboard access was unavailable. Select and copy the source manually."); }
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#" aria-label="Ghost Archive home">
          <span className="brand-mark"><Ghost size={23} /></span>
          <span><strong>GHOST<span>//</span>ARCHIVE</strong><small>DIGITAL ARCHAEOLOGY TERMINAL</small></span>
        </a>
        <div className="topbar-right"><span className="local-pill"><span className="pulse-dot" /> LOCAL-FIRST AI</span><a className="github-link" href="https://github.com/new" target="_blank" rel="noreferrer"><Github size={16}/> New repo</a></div>
      </header>

      <main className="main-content">
        <section className="hero">
          <div className="eyebrow"><span className="eyebrow-line" /> FIELD NOTES / VOL. 001</div>
          <h1>Some code never<br/>truly <span>dies.</span></h1>
          <p className="hero-copy">Every repository is a haunted house. Search its history, recover what vanished, and let a local AI investigate the traces left behind.</p>
          <div className="hero-meta"><span><ShieldCheck size={15}/> Your code stays on your machine</span><span><Radio size={15}/> Ollama-powered inference</span></div>
        </section>

        <section className="control-panel panel">
          <div className="panel-heading"><div className="section-icon"><FolderGit2 size={18}/></div><div><h2>Enter the archive</h2><p>Point the scanner at a local Git repository.</p></div><span className="step-tag">01 / SCAN</span></div>
          <label className="field-label" htmlFor="repo-path">LOCAL REPOSITORY PATH</label>
          <div className="path-row"><div className="input-wrap"><Terminal size={16}/><input id="repo-path" value={repoPath} onChange={e=>setRepoPath(e.target.value)} placeholder="C:\Users\you\projects\my-repo" /></div><button className="primary-button" onClick={scan} disabled={!!busy}>{busy === "scan" ? <LoaderCircle className="spin" size={16}/> : <ScanSearch size={16}/>} Scan archive</button></div>
          <div className="control-footer"><button className="text-button" onClick={makeDemo} disabled={!!busy}>{busy === "demo" ? <LoaderCircle className="spin" size={15}/> : <Sparkles size={15}/>} Create demo archive</button><span className="microcopy">READ-ONLY SCAN · NO CODE EXECUTION</span></div>
        </section>

        {(error || notice) && <div className={`notice ${error ? "notice-error" : "notice-success"}`} role="status">{error ? <AlertTriangle size={17}/> : <Activity size={17}/>}<span>{error || notice}</span></div>}

        <section className="workspace">
          <aside className="panel artifact-panel">
            <div className="panel-heading compact"><div className="section-icon"><Skull size={18}/></div><div><h2>Recovered artifacts</h2><p>{artifacts.length} traces in this session</p></div><span className="count-badge">{artifacts.length.toString().padStart(2,"0")}</span></div>
            <div className="search-wrap"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search names, files, commits…" /></div>
            <div className="artifact-list">
              {filtered.map(a=><button key={a.id} className={`artifact-item ${selected?.id===a.id?"selected":""}`} onClick={()=>{setSelected(a);setAnalysis("");}}>
                <div className="artifact-file-icon"><FileCode2 size={17}/></div><div className="artifact-info"><strong>{a.path.split(/[\\/]/).pop()}</strong><span>{a.path}</span><small><Clock3 size={12}/>{a.date} <i>·</i> {a.short_commit}</small></div><ChevronRight size={16} className="artifact-chevron"/>
              </button>)}
              {!filtered.length && <div className="empty-state"><Ghost size={26}/><strong>{artifacts.length ? "No matching traces" : "The archive is silent"}</strong><span>{artifacts.length ? "Try another search term." : "Scan a repository or summon the demo archive to reveal deleted code."}</span></div>}
            </div>
            <div className="sidebar-foot"><span className="pulse-dot muted"/> HISTORICAL EVIDENCE ONLY</div>
          </aside>

          <section className="panel detail-panel">
            {!selected ? <div className="empty-detail"><div className="big-ghost"><Ghost size={42}/></div><span className="eyebrow">AWAITING DISCOVERY</span><h2>Something is missing.</h2><p>Scan a Git repository to find code that once lived here.</p></div> : <>
              <div className="detail-top"><div><div className="eyebrow"><span className="eyebrow-line"/> ARTIFACT DOSSIER</div><h2>{selected.path.split(/[\\/]/).pop()}</h2><p className="file-path">{selected.path}</p></div><span className="deleted-badge"><span/> DELETED</span></div>
              <div className="metadata-grid"><div><span>LAST KNOWN DATE</span><strong>{selected.date}</strong></div><div><span>DELETION COMMIT</span><strong><GitCommit size={14}/>{selected.short_commit}</strong></div><div><span>LANGUAGE</span><strong>{selected.language.toUpperCase()}</strong></div></div>
              <div className="commit-message"><span>COMMIT MESSAGE</span><p>{selected.subject || "No commit message recorded."}</p></div>
              {selected.symbols.length > 0 && <div className="symbols"><span className="mini-label">SYMBOLS DETECTED</span><div>{selected.symbols.map(s=><button key={s} onClick={()=>setSearch(s)}>{s}</button>)}</div></div>}
              <div className="source-heading"><div><h3><FileCode2 size={16}/> Recovered source</h3><span>RESTORED FROM PARENT COMMIT</span></div><button className="icon-button" title="Copy source" onClick={copySource}>{copied?<Check size={15}/>:<Copy size={15}/>}</button></div>
              <pre className="code-block"><code>{selected.source}</code></pre>
              {selected.source_truncated && <p className="warning-note">Source preview is truncated to protect the local model context window.</p>}
              <div className="investigate-box"><div className="investigate-heading"><div className="ai-orb"><Sparkles size={18}/></div><div><h3>Interrogate the ghost</h3><p>Ask a local open-weight model to examine the recovered evidence.</p></div></div>
                <label className="field-label" htmlFor="model-name">OLLAMA MODEL</label><div className="ai-controls"><input id="model-name" value={model} onChange={e=>setModel(e.target.value)} placeholder="gemma3:4b"/><button className="primary-button ai-button" onClick={investigate} disabled={!!busy || !selected.source}>{busy==="ai"?<><LoaderCircle className="spin" size={16}/> Listening…</>:<><Sparkles size={16}/> Interrogate</>}</button></div>
                {analysis && <div className="analysis-output"><div className="analysis-label"><Sparkles size={14}/> INVESTIGATION REPORT <span>AI-GENERATED · VERIFY AGAINST SOURCE</span></div><div className="markdown-lite">{analysis}</div><div className="evidence-footer"><ShieldCheck size={14}/> Evidence anchor: <code>{selected.short_commit}</code> · {selected.path}</div></div>}
              </div>
            </>}
          </section>
        </section>

        <section className="principles"><div><ShieldCheck size={18}/><span><strong>Evidence over invention</strong><small>Facts and hypotheses are kept distinct.</small></span></div><div><Ghost size={18}/><span><strong>Private by design</strong><small>Local inference through Ollama.</small></span></div><div><GitCommit size={18}/><span><strong>History is the source</strong><small>Every artifact points to a Git commit.</small></span></div></section>
        <footer><span>GHOST//ARCHIVE <span className="footer-sep">/</span> OPEN SOURCE EXPERIMENT</span><span>THE PAST IS STILL IN THE REPOSITORY.</span></footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
