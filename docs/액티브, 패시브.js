// 공용 스킬 사양서
// 모든 값은 스킬 엔진(SkillEngine)에서 사용 가능한 형태를 기준으로 정리했다.

export const activeSkills = [
    {
        id: 'charge',
        name: '차지',
        icon: 'assets/images/skills/charge.png',
        manaCost: 12,
        cooldown: 3,
        range: '4~6타일 (맨해튼)',
        damage: '120% 물리 피해',
        animation: '잔상을 남기며 돌진',
        effect: '대상 인접 타일까지 돌진 후 즉시 피해 적용',
        userNotes: [
            '플레이어: 가장 가까운 적을 자동 조준, Q/W 단축키에 할당 가능',
            '센티넬: 시야 내 적을 발견하면 우선 사용',
            '몬스터/다른 용병: 스킬 AI 매니저가 동일 규칙으로 처리'
        ]
    }
];

export const passiveSkills = [
    // 현재 패시브 스킬 없음. 추가 시 위 구조를 따라 기재.
];
