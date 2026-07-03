// tests/registry.test.ts — Data-quality truth tests for campaigns/registry.json
// Run: npx vitest run tests/registry.test.ts
//
// Validates the campaign registry against its own declared lifecycle:
//   (a) valid JSON with required fields per campaign
//   (b) unique slugs and refs
//   (c) each campaign path directory exists
//   (d) status / current_phase values within the registry's own lifecycle enum
//   (e) no campaign with an end date in the past may still be "active"

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_PATH = join(ROOT, 'campaigns', 'registry.json');

// Statuses a campaign may hold. The registry does not declare a status enum,
// so this is the canonical set derived from the lifecycle: a campaign is
// planned before launch, active while running, paused if halted, and
// completed once it reaches the "close" phase.
const ALLOWED_STATUSES = ['planned', 'active', 'paused', 'completed'] as const;

interface Campaign {
    slug: string;
    ref: string;
    name: string;
    type: string;
    status: string;
    current_phase: string;
    window: { start: string; end: string };
    path: string;
    [key: string]: unknown;
}

interface Registry {
    lifecycle: { phases: Array<{ id: string }> };
    campaigns: Campaign[];
}

function loadRegistry(): Registry {
    const raw = readFileSync(REGISTRY_PATH, 'utf-8');
    return JSON.parse(raw) as Registry;
}

describe('campaigns/registry.json', () => {
    it('(a) is valid JSON with a campaigns array and lifecycle phases', () => {
        const registry = loadRegistry();
        expect(Array.isArray(registry.campaigns)).toBe(true);
        expect(registry.campaigns.length).toBeGreaterThan(0);
        expect(Array.isArray(registry.lifecycle?.phases)).toBe(true);
        expect(registry.lifecycle.phases.length).toBeGreaterThan(0);
    });

    it('(a) every campaign has the required fields (slug, ref, name, type, status, phase, start, end, path)', () => {
        const { campaigns } = loadRegistry();
        for (const c of campaigns) {
            expect(c.slug, 'campaign missing slug').toBeTruthy();
            expect(c.ref, `${c.slug}: missing ref`).toBeTruthy();
            expect(c.name, `${c.slug}: missing name`).toBeTruthy();
            expect(c.type, `${c.slug}: missing type`).toBeTruthy();
            expect(c.status, `${c.slug}: missing status`).toBeTruthy();
            expect(c.current_phase, `${c.slug}: missing current_phase`).toBeTruthy();
            expect(c.window?.start, `${c.slug}: missing window.start`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(c.window?.end, `${c.slug}: missing window.end`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(c.path, `${c.slug}: missing path`).toBeTruthy();
        }
    });

    it('(b) slugs are unique', () => {
        const { campaigns } = loadRegistry();
        const slugs = campaigns.map((c) => c.slug);
        expect(new Set(slugs).size, `duplicate slugs in: ${slugs.join(', ')}`).toBe(slugs.length);
    });

    it('(b) refs are unique', () => {
        const { campaigns } = loadRegistry();
        const refs = campaigns.map((c) => c.ref);
        expect(new Set(refs).size, `duplicate refs in: ${refs.join(', ')}`).toBe(refs.length);
    });

    it('(c) each campaign path directory exists', () => {
        const { campaigns } = loadRegistry();
        for (const c of campaigns) {
            const dir = join(ROOT, c.path);
            expect(existsSync(dir), `${c.slug}: path does not exist: ${c.path}`).toBe(true);
            expect(statSync(dir).isDirectory(), `${c.slug}: path is not a directory: ${c.path}`).toBe(true);
        }
    });

    it('(d) current_phase is a phase id declared in the registry lifecycle', () => {
        const registry = loadRegistry();
        const phaseIds = registry.lifecycle.phases.map((p) => p.id);
        for (const c of registry.campaigns) {
            expect(
                phaseIds,
                `${c.slug}: current_phase "${c.current_phase}" not in lifecycle enum [${phaseIds.join(', ')}]`
            ).toContain(c.current_phase);
        }
    });

    it('(d) status is within the allowed status set', () => {
        const { campaigns } = loadRegistry();
        for (const c of campaigns) {
            expect(
                ALLOWED_STATUSES as readonly string[],
                `${c.slug}: status "${c.status}" not in [${ALLOWED_STATUSES.join(', ')}]`
            ).toContain(c.status);
        }
    });

    it('(e) no campaign with an end date in the past may have status "active"', () => {
        const { campaigns } = loadRegistry();
        const today = new Date().toISOString().slice(0, 10);
        const expiredButActive = campaigns
            .filter((c) => c.window?.end < today && c.status === 'active')
            .map((c) => `${c.slug} (ended ${c.window.end})`);
        expect(
            expiredButActive,
            `campaigns past their end date still marked "active": ${expiredButActive.join('; ')}`
        ).toEqual([]);
    });
});
