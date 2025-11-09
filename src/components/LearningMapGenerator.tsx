import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LearningMapGeneratorProps {
  onMapGenerated: (data: any) => void;
}

export const LearningMapGenerator = ({ onMapGenerated }: LearningMapGeneratorProps) => {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic to explore");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-learning-map', {
        body: { topic: topic.trim(), level }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (!data) {
        throw new Error("No data received from the function");
      }

      console.log('Received learning map data:', data);
      onMapGenerated(data);
      toast.success("Learning map generated successfully!");
    } catch (error: any) {
      console.error('Error generating learning map:', error);
      toast.error(error.message || "Failed to generate learning map");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border shadow-md">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Generate Learning Map</h2>
        </div>
        
        <p className="text-muted-foreground">
          Enter any topic and we'll create an interactive visual roadmap to guide your learning journey.
        </p>

        <div className="space-y-3">
          <Input
            placeholder="e.g., Web Development, Gardening, Photography..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
            className="text-base"
            disabled={isLoading}
          />

          <div className="flex gap-3">
            <Select value={level} onValueChange={setLevel} disabled={isLoading}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !topic.trim()}
              className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Learning Map'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};