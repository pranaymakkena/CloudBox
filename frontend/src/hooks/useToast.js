import { useState, useCallback } from "react";

let idCounter = 0;

export function useToast() {
  const [messages, setMessages] = useState([]);

  const addToast = useCallback((text, type = "info") => {
    const id = ++idCounter;
    setMessages((prev) => [...prev, { id, text, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const toast = {
    success: (text) => addToast(text, "success"),
    error: (text) => addToast(text, "error"),
    info: (text) => addToast(text, "info"),
    warning: (text) => addToast(text, "warning"),
  };

  return { messages, removeToast, toast };
}
