import { useState, useEffect, type ChangeEvent } from 'react'
import { QUESTIONS } from '../constants/questions'; // ✨ 외부 질문 리스트 불러오기
import { getRecordStore, localRecordStore, type NewSoulRecord, type SoulRecord } from '../storage/recordStore';
import { clearSession, getSession, type Session } from '../auth/session';
import { kakaoLoginEnabled, startKakaoLogin } from '../auth/kakao';
import { UnauthorizedError } from '../api';
import HistoryCard from './HistoryCard';
import CountrysideJourney from './CountrysideJourney';
import { formatAdvice, splitRoutines } from '../utils/formatAdvice';

const daysAgo = (iso: string) => {
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86_400_000);
    return days === 0 ? '오늘' : days === 1 ? '어제' : `${days}일 전`;
};

// 카카오 SDK 타입 정의 (TS 에러 방지)
declare global {
    interface Window {
        Kakao: {
            init: (appKey: string) => void;
            isInitialized: () => boolean;
            Share: {
                sendDefault: (params: Record<string, unknown>) => void;
                sendCustom: (params: Record<string, unknown>) => void;
                sendScrap: (params: Record<string, unknown>) => void;
            };
            // Auth 등 추가로 사용하는 카카오 API가 있다면 여기에 계속 정의하시면 됩니다.
        };
    }
}

// 백엔드 /api/analysis/submit 응답
type AnalysisResult = {
    typeCode: string;
    typeName: string;
    description: string;
    symbol: string;
    outerBattery: number; // 겉 배터리 (0~100)
    innerBattery: number; // 속 배터리 (0~100)
    openness: number;     // 표현 (0~100)
    gap: number;          // 겉 - 속
    needsSupport: boolean;
    aiComment: string;
};

const batteryColor = (value: number) =>
    value < 30 ? 'bg-red-400' : value < 70 ? 'bg-[#8B5E3C]' : 'bg-green-600';

