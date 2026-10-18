import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { consumeState } from '../auth/kakao';
import { saveSession } from '../auth/session';
import { migrateLocalRecords } from '../storage/recordStore';

// 인가 코드는 한 번만 쓸 수 있으므로, 개발 모드(StrictMode)에서 effect 가 두 번 실행돼도 한 번만 처리한다
let handled = false;

export default function KakaoCallback() {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (handled) return;
        handled = true;

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        const finish = async () => {
            if (params.get('error') || !code) {
                throw new Error('카카오 로그인이 취소되었어요.');
            }
            if (!consumeState(params.get('state'))) {
                throw new Error('로그인 요청을 확인할 수 없어요. 처음부터 다시 시도해 주세요.');
            }
            const response = await apiFetch('/api/auth/kakao', {
                method: 'POST',
                body: JSON.stringify({ code }),
            });
            const { token, nickname } = await response.json() as { token: string; nickname: string | null };
            saveSession({ token, nickname });

            try {
                await migrateLocalRecords();
            } catch (e) {
                // 기록 이전에 실패해도 로그인은 유지하고, 기기 기록은 지우지 않고 남겨 둔다
                console.error(e);
            }
            window.location.replace('/');
        };

        finish().catch((e: unknown) => {
            setError(e instanceof Error ? e.message : '로그인에 실패했어요.');
        });
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#FDFBF7] text-[#4A4036] p-6 font-serif">
            {error ? (
                <>
                    <p className="mb-6 text-center">{error}</p>
                    <button onClick={() => window.location.replace('/')}
                            className="px-8 py-3 bg-[#8B5E3C] text-white rounded-full">
                        처음으로 돌아가기
                    </button>
                </>
            ) : (
                <>
                    <div className="animate-bounce text-4xl mb-4">🔋</div>
                    <p className="text-[#8C7B6C]">로그인하고 기록을 옮기는 중...</p>
                </>
            )}
        </div>
    );
}
