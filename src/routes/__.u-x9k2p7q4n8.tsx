import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LogOut, Upload, Settings, Image as ImageIcon, Info, Plug, Lock, KeyRound,
  Trash2, Eye, EyeOff, Loader2, Send, Save, FolderTree,
} from "lucide-react";
import {
  uploadImage, listImagesAdmin, deleteImage, togglePublish,
  listCategories, createCategory, deleteCategory,
} from "@/server/images.functions";
import {
  getSiteSettings, updateSiteSettings, getAbout, updateAbout,
} from "@/server/settings.functions";
import {
  checkDashboardSession, dashboardLogin, dashboardLogout, changeDashboardPassword,
} from "@/server/dashboard-auth.functions";

export const Route = createFileRoute("/__/u-x9k2p7q4n8")({
  head: () => ({
    meta: [
      { title: "—" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: HiddenDashboard,
});

type Tab = "images" | "upload" | "categories" | "about" | "settings" | "security" | "connections";

function HiddenDashboard() {
  const qc = useQueryClient();
  const session = useQuery({ queryKey: ["dash-session"], queryFn: () => checkDashboardSession(), retry: false, staleTime: 0 });

  if (session.isLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!session.data?.ok) return <Gate onSuccess={() => qc.invalidateQueries({ queryKey: ["dash-session"] })} />;
  return <Dashboard onLogout={() => qc.invalidateQueries({ queryKey: ["dash-session"] })} />;
}

// ---------- Password gate ----------
function Gate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const r = await dashboardLogin({ data: { password } });
      if (!r.ok) { setErr(r.error || "Wrong password"); return; }
      onSuccess();
    } catch (e: any) { setErr(e.message || "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 animate-fade-in">
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="mb-6 flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <h1 className="font-display text-2xl">Restricted</h1>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password" required autoFocus placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button disabled={busy} type="submit"
            className="w-full rounded-lg bg-foreground py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60">
            {busy ? "…" : "Unlock"}
          </button>
        </form>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Default password: <code className="font-mono">unposed</code> · change it after the first sign in.
        </p>
      </div>
    </div>
  );
}

// ---------- Dashboard shell ----------
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("images");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "images", label: "Images", icon: <ImageIcon className="h-4 w-4" /> },
    { id: "upload", label: "Upload", icon: <Upload className="h-4 w-4" /> },
    { id: "categories", label: "Categories", icon: <FolderTree className="h-4 w-4" /> },
    { id: "about", label: "About", icon: <Info className="h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    { id: "security", label: "Security", icon: <KeyRound className="h-4 w-4" /> },
    { id: "connections", label: "Connections", icon: <Plug className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Owner</p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">Dashboard</h1>
        </div>
        <button onClick={async () => { await dashboardLogout(); onLogout(); }}
          className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" title="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <div className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-border px-4 pb-px md:mx-0 md:px-0">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-t-md border-b-2 px-3 py-2.5 text-sm transition-colors ${
              tab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {tab === "images" && <ImagesTab />}
        {tab === "upload" && <UploadTab />}
        {tab === "categories" && <CategoriesTab />}
        {tab === "about" && <AboutTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "connections" && <ConnectionsTab />}
      </div>
    </div>
  );
}

// ---------- Images ----------
function ImagesTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["images-admin"], queryFn: () => listImagesAdmin({ data: { page: 0, pageSize: 60 } }) });
  if (q.isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
  const items = q.data?.items ?? [];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((img: any) => (
        <div key={img.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
          <img src={img.url_thumb || img.url} alt={img.title} loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 text-white">
            <span className="truncate text-xs">{img.title}</span>
            <div className="flex gap-1">
              <button title={img.published ? "Unpublish" : "Publish"} onClick={async () => {
                const r = await togglePublish({ data: { id: img.id, published: !img.published } });
                if (r.ok) qc.invalidateQueries({ queryKey: ["images-admin"] });
              }} className="rounded p-1 hover:bg-white/20">
                {img.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              <button title="Delete" onClick={async () => {
                if (!confirm("Delete this wallpaper?")) return;
                const r = await deleteImage({ data: { id: img.id } });
                if (r.ok) { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["images-admin"] }); }
                else toast.error(r.error || "Failed");
              }} className="rounded p-1 hover:bg-red-500/40">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No images yet.</p>}
    </div>
  );
}

// ---------- Upload ----------
function UploadTab() {
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Pick an image");
    if (file.size > 25 * 1024 * 1024) return toast.error("Max 25MB");
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = ""; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      const r = await uploadImage({
        data: {
          title, description: description || null,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          categoryId: categoryId || null,
          imageBase64: b64, mimeType: file.type as any,
        },
      });
      if (!r.ok) throw new Error(r.error);
      toast.success("Uploaded with 4K / HD / thumbnail variants");
      setTitle(""); setDescription(""); setTags(""); setFile(null);
      qc.invalidateQueries({ queryKey: ["images-admin"] });
      qc.invalidateQueries({ queryKey: ["images"] });
    } catch (err: any) { toast.error(err.message || "Upload failed"); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <Field label="Title"><input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
      <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} /></Field>
      <Field label="Tags (comma separated)"><input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="nature, calm, mountains" /></Field>
      <Field label="Category">
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
          <option value="">—</option>
          {cats.data?.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Image (max 25MB)">
        <input required type="file" accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      </Field>
      <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm text-background hover:opacity-90 disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy ? "Processing…" : "Upload"}
      </button>
    </form>
  );
}

