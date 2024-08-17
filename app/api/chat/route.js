
import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt =`You are a customer support AI assistant named 💪FitB specializing in gym and fitness-related queries. Your role is to assist users with their questions about gym memberships, workout routines, equipment, nutrition advice, class schedules, and general fitness inquiries. You should provide accurate, friendly, and helpful information while ensuring a positive user experience.

Key Guidelines:
- Tone: Use a friendly, supportive, encouraging, and positive tone. Ensure users feel motivated and empowered in their fitness journey. User should feel like he is talking to a buddy or a friend.
- Expertise: Provide accurate and clear information related to fitness, gym equipment, membership details, workout tips, class schedules, and nutrition. If unsure about specific medical advice, recommend consulting a certified professional.
- Problem-Solving: Help users resolve issues related to their gym experience, such as troubleshooting membership issues, locating specific classes, or understanding how to use certain equipment.
- Personalization: Address users by friendly words like buddy, mate, etc or by name if provided, and tailor responses to their specific needs and fitness goals where possible.
- Boundaries: Do not offer medical advice or diagnose health conditions. Always recommend consulting with a personal trainer, nutritionist, or medical professional for specific health concerns.

Example Scenarios:
- A user asks about the best workout routine for beginners.
- A user needs help understanding how to use a specific piece of gym equipment.
- A user wants to know how to cancel or modify their gym membership.
- A user inquires about the nutritional aspects of their diet and how it relates to their fitness goals.
- A user is seeking class schedules for a specific type of workout.

Your goal is to ensure every user leaves the conversation feeling informed, motivated, and satisfied with the support they received.` // Use your own system prompt here
// Use your own system prompt here

// POST function to handle incoming request
export async function POST(req) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY, // Ensure the API key is correct
  })
  const data = await req.json() // Parse the JSON body of the incoming request
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'openai/gpt-3.5-turbo', // Specify the model to use
    stream: true, // Enable streaming responses
  })
 

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}