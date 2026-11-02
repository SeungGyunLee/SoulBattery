import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * 처방전을 기다리는 동안 보여주는 시골 마을의 하루.
 * 새벽 → 아침 들판 → 한낮 오두막 → 오후 툇마루 → 해질녘 순서로 시간이 흐르고,
 * 결과가 도착하면 밤의 우체통 장면을 보여준 뒤 결과 화면으로 넘어간다.
 * 결과가 늦어지면 해질녘 장면에 머물며 기다린다 (아침으로 되돌아가지 않음).
 */

const SCENE_MS = 3400;      // 장면 하나가 머무는 시간
const FADE_MS = 1200;       // 장면 사이 전환 시간
const MIN_SHOWN_MS = 1500;  // 결과가 와도 현재 장면은 최소 이만큼 보여준다
const MIN_SCENES = 2;       // 결과가 아무리 빨라도 최소 장면 수
const FINAL_HOLD_MS = 2200; // 우체통 장면을 보여주는 시간
const LEAVE_MS = 900;       // 결과 화면으로 넘어가기 전 페이드아웃

type Scene = { art: ReactNode; caption: string };

/* ---------- 공통 조각 ---------- */

const Sky = ({ id, top, bottom }: { id: string; top: string; bottom: string }) => (
    <>
        <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={top} />
                <stop offset="1" stopColor={bottom} />
            </linearGradient>
        </defs>
        <rect width="360" height="240" fill={`url(#${id})`} />
    </>
);

const Cloud = ({ x, y, s = 1, delay = 0 }: { x: number; y: number; s?: number; delay?: number }) => (
    <g className="sb-cloud" style={{ animationDelay: `${delay}s` }}>
        <g transform={`translate(${x} ${y}) scale(${s})`} fill="#FFFDF8" opacity="0.9">
            <ellipse cx="0" cy="0" rx="22" ry="9" />
            <ellipse cx="14" cy="-6" rx="14" ry="10" />
            <ellipse cx="-10" cy="-4" rx="11" ry="8" />
        </g>
    </g>
);

const Cottage = ({ x, y, s = 1, roof = '#9C5B3E', wall = '#EADBC4', window = '#F2D08A' }:
    { x: number; y: number; s?: number; roof?: string; wall?: string; window?: string }) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
        <rect x="64" y="-6" width="11" height="22" fill="#8B6E5A" />
        <rect x="0" y="22" width="90" height="52" fill={wall} />
        <polygon points="-10,24 45,-12 100,24" fill={roof} />
        <rect x="16" y="38" width="20" height="16" rx="2" fill={window} />
        <line x1="26" y1="38" x2="26" y2="54" stroke={wall} strokeWidth="2" />
        <rect x="54" y="42" width="18" height="32" rx="2" fill="#8B5E3C" />
    </g>
);

/* ---------- 장면 ---------- */

const Dawn = () => (
    <svg viewBox="0 0 360 240" className="w-full h-full" aria-hidden="true">
        <Sky id="sky-dawn" top="#E9D3C9" bottom="#FBEBDD" />
        <defs>
            <filter id="mist-blur" x="-20%" y="-200%" width="140%" height="500%">
                <feGaussianBlur stdDeviation="6" />
            </filter>
        </defs>
        <circle className="sb-rise" cx="196" cy="158" r="30" fill="#F4B48A" />
        <path d="M0 160 Q60 128 120 152 T240 146 T360 156 V240 H0Z" fill="#CFC6B4" />
        <ellipse className="sb-mist" cx="120" cy="166" rx="110" ry="7" fill="#FFF8F0" opacity="0.6" filter="url(#mist-blur)" />
        <ellipse className="sb-mist" cx="280" cy="160" rx="90" ry="6" fill="#FFF8F0" opacity="0.5" filter="url(#mist-blur)" />
        <path d="M0 192 Q90 164 180 186 T360 180 V240 H0Z" fill="#A6B391" />
        <path d="M0 218 Q120 202 240 216 T360 210 V240 H0Z" fill="#82967A" />
        <g className="sb-birds" fill="none" stroke="#7A6656" strokeWidth="1.6" strokeLinecap="round">
            <path d="M232 78 q5 -5 10 0 q5 -5 10 0" />
            <path d="M258 92 q4 -4 8 0 q4 -4 8 0" />
        </g>
    </svg>
);

