
import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { Customer } from '../../types';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCustomer: Customer) => void;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addCustomer } = useData();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) {
        setError("کاربر احراز هویت نشده است.");
        return;
    }
    if (!name || !phoneNumber) {
        setError("نام و شماره تلفن الزامی است.");
        return;
    }
    
    const newCustomer = addCustomer({ name, phoneNumber }, user.id);
    onSuccess(newCustomer);
  };

  const handleClose = () => {
      setName('');
      setPhoneNumber('');
      setError('');
      onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="افزودن سریع مشتری">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="نام مشتری"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <Input
          label="شماره تماس"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end space-x-2 space-x-reverse pt-3">
          <Button type="button" variant="ghost" onClick={handleClose}>لغو</Button>
          <Button type="submit">افزودن</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCustomerModal;
