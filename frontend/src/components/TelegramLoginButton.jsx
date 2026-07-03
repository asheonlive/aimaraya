import { useEffect, useRef } from "react";

const BOT_USERNAME = process.env.REACT_APP_TELEGRAM_BOT_USERNAME || "AiMarayaBot";

/** Renders the official Telegram Login Widget and calls `onAuth(telegramUser)`
 * with the signed payload once someone logs in through it. The backend
 * verifies the signature (see verify_telegram_login in server.py) before
 * trusting any of these fields. */
export default function TelegramLoginButton({ onAuth }) {
  const containerRef = useRef(null);

  useEffect(() => {
    window.onTelegramAuth = (user) => onAuth(user);

    const container = containerRef.current;
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    container?.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
      if (container) container.innerHTML = "";
    };
  }, [onAuth]);

  return <div ref={containerRef} className="flex justify-center" />;
}
