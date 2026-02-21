"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Trash2,
  Lightbulb,
} from "lucide-react";

interface CourseChatProps {
  courseId: Id<"courses">;
  courseTitle: string;
  lessonTitle?: string;
  lessonContent?: string;
}

export function CourseChat({
  courseId,
  courseTitle,
  lessonTitle,
  lessonContent,
}: CourseChatProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatHistory = useQuery(
    api.chat.getHistory,
    user?.id ? { userId: user.id, courseId } : "skip"
  );
  const saveMessage = useMutation(api.chat.saveMessage);
  const clearHistory = useMutation(api.chat.clearHistory);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const suggestedQuestions = [
    "Explain this concept in simpler terms",
    "Give me a real-world example",
    "What are the key takeaways?",
    "Quiz me on this topic",
  ];

  const handleSend = async (text?: string) => {
    const msgText = text || message.trim();
    if (!msgText || !user || isLoading) return;

    setMessage("");
    setIsLoading(true);

    // Save user message
    await saveMessage({
      userId: user.id,
      courseId,
      lessonId: undefined,
      role: "user",
      content: msgText,
    });

    try {
      const res = await fetch("/api/course-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgText,
          courseTitle,
          lessonTitle,
          lessonContent,
          chatHistory: (chatHistory || []).slice(-12).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      // Save assistant response
      await saveMessage({
        userId: user.id,
        courseId,
        lessonId: undefined,
        role: "assistant",
        content: data.response || "Sorry, I couldn't process that. Please try again.",
      });
    } catch {
      await saveMessage({
        userId: user.id,
        courseId,
        lessonId: undefined,
        role: "assistant",
        content: "I'm having trouble connecting. Please try again in a moment.",
      });
    }

    setIsLoading(false);
  };

  const handleClear = async () => {
    if (!user) return;
    await clearHistory({ userId: user.id, courseId });
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-charcoal text-gold shadow-lg hover:bg-charcoal/90 transition-all hover:scale-105 flex items-center justify-center"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[560px] flex flex-col bg-[var(--card)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-charcoal text-cream">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <div>
                <p className="text-sm font-semibold">AI Assistant</p>
                <p className="text-[10px] text-cream/60 truncate max-w-[200px]">
                  {lessonTitle || courseTitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {chatHistory && chatHistory.length > 0 && (
                <button
                  onClick={handleClear}
                  className="p-1.5 rounded-md hover:bg-[var(--card)]/10 text-cream/60 hover:text-cream transition-colors"
                  title="Clear chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-[var(--card)]/10 text-cream/60 hover:text-cream transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[380px] min-h-[200px]">
            {(!chatHistory || chatHistory.length === 0) && !isLoading ? (
              <div className="py-4">
                <div className="text-center mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-5 h-5 text-gold" />
                  </div>
                  <p className="text-xs text-warm-gray">
                    Ask me anything about this course!
                  </p>
                </div>
                <div className="space-y-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg border border-dashed border-[var(--border)] hover:border-gold hover:bg-gold/5 transition-colors"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                      <span className="text-xs text-charcoal">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory?.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-charcoal text-cream rounded-br-sm"
                        : "bg-cream-dark text-charcoal rounded-bl-sm"
                    }`}
                  >
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                        {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                          j % 2 === 1 ? (
                            <strong key={j}>{part}</strong>
                          ) : (
                            part
                          )
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-cream-dark rounded-xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-warm-gray rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-warm-gray rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-warm-gray rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about this lesson..."
                className="flex-1 h-9 px-3 rounded-lg border border-[var(--border)] bg-cream text-sm text-charcoal placeholder:text-warm-gray-light focus:outline-none focus:ring-1 focus:ring-gold/50"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!message.trim() || isLoading}
                className="h-9 w-9 rounded-lg bg-charcoal text-gold flex items-center justify-center hover:bg-charcoal/90 disabled:opacity-40 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
