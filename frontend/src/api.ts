import { clearSession, getSession } from './auth/session';

export const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/** 로그인 토큰이 만료되었거나 잘못된 경우 */
export class UnauthorizedError extends Error {
    constructor() {
        super('로그인이 만료되었어요.');
    }
}

/** 백엔드 호출. 로그인 상태면 토큰을 붙이고, 401이면 세션을 정리한다. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const session = getSession();
    const headers = new Headers(init.headers);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (session) headers.set('Authorization', `Bearer ${session.token}`);

    const response = await fetch(API_URL + path, { ...init, headers });
    if (response.status === 401 && session) {
        clearSession();
        throw new UnauthorizedError();
    }
    if (!response.ok) throw new Error(`요청 실패 (${response.status})`);
    return response;
}
