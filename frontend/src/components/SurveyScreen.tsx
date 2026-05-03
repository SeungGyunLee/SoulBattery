import { useState, useEffect, type ChangeEvent } from 'react'
import { QUESTIONS } from '../constants/questions'; // ✨ 외부 질문 리스트 불러오기

// 카카오 SDK 타입 정의 (TS 에러 방지)
declare global {
    interface Window {
        Kakao: any;
    }
}

export default function SurveyScreen() {
    const [showIntro, setShowIntro] = useState(true);
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        animal: string;
        description: string;
        aiComment: string;
    } | null>(null);

    // 사용자가 생각하는 배터리 & 실제 배터리
    const [userGuess, setUserGuess] = useState(50);
    const [actualBattery, setActualBattery] = useState(0);

    const [paidContent, setPaidContent] = useState("");
    const [typedText, setTypedText] = useState("");

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
                'TITLE': `🔋 내 마음 배터리: ${actualBattery}%`,
                'DESC': `나는 [${result?.animal}] 유형입니다.\n친구들도 내 배터리를 확인해보세요!`,
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
        setLoading(true);

        // 배터리 계산 로직
        const totalScore = finalAnswers.reduce((acc, curr) => acc + curr, 0);
        const maxScore = QUESTIONS.length * 5;
        const minScore = QUESTIONS.length * 1;

        // ✨ 계산식 수정: 질문이 긍정적이므로 점수가 높을수록 배터리가 100%에 가까워짐
        const calculatedBattery = Math.round(
            ((totalScore - minScore) / (maxScore - minScore)) * 100
        );
        setActualBattery(calculatedBattery);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(apiUrl + '/api/analysis/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: finalAnswers }),
            });
            if (!response.ok) throw new Error('서버 통신 실패');
            const data = await response.json();
            setResult(data);
        } catch (error) {
            alert("문제가 생겼어요. 다시 시도해 주세요.");
            window.location.reload();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (result?.aiComment) {
            const parts = result.aiComment.split('[[PAYWALL]]');
            const publicText = parts[0] ? parts[0].trim() : "분석 결과가 없습니다.";
            const hiddenText = (parts.length > 1 && parts[1].trim().length > 0)
                ? parts[1].trim()
                : "심화 분석 내용을 불러오지 못했습니다.";

            setPaidContent(hiddenText);

            let i = 0;
            setTypedText("");

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
        }
    }, [result]);

    const handleLockedClick = () => {
        alert("🚧 현재 심화 처방전은 준비 중입니다.\n조금만 기다려주세요!");
    };

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
                </div>
            </div>
        );
    }

    // 2️⃣ 로딩 화면
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#FDFBF7] text-[#4A4036] fade-in">
                <div className="animate-bounce text-4xl mb-4">☕</div>
                <h2 className="text-xl font-serif tracking-widest text-[#8C7B6C]">진단서 작성 중...</h2>
                <p className="text-sm mt-2 text-[#B0A396] font-serif">당신의 답변을 분석하고 있습니다.</p>
            </div>
        );
    }

    // 3️⃣ 결과 화면
    if (result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFBF7] p-6 fade-in">
                <div className="max-w-2xl w-full bg-white p-8 shadow-xl border border-[#E8E4D9] relative">

                    <div className="text-center mb-8 border-b-2 border-dashed border-[#D6CFC7] pb-6">
                        <span className="text-xs font-serif text-[#9C8F80] tracking-[0.2em] uppercase">Diagnosis Result</span>
                        <h1 className="text-3xl font-serif font-bold mt-3 text-[#5C4D41]">
                            당신은 <span className="text-[#8B5E3C] underline decoration-[#D6CFC7] underline-offset-4">[{result.animal}]</span> 입니다.
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

                        {/* 실제 결과 */}
                        <div>
                            <div className="flex justify-between text-xs mb-1 text-[#8B5E3C] font-bold">
                                <span>실제 진단</span>
                                <span>{actualBattery}%</span>
                            </div>
                            <div className="w-full bg-[#E8E4D9] h-3 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${actualBattery < 30 ? 'bg-red-400' : actualBattery < 70 ? 'bg-[#8B5E3C]' : 'bg-green-600'}`}
                                    style={{ width: `${actualBattery}%` }}>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-xs text-[#9C8F80] mt-4 font-serif">
                            {Math.abs(userGuess - actualBattery) > 20
                                ? "생각하신 것과 실제 마음의 상태가 많이 다르네요. 😢"
                                : "자신의 상태를 아주 잘 파악하고 계시네요! 👍"}
                        </p>
                    </div>

                    <div className="bg-[#FAFAF5] p-6 rounded-sm border border-[#E8E4D9] mb-6 shadow-sm">
                        <h3 className="text-md font-serif font-bold text-[#8B5E3C] mb-4 flex items-center">
                            <span className="mr-2 text-xl">📋</span> 마음 정밀 진단
                        </h3>
                        <p className="text-[#5C4D41] leading-loose font-serif whitespace-pre-wrap text-md">
                            {typedText}
                            <span className="animate-pulse text-[#8B5E3C]">|</span>
                        </p>
                    </div>

                    <div className={`relative overflow-hidden rounded-sm border border-[#E8E4D9] transition-colors duration-500 bg-gray-50 mb-8`}>
                        <div className={`p-6 filter blur-[5px] opacity-60 select-none`}>
                            <h3 className="text-md font-serif font-bold text-[#8B5E3C] mb-4">💊 심화 솔루션</h3>
                            <p className="text-[#5C4D41] leading-loose font-serif whitespace-pre-wrap text-sm">
                                {paidContent}
                            </p>
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[1px]">
                            <div className="text-2xl mb-2">🔒</div>
                            <p className="text-[#5C4D41] font-serif mb-4 text-sm font-bold opacity-80">심화 솔루션 (준비 중)</p>
                            <button
                                onClick={handleLockedClick}
                                className="px-8 py-3 bg-[#9CA3AF] text-white font-serif rounded-full cursor-not-allowed shadow-none"
                            >
                                오픈 예정
                            </button>
                        </div>
                    </div>

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