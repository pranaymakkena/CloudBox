import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Toast from "./common/Toast";
import { useToast } from "../hooks/useToast";
import { consumeSessionNotice } from "../services/sessionService";

export default function SessionNoticeToast() {
  const location = useLocation();
  const { messages, removeToast, toast } = useToast();

  useEffect(() => {
    const notice = consumeSessionNotice();

    if (notice) {
      toast.error(notice);
    }
  }, [location.pathname, toast]);

  return <Toast messages={messages} removeToast={removeToast} />;
}
