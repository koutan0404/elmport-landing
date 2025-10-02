import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * News Admin (Developer Tool)
 * -------------------------------------------------------------
 * ⚙️ What this does
 * - Lists articles from /api/articles?db=…
 * - Create / Edit / Delete articles via your Worker endpoints
 * - One‑click Cloudflare Images direct upload → returns image id
 * - Uses x-api-key header or Bearer token (paste either)
 * - All settings persist in localStorage (API base, db, key)
 *
 * 🛡️ SECURITY
 * - This is a developer-only panel. Protect the route (/admin) with
 *   Cloudflare Access or Basic Auth on your hosting. Never expose the
 *   API key publicly.
 *
 * 🧩 Backend endpoints assumed
 *  GET  /api/articles?db=1
 *  POST /api/admin/articles            (x-api-key or Bearer)
 *  PATCH /api/admin/articles/:id
 *  DELETE /api/admin/articles/:id
 *  GET  /api/images/direct-upload      (server generates CF Images URL)
 */

// ---- Types mirrored from your Worker ------------------------------

type Article = {
  id: string;
  title: string;
  subtitle: string;
  content: string;            // Markdown
  contentHtml?: string;
  imageUrl: string;
  thumbnailUrl: string;
  createdAt: number;
  updatedAt: number;
  publishedAt: number;
  status: "draft" | "published" | "archived";
  genre: string;
  tags: string[];
  author: string;
  viewCount: number;
  featured: "article" | "work" | "arbeit" | "board";
  commentsEnabled: 0 | 1;
  relatedArticles?: string[];
};

// ---- Small helpers -------------------------------------------------

const ls = {
  get: (k: string) => {
    try { return window.localStorage.getItem(k) ?? "" } catch { return "" }
  },
  set: (k: string, v: string) => {
    try { window.localStorage.setItem(k, v) } catch {}
  }
}

const fmtDate = (n?: number) => n ? new Date(n).toLocaleString() : "";

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// ---- Main App ------------------------------------------------------

