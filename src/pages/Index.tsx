import { useState } from "react";
import { LearningMapGenerator } from "@/components/LearningMapGenerator";
import { LearningMapVisualization } from "@/components/LearningMapVisualization";
import { Brain, Sparkles } from "lucide-react";

const Index = () => {
  const [learningMapData, setLearningMapData] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Learning Map Generator</h1>
              <p className="text-sm text-muted-foreground">Transform any topic into a visual learning journey</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <section className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-hero border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Learning</span>
          </div>
          
          <h2 className="text-4xl font-bold text-foreground">
            Master Any Subject with<br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Interactive Visual Roadmaps
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI analyzes your topic and creates a structured, hierarchical learning path with curated resources for each step.
          </p>
        </section>

        <div className="max-w-4xl mx-auto">
          <LearningMapGenerator onMapGenerated={setLearningMapData} />
        </div>

        {learningMapData && (
          <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-foreground">
                Your Learning Map: {learningMapData.topic}
              </h3>
              <p className="text-muted-foreground">{learningMapData.description}</p>
            </div>
            <LearningMapVisualization data={learningMapData} />
          </div>
        )}

        {!learningMapData && (
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 py-8">
              {[
                {
                  title: "Structured Learning",
                  description: "Break down complex topics into manageable, organized sections",
                  icon: "📚"
                },
                {
                  title: "Curated Resources",
                  description: "Get relevant articles, videos, and courses for each learning node",
                  icon: "🎯"
                },
                {
                  title: "Visual Exploration",
                  description: "Interact with your learning map, expand nodes, and discover connections",
                  icon: "🔍"
                }
              ].map((feature, idx) => (
                <div key={idx} className="p-6 bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>AI Learning Map Generator - Turn curiosity into structured knowledge</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;