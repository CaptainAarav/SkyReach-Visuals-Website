export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative">
        <div className="h-10 w-10 border-2 border-accent/10 border-t-accent rounded-full animate-spin" />
        <div className="absolute inset-0 h-10 w-10 border-2 border-transparent border-b-red/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        <div className="absolute inset-1 h-8 w-8 rounded-full bg-accent/5 blur-sm animate-pulse-glow" />
      </div>
    </div>
  );
}
