import { Code, Server, Database, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";

const About = () => {
  const skills = [
    {
      icon: Server,
      title: "Backend Development",
      description: "Expert in PHP, Laravel, and Slim Framework for building robust server-side applications",
      technologies: ["PHP", "Laravel", "Slim Framework", "REST APIs"]
    },
    {
      icon: Database,
      title: "Database Management",
      description: "Proficient in MySQL database design, optimization, and management",
      technologies: ["MySQL", "Database Design", "Query Optimization", "Data Modeling"]
    },
    {
      icon: Code,
      title: "Frontend Development", 
      description: "Growing expertise in React and modern frontend technologies",
      technologies: ["React", "JavaScript", "HTML5", "Responsive Design"]
    },
    {
      icon: Palette,
      title: "UI/UX Design",
      description: "Strong foundation in CSS and Bootstrap for creating beautiful user interfaces",
      technologies: ["CSS3", "Bootstrap", "UI Design", "Cross-browser Compatibility"]
    }
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="text-gradient">Me</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              I'm a passionate full stack developer with a strong foundation in backend technologies 
              and a growing expertise in modern frontend frameworks. I enjoy building scalable web 
              applications and learning new technologies to stay current with industry trends.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skills.map((skill, index) => (
              <Card 
                key={skill.title}
                className="p-6 card-gradient border-border hover-lift group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-smooth">
                    <skill.icon className="h-8 w-8 text-primary" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {skill.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {skill.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {skill.technologies.map((tech) => (
                      <span 
                        key={tech}
                        className="px-3 py-1 bg-accent/50 text-accent-foreground rounded-full text-xs font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Card className="p-8 card-gradient border-border max-w-4xl mx-auto animate-scale-in">
              <h3 className="text-2xl font-semibold mb-4 text-foreground">
                My Development Philosophy
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                I believe in writing clean, maintainable code and following best practices. 
                My approach focuses on understanding business requirements, implementing scalable 
                solutions, and continuously learning new technologies. I'm particularly passionate 
                about backend architecture and enjoy the challenge of optimizing database performance 
                and API design.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;