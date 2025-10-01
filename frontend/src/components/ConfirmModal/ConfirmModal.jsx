import React from 'react';
import { FaTimes, FaExclamationTriangle, FaCheck, FaInfo } from 'react-icons/fa';
import './ConfirmModal.css';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'default' // 'default', 'danger', 'warning', 'success', 'info'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <FaExclamationTriangle className="modal-icon danger" />;
      case 'warning':
        return <FaExclamationTriangle className="modal-icon warning" />;
      case 'success':
        return <FaCheck className="modal-icon success" />;
      case 'info':
        return <FaInfo className="modal-icon info" />;
      default:
        return <FaInfo className="modal-icon default" />;
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`confirm-modal ${type}`}>
        <div className="modal-header">
          <div className="modal-title-container">
            {getIcon()}
            <h3 className="modal-title">{title}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-message">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className={`btn btn-confirm ${type}`} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;