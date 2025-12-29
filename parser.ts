import { promises as fs } from "fs";
import * as path from "path";

type Player = { playerName: string; th?: string };
type Clan = { clanName: string; players: Player[] };

const ROOT = path.resolve(__dirname);
const INPUT_TXT = path.join(ROOT, "tiedot.txt");
const INDEX_HTML = path.join(ROOT, "index.html");

function parseFile(text: string): Clan[] {
  const groups = text.split(/\r?\n\s*\r?\n/).map(g => g.trim()).filter(Boolean);
  return groups.map(parseGroup);
}

function parseGroup(groupText: string): Clan {
  const lines = groupText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const clanName = lines.shift() || 'Unknown';
  const players = lines.map(l => parsePlayerLine(l)).filter(Boolean) as Player[];
  return { clanName, players };
}

function parsePlayerLine(line: string): Player | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const withoutLeading = trimmed.replace(/^[0-9]+\s*,?\s*/, '');
  return { playerName: withoutLeading, th: line };
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildMermaid(clans: Clan[]): string {
  const lines: string[] = [];
  lines.push('flowchart TD');
  clans.forEach((c, i) => {
    const clanId = `Clan${i+1}`;
    const playersId = `Players${i+1}`;
    const playersLabel = c.players.map(p => escapeHtml(p.playerName)).join('<br>');
    lines.push(`    ${clanId}(${escapeHtml(c.clanName)}) --> ${playersId}(${playersLabel})`);
  });
  return lines.join('\n');
}

async function replaceMermaidInHtml(htmlPath: string, mermaid: string) {
  let html = await fs.readFile(htmlPath, 'utf8');
  const mermaidRegex = /<div\s+class=(?:"|')mermaid(?:"|')[^>]*>[\s\S]*?<\/div>/i;
  const diagramSectionRegex = /<div\s+class=(?:"|')diagram-section(?:"|')[^>]*>[\s\S]*?<\/div>/i;
  const replacement = `<div class="mermaid">\n${mermaid}\n    </div>`;
  if (mermaidRegex.test(html)) {
    html = html.replace(mermaidRegex, replacement);
  } else if (diagramSectionRegex.test(html)) {
    html = html.replace(diagramSectionRegex, match => {
      return match.replace(/<\/div>\s*$/, '    ' + replacement + '\n</div>');
    });
  } else {
    throw new Error('No target element found in index.html. Add <div class="mermaid"></div> or <div class="diagram-section">');
  }
  await fs.writeFile(htmlPath, html, 'utf8');
}

async function main() {
  try {
    const txt = await fs.readFile(INPUT_TXT, 'utf8');
    const clans = parseFile(txt);
    const mermaid = buildMermaid(clans);
    await replaceMermaidInHtml(INDEX_HTML, mermaid);
    console.log('index.html updated with new mermaid diagram.');
  } catch (err: any) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

export { parseFile, parseGroup, parsePlayerLine, buildMermaid };
