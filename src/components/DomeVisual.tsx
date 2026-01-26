export function DomeVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Stars background */}
      <div className="absolute inset-0 stars-bg opacity-30" />
      
      {/* Dome arc at top */}
      <div 
        className="absolute -top-[50vh] left-1/2 -translate-x-1/2 w-[200vw] h-[100vh] rounded-[50%] border-t border-primary/20"
        style={{
          background: 'radial-gradient(ellipse at center bottom, transparent 60%, hsl(var(--primary) / 0.05) 100%)',
        }}
      />
      
      {/* Glowing orbs */}
      <div className="absolute top-20 left-[15%] w-32 h-32 rounded-full bg-accent/10 blur-3xl animate-float" />
      <div className="absolute top-40 right-[20%] w-24 h-24 rounded-full bg-primary/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-32 left-[30%] w-20 h-20 rounded-full bg-secondary/10 blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      
      {/* Subtle grid lines suggesting flat horizon */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 opacity-10"
        style={{
          background: 'linear-gradient(to top, hsl(var(--primary) / 0.3), transparent)',
        }}
      />
    </div>
  );
}
