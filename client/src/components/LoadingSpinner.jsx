export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
    </div>
  );
}
