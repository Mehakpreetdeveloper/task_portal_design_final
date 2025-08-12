import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold mb-4 text-foreground">404</h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm md:text-base"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
