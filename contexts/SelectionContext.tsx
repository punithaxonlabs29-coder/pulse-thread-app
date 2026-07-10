import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface SelectionContextType {
  selectedMessageIds: string[];
  toggleSelection: (messageId: string) => void;
  clearSelection: () => void;
  isSelected: (messageId: string) => boolean;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);

  const toggleSelection = useCallback((messageId: string) => {
    setSelectedMessageIds(prev => {
      if (prev.includes(messageId)) {
        return prev.filter(id => id !== messageId);
      }
      return [...prev, messageId];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMessageIds([]);
  }, []);

  const isSelected = useCallback((messageId: string) => {
    return selectedMessageIds.includes(messageId);
  }, [selectedMessageIds]);

  const value = useMemo(() => ({
    selectedMessageIds,
    toggleSelection,
    clearSelection,
    isSelected
  }), [selectedMessageIds, toggleSelection, clearSelection, isSelected]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelectionContext = () => {
  const context = useContext(SelectionContext);
  if (!context) throw new Error("useSelectionContext must be used within SelectionProvider");
  return context;
};
