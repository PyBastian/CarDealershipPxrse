"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { VehicleImage } from "@/lib/types";

export function Gallery({ images, name }: { images: VehicleImage[]; name: string }) {
  const safeImages = images.length ? images : [{ id: "placeholder", url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/vehicles/suv-graphite.png`, alt: name, sortOrder: 0, isCover: true }];
  const [index, setIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const move = (delta: number) => setIndex((value) => (value + delta + safeImages.length) % safeImages.length);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => { if (!dialog.current?.open) return; if (event.key === "ArrowRight") move(1); if (event.key === "ArrowLeft") move(-1); };
    window.addEventListener("keydown", keydown); return () => window.removeEventListener("keydown", keydown);
  });
  const picture = (image: VehicleImage, priority = false) => <Image src={image.url} alt={image.alt} fill loading={priority ? "eager" : "lazy"} sizes="(max-width: 800px) 100vw, 66vw"/>;
  return <>
    <div className="gallery" onTouchStart={(e) => setStartX(e.touches[0].clientX)} onTouchEnd={(e) => { const diff = e.changedTouches[0].clientX - startX; if (Math.abs(diff) > 45) move(diff < 0 ? 1 : -1); }}>
      <button className="gallery-main" onClick={() => dialog.current?.showModal()}>{picture(safeImages[index], true)}</button>
      {safeImages.slice(1, 3).map((image) => <button className="gallery-side" key={image.id} onClick={() => { setIndex(image.sortOrder); dialog.current?.showModal(); }}>{picture(image)}</button>)}
      <span className="gallery-count">{index + 1} / {safeImages.length}</span>
      <button className="gallery-open" onClick={() => dialog.current?.showModal()}><Images size={17}/> Ver todas ({safeImages.length})</button>
    </div>
    <dialog ref={dialog} className="lightbox" onClose={() => setIndex(0)}>
      <button className="lightbox-close icon-button" onClick={() => dialog.current?.close()} aria-label="Cerrar galería"><X/></button>
      <button className="lightbox-prev icon-button" onClick={() => move(-1)} aria-label="Foto anterior"><ChevronLeft/></button>
      <div className="lightbox-image">{picture(safeImages[index])}</div>
      <button className="lightbox-next icon-button" onClick={() => move(1)} aria-label="Foto siguiente"><ChevronRight/></button>
      <span className="lightbox-counter">{index + 1} / {safeImages.length}</span>
      <div className="lightbox-thumbs">{safeImages.map((image, i) => <button key={image.id} className={i === index ? "active" : ""} onClick={() => setIndex(i)}>{picture(image)}</button>)}</div>
    </dialog>
  </>;
}
