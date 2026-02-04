import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, MessageCircle, Check, Sparkles, Star } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Simple SVG Character Component
function Character({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 300"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body */}
      <g className="character-body">
        {/* Torso */}
        <path
          d="M70 140 Q100 130 130 140 L140 220 Q100 230 60 220 Z"
          className="fill-primary"
        />
        {/* Left Arm */}
        <g className="character-left-arm" style={{ transformOrigin: "70px 150px" }}>
          <path
            d="M70 150 Q50 170 45 200 Q40 210 50 215 Q60 210 65 200 Q70 180 75 165"
            className="fill-primary"
          />
          {/* Hand */}
          <circle cx="47" cy="212" r="12" className="fill-amber-200" />
        </g>
        {/* Right Arm */}
        <g className="character-right-arm" style={{ transformOrigin: "130px 150px" }}>
          <path
            d="M130 150 Q150 170 155 200 Q160 210 150 215 Q140 210 135 200 Q130 180 125 165"
            className="fill-primary"
          />
          {/* Hand */}
          <circle cx="153" cy="212" r="12" className="fill-amber-200" />
        </g>
        {/* Legs */}
        <path
          d="M75 220 L70 280 Q70 290 80 290 L90 290 Q95 290 95 280 L95 230"
          className="fill-slate-700"
        />
        <path
          d="M105 230 L105 280 Q105 290 115 290 L125 290 Q130 290 130 280 L125 220"
          className="fill-slate-700"
        />
      </g>
      {/* Head */}
      <g className="character-head" style={{ transformOrigin: "100px 80px" }}>
        {/* Face */}
        <circle cx="100" cy="80" r="50" className="fill-amber-200" />
        {/* Hair */}
        <path
          d="M55 70 Q55 30 100 30 Q145 30 145 70 Q140 50 100 50 Q60 50 55 70"
          className="fill-slate-800"
        />
        {/* Eyes */}
        <g className="character-eyes">
          <circle cx="82" cy="80" r="6" className="fill-slate-800" />
          <circle cx="118" cy="80" r="6" className="fill-slate-800" />
          <circle cx="84" cy="78" r="2" className="fill-white" />
          <circle cx="120" cy="78" r="2" className="fill-white" />
        </g>
        {/* Mouth */}
        <path
          d="M88 100 Q100 110 112 100"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-slate-800 character-mouth"
          fill="none"
        />
      </g>
    </svg>
  );
}

