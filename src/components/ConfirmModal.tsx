import React from 'react';
import Dialogo from './ui/Dialogo';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Excluir mesmo assim',
  cancelText = 'Deixar como está'
}: ConfirmModalProps) {
  return (
    <Dialogo
      id="confirm-modal-wrapper"
      aberto={isOpen}
      onFechar={onCancel}
      tituloId="confirm-modal-titulo"
      largura="max-w-[460px]"
      camada="z-80"
    >
      <div className="mb-2.5 text-[11px] tracking-[0.14em] text-accent-2-700 uppercase">Ação sem volta</div>
      <h3 id="confirm-modal-titulo" className="dialog-title mb-2.5 text-[28px]">
        {title}
      </h3>
      <p className="m-0 text-[15px] text-neutral-800">{message}</p>

      <div className="dialog-actions mt-7 gap-3.5">
        <button id="confirm-modal-cancel-btn" type="button" onClick={onCancel} className="btn btn-ghost">
          {cancelText}
        </button>
        <button id="confirm-modal-confirm-btn" type="button" onClick={onConfirm} className="btn btn-danger">
          {confirmText}
        </button>
      </div>
    </Dialogo>
  );
}
