import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface LearningMapData {
  topic: string;
  description: string;
  mainAreas: Array<{
    id: string;
    title: string;
    description: string;
    category?: string;
    resources: Array<{ title: string; type: string; url?: string }>;
    subtopics: Array<{
      id: string;
      title: string;
      description: string;
      priority?: string;
      resources: Array<{ title: string; type: string; url?: string }>;
    }>;
  }>;
}

interface LearningMapCardsProps {
  data: LearningMapData;
}

export const LearningMapCards = ({ data }: LearningMapCardsProps) => {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());

  const toggleArea = (id: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAreas(newExpanded);
  };

  const toggleSubtopic = (id: string) => {
    const newExpanded = new Set(expandedSubtopics);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSubtopics(newExpanded);
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'fundamental': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'core-skill': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
      case 'advanced': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'tools': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'practices': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-accent/10 text-accent-foreground border-accent/20';
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'essential': return { text: 'Essential', variant: 'destructive' as const, icon: '🔴' };
      case 'recommended': return { text: 'Recommended', variant: 'default' as const, icon: '🟡' };
      case 'optional': return { text: 'Optional', variant: 'secondary' as const, icon: '🟢' };
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-hero">
        <CardHeader>
          <CardTitle className="text-3xl">{data.topic}</CardTitle>
          <CardDescription className="text-base">{data.description}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {data.mainAreas.map((area) => (
          <Card 
            key={area.id} 
            className="border-border hover:shadow-elegant transition-all duration-300 overflow-hidden"
          >
            <CardHeader className="cursor-pointer" onClick={() => toggleArea(area.id)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-xl">{area.title}</CardTitle>
                    {area.category && (
                      <Badge className={getCategoryColor(area.category)}>
                        {area.category.replace('-', ' ')}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{area.description}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0">
                  {expandedAreas.has(area.id) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </CardHeader>

            {expandedAreas.has(area.id) && (
              <CardContent className="space-y-4 animate-accordion-down">
                {area.resources.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Resources
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {area.resources.map((resource, idx) => (
                        <Badge key={idx} variant="outline" className="gap-1">
                          {resource.type}
                          {resource.url && <ExternalLink className="w-3 h-3" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {area.subtopics.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Subtopics ({area.subtopics.length})</h4>
                    <div className="space-y-2">
                      {area.subtopics.map((subtopic) => {
                        const priority = getPriorityBadge(subtopic.priority);
                        return (
                          <Card 
                            key={subtopic.id} 
                            className="border-border/50 bg-card/50 hover:bg-card transition-colors"
                          >
                            <CardHeader 
                              className="p-4 cursor-pointer"
                              onClick={() => toggleSubtopic(subtopic.id)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="font-semibold text-sm">{subtopic.title}</h5>
                                    {priority && (
                                      <Badge variant={priority.variant} className="text-xs">
                                        {priority.icon} {priority.text}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{subtopic.description}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                  {expandedSubtopics.has(subtopic.id) ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </CardHeader>

                            {expandedSubtopics.has(subtopic.id) && subtopic.resources.length > 0 && (
                              <CardContent className="p-4 pt-0 animate-accordion-down">
                                <div className="space-y-2">
                                  <h6 className="text-xs font-semibold flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    Learning Resources
                                  </h6>
                                  <div className="flex flex-wrap gap-1.5">
                                    {subtopic.resources.map((resource, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs gap-1">
                                        {resource.type}
                                        {resource.url && <ExternalLink className="w-2 h-2" />}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
