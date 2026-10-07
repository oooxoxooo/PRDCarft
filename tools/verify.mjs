#!/usr/bin/env node
/**
 * PRDCraft verify 工具 — 安装前自检。
 *
 * 用法：node tools/verify.mjs
 *
 * 用与 Host 相同的方式驱动 index.js（mock ctx），断言：
 *   1. provider 注册成功，技能清单与 EXPECTED_SKILLS 精确相等（数量+名称），
 *      且 skills/ 目录数一致（防止未登记技能静默混入）；
 *   2. 每个技能描述非平凡（长度 ≥ 40，不含块标量残片）；
 *   3. 每个技能正文不含 frontmatter 残留；
 *   4. 需要适配附注的技能（tools/appendices/ 下列出者）确实烘焙了附注；
 *   5. 上游关键资产存在（prd-workflow 工作流代码、评分引擎、playbook、命令规格）；
 *   6. 打包健康：package.json files 含 cordis.patch.yml、prd-workflow 子包为 commonjs、
 *      locale/*.json 可解析且 en/zh 结构一致；
 *   7. 本地补丁存活：quality_gates.js 的 gate5-9 与补丁标记仍在（bake --src 整包覆盖
 *      会冲掉它们——若此断言失败，按 README「上游升级流程」重放补丁后重跑）；
 *   8. 真实打包产物：npm pack --dry-run --json 的文件清单无 __pycache__/.pyc/.DS_Store
 *      （v3.1.0 曾因此污染 tarball），且含全部 7 个技能与 cordis.patch.yml。
 */
import { readFileSync, existsSync, readdirSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { apply } from '../index.js';
import { PRUNE } from './bake.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** 技能清单的唯一权威定义:新增/移除技能必须改这里(README 技能表随之同步)。 */
const EXPECTED_SKILLS = [
  'competitive-product-research',
  'idea-to-product',
  'interaction-prd',
  'prd-craft',
  'prd-generator',
  'prd-workflow',
  'requirement-review-simulator',
];
const failures = [];
const check = (ok, label) => {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) failures.push(label);
};

let provider = null;
apply({ effect: (fn) => fn(), skills: { registerProvider: (create) => { provider = create(); } } });
check(provider !== null, 'provider registered');

const { candidates } = await provider.list();
const names = candidates.map((c) => c.name);
const expectedSorted = [...EXPECTED_SKILLS].sort();
const actualSorted = [...names].sort();
check(JSON.stringify(expectedSorted) === JSON.stringify(actualSorted), `skill list exact match (${actualSorted.length}): ${actualSorted.join(', ')}`);
check(names.every((n) => NAME_RE.test(n)), `all names kebab-case: ${names.join(', ')}`);
const skillDirs = readdirSync(join(root, 'skills')).filter((d) => statSync(join(root, 'skills', d)).isDirectory());
check(JSON.stringify([...skillDirs].sort()) === JSON.stringify(expectedSorted), `skills/ dirs match manifest (${skillDirs.length})`);

for (const c of candidates) {
  check(c.description.length >= 40 && !/^(>|[-|+*])/u.test(c.description), `description ok: ${c.name}`);
  const def = await provider.get(c, {});
  check(!def.content.startsWith('---'), `frontmatter stripped: ${c.name}`);
}

const appendixSkills = readdirSync(join(root, 'tools/appendices')).map((f) => f.replace(/\.md$/u, ''));
for (const name of appendixSkills) {
  const c = candidates.find((x) => x.name === name);
  const ok = c && (await provider.get(c, {})).content.includes('## DSH 运行时适配（PRDCraft 注入）');
  check(ok, `appendix baked: ${name}`);
}

const assets = [
  'skills/prd-workflow/workflows/main.js',
  'skills/prd-workflow/workflows/smart_router.js',
  'skills/prd-workflow/workflows/quality_gates.js',
  'skills/prd-workflow/workflows/check_items.py',
  'skills/prd-workflow/workflows/decomposition_schema.js',
  'skills/prd-workflow/workflows/version_manager.js',
  'skills/prd-workflow/workflows/requirement_diff.js',
  'skills/prd-workflow/workflows/modules/prd_segmented_module.js',
  'skills/prd-workflow/templates/questions-template.json',
  'skills/prd-workflow/templates/PRD_TEMPLATE_v2.6.2_FUNCTION_BASED.md',
  'skills/prd-workflow/templates/PRD_TEMPLATE_v2.6.2.md',
  'skills/prd-workflow/docs/checker.md',
  'skills/prd-workflow/skills/ui-ux-pro-max/SKILL.md',
  'skills/requirement-review-simulator/references/scoring-engine-deterministic.md',
  'skills/competitive-product-research/references/research-playbook.md',
  'skills/idea-to-product/command/idea-to-mvp.md',
];
for (const rel of assets) check(existsSync(join(root, rel)), `asset present: ${rel}`);

