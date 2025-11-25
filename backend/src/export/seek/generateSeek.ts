export function generateSeekFormat(data: any) {
  const skills = data.skills?.length
    ? `Skills:\n- ${data.skills.join("\n- ")}`
    : "";
  const experience = data.experience?.length
    ? `Experience:\n${data.experience.map((e: any) => `- ${e.title} at ${e.company}: ${e.description.split('.').map((s: string) => s.trim()).filter(Boolean).map((s: string) => `• ${s}.`).join(' ')}`).join("\n")}`
    : "";
  return [skills, experience].filter(Boolean).join("\n\n");
}
