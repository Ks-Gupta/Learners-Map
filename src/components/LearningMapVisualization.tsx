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
    resources: Array<{ title: string; type: string; url?: string }>;
    subtopics: Array<{
      id: string;
      title: string;
      description: string;
      resources: Array<{ title: string; type: string; url?: string }>;
    }>;
  }>;
}

interface LearningMapVisualizationProps {
  data: LearningMapData;
}

const CustomNode = ({ data }: any) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card 
      className="p-4 min-w-[200px] max-w-[280px] cursor-pointer transition-all hover:shadow-lg hover:scale-105"
      onClick={() => setShowDetails(!showDetails)}
      style={{
        backgroundColor: data.level === 'root' ? 'hsl(var(--primary))' : 
                        data.level === 'main' ? 'hsl(var(--accent))' : 
                        'hsl(var(--card))',
        color: data.level === 'root' || data.level === 'main' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--card-foreground))',
        border: '2px solid',
        borderColor: data.level === 'root' ? 'hsl(var(--primary))' : 
                     data.level === 'main' ? 'hsl(var(--accent))' : 
                     'hsl(var(--border))',
      }}
    >
      <div className="font-semibold mb-1 text-sm">{data.label}</div>
      
      {showDetails && data.description && (
        <div className="mt-2 text-xs opacity-90 border-t pt-2" style={{ borderColor: 'currentColor' }}>
          <p className="mb-2">{data.description}</p>
          
          {data.resources && data.resources.length > 0 && (
            <div className="space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <Info className="w-3 h-3" />
                Resources:
              </div>
              {data.resources.map((resource: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs py-0 px-1">
                    {resource.type}
                  </Badge>
                  <span className="truncate">{resource.title}</span>
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

    // Root node
    newNodes.push({
      id: 'root',
      type: 'custom',
      position: { x: 400, y: 50 },
      data: {
        label: data.topic,
        description: data.description,
        level: 'root',
      },
    });

    // Calculate positions for main areas in a circular/radial layout
    const mainAreaCount = data.mainAreas.length;
    const angleStep = (2 * Math.PI) / mainAreaCount;
    const mainRadius = 300;

    data.mainAreas.forEach((area, areaIdx) => {
      const angle = areaIdx * angleStep - Math.PI / 2; // Start from top
      const x = 400 + mainRadius * Math.cos(angle);
      const y = 250 + mainRadius * Math.sin(angle);

      // Main area node
      newNodes.push({
        id: area.id,
        type: 'custom',
        position: { x, y },
        data: {
          label: area.title,
          description: area.description,
          resources: area.resources,
          level: 'main',
        },
      });

      newEdges.push({
        id: `root-${area.id}`,
        source: 'root',
        target: area.id,
        animated: true,
        style: { stroke: 'hsl(var(--primary))' },
      });

      // Subtopic nodes - position them around their parent
      const subtopicCount = area.subtopics.length;
      const subtopicAngleStep = Math.PI / (subtopicCount + 1);
      const subtopicRadius = 180;

      area.subtopics.forEach((subtopic, subIdx) => {
        const subAngle = angle + (subIdx - subtopicCount / 2) * subtopicAngleStep * 0.5;
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
            level: 'sub',
          },
        });

        newEdges.push({
          id: `${area.id}-${subtopic.id}`,
          source: area.id,
          target: subtopic.id,
          style: { stroke: 'hsl(var(--accent))' },
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
        <Panel position="bottom-left" className="bg-card p-3 rounded-lg shadow-md m-2 max-w-xs">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Click on any node to see details and learning resources. Drag to explore the map!
          </p>
        </Panel>
      </ReactFlow>
    </Card>
  );
};