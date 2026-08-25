"use client";

import { useEffect, useRef } from "react";

export type ConfirmRequest = { title: string; message: string; confirmLabel?: string; onConfirm: () => void };

export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (request && !dialog.open) dialog.showModal();
    if (!request && dialog.open) dialog.close();
  }, [request]);
  return <dialog ref={ref} className="palomin-dialog" onClose={onClose} aria-labelledby="confirm-title">
    {request && <>
      <h2 id="confirm-title">{request.title}</h2>
      <p>{request.message}</p>
      <div className="palomin-dialog-actions">
        <button type="button" className="button button-secondary" onClick={() => { ref.current?.close(); }}>Cancelar</button>
        <button type="button" className="button danger" onClick={() => { ref.current?.close(); request.onConfirm(); }}>{request.confirmLabel ?? "Eliminar"}</button>
      </div>
    </>}
  </dialog>;
}
