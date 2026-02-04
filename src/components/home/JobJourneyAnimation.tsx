import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, Check, Star } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Phone UI Component - smaller size
function PhoneUI({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Phone Frame - reduced size */}
      <div className="phone-frame relative w-[200px] sm:w-[240px] h-[410px] sm:h-[500px] bg-background rounded-[32px] border-4 border-slate-800 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-5 sm:h-6 bg-slate-800 rounded-b-xl z-20" />
        
        {/* Screen Content */}
        <div className="phone-screen relative w-full h-full pt-8 px-2.5 sm:px-3 pb-3 overflow-hidden">
          {/* Scene 1: Search */}
          <div className="scene-1 absolute inset-0 pt-8 px-2.5 sm:px-3">
            <div className="search-container">
              <div className="search-box relative bg-muted rounded-xl p-2.5 sm:p-3 flex items-center gap-2">
                <div className="search-icon">
                  <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </div>
                <div className="search-text text-muted-foreground font-medium text-xs sm:text-sm">
                  <span className="search-placeholder">Szukaj zlecenia...</span>
                  <span className="search-typed opacity-0 absolute left-8 sm:left-10">Wrocław • weekend</span>
                  <span className="cursor inline-block w-0.5 h-3 sm:h-4 bg-primary ml-1 opacity-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Scene 2: Job Cards */}
          <div className="scene-2 absolute inset-0 pt-8 px-2.5 sm:px-3 opacity-0">
            <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1.5 sm:mb-2">Znalezione zlecenia</div>
            <div className="space-y-1.5 sm:space-y-2">
              {/* Card 1 - Best Match */}
              <div className="job-card-1 relative bg-card rounded-lg p-2 sm:p-3 border shadow-sm opacity-0 translate-y-8">
                <div className="best-match-badge absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full opacity-0 scale-0 flex items-center gap-0.5">
                  <Star className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-current" /> Najlepsze
                </div>
                <div className="match-bar h-1 bg-muted rounded-full mb-1.5 overflow-hidden">
                  <div className="match-fill h-full bg-emerald-500 w-0 rounded-full" />
                </div>
                <div className="match-percent text-[8px] sm:text-[10px] font-bold text-emerald-500 mb-0.5">0%</div>
                <div className="font-semibold text-[10px] sm:text-xs">Pomoc przy przeprowadzce</div>
                <div className="text-[8px] sm:text-[10px] text-muted-foreground">Wrocław • 150-200 zł</div>
              </div>
              
              {/* Card 2 */}
              <div className="job-card-2 bg-card rounded-lg p-2 sm:p-3 border shadow-sm opacity-0 translate-y-8">
                <div className="match-bar h-1 bg-muted rounded-full mb-1.5 overflow-hidden">
                  <div className="match-fill h-full bg-amber-500 w-0 rounded-full" />
                </div>
                <div className="match-percent text-[8px] sm:text-[10px] font-bold text-amber-500 mb-0.5">0%</div>
                <div className="font-semibold text-[10px] sm:text-xs">Sprzątanie biura</div>
                <div className="text-[8px] sm:text-[10px] text-muted-foreground">Wrocław • 80 zł</div>
              </div>
              
              {/* Card 3 */}
              <div className="job-card-3 bg-card rounded-lg p-2 sm:p-3 border shadow-sm opacity-0 translate-y-8">
                <div className="match-bar h-1 bg-muted rounded-full mb-1.5 overflow-hidden">
                  <div className="match-fill h-full bg-blue-500 w-0 rounded-full" />
                </div>
                <div className="match-percent text-[8px] sm:text-[10px] font-bold text-blue-500 mb-0.5">0%</div>
                <div className="font-semibold text-[10px] sm:text-xs">Montaż mebli IKEA</div>
                <div className="text-[8px] sm:text-[10px] text-muted-foreground">Wrocław • 120 zł</div>
              </div>
            </div>
          </div>

          {/* Scene 3: Apply + Chat */}
          <div className="scene-3 absolute inset-0 pt-8 px-2.5 sm:px-3 opacity-0">
            <div className="apply-card bg-card rounded-lg p-2 sm:p-3 border shadow-sm mb-2 sm:mb-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[8px] sm:text-[10px] text-emerald-500 font-medium">92% dopasowania</span>
              </div>
              <div className="font-semibold text-[10px] sm:text-xs mb-0.5">Pomoc przy przeprowadzce</div>
              <div className="text-[8px] sm:text-[10px] text-muted-foreground mb-2">Wrocław • Sobota 10:00</div>
              
              <button className="apply-button w-full bg-primary text-primary-foreground rounded-lg py-1.5 sm:py-2 font-semibold text-[10px] sm:text-xs relative overflow-hidden">
                <span className="apply-text">Aplikuj teraz</span>
                <span className="apply-loading absolute inset-0 flex items-center justify-center opacity-0">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                </span>
                <span className="apply-sent absolute inset-0 flex items-center justify-center opacity-0 gap-1">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4" /> Wysłano!
                </span>
              </button>
            </div>
            
            {/* Chat Bubble */}
            <div className="chat-section opacity-0 translate-y-4">
              <div className="chat-bubble-incoming bg-muted rounded-xl rounded-bl-sm p-2 mb-1.5 max-w-[85%]">
                <div className="text-[8px] sm:text-[10px] text-muted-foreground mb-0.5">Zleceniodawca</div>
                <div className="text-[10px] sm:text-xs">Hej! Jesteś dostępny dziś o 18:00?</div>
              </div>
              
              <div className="chat-bubble-outgoing bg-primary text-primary-foreground rounded-xl rounded-br-sm p-2 ml-auto max-w-[85%] opacity-0 translate-x-4">
                <div className="chat-typing text-[10px] sm:text-xs">
                  <span className="chat-typed-text"></span>
                  <span className="chat-cursor inline-block w-0.5 h-2.5 sm:h-3 bg-primary-foreground ml-0.5 opacity-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Scene 4: Success */}
          <div className="scene-4 absolute inset-0 pt-8 px-2.5 sm:px-3 flex flex-col items-center justify-start opacity-0 relative">
            <div className="success-icon w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500 rounded-full flex items-center justify-center mb-2 sm:mb-3 scale-0">
              <Check className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="success-title text-sm sm:text-base font-bold mb-1 opacity-0">Gratulacje! 🎉</div>
            <div className="success-subtitle text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4 opacity-0">Zlecenie zostało wykonane</div>
            
            <div className="balance-card bg-card rounded-xl p-3 sm:p-4 border shadow-lg w-full opacity-0 scale-95 relative z-10">
              <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Twoje saldo</div>
              <div className="balance-amount text-xl sm:text-2xl font-bold text-emerald-500 mb-1">
                +<span className="balance-number">0</span> zł
              </div>
              <div className="payout-text text-[8px] sm:text-[10px] text-muted-foreground opacity-0">
                💸 Wypłata jutro na konto
              </div>
            </div>

            {/* Confetti - inside phone, lower part only (won't cover balance) */}
            <div className="confetti absolute bottom-0 left-0 right-0 h-28 pointer-events-none overflow-hidden z-0">
              {[...Array(18)].map((_, i) => (
                <div
                  key={i}
                  className={`confetti-piece absolute w-2 h-2 opacity-0 ${
                    i % 4 === 0 ? "bg-primary" :
                    i % 4 === 1 ? "bg-emerald-500" :
                    i % 4 === 2 ? "bg-amber-500" :
                    "bg-blue-500"
                  } ${i % 2 === 0 ? "rounded-full" : "rotate-45"}`}
                  style={{
                    left: `${6 + (i * 5)}%`,
                    top: "-10px",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobJourneyAnimation() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    if (!section || !container) return;

    const ctx = gsap.context(() => {
      // Main timeline controlled by scroll - increased scrub for smoother animation
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=2000",
          scrub: 2,
          pin: true,
          pinType: "fixed",
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // ===== SCENE 1: Search =====
      tl.to(".progress-fill", { width: "25%", duration: 0.1 }, 0);
      tl.to(".step-indicator", { 
        innerHTML: "1/4",
        duration: 0.01,
      }, 0);
      tl.to(".step-text", { 
        innerHTML: "Szukam pracy",
        duration: 0.01,
      }, 0);
      
      // Cursor blink
      tl.to(".cursor", { opacity: 1, duration: 0.1 }, 0.05);
      tl.to(".cursor", { 
        opacity: 0, 
        repeat: 3, 
        yoyo: true, 
        duration: 0.05 
      }, 0.1);
      
      // Type search text
      tl.to(".search-placeholder", { opacity: 0, duration: 0.05 }, 0.15);
      tl.to(".search-typed", { 
        opacity: 1,
        duration: 0.1,
      }, 0.15);
      
      // Search icon bounce
      tl.to(".search-icon", {
        scale: 1.2,
        duration: 0.05,
        yoyo: true,
        repeat: 1,
      }, 0.2);

      // ===== SCENE 2: Matching =====
      tl.to(".scene-1", { opacity: 0, duration: 0.05 }, 0.25);
      tl.to(".scene-2", { opacity: 1, duration: 0.05 }, 0.26);
      tl.to(".progress-fill", { width: "50%", duration: 0.1 }, 0.26);
      tl.to(".step-indicator", { innerHTML: "2/4", duration: 0.01 }, 0.26);
      tl.to(".step-text", { innerHTML: "Dopasowuję oferty", duration: 0.01 }, 0.26);
      
      // Cards fly in with stagger
      tl.to(".job-card-1", { opacity: 1, y: 0, duration: 0.08 }, 0.28);
      tl.to(".job-card-2", { opacity: 1, y: 0, duration: 0.08 }, 0.32);
      tl.to(".job-card-3", { opacity: 1, y: 0, duration: 0.08 }, 0.36);
      
      // Match percentages count up
      tl.to(".job-card-1 .match-fill", { width: "92%", duration: 0.1 }, 0.35);
      tl.to(".job-card-1 .match-percent", { innerHTML: "92%", duration: 0.1 }, 0.35);
      
      tl.to(".job-card-2 .match-fill", { width: "78%", duration: 0.1 }, 0.38);
      tl.to(".job-card-2 .match-percent", { innerHTML: "78%", duration: 0.1 }, 0.38);
      
      tl.to(".job-card-3 .match-fill", { width: "88%", duration: 0.1 }, 0.41);
      tl.to(".job-card-3 .match-percent", { innerHTML: "88%", duration: 0.1 }, 0.41);
      
      // Best match badge appears
      tl.to(".best-match-badge", { 
        opacity: 1, 
        scale: 1, 
        duration: 0.08,
        ease: "back.out(2)",
      }, 0.45);
      
      // Card glow effect
      tl.to(".job-card-1", {
        boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
        duration: 0.1,
      }, 0.45);

      // ===== SCENE 3: Apply + Chat =====
      tl.to(".scene-2", { opacity: 0, duration: 0.05 }, 0.5);
      tl.to(".scene-3", { opacity: 1, duration: 0.05 }, 0.51);
      tl.to(".progress-fill", { width: "75%", duration: 0.1 }, 0.51);
      tl.to(".step-indicator", { innerHTML: "3/4", duration: 0.01 }, 0.51);
      tl.to(".step-text", { innerHTML: "Aplikuję na zlecenie", duration: 0.01 }, 0.51);
      
      // Button states
      tl.to(".apply-text", { opacity: 0, duration: 0.02 }, 0.55);
      tl.to(".apply-loading", { opacity: 1, duration: 0.02 }, 0.56);
      tl.to(".apply-loading", { opacity: 0, duration: 0.02 }, 0.62);
      tl.to(".apply-sent", { opacity: 1, duration: 0.02 }, 0.63);
      tl.to(".apply-button", { 
        backgroundColor: "rgb(34 197 94)", 
        duration: 0.05 
      }, 0.63);
      
      // Chat appears
      tl.to(".chat-section", { opacity: 1, y: 0, duration: 0.08 }, 0.65);
      
      // Outgoing message appears with typing
      tl.to(".chat-bubble-outgoing", { opacity: 1, x: 0, duration: 0.05 }, 0.68);
      tl.to(".chat-cursor", { opacity: 1, duration: 0.02 }, 0.69);
      
      // Type response
      const responseText = "Tak, jestem! 👍";
      tl.to(".chat-typed-text", {
        innerHTML: responseText,
        duration: 0.1,
        ease: "none",
      }, 0.7);
      
      tl.to(".chat-cursor", { opacity: 0, duration: 0.02 }, 0.75);

      // ===== SCENE 4: Success =====
      tl.to(".scene-3", { opacity: 0, duration: 0.05 }, 0.78);
      tl.to(".scene-4", { opacity: 1, duration: 0.05 }, 0.79);
      tl.to(".progress-fill", { width: "100%", duration: 0.1 }, 0.79);
      tl.to(".step-indicator", { innerHTML: "4/4", duration: 0.01 }, 0.79);
      tl.to(".step-text", { innerHTML: "Gotowe! 🎉", duration: 0.01 }, 0.79);
      
      // Success icon pops in
      tl.to(".success-icon", { 
        scale: 1, 
        duration: 0.1,
        ease: "back.out(2)",
      }, 0.8);
      
      // Text fades in
      tl.to(".success-title", { opacity: 1, duration: 0.05 }, 0.85);
      tl.to(".success-subtitle", { opacity: 1, duration: 0.05 }, 0.87);
      
      // Balance card appears
      tl.to(".balance-card", { 
        opacity: 1, 
        scale: 1, 
        duration: 0.08,
        ease: "back.out(1.5)",
      }, 0.88);
      
      // Money count up
      tl.to(".balance-number", {
        innerHTML: "120",
        duration: 0.1,
        snap: { innerHTML: 1 },
      }, 0.9);
      
      // Payout text
      tl.to(".payout-text", { opacity: 1, duration: 0.05 }, 0.95);
      
      // Confetti animation - inside phone (lower zone)
      const confettiPieces = document.querySelectorAll(".confetti-piece");
      confettiPieces.forEach((piece, i) => {
        tl.to(piece, {
          opacity: 1,
          y: 90 + Math.random() * 30,
          x: (Math.random() - 0.5) * 50,
          rotation: Math.random() * 360,
          duration: 0.12,
          ease: "power1.out",
        }, 0.82 + i * 0.01);
      });

    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden"
    >
      <div ref={containerRef} className="container h-screen flex flex-col items-center justify-start px-4 pt-24 sm:pt-28 pb-16">
        {/* Section Title */}
        <div className="text-center mb-3 sm:mb-4">
          <h2 className="text-sm sm:text-base lg:text-lg font-bold leading-tight">Jak to działa?</h2>
        </div>

        {/* Centered Phone */}
        <div className="relative flex-shrink-0">
          <PhoneUI />
          
          {/* Decorative elements */}
          <div className="absolute -top-8 -right-8 w-16 h-16 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        {/* Progress Bar - more spacing from phone */}
        <div className="w-full max-w-[200px] sm:max-w-[240px] mt-10 sm:mt-12">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="step-text text-[10px] sm:text-xs font-medium text-muted-foreground">Rozpocznij</span>
            <span className="step-indicator text-[10px] sm:text-xs font-bold text-primary">0/4</span>
          </div>
          <div className="h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="progress-fill h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full w-0 transition-all" />
          </div>
        </div>
      </div>

      {/* Spacer so the next section doesn't start immediately after unpin */}
      <div aria-hidden className="h-16 sm:h-24" />
    </section>
  );
}
