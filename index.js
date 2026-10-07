/**
 * PRDCraft — Host half.
 *
 * Registers a skill provider that contributes the PRD authoring skill pack to
 * the session skill catalog:
 *
 * - prd-craft                        DSH-native orchestrator (访谈→拆解→PRD→评审→导出)
 * - prd-workflow                     完整原版流水线 v5.1.0（含 workflows 代码、模板与 5 个内置子技能）
 * - prd-generator                    (removed in v3.3.0: absorbed into prd-craft
 *                                    increment layer as use-case/data-dictionary
 *                                    appendix sections)
 * - interaction-prd                  交互式 PRD 工作台 v0.8.0（原版）
 * - competitive-product-research     竞品调研 v1.4.8（原版）
 * - requirement-review-simulator     评审模拟器 v1.2.8（原版）
 * - idea-to-product                  MVP 闭环 v0.1.1（原版）
 *
 * Skill bodies live in this package's `skills/` tree, one directory per skill.
 * Each skill's resourceBase is its own folder, so `<skill-directory>/...`
 * relative paths resolve for the file-read tool. Frontmatter parsing uses a
 * bundled YAML-subset parser (plain scalars, quoted scalars, folded `>` and
 * literal `|` blocks with chomping, and nested-mapping skipping) so the
 * package stays dependency-free: profile `link:` installs do not install the
 * linked package's dependencies. DSH adaptation notes for the replicated
 * OpenClaw skills are baked into their SKILL.md files (clearly marked
 * sections), keeping the loader simple and generation-independent.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/** Standard precedence for packaged skill providers (matches dsh-skill-office). */
const BUNDLED_SKILL_RANK = 600;

/** Provider label reported by every candidate this plugin contributes. */
const PROVIDER_NAME = 'prdcraft';

/**
 * Parse the YAML frontmatter subset used by skill manifests: plain scalars,
 * single/double-quoted scalars, folded (`>`/`>-`/`>+`) and literal (`|`/`|-`/`|+`)
 * block scalars, and nested mappings (recorded as null and skipped — this
 * provider reads only name/description/whenToUse). Designed to keep the
 * package dependency-free under profile `link:` installs.
 *
 * @param {string} text - Frontmatter block (between the `---` markers).
 * @returns {Record<string, string | null>}
 */
function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/u);
  const result = {};
  const keyRe = /^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]*(.*))?$/u;
  const blockHeaderRe = /^([>|])([+-]?\d*[+-]?)?$/u;
  const unquote = (value) => {
    const trimmed = value.trim();
    if (trimmed.length >= 2
      && ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || line.trimStart().startsWith('#')) { i += 1; continue; }
    const match = keyRe.exec(line);
    if (!match) { i += 1; continue; }
    const key = match[1];
    const rest = (match[2] ?? '').trim();
    if (rest === '') {
      // Nested mapping or null: skip the following indented block, record null.
      let j = i + 1;
      while (j < lines.length && (lines[j].trim() === '' || /^[ \t]/u.test(lines[j]))) {
        if (lines[j].trim() !== '') break;
        j += 1;
      }
      // consume all indented lines (the block body)
      while (j < lines.length && /^[ \t]/u.test(lines[j])) j += 1;
      result[key] = null;
      i = j;
      continue;
    }
    const block = blockHeaderRe.exec(rest);
    if (block) {
      // Block scalar: collect indented lines, strip their common indent.
      const style = block[1];
      const chomp = (block[2] ?? '').replace(/\d/gu, '');
      const body = [];
      let j = i + 1;
      let indent = null;
      while (j < lines.length && (lines[j].trim() === '' || /^[ \t]/u.test(lines[j]))) {
        if (lines[j].trim() === '') { body.push(''); j += 1; continue; }
        const rawIndent = /^[ \t]*/u.exec(lines[j])[0];
        if (indent === null || rawIndent.length < indent.length) indent = rawIndent;
        body.push(lines[j]);
        j += 1;
      }
      const stripped = body.map((l) => (l === '' ? '' : l.slice(indent.length)));
      while (stripped.length > 0 && stripped[stripped.length - 1] === '') stripped.pop();
      let value = style === '|'
        ? stripped.join('\n')
        : stripped.reduce((acc, l) => (l === '' ? `${acc}\n` : acc === '' || acc.endsWith('\n') ? `${acc}${l}` : `${acc} ${l}`), '');
      if (chomp !== '+') value = value.replace(/\n+$/u, '');
      result[key] = value;
      i = j;
      continue;
    }
    result[key] = unquote(rest);
    i += 1;
  }
  return result;
}

/**
 * Parse one SKILL.md: YAML frontmatter metadata + instruction body.
 * DSH adaptation sections are baked into the authentic skills' SKILL.md
 * files themselves (marked "DSH 运行时适配（PRDCraft 注入）"), so they work
 * regardless of module generation.
 *
 * @param {string} raw - Full SKILL.md text.
 * @param {string} path - Absolute path, for diagnostics.
 * @returns {{ meta: Record<string, string | null>, content: string }}
 */
function parseSkill(raw, path) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw);
  if (!frontmatter) throw new Error(`prdcraft: ${path} has no YAML frontmatter`);
  const meta = parseFrontmatter(frontmatter[1]);
  if (typeof meta.name !== 'string' || meta.name.length === 0) throw new Error(`prdcraft: ${path} has no name`);
  if (typeof meta.description !== 'string' || meta.description.length === 0) throw new Error(`prdcraft: ${path} has no description`);
  return { meta, content: raw.slice(frontmatter[0].length).trim() };
}

/**
 * Register the PRDCraft skill provider.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx - Plugin context carrying the skill registry.
 */
export function apply(ctx) {
  const assetRoot = fileURLToPath(new URL('./skills/', import.meta.url));
  const directories = readdirSync(assetRoot)
    .filter((entry) => statSync(join(assetRoot, entry)).isDirectory())
    .sort();

  const candidates = [];
  for (const directory of directories) {
    // Per-skill tolerance: one malformed SKILL.md must not take down the
    // whole provider — skip it, keep the rest of the pack alive, and warn.
    try {
      const path = join(assetRoot, directory, 'SKILL.md');
      const { meta } = parseSkill(readFileSync(path, 'utf8'), path);
      candidates.push({
        name: meta.name,
        description: meta.description,
        ...typeof meta.whenToUse === 'string' ? { whenToUse: meta.whenToUse } : {},
        invocation: { modelInvocable: true, userInvocable: true },
        provider: PROVIDER_NAME,
        source: 'bundled',
        rank: BUNDLED_SKILL_RANK,
        resourceBase: { kind: 'directory', path: join(assetRoot, directory) },
        locator: path,
      });
    } catch (error) {
      ctx.logger?.warn?.(`prdcraft: skipping skill "${directory}": ${error?.message ?? error}`);
    }
  }

  const provider = {
    name: PROVIDER_NAME,
    list: () => Promise.resolve({ complete: true, candidates }),
    async get(candidate, options) {
      const { rank: _rank, locator, ...summary } = candidate;
      const raw = await readFile(locator, { encoding: 'utf8', signal: options.signal });
      return { ...summary, content: parseSkill(raw, locator).content };
    },
  };

  ctx.effect(() => ctx.skills.registerProvider(() => provider));
}

/** Optional service so the plugin stays inactive in profiles without a skill registry. */
export const inject = ['skills'];
