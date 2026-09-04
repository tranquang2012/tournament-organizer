import { useState, useRef, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot,
  faXmark,
  faPaperPlane,
  faChevronDown,
  faLightbulb,
  faMinus,
} from '@fortawesome/free-solid-svg-icons'
import axios from '../../config/apiEndpoints'
import { getAccessToken, withAuthHeader } from '../../services/AuthService'

const PREDEFINED_QUESTIONS = [
  {
    label: 'Tournament formats',
    question: 'What are the available tournament formats?',
  },
  {
    label: 'What is Hybrid format?',
    question: 'What is the Hybrid tournament format and how does it work?',
  },
  {
    label: 'Best format for 8 teams?',
    question: 'What format should I use for a sport with 8 teams?',
  },
  {
    label: 'Round Robin explained',
    question: 'Can you explain how Round Robin format works?',
  },
  {
    label: 'Single vs Double Elimination',
    question: 'What is the difference between Single and Double Elimination?',
  },
]

const chatErrorMessage = (error) =>
  error?.response?.data?.error?.message
  || error?.message
  || 'The assistant is unavailable. Please try again.'

const toChatPayload = (history) =>
  history
    .filter((m) => !m.isError && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({ role: m.role, content: m.content }))

const sendChat = async (history) => {
  const token = await getAccessToken()
  const result = await axios.post(
    '/api/admin/chat',
    { messages: toChatPayload(history) },
    withAuthHeader(token)
  )
  return result.data
}

