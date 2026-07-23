import React, { useState } from 'react';
import { CopilotService } from '@/services/copilotService';
import {
  generateJiraMarkdown,
  generateGitHubIssue,
  generateSlackUpdate,
  generateFollowUpEmail,
  generateMeetingMinutes,
} from '@/utils/exportGenerators';

interface AssistantPanelProps {
  transcriptContext: string;
  meetingTitle?: string;
  onClose?: () => void;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  transcriptContext,
  meetingTitle = 'Live Meeting Session',
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'copilot'; text: string }>>([
    {
      sender: 'copilot',
      text: 'Hello! I am your Hearly Meeting Copilot. Ask me anything about this meeting or generate export tickets below.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const copilot = new CopilotService();

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userText = query.trim();
    setQuery('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const res = await copilot.askCopilot(userText, transcriptContext);
      setMessages((prev) => [...prev, { sender: 'copilot', text: res.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'copilot', text: 'Sorry, I encountered an issue answering your question.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyExport = (format: 'jira' | 'github' | 'slack' | 'email' | 'minutes') => {
    const mockData = {
      title: meetingTitle,
      summary: transcriptContext.slice(0, 200) || 'Active meeting discussion context.',
      actionItems: ['Review architectural design doc', 'Set up benchmark tests'],
      decisions: ['Approved ECAPA-TDNN speaker verification upgrade'],
      transcriptEntries: [{ speaker: 'Me', text: transcriptContext }],
    };

    let content = '';
    if (format === 'jira') content = generateJiraMarkdown(mockData);
    if (format === 'github') content = generateGitHubIssue(mockData);
    if (format === 'slack') content = generateSlackUpdate(mockData);
    if (format === 'email') content = generateFollowUpEmail(mockData);
    if (format === 'minutes') content = generateMeetingMinutes(mockData);

    navigator.clipboard.writeText(content);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 text-white rounded-2xl p-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h3 className="font-semibold text-sm tracking-wide text-indigo-300">Gemini Meeting Copilot</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md bg-slate-800 transition"
          >
            Close
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl max-w-[88%] leading-relaxed ${
              m.sender === 'user'
                ? 'ml-auto bg-indigo-600/80 text-white border border-indigo-500/40'
                : 'mr-auto bg-slate-800/80 text-slate-200 border border-slate-700/60'
            }`}
          >
            {m.text}
          </div>
        ))}
        {isLoading && (
          <div className="mr-auto bg-slate-800/80 p-3 rounded-xl text-slate-400 text-xs animate-pulse">
            Thinking...
          </div>
        )}
      </div>

      {/* Action Quick Exports */}
      <div className="py-2 border-t border-slate-800 flex flex-wrap gap-1.5 text-[11px]">
        <button
          onClick={() => handleCopyExport('slack')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
        >
          {copiedFormat === 'slack' ? '✓ Copied' : '💬 Slack'}
        </button>
        <button
          onClick={() => handleCopyExport('jira')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
        >
          {copiedFormat === 'jira' ? '✓ Copied' : '🔷 Jira'}
        </button>
        <button
          onClick={() => handleCopyExport('github')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
        >
          {copiedFormat === 'github' ? '✓ Copied' : '🐙 GitHub'}
        </button>
        <button
          onClick={() => handleCopyExport('email')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
        >
          {copiedFormat === 'email' ? '✓ Copied' : '✉️ Email'}
        </button>
        <button
          onClick={() => handleCopyExport('minutes')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
        >
          {copiedFormat === 'minutes' ? '✓ Copied' : '📄 Minutes'}
        </button>
      </div>

      {/* Input Box */}
      <div className="flex items-center space-x-2 pt-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Copilot (e.g. 'What are my action items?')"
          className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-medium transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};
