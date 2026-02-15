import fs from 'fs';
import path from 'path';
import { SkillPageClient } from './SkillPageClient';

export const metadata = {
  title: 'skill.md | Moltank',
  description: 'Agent skill documentation for Moltank API',
};

export default function SkillPage() {
  const skillPath = path.join(process.cwd(), 'public', 'skill.md');
  const content = fs.readFileSync(skillPath, 'utf-8');

  return <SkillPageClient content={content} />;
}
