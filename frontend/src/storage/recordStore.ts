/**
 * 점검 기록 저장소.
 *
 * 지금은 로그인 없이 브라우저(localStorage)에만 저장한다.
 * 나중에 로그인을 붙이면 같은 인터페이스로 서버 저장소(ServerRecordStore)를 만들어 바꿔 끼우고,
 * 로그인 시점에 LocalRecordStore의 기록을 서버로 옮긴 뒤 비우면 된다.
 * 그래서 서버 호출처럼 모든 메서드를 비동기로 둔다.
 */
export type SoulRecord = {
    id: string;
    createdAt: string;     // ISO 8601
    typeCode: string;
    typeName: string;
    symbol: string;
    outerBattery: number;
    innerBattery: number;
    openness: number;
    userGuess: number;     // 점검 전에 스스로 예상한 배터리
};

export type NewSoulRecord = Omit<SoulRecord, 'id' | 'createdAt'>;

export interface RecordStore {
    /** 오래된 순으로 정렬된 전체 기록 */
    list(): Promise<SoulRecord[]>;
    add(record: NewSoulRecord): Promise<SoulRecord>;
    clear(): Promise<void>;
}

const STORAGE_KEY = 'soulbattery.records.v1';
const MAX_RECORDS = 100;

const newId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const isRecord = (value: unknown): value is SoulRecord => {
    if (typeof value !== 'object' || value === null) return false;
    const r = value as Record<string, unknown>;
    return typeof r.id === 'string'
        && typeof r.createdAt === 'string'
        && typeof r.innerBattery === 'number'
        && typeof r.outerBattery === 'number';
};

export class LocalRecordStore implements RecordStore {
    private read(): SoulRecord[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed: unknown = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
        } catch {
            // 사생활 보호 모드, 저장소 차단, 깨진 데이터 등
            return [];
        }
    }

    private write(records: SoulRecord[]) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
        } catch {
            // 저장에 실패해도 점검 결과 화면은 그대로 보여준다
        }
    }

    async list() {
        return this.read().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    async add(record: NewSoulRecord) {
        const saved: SoulRecord = { ...record, id: newId(), createdAt: new Date().toISOString() };
        this.write([...(await this.list()), saved]);
        return saved;
    }

    async clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // 무시
        }
    }
}

export const recordStore: RecordStore = new LocalRecordStore();