const Field = () => (
    <svg viewBox="0 0 360 240" className="w-full h-full" aria-hidden="true">
        <Sky id="sky-field" top="#CFE2E4" bottom="#F5F1E4" />
        <circle cx="300" cy="52" r="16" fill="#F5D88F" />
        <Cloud x={70} y={56} />
        <Cloud x={210} y={40} s={0.8} delay={-6} />
        <path d="M0 150 Q80 124 170 146 T360 140 V240 H0Z" fill="#B9C79F" />
        <rect x="0" y="164" width="360" height="76" fill="#E3CC8A" />
        {[176, 190, 206, 224].map((y) => (
            <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="#D2B871" strokeWidth="2" />
        ))}
        <polygon points="164,164 196,164 250,240 110,240" fill="#D8C3A0" />
        <g stroke="#7E9672" strokeWidth="2.2" strokeLinecap="round" fill="none">
            {[12, 30, 46, 70, 292, 312, 330, 348].map((x, i) => (
                <path key={x} className="sb-sway" style={{ animationDelay: `${(i % 4) * -0.6}s` }}
                      d={`M${x} 240 q-3 -14 ${i % 2 ? 4 : -4} -26`} />
            ))}
        </g>
    </svg>
);

const Noon = () => (
    <svg viewBox="0 0 360 240" className="w-full h-full" aria-hidden="true">
        <Sky id="sky-noon" top="#D7E7EA" bottom="#F7F3E8" />
        <Cloud x={280} y={48} s={0.9} delay={-3} />
        <path d="M0 170 Q100 140 200 162 T360 158 V240 H0Z" fill="#AFC096" />
        <rect x="0" y="196" width="360" height="44" fill="#91A87F" />
        <rect x="70" y="128" width="9" height="62" fill="#7B5E48" />
        <circle cx="74" cy="118" r="30" fill="#6F8C62" />
        <circle cx="54" cy="132" r="18" fill="#7E9A70" />
        <g className="sb-smoke-group">
            {[0, 1, 2].map((i) => (
                <circle key={i} className="sb-smoke" style={{ animationDelay: `${i * 1.1}s` }}
                        cx="218" cy="104" r="6" fill="#FFFDF8" />
            ))}
        </g>
        <Cottage x={150} y={122} />
        <path d="M204 196 Q214 216 196 240 H226 Q236 214 222 196Z" fill="#D8C3A0" />
    </svg>
);

const Porch = () => (
    <svg viewBox="0 0 360 240" className="w-full h-full" aria-hidden="true">
        <Sky id="sky-porch" top="#F1DFC3" bottom="#FAF3E6" />
        <path d="M0 150 Q90 126 190 144 T360 136 V200 H0Z" fill="#C7BE96" />
        <rect x="0" y="170" width="360" height="70" fill="#B98C62" />
        {[186, 204, 222].map((y) => (
            <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="#A27750" strokeWidth="2" />
        ))}
        <rect x="18" y="0" width="16" height="174" fill="#9C724D" />
        <rect x="0" y="0" width="360" height="14" fill="#9C724D" />
        <ellipse cx="150" cy="196" rx="44" ry="7" fill="#E8DCC6" />
        <path d="M128 168 h40 v14 a18 12 0 0 1 -40 0z" fill="#F6EEDF" />
        <path d="M168 172 q12 2 4 12" fill="none" stroke="#F6EEDF" strokeWidth="4" />
        <g fill="none" stroke="#FFFDF8" strokeWidth="2.4" strokeLinecap="round">
            {[138, 150, 160].map((x, i) => (
                <path key={x} className="sb-steam" style={{ animationDelay: `${i * 0.7}s` }}
                      d={`M${x} 162 q-5 -8 0 -16 q5 -8 0 -16`} />
            ))}
        </g>
        <g className="sb-breathe" fill="#7D6A5C">
            <ellipse cx="270" cy="186" rx="34" ry="16" />
            <circle cx="244" cy="180" r="12" />
            <polygon points="236,172 238,160 246,170" />
            <polygon points="248,170 254,160 256,174" />
            <path d="M302 190 q16 2 8 -12" fill="none" stroke="#7D6A5C" strokeWidth="6" strokeLinecap="round" />
        </g>
    </svg>
);

const Dusk = () => (
    <svg viewBox="0 0 360 240" className="w-full h-full" aria-hidden="true">
        <Sky id="sky-dusk" top="#9C8AAE" bottom="#F2B98F" />
        <circle cx="262" cy="170" r="32" fill="#EE9A6A" />
        <path d="M0 164 Q80 140 170 158 T360 154 V240 H0Z" fill="#7A846D" />
        <Cottage x={60} y={124} s={0.8} roof="#5E4A43" wall="#6E6458" window="#F7D27A" />
        <path d="M0 204 Q120 188 240 202 T360 196 V240 H0Z" fill="#59654F" />
        {[[120, 120], [168, 150], [206, 128], [300, 112], [330, 150], [96, 176], [250, 186]].map(([x, y], i) => (
            <circle key={i} className="sb-glow" style={{ animationDelay: `${i * 0.45}s` }}
                    cx={x} cy={y} r="2.6" fill="#FCEBA0" />
        ))}
    </svg>
);

