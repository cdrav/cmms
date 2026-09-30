"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Icono de campana simple en SVG
function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Polling cada 30 segundos para nuevas notificaciones
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const response = await fetch("/api/notifications/unread");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: "POST" });
      loadNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      loadNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 w-80 rounded-md border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-900">Notificaciones</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-brand hover:underline"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No hay notificaciones
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="border-b border-slate-100 px-4 py-3 hover:bg-slate-50"
                  >
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        onClick={() => {
                          markAsRead(notification.id);
                          setIsOpen(false);
                        }}
                        className="block"
                      >
                        <p className="font-medium text-slate-900">{notification.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </Link>
                    ) : (
                      <div onClick={() => markAsRead(notification.id)}>
                        <p className="font-medium text-slate-900">{notification.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-200 px-4 py-2">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-brand hover:underline"
              >
                Ver todas las notificaciones
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
