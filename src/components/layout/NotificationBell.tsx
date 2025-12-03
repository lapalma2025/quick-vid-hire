import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface Notification {
  id: string;
  type: "message" | "response";
  jobId: string;
  jobTitle: string;
  senderName: string;
  createdAt: string;
}

export const NotificationBell = () => {
  const { profile, isClient } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      // Mark messages as read in DB and hide badge
      markMessagesAsRead();
      setUnreadCount(0);
      // Store last seen time to not show badge for these notifications again
      localStorage.setItem(`notifications_seen_${profile?.id}`, new Date().toISOString());
    }
  };

  const markMessagesAsRead = async () => {
    if (!profile) return;
    
    const messageIds = notifications
      .filter(n => n.type === "message")
      .map(n => n.id);
    
    if (messageIds.length > 0) {
      await supabase
        .from("chat_messages")
        .update({ read: true })
        .in("id", messageIds);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    if (profile) {
      fetchNotifications();
    }
  }, [profile]);

  const fetchNotifications = async () => {
    if (!profile) return;
    setLoading(true);

    const notifs: Notification[] = [];

    if (isClient) {
      // Fetch unread messages for client's jobs
      const { data: messages } = await supabase
        .from("chat_messages")
        .select(`
          id,
          created_at,
          job:jobs!inner(id, title, user_id),
          sender:profiles!chat_messages_sender_id_fkey(name)
        `)
        .neq("sender_id", profile.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (messages) {
        for (const msg of messages as any[]) {
          if (msg.job?.user_id === profile.id) {
            notifs.push({
              id: msg.id,
              type: "message",
              jobId: msg.job.id,
              jobTitle: msg.job.title,
              senderName: msg.sender?.name || "Użytkownik",
              createdAt: msg.created_at,
            });
          }
        }
      }

      // Fetch new responses for client's jobs
      const { data: responses } = await supabase
        .from("job_responses")
        .select(`
          id,
          created_at,
          status,
          job:jobs!inner(id, title, user_id),
          worker:profiles!job_responses_worker_id_fkey(name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);

      if (responses) {
        for (const resp of responses as any[]) {
          if (resp.job?.user_id === profile.id) {
            notifs.push({
              id: resp.id,
              type: "response",
              jobId: resp.job.id,
              jobTitle: resp.job.title,
              senderName: resp.worker?.name || "Wykonawca",
              createdAt: resp.created_at,
            });
          }
        }
      }
    } else {
      // For workers - fetch messages for jobs they're selected for
      const { data: messages } = await supabase
        .from("chat_messages")
        .select(`
          id,
          created_at,
          job:jobs!inner(id, title, selected_worker_id),
          sender:profiles!chat_messages_sender_id_fkey(name)
        `)
        .neq("sender_id", profile.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (messages) {
        for (const msg of messages as any[]) {
          if (msg.job?.selected_worker_id === profile.id) {
            notifs.push({
              id: msg.id,
              type: "message",
              jobId: msg.job.id,
              jobTitle: msg.job.title,
              senderName: msg.sender?.name || "Użytkownik",
              createdAt: msg.created_at,
            });
          }
        }
      }
    }

    // Sort by date and dedupe by jobId
    const uniqueNotifs = notifs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    setNotifications(uniqueNotifs);
    
    // Count new notifications since last seen
    const lastSeen = localStorage.getItem(`notifications_seen_${profile.id}`);
    const newCount = uniqueNotifs.filter(n => !lastSeen || new Date(n.createdAt) > new Date(lastSeen)).length;
    setUnreadCount(newCount);
    
    setLoading(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl h-11 w-11 hover:bg-primary/10 transition-colors duration-300"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 rounded-xl p-2" align="end">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Ładowanie...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Brak nowych powiadomień
          </div>
        ) : (
          <>
            <div className="px-3 py-2 text-sm font-semibold border-b mb-2 flex items-center justify-between">
              <span>Powiadomienia ({notifications.length})</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  clearNotifications();
                }}
              >
                Wyczyść
              </Button>
            </div>
            {notifications.map((notif) => (
              <DropdownMenuItem key={notif.id} asChild className="rounded-lg cursor-pointer p-3">
                <Link to={notif.type === "message" ? `/jobs/${notif.jobId}/chat` : `/jobs/${notif.jobId}`}>
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center gap-2">
                      <Badge variant={notif.type === "message" ? "secondary" : "default"} className="text-xs">
                        {notif.type === "message" ? "Wiadomość" : "Oferta"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(notif.createdAt), "dd MMM HH:mm", { locale: pl })}
                      </span>
                    </div>
                    <p className="font-medium text-sm truncate">{notif.jobTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      od: {notif.senderName}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