// Phone UI Component
function PhoneUI({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Phone Frame */}
      <div className="phone-frame relative w-[280px] h-[560px] bg-background rounded-[40px] border-4 border-slate-800 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-2xl z-20" />
        
        {/* Screen Content */}
        <div className="phone-screen relative w-full h-full pt-10 px-4 pb-4 overflow-hidden">
          {/* Scene 1: Search */}
          <div className="scene-1 absolute inset-0 pt-10 px-4">
            <div className="search-container">
              <div className="search-box relative bg-muted rounded-2xl p-4 flex items-center gap-3">
                <div className="search-icon">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="search-text text-muted-foreground font-medium">
                  <span className="search-placeholder">Szukaj zlecenia...</span>
                  <span className="search-typed opacity-0 absolute left-12">Wrocław • weekend</span>
                  <span className="cursor inline-block w-0.5 h-5 bg-primary ml-1 opacity-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Scene 2: Job Cards */}
          <div className="scene-2 absolute inset-0 pt-10 px-4 opacity-0">
            <div className="text-sm font-semibold text-muted-foreground mb-3">Znalezione zlecenia</div>
            <div className="space-y-3">
              {/* Card 1 - Best Match */}
              <div className="job-card-1 relative bg-card rounded-xl p-4 border shadow-sm opacity-0 translate-y-8">
                <div className="best-match-badge absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full opacity-0 scale-0">
                  ✨ Najlepsze
                </div>
                <div className="match-bar h-1.5 bg-muted rounded-full mb-2 overflow-hidden">
                  <div className="match-fill h-full bg-emerald-500 w-0 rounded-full" />
                </div>
                <div className="match-percent text-xs font-bold text-emerald-500 mb-1">0%</div>
                <div className="font-semibold text-sm">Pomoc przy przeprowadzce</div>
                <div className="text-xs text-muted-foreground">Wrocław • 150-200 zł</div>
              </div>
              
              {/* Card 2 */}
              <div className="job-card-2 bg-card rounded-xl p-4 border shadow-sm opacity-0 translate-y-8">
                <div className="match-bar h-1.5 bg-muted rounded-full mb-2 overflow-hidden">
                  <div className="match-fill h-full bg-amber-500 w-0 rounded-full" />
                </div>
                <div className="match-percent text-xs font-bold text-amber-500 mb-1">0%</div>
                <div className="font-semibold text-sm">Sprzątanie biura</div>
                <div className="text-xs text-muted-foreground">Wrocław • 80 zł</div>
              </div>
              
              {/* Card 3 */}
              <div className="job-card-3 bg-card rounded-xl p-4 border shadow-sm opacity-0 translate-y-8">
                <div className="match-bar h-1.5 bg-muted rounded-full mb-2 overflow-hidden">
                  <div className="match-fill h-full bg-blue-500 w-0 rounded-full" />
                </div>
                <div className="match-percent text-xs font-bold text-blue-500 mb-1">0%</div>
                <div className="font-semibold text-sm">Montaż mebli IKEA</div>
                <div className="text-xs text-muted-foreground">Wrocław • 120 zł</div>
              </div>
            </div>
          </div>

          {/* Scene 3: Apply + Chat */}
          <div className="scene-3 absolute inset-0 pt-10 px-4 opacity-0">
            <div className="apply-card bg-card rounded-xl p-4 border shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-emerald-500 font-medium">92% dopasowania</span>
              </div>
              <div className="font-semibold mb-1">Pomoc przy przeprowadzce</div>
              <div className="text-sm text-muted-foreground mb-3">Wrocław • Sobota 10:00 • 150-200 zł</div>
              
              <button className="apply-button w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold relative overflow-hidden">
                <span className="apply-text">Aplikuj teraz</span>
                <span className="apply-loading absolute inset-0 flex items-center justify-center opacity-0">
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                </span>
                <span className="apply-sent absolute inset-0 flex items-center justify-center opacity-0 gap-2">
                  <Check className="h-5 w-5" /> Wysłano!
                </span>
              </button>
            </div>
            
            {/* Chat Bubble */}
            <div className="chat-section opacity-0 translate-y-4">
              <div className="chat-bubble-incoming bg-muted rounded-2xl rounded-bl-sm p-3 mb-2 max-w-[85%]">
                <div className="text-xs text-muted-foreground mb-1">Zleceniodawca</div>
                <div className="text-sm">Hej! Jesteś dostępny dziś o 18:00?</div>
              </div>
              
              <div className="chat-bubble-outgoing bg-primary text-primary-foreground rounded-2xl rounded-br-sm p-3 ml-auto max-w-[85%] opacity-0 translate-x-4">
                <div className="chat-typing text-sm">
                  <span className="chat-typed-text"></span>
                  <span className="chat-cursor inline-block w-0.5 h-4 bg-primary-foreground ml-0.5 opacity-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Scene 4: Success */}
          <div className="scene-4 absolute inset-0 pt-10 px-4 flex flex-col items-center justify-center opacity-0">
            <div className="success-icon w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-4 scale-0">
              <Check className="h-10 w-10 text-white" />
            </div>
            <div className="success-title text-xl font-bold mb-2 opacity-0">Gratulacje! 🎉</div>
            <div className="success-subtitle text-muted-foreground mb-6 opacity-0">Zlecenie zostało wykonane</div>
            
            <div className="balance-card bg-card rounded-2xl p-6 border shadow-lg w-full opacity-0 scale-95">
              <div className="text-sm text-muted-foreground mb-1">Twoje saldo</div>
              <div className="balance-amount text-3xl font-bold text-emerald-500 mb-2">
                +<span className="balance-number">0</span> zł
              </div>
              <div className="payout-text text-xs text-muted-foreground opacity-0">
                💸 Wypłata jutro na konto
              </div>
            </div>
            
            {/* Confetti */}
            <div className="confetti absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`confetti-piece absolute w-2 h-2 opacity-0 ${
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

      // Character idle animation (independent)
      gsap.to(".character-body", {
        y: 3,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Progress bar animation
      const progressSteps = [0.25, 0.5, 0.75, 1];
      
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
      
      // Character looks at phone
      tl.to(".character-head", {
        rotation: 5,
        duration: 0.1,
      }, 0.1);

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
        boxShadow: "0 0 20px rgba(var(--primary), 0.3)",
        duration: 0.1,
      }, 0.45);
      
      // Character leans toward phone
      tl.to(".character-body", { rotation: -5, duration: 0.1 }, 0.35);
      tl.to(".character-head", { rotation: 10, duration: 0.1 }, 0.35);

      // ===== SCENE 3: Apply + Chat =====
      tl.to(".scene-2", { opacity: 0, duration: 0.05 }, 0.5);
      tl.to(".scene-3", { opacity: 1, duration: 0.05 }, 0.51);
      tl.to(".progress-fill", { width: "75%", duration: 0.1 }, 0.51);
      tl.to(".step-indicator", { innerHTML: "3/4", duration: 0.01 }, 0.51);
      tl.to(".step-text", { innerHTML: "Aplikuję na zlecenie", duration: 0.01 }, 0.51);
      
      // Character taps
      tl.to(".character-right-arm", { rotation: -30, duration: 0.05 }, 0.53);
      tl.to(".character-right-arm", { rotation: 0, duration: 0.05 }, 0.58);
      
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
      
      // Character jumps
      tl.to(".character-body", { y: -20, rotation: 0, duration: 0.05 }, 0.85);
      tl.to(".character-body", { y: 0, duration: 0.05 }, 0.9);
      
      // Character happy expression (mouth changes via scale)
      tl.to(".character-mouth", { 
        attr: { d: "M80 95 Q100 115 120 95" },
        duration: 0.05,
      }, 0.85);

    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden"
    >
      <div ref={containerRef} className="container h-screen flex items-center justify-center">
        <div className="flex items-center gap-8 lg:gap-16">
          {/* Left: Character */}
          <div className="hidden md:block">
            <Character className="w-48 lg:w-64 h-auto" />
          </div>

          {/* Right: Phone */}
          <div className="relative">
            <PhoneUI />
            
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-8">
          <div className="flex items-center justify-between mb-3">
            <span className="step-text text-sm font-medium text-muted-foreground">Rozpocznij</span>
            <span className="step-indicator text-sm font-bold text-primary">0/4</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="progress-fill h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full w-0 transition-all" />
          </div>
        </div>

        {/* Section Title */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-2">Jak to działa?</h2>
          <p className="text-muted-foreground">Przewiń, aby zobaczyć proces</p>
        </div>
      </div>
    </section>
  );
}
