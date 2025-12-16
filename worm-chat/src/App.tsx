import { useState, useEffect, useRef, FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, LogOut, MessageCircle, User, Bot } from 'lucide-react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_KEY = import.meta.env.VITE_API_KEY || ''

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIResponse {
  id: string
  outputText: string
}

const STORAGE_KEYS = {
  EMAIL: 'wormchat_email',
  CONVERSATION_ID: 'wormchat_conversation_id',
}

function LoginScreen({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim()
    
    if (!trimmedEmail) {
      setError('メールアドレスを入力してください')
      return
    }
    
    setError('')
    onLogin(trimmedEmail)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
            <MessageCircle className="h-8 w-8 text-zinc-100 dark:text-zinc-900" />
          </div>
          <CardTitle className="text-2xl">WormChat</CardTitle>
          <CardDescription>
            AIアシスタントとチャットを始めるには、メールアドレスを入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              ログイン
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function ChatScreen({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedInput = inputValue.trim()
    
    if (!trimmedInput || isLoading) return

    const userMessage: Message = { role: 'user', content: trimmedInput }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError('')

    try {
      const conversationId = localStorage.getItem(STORAGE_KEYS.CONVERSATION_ID)
      
      const requestBody: { mailAddress: string; chatText: string; id?: string } = {
        mailAddress: email,
        chatText: trimmedInput,
      }
      
      if (conversationId) {
        requestBody.id = conversationId
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (API_KEY) {
        headers['x-functions-key'] = API_KEY
      }

      const response = await fetch(`${API_BASE_URL}/api/PostWormAPI`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json()
          throw new Error(Array.isArray(errorData) ? errorData.join(', ') : 'リクエストが無効です')
        } else if (response.status === 502) {
          throw new Error('AIサービスとの通信中にエラーが発生しました')
        } else {
          throw new Error('予期せぬエラーが発生しました')
        }
      }

      const data: AIResponse = await response.json()
      
      if (data.id) {
        localStorage.setItem(STORAGE_KEYS.CONVERSATION_ID, data.id)
      }

      const assistantMessage: Message = { role: 'assistant', content: data.outputText }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.EMAIL)
    localStorage.removeItem(STORAGE_KEYS.CONVERSATION_ID)
    onLogout()
  }

  const startNewConversation = () => {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATION_ID)
    setMessages([])
    setError('')
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
            <MessageCircle className="h-5 w-5 text-zinc-100 dark:text-zinc-900" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">WormChat</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400 hidden sm:inline">{email}</span>
          <Button variant="outline" size="sm" onClick={startNewConversation}>
            新しい会話
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="ログアウト">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                <Bot className="h-8 w-8 text-zinc-600 dark:text-zinc-300" />
              </div>
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                WormChatへようこそ
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                メッセージを入力してAIアシスタントとの会話を始めましょう
              </p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
                  <Bot className="h-4 w-4 text-zinc-100 dark:text-zinc-900" />
                </div>
              )}
              <div
                className={`max-w-xl rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-pre:my-2 prose-pre:bg-zinc-100 prose-pre:dark:bg-zinc-900 prose-code:text-zinc-800 prose-code:dark:text-zinc-200 prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <User className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
                <Bot className="h-4 w-4 text-zinc-100 dark:text-zinc-900" />
              </div>
              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-2">
          <Input
            type="text"
            placeholder="メッセージを入力..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  )
}

function App() {
  const [email, setEmail] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const storedEmail = localStorage.getItem(STORAGE_KEYS.EMAIL)
    if (storedEmail) {
      setEmail(storedEmail)
    }
    setIsInitialized(true)
  }, [])

  const handleLogin = (userEmail: string) => {
    localStorage.setItem(STORAGE_KEYS.EMAIL, userEmail)
    setEmail(userEmail)
  }

  const handleLogout = () => {
    setEmail(null)
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    )
  }

  if (!email) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return <ChatScreen email={email} onLogout={handleLogout} />
}

export default App
