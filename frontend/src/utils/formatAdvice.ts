/**
 * AI 해설의 줄바꿈 보정.
 * 프롬프트에서 형식을 정해 두지만, 모델이 가끔 항목을 한 줄로 붙여 쓰는 경우가 있어
 * 항목이 바뀌는 지점마다 빈 줄을 넣고 세부 항목('- 언제:' 등)은 각자 줄로 나눈다.
 */
export function formatAdvice(text: string): string {
    return text
        .replace(/\r\n/g, '\n')
        // "첫 번째 루틴:", "두 번째 루틴:" 앞에 빈 줄
        .replace(/\s*((?:첫|두|세|네|다섯) ?번째 루틴\s*[:：])/g, '\n\n$1')
        // "첫째,", "둘째," 같은 항목 시작 앞에 빈 줄 (문장 끝이나 줄 시작 뒤에서만)
        .replace(/([.!?다요]|^)[ \t]*((?:첫째|둘째|셋째|넷째)[,，:]\s)/gm, '$1\n\n$2')
        // "1. ", "2. " 번호 항목이 문장 뒤에 붙어 있으면 빈 줄로 분리
        .replace(/([.!?다요])[ \t]+([1-9]\.\s)/g, '$1\n\n$2')
        // 세부 항목 "- 언제:" 등이 앞 문장에 붙어 있으면 줄 바꿈
        .replace(/([^\n])[ \t]+(- (?:언제|어떻게|1주차와 2주차|왜 도움이 되나|이렇게 확인해요|못 한 날에는)\s*:)/g, '$1\n$2')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export type RoutineBlock = { title: string | null; body: string };

/** 루틴 글을 '첫 번째 루틴' 같은 제목과 본문 묶음으로 나눈다. */
export function splitRoutines(text: string): RoutineBlock[] {
    return formatAdvice(text)
        .split(/\n{2,}/)
        .map((block) => {
            const [first, ...rest] = block.split('\n');
            return /^(?:첫|두|세|네|다섯) ?번째 루틴/.test(first.trim())
                ? { title: first.trim(), body: rest.join('\n').trim() }
                : { title: null, body: block.trim() };
        })
        .filter((b) => b.title || b.body);
}
