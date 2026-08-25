"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, FolderOpen, ImagePlus, Loader2, Star, Trash2, TriangleAlert, X } from "lucide-react";
import type { CarJson } from "@/lib/car-json";
import { deleteVehicleImage, listRepoPhotos, nextImageNumber, repoPhotoUrl, uploadVehicleImage } from "@/lib/github-admin/images";
import { ConfirmDialog, type ConfirmRequest } from "./confirm-dialog";
import { SaveBanner, type SaveState } from "./save-state";

type Props = {
  slug: string;
  name: string;
  images: CarJson["images"];
  token: string;
  onChange: (images: CarJson["images"], message: string) => Promise<void>;
};

type PendingImage = { id: string; file: File; url: string; number: number; status: "waiting" | "uploading" | "error"; error?: string };

let pendingId = 0;

export function ImageManager({ slug, name, images, token, onChange }: Props) {
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const objectUrls = useRef<Set<string>>(new Set());
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const busy = pending.some((item) => item.status !== "error") || state.kind === "saving";

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function track(url: string) { objectUrls.current.add(url); return url; }

  function release(url: string) { objectUrls.current.delete(url); URL.revokeObjectURL(url); }

  async function addFiles(files: FileList | File[] | null) {
    if (!files || busy) return;
    const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!list.length) { setState({ kind: "error", message: "Solo puedes subir imágenes (JPG, PNG, WebP o AVIF)." }); return; }
    if (list.length < Array.from(files).length) setState({ kind: "error", message: "Algunos archivos se ignoraron por no ser imágenes." });
    let number = nextImageNumber(images, slug);
    const staged: PendingImage[] = list.map((file) => ({ id: String(pendingId++), file, url: track(URL.createObjectURL(file)), number: number++, status: "waiting" }));
    setPending(staged);
    const added: CarJson["images"] = [];
    for (const item of staged) {
      setPending((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "uploading" } : entry));
      try {
        const path = await uploadVehicleImage(slug, item.file, item.number, name, token);
        added.push({ path, alt: `${name}, foto ${item.number}` });
        setPreviews((current) => ({ ...current, [path]: item.url }));
        setPending((current) => current.filter((entry) => entry.id !== item.id));
      } catch (cause) {
        setPending((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "error", error: cause instanceof Error ? cause.message : "No pudimos subir la foto." } : entry));
      }
    }
    await commitAdded(added);
  }

  async function commitAdded(added: CarJson["images"]) {
    if (!added.length) return;
    try {
      await onChange([...images, ...added], `admin: add photos to ${name}`);
      setState({ kind: "success" });
    } catch (cause) {
      setState({ kind: "error", message: cause instanceof Error ? `Las fotos se subieron, pero falló la actualización del catálogo: ${cause.message}` : "Las fotos se subieron pero no pudimos actualizar el catálogo." });
    }
  }

  function discardPending(id: string) {
    setPending((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) release(item.url);
      return current.filter((entry) => entry.id !== id);
    });
  }

  async function persist(next: CarJson["images"], message: string) {
    try {
      setState({ kind: "saving", message: "Actualizando fotos…" });
      await onChange(next, message);
      setState({ kind: "success" });
    } catch (cause) {
      setState({ kind: "error", message: cause instanceof Error ? cause.message : "No pudimos actualizar las fotos." });
    }
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persist(next, `admin: reorder photos of ${name}`);
  }

  function makeCover(index: number) {
    move(index, 0);
  }

  function requestRemove(index: number) {
    const image = images[index];
    setViewer(null);
    setConfirm({
      title: "¿Eliminar esta foto?",
      message: `${image.path}${index === 0 ? " Es la portada actual; la primera imagen restante pasará a ser la portada." : ""}`,
      confirmLabel: "Eliminar",
      onConfirm: async () => {
        const next = images.filter((_, position) => position !== index);
        await persist(next, `admin: remove photo from ${name}`);
        if (previews[image.path]) release(previews[image.path]);
        deleteVehicleImage(image.path, slug, token).catch(() => {});
      }
    });
  }

  function dropTo(index: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from !== null) move(from, index);
  }

  return <div className="palomin-image-manager">
    <SaveBanner state={state}/>
    {(images.length > 0 || pending.length > 0) && <ul className="palomin-photo-grid">
      {images.map((image, index) => <li
        key={image.path}
        className={dragOver === index ? "drag-over" : ""}
        draggable={!busy}
        onDragStart={(event) => { dragIndex.current = index; event.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => { dragIndex.current = null; setDragOver(null); }}
        onDragEnter={() => { if (dragIndex.current !== null && dragIndex.current !== index) setDragOver(index); }}
        onDragOver={(event) => { if (dragIndex.current !== null && dragIndex.current !== index) event.preventDefault(); }}
        onDrop={(event) => { event.preventDefault(); event.stopPropagation(); setDragOver(null); dropTo(index); }}
      >
        <button type="button" className="palomin-photo-open" onClick={() => setViewer(index)} aria-label={`Ampliar ${image.alt}`}>
          <img src={previews[image.path] ?? image.path} alt={image.alt} loading="lazy"/>
        </button>
        {index === 0 && <span className="palomin-cover-tag">Portada</span>}
        <div className="palomin-photo-tools">
          <button type="button" className="icon-button" aria-label={`Mover ${image.alt} a la izquierda`} disabled={index === 0 || busy} onClick={() => move(index, index - 1)}><ArrowLeft size={15}/></button>
          <button type="button" className="icon-button" aria-label={`Mover ${image.alt} a la derecha`} disabled={index === images.length - 1 || busy} onClick={() => move(index, index + 1)}><ArrowRight size={15}/></button>
          <button type="button" className={`icon-button ${index === 0 ? "active" : ""}`} aria-label={index === 0 ? `${image.alt} es la portada` : `Hacer portada a ${image.alt}`} disabled={index === 0 || busy} title={index === 0 ? "Es la portada" : "Hacer portada"} onClick={() => makeCover(index)}><Star size={15}/></button>
          <button type="button" className="icon-button" aria-label={`Eliminar ${image.alt}`} disabled={busy} onClick={() => requestRemove(index)}><Trash2 size={15}/></button>
        </div>
      </li>)}
      {pending.map((item) => <li key={item.id} className={`pending ${item.status === "error" ? "failed" : ""}`}>
        <img src={item.url} alt={`Vista previa de ${item.file.name}`}/>
        {item.status === "error"
          ? <><span className="palomin-pending-note"><TriangleAlert size={14}/> Error</span><div className="palomin-photo-tools"><button type="button" className="icon-button" aria-label="Descartar foto" title={item.error} onClick={() => discardPending(item.id)}><X size={15}/></button></div></>
          : <span className="palomin-pending-note"><Loader2 size={14} className="spin"/> Subiendo…</span>}
      </li>)}
    </ul>}
    {images.length === 0 && pending.length === 0 && <p className="form-help">Aún no hay fotos. La primera imagen será la portada.</p>}

    <div className="palomin-image-actions">
      <label
        className={`dropzone grow ${busy ? "busy" : ""} ${dragActive ? "drag" : ""}`}
        onDragOver={(event) => { event.preventDefault(); if (!busy) setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => { event.preventDefault(); setDragActive(false); void addFiles(event.dataTransfer.files); }}
      >
        {busy ? <Loader2 className="spin"/> : <ImagePlus/>}
        <span>{pending.some((item) => item.status !== "error") ? "Subiendo fotos…"
          : <>Arrastra fotos aquí o selecciónalas<small>JPG, PNG o WebP · se comprimen a máx. 1800 px</small></>}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={busy} onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }}/>
      </label>
      <button type="button" className="button button-secondary" disabled={busy} onClick={() => setPickerOpen(true)}>
        <FolderOpen size={17}/> Usar fotos del sitio
      </button>
    </div>

    {pickerOpen && createPortal(<PhotoPicker
      token={token} name={name} images={images}
      onClose={() => setPickerOpen(false)}
      onAdd={(selected) => { setPickerOpen(false); let number = nextImageNumber(images, slug); return commitAdded(selected.map((path) => ({ path, alt: `${name}, foto ${number++}`}))); }}
    />, document.body)}

    {viewer !== null && createPortal(<dialog ref={(node) => syncViewer(node, viewer)} className="palomin-lightbox" onClose={() => setViewer(null)} onKeyDown={(event) => {
      if (event.key === "ArrowLeft" && viewer > 0) setViewer(viewer - 1);
      if (event.key === "ArrowRight" && viewer < images.length - 1) setViewer(viewer + 1);
    }}>
      {images[viewer] && <LightboxContent
        image={images[viewer]} index={viewer} total={images.length}
        src={previews[images[viewer].path] ?? images[viewer].path} name={name}
        onNavigate={setViewer} onClose={() => setViewer(null)}
        onSaveAlt={(alt) => persist(images.map((item, position) => position === viewer ? { ...item, alt } : item), `admin: update photos of ${name}`)}
        onDelete={() => requestRemove(viewer)}/>}
    </dialog>, document.body)}

    <ConfirmDialog request={confirm} onClose={() => setConfirm(null)}/>
  </div>;
}

