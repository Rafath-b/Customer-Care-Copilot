/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

type Agent = 'BILLING' | 'SAFETY' | 'LOST_FOUND' | 'GENERAL';

type Message = {
  type: 'user' | 'copilot';
  text: string;
  id: number;
  sources?: string[];
  timestamp: string;
  evaluation?: 'good' | 'bad';
  agent?: Agent;
  latency?: number; // in milliseconds
};


type FlowStep = {
  name: 'Route' | 'Retrieve' | 'Generate';
  status: 'pending' | 'active' | 'complete' | 'error';
  details?: string;
};

// SVGs and other components...
const CopilotAvatar = () => ( <div className="avatar"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <defs> <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%"> <stop offset="0%" stop-color="#007AFF" /> <stop offset="100%" stop-color="#5856D6" /> </linearGradient> </defs> <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="url(#avatarGradient)"/> <circle cx="8.5" cy="10.5" r="1.5" fill="white"/> <circle cx="15.5" cy="10.5" r="1.5" fill="white"/> <path d="M8.26274 15.4206C9.57224 16.7301 11.2863 17.5 13.1429 17.5C14.7171 17.5 16.1951 16.925 17.3638 15.9705C17.6899 15.6444 17.6899 15.1145 17.3638 14.7884C17.0378 14.4624 16.5078 14.4624 16.1818 14.7884C15.3436 15.6268 14.3093 16.0294 13.1429 16.0294C11.8385 16.0294 10.6402 15.3855 9.44479 14.2386C9.11873 13.9125 8.58879 13.9125 8.26274 14.2386C7.93668 14.5646 7.93668 15.0946 8.26274 15.4206Z" fill="white"/> </svg> </div> );
const SendIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M3.47826 2.33331L20.5217 11.2381C21.4655 11.7512 21.4655 13.0488 20.5217 13.5619L3.47826 22.4667C2.55598 22.9687 1.5 22.2507 1.5 21.1986V3.60139C1.5 2.54929 2.55598 1.83128 3.47826 2.33331Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/> </svg> );
const CheckmarkIcon = () => ( <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/> </svg> );
const SpinnerIcon = () => ( <svg className="spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M12 2V6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/> <path d="M12 18V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/> <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/> <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/> <path d="M2 12H6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/> <path d="M18 12H22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/> <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/> <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/> </svg> );
const ThumbsUpIcon = () => ( <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"> <path d="M13.34 4.00018C13.53 3.99018 13.72 4.02018 13.89 4.09018C14.77 4.45018 15.25 5.37018 14.93 6.22018L14.43 7.64018H18.5C19.7 7.64018 20.69 8.52018 20.84 9.69018L21.49 14.6902C21.6 15.5402 20.96 16.3602 20.12 16.4802C20.01 16.5002 19.89 16.5102 19.77 16.5102H16.5V19.8502C16.5 20.9602 15.6 21.8502 14.5 21.8502C14.04 21.8502 13.62 21.6702 13.31 21.3602L10.79 18.8402C10.54 18.5902 10.22 18.4402 9.89 18.4402H5C3.9 18.4402 3 17.5402 3 16.4402V9.58018C3 8.48018 3.9 7.58018 5 7.58018H12.68L13.34 4.00018ZM5 9.58018V16.4402H9.89C10.56 16.4402 11.19 16.7002 11.63 17.1402L14.15 19.6602C14.2 19.7102 14.34 19.8502 14.5 19.8502C14.56 19.8502 14.5 19.7902 14.5 19.8502V17.5102C14.5 16.9602 14.95 16.5102 15.5 16.5102H19.77C20.06 16.5102 20.06 16.4102 19.99 15.1102L19.34 10.1102C19.29 9.70018 18.93 9.64018 18.5 9.64018H13.57C13.06 9.64018 12.63 9.32018 12.45 8.85018L11.95 7.43018C11.78 6.94018 12.23 6.37018 12.72 6.54018L13.14 6.70018C13.2 6.72018 13.25 6.71018 13.29 6.70018L13.57 8.12018C13.68 8.65018 13.25 9.14018 12.69 9.14018C12.13 9.14018 11.69 8.66018 11.81 8.12018L12.56 4.93018C12.6 4.78018 12.86 4.50018 13.34 4.00018Z" /> </svg> );
const ThumbsDownIcon = () => ( <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"> <path d="M10.66 19.9998C10.47 20.0098 10.28 19.9798 10.11 19.9098C9.23 19.5498 8.75 18.6298 9.07 17.7798L9.57 16.3598H5.5C4.3 16.3598 3.31 15.4798 3.16 14.3098L2.51 9.30982C2.4 8.45982 3.04 7.63982 3.88 7.51982C3.99 7.49982 4.11 7.48982 4.23 7.48982H7.5V4.14982C7.5 3.03982 8.4 2.14982 9.5 2.14982C9.96 2.14982 10.38 2.32982 10.69 2.63982L13.21 5.15982C13.46 5.40982 13.78 5.55982 14.11 5.55982H19C20.1 5.55982 21 6.45982 21 7.55982V14.4198C21 15.5198 20.1 16.4198 19 16.4198H11.32L10.66 19.9998ZM19 14.4198V7.55982H14.11C13.44 7.55982 12.81 7.29982 12.37 6.85982L9.85 4.33982C9.8 4.28982 9.66 4.14982 9.5 4.14982C9.44 4.14982 9.5 4.20982 9.5 4.14982V6.48982C9.5 7.03982 9.05 7.48982 8.5 7.48982H4.23C3.94 7.48982 3.94 7.58982 4.01 8.88982L4.66 13.8898C4.71 14.2998 5.07 14.3598 5.5 14.3598H10.43C10.94 14.3598 11.37 14.6798 11.55 15.1498L12.05 16.5698C12.22 17.0598 11.77 17.6298 11.28 17.4598L10.86 17.2998C10.8 17.2798 10.75 17.2898 10.71 17.2998L10.43 15.8798C10.32 15.3498 10.75 14.8598 11.31 14.8598C11.87 14.8598 12.31 15.3398 12.19 15.8798L11.44 19.0698C11.4 19.2198 11.14 19.4998 10.66 19.9998Z" /> </svg> );

const App = () => {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      type: 'copilot',
      text: "Hello! I'm your personal ride assistant. How can I help you with your ride today?",
      id: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [userInput, setUserInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [executionFlow, setExecutionFlow] = React.useState<FlowStep[]>([]);
  const [activeTab, setActiveTab] = React.useState<'copilot' | 'dashboard'>('copilot');
  
  const messageListRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, executionFlow]);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [userInput]);

  const handleEvaluation = (messageId: number, evaluation: 'good' | 'bad') => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, evaluation } : msg
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    
    const query = userInput.trim();
    const newUserMessage: Message = { type: 'user', text: query, id: Date.now(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    
    // This is a simplified execution flow for the UI.
    // The actual flow runs on the backend.
    const initialFlow: FlowStep[] = [
        { name: 'Route', status: 'active', details: 'Analyzing your query...' },
        { name: 'Retrieve', status: 'pending' },
        { name: 'Generate', status: 'pending' },
    ];
    setExecutionFlow(initialFlow);

    // Simulate flow for UI purposes
    setTimeout(() => setExecutionFlow(prev => prev.map(s => s.name === 'Route' ? {...s, status: 'complete', details: 'Figuring out your issue...'} : s.name === 'Retrieve' ? {...s, status: 'active', details: 'Searching for solutions...'} : s)), 500);
    setTimeout(() => setExecutionFlow(prev => prev.map(s => s.name === 'Retrieve' ? {...s, status: 'complete', details: 'Found relevant articles...'} : s.name === 'Generate' ? {...s, status: 'active', details: 'Composing your answer...'} : s)), 1500);

    try {
        const response = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        setMessages(prev => [
          ...prev, 
          {
            type: 'copilot',
            text: data.text,
            sources: data.sources,
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            agent: data.agent,
            latency: data.latency,
          }
        ]);

    } catch (error) {
        console.error("Failed to fetch from backend:", error);
        setMessages(prev => [
            ...prev,
            {
                type: 'copilot',
                text: "Sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.",
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    } finally {
        setIsLoading(false);
        setExecutionFlow([]);
    }
  };

  return (
    <div className="copilot-container">
      <header className="copilot-header">
        <h1>Ride Help Assistant</h1>
        <div className="tabs">
            <button className={`tab-button ${activeTab === 'copilot' ? 'active' : ''}`} onClick={() => setActiveTab('copilot')}>Copilot</button>
            <button className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        </div>
      </header>
      {activeTab === 'copilot' ? (
        <>
            <div className="message-list" ref={messageListRef}>
            {messages.map((msg) => <MessageItem key={msg.id} message={msg} onEvaluate={handleEvaluation} />)}
            {isLoading && <ExecutionFlow flow={executionFlow} />}
            </div>
            <form className="message-form" onSubmit={handleSubmit}>
            <textarea
                ref={textareaRef}
                className="message-input"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="How can I help you with your ride?"
                rows={1}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }}}
            />
            <button type="submit" className="send-button" disabled={isLoading || !userInput.trim()}>
                <SendIcon />
            </button>
            </form>
        </>
      ) : (
        <Dashboard messages={messages} />
      )}
    </div>
  );
};

