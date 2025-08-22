import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ isOpen, onClose, imageUrl, title = "مشاهده تصویر" }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="flex flex-col items-center">
        <img src={imageUrl} alt={title} className="max-w-full max-h-[70vh] mx-auto rounded-lg object-contain" />
        <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700 w-full">
          <Button variant="ghost" onClick={onClose}>بستن</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImageViewerModal;
