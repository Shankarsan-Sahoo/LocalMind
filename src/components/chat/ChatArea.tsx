import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUIStore } from '../../store/uiStore';
import { useFileSystemStore } from '../../store/fileSystemStore';
import { llmService, type ToolCallResult } from '../../services/llm';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { AlertCircle, DownloadCloud, Loader2, Cpu } from 'lucide-react';
import { prebuiltAppConfig, type ChatCompletionTool } from '@mlc-ai/web-llm';

const FILE_SYSTEM_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_workspace_files",
      description: "Lists all files in the user's connected workspace directory.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Reads the content of a file in the workspace.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path to the file to read" }
        },
        required: ["filePath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Writes content to a file in the workspace.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Path to the file to write to" },
          content: { type: "string", description: "Content to write" }
        },
        required: ["filePath", "content"]
      }
    }
  }
];

export default function ChatArea() {
  const { messages, activeConversationId, isGenerating, streamingMessage, addMessage, setGenerating, setStreamingMessage } = useChatStore();
  const { settings } = useSettingsStore();
  const { modelLoadProgress, setModelLoadProgress } = useUIStore();
  const fileSystem = useFileSystemStore();
  
  const [error, setError] = useState<string | null>(null);
  const [activeToolInfo, setActiveToolInfo] = useState<string | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const [isModelInitialized, setIsModelInitialized] = useState(false);

  useEffect(() => {
    setIsModelInitialized(false);
  }, [settings.model]);

  const handleLoadModel = async () => {
    setIsModelInitialized(true);
    try {
      setError(null);
      await llmService.initialize(settings.model, (progress) => {
        setModelLoadProgress(progress);
      });
    } catch (err: any) {
      console.error("Initialization Error:", err);
      setError(err.message || "Failed to initialize the AI model. Your device might not have enough memory.");
      setIsModelInitialized(false);
    }
  };

  useEffect(() => {
    virtuosoRef.current?.scrollToIndex({
      index: 'LAST',
      align: 'end',
      behavior: 'smooth'
    });
  }, [messages.length, streamingMessage, activeToolInfo]);

  const executeToolCall = async (toolCall: ToolCallResult): Promise<string> => {
    setActiveToolInfo(`Running tool: ${toolCall.name}...`);
    try {
      const args = JSON.parse(toolCall.arguments);
      if (toolCall.name === 'list_workspace_files') {
        const files = await fileSystem.listWorkspaceFiles();
        return JSON.stringify(files);
      } else if (toolCall.name === 'read_file') {
        const content = await fileSystem.readFile(args.filePath);
        return content || "File not found or unreadable.";
      } else if (toolCall.name === 'write_file') {
        const success = await fileSystem.writeFile(args.filePath, args.content);
        return success ? "Successfully wrote to file." : "Failed to write to file or permission denied.";
      }
      return "Unknown tool.";
    } catch (err: any) {
      return `Error executing tool: ${err.message}`;
    } finally {
      setActiveToolInfo(null);
    }
  };

  const generateResponse = async () => {
    if (!activeConversationId) return;
    
    setGenerating(true);
    setStreamingMessage('');
    setError(null);
    setActiveToolInfo(null);

    try {
      let isFinished = false;
      
      while (!isFinished && useChatStore.getState().isGenerating) {
        // Prepare context
        const allMsgs = useChatStore.getState().messages;
        const contextMessages = allMsgs.slice(-15).map(m => {
          const msg: any = { role: m.role, content: m.content || '' };
          if (m.tool_calls) msg.tool_calls = m.tool_calls;
          if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
          return msg;
        });

        const supportsTools = settings.model.includes('Hermes');
        const tools = (fileSystem.workspaceHandle && supportsTools) ? FILE_SYSTEM_TOOLS : undefined;

        if (tools) {
          contextMessages.unshift({
            role: 'user',
            content: "[SYSTEM NOTIFICATION]: I have connected a local folder. You NOW have access to my local file system using your tools. If I ask you to read, write, list files, or ask if you have access, you MUST use your tools to accomplish the task."
          });
        }

        let fullResponse = '';
        let toolCallRes: ToolCallResult | null = null;
        
        const generator = llmService.stream(
          contextMessages, 
          settings.systemPrompt,
          settings.temperature,
          settings.topP,
          settings.maxTokens,
          tools
        );

        for await (const chunk of generator) {
          if (chunk.type === 'content') {
            fullResponse += chunk.content;
            setStreamingMessage(fullResponse);
          } else if (chunk.type === 'tool_call') {
            toolCallRes = chunk.toolCall as ToolCallResult;
          }
        }

        if (toolCallRes) {
          // Add assistant message with tool call
          await addMessage({
            conversationId: activeConversationId,
            role: 'assistant',
            content: fullResponse,
            tool_calls: [{
              id: toolCallRes.id,
              type: 'function',
              function: { name: toolCallRes.name, arguments: toolCallRes.arguments }
            }]
          });

          // Execute tool
          const toolResult = await executeToolCall(toolCallRes);
          
          // Add tool result message
          await addMessage({
            conversationId: activeConversationId,
            role: 'tool',
            content: toolResult,
            tool_call_id: toolCallRes.id
          });
          
          // Loop repeats to send tool result to LLM
        } else {
          // Finished generation normally
          if (fullResponse) {
            await addMessage({
              conversationId: activeConversationId,
              role: 'assistant',
              content: fullResponse
            });
          }
          isFinished = true;
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
         setError(err.message || "An error occurred during generation.");
      }
    } finally {
      setGenerating(false);
      setStreamingMessage('');
      setActiveToolInfo(null);
    }
  };

  const handleSend = async (content: string) => {
    if (!activeConversationId) return;
    await addMessage({
      conversationId: activeConversationId,
      role: 'user',
      content
    });
    await generateResponse();
  };

  const handleStop = () => {
    llmService.abort();
    setGenerating(false);
    if (streamingMessage) {
      addMessage({
        conversationId: activeConversationId!,
        role: 'assistant',
        content: streamingMessage
      });
      setStreamingMessage('');
    }
    setActiveToolInfo(null);
  };

  const isModelLoading = modelLoadProgress && modelLoadProgress.progress < 1;
  const visibleMessages = messages.filter(m => m.role !== 'tool' && !(m.role === 'assistant' && m.tool_calls && !m.content));

  const activeModelConfig = prebuiltAppConfig.model_list.find(m => m.model_id === settings.model);
  const totalMB = activeModelConfig?.vram_required_MB || 0;
  const downloadedMB = totalMB * (modelLoadProgress?.progress || 0);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <div className="flex items-center justify-center md:justify-end px-4 py-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shrink-0 h-12 md:h-14">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full shadow-inner">
          <Cpu className="w-3.5 h-3.5" />
          <span>{settings.model}</span>
        </div>
      </div>

      {isModelLoading && (
        <div className="absolute top-14 left-0 right-0 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-900/50 p-3 flex flex-col items-center justify-center gap-2 z-10 text-sm">
          <div className="flex flex-col sm:flex-row w-full max-w-3xl items-center gap-3">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading {settings.model}</span>
            </div>
            <div className="flex-1 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 relative">
              <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${modelLoadProgress.progress * 100}%` }} />
            </div>
            <div className="text-blue-700 dark:text-blue-300 font-mono shrink-0 text-xs font-semibold">
              {totalMB > 0 ? (
                `${Math.round(downloadedMB)} MB / ${Math.round(totalMB)} MB`
              ) : (
                `${Math.round(modelLoadProgress.progress * 100)}%`
              )}
            </div>
          </div>
          {modelLoadProgress.text && (
            <div className="text-[11px] text-blue-600/70 dark:text-blue-300/70 font-mono truncate max-w-3xl w-full text-center mt-1">
              {modelLoadProgress.text}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-red-100 dark:bg-red-900/80 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 max-w-lg w-full">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{error}</div>
          <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {!isModelInitialized ? (
          <div className="h-full flex items-center justify-center p-8 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="text-center max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700">
              <Cpu className="w-16 h-16 mx-auto mb-6 text-blue-500 drop-shadow-md" />
              <h2 className="text-2xl font-bold mb-3">AI is Standing By</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                You have selected <strong className="text-gray-700 dark:text-gray-300">{settings.model}</strong>. Click below to load it into memory. If it hasn't been downloaded yet, this will begin the download.
              </p>
              <button 
                onClick={handleLoadModel}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98]"
              >
                Load Model
              </button>
            </div>
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 p-8">
            <div className="text-center">
              <DownloadCloud className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No messages yet.</p>
              <p className="text-sm mt-2 max-w-md opacity-80">
                Type a message below to start chatting with {settings.model}. The model runs completely on your device.
              </p>
            </div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={visibleMessages}
            className="h-full scroll-smooth"
            itemContent={(_, message) => (
              <MessageBubble key={message.id} message={message} />
            )}
            components={{
              Footer: () => (
                <>
                  {streamingMessage && (
                    <MessageBubble 
                      message={{ id: 'stream', conversationId: activeConversationId!, role: 'assistant', content: streamingMessage, createdAt: Date.now() }} 
                      isStreaming 
                    />
                  )}
                  {activeToolInfo && (
                    <div className="py-2 px-4 max-w-3xl mx-auto flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                       <Loader2 className="w-4 h-4 animate-spin" />
                       {activeToolInfo}
                    </div>
                  )}
                  <div className="h-4" />
                </>
              )
            }}
          />
        )}
      </div>

      <div className="pt-2 pb-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-gray-900 dark:via-gray-900">
        {fileSystem.workspaceHandle && !settings.model.includes('Hermes') && (
          <div className="max-w-3xl mx-auto mb-2 px-4 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
            ⚠️ Workspace is connected, but <b>{settings.model}</b> does not support tool calling. Please select a <b>Hermes</b> model in Settings.
          </div>
        )}
        <ChatInput 
          onSend={handleSend}
          onStop={handleStop}
          isGenerating={isGenerating}
          disabled={!isModelInitialized || (isModelLoading as boolean)}
        />
      </div>
    </div>
  );
}
