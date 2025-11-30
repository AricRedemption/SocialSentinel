import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";

export async function POST(req: NextRequest) {
    try {
        const { messages, provider, apiKey, baseUrl, model, context } =
            await req.json();

        if (!apiKey) {
            return new NextResponse("Missing API Key", { status: 400 });
        }

        const systemPrompt = `You are an intelligent assistant analyzing Amazon product reviews.
User has provided the following context from the reviews:
${context}

Please answer the user's question based on this context. If the answer is not in the context, use your general knowledge but mention that it's not from the specific data.
Keep answers concise and helpful. Use Chinese language.`;

        if (provider === "claude") {
            const anthropic = new Anthropic({
                apiKey: apiKey,
                baseURL: baseUrl || undefined, // Anthropic SDK uses 'baseURL', not 'baseUrl'
            });

            const stream = await anthropic.messages.create({
                model: model || "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                messages: messages.map((m: any) => ({
                    role: m.role,
                    content: m.content,
                })),
                system: systemPrompt,
                stream: true,
            });

            const encoder = new TextEncoder();
            const readable = new ReadableStream({
                async start(controller) {
                    for await (const chunk of stream) {
                        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                            controller.enqueue(encoder.encode(chunk.delta.text));
                        }
                    }
                    controller.close();
                },
            });

            return new NextResponse(readable, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                },
            });
        } else {
            // OpenAI & DeepSeek (compatible)
            const openai = new OpenAI({
                apiKey: apiKey,
                baseURL: baseUrl,
                dangerouslyAllowBrowser: true, // We are in edge runtime, but sometimes this flag is needed if not strictly node
            });

            const response = await openai.chat.completions.create({
                model: model || "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages,
                ],
                stream: true,
            });

            const encoder = new TextEncoder();
            const readable = new ReadableStream({
                async start(controller) {
                    for await (const chunk of response) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            controller.enqueue(encoder.encode(content));
                        }
                    }
                    controller.close();
                },
            });

            return new NextResponse(readable, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                },
            });
        }
    } catch (error: any) {
        console.error("API Error:", error);
        return new NextResponse(`Error: ${error.message}`, { status: 500 });
    }
}
