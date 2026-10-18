/**
 * 카카오 로그인 (인가 코드 방식)
 * 1. 카카오 로그인 페이지로 이동
 * 2. 카카오가 {현재 주소}/oauth/kakao?code=... 로 돌려보냄
 * 3. 그 code 를 백엔드에 보내면, 백엔드가 카카오와 통신해서 서비스 토큰을 발급
 *
 * 카카오 개발자 콘솔의 Redirect URI 와 백엔드의 KAKAO_REDIRECT_URI 가
 * 아래 redirectUri() 값과 정확히 같아야 한다.
 */
const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY as string | undefined;
const STATE_KEY = 'soulbattery.oauthState';

export const KAKAO_CALLBACK_PATH = '/oauth/kakao';
export const kakaoLoginEnabled = Boolean(REST_API_KEY);

const redirectUri = () => `${window.location.origin}${KAKAO_CALLBACK_PATH}`;

export function startKakaoLogin() {
    if (!REST_API_KEY) return;
    // state: 다른 사이트가 위조한 로그인 응답을 걸러내기 위한 일회용 값
    const state = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    try {
        sessionStorage.setItem(STATE_KEY, state);
    } catch {
        // 무시: 콜백에서 state 확인에 실패하면 로그인이 취소된다
    }
    const params = new URLSearchParams({
        client_id: REST_API_KEY,
        redirect_uri: redirectUri(),
        response_type: 'code',
        state,
    });
    window.location.href = `https://kauth.kakao.com/oauth/authorize?${params}`;
}

/** 콜백으로 받은 state 가 로그인 시작 때 저장한 값과 같은지 확인하고 지운다. */
export function consumeState(state: string | null): boolean {
    try {
        const saved = sessionStorage.getItem(STATE_KEY);
        sessionStorage.removeItem(STATE_KEY);
        return Boolean(state) && saved === state;
    } catch {
        return false;
    }
}
