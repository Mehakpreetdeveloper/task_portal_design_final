import { ExternalLink, Github } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Import project images
import smartzmindsImg from "@/assets/project-business.jpg";
import easyPharamaImg from "@/assets/project-pharmacy.jpg";
import pharamavendsImg from "@/assets/project-pharma-ecommerce.jpg";
import weedyThingImg from "@/assets/project-ecommerce.jpg";
import emooseImg from "@/assets/project-app.jpg";
import primeApplianceImg from "@/assets/project-appliance.jpg";

const Projects = () => {
  const projects = [
    {
      title: "Easypharma",
      description: "University training project in Core PHP, a pharmacy store system to manage and check data from time to time with comprehensive inventory tracking.",
      image: easyPharamaImg,
      technologies: ["Core PHP", "MySQL", "CSS", "JavaScript"],
      status: "Training Project",
      type: "Academic"
    },
    {
      title: "Pharmavends",
      description: "Website in Laravel for pharmacies to connect with wholesale customers, buy on credit, check details, and contact them directly for streamlined B2B transactions.",
      image: pharamavendsImg,
      technologies: ["Laravel", "MySQL", "PHP", "Bootstrap"],
      status: "In Development",
      type: "Current Project"
    },
    {
      title: "Theweedything",
      description: "Canada/Thailand app in Laravel for users to find and compare weed products, view contact details, check ratings, locate nearest stores, and add business profiles.",
      image: weedyThingImg,
      technologies: ["Laravel", "MySQL", "PHP", "CSS"],
      status: "Completed",
      type: "E-commerce"
    },
    {
      title: "Emose",
      description: "German project in Core PHP for managing customer orders, parcels/packages, with DHL & Billbee integration for logistics automation.",
      image: emooseImg,
      technologies: ["Core PHP", "MySQL", "DHL API", "Billbee API"],
      status: "Completed",
      type: "Application"
    },
    {
      title: "Primeappliance",
      description: "Canadian app in Laravel providing appliance services, managing workers/managers, handling spare parts, and customer contacts with comprehensive service management.",
      image: primeApplianceImg,
      technologies: ["Laravel", "MySQL", "PHP", "JavaScript"],
      status: "In Development", 
      type: "Service Platform"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "In Development":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Training Project":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <section id="projects" className="py-20 bg-accent/5">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Featured <span className="text-gradient">Projects</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A showcase of my development work spanning various domains including healthcare, 
              e-commerce, and business solutions. Each project demonstrates different aspects 
              of my technical expertise and problem-solving approach.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <Card 
                key={project.title}
                className="overflow-hidden card-gradient border-border hover-lift group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-48 object-cover transition-smooth group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className={`${getStatusColor(project.status)} border`}>
                      {project.status}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-background/80 text-foreground">
                      {project.type}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-smooth">
                    {project.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {project.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.technologies.map((tech) => (
                      <Badge 
                        key={tech} 
                        variant="outline"
                        className="text-xs border-border bg-background/50"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 hover:bg-accent hover:text-accent-foreground transition-smooth"
                    >
                      <Github className="mr-2 h-4 w-4" />
                      Code
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Live Demo
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;