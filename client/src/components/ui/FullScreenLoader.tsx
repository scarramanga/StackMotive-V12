interface FullScreenLoaderProps {
  message: string;
}

export function FullScreenLoader({ message }: FullScreenLoaderProps) {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="text-xl text-muted-foreground">{message}</p>
      </div>
    </div>
  );
} 