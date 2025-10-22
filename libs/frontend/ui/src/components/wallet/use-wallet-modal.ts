'use client';

import { useState, useCallback } from 'react';

/**
 * useWalletModal - Hook for managing wallet modal state
 *
 * Provides open/close functionality for the custom wallet modal
 */
export function useWalletModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleModal = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
}
