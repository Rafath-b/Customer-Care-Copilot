import express, { Express } from 'express';
import cors from 'cors';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";

const app: Express = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// --- All AI Logic and Data is now on the Backend ---

type Agent = 'BILLING' | 'SAFETY' | 'LOST_FOUND' | 'GENERAL';

const KNOWLEDGE_BASE: Record<Agent, string[]> = {
  BILLING: [
    "Refunds for rides with significant detours are processed within 5-7 business days.",
    "Cancellation fees are applied if a user cancels 2 minutes after a driver has been assigned.",
    "Users can update their payment methods at any time in the 'Wallet' section of the app.",
    "Promotional codes must be applied before the ride is requested to be valid.",
    "A cleaning fee of up to $150 may be charged if a rider damages or soils a driver's vehicle.",
    "Trip fares are calculated based on a base fare, plus per-minute and per-mile rates that vary by city.",
    "If a payment method fails, the user's account will be placed on hold until the outstanding balance is paid.",
    "Tolls, surcharges, and airport fees are automatically added to the final fare.",
    "Users can request a fare review if they believe the route taken was inefficient."
  ],
  SAFETY: [
    "All safety incidents must be reported via the in-app Safety Center for official documentation.",
    "All drivers undergo a mandatory annual background check.",
    "In case of an emergency, users should always contact local authorities first by dialing 911.",
    "Our 'Share My Ride' feature allows users to share their live location with trusted contacts.",
    "If the driver shown in the app does not match the driver who arrives, the user should not get in the car and report the issue immediately.",
    "We have a zero-tolerance policy for drugs and alcohol for all drivers.",
    "Service animals are legally permitted in all vehicles, but pets are allowed at the driver's discretion.",
  ],
  LOST_FOUND: [
    "Users can contact their driver directly through the app for up to 24 hours after the ride ends to inquire about a lost item.",
    "If the driver is unresponsive after 24 hours, the user should file a lost item report with support.",
    "A $15 returned item fee is charged to the user to compensate the driver for their time.",
    "We are not liable for items lost in vehicles, but we will do our best to facilitate a return.",
    "Unclaimed items reported to our support center will be held for 30 days before being donated or disposed of.",
  ],
  GENERAL: [
    "Users can rate their driver and provide feedback at the end of each trip.",
    "The app's 'Scheduled Rides' feature allows booking a trip up to 30 days in advance.",
    "Our premium service offers newer vehicles and top-rated drivers.",
    "Ride receipts are automatically sent to the user's registered email address after each trip.",
    "The primary account holder must be 18 or older. Minors are not permitted to travel unaccompanied.",
    "Our loyalty program offers points for every dollar spent, which can be redeemed for ride credits.",
  ],
};

const createVocabulary = (knowledgeBase: Record<Agent, string[]>): string[] => {
  const allText = Object.values(knowledgeBase).flat().join(' ');
  const tokens = allText.toLowerCase().match(/\b\w+\b/g) || [];
  return [...new Set(tokens)];
};

const vocabulary = createVocabulary(KNOWLEDGE_BASE);
const vocabularyIndexMap = new Map(vocabulary.map((word, i) => [word, i]));

const textToVector = (text: string): number[] => {
  const vector = new Array(vocabulary.length).fill(0);
  const tokens = text.toLowerCase().match(/\b\w+\b/g) || [];
  tokens.forEach(token => {
    if (vocabularyIndexMap.has(token)) {
      vector[vocabularyIndexMap.get(token)!] += 1;
    }
  });
  return vector;
};

const VECTOR_DATABASE: Record<Agent, { text: string; vector: number[] }[]> = 
  Object.entries(KNOWLEDGE_BASE).reduce((acc, [agent, docs]) => {
    acc[agent as Agent] = docs.map(text => ({
      text,
      vector: textToVector(text)
    }));
    return acc;
  }, {} as Record<Agent, { text: string; vector: number[] }[]>);

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

