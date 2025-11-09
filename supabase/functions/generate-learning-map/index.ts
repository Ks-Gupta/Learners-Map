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

    const systemPrompt = `You are an expert curriculum designer specializing in technology roadmaps, inspired by roadmap.sh's comprehensive approach.

Create a detailed, professional learning roadmap that follows these principles:

**Structure Requirements:**
- Main topic with clear career/learning objective
- 5-7 major learning areas (core pillars of the domain)
- 3-5 subtopics per area, representing key skills/concepts
- Each node should have practical, industry-relevant descriptions

**Content Guidelines:**
- Use industry-standard terminology and technologies
- Include both foundational concepts and modern practices
- Provide clear learning progression (what to learn first)
- Mention specific tools, frameworks, and technologies by name
- Resources should be authoritative (MDN, official docs, popular courses)

**Learning Level Adjustments (${level || 'beginner'}):**
- Beginner: Focus on fundamentals, basic concepts, getting started guides
- Intermediate: Include frameworks, best practices, real-world applications
- Advanced: Cover architecture, optimization, advanced patterns, system design

**Style:**
- Professional and comprehensive like roadmap.sh
- Clear prerequisite relationships
- Practical, career-focused content
- Modern, up-to-date technologies

Return structured data optimized for node graph visualization.`;

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
                    description: "5-7 major learning areas representing core pillars of the domain",
                    minItems: 5,
                    maxItems: 7,
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { 
                          type: "string",
                          description: "Clear, professional title using industry terms"
                        },
                        description: { 
                          type: "string",
                          description: "Comprehensive explanation of why this area matters and what you'll achieve"
                        },
                        category: {
                          type: "string",
                          enum: ["fundamental", "core-skill", "advanced", "tools", "practices"],
                          description: "Classification of this learning area"
                        },
                        resources: {
                          type: "array",
                          minItems: 2,
                          maxItems: 3,
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              type: { type: "string", enum: ["article", "video", "book", "course", "documentation"] },
                              url: { type: "string" }
                            },
                            required: ["title", "type"]
                          }
                        },
                        subtopics: {
                          type: "array",
                          description: "3-5 specific skills/concepts within this area",
                          minItems: 3,
                          maxItems: 5,
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              title: { 
                                type: "string",
                                description: "Specific technology, concept, or skill name"
                              },
                              description: { 
                                type: "string",
                                description: "What this is, why it's important, and how it fits in the learning path"
                              },
                              priority: {
                                type: "string",
                                enum: ["essential", "recommended", "optional"],
                                description: "How critical this subtopic is to master"
                              },
                              resources: {
                                type: "array",
                                minItems: 1,
                                maxItems: 2,
                                items: {
                                  type: "object",
                                  properties: {
                                    title: { type: "string" },
                                    type: { type: "string", enum: ["article", "video", "book", "course", "documentation"] },
                                    url: { type: "string" }
                                  },
                                  required: ["title", "type"]
                                }
                              }
                            },
                            required: ["id", "title", "description", "priority", "resources"]
                          }
                        }
                      },
                      required: ["id", "title", "description", "category", "resources", "subtopics"]
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