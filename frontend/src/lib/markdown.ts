export function formatAsMarkdown(polishedText: string, timestamp: number): string {
  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(timestamp));

  return `# VoicePolish Dictation\n**Date:** ${date}\n\n---\n\n${polishedText}\n`;
}
