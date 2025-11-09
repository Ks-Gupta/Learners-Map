import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, level } = await req.json();
    console.log('Generating learning map for:', topic, 'Level:', level);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert educational curriculum designer. Create a comprehensive learning map for the given topic.
    
The learning map should be structured as a hierarchical tree with:
- A main topic node
- 3-5 major learning areas (main branches)
- 2-4 subtopics for each main area
- For each node, include a brief description and 1-2 learning resources

Adjust the complexity based on the learning level: ${level || 'beginner'}

Return the data in a structured format that can be visualized as a node graph.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a learning map for: ${topic}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_learning_map",
              description: "Generate a structured learning map with hierarchical topics",
              parameters: {
                type: "object",
                properties: {
                  topic: {
                    type: "string",
                    description: "The main topic title"
                  },
                  description: {
                    type: "string",
                    description: "Brief overview of the learning journey"
                  },
                  mainAreas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        resources: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              type: { type: "string", enum: ["article", "video", "book", "course"] },
                              url: { type: "string" }
                            },
                            required: ["title", "type"]
                          }
                        },
                        subtopics: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              title: { type: "string" },
                              description: { type: "string" },
                              resources: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    title: { type: "string" },
                                    type: { type: "string", enum: ["article", "video", "book", "course"] },
                                    url: { type: "string" }
                                  },
                                  required: ["title", "type"]
                                }
                              }
                            },
                            required: ["id", "title", "description", "resources"]
                          }
                        }
                      },
                      required: ["id", "title", "description", "resources", "subtopics"]
                    }
                  }
                },
                required: ["topic", "description", "mainAreas"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_learning_map" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const learningMap = JSON.parse(toolCall.function.arguments);
    console.log('Generated learning map:', JSON.stringify(learningMap, null, 2));

    return new Response(
      JSON.stringify(learningMap),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in generate-learning-map function:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});