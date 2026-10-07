#!/usr/bin/env node
/**
 * PRDCraft bake 工具 — 上游技能复刻流水线。
 *
 * 用法：node tools/bake.mjs [--src <下载的技能包目录>] [--skill <名称>]
 *
 * 对 skills/ 下每个有对应 tools/appendices/<技能名>.md 的技能：
 *   1. 裁剪 PRUNE 清单中的上游非功能资产（ClawHub 市场卡片/发布脚本/宣传截图/
 *      演示样例等，DSH 运行时零作用），幂等——`--src` 整包覆盖后自动重删；
 *   2. 校验 SKILL.md frontmatter 可被 provider 解析（name/description）；
 *   3. frontmatter 含块标量（>/|）时规范化为单行引号格式（便于目录索引，
 *      两种解析器代际都兼容），嵌套块原样保留；
 *   4. 用附录文件替换/追加文末的「DSH 运行时适配」章节（幂等，可重复运行）。
 *
 * --src 可选：把指定目录整包覆盖到 skills/<技能名>/ 后再烘焙（升级上游版本用）。
 */
import { readFileSync, writeFileSync, readdirSync, statSync, cpSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = join(root, 'skills');
const appendicesDir = join(root, 'tools', 'appendices');
const MARKER = '## DSH 运行时适配（PRDCraft 注入）';
const MARKER_ASCII = '## DSH 运行时适配(PRDCraft 注入)'; // 历史变体,截断时一并识别

/**
 * 每技能「上游非功能资产」裁剪清单（相对该技能目录的路径，文件或目录均可）。
 * 这些是 ClawHub 市场卡片、发布脚本、宣传截图、演示样例等，DSH 运行时零作用，
 * 只会污染 tarball（v3.1.1 打包实证 ~1MB）。每次 bake 都执行裁剪（幂等），
 * 因此 `--src` 整包覆盖后无需人工重删。tools/verify.mjs 导入本清单断言
 * tarball 不含这些路径——新增裁剪项只需改这里。
 */
export const PRUNE = {
  'competitive-product-research': ['skill-card.md'],
  'idea-to-product': ['skill-card.md'],
  'interaction-prd': ['skill-card.md', 'docs/images'],
  'prd-workflow': [
    'skill-card.md',
    'SKILL_USAGE.md',        // 与 SKILL.md 同题重复的旧文档（阶段术语漂移、围绕 DSH 不存在的 executeForAI）
    'INSTALL.md',            // ClawHub 原生安装指引
    'clawhub.json',          // ClawHub 发布配置
    'RELEASE-v5.1.0.md',     // 上游发布说明
    'examples',              // 演示样例
    'scripts/publish.sh',    // 上游发布脚本
    'scripts/test-workflow.sh', // v2.5.0 时代测试脚本
    'skills/prd-export/examples',
    'skills/requirement-reviewer/examples',
  ],
  'requirement-review-simulator': ['skill-card.md'],
};

function prune(skill, skillDir) {
  const list = PRUNE[skill];
  if (!list) return;
  for (const rel of list) {
    const target = join(skillDir, rel);
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
      console.log(`pruned: ${skill}/${rel}`);
    }
  }
}

// ---- 与 index.js 相同语义的 frontmatter 子集解析（工具侧副本） ----
function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/u);
  const result = {};
  const keyRe = /^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]*(.*))?$/u;
  const blockHeaderRe = /^([>|])([+-]?\d*[+-]?)?$/u;
  const unquote = (v) => {
    const t = v.trim();
    if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) return t.slice(1, -1);
    return t;
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || line.trimStart().startsWith('#')) { i += 1; continue; }
    const m = keyRe.exec(line);
    if (!m) { i += 1; continue; }
    const key = m[1];
    const rest = (m[2] ?? '').trim();
    if (rest === '') {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j += 1;
      while (j < lines.length && /^[ \t]/u.test(lines[j])) j += 1;
      result[key] = null;
      i = j;
      continue;
    }
    const block = blockHeaderRe.exec(rest);
    if (block) {
      const style = block[1];
      const body = [];
      let j = i + 1;
      let indent = null;
      while (j < lines.length && (lines[j].trim() === '' || /^[ \t]/u.test(lines[j]))) {
        if (lines[j].trim() === '') { body.push(''); j += 1; continue; }
        const ind = /^[ \t]*/u.exec(lines[j])[0];
        if (indent === null || ind.length < indent.length) indent = ind;
        body.push(lines[j]);
        j += 1;
      }
      const stripped = body.map((l) => (l === '' ? '' : l.slice(indent.length)));
      while (stripped.length && stripped[stripped.length - 1] === '') stripped.pop();
      let value = style === '|'
        ? stripped.join('\n')
        : stripped.reduce((acc, l) => (l === '' ? `${acc}\n` : acc === '' || acc.endsWith('\n') ? `${acc}${l}` : `${acc} ${l}`), '');
      result[key] = value.replace(/\n+$/u, '');
      i = j;
      continue;
    }
    result[key] = unquote(rest);
    i += 1;
  }
  return result;
}

