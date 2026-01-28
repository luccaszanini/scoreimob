'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type NotificationItem = {
  id: string;
  title: string;
  status: "Aprovado" | "Recusado";
  href: string;
};

export function Notifications({ items }: { items: NotificationItem[] }) {
  const STORAGE_KEY = "scoreimob_notif_read";
  const [readIds, setReadIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setReadIds(JSON.parse(raw));
      } catch {
        setReadIds([]);
      }
    }
  }, []);

  const unread = useMemo(
    () => items.filter((item) => !readIds.includes(item.id)),
    [items, readIds]
  );

  const count = unread.length;

  const markRead = (id: string) => {
    const updated = Array.from(new Set([...readIds, id]));
    setReadIds(updated);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  return (
    <div className="notif">
      <button className="notif__button" type="button" onClick={() => setOpen((v) => !v)}>
        🔔
        {count > 0 ? <span className="notif__badge">{count}</span> : null}
      </button>
      {open ? (
        <div className="notif__panel">
          <div className="notif__head">
            <strong>Notificações</strong>
            <button type="button" className="ghost" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>
          {unread.length === 0 ? (
            <div className="notif__empty">Sem novidades.</div>
          ) : (
            <div className="notif__list">
              {unread.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="notif__item"
                  onClick={() => {
                    markRead(item.id);
                    setOpen(false);
                  }}
                >
                  <span className={`notif__status ${item.status === "Aprovado" ? "status--ok" : "status--alert"}`}>
                    {item.status}
                  </span>
                  <span className="notif__title">{item.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
