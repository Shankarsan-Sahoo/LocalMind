import { CreateMLCEngine, type InitProgressCallback, MLCEngine, type ChatCompletionMessageParam, type ChatCompletionTool } from '@mlc-ai/web-llm';

export interface ToolCallResult {
  id: string;
  name: string;
  arguments: string;
}

class LLMService {
  private engine: MLCEngine | null = null;
  private currentModel: string | null = null;
  private abortController: AbortController | null = null;

  async initialize(modelId: string, onProgress: InitProgressCallback) {
    if (this.engine && this.currentModel === modelId) {
      return; 
    }

    try {
      if (this.engine) {
        await this.engine.unload();
      }
      this.engine = await CreateMLCEngine(modelId, { initProgressCallback: onProgress });
      this.currentModel = modelId;
    } catch (error) {
      console.error("Failed to initialize MLCEngine:", error);
      throw error;
    }
  }

  async *stream(
    messages: ChatCompletionMessageParam[], 
    systemPrompt?: string, 
    temperature = 0.7, 
    topP = 0.95, 
    maxTokens?: number,
    tools?: ChatCompletionTool[]
  ) {
    if (!this.engine) throw new Error("Engine not initialized");
    
    this.abortController = new AbortController();
    
    const formattedMessages = [...messages];
    const hasTools = tools && tools.length > 0;
    
    // WebLLM's Hermes-2-Pro throws an error if a custom system prompt is passed alongside tools,
    // because it injects its own highly specific XML system prompt for tool calling.
    if (systemPrompt && formattedMessages.length > 0 && formattedMessages[0].role !== 'system' && !hasTools) {
      formattedMessages.unshift({ role: 'system', content: systemPrompt });
    }

    const chunks = await this.engine.chat.completions.create({
      messages: formattedMessages,
      stream: true,
      temperature,
      top_p: topP,
      max_tokens: maxTokens,
      tools: hasTools ? tools : undefined
    });

    let activeToolCall: ToolCallResult | null = null;

    for await (const chunk of chunks) {
      if (this.abortController?.signal.aborted) {
        break;
      }
      
      const delta = chunk.choices[0]?.delta;
      
      if (delta?.tool_calls && delta.tool_calls.length > 0) {
        const tc = delta.tool_calls[0];
        if (tc.id && tc.function?.name) {
          activeToolCall = {
            id: tc.id,
            name: tc.function.name,
            arguments: tc.function.arguments || ''
          };
        } else if (activeToolCall && tc.function?.arguments) {
          activeToolCall.arguments += tc.function.arguments;
        }
      }

      if (delta?.content) {
        yield { type: 'content', content: delta.content };
      }
    }

    if (activeToolCall) {
      yield { type: 'tool_call', toolCall: activeToolCall };
    }
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async changeModel(modelId: string, onProgress: InitProgressCallback) {
    await this.initialize(modelId, onProgress);
  }
}

export const llmService = new LLMService();
