import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Respostas mock do chatbot
const getMockResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("agendar") || lowerMessage.includes("consulta") || lowerMessage.includes("marcar")) {
    return "Ótimo! Para agendar sua consulta, preciso de algumas informações. Qual é o seu nome completo? 📅";
  }
  
  if (lowerMessage.includes("horário") || lowerMessage.includes("horarios") || lowerMessage.includes("funciona")) {
    return "Nossa clínica funciona de segunda a sexta, das 8h às 18h, e aos sábados das 8h às 12h. ⏰";
  }
  
  if (lowerMessage.includes("serviço") || lowerMessage.includes("serviços") || lowerMessage.includes("oferecem")) {
    return "Oferecemos diversos serviços: Consulta Geral, Exame de Pele, Eletrocardiograma, entre outros. Qual serviço você gostaria de saber mais? 🏥";
  }
  
  if (lowerMessage.includes("preço") || lowerMessage.includes("valor") || lowerMessage.includes("custo")) {
    return "Os valores variam conforme o serviço. A consulta geral custa R$ 150,00, por exemplo. Posso verificar o valor de algum serviço específico? 💰";
  }
  
  if (lowerMessage.includes("cancelar") || lowerMessage.includes("desmarcar")) {
    return "Para cancelar um agendamento, preciso do seu nome completo e a data da consulta. Pode me informar? 📋";
  }
  
  if (lowerMessage.includes("obrigado") || lowerMessage.includes("obrigada") || lowerMessage.includes("valeu")) {
    return "Por nada! Fico feliz em ajudar. Se precisar de mais alguma coisa, estou aqui! 😊";
  }
  
  return "Entendi! Como posso ajudar você hoje? Posso auxiliar com agendamentos, informações sobre serviços, horários de funcionamento e muito mais. 😊";
};

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! 👋 Sou a Clara, assistente virtual da FluxAI. Como posso ajudar você hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setIsLoading(true);

    // Simular delay de resposta
    await new Promise(resolve => setTimeout(resolve, 800));

    const assistantMessage: Message = {
      role: "assistant",
      content: getMockResponse(userInput),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Janela do Chat */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
          <div className="bg-primary text-primary-foreground p-4 rounded-t-lg">
            <h3 className="font-semibold text-lg">Clara - Assistente Virtual</h3>
            <p className="text-xs opacity-90">FluxAI (Modo Demo)</p>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