/** 把 frontmatter 规范化为单行标量 + 原样嵌套块。 */
function normalizeFrontmatter(fmText, meta) {
  const lines = fmText.split(/\r?\n/u);
  const out = ['---'];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    const m = /^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]*(.*))?$/.exec(line);
    if (!m) continue;
    const key = m[1];
    const rest = (m[2] ?? '').trim();
    if (rest === '' && meta[key] === null) {
      out.push(`${key}:`);
      let j = i + 1;
      while (j < lines.length && (lines[j].trim() === '' || /^[ \t]/u.test(lines[j]))) {
        if (lines[j].trim() !== '') out.push(lines[j]);
        j += 1;
      }
      i = j - 1;
      continue;
    }
    if (/^[>|]/u.test(rest)) {
      out.push(`${key}: ${JSON.stringify(String(meta[key] ?? ''))}`);
      let j = i + 1;
      while (j < lines.length && (lines[j].trim() === '' || /^[ \t]/u.test(lines[j]))) j += 1;
      i = j - 1;
      continue;
    }
    out.push(`${key}: ${JSON.stringify(String(meta[key] ?? ''))}`);
  }
  out.push('---');
  return out.join('\n');
}

function main() {
const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const src = getArg('src');
const only = getArg('skill');

const appendixFiles = existsSync(appendicesDir) ? readdirSync(appendicesDir).filter((f) => f.endsWith('.md')) : [];
if (appendixFiles.length === 0) { console.error('no appendices found under tools/appendices/'); process.exit(1); }

for (const file of appendixFiles) {
  const skill = file.replace(/\.md$/u, '');
  if (only && skill !== only) continue;
  const skillDir = join(skillsDir, skill);
  prune(skill, skillDir);
  if (src) {
    if (!only) { console.error('--src 必须与 --skill 连用,否则会覆盖全部技能'); process.exit(1); }
    const srcDir = src;
    if (!existsSync(srcDir)) { console.error(`--src 目录不存在：${srcDir}`); process.exit(1); }
    rmSync(skillDir, { recursive: true, force: true });
    cpSync(srcDir, skillDir, { recursive: true });
    console.log(`copied ${srcDir} → ${skillDir}`);
  }
  const path = join(skillDir, 'SKILL.md');
  if (!existsSync(path) || !statSync(path).isFile()) { console.error(`SKILL.md missing for ${skill}`); process.exit(1); }
  const raw = readFileSync(path, 'utf8');
  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw);
  if (!fmMatch) { console.error(`${skill}: no frontmatter`); process.exit(1); }
  const meta = parseFrontmatter(fmMatch[1]);
  if (!meta.name || !meta.description) { console.error(`${skill}: name/description unparseable`); process.exit(1); }

  let body = raw.slice(fmMatch[0].length);
  const markerIdx = Math.max(body.indexOf(MARKER), body.indexOf(MARKER_ASCII));
  if (markerIdx >= 0) body = body.slice(0, markerIdx);

  const needsNormalize = /^[a-zA-Z_][\w-]*:\s*[>|]/mu.test(fmMatch[1]);
  const fm = needsNormalize ? normalizeFrontmatter(fmMatch[1], meta) : `---\n${fmMatch[1].trim()}\n---`;
  const appendix = readFileSync(join(appendicesDir, file), 'utf8').replace(/\s*$/u, '');
  writeFileSync(path, `${fm}\n${body.replace(/\s*$/u, '')}\n\n${appendix}\n`);
    console.log(`baked: ${skill}${needsNormalize ? ' (frontmatter normalized)' : ''}`);
  }
  console.log('done.');
}

// 仅作为脚本直接执行时运行主流程；被 verify.mjs import 时只导出 PRUNE。
if (import.meta.url === `file://${process.argv[1]}`) main();
