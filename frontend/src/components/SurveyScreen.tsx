import { useState, useEffect } from 'react';

declare global {
  interface Window {
    IMP: any;
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

  const [freeContent, setFreeContent] = useState("");
  const [paidContent, setPaidContent] = useState("");
  const [typedText, setTypedText] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  const questions = [
    "일어났는데 몸이 천근만근이다.",
    "밥을 먹어도 소화가 잘 안 된다.",
    "자주 멍을 때리고 집중이 안 된다.",
    "잠을 자도 피곤이 풀리지 않는다.",
    "작은 소리에도 예민하게 반응한다.",
    "별거 아닌 일에 짜증이 확 난다.",
    "사람 만나는 게 귀찮고 피하고 싶다.",
    "미래에 대한 막연한 불안감이 있다.",
    "과거의 실수가 자꾸 떠오른다.",
    "감정 기복이 심해졌다.",
    "주말에 아무것도 안 하고 누워만 있다.",
    "취미 생활을 할 의욕이 없다.",
    "방 정리를 미루고 쌓아두고 있다.",
    "연락이 와도 답장하기가 귀찮다.",
    "새로운 것을 시작하기가 두렵다."
  ];

  const progress = ((step + 1) / questions.length) * 100;

  const handleSelect = (score: number) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      submitSurvey(newAnswers);
    }
  };

  const submitSurvey = async (finalAnswers: number[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/analysis/submit', {
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

      setFreeContent(publicText);
      setPaidContent(hiddenText);

      let i = 0;
      setTypedText("");

      const typingInterval = setInterval(() => {
        if (i < publicText.length) {
          const char = publicText.charAt(i);
          setTypedText((prev) => prev + char);
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, 30);

      return () => clearInterval(typingInterval);
    }
  }, [result]);

  const handlePayment = () => {
      if (!window.IMP) return;
      const { IMP } = window;

      // .env에서 식별코드 가져오기
      const PORTONE_CODE = import.meta.env.VITE_PORTONE_CODE;
      IMP.init(PORTONE_CODE);

      IMP.request_pay({
        pg: 'html5_inicis',       // KG이니시스 (테스트 환경)
        pay_method: 'card',       // 카드 결제
        merchant_uid: `mid_${new Date().getTime()}`, // 주문번호
        name: '마음 심화 처방전',   // 상품명
        amount: 800,              // 가격
        buyer_email: 'test@soulbattery.com',
        buyer_name: '테스터',
      }, (rsp: any) => {
        // 👇 여기가 핵심! (엄격한 검사 모드)
        if (rsp.success) {
          // 1. 진짜 결제 성공했을 때만!
          alert("결제 성공! 🔓 심화 처방전이 열립니다.");
          setIsPaid(true); // 자물쇠 해제
        } else {
          // 2. 결제 실패하거나 취소했을 때
          alert(`결제가 취소되었습니다.\n(사유: ${rsp.error_msg})`);
          setIsPaid(false); // 절대 열어주지 않음!
        }
      });
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
          <div className="space-y-4 font-serif text-[#6E6359] leading-relaxed text-sm mb-10">
            <p>"소울 배터리에 오신 걸 환영해요."</p>
            <p>당신의 마음 배터리가<br/>얼마나 남았는지 확인해 드릴게요.</p>
            <p>솔직하게 답해주시면,<br/>당신만을 위한 <span className="text-[#8B5E3C] font-bold">마음 처방전</span>을 드립니다.</p>
            <p className="text-xs text-[#9C8F80] mt-4">* 편안한 마음으로 시작해 보세요 *</p>
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
        <p className="text-sm mt-2 text-[#B0A396] font-serif">당신의 마음 온도를 기록하고 있어요.</p>
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

          <div className="bg-[#FAFAF5] p-6 rounded-sm border border-[#E8E4D9] mb-6 shadow-sm">
            <h3 className="text-md font-serif font-bold text-[#8B5E3C] mb-4 flex items-center">
              <span className="mr-2 text-xl">📋</span> 마음 진단서
            </h3>
            <p className="text-[#5C4D41] leading-loose font-serif whitespace-pre-wrap text-md">
              {typedText}
              <span className="animate-pulse text-[#8B5E3C]">|</span>
            </p>
          </div>

          <div className={`relative overflow-hidden rounded-sm border border-[#E8E4D9] transition-colors duration-500 ${isPaid ? 'bg-white' : 'bg-gray-50'}`}>
            <div className={`p-6 transition-all duration-700 ${isPaid ? '' : 'filter blur-[5px] opacity-60 select-none'}`}>
               <h3 className="text-md font-serif font-bold text-[#8B5E3C] mb-4">💊 심화 처방전</h3>
               <p className="text-[#5C4D41] leading-loose font-serif whitespace-pre-wrap text-sm">
                 {paidContent}
               </p>
            </div>

            {!isPaid && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[1px]">
                <div className="text-2xl mb-2 animate-bounce">🔒</div>
                <p className="text-[#5C4D41] font-serif mb-4 text-sm font-bold opacity-80">나만을 위한 심화 솔루션이 있어요</p>
                <button
                  onClick={handlePayment}
                  className="px-8 py-3 bg-[#8B5E3C] text-white font-serif rounded-full hover:bg-[#6D4C32] transition-all shadow-md transform hover:scale-105 flex items-center"
                >
                  심화 처방전 열기 (₩800)
                </button>
              </div>
            )}
          </div>

          <button onClick={() => window.location.reload()} className="w-full mt-10 text-[#9C8F80] text-sm font-serif underline hover:text-[#8B5E3C] transition-colors">
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
          <span>Q. {step + 1}</span>
          <span>{questions.length}</span>
        </div>
        <h2 className="text-2xl font-serif font-medium mb-12 text-center leading-relaxed text-[#5C4D41]">
          {questions[step]}
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