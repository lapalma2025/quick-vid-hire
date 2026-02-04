import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, MessageCircle, Check, Star } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Phone UI Component
function PhoneUI({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Phone Frame */}
      <div className="phone-frame relative w-[280px] sm:w-[320px] h-[560px] sm:h-[640px] bg-background rounded-[40px] border-4 border-slate-800 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-32 h-6 sm:h-7 bg-slate-800 rounded-b-2xl z-20" />
        
        {/* Screen Content */}
        <div className="phone-screen relative w-full h-full pt-10 px-3 sm:px-4 pb-4 overflow-hidden">
          {/* Scene 1: Search */}
          <div className="scene-1 absolute inset-0 pt-10 px-3 sm:px-4">
            <div className="search-container">
              <div className="search-box relative bg-muted rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="search-icon">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
                <div className="search-text text-muted-foreground font-medium text-sm sm:text-base">
                  <span className="search-placeholder">Szukaj zlecenia...</span>
                  <span className="search-typed opacity-0 absolute left-10 sm:left-12">Wrocław • weekend</span>
                  <span className="cursor inline-block w-0.5 h-4 sm:h-5 bg-primary ml-1 opacity-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Scene 2: Job Cards */}
          <div className="scene-2 absolute inset-0 pt-10 px-3 sm:px-4 opacity-0">
            <div className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3">Znalezione zlecenia</div>
            <div className="space-y-2 sm:space-y-3">
              {/* Card 1 - Best Match */}
              <div className="job-card-1 relative bg-card rounded-xl p-3 sm:p-4 border shadow-sm opacity-0 translate-y-8">
                <div className="best-match-badge absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full opacity-0 scale-0 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" /> Najlepsze
                </div>
                <div className="match-bar h-1 sm:h-1.5 bg-muted rounded-full mb-2 overflow-hidden">
                  <div className="match-fill h-full bg-emerald-500 w-0 rounded-full" />
                </div>
                <div className="match-percent text-[10px] sm:text-xs font-bold text-emerald-500 mb-1">0%</div>
                <div className="font-semibold text-xs sm:text-sm">Pomoc przy przeprowadzce</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Wrocław • 150-200 zł</div>
              </div>
              
              {/* Card 2 */}
              <div className="job-card-2 bg-card rounded-xl p-3 sm:p-4 border shadow-sm opacity-0 translate-y-8">
                <div className="match-bar h-1 sm:h-1.5 bg-muted rounded-full mb-2 overflow-hidden">
                  <div className="match-fill h-full bg-amber-500 w-0 rounded-full" />
                </div>
                <div className="match-percent text-[10px] sm:text-xs font-bold text-amber-500 mb-1">0%</div>
                <div className="font-semibold text-xs sm:text-sm">Sprzątanie biura</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Wrocław • 80 zł</div>
              </div>
              
              {/* Card 3 */}
              <div className="job-card-3 bg-card rounded-xl p-3 sm:p-4 border shadow-sm opacity-0 translate-y-8">
                <div className="match-bar h-1 sm:h-1.5 bg-muted rounded-full mb-2 overflow-hidden">
                  <div className="match-fill h-full bg-blue-500 w-0 rounded-full" />
                </div>
                <div className="match-percent text-[10px] sm:text-xs font-bold text-blue-500 mb-1">0%</div>
                <div className="font-semibold text-xs sm:text-sm">Montaż mebli IKEA</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Wrocław • 120 zł</div>
              </div>
            </div>
          </div>

          {/* Scene 3: Apply + Chat */}
          <div className="scene-3 absolute inset-0 pt-10 px-3 sm:px-4 opacity-0">
            <div className="apply-card bg-card rounded-xl p-3 sm:p-4 border shadow-sm mb-3 sm:mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] sm:text-xs text-emerald-500 font-medium">92% dopasowania</span>
              </div>
              <div className="font-semibold text-xs sm:text-sm mb-1">Pomoc przy przeprowadzce</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">Wrocław • Sobota 10:00 • 150-200 zł</div>
              
              <button className="apply-button w-full bg-primary text-primary-foreground rounded-xl py-2 sm:py-3 font-semibold text-xs sm:text-sm relative overflow-hidden">
                <span className="apply-text">Aplikuj teraz</span>
                <span className="apply-loading absolute inset-0 flex items-center justify-center opacity-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                </span>
                <span className="apply-sent absolute inset-0 flex items-center justify-center opacity-0 gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" /> Wysłano!
                </span>
              </button>
            </div>
            
            {/* Chat Bubble */}
            <div className="chat-section opacity-0 translate-y-4">
              <div className="chat-bubble-incoming bg-muted rounded-2xl rounded-bl-sm p-2 sm:p-3 mb-2 max-w-[85%]">
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-1">Zleceniodawca</div>
                <div className="text-xs sm:text-sm">Hej! Jesteś dostępny dziś o 18:00?</div>
              </div>
              
              <div className="chat-bubble-outgoing bg-primary text-primary-foreground rounded-2xl rounded-br-sm p-2 sm:p-3 ml-auto max-w-[85%] opacity-0 translate-x-4">
                <div className="chat-typing text-xs sm:text-sm">
                  <span className="chat-typed-text"></span>
                  <span className="chat-cursor inline-block w-0.5 h-3 sm:h-4 bg-primary-foreground ml-0.5 opacity-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Scene 4: Success */}
          <div className="scene-4 absolute inset-0 pt-10 px-3 sm:px-4 flex flex-col items-center justify-center opacity-0">
            <div className="success-icon w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 scale-0">
              <Check className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <div className="success-title text-lg sm:text-xl font-bold mb-2 opacity-0">Gratulacje! 🎉</div>
            <div className="success-subtitle text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 opacity-0">Zlecenie zostało wykonane</div>
            
            <div className="balance-card bg-card rounded-2xl p-4 sm:p-6 border shadow-lg w-full opacity-0 scale-95">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Twoje saldo</div>
              <div className="balance-amount text-2xl sm:text-3xl font-bold text-emerald-500 mb-2">
                +<span className="balance-number">0</span> zł
              </div>
              <div className="payout-text text-[10px] sm:text-xs text-muted-foreground opacity-0">
                💸 Wypłata jutro na konto
              </div>
            </div>
            
            {/* Confetti */}
            <div className="confetti absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`confetti-piece absolute w-1.5 h-1.5 sm:w-2 sm:h-2 opacity-0 ${
                    i % 4 === 0 ? "bg-primary" : 
                    i % 4 === 1 ? "bg-emerald-500" : 
                    i % 4 === 2 ? "bg-amber-500" : "bg-blue-500"
                  } ${i % 2 === 0 ? "rounded-full" : "rotate-45"}`}
                  style={{
                    left: `${10 + (i * 4)}%`,
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
      // Main timeline controlled by scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=2500",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Progress bar animation
      
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
      
      // Confetti!
      const confettiPieces = document.querySelectorAll(".confetti-piece");
      confettiPieces.forEach((piece, i) => {
        tl.to(piece, {
          opacity: 1,
          y: 400 + Math.random() * 100,
          x: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 720,
          duration: 0.15,
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
      <div ref={containerRef} className="container h-screen flex flex-col items-center justify-center px-4">
        {/* Section Title */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Jak to działa?</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Przewiń, aby zobaczyć proces</p>
        </div>

        {/* Centered Phone */}
        <div className="relative flex-shrink-0">
          <PhoneUI />
          
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        {/* Progress Bar - positioned below phone with proper spacing */}
        <div className="w-full max-w-xs sm:max-w-sm mt-6 sm:mt-8">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="step-text text-xs sm:text-sm font-medium text-muted-foreground">Rozpocznij</span>
            <span className="step-indicator text-xs sm:text-sm font-bold text-primary">0/4</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
            <div className="progress-fill h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full w-0 transition-all" />
          </div>
        </div>
      </div>
    </section>
  );
}
