import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import {
  Bot, Send, User, Sparkles, AlertCircle, RefreshCw,
  FileText, Search, Copy, Check, BookOpen, ShieldCheck,
  Activity, Heart, Trash2, CheckCircle2, AlertTriangle, Info
} from 'lucide-react';

// Custom Markdown Formatter for rendering bold, headers, lists, and linebreaks
const FormattedMarkdownText = ({ content }) => {
  if (!content) return null;

  const renderInline = (str) => {
    // Splits by **bold** or *italic* patterns
    const tokens = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return tokens.map((token, idx) => {
      if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
        return <strong key={idx} style={{ fontWeight: '700', color: 'inherit' }}>{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('*') && token.endsWith('*') && token.length >= 3) {
        return <em key={idx} style={{ fontStyle: 'italic', color: 'inherit' }}>{token.slice(1, -1)}</em>;
      }
      return token;
    });
  };

  // Split into double-newline paragraph blocks
  const blocks = content.split(/\n\n+/);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const lines = trimmed.split('\n');

        // Heading 3 / 4 check
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={bIdx} style={{ fontSize: '1.025rem', fontWeight: '700', margin: '0.25rem 0 0.125rem 0', color: 'inherit' }}>
              {renderInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={bIdx} style={{ fontSize: '1.125rem', fontWeight: '700', margin: '0.375rem 0 0.15rem 0', color: 'inherit' }}>
              {renderInline(trimmed.replace(/^#{1,2}\s+/, ''))}
            </h3>
          );
        }

        // Bullet / Numbered list check
        const containsBullets = lines.some(l => /^(\*|-|\d+\.)\s/.test(l.trim()));
        if (containsBullets) {
          return (
            <div key={bIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: '0.125rem 0' }}>
              {lines.map((line, lIdx) => {
                const isBullet = /^(\*|-|\d+\.)\s/.test(line.trim());
                if (!isBullet) {
                  return (
                    <p key={lIdx} style={{ margin: 0, lineHeight: '1.5' }}>
                      {renderInline(line)}
                    </p>
                  );
                }
                const bulletText = line.trim().replace(/^(\*|-|\d+\.)\s+/, '');
                return (
                  <div key={lIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '0.875rem', lineHeight: '1.5', flexShrink: 0 }}>•</span>
                    <span style={{ lineHeight: '1.5', flex: 1 }}>{renderInline(bulletText)}</span>
                  </div>
                );
              })}
            </div>
          );
        }

        // Standard Paragraph with potential single line breaks
        return (
          <p key={bIdx} style={{ margin: 0, lineHeight: '1.55' }}>
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

export const AIChat = () => {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'summarizer' | 'search'
  
  // --- CHAT TAB STATE ---
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your **HealthBridge AI Companion**. How can I assist you with your health, lab results, or medical guidance today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  // --- SUMMARIZER TAB STATE ---
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [customText, setCustomText] = useState('');
  const [includeLabs, setIncludeLabs] = useState(true);
  const [includeRx, setIncludeRx] = useState(true);
  const [includeHistory, setIncludeHistory] = useState(true);

  // --- SEARCH TAB STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  useEffect(() => {
    // Fetch knowledge categories on load
    api.get('/ai/knowledge-base')
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  // --- CHAT HANDLERS ---
  const handleSend = async (messageText = input) => {
    const textToSend = messageText.trim();
    if (!textToSend || chatLoading) return;

    const userMessage = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: textToSend,
        chat_history: messages
      });
      const assistantMessage = { role: 'assistant', text: res.data.reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: "I'm sorry, I couldn't reach the AI service right now. Please verify your connection or try again." }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: 'Chat history cleared. How can I assist you with your health today?'
      }
    ]);
  };

  // --- SUMMARIZER HANDLERS ---
  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.post('/ai/summarize-records', {
        records_text: customText,
        include_lab_reports: includeLabs,
        include_prescriptions: includeRx,
        include_medical_history: includeHistory
      });
      setSummaryData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  // --- SEARCH HANDLERS ---
  const handlePerformSearch = async (queryToSearch = searchQuery) => {
    const q = queryToSearch.trim();
    if (!q) return;
    setSearchLoading(true);
    try {
      const res = await api.post('/ai/search', {
        query: q,
        category: selectedCategory || null,
        limit: 6
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const presetPrompts = [
    "What are normal blood pressure ranges?",
    "Explain fasting blood glucose levels",
    "What adult vaccines are recommended?",
    "How do I switch my Fastlege GP?",
    "What is the Helfo Frikort exemption threshold?"
  ];

  const getRiskBadgeStyle = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' };
      case 'high':
        return { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' };
      case 'moderate':
        return { bg: '#fefce8', color: '#a16207', border: '#fef08a' };
      default:
        return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1240px', minHeight: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
        color: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '16px', backdropFilter: 'blur(8px)', display: 'flex' }}>
              <Bot size={32} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>AI Health Assistant</h2>
                <span style={{ background: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '600' }}>RAG Engine v2.0</span>
              </div>
              <p style={{ opacity: 0.9, fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Intelligent healthcare companion, medical record summarizer & semantic knowledge engine
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                background: activeTab === 'chat' ? 'white' : 'transparent',
                color: activeTab === 'chat' ? '#0369a1' : 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Bot size={16} /> AI Chat
            </button>

            <button
              onClick={() => setActiveTab('summarizer')}
              style={{
                background: activeTab === 'summarizer' ? 'white' : 'transparent',
                color: activeTab === 'summarizer' ? '#0369a1' : 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={16} /> Record Summarizer
            </button>

            <button
              onClick={() => setActiveTab('search')}
              style={{
                background: activeTab === 'search' ? 'white' : 'transparent',
                color: activeTab === 'search' ? '#0369a1' : 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Search size={16} /> RAG Search
            </button>
          </div>
        </div>
      </div>

      {/* Safety & Medical Disclaimer Banner */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1e40af',
        padding: '0.75rem 1.25rem',
        borderRadius: '12px',
        fontSize: '0.8125rem',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <AlertCircle size={20} className="flex-shrink-0" />
          <span>
            <strong>Medical Notice:</strong> HealthBridge AI provides informational assistance based on clinical guidelines. Always consult your assigned Fastlege (GP) or qualified specialist for clinical diagnoses.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#2563eb', fontWeight: '600', flexShrink: 0 }}>
          <ShieldCheck size={16} /> GDPR Compliant
        </div>
      </div>

      {/* --- TAB 1: CHAT COMPANION --- */}
      {activeTab === 'chat' && (
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.25rem', height: 'calc(100vh - 300px)', minHeight: '480px' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              <Sparkles size={16} color="var(--primary)" />
              <span>Multi-turn medical conversation active</span>
            </div>
            <button
              onClick={handleClearChat}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <Trash2 size={14} /> Clear Chat
            </button>
          </div>

          {/* Messages Container */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%'
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #bae6fd' }}>
                    <Bot size={20} />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#f8fafc',
                    color: msg.role === 'user' ? 'white' : '#1e293b',
                    padding: '0.9rem 1.25rem',
                    borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                    fontSize: '0.9375rem',
                    lineHeight: '1.5',
                    border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}>
                    <FormattedMarkdownText content={msg.text} />
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopyMessage(msg.text, idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      opacity: 0.75,
                      padding: '0.1rem 0.4rem'
                    }}
                  >
                    {copiedIndex === idx ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    {copiedIndex === idx ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {msg.role === 'user' && (
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--dark-bg)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'var(--primary)', fontSize: '0.875rem', padding: '0.5rem 0' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw className="animate-spin" size={18} color="#0284c7" />
                </div>
                <span>Analyzing medical knowledge base & preparing response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Prompts Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.75rem 0', borderTop: '1px solid var(--border)', marginTop: '0.5rem', flexShrink: 0 }}>
            {presetPrompts.map((prompt, idx) => (
              <button
                key={idx}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap', borderRadius: '20px', background: '#f1f5f9', border: '1px solid #e2e8f0' }}
                onClick={() => handleSend(prompt)}
              >
                <Sparkles size={12} color="var(--primary)" /> {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexShrink: 0 }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '12px' }}
              placeholder="Ask a health, lab, or HealthBridge portal question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 1.25rem', borderRadius: '12px' }} disabled={chatLoading || !input.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 2: MEDICAL RECORD SUMMARIZER --- */}
      {activeTab === 'summarizer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.25rem' }}>
          
          {/* Controls Sidebar */}
          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--primary)" /> Summarize Scope
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Select record types from your HealthBridge profile to include in the AI clinical summary:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeLabs}
                  onChange={(e) => setIncludeLabs(e.target.checked)}
                />
                Recent Lab Test Reports
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeRx}
                  onChange={(e) => setIncludeRx(e.target.checked)}
                />
                Active Prescriptions (E-resepter)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeHistory}
                  onChange={(e) => setIncludeHistory(e.target.checked)}
                />
                Medical History Conditions
              </label>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', pt: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '0.375rem' }}>
                Additional Notes / Symptoms (Optional):
              </label>
              <textarea
                className="form-input"
                rows={4}
                style={{ width: '100%', fontSize: '0.8125rem', padding: '0.5rem' }}
                placeholder="Paste recent lab numbers or describe symptoms..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
              />
            </div>

            <button
              onClick={handleGenerateSummary}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              disabled={summaryLoading}
            >
              {summaryLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} /> Generating Summary...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Generate AI Medical Summary
                </>
              )}
            </button>
          </div>

          {/* Summary Display Area */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!summaryData && !summaryLoading && (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <h4>No Medical Summary Generated Yet</h4>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Click <strong>"Generate AI Medical Summary"</strong> to run clinical RAG evaluation on your stored lab records, prescriptions, and health history.
                </p>
              </div>
            )}

            {summaryLoading && (
              <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
                <RefreshCw className="animate-spin" size={36} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                <h4>Evaluating Patient Health Metrics...</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Checking lab reference ranges and clinical history</p>
              </div>
            )}

            {summaryData && !summaryLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Risk Level Badge Banner */}
                {(() => {
                  const badgeStyle = getRiskBadgeStyle(summaryData.risk_level);
                  return (
                    <div style={{
                      background: badgeStyle.bg,
                      border: `1px solid ${badgeStyle.border}`,
                      color: badgeStyle.color,
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Activity size={24} />
                        <div>
                          <h4 style={{ margin: 0, fontWeight: '700' }}>Overall Clinical Assessment</h4>
                          <span style={{ fontSize: '0.8125rem' }}>Risk Level Category: <strong>{summaryData.risk_level}</strong></span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Generated: {summaryData.generated_at}</span>
                    </div>
                  );
                })()}

                {/* Summary Body with Markdown Formatter */}
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <FormattedMarkdownText content={summaryData.summary} />
                </div>

                {/* Key Findings */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} color="#0284c7" /> Key Clinical Findings
                  </h4>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {summaryData.key_findings.map((item, idx) => (
                      <div key={idx} style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={16} color="var(--primary)" />
                        <span><FormattedMarkdownText content={item} /></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Heart size={18} color="#e11d48" /> Healthcare Recommendations
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem' }}>
                    {summaryData.recommendations.map((rec, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span style={{ color: '#0284c7', fontWeight: '800' }}>✓</span>
                        <span style={{ color: 'var(--text-main)', flex: 1 }}><FormattedMarkdownText content={rec} /></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: RAG KNOWLEDGE SEARCH --- */}
      {activeTab === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Search Bar & Category Filter */}
          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '260px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <Search size={20} color="var(--text-muted)" />
              <input
                type="text"
                className="form-input"
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}
                placeholder="Search medical topics, labs, BP, fasting glucose, Helfo rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePerformSearch()}
              />
            </div>

            <select
              className="form-input"
              style={{ width: '220px', borderRadius: '12px', cursor: 'pointer' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c, idx) => (
                <option key={idx} value={c.category}>{c.category} ({c.topic_count})</option>
              ))}
            </select>

            <button
              onClick={() => handlePerformSearch()}
              className="btn btn-primary"
              style={{ padding: '0.625rem 1.25rem', borderRadius: '12px' }}
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />} Search RAG
            </button>
          </div>

          {/* Category Explorer Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.25rem 0' }}>
            {categories.map((cat, idx) => (
              <button
                key={idx}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  whiteSpace: 'nowrap',
                  borderRadius: '20px',
                  background: selectedCategory === cat.category ? 'var(--primary-light)' : 'white',
                  color: selectedCategory === cat.category ? 'var(--primary)' : 'var(--text-main)',
                  borderColor: selectedCategory === cat.category ? 'var(--primary)' : 'var(--border)'
                }}
                onClick={() => {
                  setSelectedCategory(cat.category);
                  handlePerformSearch(cat.topics[0] || cat.category);
                }}
              >
                <BookOpen size={12} /> {cat.category} ({cat.topic_count})
              </button>
            ))}
          </div>

          {/* Search Results List */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            {searchLoading && (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--primary)' }}>
                <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '0.75rem' }} />
                <p>Searching verified RAG medical knowledge index...</p>
              </div>
            )}

            {!searchResults && !searchLoading && (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                <Search size={44} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <h4>Perform a Knowledge Base Search</h4>
                <p style={{ fontSize: '0.875rem', marginTop: '0.375rem' }}>
                  Enter keywords like <strong>"Blood Pressure"</strong>, <strong>"Vaccines"</strong>, or <strong>"Frikort"</strong> to query indexed clinical guidelines.
                </p>
              </div>
            )}

            {searchResults && !searchLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* AI Overview Box */}
                {searchResults.ai_overview && (
                  <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd', padding: '1rem 1.25rem', borderRadius: '12px', color: '#0369a1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                      <Sparkles size={16} color="#0284c7" /> AI Search Summary
                    </div>
                    <div style={{ fontSize: '0.875rem', margin: 0 }}>
                      <FormattedMarkdownText content={searchResults.ai_overview} />
                    </div>
                  </div>
                )}

                {/* Results Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                  {searchResults.results.map((item, idx) => (
                    <div key={idx} style={{
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>{item.topic}</h4>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: '700', flexShrink: 0 }}>
                          {Math.round(item.relevance_score * 100)}% match
                        </span>
                      </div>

                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        Category: {item.category}
                      </span>

                      <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.5', margin: 0 }}>
                        <FormattedMarkdownText content={item.content} />
                      </div>

                      {item.key_takeaway && (
                        <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', borderLeft: '3px solid #0284c7', fontSize: '0.78125rem', color: '#334155' }}>
                          <strong>Key Takeaway:</strong> <FormattedMarkdownText content={item.key_takeaway} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
