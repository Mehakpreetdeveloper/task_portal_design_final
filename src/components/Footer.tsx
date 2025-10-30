import { Github, Linkedin, Mail, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const socialLinks = [
    { 
      icon: Github, 
      href: "https://github.com", 
      label: "GitHub" 
    },
    { 
      icon: Linkedin, 
      href: "https://linkedin.com", 
      label: "LinkedIn" 
    },
    { 
      icon: Mail, 
      href: "mailto:john.developer@email.com", 
      label: "Email" 
    }
  ];

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Left section */}
            <div className="text-center md:text-left mb-8 md:mb-0">
              <h3 className="text-2xl font-bold text-gradient mb-2">
                John Developer
              </h3>
              <p className="text-muted-foreground">
                Full Stack Developer passionate about building scalable web applications
              </p>
            </div>
            
            {/* Right section */}
            <div className="flex flex-col items-center md:items-end">
              <div className="flex space-x-4 mb-4">
                {socialLinks.map((social) => (
                  <Button
                    key={social.label}
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full hover:bg-accent hover:text-accent-foreground hover-lift"
                    asChild
                  >
                    <a 
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  </Button>
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={scrollToTop}
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                <ArrowUp className="mr-2 h-4 w-4" />
                Back to Top
              </Button>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-muted-foreground text-sm">
              © {currentYear} John Developer. Built with React, TypeScript, and Tailwind CSS.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;