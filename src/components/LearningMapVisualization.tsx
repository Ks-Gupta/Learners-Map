import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';
import { toast } from 'sonner';

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

interface LearningMapVisualizationProps {
  data: LearningMapData;
}

const CustomNode = ({ data }: any) => {
  const [showDetails, setShowDetails] = useState(false);

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'fundamental': return 'hsl(210 100% 45%)';
      case 'core-skill': return 'hsl(180 85% 45%)';
      case 'advanced': return 'hsl(280 70% 50%)';
      case 'tools': return 'hsl(30 90% 50%)';
      case 'practices': return 'hsl(140 70% 45%)';
      default: return 'hsl(var(--accent))';
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'essential': return { text: '🔴 Essential', color: 'hsl(0 84% 60%)' };
      case 'recommended': return { text: '🟡 Recommended', color: 'hsl(45 93% 47%)' };
      case 'optional': return { text: '🟢 Optional', color: 'hsl(142 76% 36%)' };
      default: return null;
    }
  };

  const mainColor = data.level === 'root' ? 'hsl(var(--primary))' : 
                    data.level === 'main' ? getCategoryColor(data.category) : 
                    'hsl(var(--card))';

  return (
    <Card 
      className="p-4 min-w-[220px] max-w-[300px] cursor-pointer transition-all hover:shadow-lg hover:scale-105"
      onClick={() => setShowDetails(!showDetails)}
      style={{
        backgroundColor: mainColor,
        color: data.level === 'root' || data.level === 'main' ? 'white' : 'hsl(var(--card-foreground))',
        border: '2px solid',
        borderColor: mainColor,
      }}
    >
      <div className="space-y-1">
        {data.category && data.level === 'main' && (
          <Badge 
            variant="outline" 
            className="text-xs mb-1"
            style={{ 
              borderColor: 'currentColor', 
              color: 'currentColor',
              backgroundColor: 'rgba(255,255,255,0.2)'
            }}
          >
            {data.category.replace('-', ' ')}
          </Badge>
        )}
        
        <div className="font-semibold text-sm leading-tight">{data.label}</div>
        
        {data.priority && getPriorityBadge(data.priority) && (
          <div className="text-xs font-medium mt-1">
            {getPriorityBadge(data.priority)?.text}
          </div>
        )}
      </div>
      
      {showDetails && data.description && (
        <div className="mt-3 text-xs border-t pt-2" style={{ 
          borderColor: data.level === 'root' || data.level === 'main' ? 'rgba(255,255,255,0.3)' : 'hsl(var(--border))',
          opacity: data.level === 'root' || data.level === 'main' ? 0.95 : 1
        }}>
          <p className="mb-2 leading-relaxed">{data.description}</p>
          
          {data.resources && data.resources.length > 0 && (
            <div className="space-y-1.5 mt-2">
              <div className="font-semibold flex items-center gap-1">
                <Info className="w-3 h-3" />
                Resources:
              </div>
              {data.resources.map((resource: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5 pl-1">
                  <Badge 
                    variant="outline" 
                    className="text-xs py-0 px-1.5"
                    style={{
                      borderColor: 'currentColor',
                      backgroundColor: data.level === 'root' || data.level === 'main' ? 'rgba(255,255,255,0.2)' : 'transparent'
                    }}
                  >
                    {resource.type}
                  </Badge>
                  <span className="truncate text-xs">{resource.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export const LearningMapVisualization = ({ data }: LearningMapVisualizationProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    if (!data) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Root node - centered
    newNodes.push({
      id: 'root',
      type: 'custom',
      position: { x: 500, y: 50 },
      data: {
        label: data.topic,
        description: data.description,
        level: 'root',
      },
    });

    // Calculate positions for main areas in a radial layout
    const mainAreaCount = data.mainAreas.length;
    const angleStep = (2 * Math.PI) / mainAreaCount;
    const mainRadius = 320;

    data.mainAreas.forEach((area, areaIdx) => {
      const angle = areaIdx * angleStep - Math.PI / 2; // Start from top
      const x = 500 + mainRadius * Math.cos(angle);
      const y = 280 + mainRadius * Math.sin(angle);

      // Main area node with category
      newNodes.push({
        id: area.id,
        type: 'custom',
        position: { x, y },
        data: {
          label: area.title,
          description: area.description,
          resources: area.resources,
          category: area.category,
          level: 'main',
        },
      });

      newEdges.push({
        id: `root-${area.id}`,
        source: 'root',
        target: area.id,
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      });

      // Subtopic nodes - position them around their parent in a fan pattern
      const subtopicCount = area.subtopics.length;
      const subtopicAngleStep = Math.PI / (subtopicCount + 1);
      const subtopicRadius = 200;

      area.subtopics.forEach((subtopic, subIdx) => {
        const subAngle = angle + (subIdx - subtopicCount / 2) * subtopicAngleStep * 0.6;
        const subX = x + subtopicRadius * Math.cos(subAngle);
        const subY = y + subtopicRadius * Math.sin(subAngle);

        newNodes.push({
          id: subtopic.id,
          type: 'custom',
          position: { x: subX, y: subY },
          data: {
            label: subtopic.title,
            description: subtopic.description,
            resources: subtopic.resources,
            priority: subtopic.priority,
            level: 'sub',
          },
        });

        // Color edge based on priority
        const edgeColor = subtopic.priority === 'essential' ? 'hsl(0 84% 60%)' :
                         subtopic.priority === 'recommended' ? 'hsl(45 93% 47%)' :
                         'hsl(142 76% 36%)';

        newEdges.push({
          id: `${area.id}-${subtopic.id}`,
          source: area.id,
          target: subtopic.id,
          style: { stroke: edgeColor, strokeWidth: subtopic.priority === 'essential' ? 2 : 1 },
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [data, setNodes, setEdges]);

  const handleExport = () => {
    const exportData = {
      topic: data.topic,
      description: data.description,
      nodes: nodes.map(n => ({ id: n.id, ...n.data })),
      structure: data.mainAreas,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.topic.replace(/\s+/g, '-').toLowerCase()}-learning-map.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Learning map exported successfully!');
  };

  return (
    <Card className="h-[600px] relative overflow-hidden shadow-lg border-border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right" className="bg-card p-2 rounded-lg shadow-md m-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </Panel>
        <Panel position="bottom-left" className="bg-card p-3 rounded-lg shadow-md m-2 max-w-sm space-y-2">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Click nodes for details and resources. Drag to explore!
          </p>
          <div className="flex gap-2 text-xs">
            <span className="font-semibold text-foreground">Priority:</span>
            <span>🔴 Essential</span>
            <span>🟡 Recommended</span>
            <span>🟢 Optional</span>
          </div>
        </Panel>
      </ReactFlow>
    </Card>
  );
};