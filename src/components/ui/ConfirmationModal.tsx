import React from 'react';
import { Modal, Button } from './core';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary' | 'warning';
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    isLoading = false,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="p-6">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-red-500/10 text-red-500' :
                        variant === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-primary/10 text-primary'
                        }`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-text-muted">{message}</p>
                </div>

                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'secondary' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isLoading}
                        className={variant === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
