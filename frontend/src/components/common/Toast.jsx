import { useEffect } from "react";
import "./toast.css";

function Toast({ messages, removeToast }) {
  return (
    <div className="toast-container">
      {messages.map((msg) => (
        <ToastItem key={msg.id} msg={msg} onClose={() => removeToast(msg.id)} />
      ))}
    </div>
  );
}

function ToastItem({ msg, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${msg.type}`}>
      <span>{msg.text}</span>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}

export default Toast;
