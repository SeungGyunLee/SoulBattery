/** 로그인 세션 (서비스 자체 토큰 + 닉네임). 브라우저에 보관한다. */
export type Session = {
    token: string;
    nickname: string | null;
};

const SESSION_KEY = 'soulbattery.session.v1';

export function getSession(): Session | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<Session>;
        return typeof parsed.token === 'string' ? { token: parsed.token, nickname: parsed.nickname ?? null } : null;
    } catch {
        return null;
    }
}

export function saveSession(session: Session) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
        // 저장이 막힌 환경이면 로그인 상태를 유지할 수 없다
    }
}

export function clearSession() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch {
        // 무시
    }
}