const Mailbox = () => (
    <svg viewBox="0 0 360 240" className="w-full h-full" aria-hidden="true">
        <Sky id="sky-night" top="#3F4A69" bottom="#706F8C" />
        {[[40, 40], [90, 70], [150, 30], [220, 58], [300, 36], [330, 84], [260, 96]].map(([x, y], i) => (
            <circle key={i} className="sb-twinkle" style={{ animationDelay: `${i * 0.5}s` }}
                    cx={x} cy={y} r="1.6" fill="#FFF6DA" />
        ))}
        <circle cx="290" cy="56" r="16" fill="#F7EBC6" />
        <circle cx="298" cy="50" r="15" fill="#4A5272" />
        <path d="M0 180 Q120 160 240 176 T360 170 V240 H0Z" fill="#3E4B3E" />
        <Cottage x={34} y={118} s={0.7} roof="#3B3236" wall="#4E4A4A" window="#F7D27A" />
        <defs>
            <radialGradient id="letter-glow">
                <stop offset="0" stopColor="#F7D27A" stopOpacity="0.55" />
                <stop offset="1" stopColor="#F7D27A" stopOpacity="0" />
            </radialGradient>
        </defs>
        <circle className="sb-halo" cx="220" cy="118" r="46" fill="url(#letter-glow)" />
        <rect x="218" y="146" width="8" height="70" fill="#6B4A36" />
        <rect x="196" y="116" width="52" height="34" rx="10" fill="#B85C45" />
        <rect x="244" y="104" width="4" height="22" fill="#6B4A36" />
        <rect x="244" y="104" width="14" height="9" fill="#F2C46D" />
        <g className="sb-letter">
            <rect x="200" y="106" width="30" height="20" rx="2" fill="#FFF8E7" />
            <path d="M200 106 l15 11 l15 -11" fill="none" stroke="#D9C6A5" strokeWidth="1.5" />
        </g>
    </svg>
);

const SCENES: Scene[] = [
    { art: <Dawn />, caption: '새벽 공기를 마시며 당신의 답변을 펼쳐 봐요' },
    { art: <Field />, caption: '들판을 걸으며 겉 배터리를 살펴보고 있어요' },
    { art: <Noon />, caption: '굴뚝 연기처럼 천천히, 속 배터리를 읽고 있어요' },
    { art: <Porch />, caption: '차 한 잔 우리는 동안 처방전을 적고 있어요' },
    { art: <Dusk />, caption: '해가 지는 동안 마지막 문장을 다듬고 있어요' },
];
const FINAL: Scene = { art: <Mailbox />, caption: '처방전이 도착했어요' };

type Props = {
    /** 분석 결과가 도착했는지 */
    ready: boolean;
    /** 마지막 장면까지 끝나고 결과 화면으로 넘어갈 때 */
    onFinish: () => void;
};

export default function CountrysideJourney({ ready, onFinish }: Props) {
    const [index, setIndex] = useState(0);
    const [final, setFinal] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const sceneStart = useRef(0);
    const finishRef = useRef(onFinish);

    useEffect(() => {
        finishRef.current = onFinish;
    }, [onFinish]);

    useEffect(() => {
        sceneStart.current = Date.now();
    }, [index, final]);

    useEffect(() => {
        const elapsed = Date.now() - sceneStart.current;
        const timers: number[] = [];
        const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, Math.max(0, ms)));

        if (final) {
            later(() => setLeaving(true), FINAL_HOLD_MS);
            later(() => finishRef.current(), FINAL_HOLD_MS + LEAVE_MS);
        } else if (ready && index >= MIN_SCENES - 1) {
            later(() => setFinal(true), MIN_SHOWN_MS - elapsed);
        } else if (index < SCENES.length - 1) {
            later(() => setIndex((i) => i + 1), SCENE_MS - elapsed);
        }
        // 마지막(해질녘) 장면에서 결과가 아직이면 그대로 머문다
        return () => timers.forEach((t) => window.clearTimeout(t));
    }, [index, final, ready]);

    const current = final ? FINAL : SCENES[index];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFBF7] px-4">
            <div className={`w-full max-w-md transition-opacity duration-700 ${leaving ? 'opacity-0' : 'opacity-100'}`}>
                <div className="relative w-full aspect-[3/2] overflow-hidden rounded-2xl border border-[#E8E4D9] shadow-md bg-[#FBEBDD]">
                    {[...SCENES, FINAL].map((scene, i) => {
                        const active = final ? i === SCENES.length : i === index;
                        return (
                            <div key={i}
                                 className="absolute inset-0 transition-opacity ease-in-out"
                                 style={{ opacity: active ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}>
                                {scene.art}
                            </div>
                        );
                    })}
                </div>

                <p key={current.caption} role="status" aria-live="polite"
                   className="sb-caption mt-6 text-center font-serif text-[#5C4D41] text-base leading-relaxed min-h-[1.75rem]">
                    {current.caption}
                </p>
                {!final && (
                    <p className="mt-2 text-center text-xs font-serif text-[#B0A396]">
                        보통 10~20초 정도 걸려요
                    </p>
                )}
            </div>
        </div>
    );
}
