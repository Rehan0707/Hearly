/**
 * Meeting Output Exporters for Jira, GitHub, Slack, Email, and Meeting Minutes.
 */

export interface ExportData {
  title: string;
  summary: string;
  actionItems: string[];
  decisions: string[];
  transcriptEntries: Array<{ speaker: string; text: string }>;
}

export function generateJiraMarkdown(data: ExportData): string {
  return `h2. ${data.title} — Meeting Summary

h3. Summary
${data.summary}

h3. Action Items
${data.actionItems.map((item) => `* [ ] ${item}`).join('\n')}

h3. Key Decisions
${data.decisions.map((dec) => `* ${dec}`).join('\n')}
`;
}

export function generateGitHubIssue(data: ExportData): string {
  return `## 🎙️ ${data.title}

### Summary
${data.summary}

### Action Items
${data.actionItems.map((item) => `- [ ] ${item}`).join('\n')}

### Key Decisions
${data.decisions.map((dec) => `- ${dec}`).join('\n')}
`;
}

export function generateSlackUpdate(data: ExportData): string {
  return `*:microphone: ${data.title} Summary*

*Overview:* ${data.summary}

*Action Items:*
${data.actionItems.map((item) => `• ${item}`).join('\n')}

*Decisions:*
${data.decisions.map((dec) => `• ${dec}`).join('\n')}
`;
}

export function generateFollowUpEmail(data: ExportData): string {
  return `Subject: Follow-up: ${data.title}

Hi Team,

Thanks for joining today's meeting. Here is a quick recap:

Summary:
${data.summary}

Action Items:
${data.actionItems.map((item) => `- ${item}`).join('\n')}

Decisions Made:
${data.decisions.map((dec) => `- ${dec}`).join('\n')}

Best regards,
Hearly AI Assistant
`;
}

export function generateMeetingMinutes(data: ExportData): string {
  return `# 📄 ${data.title} — Meeting Minutes

**Date:** ${new Date().toLocaleDateString()}

## Summary
${data.summary}

## Action Items
${data.actionItems.map((item) => `- [ ] ${item}`).join('\n')}

## Decisions
${data.decisions.map((dec) => `- ${dec}`).join('\n')}

## Full Transcript Log
${data.transcriptEntries.map((entry) => `**${entry.speaker}:** ${entry.text}`).join('\n\n')}
`;
}