function PhotoPicker({ token, name, images, onClose, onAdd }: {
  token: string;
  name: string;
  images: CarJson["images"];
  onClose: () => void;
  onAdd: (paths: string[]) => Promise<void>;
}) {
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const assignedRef = useRef(images);

  useEffect(() => { assignedRef.current = images; }, [images]);

  useEffect(() => {
    let cancelled = false;
    listRepoPhotos(token)
      .then((all) => { if (!cancelled) setPhotos(all.filter((path) => !assignedRef.current.some((image) => image.path === path))); })
      .catch(() => { if (!cancelled) setPhotos([]); });
    return () => { cancelled = true; };
  }, [token]);

  function toggle(path: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  async function add() {
    if (!selected.size || saving) return;
    setSaving(true);
    try { await onAdd([...selected]); } finally { setSaving(false); }
  }

  return <dialog ref={(node) => { if (node && !node.open) node.showModal(); }} className="palomin-dialog palomin-picker" onClose={onClose}>
    <h2>Fotos del sitio</h2>
    <p>Imágenes ya publicadas en el concesionario. Selecciona las que quieras asignar a <strong>{name}</strong>; no se vuelven a subir ni se duplican.</p>
    {photos === null && <p className="palomin-picker-loading"><Loader2 size={17} className="spin"/> Buscando fotos…</p>}
    {photos?.length === 0 && <p className="form-help">No quedan fotos sin asignar. Sube nuevas con el botón de arriba.</p>}
    {photos && photos.length > 0 && <div className="palomin-picker-grid">
      {photos.map((path) => <button key={path} type="button" className={selected.has(path) ? "sel" : ""} onClick={() => toggle(path)} aria-pressed={selected.has(path)} aria-label={`Asignar ${path}`}>
        <img src={repoPhotoUrl(path)} alt="" loading="lazy"/>
        <small>/{path.split("/").slice(-1)}</small>
      </button>)}
    </div>}
    <div className="palomin-dialog-actions">
      <button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button>
      <button type="button" className="button" disabled={!selected.size || saving} onClick={add}>{saving ? <Loader2 size={16} className="spin"/> : <Check size={16}/>} Agregar {selected.size || ""}</button>
    </div>
  </dialog>;
}

function syncViewer(node: HTMLDialogElement | null, viewer: number | null) {
  if (!node) return;
  if (viewer !== null && !node.open) node.showModal();
  if (viewer === null && node.open) node.close();
}

function LightboxContent({ image, index, total, src, name, onNavigate, onClose, onSaveAlt, onDelete }: {
  image: CarJson["images"][number];
  index: number;
  total: number;
  src: string;
  name: string;
  onNavigate: (index: number) => void;
  onClose: () => void;
  onSaveAlt: (alt: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [alt, setAlt] = useState(image.alt);
  const [saving, setSaving] = useState(false);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const value = alt.trim();
    if (!value || value === image.alt || saving) return;
    setSaving(true);
    try { await onSaveAlt(value); onClose(); } finally { setSaving(false); }
  }
  return <>
    <img src={src} alt={image.alt}/>
    <header className="palomin-lightbox-bar">
      <span>{index + 1} / {total}{index === 0 ? " · Portada" : ""}</span>
      <div>
        <button type="button" className="icon-button" aria-label="Foto anterior" disabled={index === 0} onClick={() => onNavigate(index - 1)}><ArrowLeft size={17}/></button>
        <button type="button" className="icon-button" aria-label="Foto siguiente" disabled={index === total - 1} onClick={() => onNavigate(index + 1)}><ArrowRight size={17}/></button>
        <button type="button" className="icon-button danger" aria-label={`Eliminar esta foto de ${name}`} onClick={onDelete}><Trash2 size={16}/></button>
        <button type="button" className="icon-button" aria-label="Cerrar vista previa" autoFocus onClick={onClose}><X size={17}/></button>
      </div>
    </header>
    <form className="palomin-lightbox-alt" onSubmit={save}>
      <label>Texto alternativo <small>Describe la foto para lectores de pantalla y SEO</small>
        <input value={alt} onChange={(event) => setAlt(event.target.value)} maxLength={140} placeholder={`${name}, vista frontal`} spellCheck={false}/>
      </label>
      <button className="button button-small" type="submit" disabled={saving || !alt.trim() || alt.trim() === image.alt}>{saving ? <Loader2 size={15} className="spin"/> : <Check size={15}/>} Guardar</button>
    </form>
  </>;
}
