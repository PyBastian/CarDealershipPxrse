"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from "lucide-react";
import type { CarJson } from "@/lib/car-json";
import { deleteVehicleImage, nextImageNumber, uploadVehicleImage } from "@/lib/github-admin/images";
import { ConfirmDialog, type ConfirmRequest } from "./confirm-dialog";
import { SaveBanner, type SaveState } from "./save-state";

type Props = {
  slug: string;
  name: string;
  images: CarJson["images"];
  token: string;
  onChange: (images: CarJson["images"], message: string) => Promise<void>;
};

export function ImageManager({ slug, name, images, token, onChange }: Props) {
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    const added: CarJson["images"] = [];
    let number = nextImageNumber(images, slug);
    try {
      for (const [index, file] of list.entries()) {
        setState({ kind: "saving", message: `Subiendo foto ${index + 1} de ${list.length}…` });
        const preview = URL.createObjectURL(file);
        const path = await uploadVehicleImage(slug, file, number, name, token);
        added.push({ path, alt: `${name}, foto ${number}` });
        setPreviews((current) => ({ ...current, [path]: preview }));
        number += 1;
      }
      await onChange([...images, ...added], `admin: add photos to ${name}`);
      setState({ kind: "success" });
    } catch (cause) {
      setState({ kind: "error", message: cause instanceof Error ? cause.message : "No pudimos subir las fotos." });
    }
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

  function move(index: number, target: number) {
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    persist(next, `admin: reorder photos of ${name}`);
  }

  function requestRemove(index: number) {
    const image = images[index];
    setConfirm({
      title: "¿Eliminar esta foto?",
      message: `${image.path}${index === 0 ? " Es la portada actual; la primera imagen restante pasará a ser la portada." : ""}`,
      confirmLabel: "Eliminar",
      onConfirm: async () => {
        const next = images.filter((_, position) => position !== index);
        await persist(next, `admin: remove photo from ${name}`);
        if (previews[image.path]) URL.revokeObjectURL(previews[image.path]);
        deleteVehicleImage(image.path, slug, token).catch(() => {});
      }
    });
  }

  return <div className="palomin-image-manager">
    <SaveBanner state={state}/>
    {images.length > 0 ? <ul className="palomin-photo-grid">
      {images.map((image, index) => <li key={image.path}>
        <img src={previews[image.path] ?? image.path} alt={image.alt}/>
        {index === 0 && <span className="palomin-cover-tag">Portada</span>}
        <div className="palomin-photo-tools">
          <button type="button" className="icon-button" aria-label="Mover izquierda" disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowLeft size={15}/></button>
          <button type="button" className="icon-button" aria-label="Mover derecha" disabled={index === images.length - 1} onClick={() => move(index, index + 1)}><ArrowRight size={15}/></button>
          <button type="button" className="icon-button" aria-label="Eliminar foto" onClick={() => requestRemove(index)}><Trash2 size={15}/></button>
        </div>
      </li>)}
    </ul> : <p className="form-help">Aún no hay fotos. La primera imagen será la portada.</p>}
    <label className={`dropzone ${state.kind === "saving" ? "busy" : ""}`}>
      {state.kind === "saving" ? <Loader2 className="spin"/> : <ImagePlus/>}
      <span>{state.kind === "saving" ? state.message : <>Arrastra o selecciona fotos<small>Se comprimen a WebP (máx. 1800 px) antes de subirse</small></>}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={state.kind === "saving"} onChange={(event) => { upload(event.target.files); event.target.value = ""; }}/>
    </label>
    <ConfirmDialog request={confirm} onClose={() => setConfirm(null)}/>
  </div>;
}
