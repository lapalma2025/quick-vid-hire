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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface Notification {
  id: string;
  type: "message" | "response" | "confirmation";
  jobId: string;
  jobTitle: string;
  senderName: string;
  createdAt: string;
  responseId?: string;
}

export const NotificationBell = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    notification: Notification | null;
  }>({ open: false, notification: null });
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Nie oznaczamy nic jako przeczytane przy samym otwarciu —
    // powiadomienie ma zniknąć dopiero po kliknięciu konkretnej wiadomości.
    if (open) {
      fetchNotifications();
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    if (!profile) return;

    const { error } = await supabase
      .from("chat_messages")
      .update({ read: true })
      .eq("id", messageId);

    if (error) {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    fetchNotifications();
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notif: Notification, e: React.MouseEvent) => {
    if (notif.type === "confirmation") {
      e.preventDefault();
      e.stopPropagation();
      setConfirmationDialog({ open: true, notification: notif });
      setIsOpen(false);
    }
  };

  const handleAcceptJob = async () => {
    if (!confirmationDialog.notification || !profile) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("job_responses")
      .update({ status: "accepted" })
      .eq("id", confirmationDialog.notification.responseId);

    if (error) {
      toast({ title: "Błąd", description: error.message, variant: "destructive" });
    } else {
      // Update job status to in_progress
      await supabase
        .from("jobs")
        .update({ status: "in_progress" })
        .eq("id", confirmationDialog.notification.jobId);

      // Send notification message to client
      await supabase.from("chat_messages").insert({
        job_id: confirmationDialog.notification.jobId,
        sender_id: profile.id,
        message: "✅ Akceptuję zlecenie! Zaczynam realizację.",
      });

      toast({ title: "Zlecenie zaakceptowane!" });
      setConfirmationDialog({ open: false, notification: null });
      fetchNotifications();
    }
    setSubmitting(false);
  };

  const handleRejectJob = async () => {
    if (!confirmationDialog.notification || !profile) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("job_responses")
      .update({ status: "rejected" })
      .eq("id", confirmationDialog.notification.responseId);

    if (error) {
      toast({ title: "Błąd", description: error.message, variant: "destructive" });
    } else {
      // Reset job status and clear selected worker
      await supabase
        .from("jobs")
        .update({ selected_worker_id: null, status: "active" })
        .eq("id", confirmationDialog.notification.jobId);

      // Send notification message to client
      await supabase.from("chat_messages").insert({
        job_id: confirmationDialog.notification.jobId,
        sender_id: profile.id,
        message: "❌ Niestety muszę odrzucić to zlecenie.",
      });

      toast({ title: "Zlecenie odrzucone" });
      setConfirmationDialog({ open: false, notification: null });
      fetchNotifications();
    }
    setSubmitting(false);
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
    const seenIds = new Set<string>();

    // Fetch unread messages for user's jobs (as client)
    const { data: clientMessages } = await supabase
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

    if (clientMessages) {
      for (const msg of clientMessages as any[]) {
        if (msg.job?.user_id === profile.id && !seenIds.has(msg.id)) {
          seenIds.add(msg.id);
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

    // Fetch new responses for user's jobs (as client)
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

    // Fetch messages for jobs where user is selected worker
    const { data: workerMessages } = await supabase
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

    if (workerMessages) {
      for (const msg of workerMessages as any[]) {
        if (msg.job?.selected_worker_id === profile.id && !seenIds.has(msg.id)) {
          seenIds.add(msg.id);
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

    // Fetch messages for jobs where user has applied (as worker applicant)
    const { data: myApplications } = await supabase
      .from("job_responses")
      .select("job_id")
      .eq("worker_id", profile.id);

    if (myApplications && myApplications.length > 0) {
      const jobIds = myApplications.map(a => a.job_id);
      
      const { data: applicantMessages } = await supabase
        .from("chat_messages")
        .select(`
          id,
          created_at,
          job_id,
          job:jobs!inner(id, title),
          sender:profiles!chat_messages_sender_id_fkey(name)
        `)
        .in("job_id", jobIds)
        .neq("sender_id", profile.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (applicantMessages) {
        for (const msg of applicantMessages as any[]) {
          if (!seenIds.has(msg.id)) {
            seenIds.add(msg.id);
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

    // Fetch job confirmations awaiting worker's response
    const { data: confirmations } = await supabase
      .from("job_responses")
      .select(`
        id,
        created_at,
        status,
        job:jobs!inner(id, title, user_id),
        client:jobs!inner(user_id)
      `)
      .eq("worker_id", profile.id)
      .eq("status", "awaiting_confirmation")
      .order("created_at", { ascending: false })
      .limit(10);

    if (confirmations) {
      for (const conf of confirmations as any[]) {
        // Fetch client name
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", conf.job.user_id)
          .single();

        notifs.push({
          id: `conf-${conf.id}`,
          type: "confirmation",
          jobId: conf.job.id,
          jobTitle: conf.job.title,
          senderName: clientProfile?.name || "Zleceniodawca",
          createdAt: conf.created_at,
          responseId: conf.id,
        });
      }
    }

    // Sort by date and limit
    const uniqueNotifs = notifs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    setNotifications(uniqueNotifs);
    
    // Count only truly unread message notifications (based on database read flag)
    const unreadMessageCount = uniqueNotifs.filter(n => n.type === "message").length;
    const otherNotifCount = uniqueNotifs.filter(n => n.type !== "message").length;
    setUnreadCount(unreadMessageCount + otherNotifCount);
    
    setLoading(false);
  };

  const getNotificationBadgeVariant = (type: Notification["type"]) => {
    switch (type) {
      case "message": return "secondary";
      case "response": return "default";
      case "confirmation": return "destructive";
      default: return "default";
    }
  };

  const getNotificationLabel = (type: Notification["type"]) => {
    switch (type) {
      case "message": return "Wiadomość";
      case "response": return "Oferta";
      case "confirmation": return "Do potwierdzenia";
      default: return "Powiadomienie";
    }
  };

  return (
    <>
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
                <DropdownMenuItem 
                  key={notif.id} 
                  asChild={notif.type !== "confirmation"}
                  className="rounded-lg cursor-pointer p-3"
                  onClick={(e) => handleNotificationClick(notif, e)}
                >
                  {notif.type === "confirmation" ? (
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2">
                        <Badge variant={getNotificationBadgeVariant(notif.type)} className="text-xs">
                          {getNotificationLabel(notif.type)}
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
                  ) : (
                    <Link
                      to={
                        notif.type === "message"
                          ? `/jobs/${notif.jobId}/chat`
                          : `/jobs/${notif.jobId}`
                      }
                      onClick={() => {
                        if (notif.type === "message") {
                          void markMessageAsRead(notif.id);
                        }
                      }}
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <Badge variant={getNotificationBadgeVariant(notif.type)} className="text-xs">
                            {getNotificationLabel(notif.type)}
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
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmationDialog.open} onOpenChange={(open) => setConfirmationDialog({ open, notification: open ? confirmationDialog.notification : null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Potwierdzenie zlecenia</DialogTitle>
            <DialogDescription>
              Zostałeś wybrany do realizacji zlecenia "{confirmationDialog.notification?.jobTitle}". 
              Czy akceptujesz to zlecenie?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleRejectJob}
              disabled={submitting}
            >
              Odrzuć
            </Button>
            <Button
              onClick={handleAcceptJob}
              disabled={submitting}
            >
              Akceptuję
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