export default function SurveyScreen() {
    const [showIntro, setShowIntro] = useState(true);
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    // 처방전을 기다리는 동안 시골 마을 장면을 보여주는 중인지
    const [journey, setJourney] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    // 사용자가 생각하는 배터리 & 실제(속) 배터리
    const [userGuess, setUserGuess] = useState(50);
    const actualBattery = result?.innerBattery ?? 0;

    const [typedText, setTypedText] = useState("");

    // 로그인 상태와 점검 기록 (오래된 순). 로그인하면 계정, 아니면 이 기기에서 불러온다.
    const [session, setSession] = useState<Session | null>(() => getSession());
    const [history, setHistory] = useState<SoulRecord[]>([]);
    const lastRecord = history.length > 0 ? history[history.length - 1] : null;

    // 로그인이 만료되면 비로그인 상태로 돌아가 기기 기록을 보여준다
    const handleStoreError = async (error: unknown) => {
        console.error(error);
        if (error instanceof UnauthorizedError) {
            setSession(null);
            setHistory(await localRecordStore.list());
        }
    };

    useEffect(() => {
        getRecordStore().list().then(setHistory).catch(handleStoreError);
    }, []);

    const saveRecord = async (record: NewSoulRecord) => {
        try {
            const saved = await getRecordStore().add(record);
            setHistory((prev) => [...prev, saved]);
        } catch (error) {
            await handleStoreError(error);
        }
    };

    const clearHistory = async () => {
        try {
            await getRecordStore().clear();
            setHistory([]);
        } catch (error) {
            await handleStoreError(error);
        }
    };

    const logout = async () => {
        clearSession();
        setSession(null);
        setHistory(await localRecordStore.list());
    };

    // ✨ 1. 카카오톡 초기화
    useEffect(() => {
        const KAKAO_KEY = "53235fabc43d49b0e066e57017d8c3b6";
        if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(KAKAO_KEY);
            console.log("Kakao Initialized");
        }
    }, []);

    // ✨ 2. 카카오톡 공유 함수
    const shareToKakao = () => {
        if (!window.Kakao) return;
        if (!window.Kakao.isInitialized()) {
            window.Kakao.init("53235fabc43d49b0e066e57017d8c3b6");
        }

        const TEMPLATE_ID = 129303;

        window.Kakao.Share.sendCustom({
            templateId: TEMPLATE_ID,
            templateArgs: {
                'TITLE': `🔋 내 속 배터리: ${actualBattery}%`,
                'DESC': `나는 [${result?.typeName}] 유형입니다.\n친구들도 내 배터리를 확인해보세요!`,
                'IMAGE': 'https://soulbattery.vercel.app/sb-icon.png?v=8'
            },
        });
    };

    // ✨ 3. 링크 복사 함수
    const copyLink = () => {
        const url = 'https://soulbattery.vercel.app';
        navigator.clipboard.writeText(url).then(() => {
            alert("링크가 복사되었습니다! 📋\n인스타그램 스토리에 붙여넣어 공유해보세요.");
        });
    };

    // 진행도 계산 (QUESTIONS 배열의 길이를 사용)
    const progress = ((step + 1) / QUESTIONS.length) * 100;

    const handleSelect = (score: number) => {
        const newAnswers = [...answers, score];
        setAnswers(newAnswers);
        if (step < QUESTIONS.length - 1) {
            setStep(step + 1);
        } else {
            submitSurvey(newAnswers);
        }
    };

    const submitSurvey = async (finalAnswers: number[]) => {
        setJourney(true);

        // 채점(축별 점수, 역채점, 유형 분류)은 백엔드에서 문항 id 기준으로 처리
        const payload = finalAnswers.map((score, index) => ({
            questionId: QUESTIONS[index].id,
            score,
        }));

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(apiUrl + '/api/analysis/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: payload }),
            });
            if (!response.ok) throw new Error('서버 통신 실패');
            const data: AnalysisResult = await response.json();
            setResult(data);

            // 기록 저장에 실패해도 결과 화면은 그대로 보여준다
            void saveRecord({
                typeCode: data.typeCode,
                typeName: data.typeName,
                symbol: data.symbol,
                outerBattery: data.outerBattery,
                innerBattery: data.innerBattery,
                openness: data.openness,
                userGuess,
            });
        } catch(error) {
            console.error(error);
            setJourney(false);
            alert("처방전을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
    };
    // AI 해설은 [[PAYWALL]] 구분자로 '마음 리포트'와 '2주 충전 루틴'으로 나뉜다.
    // 루틴은 지금은 무료로 공개한다. (위기 안내 유형은 구분자 없이 리포트만 온다)
    const parts = result?.aiComment ? result.aiComment.split('[[PAYWALL]]') : [];
    const publicText = parts[0] ? formatAdvice(parts[0]) : "분석 결과가 없습니다.";
    const routineText = parts.length > 1 && parts[1].trim().length > 0 ? parts[1].trim() : null;

    useEffect(() => {
        // 장면 전환이 끝나고 결과 화면이 보일 때부터 타이핑을 시작한다
        if (!result?.aiComment || journey) return;

        // 여기서 경고가 뜬다면 아래 주석으로 무시 처리 가능합니다.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTypedText("");

        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < publicText.length) {
                const char = publicText.charAt(i);
                setTypedText((prev: string) => prev + char);
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 50);

        return () => clearInterval(typingInterval);
    }, [result, publicText, journey]);

    // 1️⃣ 시작 화면
    if (showIntro) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#FDFBF7] text-[#4A4036] p-6 fade-in">
                <div className="max-w-md w-full text-center border border-[#E8E4D9] p-10 bg-white shadow-lg relative">
                    <div className="absolute top-4 left-4 right-4 h-full border-2 border-dashed border-[#E8E4D9] pointer-events-none"></div>
                    <div className="mb-6 text-6xl animate-bounce">🔋</div>
                    <h1 className="text-3xl font-serif font-bold text-[#5C4D41] mb-2">Soul Battery</h1>
                    <p className="text-xs tracking-[0.3em] text-[#9C8F80] uppercase mb-8">Mental Energy Check</p>

                    <div className="space-y-4 font-serif text-[#6E6359] leading-relaxed text-sm mb-8">
                        <p>"소울 배터리에 오신 걸 환영해요."</p>
                        <p>검사를 시작하기 전에,<br />본인이 생각하는 마음 배터리 잔량은 몇 % 인가요?</p>
                    </div>

                    {lastRecord && (
                        <p className="mb-6 text-xs font-serif text-[#9C8F80]">
                            지난 점검 {daysAgo(lastRecord.createdAt)} · 속 배터리 {lastRecord.innerBattery}%
                        </p>
                    )}

                    <div className="mb-10 px-4">
                        <div className="flex justify-between text-xs font-bold text-[#8B5E3C] mb-2">
                            <span>0% (방전)</span>
                            <span className="text-xl">{userGuess}%</span>
                            <span>100% (완충)</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={userGuess}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setUserGuess(Number(e.target.value))}
                            className="w-full h-2 bg-[#E8E4D9] rounded-lg appearance-none cursor-pointer accent-[#8B5E3C]"
                        />
                    </div>

                    <button onClick={() => setShowIntro(false)} className="px-10 py-4 bg-[#8B5E3C] text-white font-serif rounded-full hover:bg-[#6D4C32] transition-all shadow-md transform hover:scale-105">
                        내 마음 측정하기
                    </button>

                    {session ? (
                        <p className="mt-6 text-xs font-serif text-[#9C8F80]">
                            {session.nickname ?? '회원'}님의 기록은 계정에 저장돼요 ·{' '}
                            <button onClick={logout} className="underline hover:text-[#8B5E3C]">로그아웃</button>
                        </p>
                    ) : kakaoLoginEnabled && (
                        <button onClick={startKakaoLogin}
                                className="mt-6 w-full max-w-[240px] mx-auto flex items-center justify-center gap-2 py-3 bg-[#FEE500] text-[#191919] text-sm font-bold rounded-lg">
                            카카오로 로그인하고 기록 이어가기
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // 2️⃣ 처방전 대기 화면: 시골 마을의 하루가 흐르다가 결과가 오면 우체통 장면을 거쳐 넘어간다
    if (journey) {
        return <CountrysideJourney ready={result !== null} onFinish={() => setJourney(false)} />;
    }

    // 3️⃣ 결과 화면
    if (result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFBF7] p-6 fade-in">
                <div className="max-w-2xl w-full bg-white p-8 shadow-xl border border-[#E8E4D9] relative">

                    <div className="text-center mb-8 border-b-2 border-dashed border-[#D6CFC7] pb-6">
                        <span className="text-xs font-serif text-[#9C8F80] tracking-[0.2em] uppercase">Soul Report</span>
                        <div className="text-5xl mt-4">{result.symbol}</div>
                        <h1 className="text-3xl font-serif font-bold mt-3 text-[#5C4D41]">
                            당신은 <span className="text-[#8B5E3C] underline decoration-[#D6CFC7] underline-offset-4">[{result.typeName}]</span> 입니다.
                        </h1>
                        <p className="text-lg text-[#6E6359] mt-4 font-serif italic">"{result.description}"</p>
                    </div>

                    {/* 배터리 비교 섹션 */}
                    <div className="mb-8 p-5 bg-[#FAFAF5] border border-[#E8E4D9] rounded-sm">
                        <h3 className="text-sm font-serif font-bold text-[#5C4D41] mb-4 text-center">🔋 배터리 잔량 비교</h3>

                        {/* 예상 수치 */}
                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1 text-[#9C8F80]">
                                <span>내 예상</span>
                                <span>{userGuess}%</span>
                            </div>
                            <div className="w-full bg-[#E8E4D9] h-3 rounded-full overflow-hidden">
                                <div className="bg-[#9C8F80] h-full" style={{ width: `${userGuess}%` }}></div>
                            </div>
                        </div>

                        {/* 겉 배터리 / 속 배터리 */}
                        {[
                            { label: '겉 배터리 (일상을 굴리는 힘)', value: result.outerBattery },
                            { label: '속 배터리 (실제 남은 에너지)', value: result.innerBattery },
                        ].map(({ label, value }) => (
                            <div key={label} className="mb-4 last:mb-0">
                                <div className="flex justify-between text-xs mb-1 text-[#8B5E3C] font-bold">
                                    <span>{label}</span>
                                    <span>{value}%</span>
                                </div>
                                <div className="w-full bg-[#E8E4D9] h-3 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${batteryColor(value)}`}
                                        style={{ width: `${value}%` }}>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <p className="text-center text-xs text-[#9C8F80] mt-4 font-serif leading-relaxed">
                            {result.gap >= 20
                                ? "겉으로는 잘 해내고 있지만, 속은 그만큼 채워져 있지 않아요."
                                : Math.abs(userGuess - actualBattery) > 20
                                    ? "생각하신 것과 실제 속 배터리가 꽤 다르네요."
                                    : "자신의 상태를 잘 알고 계시네요."}
                        </p>
                    </div>

                    {/* 속 배터리가 매우 낮을 때: 결제 안내 대신 도움 연결 */}
                    {result.needsSupport && (
                        <div className="mb-8 p-5 bg-white border-2 border-[#D6CFC7] rounded-sm font-serif text-[#5C4D41] text-sm leading-relaxed">
                            <p className="font-bold mb-2">혼자 버티지 않아도 괜찮아요.</p>
                            <p className="mb-3">지금은 믿을 수 있는 사람이나 전문 상담과 이야기를 나눠 보세요. 24시간 언제든 연결돼요.</p>
                            <ul className="space-y-1">
                                <li>자살예방상담전화 <a href="tel:109" className="font-bold text-[#8B5E3C] underline">109</a></li>
                                <li>정신건강위기상담 <a href="tel:15770199" className="font-bold text-[#8B5E3C] underline">1577-0199</a></li>
                            </ul>
                        </div>
                    )}

                    <div className="bg-[#FAFAF5] p-6 rounded-sm border border-[#E8E4D9] mb-6 shadow-sm">
                        <h3 className="text-md font-serif font-bold text-[#8B5E3C] mb-4 flex items-center">
                            <span className="mr-2 text-xl">📋</span> 마음 리포트
                        </h3>
                        <p className="text-[#5C4D41] leading-loose font-serif whitespace-pre-wrap text-md">
                            {typedText}
                            <span className="animate-pulse text-[#8B5E3C]">|</span>
                        </p>
                    </div>

                    {!result.needsSupport && routineText && (
                        <div className="bg-[#FAFAF5] p-6 rounded-sm border border-[#E8E4D9] mb-8 shadow-sm">
                            <h3 className="text-md font-serif font-bold text-[#8B5E3C] mb-1 flex items-center">
                                <span className="mr-2 text-xl">🌱</span> 2주 충전 루틴
                            </h3>
                            <p className="text-xs font-serif text-[#9C8F80] mb-4">지금은 누구나 무료로 볼 수 있어요.</p>
                            <div className="space-y-5">
                                {splitRoutines(routineText).map((block, i) => (
                                    <div key={i} className={block.title ? 'pt-4 border-t border-[#E8E4D9] first:pt-0 first:border-t-0' : ''}>
                                        {block.title && (
                                            <h4 className="font-serif font-bold text-[#5C4D41] text-sm mb-2">{block.title}</h4>
                                        )}
                                        <p className="text-[#5C4D41] leading-loose font-serif whitespace-pre-wrap text-sm">
                                            {block.body}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <HistoryCard
                        records={history}
                        onClear={clearHistory}
                        loggedIn={session !== null}
                        onLogin={kakaoLoginEnabled ? startKakaoLogin : undefined}
                    />

                    {/* 공유 버튼 섹션 */}
                    <div className="flex gap-2 justify-center w-full mb-10">
                        <button
                            onClick={shareToKakao}
                            className="flex-1 bg-[#FEE500] text-[#000000] py-3 rounded-lg font-bold shadow-md hover:bg-[#FDD835] transition-colors flex items-center justify-center gap-2"
                        >
                            💬 카카오톡 공유
                        </button>
                        <button
                            onClick={copyLink}
                            className="flex-1 bg-[#E8E4D9] text-[#5C4D41] py-3 rounded-lg font-bold shadow-md hover:bg-[#D6CFC7] transition-colors flex items-center justify-center gap-2"
                        >
                            🔗 링크 복사 (Insta)
                        </button>
                    </div>

                    <button onClick={() => window.location.reload()} className="w-full text-[#9C8F80] text-sm font-serif underline hover:text-[#8B5E3C] transition-colors">
                        처음으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    // 4️⃣ 설문 화면
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#FDFBF7] p-4 text-[#4A4036]">
            <div className="w-full max-w-md">
                <div className="w-full bg-[#E8E4D9] h-2 rounded-full mb-6 overflow-hidden">
                    <div className="bg-[#8B5E3C] h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="mb-8 flex justify-between text-xs font-serif text-[#9C8F80] border-b border-[#D6CFC7] pb-2">
                    {/* ✨ 길이를 QUESTIONS 배열에서 동적으로 가져오기 */}
                    <span>Q. {step + 1}</span>
                    <span>{QUESTIONS.length}</span>
                </div>
                <h2 className="text-2xl font-serif font-medium mb-12 text-center leading-relaxed text-[#5C4D41]">
                    {/* ✨ QUESTIONS 객체에서 text 프로퍼티를 꺼내서 렌더링 */}
                    {QUESTIONS[step].text}
                </h2>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((score) => (
                        <button key={score} onClick={() => handleSelect(score)} className="w-full py-4 border border-[#D6CFC7] bg-white hover:border-[#8B5E3C] hover:bg-[#FAF9F6] transition-all text-[#6E6359] font-serif text-sm tracking-wide shadow-sm">
                            {score === 1 && "전혀 아니다"}
                            {score === 2 && "아니다"}
                            {score === 3 && "보통이다"}
                            {score === 4 && "그렇다"}
                            {score === 5 && "매우 그렇다"}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}