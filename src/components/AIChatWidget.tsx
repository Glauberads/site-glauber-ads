import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles, User, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatWhatsAppForLink } from '@/lib/validation';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou o assistente da Glauber Ads. Como está o seu fluxo de captação e vendas hoje?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isQualified, setIsQualified] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll para a última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const utms = {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
      };

      // Chama a Edge Function do Supabase
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          utms,
        },
      });

      if (error) {
        throw error;
      }

      if (data) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        if (data.isQualified) {
          setIsQualified(true);
        }
      }
    } catch (error) {
      console.error('Erro no chat:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Desculpe, estou com instabilidade na conexão. Podemos tentar novamente em instantes?',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    // Número padrão da Glauber Ads ou puxar das settings
    const number = "5511999999999"; 
    window.open(`https://wa.me/${number}?text=Olá! Estava conversando com o assistente virtual no site e gostaria de falar com um especialista.`, '_blank');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-5 z-50 flex h-[500px] max-h-[80vh] w-[350px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-background/95 shadow-2xl backdrop-blur-xl sm:right-8 sm:w-[380px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 bg-card/50 p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-none text-foreground">Especialista IA</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Glauber Ads</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={\`flex items-end gap-2 \${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}\`}
                  >
                    <div
                      className={\`flex h-8 w-8 shrink-0 items-center justify-center rounded-full \${
                        msg.role === 'user'
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-primary/10 text-primary'
                      }\`}
                    >
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div
                      className={\`max-w-[75%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed \${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-secondary/50 text-foreground rounded-bl-sm border border-border/50'
                      }\`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-end gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex max-w-[75%] rounded-2xl rounded-bl-sm border border-border/50 bg-secondary/50 px-4 py-3 text-[14px]">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Botões de Ação para Lead Qualificado */}
              {isQualified && !isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4"
                >
                  <p className="text-center text-xs font-medium text-primary">Parece que estamos alinhados! Qual o próximo passo?</p>
                  <Button onClick={handleWhatsAppClick} className="w-full gap-2 text-xs h-9">
                    Falar no WhatsApp
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border/50 bg-card/30 p-3">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 overflow-hidden rounded-full border border-border/50 bg-background pl-4 pr-1 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground h-11"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-muted-foreground">IA atuando como pré-vendedor.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-5 z-50 flex items-center justify-center gap-2 rounded-full bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95 sm:right-8"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
        
        {/* Tooltip Hover */}
        {!isOpen && (
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: 10, width: 0 }}
                className="overflow-hidden whitespace-nowrap pl-1 pr-2 text-sm font-medium"
              >
                Falar com IA
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.button>
    </>
  );
};