// ---------- Categories ----------
function CategoriesTab() {
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  return (
    <div className="max-w-xl space-y-6">
      <form onSubmit={async (e) => {
        e.preventDefault();
        const r = await createCategory({ data: { name, slug, description: null } });
        if (r.ok) { toast.success("Added"); setName(""); setSlug(""); qc.invalidateQueries({ queryKey: ["categories"] }); }
        else toast.error(r.error || "Failed");
      }} className="flex flex-wrap gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className={inputCls + " flex-1 min-w-[140px]"} />
        <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="slug" required className={inputCls + " flex-1 min-w-[140px]"} />
        <button className="rounded-lg bg-foreground px-4 text-sm text-background hover:opacity-90">Add</button>
      </form>
      <div className="space-y-2">
        {cats.data?.categories.map((c: any) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
            <div><p className="text-sm">{c.name}</p><p className="text-xs text-muted-foreground">/{c.slug}</p></div>
            <button onClick={async () => {
              if (!confirm("Delete category?")) return;
              const r = await deleteCategory({ data: { id: c.id } });
              if (r.ok) qc.invalidateQueries({ queryKey: ["categories"] });
              else toast.error(r.error || "Failed");
            }} className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- About editor ----------
function AboutTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["about"], queryFn: () => getAbout() });
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (q.data?.about) setForm(q.data.about); }, [q.data]);
  if (!form) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      const r = await updateAbout({ data: {
        heading: form.heading, body: form.body,
        instagram_url: form.instagram_url, instagram_handle: form.instagram_handle,
        photo_url: form.photo_url || null,
      }});
      if (r.ok) { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["about"] }); }
      else toast.error(r.error || "Failed");
    }} className="max-w-xl space-y-4">
      <Field label="Heading"><input className={inputCls} value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} /></Field>
      <Field label="Body"><textarea rows={6} className={inputCls} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
      <Field label="Instagram URL"><input className={inputCls} value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} /></Field>
      <Field label="Instagram handle"><input className={inputCls} value={form.instagram_handle} onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })} /></Field>
      <Field label="Photo URL"><input className={inputCls} placeholder="https://…" value={form.photo_url ?? ""} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} /></Field>
      <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm text-background hover:opacity-90">
        <Save className="h-4 w-4" /> Save
      </button>
    </form>
  );
}

// ---------- Settings ----------
function SettingsTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["site-settings-edit"], queryFn: () => getSiteSettings() });
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (q.data?.settings) setForm(q.data.settings); }, [q.data]);
  if (!form) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      const r = await updateSiteSettings({ data: {
        site_name: form.site_name, tagline: form.tagline ?? "",
        favicon_url: form.favicon_url || null, logo_url: form.logo_url || null,
        privacy_policy: form.privacy_policy ?? "",
        telegram_bot_enabled: !!form.telegram_bot_enabled,
      }});
      if (r.ok) {
        toast.success("Saved");
        qc.invalidateQueries({ queryKey: ["site-settings"] });
        qc.invalidateQueries({ queryKey: ["site-settings-edit"] });
      } else toast.error(r.error || "Failed");
    }} className="max-w-xl space-y-5">
      <Section title="Branding">
        <Field label="Site name"><input className={inputCls} value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} /></Field>
        <Field label="Tagline"><input className={inputCls} value={form.tagline ?? ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></Field>
        <Field label="Favicon URL"><input className={inputCls} placeholder="https://…/favicon.png" value={form.favicon_url ?? ""} onChange={(e) => setForm({ ...form, favicon_url: e.target.value })} /></Field>
        <Field label="Logo URL"><input className={inputCls} placeholder="https://…/logo.svg" value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></Field>
      </Section>
      <Section title="Privacy">
        <Field label="Privacy policy">
          <textarea rows={6} className={inputCls} value={form.privacy_policy ?? ""} onChange={(e) => setForm({ ...form, privacy_policy: e.target.value })} />
        </Field>
      </Section>
      <Section title="Integrations">
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm"><Send className="h-4 w-4" /> Telegram bot ingestion</span>
          <input type="checkbox" checked={!!form.telegram_bot_enabled}
            onChange={(e) => setForm({ ...form, telegram_bot_enabled: e.target.checked })} />
        </label>
      </Section>
      <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm text-background hover:opacity-90">
        <Save className="h-4 w-4" /> Save settings
      </button>
    </form>
  );
}

// ---------- Security (change password) ----------
function SecurityTab() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      if (next !== confirm) return toast.error("Passwords don't match");
      if (next.length < 6) return toast.error("New password must be at least 6 characters");
      setBusy(true);
      try {
        const r = await changeDashboardPassword({ data: { currentPassword: cur, newPassword: next } });
        if (!r.ok) throw new Error(r.error);
        toast.success("Password changed");
        setCur(""); setNext(""); setConfirm("");
      } catch (err: any) { toast.error(err.message || "Failed"); }
      finally { setBusy(false); }
    }} className="max-w-md space-y-4">
      <Section title="Dashboard password">
        <Field label="Current password"><input type="password" required className={inputCls} value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
        <Field label="New password"><input type="password" required minLength={6} className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} /></Field>
        <Field label="Confirm new password"><input type="password" required minLength={6} className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm text-background hover:opacity-90 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Change password
        </button>
      </Section>
    </form>
  );
}

// ---------- Connections ----------
function ConnectionsTab() {
  return (
    <div className="max-w-xl space-y-3">
      <p className="text-sm text-muted-foreground">Connect Telegram, Slack, Google Drive, S3 and more.</p>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <Send className="mt-0.5 h-5 w-5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Telegram</p>
            <p className="text-xs text-muted-foreground">Ingest wallpapers from a bot chat automatically.</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Ask in chat: <span className="italic">“Connect Telegram”</span> to set it up.
        </p>
      </div>
    </div>
  );
}

// ---------- helpers ----------
const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-5">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
