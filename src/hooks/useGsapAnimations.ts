import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useGsapFadeIn = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      {
        opacity: 0,
        y: 60,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return ref;
};

export const useGsapStagger = <T extends HTMLElement>(
  selector: string,
  options?: { stagger?: number; delay?: number }
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    const elements = ref.current.querySelectorAll(selector);
    
    gsap.fromTo(
      elements,
      {
        opacity: 0,
        y: 40,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: options?.stagger || 0.1,
        delay: options?.delay || 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [selector, options?.stagger, options?.delay]);

  return ref;
};

export const useGsapHero = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    const tl = gsap.timeline();

    tl.fromTo(
      ref.current.querySelector('.hero-title'),
      { opacity: 0, y: 80, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power4.out' }
    )
      .fromTo(
        ref.current.querySelector('.hero-subtitle'),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
      )
      .fromTo(
        ref.current.querySelector('.hero-buttons'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.4'
      );

    return () => {
      tl.kill();
    };
  }, []);

  return ref;
};

export const useGsapCounter = (endValue: number, duration = 2) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const counter = { value: 0 };

    gsap.to(counter, {
      value: endValue,
      duration,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = Math.round(counter.value).toString();
        }
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [endValue, duration]);

  return ref;
};

export const useGsapParallax = <T extends HTMLElement>(speed = 0.5) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.to(ref.current, {
      y: () => ScrollTrigger.maxScroll(window) * speed * -0.1,
      ease: 'none',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [speed]);

  return ref;
};

export const animateOnHover = (element: HTMLElement) => {
  const enterAnimation = () => {
    gsap.to(element, {
      scale: 1.02,
      y: -5,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const leaveAnimation = () => {
    gsap.to(element, {
      scale: 1,
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  element.addEventListener('mouseenter', enterAnimation);
  element.addEventListener('mouseleave', leaveAnimation);

  return () => {
    element.removeEventListener('mouseenter', enterAnimation);
    element.removeEventListener('mouseleave', leaveAnimation);
  };
};