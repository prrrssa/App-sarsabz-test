import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { getThisMonthRange } from '../utils/dateUtils';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { TOMAN_CURRENCY_CODE, AssistantIcon } from '../constants';
import { ChatMessage } from '../types';

const AssistantPage: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    transactions,
    customers,
    getCustomerTomanVolume,
    ornamentalGoldItems,
    getCurrencyById,
  } = useData();
  
  // Initialize Chat
  useEffect(() => {
    const initChat = async () => {
        setIsLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are a helpful business analyst and management consultant for a currency exchange shop in Iran called 'صرافی سبز'.
                    Your name is "سبزآسا".
                    Analyze the provided data and give clear, concise, and actionable insights in Persian.
                    Use formatting like headers (with ##), lists (with *), and bold text (with **) to make your response readable.
                    Do not start your response by introducing yourself every time. Only do it for the very first message.
                    Keep your answers helpful and directly related to the user's question and the data provided.`
                }
            });
            setChat(newChat);
            setConversation([{
                role: 'model',
                text: 'سلام! من سبزآسا، دستیار هوشمند شما هستم. چطور می‌توانم در مدیریت بهتر صرافی به شما کمک کنم؟ می‌توانید یکی از گزینه‌های زیر را انتخاب کنید یا سوال خود را تایپ کنید.'
            }]);
        } catch (err) {
            console.error("Failed to initialize AI Chat:", err);
            setError("خطا در راه‌اندازی دستیار هوشمند.");
        } finally {
            setIsLoading(false);
        }
    };
    initChat();
  }, []);

  // Scroll to bottom effect
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);


  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading || !chat) return;

    setIsLoading(true);
    setError('');

    const newUserMessage: ChatMessage = { role: 'user', text: messageText };
    setConversation(prev => [...prev, newUserMessage]);
    setUserInput('');

    try {
        let dataSummary = '## Key Business Data:\n';

        // Monthly Profit Data
        const thisMonth = getThisMonthRange();
        const monthlyTransactions = transactions.filter(t => new Date(t.date) >= thisMonth.start && new Date(t.date) <= thisMonth.end);
        
        let totalCommission = monthlyTransactions.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);
        let totalWage = monthlyTransactions.reduce((sum, t) => sum + (t.wageAmount || 0), 0);
        let goldProfit = ornamentalGoldItems
          .filter(item => item.status === 'sold' && item.soldAt && new Date(item.soldAt) >= thisMonth.start && new Date(item.soldAt) <= thisMonth.end)
          .reduce((sum, item) => {
            const saleTx = transactions.find(t => t.id === item.soldTransactionId);
            return saleTx && item.costPrice ? sum + (saleTx.sourceAmount - (item.costPrice + (item.purchaseWageAmount || 0))) : sum;
          }, 0);
        dataSummary += `*   Total Profit (This Month): ${formatCurrency(totalCommission + totalWage + goldProfit, TOMAN_CURRENCY_CODE)} Toman\n`;

        // Top Customers Data
        const customerVolumes = customers.map(c => ({
            name: c.name,
            volume: getCustomerTomanVolume(c.id),
        })).sort((a, b) => b.volume - a.volume).slice(0, 3);
        dataSummary += `*   Top 3 Customers (by Toman Volume): ${customerVolumes.map(c => `${c.name} (${formatCurrency(c.volume, TOMAN_CURRENCY_CODE)})`).join(', ')}\n`;

        const prompt = `Here is a summary of the current business data. Use it to answer my question.\n\n${dataSummary}\n\nUser Question: ${messageText}`;
      
        const result = await chat.sendMessage({ message: prompt });
        
        setConversation(prev => [...prev, { role: 'model', text: result.text }]);

    } catch (err) {
        console.error("Gemini API Error:", err);
        const errorMessage = "متاسفانه در ارتباط با دستیار هوشمند مشکلی پیش آمد. لطفاً دوباره تلاش کنید.";
        setError(errorMessage);
        setConversation(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
        setIsLoading(false);
    }
  }, [isLoading, chat, transactions, customers, getCustomerTomanVolume, ornamentalGoldItems, getCurrencyById]);
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(userInput);
  };
  
  const suggestionPrompts = {
      'profit': "سود این ماه من چطور بوده؟",
      'transactions': "یک تحلیل کلی از وضعیت معاملات اخیر به من بده.",
      'customers': "بهترین مشتریان من چه کسانی هستند و چطور می‌توانم آن‌ها را بهتر مدیریت کنم؟",
      'management': "برای مدیریت بهتر صرافی چه توصیه‌هایی داری؟"
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="چت با دستیار هوشمند" />
      <Card className="flex-grow flex flex-col">
            <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto h-[calc(100vh-300px)]">
                {conversation.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <AssistantIcon className="w-8 h-8 p-1.5 rounded-full bg-primary-100 dark:bg-primary-700 text-primary-600 dark:text-primary-200 flex-shrink-0" />}
                        <div className={`max-w-xl p-3 rounded-2xl ${msg.role === 'user' ? 'bg-accent-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'}`}>
                           <pre className="text-sm whitespace-pre-wrap font-sans">{msg.text}</pre>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-end gap-2 justify-start">
                        <AssistantIcon className="w-8 h-8 p-1.5 rounded-full bg-primary-100 dark:bg-primary-700 text-primary-600 dark:text-primary-200 flex-shrink-0" />
                        <div className="max-w-xl p-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-none">
                            <div className="flex items-center space-x-1 space-x-reverse">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 border-t dark:border-gray-700">
                <div className="flex flex-wrap gap-2 mb-2">
                    {Object.entries(suggestionPrompts).map(([key, prompt]) => (
                        <button key={key} onClick={() => handleSendMessage(prompt)} className="text-xs px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-800/50 dark:text-primary-200 rounded-full hover:bg-primary-200 dark:hover:bg-primary-700 transition-colors">
                            {prompt}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                    <Input
                        containerClassName="flex-grow mb-0"
                        className="w-full"
                        placeholder="پیام خود را تایپ کنید..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !userInput.trim()}>ارسال</Button>
                </form>
                 {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
      </Card>
    </div>
  );
};

export default AssistantPage;