// v3.0.0 增量层结构断言
check(existsSync(join(root, 'skills/prd-craft/references/dsh-enhancements.md')), 'increment layer exists: dsh-enhancements.md');
check(existsSync(join(root, 'skills/prd-craft/references/excalidraw-guide.md')), 'excalidraw-guide.md exists');
for (const gone of ['interview-guide.md', 'quality-checklist.md', 'prd-template.md']) {
  check(!existsSync(join(root, 'skills/prd-craft/references', gone)), `digest removed: ${gone}`);
}
const prdCraftSkill = readFileSync(join(root, 'skills/prd-craft/SKILL.md'), 'utf8');
const prdWorkflowSkill = readFileSync(join(root, 'skills/prd-workflow/SKILL.md'), 'utf8');
check(prdCraftSkill.includes('dsh-enhancements.md') && prdWorkflowSkill.includes('dsh-enhancements.md'), 'both entries reference the increment layer');
check(prdCraftSkill.includes('../prd-workflow/SKILL.md'), 'prd-craft points at upstream methodology');
check(!prdCraftSkill.includes('schemaVersion'), 'prd-craft no longer wraps interview.json schema');
check(!/"mode"\s*:/.test(prdCraftSkill), 'prd-craft no longer wraps interview.json mode');

// 打包健康断言
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
check(Array.isArray(pkg.files) && pkg.files.includes('cordis.patch.yml'), 'package.json files includes cordis.patch.yml');
check(existsSync(join(root, 'cordis.patch.yml')), 'cordis.patch.yml exists');
const subPkg = JSON.parse(readFileSync(join(root, 'skills/prd-workflow/package.json'), 'utf8'));
check(subPkg.type === 'commonjs', 'prd-workflow subpackage is commonjs (workflows runnable)');
const localeKeys = (file) => Object.keys(JSON.parse(readFileSync(join(root, 'locale', file), 'utf8')).meta).sort();
check(JSON.stringify(localeKeys('en.json')) === JSON.stringify(localeKeys('zh.json')), 'locale en/zh meta keys aligned');
check(pkg.dsh?.bundle?.patch === './cordis.patch.yml', 'dsh.bundle.patch points at ./cordis.patch.yml');

// 本地补丁存活断言（防 bake --src 整包覆盖后静默丢失）
const qualityGates = readFileSync(join(root, 'skills/prd-workflow/workflows/quality_gates.js'), 'utf8');
for (const gate of ['gate5_flowchart', 'gate6_design', 'gate7_prototype', 'gate8_export', 'gate9_quality']) {
  check(new RegExp(`['"]${gate}['"]\\s*:`).test(qualityGates), `local patch present: ${gate} (lost by bake --src? see README 升级流程)`);
}
check(qualityGates.includes('PRDCraft 补全'), 'quality_gates.js carries PRDCraft patch marker');

// 真实打包产物断言（3.1.0 曾把 __pycache__/*.pyc 打进 tarball）。
// npm cache 用独立临时目录隔离：用户全局 ~/.npm-cache 损坏（如 root 属主文件）
// 不应使打包断言连锁失效（v3.1.1 时代曾因 EPERM 出现 5 项误导性红项）。
let packed = [];
let packError = null;
const cacheDir = mkdtempSync(join(tmpdir(), 'prdcraft-verify-'));
try {
  const stdout = execFileSync('npm', ['pack', '--dry-run', '--json', '--cache', cacheDir], {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  packed = (JSON.parse(stdout)[0]?.files ?? []).map((f) => f.path);
} catch (error) {
  packError = error?.message ?? String(error);
} finally {
  rmSync(cacheDir, { recursive: true, force: true });
}
if (packError !== null) {
  check(false, `npm pack --dry-run --json failed (isolated cache ${cacheDir}): ${packError}`);
} else {
  check(packed.length > 0, `npm pack produced a file list (${packed.length} files)`);
  const junk = packed.filter((p) => /(__pycache__|\.pyc$|\.DS_Store$)/u.test(p));
  check(junk.length === 0, `tarball free of build junk (pycache/pyc/DS_Store)${junk.length ? ` — found: ${junk.slice(0, 3).join('; ')}` : ''}`);
  // 上游非功能资产不得进入 tarball（清单唯一事实源：tools/bake.mjs 的 PRUNE）
  const prunedPaths = Object.entries(PRUNE).flatMap(([skill, rels]) => rels.map((rel) => `skills/${skill}/${rel}`));
  const leaked = packed.filter((p) => prunedPaths.some((base) => p === base || p.startsWith(`${base}/`)));
  check(leaked.length === 0, `tarball free of pruned upstream assets (${prunedPaths.length} rules)${leaked.length ? ` — found: ${leaked.slice(0, 5).join('; ')}` : ''}`);
  check(!packed.some((p) => /skill-card\.md$/u.test(p)), 'tarball free of skill-card.md (ClawHub marketplace cards)');
  for (const must of ['skills/prd-craft/SKILL.md', 'skills/interaction-prd/SKILL.md', 'skills/idea-to-product/SKILL.md']) {
    check(packed.includes(must), `tarball includes ${must}`);
  }
  check(packed.includes('cordis.patch.yml'), 'tarball includes cordis.patch.yml');
  const packedSkillDirs = new Set(packed.filter((p) => p.startsWith('skills/')).map((p) => p.split('/')[1]));
  check(packedSkillDirs.size === EXPECTED_SKILLS.length && [...packedSkillDirs].every((d) => expectedSorted.includes(d)), `tarball packs exactly ${EXPECTED_SKILLS.length} skill dirs, got ${[...packedSkillDirs].sort().join(', ')}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed.');
