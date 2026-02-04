import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, Bell, Handshake, MapPin, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const journeySteps = [
  {
    icon: Search,
    title: 'Szukam zlecenia',
    description: 'Przeglądam dostępne oferty',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    icon: Bell,
    title: 'Otrzymuję powiadomienie',
    description: 'Nowe zlecenie w mojej okolicy!',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
  {
    icon: Handshake,
    title: 'Zgłaszam się',
    description: 'Moja oferta została zaakceptowana',
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    icon: MapPin,
    title: 'Idę do pracy',
    description: 'Zlecenie czeka na wykonanie',
    color: 'from-primary to-primary/80',
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
  },
];

export function JobJourneyAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const personRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !stepsRef.current || !pathRef.current || !personRef.current) return;

    const ctx = gsap.context(() => {
      const steps = stepsRef.current?.querySelectorAll('.journey-step');
      const connectors = stepsRef.current?.querySelectorAll('.journey-connector');
      const pathLength = pathRef.current?.getTotalLength() || 0;

      // Set initial path state (hidden)
      if (pathRef.current) {
        gsap.set(pathRef.current, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });
      }

      // Set initial states
      gsap.set(steps, { opacity: 0, y: 40, scale: 0.8 });
      gsap.set(connectors, { scaleX: 0 });
      gsap.set(personRef.current, { opacity: 0, scale: 0, y: 20 });

      // Create main timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      });

      // Animate path drawing
      tl.to(pathRef.current, {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: 'power2.inOut',
      });

      // Animate steps sequentially
      steps?.forEach((step, index) => {
        tl.to(step, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
        }, index === 0 ? '-=1' : '-=0.3');

        // Animate connector after step (except last)
        if (connectors && index < connectors.length) {
          tl.to(connectors[index], {
            scaleX: 1,
            duration: 0.3,
            ease: 'power2.out',
          }, '-=0.2');
        }
      });

      // Person appears at the end
      tl.to(personRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        ease: 'back.out(2)',
      }, '-=0.2');

      // Add sparkle effect
      tl.to('.journey-sparkle', {
        opacity: 1,
        scale: 1,
        rotation: 360,
        duration: 0.5,
        stagger: 0.1,
        ease: 'back.out(2)',
      }, '-=0.3');

      // Continuous floating animation for person after entrance
      tl.add(() => {
        gsap.to(personRef.current, {
          y: -8,
          duration: 1.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });

      // Pulse animation for active step icons
      steps?.forEach((step, i) => {
        const icon = step.querySelector('.journey-icon');
        gsap.to(icon, {
          scale: 1.05,
          duration: 1 + i * 0.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.3,
        });
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4">
            Znajdź zlecenie w{' '}
            <span className="text-primary">4 krokach</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Od przeglądania ofert do realizacji zlecenia - to takie proste!
          </p>
        </div>

        {/* Journey Path SVG (decorative curved line) */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[80%] h-24 pointer-events-none">
          <svg viewBox="0 0 800 100" className="w-full h-full" preserveAspectRatio="none">
            <path
              ref={pathRef}
              d="M 50 50 Q 200 20, 300 50 T 500 50 T 750 50"
              fill="none"
              stroke="url(#journeyGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              className="drop-shadow-sm"
            />
            <defs>
              <linearGradient id="journeyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Steps */}
        <div 
          ref={stepsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto relative"
        >
          {journeySteps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step Card */}
              <div className="journey-step flex flex-col items-center text-center group">
                {/* Icon Container */}
                <div className={`journey-icon relative w-16 h-16 md:w-20 md:h-20 rounded-2xl ${step.bgColor} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300 border border-white/10`}>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                  <step.icon className={`h-7 w-7 md:h-9 md:w-9 ${step.iconColor} relative z-10`} />
                  
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center text-xs font-bold shadow-sm">
                    {index + 1}
                  </div>
                </div>

                {/* Text */}
                <h3 className="font-semibold text-sm md:text-base mb-1">{step.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>

              {/* Connector (hidden on mobile, visible on desktop) */}
              {index < journeySteps.length - 1 && (
                <div className="journey-connector hidden md:block absolute top-8 md:top-10 left-[calc(100%+0.5rem)] w-[calc(100%-1rem)] h-0.5 bg-gradient-to-r from-border to-primary/30 origin-left" />
              )}
            </div>
          ))}
        </div>

        {/* Animated Person/Worker at the end */}
        <div 
          ref={personRef}
          className="flex justify-center mt-10 md:mt-14"
        >
          <div className="relative">
            {/* Person illustration */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/25 border-4 border-background">
              <span className="text-3xl md:text-4xl">🧑‍🔧</span>
            </div>
            
            {/* Sparkles around person */}
            <div className="journey-sparkle absolute -top-2 -left-2 opacity-0 scale-0">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            <div className="journey-sparkle absolute -top-1 -right-3 opacity-0 scale-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="journey-sparkle absolute -bottom-1 -right-2 opacity-0 scale-0">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            
            {/* Success message */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-sm font-medium text-primary">Do roboty! 💪</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