export default function App() {
  const [apiBase, setApiBase] = useState(ls.get("adm.apiBase") || ""); // e.g. https://ambitiousstars.org
  const [db, setDb] = useState(ls.get("adm.db") || "1");
  const [auth, setAuth] = useState(ls.get("adm.auth") || ""); // either: x-api-key or Bearer <token>
  const [list, setList] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q);

  const [editing, setEditing] = useState<Article | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { ls.set("adm.apiBase", apiBase) }, [apiBase]);
  useEffect(() => { ls.set("adm.db", db) }, [db]);
  useEffect(() => { ls.set("adm.auth", auth) }, [auth]);

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (!auth) return h;
    if (auth.startsWith("Bearer ")) h["authorization"] = auth;
    else h["x-api-key"] = auth; // raw key
    return h;
  }, [auth]);

  async function load() {
    setLoading(true); setError("");
    try {
      const url = `${apiBase}/api/articles?db=${encodeURIComponent(db)}`.replace(/\/+([^:])/g, "/$1");
      const r = await fetch(url, { headers: { "Accept": "application/json" }});
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      const data: Article[] = await r.json();
      setList(data);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (apiBase) load() }, [apiBase, db]);

  const filtered = useMemo(() => {
    const k = dq.trim().toLowerCase();
    if (!k) return list;
    return list.filter(a =>
      a.title.toLowerCase().includes(k) ||
      a.subtitle.toLowerCase().includes(k) ||
      a.genre.toLowerCase().includes(k) ||
      a.tags.join(",").toLowerCase().includes(k) ||
      a.id.toLowerCase().includes(k)
    );
  }, [list, dq]);

  function emptyArticle(): Article {
    const now = Date.now();
    return {
      id: "", title: "", subtitle: "",
      content: "", contentHtml: "",
      imageUrl: "", thumbnailUrl: "",
      createdAt: now, updatedAt: now, publishedAt: now,
      status: "draft", genre: "日常", tags: [], author: "Anonymous",
      viewCount: 0, featured: "article", commentsEnabled: 1,
      relatedArticles: []
    };
  }

  // ---- CRUD --------------------------------------------------------
  async function createArticle(a: Article) {
    const url = `${apiBase}/api/admin/articles?db=${db}`;
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(a) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  async function patchArticle(id: string, patch: Partial<Article>) {
    const url = `${apiBase}/api/admin/articles/${encodeURIComponent(id)}?db=${db}`;
    const r = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(patch) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  async function deleteArticle(id: string) {
    const url = `${apiBase}/api/admin/articles/${encodeURIComponent(id)}?db=${db}`;
    const r = await fetch(url, { method: "DELETE", headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  // ---- CF Images direct upload ------------------------------------
  async function directUpload(file: File) {
    const u = `${apiBase}/api/images/direct-upload`;
    const res = await fetch(u, { headers });
    if (!res.ok) throw new Error(await res.text());
    const { id, uploadURL } = await res.json();

    const form = new FormData();
    form.append("file", file);
    const up = await fetch(uploadURL, { method: "POST", body: form });
    if (!up.ok) throw new Error(`upload ${up.status}`);
    return id as string; // final image id
  }

  // ---- UI states ---------------------------------------------------
  const [msg, setMsg] = useState("");
  function toast(t: string) { setMsg(t); setTimeout(() => setMsg(""), 2500) }

  // ---- Component bits ----------------------------------------------

  function Header() {
    return (
      <div className="sticky top-0 z-10 backdrop-blur bg-white/75 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-xl font-bold">News Admin</div>
          <div className="ml-auto flex items-center gap-2">
            <input
              placeholder="API base (https://ambitiousstars.org)"
              value={apiBase}
              onChange={e => setApiBase(e.target.value.replace(/\/$/, ""))}
              className="px-3 py-1.5 rounded-xl border outline-none w-[320px]"
            />
            <select value={db} onChange={e => setDb(e.target.value)} className="px-3 py-1.5 rounded-xl border">
              <option value="1">db=1 (Env.DB)</option>
              <option value="2">db=2 (Env.DB2 / Arbeit)</option>
              <option value="3">db=3</option>
              <option value="4">db=4</option>
              <option value="5">db=5</option>
              <option value="6">db=6</option>
            </select>
            <input
              placeholder="x-api-key or paste 'Bearer <JWT>'"
              value={auth}
              onChange={e => setAuth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border outline-none w-[300px]"
            />
            <button onClick={load} className="px-3 py-1.5 rounded-xl border bg-black text-white">Reload</button>
          </div>
        </div>
      </div>
    );
  }

  function ListPane() {
    return (
      <div className="w-full lg:w-[46%] xl:w-[42%] border-r border-neutral-200 dark:border-neutral-800">
        <div className="p-3 flex items-center gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search title/tags/id…"
                 className="px-3 py-2 rounded-xl border w-full" />
          <button onClick={()=>{ setCreating(true); setEditing(emptyArticle()); }}
                  className="px-3 py-2 rounded-xl border bg-blue-600 text-white">New</button>
        </div>
        <div className="max-h-[calc(100vh-160px)] overflow-auto">
          {loading && <div className="p-4 text-sm">Loading…</div>}
          {error && <div className="p-4 text-sm text-red-600">{error}</div>}
          {!loading && !error && filtered.map(a => (
            <div key={a.id} className="px-4 py-3 border-b hover:bg-neutral-50 cursor-pointer"
                 onClick={()=>{ setCreating(false); setEditing(a); }}>
              <div className="text-base font-semibold flex items-center gap-2">
                <span className="truncate max-w-[80%]">{a.title || "(no title)"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full border ml-auto">
                  {a.status}
                </span>
              </div>
              <div className="text-xs text-neutral-500 flex gap-2 mt-1">
                <span>{a.genre}</span>
                <span>tags: {a.tags?.length ?? 0}</span>
                <span>views: {a.viewCount ?? 0}</span>
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                {fmtDate(a.updatedAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function Field({label, children}: {label: string, children: React.ReactNode}) {
    return (
      <label className="block mb-3">
        <div className="text-xs text-neutral-500 mb-1">{label}</div>
        {children}
      </label>
    );
  }

  function EditPane() {
    const [a, setA] = useState<Article | null>(editing);
    useEffect(()=>{ setA(editing) }, [editing]);
    const fileRef = useRef<HTMLInputElement>(null);

    if (!a) return <div className="flex-1" />

    function set<K extends keyof Article>(k: K, v: Article[K]) {
      setA(prev => prev ? { ...prev, [k]: v } as Article : prev);
    }

    async function onSave() {
      if (!a) return;
      try {
        if (!a.id) {
          const payload = { ...a, id: undefined as any };
          await createArticle(payload as unknown as Article);
          toast("Created");
        } else {
          const patch: Partial<Article> = { ...a, id: undefined as any };
          await patchArticle(editing!.id, patch);
          toast("Updated");
        }
        await load();
      } catch (e: any) {
        toast(`Error: ${e?.message || e}`)
      }
    }

    async function onDelete() {
      if (!a?.id) return;
      if (!confirm(`Delete article ${a.title || a.id}?`)) return;
      try {
        await deleteArticle(a.id);
        toast("Deleted"); setEditing(null); setCreating(false);
        await load();
      } catch (e: any) { toast(`Error: ${e?.message || e}`) }
    }

    async function pickAndUpload(setter: (urlOrId: string)=>void) {
      const inp = fileRef.current; if (!inp) return;
      inp.click();
      await new Promise<void>((resolve)=>{
        const onChange = async () => {
          if (!inp.files || inp.files.length === 0) { inp.removeEventListener("change", onChange); return resolve(); }
          const f = inp.files[0]!;
          try {
            const id = await directUpload(f);
            setter(id); toast("Uploaded to CF Images");
          } catch (e: any) { toast(`Upload error: ${e?.message || e}`) }
          inp.value = ""; inp.removeEventListener("change", onChange); resolve();
        };
        inp.addEventListener("change", onChange, { once: true });
      });
    }

    return (
      <div className="flex-1 p-4">
        <input type="file" ref={fileRef} className="hidden" accept="image/*" />

        <div className="flex items-center gap-2 mb-4">
          <div className="text-lg font-semibold">{creating ? "Create" : "Edit"} article</div>
          <div className="ml-auto flex items-center gap-2">
            {a.id && <button onClick={onDelete} className="px-3 py-2 rounded-xl border text-red-600">Delete</button>}
            <button onClick={onSave} className="px-3 py-2 rounded-xl border bg-emerald-600 text-white">Save</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Field label="Title">
              <input value={a.title} onChange={e=>set("title", e.target.value)} className="px-3 py-2 rounded-xl border w-full" />
            </Field>
            <Field label="Subtitle">
              <input value={a.subtitle} onChange={e=>set("subtitle", e.target.value)} className="px-3 py-2 rounded-xl border w-full" />
            </Field>
            <Field label="Author">
              <input value={a.author} onChange={e=>set("author", e.target.value)} className="px-3 py-2 rounded-xl border w-full" />
            </Field>
            <Field label="Genre">
              <input value={a.genre} onChange={e=>set("genre", e.target.value)} className="px-3 py-2 rounded-xl border w-full" />
            </Field>
            <Field label="Tags (comma separated)">
              <input value={a.tags.join(", ")} onChange={e=>set("tags", e.target.value.split(/\s*,\s*/g).filter(Boolean))} className="px-3 py-2 rounded-xl border w-full" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <select value={a.status} onChange={e=>set("status", e.target.value as Article["status"])} className="px-3 py-2 rounded-xl border w-full">
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
              </Field>
              <Field label="Featured">
                <select value={a.featured} onChange={e=>set("featured", e.target.value as Article["featured"])} className="px-3 py-2 rounded-xl border w-full">
                  <option value="article">article</option>
                  <option value="work">work</option>
                  <option value="arbeit">arbeit</option>
                  <option value="board">board</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Comments Enabled">
                <select value={a.commentsEnabled} onChange={e=>set("commentsEnabled", Number(e.target.value) as 0|1)} className="px-3 py-2 rounded-xl border w-full">
                  <option value={1}>1 (enabled)</option>
                  <option value={0}>0 (disabled)</option>
                </select>
              </Field>
              <Field label="PublishedAt">
                <input type="datetime-local" value={new Date(a.publishedAt).toISOString().slice(0,16)}
                       onChange={e=>set("publishedAt", new Date(e.target.value).getTime())}
                       className="px-3 py-2 rounded-xl border w-full" />
              </Field>
            </div>
          </div>
          <div>
            <Field label="Content (Markdown)">
              <textarea value={a.content} onChange={e=>set("content", e.target.value)} rows={12}
                        className="px-3 py-2 rounded-xl border w-full font-mono" />
            </Field>
            <Field label="Related Article IDs (comma separated)">
              <input value={(a.relatedArticles||[]).join(", ")} onChange={e=>set("relatedArticles", e.target.value.split(/\s*,\s*/g).filter(Boolean))}
                     className="px-3 py-2 rounded-xl border w-full" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Image ID / URL">
                <div className="flex gap-2">
                  <input value={a.imageUrl} onChange={e=>set("imageUrl", e.target.value)} className="px-3 py-2 rounded-xl border w-full" />
                  <button className="px-3 py-2 rounded-xl border" onClick={()=>pickAndUpload(v=>set("imageUrl", v))}>Upload</button>
                </div>
              </Field>
              <Field label="Thumbnail ID / URL">
                <div className="flex gap-2">
                  <input value={a.thumbnailUrl} onChange={e=>set("thumbnailUrl", e.target.value)} className="px-3 py-2 rounded-xl border w-full" />
                  <button className="px-3 py-2 rounded-xl border" onClick={()=>pickAndUpload(v=>set("thumbnailUrl", v))}>Upload</button>
                </div>
              </Field>
            </div>
            <div className="mt-3 p-2 text-xs text-neutral-500">
            
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Header />
      {msg && <div className="fixed top-3 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-3 py-1.5 rounded-full shadow">{msg}</div>}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] xl:grid-cols-[1fr_1.3fr] mt-2 border rounded-2xl overflow-hidden bg-white">
        <ListPane />
        <EditPane />
      </div>
      <div className="max-w-6xl mx-auto mt-3 px-2 text-xs text-neutral-500">
        <p>Tips: Set API base to your origin (e.g., https://ambitiousstars.org). Paste an x-api-key or a Bearer token. Choose db=1 for news-db if bound to Env.DB.</p>
      </div>
    </div>
  );
}
