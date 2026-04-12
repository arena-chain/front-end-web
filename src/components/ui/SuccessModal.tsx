import React from 'react';
import { Check } from 'lucide-react';
import { Button, Modal } from './core';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, title, message }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" title="">
            <div className="p-6 text-center">
                {/* Success Icon */}
                <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

                {/* Message */}
                <p className="text-text-muted mb-6">{message}</p>

                {/* Close Button */}
                <Button onClick={onClose} className="w-full">
                    Got it!
                </Button>
            </div>
        </Modal>
    );
};

export default SuccessModal;
