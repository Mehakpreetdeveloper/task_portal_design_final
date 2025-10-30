import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

const Skills = () => {
  const skillCategories = [
    {
      title: "Backend Development",
      skills: [
        { name: "PHP", level: 90, description: "Advanced proficiency in modern PHP development" },
        { name: "Laravel", level: 85, description: "Extensive experience with Laravel framework" },
        { name: "Slim Framework", level: 80, description: "Solid experience building REST APIs" },
        { name: "MySQL", level: 85, description: "Database design and optimization expertise" }
      ]
    },
    {
      title: "Frontend Development", 
      skills: [
        { name: "CSS", level: 80, description: "Strong styling and layout capabilities" },
        { name: "Bootstrap", level: 85, description: "Proficient in responsive design" },
        { name: "React", level: 60, description: "Growing expertise in modern React development" },
        { name: "JavaScript", level: 70, description: "Solid foundation in vanilla JavaScript" }
      ]
    },
    {
      title: "Tools & Technologies",
      skills: [
        { name: "Git", level: 75, description: "Version control and collaboration" },
        { name: "REST APIs", level: 85, description: "API design and implementation" },
        { name: "Responsive Design", level: 80, description: "Mobile-first development approach" },
        { name: "Database Design", level: 85, description: "Efficient schema design and optimization" }
      ]
    }
  ];

  const getSkillColor = (level: number) => {
    if (level >= 80) return "bg-green-500";
    if (level >= 65) return "bg-blue-500";
    if (level >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <section id="skills" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Technical <span className="text-gradient">Skills</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              My technical expertise spans across backend development, database management, 
              and frontend technologies. I'm constantly learning and expanding my skill set 
              to stay current with industry best practices.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {skillCategories.map((category, categoryIndex) => (
              <Card 
                key={category.title}
                className="p-6 card-gradient border-border animate-fade-in"
                style={{ animationDelay: `${categoryIndex * 200}ms` }}
              >
                <h3 className="text-2xl font-semibold mb-6 text-foreground text-center">
                  {category.title}
                </h3>
                
                <div className="space-y-6">
                  {category.skills.map((skill, skillIndex) => (
                    <div 
                      key={skill.name}
                      className="animate-slide-in-left"
                      style={{ animationDelay: `${(categoryIndex * 200) + (skillIndex * 100)}ms` }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-foreground">{skill.name}</h4>
                        <span className="text-sm font-medium text-primary">{skill.level}%</span>
                      </div>
                      
                      <Progress 
                        value={skill.level} 
                        className="h-2 mb-2"
                      />
                      
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {skill.description}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Card className="p-8 card-gradient border-border max-w-4xl mx-auto animate-scale-in">
              <h3 className="text-2xl font-semibold mb-4 text-foreground">
                Continuous Learning
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Technology evolves rapidly, and I'm committed to staying current with the latest 
                trends and best practices. I regularly explore new frameworks, attend webinars, 
                and work on personal projects to expand my knowledge base.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {["Docker", "TypeScript", "Vue.js", "Node.js", "AWS", "GraphQL"].map((tech) => (
                  <span 
                    key={tech}
                    className="px-4 py-2 bg-accent/30 text-accent-foreground rounded-full text-sm font-medium border border-border"
                  >
                    Learning: {tech}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;