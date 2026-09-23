/**
 * VULN-020 — neutralized.
 *
 * This file previously executed a real HTTP POST to the PRODUCTION MyID endpoint
 * (https://app.zerox.uz/...) on import, using a hardcoded JWT-like token. Jest's
 * default test matcher also picked this file up, so `npm test` fired that request.
 *
 * The production call and the hardcoded token have been removed. Tests must be
 * hermetic — never contact production hosts and never embed real credentials.
 * Real specs belong in *.test.ts / __tests__ and must mock outbound integrations.
 */
export {};
