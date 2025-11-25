export function generateLinkedInSummary(data: any) {
  return `
${data.name}
${data.headline}

Experience:
${data.experience.map((e: any) => `- ${e.title} at ${e.company}`).join("\n")}
  `.trim();
}
