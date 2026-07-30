import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-background/70 backdrop-blur-md border-border/50 py-4'
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="interactive group">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border border-accent flex items-center justify-center bg-accent/10 relative overflow-hidden">
               <div className="absolute inset-0 bg-accent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
               <span className="font-mono font-bold text-accent group-hover:text-background relative z-10 text-sm">ZK</span>
            </div>
            <span className="font-sans font-bold text-2xl tracking-widest text-foreground group-hover:text-accent transition-colors">
              8
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-mono text-sm uppercase tracking-wider text-muted-foreground">
          <a href="#systems" className="nav-link hover:text-foreground transition-colors py-2 interactive">Systems</a>
          <a href="#mission" className="nav-link hover:text-foreground transition-colors py-2 interactive">Mission</a>
          <a href="#specs" className="nav-link hover:text-foreground transition-colors py-2 interactive">Specs</a>
          <button className="interactive border border-accent/50 bg-accent/5 text-accent px-6 py-2 hover:bg-accent hover:text-background transition-all duration-300 uppercase tracking-widest text-xs font-bold">
            Commence
          </button>
        </div>
      </div>
    </nav>
  );
}
