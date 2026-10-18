import type { SoulRecord } from '../storage/recordStore';

const CHART_POINTS = 10;
const W = 300;
const H = 140;
const PAD = { top: 12, right: 12, bottom: 24, left: 28 };

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
};

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

function TrendChart({ records }: { records: SoulRecord[] }) {
    const points = records.slice(-CHART_POINTS);
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = (v: number) => PAD.top + (1 - v / 100) * innerH;
    const path = (key: 'innerBattery' | 'outerBattery') =>
        points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
             aria-label={`최근 ${points.length}번의 겉 배터리와 속 배터리 변화`}>
            {[0, 50, 100].map((v) => (
                <g key={v}>
                    <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#E8E4D9" strokeWidth="1" />
                    <text x={PAD.left - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#9C8F80">{v}</text>
                </g>
            ))}
            <path d={path('outerBattery')} fill="none" stroke="#B0A396" strokeWidth="1.5" strokeDasharray="4 3" />
            <path d={path('innerBattery')} fill="none" stroke="#8B5E3C" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
                <g key={p.id}>
                    <circle cx={x(i)} cy={y(p.innerBattery)} r="3" fill="#8B5E3C">
                        <title>{`${formatDate(p.createdAt)} 속 ${p.innerBattery}% / 겉 ${p.outerBattery}%`}</title>
                    </circle>
                    {(points.length <= 6 || i === 0 || i === points.length - 1) && (
                        <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#9C8F80">{formatDate(p.createdAt)}</text>
                    )}
                </g>
            ))}
        </svg>
    );
}

export default function HistoryCard({ records, onClear }: { records: SoulRecord[]; onClear: () => void }) {
    if (records.length === 0) return null;

    const latest = records[records.length - 1];
    const previous = records.length > 1 ? records[records.length - 2] : null;
    const innerDelta = previous ? latest.innerBattery - previous.innerBattery : 0;

    const handleClear = () => {
        if (window.confirm('이 기기에 저장된 점검 기록을 모두 지울까요?')) onClear();
    };

    return (
        <div className="mb-8 p-5 bg-[#FAFAF5] border border-[#E8E4D9] rounded-sm font-serif">
            <h3 className="text-sm font-bold text-[#5C4D41] mb-3 text-center">나의 배터리 기록</h3>

            {previous ? (
                <>
                    <p className="text-center text-sm text-[#5C4D41] mb-4">
                        지난 점검보다 속 배터리가{' '}
                        <span className={`font-bold ${innerDelta >= 0 ? 'text-green-700' : 'text-[#8B5E3C]'}`}>
                            {signed(innerDelta)}%p
                        </span>{' '}
                        {innerDelta > 0 ? '채워졌어요.' : innerDelta < 0 ? '줄었어요.' : '그대로예요.'}
                    </p>
                    <TrendChart records={records} />
                    <div className="flex justify-center gap-4 text-[11px] text-[#9C8F80] mt-2">
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-4 h-[3px] bg-[#8B5E3C] rounded" /> 속 배터리
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-4 border-t-2 border-dashed border-[#B0A396]" /> 겉 배터리
                        </span>
                    </div>
                </>
            ) : (
                <p className="text-center text-sm text-[#6E6359] leading-relaxed">
                    첫 기록이 저장됐어요.<br />며칠 뒤 다시 점검하면 배터리가 어떻게 변했는지 보여드릴게요.
                </p>
            )}

            <div className="flex justify-between items-center gap-3 mt-4 pt-3 border-t border-[#E8E4D9] text-[11px] text-[#9C8F80]">
                <span>기록은 이 기기의 브라우저에만 저장돼요.</span>
                <button onClick={handleClear} className="shrink-0 whitespace-nowrap underline hover:text-[#8B5E3C]">기록 지우기</button>
            </div>
        </div>
    );
}