const ExecutionFlow = ({ flow }: { flow: FlowStep[] }) => (
    <div className="execution-flow-container">
        <div className="flow-header">
            <CopilotAvatar />
            <div className="loading-dots"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
        </div>
        <div className="flow-steps">
            {flow.map((step, index) => (
                <div key={index} className={`flow-step ${step.status}`}>
                    <div className="flow-step-icon">
                        {step.status === 'complete' && <CheckmarkIcon />}
                        {step.status === 'active' && <SpinnerIcon />}
                        {step.status === 'pending' && <div className="pending-dot"></div>}
                    </div>
                    <div className="flow-step-content">
                        <span className="flow-step-name">{step.name}</span>
                        {step.details && <span className="flow-step-details">{step.details}</span>}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const MessageItem = ({ message, onEvaluate }: { message: Message; onEvaluate: (id: number, evaluation: 'good' | 'bad') => void; }) => {
  const [sourcesVisible, setSourcesVisible] = React.useState(false);
  return (
    <div className={`message ${message.type}`}>
      {message.type === 'copilot' && <CopilotAvatar />}
      <div className="message-content-wrapper">
        <div className="message-bubble">
          <div className="message-text">{message.text}</div>
          {message.type === 'copilot' && message.sources && message.sources.length > 0 && (
            <div className="message-sources">
              <button className="sources-toggle" onClick={() => setSourcesVisible(!sourcesVisible)}>
                {sourcesVisible ? 'Hide' : 'Show'} Related Help Articles 📚
              </button>
              {sourcesVisible && (<ul>{message.sources.map((source, i) => <li key={i}>{source}</li>)}</ul>)}
            </div>
          )}
        </div>
        <div className="message-meta">
          <div className="message-timestamp">{message.timestamp}</div>
            {message.type === 'copilot' && message.id !== 0 && (
              <div className="message-evaluation">
                <button
                  className={`eval-button ${message.evaluation === 'good' ? 'good' : ''}`}
                  onClick={() => onEvaluate(message.id, 'good')}
                  disabled={!!message.evaluation}
                  aria-label="Good response"
                >
                  <ThumbsUpIcon />
                </button>
                <button
                  className={`eval-button ${message.evaluation === 'bad' ? 'bad' : ''}`}
                  onClick={() => onEvaluate(message.id, 'bad')}
                  disabled={!!message.evaluation}
                  aria-label="Bad response"
                >
                  <ThumbsDownIcon />
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ messages }: { messages: Message[] }) => {
    const copilotMessages = messages.filter(m => m.type === 'copilot' && m.id !== 0);
    const userMessages = messages.filter(m => m.type === 'user');
    const evaluatedMessages = copilotMessages.filter(m => m.evaluation);
    const goodRatings = evaluatedMessages.filter(m => m.evaluation === 'good').length;
    
    const satisfaction = evaluatedMessages.length > 0 ? (goodRatings / evaluatedMessages.length) * 100 : 0;
    
    const totalLatency = copilotMessages.reduce((sum, m) => sum + (m.latency || 0), 0);
    const avgResponseTime = copilotMessages.length > 0 ? totalLatency / copilotMessages.length : 0;

    const agentPerformance: Record<string, { good: number, bad: number, total: number }> = {
        BILLING: { good: 0, bad: 0, total: 0 },
        SAFETY: { good: 0, bad: 0, total: 0 },
        LOST_FOUND: { good: 0, bad: 0, total: 0 },
        GENERAL: { good: 0, bad: 0, total: 0 },
    };

    copilotMessages.forEach(msg => {
        if (msg.agent && msg.evaluation) {
            if (!agentPerformance[msg.agent]) { // Ensure agent exists
              agentPerformance[msg.agent] = { good: 0, bad: 0, total: 0 };
            }
            agentPerformance[msg.agent].total++;
            if (msg.evaluation === 'good') agentPerformance[msg.agent].good++;
            else agentPerformance[msg.agent].bad++;
        }
    });

    const recentQueries = messages.reduce((acc, msg, index) => {
        if(msg.type === 'user') {
            const response = messages[index + 1];
            if(response && response.type === 'copilot') {
                acc.push({ query: msg, response });
            }
        }
        return acc;
    }, [] as {query: Message, response: Message}[]).slice(-5).reverse();

    return (
        <div className="dashboard">
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-value">{userMessages.length}</div>
                    <div className="kpi-label">Total Queries</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{satisfaction.toFixed(1)}%</div>
                    <div className="kpi-label">Satisfaction Score</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{(avgResponseTime / 1000).toFixed(2)}s</div>
                    <div className="kpi-label">Avg. Response Time</div>
                </div>
            </div>
            
            <div className="dashboard-section">
                <h2>Agent Performance</h2>
                <table className="queries-table">
                    <thead>
                        <tr><th>Agent</th><th>Satisfaction</th><th>Total Reviews</th></tr>
                    </thead>
                    <tbody>
                        {Object.entries(agentPerformance).map(([agent, data]) => (
                            <tr key={agent}>
                                <td>{agent}</td>
                                <td>{data.total > 0 ? ((data.good / data.total) * 100).toFixed(1) : 'N/A'}%</td>
                                <td>{data.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="dashboard-section">
                <h2>Recent Queries</h2>
                <table className="queries-table">
                    <thead>
                        <tr><th>Query</th><th>Response</th><th>Evaluation</th><th>Latency</th></tr>
                    </thead>
                    <tbody>
                        {recentQueries.map(({ query, response }) => (
                            <tr key={query.id}>
                                <td>{query.text}</td>
                                <td>{response.text.substring(0, 100)}...</td>
                                <td>
                                    {response.evaluation === 'good' && '👍'}
                                    {response.evaluation === 'bad' && '👎'}
                                    {!response.evaluation && 'N/A'}
                                </td>
                                <td>{(response.latency || 0) / 1000}s</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);