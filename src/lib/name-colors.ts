// Generate initials from name or email
export function toInitials(name?: string, email?: string): string {
  const text = name || email || "U";
  
  if (!text) return "U";
  
  // If it's an email, use the part before @
  const displayText = text.includes("@") ? text.split("@")[0] : text;
  
  // Split by spaces or common separators
  const parts = displayText.split(/[\s._-]+/).filter(Boolean);
  
  if (parts.length >= 2) {
    // Use first letter of first two parts
    return (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1) {
    // Use first two characters of single part
    const part = parts[0];
    return part.length >= 2 ? part.substring(0, 2).toUpperCase() : part[0].toUpperCase();
  }
  
  return "U";
}

// Generate consistent colors for a given name/email
export function nameToColors(name: string): { gradient: string; fg: string } {
  // Simple hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Generate colors based on hash
  const hue = Math.abs(hash) % 360;
  const saturation = 70 + (Math.abs(hash) % 20); // 70-90%
  const lightness = 50 + (Math.abs(hash) % 20); // 50-70%
  
  const gradient = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const fg = lightness > 60 ? "#000000" : "#ffffff";
  
  return { gradient, fg };
}