const AGENT_SYSTEM_INSTRUCTIONS: Record<Agent, string> = {
  BILLING: 'You are an expert customer care agent for a ride-hailing app, specializing in billing. You must use the provided context from the knowledge base to answer the user\'s query. If the context is relevant, base your answer on it. Provide clear, empathetic, and concise answers for issues like incorrect charges, refund requests, and promotion problems. Always state the ride ID if provided. Suggest concrete next steps.',
  SAFETY: 'You are a highly sensitive and trained customer care agent for a ride-hailing app, specializing in safety. You must use the provided context from the knowledge base to answer the user\'s query. If the context is relevant, base your answer on it. Handle reports of accidents, driver conduct, or harassment with utmost seriousness and empathy. Provide clear instructions and resources for reporting the incident formally. Prioritize user safety.',
  LOST_FOUND: 'You are a helpful customer care agent for a ride-hailing app, specializing in lost & found items. You must use the provided context from the knowledge base to answer the user\'s query. If the context is relevant, base your answer on it. Guide users on how to contact their driver to retrieve a lost item. Explain the process clearly and manage expectations.',
  GENERAL: 'You are a friendly and knowledgeable general customer care agent for a ride-hailing app. You must use the provided context from the knowledge base to answer the user\'s query. If the context is relevant, base your answer on it. Handle general inquiries about app features, feedback, or any issue that doesn\'t fall into billing, safety, or lost & found categories.',
};


// Fix: Removed the 'parameters' property from function declarations as they don't take any arguments,
// adhering to the guideline that a Type.OBJECT schema cannot have empty properties.
const AGENT_TOOLS: { functionDeclarations: FunctionDeclaration[] }[] = [{
  functionDeclarations: [
    { name: 'selectBillingAgent', description: 'Selects the agent for billing issues, refunds, payments, and charges.' },
    { name: 'selectSafetyAgent', description: 'Selects the agent for safety concerns, accidents, or driver conduct.' },
    { name: 'selectLostAndFoundAgent', description: 'Selects the agent for items left behind in a vehicle.' },
    { name: 'selectGeneralInquiryAgent', description: 'Selects the agent for general questions or issues not covered by others.' },
  ]
}];

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const routeToAgent = async (query: string): Promise<Agent> => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on the following query, which agent should be selected? Query: "${query}"`,
      config: { tools: AGENT_TOOLS }
    });
    const functionCall = response.functionCalls?.[0];
    if (functionCall) {
      switch (functionCall.name) {
        case 'selectBillingAgent': return 'BILLING';
        case 'selectSafetyAgent': return 'SAFETY';
        case 'selectLostAndFoundAgent': return 'LOST_FOUND';
        default: return 'GENERAL';
      }
    }
    return 'GENERAL';
};

const retrieveContext = (agent: Agent, query: string): string[] => {
  const SIMILARITY_THRESHOLD = 0.2;
  const TOP_K = 3;

  const queryVector = textToVector(query);
  const agentKnowledge = VECTOR_DATABASE[agent];

  const scoredDocs = agentKnowledge.map(doc => ({
    text: doc.text,
    score: cosineSimilarity(queryVector, doc.vector)
  }));

  const sortedDocs = scoredDocs.sort((a, b) => b.score - a.score);
  
  return sortedDocs
    .filter(doc => doc.score > SIMILARITY_THRESHOLD)
    .slice(0, TOP_K)
    .map(doc => doc.text);
};

const getAgentResponse = async (agent: Agent, query: string, context: string) => {
    const augmentedQuery = `${context}\n\nUSER QUERY: ${query}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: augmentedQuery,
      config: { systemInstruction: AGENT_SYSTEM_INSTRUCTIONS[agent] },
    });
    return response.text;
};


// --- API Endpoint ---

app.post('/api/chat', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const startTime = Date.now();

        // 1. Route
        const selectedAgent = await routeToAgent(query);

        // 2. Retrieve
        const sources = retrieveContext(selectedAgent, query);

        // 3. Generate
        const context = sources.length > 0 ? `CONTEXT:\n- ${sources.join('\n- ')}` : '';
        const agentResponse = await getAgentResponse(selectedAgent, query, context);
        
        const latency = Date.now() - startTime;

        res.json({
            text: agentResponse,
            sources,
            agent: selectedAgent,
            latency,
        });

    } catch (error) {
        console.error('Error processing chat:', error);
        res.status(500).json({ error: 'Failed to process your request.' });
    }
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