const formatDuration = (ms) => {
  if (ms == null || Number.isNaN(ms)) return null
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

const AdminAIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content:
        "Hi! I'm your Tournament AI Assistant. I can help you understand tournament formats, suggest the best setup for your needs, and answer questions about organizing tournaments.\n\nFeel free to ask anything or pick a question below!",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const isAskingRef = useRef(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatPanelRef = useRef(null)
  const quickQuestionsRef = useRef(null)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const scrollStartX = useRef(0)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Drag-to-scroll for quick questions
  const handleMouseDown = (e) => {
    const el = quickQuestionsRef.current
    if (!el) return
    isDragging.current = true
    dragStartX.current = e.pageX
    scrollStartX.current = el.scrollLeft
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return
    const el = quickQuestionsRef.current
    if (!el) return
    const dx = e.pageX - dragStartX.current
    el.scrollLeft = scrollStartX.current - dx
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    const el = quickQuestionsRef.current
    if (el) {
      el.style.cursor = 'grab'
      el.style.userSelect = ''
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const askAssistant = async (history) => {
    if (isAskingRef.current) return
    isAskingRef.current = true
    setIsTyping(true)
    const started = Date.now()
    try {
      const { reply, durationMs } = await sendChat(history)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          content: reply || 'I could not generate a reply. Please try again.',
          timestamp: new Date(),
          durationMs: durationMs ?? Date.now() - started,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          content: chatErrorMessage(err),
          timestamp: new Date(),
          isError: true,
          durationMs: Date.now() - started,
        },
      ])
    } finally {
      isAskingRef.current = false
      setIsTyping(false)
    }
  }

  const appendUserMessage = (content) => {
    if (!content || isAskingRef.current || isTyping) return
    const next = [
      ...messages,
      {
        id: Date.now(),
        role: 'user',
        content,
        timestamp: new Date(),
      },
    ]
    setMessages(next)
    askAssistant(next)
  }

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isTyping) return
    setInputValue('')
    appendUserMessage(trimmed)
  }

  const handleQuickQuestion = (question) => {
    appendUserMessage(question)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatContent = (content) => {
    // Simple markdown-ish rendering
    return content.split('\n').map((line, i) => {
      // Bold
      const formatted = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>'
      )
      // Bullet points
      if (formatted.startsWith('• ') || formatted.startsWith('- ')) {
        return (
          <div
            key={i}
            className="pl-3 py-0.5 text-left"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        )
      }
      // Numbered items
      if (/^\d+\.\s/.test(formatted)) {
        return (
          <div
            key={i}
            className="pl-3 py-0.5 text-left"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        )
      }
      // Empty line = spacing
      if (formatted.trim() === '') {
        return <div key={i} className="h-2" />
      }
      return (
        <div
          key={i}
          className="py-0.5 text-left"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      )
    })
  }

  return (
    <>
      {/* ---- Chat Panel ---- */}
      <div
        ref={chatPanelRef}
        className="fixed z-[9999] flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          bottom: '24px',
          right: '24px',
          width: isOpen ? '420px' : '0px',
          height: isOpen ? 'min(680px, calc(100vh - 48px))' : '0px',
          opacity: isOpen ? 1 : 0,
          borderRadius: '20px',
          background: '#ffffff',
          border: isOpen ? '1px solid #e2e8f0' : 'none',
          boxShadow: isOpen
            ? '0 25px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)'
            : 'none',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {/* Header - keeps the dark teal brand strip */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{
            background: 'linear-gradient(135deg, #123836 0%, #1a4a47 100%)',
            borderBottom: '1px solid rgba(45, 212, 168, 0.15)',
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #2dd4a8 0%, #14b8a6 100%)',
              boxShadow: '0 4px 12px rgba(45, 212, 168, 0.3)',
            }}
          >
            <FontAwesomeIcon icon={faRobot} className="text-[#081a19] text-sm" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-white text-[14px] font-semibold tracking-[-0.01em]">
              Tournament AI
            </span>
            <span className="text-[#94d2c7] text-[11px] flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{
                  background: '#2dd4a8',
                  boxShadow: '0 0 6px rgba(45, 212, 168, 0.6)',
                }}
              />
              Online
            </span>
          </div>

          {/* Minimize */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94d2c7] hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none bg-transparent"
            title="Minimize"
          >
            <FontAwesomeIcon icon={faMinus} className="text-xs" />
          </button>
          {/* Close */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94d2c7] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.15)] transition-all cursor-pointer border-none bg-transparent"
            title="Close"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
          style={{
            background: '#f8fafa',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(18,56,54,0.15) transparent',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[85%] flex flex-col">
                <div
                  className="px-4 py-3 text-[13px] leading-[1.6]"
                  style={{
                    borderRadius:
                      msg.role === 'user'
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                    background:
                      msg.role === 'user'
                        ? 'linear-gradient(135deg, #2dd4a8 0%, #22c59c 100%)'
                        : msg.isError
                          ? '#fff7f7'
                          : '#ffffff',
                    color: msg.role === 'user' ? '#0a2e2b' : '#2d3748',
                    border:
                      msg.role === 'user'
                        ? 'none'
                        : msg.isError
                          ? '1px solid #f0c7c7'
                          : '1px solid #e8ecef',
                    fontWeight: msg.role === 'user' ? 500 : 400,
                    boxShadow:
                      msg.role === 'user'
                        ? '0 2px 8px rgba(18, 56, 54, 0.2)'
                        : '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {formatContent(msg.content)}
                </div>
                {msg.durationMs != null && (
                  <span className="mt-1 px-1 text-[10px] text-[#8aa3a1]">
                    {formatDuration(msg.durationMs)}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div
                className="px-4 py-3 flex items-center gap-1.5"
                style={{
                  borderRadius: '16px 16px 16px 4px',
                  background: '#ffffff',
                  border: '1px solid #e8ecef',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                <span className="typing-dot" style={{ animationDelay: '150ms' }} />
                <span className="typing-dot" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div
          ref={quickQuestionsRef}
          onMouseDown={handleMouseDown}
          className="chatbot-quick-scroll px-4 py-3 flex gap-2 overflow-x-auto shrink-0"
          style={{
            borderTop: '1px solid #edf0f2',
            background: '#ffffff',
            cursor: 'grab',
          }}
        >
          <div className="flex items-center gap-1.5 shrink-0 mr-1">
            <FontAwesomeIcon
              icon={faLightbulb}
              className="text-[#2dd4a8] text-[10px]"
            />
            <span className="text-[10px] text-[#7a9190] uppercase tracking-wider font-semibold whitespace-nowrap">
              Ask
            </span>
          </div>
          {PREDEFINED_QUESTIONS.map((q) => (
            <button
              key={q.label}
              onClick={() => handleQuickQuestion(q.question)}
              disabled={isTyping}
              className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap cursor-pointer transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(18, 56, 54, 0.04)',
                border: '1px solid rgba(18, 56, 54, 0.1)',
                color: '#3d6b68',
              }}
              onMouseEnter={(e) => {
                if (!isTyping) {
                  e.currentTarget.style.background = 'rgba(18, 56, 54, 0.08)'
                  e.currentTarget.style.borderColor = 'rgba(45, 212, 168, 0.4)'
                  e.currentTarget.style.color = '#123836'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(18, 56, 54, 0.04)'
                e.currentTarget.style.borderColor = 'rgba(18, 56, 54, 0.1)'
                e.currentTarget.style.color = '#3d6b68'
              }}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div
          className="px-4 py-3 shrink-0"
          style={{
            borderTop: '1px solid #edf0f2',
            background: '#fafbfc',
          }}
        >
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-2 transition-all duration-200"
            style={{
              background: '#ffffff',
              border: '1px solid #dde2e6',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#2dd4a8'
              e.currentTarget.style.boxShadow =
                '0 0 0 3px rgba(45, 212, 168, 0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#dde2e6'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about tournament formats..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] text-[#2d3748] placeholder-[#a0aab4] leading-[1.5]"
              style={{
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                maxHeight: '80px',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200 border-none disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background:
                  inputValue.trim() && !isTyping
                    ? 'linear-gradient(135deg, #123836 0%, #1a4a47 100%)'
                    : '#edf0f2',
                color:
                  inputValue.trim() && !isTyping ? '#2dd4a8' : '#a0aab4',
                boxShadow:
                  inputValue.trim() && !isTyping
                    ? '0 2px 8px rgba(18, 56, 54, 0.2)'
                    : 'none',
              }}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* ---- Floating Action Button ---- */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="fixed z-[9999] flex items-center gap-2.5 cursor-pointer border-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group"
          style={{
            bottom: '24px',
            right: '24px',
            height: '52px',
            padding: isHovered ? '0 20px 0 16px' : '0 14px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #123836 0%, #1a4a47 100%)',
            boxShadow: isHovered
              ? '0 8px 32px rgba(18, 56, 54, 0.35), 0 0 0 4px rgba(45, 212, 168, 0.12)'
              : '0 4px 20px rgba(18, 56, 54, 0.25), 0 0 0 0px rgba(45, 212, 168, 0)',
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          {/* Glow ring animation */}
          <span
            className="absolute inset-0 rounded-[16px] pointer-events-none"
            style={{
              animation: 'chatbot-pulse 3s ease-in-out infinite',
              background: 'transparent',
              border: '2px solid rgba(45, 212, 168, 0.25)',
            }}
          />

          <FontAwesomeIcon
            icon={faRobot}
            className="text-[#2dd4a8] text-lg shrink-0 relative z-10 transition-transform duration-300"
            style={{
              transform: isHovered ? 'rotate(-8deg) scale(1.1)' : 'rotate(0deg)',
            }}
          />

          <span
            className="text-[#e0f5f0] font-semibold text-[13px] whitespace-nowrap overflow-hidden relative z-10 transition-all duration-300"
            style={{
              maxWidth: isHovered ? '120px' : '0px',
              opacity: isHovered ? 1 : 0,
              letterSpacing: '-0.01em',
            }}
          >
            Ask AI
          </span>
        </button>
      )}

      {/* Inline keyframes for typing animation & pulse */}
      <style>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2dd4a8;
          display: inline-block;
          animation: typing-bounce 1.4s ease-in-out infinite;
        }
        @keyframes typing-bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
        @keyframes chatbot-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.08);
            opacity: 0;
          }
        }
        .chatbot-quick-scroll::-webkit-scrollbar {
          height: 3px;
        }
        .chatbot-quick-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chatbot-quick-scroll::-webkit-scrollbar-thumb {
          background: rgba(18, 56, 54, 0.15);
          border-radius: 4px;
        }
        .chatbot-quick-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(18, 56, 54, 0.3);
        }
        .chatbot-quick-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(18, 56, 54, 0.15) transparent;
        }
      `}</style>
    </>
  )
}

export default AdminAIChatbot
