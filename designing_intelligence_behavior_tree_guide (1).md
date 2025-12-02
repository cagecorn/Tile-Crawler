지능의 설계: 확장 가능한 게임 AI를 위한 행동 트리 설계 및 구현 종합 가이드
제 1장: 상태 기반 로직에서 행동 트리로의 패러다임 전환
1.1. 모노리스 해체: switch 기반 AI와 유한 상태 기계(FSM)의 내재적 한계
게임 개발 프로젝트가 성장함에 따라, 초기에는 효율적이었던 AI 로직이 유지보수의 악몽으로 변하는 것은 흔한 일입니다. 특히 switch 문을 사용하여 AI의 상태를 관리하는 ClassAIManager와 같은 접근 방식은 본질적으로 유한 상태 기계(Finite State Machine, FSM)의 절차적 구현에 해당합니다. FSM은 개념이 단순하고 직관적이어서 소규모 AI 설계에 널리 사용되지만 , 시스템의 복잡성이 증가하면 심각한 구조적 문제에 직면하게 됩니다.   

가장 큰 문제는 "스파게티 코드" 현상입니다. AI가 가질 수 있는 상태(예: 대기, 순찰, 공격, 도주)와 스킬의 종류가 늘어날수록, 각 상태에서 다른 상태로 전환(transition)될 수 있는 경우의 수가 기하급수적으로 증가합니다. FSM의 근본적인 설계에서는 각 상태가 다른 상태로 언제, 어떻게 전환될지에 대한 로직을 스스로 내부에 포함하고 있어야 합니다. 예를 들어, '공격' 상태는 '대기' 상태로 돌아갈 조건, '도주' 상태로 전환될 조건, '추격' 상태로 넘어갈 조건 등을 모두 알고 있어야 합니다. 이러한 구조는 각 상태를 다른 모든 잠재적 상태와 강하게 결합(tightly coupled)시켜, 작은 수정이 예기치 않은 버그를 유발하는 취약한 시스템을 만듭니다.   

이 문제를 일부 완화하기 위해 계층적 유한 상태 기계(Hierarchical FSM, HFSM)가 등장했습니다. HFSM은 상태를 계층적으로 구성하여 구조를 개선하지만 , 근본적인 문제는 해결하지 못합니다. HFSM 역시 상태를 모듈화하거나 다른 맥락에서 재사용하는 기능을 본질적으로 제공하지 않으며, 전이 로직이 여전히 상태 내에 존재하여 유지보수 비용이 높습니다. 결국, 상태와 전이가 복잡하게 얽힌 거대한 FSM은 개발자가 전체 구조를 한눈에 파악하고 관리하기 어렵게 만듭니다.   

1.2. 행동 트리 소개: 새로운 제어의 중심
행동 트리(Behavior Tree, BT)는 이러한 FSM의 한계를 극복하기 위해 등장한 계층적 의사결정 모델입니다. BT는 모듈성(modularity)과 반응성(reactivity)을 통해 복잡한 AI 로직을 효과적으로 관리합니다.   

BT와 FSM의 가장 결정적인 차이는 '제어의 위치(Locus of Control)'에 있습니다. FSM에서는 전이 로직이 각 '상태' 내부에 존재하지만, BT에서는 행동을 수행하는 '리프 노드(Leaf Node)'에 전이 로직이 없습니다. 대신, 의사결정 로직은    

트리의 계층적 구조 자체에 존재하며, 복합 노드(Composite Node)에 의해 관리됩니다. 이러한 구조적 차이는 AI 설계에 대한 근본적인 사고방식의 전환을 요구합니다.

FSM 기반 AI를 설계할 때는 "현재 내가 '공격' 상태에 있다면, 어떤 조건에서 '도주' 상태나 '대기' 상태로 가야 하는가?"를 고민합니다. 즉, 로직이 상태 중심적입니다. 반면, BT 기반 AI를 설계할 때는 "현재 월드의 상황을 고려할 때, 내가 지금 당장 수행해야 할 가장 높은 우선순위의 행동은 무엇인가?"를 고민합니다. 로직이 상황 중심적이며 계층적입니다.

이러한 설계 철학의 변화는 각 행동을 서로 독립적으로 만듭니다. '공격' 행동 노드는 '도주' 행동에 대해 전혀 알 필요가 없습니다. 대신, 트리의 상위에 위치한 '셀렉터(Selector)' 노드가 현재 AI의 체력(상황)을 확인하여 '도주' 행동을 실행할지, 아니면 '공격' 행동을 실행할지를 결정합니다. 이로 인해 행동은 하드코딩된 로직이 아닌, 데이터 기반으로 구동될 수 있게 되어 유연성과 재사용성이 극대화됩니다. 개발자는 상태 간의 복잡한 전이 관계를 설계하는 대신, 행동의 우선순위 계층을 설계하는 데 집중하게 됩니다. 이는 BT를 성공적으로 도입하고, BT를 이용해 또 다른 FSM을 만들려는 흔한 함정을 피하는 가장 중요한 핵심 개념입니다.   

1.3. 비교 분석: 확장성 측면에서 BT가 뛰어난 이유
FSM과 BT의 차이점을 명확히 이해하기 위해 주요 특징을 비교하면 다음과 같습니다.

반응성 대 명시적 전이: FSM의 상태 전이는 명시적으로 연결되어야 합니다. 반면 BT는 본질적으로 반응성이 뛰어납니다. 매 '틱(tick)'마다 트리의 루트에서부터 평가를 시작하거나, 특정 이벤트에 의해 인터럽트(interrupt)되어 현재 상황에 가장 적합한 최우선 순위 행동을 동적으로 선택합니다.   

모듈성: BT의 서브트리(sub-tree)는 그 자체로 완결된 행동 모듈입니다. 예를 들어, '순찰' 서브트리는 독립적으로 개발 및 테스트가 가능하며, 여러 다른 종류의 AI에 쉽게 재사용될 수 있습니다. FSM의 상태는 강한 결합으로 인해 이렇게 재사용하기가 어렵습니다.   

유지보수성: FSM의 디버깅은 복잡하게 얽힌 전이의 흐름을 추적하는 과정이지만 , BT의 디버깅은 '틱'이 트리를 따라 내려가는 과정을 시각적으로 따라가는 것이므로 훨씬 직관적입니다. 특히 좋은 시각화 도구와 함께 사용될 때 이 장점은 극대화됩니다.   

이러한 차이점들을 종합하면, BT는 복잡하고 다양한 행동 패턴을 가진 AI를 확장 가능하고 유지보수하기 쉬운 방식으로 구현하는 데 FSM보다 훨씬 우월한 아키텍처임을 알 수 있습니다.

표 1: FSM 대 행동 트리 - 비교 매트릭스

기능	유한 상태 기계 (FSM)	행동 트리 (BT)
핵심 단위	상태 (State)	노드 (Node)
로직 위치	전이 로직이 각 상태 내부에 존재	흐름 로직이 트리의 구조(복합 노드)에 존재
실행 모델	한 번에 하나의 상태에만 머무름	매 '틱'마다 트리를 순회하여 행동을 찾음
확장성	기하급수적으로 복잡해짐 ("스파게티")	선형적으로 확장 가능; 새 분기 추가 용이
재사용성	낮음; 상태들이 강하게 결합됨	높음; 서브트리는 모듈화되어 재사용 가능
반응성	전이를 세심하게 관리하지 않으면 반응이 느릴 수 있음	반응성이 높음; 낮은 우선순위 작업을 중단시킬 수 있음
디버깅	복잡한 전이의 흐름을 추적하기 어려울 수 있음	시각적으로 직관적; 트리의 실행 경로를 따름
제 2장: 행동 트리의 해부학
행동 트리의 강력함은 복잡한 개별 노드가 아닌, 단일 목적을 가진 단순한 노드들의 조합에서 나옵니다. 마치 레고 블록처럼, 간단한 부품들을 어떻게 조립하느냐에 따라 무한한 형태를 만들 수 있는 것과 같습니다. 이 장에서는 행동 트리를 구성하는 핵심적인 '블록'들을 상세히 살펴보겠습니다.   

2.1. 심장 박동: 틱과 세 가지 상태
행동 트리는 '틱(tick)'이라는 신호에 의해 구동됩니다. 틱은 트리의 루트 노드에서 시작하여 아래쪽으로 전파되는 평가 시작 신호입니다. 이 틱은 매 프레임마다 발생할 수도 있고, 특정 이벤트에 의해 촉발될 수도 있습니다. 틱을 받은 각 노드는 자신의 로직을 수행한 후, 부모 노드에게 자신의 상태를 세 가지 중 하나로 보고합니다. 이 세 가지 상태는 트리 전체가 소통하는 언어와 같습니다.   

SUCCESS (성공): 노드가 자신의 목표를 성공적으로 완료했음을 의미합니다.

FAILURE (실패): 노드가 자신의 목표를 달성할 수 없었음을 의미합니다.

RUNNING (실행 중): 노드가 아직 목표를 완료하지 못했으며, 작업을 계속하기 위해 더 많은 시간이 필요함을 의미합니다. 이는 이동, 애니메이션 재생, 스킬 시전과 같이 여러 프레임에 걸쳐 진행되는 행동을 구현하는 데 매우 중요합니다.   

2.2. 잎: 실제 작업이 이루어지는 곳 (액션 & 조건)
리프 노드(Leaf Node)는 트리의 가장 끝에 위치하며, 더 이상 자식 노드를 가질 수 없습니다. 이 노드들은 게임 월드와 직접적으로 상호작용하는 역할을 합니다.   

액션 노드 (Action Nodes): AI나 게임 월드의 상태를 변경하는 실제 작업을 수행합니다. 예를 들어 MoveTo(Target), Attack(Enemy), PlayAnimation(Reload), UseSkill(Fireball) 등이 있습니다. 액션 노드는 작업이 즉시 끝나면    

SUCCESS 또는 FAILURE를, 시간이 더 필요하면 RUNNING을 반환합니다.

조건 노드 (Condition Nodes): 게임 월드의 상태를 확인하고 즉시 SUCCESS 또는 FAILURE를 반환합니다. 이 노드들은 특정 행동을 실행하기 위한 '관문' 역할을 합니다. 예를 들어 IsHealthLow(), IsEnemyVisible(), IsSkillReady() 등이 있습니다. 일부 프레임워크(예: 언리얼 엔진)에서는 조건을 주로 데코레이터 형태로 구현하기도 합니다.   

2.3. 가지: 복합 노드로 로직 구조화하기
복합 노드(Composite Node)는 자식 노드를 가지는 내부 노드로서, 틱의 흐름을 제어하는 역할을 합니다. 이 노드들은 행동 트리의 의사결정 구조를 형성합니다.   

Selector (또는 Fallback): 자식 노드들을 왼쪽에서 오른쪽 순서로 실행하며, 자식 중 하나가 SUCCESS를 반환할 때까지 계속 시도합니다. 만약 한 자식이 FAILURE를 반환하면 다음 자식으로 넘어갑니다. Selector는 자식 중 하나라도 SUCCESS하면 즉시 SUCCESS를 반환하고, 모든 자식이 FAILURE했을 때만 FAILURE를 반환합니다. 이는 논리적 'OR' 게이트와 같아서, 여러 선택지 중 하나를 고르는 데 적합합니다 (예: "공격하라, 만약 할 수 없다면 도망가라").   

Sequence: 자식 노드들을 왼쪽에서 오른쪽 순서로 실행하며, 자식 중 하나가 FAILURE를 반환할 때까지 계속 실행합니다. 만약 한 자식이 SUCCESS를 반환하면 다음 자식으로 넘어갑니다. Sequence는 자식 중 하나라도 FAILURE하면 즉시 FAILURE를 반환하고, 모든 자식이 SUCCESS했을 때만 SUCCESS를 반환합니다. 이는 논리적 'AND' 게이트와 같아서, 순서대로 반드시 수행해야 하는 일련의 작업에 적합합니다 (예: "엄폐물로 이동한 후, 몸을 숙이고, 재장전하라").   

Parallel: 모든 자식 노드를 동시에 실행합니다. 성공/실패 조건은 종종 설정 가능합니다 (예: N개의 자식 중 M개가 성공하면 성공). "무기를 조준하면서 플레이어에게 다가가는" 것과 같은 동시 작업에 유용합니다.   

2.4. 수식어: 데코레이터 노드로 미묘한 제어하기
데코레이터 노드(Decorator Node)는 단 하나의 자식 노드만을 가지며, 그 자식의 행동이나 반환 상태를 수정하는 역할을 합니다.   

Inverter: 자식의 결과를 반전시킵니다. SUCCESS는 FAILURE로, FAILURE는 SUCCESS로 바뀝니다. RUNNING 상태는 영향을 받지 않습니다. "만약 적이 보이지 않는다면(NOT IsEnemyVisible), 순찰하라"와 같은 로직에 필수적입니다.   

Repeater: 자식을 정해진 횟수만큼 또는 특정 조건이 충족될 때까지 반복 실행합니다. 'Shoot' 액션을 세 번 반복하는 '점사(burst fire)' 공격을 구현하는 데 완벽합니다.   

Succeeder/Failer: 자식의 결과와 상관없이 항상 SUCCESS 또는 FAILURE를 반환합니다. Sequence 내에서 선택적인 행동을 구현할 때 유용합니다 (예: "적을 도발하라, 하지만 도발이 실패하더라도 공격 시퀀스는 계속 진행하라").   

Conditional Decorators: 자식 노드의 '관문' 역할을 하여, 특정 조건이 충족될 때만 자식을 실행합니다. 이는 분기문에 직접 조건을 구현하는 일반적인 패턴입니다.   

표 2: 행동 트리 핵심 노드 참조표

노드 타입	카테고리	실행 로직	SUCCESS 반환 조건	FAILURE 반환 조건
Selector	복합	각 자식을 순서대로 시도. 첫 SUCCESS 또는 RUNNING에서 멈춤.	자식 중 하나라도 SUCCESS를 반환할 때.	모든 자식이 FAILURE를 반환할 때.
Sequence	복합	각 자식을 순서대로 시도. 첫 FAILURE 또는 RUNNING에서 멈춤.	모든 자식이 SUCCESS를 반환할 때.	자식 중 하나라도 FAILURE를 반환할 때.
Action	리프	게임 특정 작업을 실행.	작업이 성공적으로 완료되었을 때.	작업을 완료할 수 없을 때.
Condition	리프	게임 특정 조건을 확인.	조건이 참일 때.	조건이 거짓일 때.
Inverter	데코레이터	단일 자식의 결과를 반전시킴.	자식이 FAILURE를 반환할 때.	자식이 SUCCESS를 반환할 때.
Repeater	데코레이터	자식을 N회 또는 특정 조건까지 반복 실행.	자식이 요구된 횟수만큼 완료했을 때.	(설정에 따라 다름).
제 3장: 블랙보드: AI의 중앙 신경계
행동 트리가 AI의 '의사결정 로직'이라면, 블랙보드(Blackboard)는 AI의 '뇌' 또는 '기억'에 해당합니다. 블랙보드는 행동 트리가 효과적으로 작동하기 위한 필수적인 데이터 관리 시스템이며, 지능적이고 분리된 AI를 만드는 데 핵심적인 역할을 합니다.

3.1. 공유 데이터 컨텍스트
블랙보드는 본질적으로 중앙 집중화된 키-값(key-value) 형태의 데이터 저장소입니다. AI가 의사결정을 내리는 데 필요한 모든 동적 정보를 이곳에 저장합니다. 마치 AI의 단기 기억장치처럼 작동하여, 현재 상황에 대한 인식을 유지하고 행동의 근거를 제공합니다.   

블랙보드에 저장되는 일반적인 데이터 유형은 다음과 같습니다 :   

객체 참조: EnemyActor (현재 공격 대상), AllyToProtect (보호할 아군)

불리언 (Boolean): HasLineOfSight (시야에 적이 있는가?), IsUnderAttack (공격받고 있는가?)

벡터 (Vector): PatrolLocation (다음 순찰 지점), LastKnownEnemyPosition (적이 마지막으로 목격된 위치)

열거형 (Enum): CombatState (전투 상태: Engaged, Searching, Withdrawing)

숫자 (Float/Int): HealthPercentage (체력 백분율), AmmoCount (남은 탄약 수)

3.2. 간접 통신을 통한 노드 분리
블랙보드의 가장 중요한 아키텍처적 이점은 노드 간의 결합을 끊어내는(decoupling) 것입니다. 블랙보드가 없다면, '적 찾기' 노드는 찾은 적 정보를 '공격' 노드에게 직접 전달해야 합니다. 이는 두 노드 사이에 강한 의존성을 만듭니다.

하지만 블랙보드를 사용하면 통신이 간접적으로 이루어집니다.   

FindEnemy 액션 노드의 유일한 책임은 주변을 탐색하여 가장 위협적인 적을 찾고, 그 적에 대한 참조를 블랙보드의 EnemyActor 키에 기록하는 것입니다.

Attack 액션 노드의 유일한 책임은 블랙보드의 EnemyActor 키를 읽어서, 해당 대상에게 공격을 수행하는 것입니다.

이 구조에서 Attack 노드는 FindEnemy 노드의 존재 자체를 알 필요가 없습니다. 적을 어떻게 찾았는지(단순 거리 기반인지, 복잡한 시야/청각 시스템 기반인지)에 전혀 관심이 없습니다. 덕분에 개발자는 FindEnemy 로직을 완전히 새로운 시스템으로 교체하더라도 Attack 노드는 단 한 줄도 수정할 필요가 없습니다. 이러한 분리는 AI 시스템의 유연성과 유지보수성을 극적으로 향상시킵니다.

3.3. 효과적인 블랙보드 설계
블랙보드를 잘 설계하면 AI 시스템 전체의 구조가 명확해집니다.

인식, 논리, 행동의 분리: 잘 설계된 BT와 블랙보드 시스템은 자연스럽게 AI의 세 가지 핵심 요소인 인식(Perception), 의사결정(Decision Logic), **행동(Action)**을 분리시킵니다.

인식: 시야, 청각 시스템 또는 언리얼 엔진의 AIPerception 컴포넌트나 Service 노드와 같은 외부 시스템이 월드를 관찰합니다. 이들의 유일한 임무는 블랙보드의 키를 업데이트하는 것입니다 (예: IsPlayerVisible = true, LastKnownPlayerLocation =...).

의사결정: 행동 트리 자체는 순수한 의사결정 로직만을 담고 있습니다. 트리는 블랙보드를 읽어 상황을 파악하고, 그 데이터를 기반으로 무엇을 할지 결정합니다 (예: Selector -> IsPlayerVisible? -> Chase 분기 실행).

행동: 리프 Action 노드들이 실제 행동을 실행합니다. 이들은 블랙보드에서 필요한 데이터를 읽고(예: MoveTo 노드가 LastKnownPlayerLocation을 읽음) 내비게이션, 애니메이션과 같은 게임 시스템과 상호작용합니다.

이러한 명확한 분리는 디버깅을 매우 용이하게 만듭니다. AI가 플레이어를 보지 못하면 인식 시스템을, 플레이어를 보고도 잘못된 판단을 하면 BT 그래프를, 이동하기로 결정했지만 움직이지 못하면 MoveTo 액션 노드나 내비게이션 시스템을 살펴보면 됩니다. 블랙보드는 이 계층들 사이의 깨끗한 인터페이스 역할을 합니다.

분대 기반 AI를 위한 공유 블랙보드: 여러 AI가 하나의 블랙보드를 공유하게 만들면 정교한 협력 행동을 구현할 수 있습니다. 예를 들어, 한 AI가 공격을 받아 위험에 처하면 공유 블랙보드에    

HelpRequestLocation 키를 설정할 수 있습니다. 그러면 같은 분대의 다른 AI들이 이 키의 변화를 감지하고 해당 위치로 지원을 가는 행동을 하도록 만들 수 있습니다.

주기적인 업데이트: 언리얼 엔진의 '서비스(Service)'와 같은 개념을 도입할 수 있습니다. 서비스는 특정 분기(branch)가 활성화되어 있는 동안 주기적으로 실행되어 블랙보드 값을 업데이트하는 특수 노드입니다. 예를 들어, 0.5초마다 플레이어와의 거리를 계산하여 블랙보드의    

PlayerDistance 키를 갱신하는 서비스를 만들어 AI가 항상 최신 거리 정보를 바탕으로 판단하게 할 수 있습니다.

제 4장: 모노리스에서 모듈로: ClassAIManager 리팩토링 실전 가이드
이 장에서는 이론을 실제 코드로 전환하는 구체적인 단계를 제시합니다. 기존의 거대한 switch 문을 분석하여 모듈화된 행동 트리 구성 요소로 분해하고, 이를 실행할 수 있는 C# 기반의 핵심 프레임워크를 구현하는 전 과정을 안내합니다.

4.1. 1단계: switch 로직 해체
리팩토링의 첫 단계는 기존 코드를 분석하여 행동 트리의 부품으로 변환할 수 있는 요소를 식별하는 것입니다. ClassAIManager의 거대한 switch 문을 열고 각 case 블록을 체계적으로 분해해야 합니다. 이 과정은 절차적 코드를 재사용 가능한 행동 컴포넌트 목록으로 변환하는 작업입니다.   

각 case에 대해 다음 세 가지를 식별하십시오.

진입 조건 (Entry Condition): 해당 case가 실행되기 위한 조건입니다. (예: if (health < 30)). 이것은 BT의 Condition 노드가 됩니다.

수행 행동 (Actions Performed): 조건이 충족되었을 때 실행되는 구체적인 작업들입니다. (예: FindPathAway(), Run()). 이것들은 BT의 Action 노드가 됩니다.

행동 순서 (Sequence of Actions): 행동들이 순차적으로 실행되어야 하는지, 아니면 여러 옵션 중 하나를 선택하는지 파악합니다. 이는 Sequence 또는 Selector 복합 노드의 필요성을 알려줍니다.

예를 들어, 다음과 같은 switch 코드가 있다고 가정해 봅시다.

C#

switch (currentState) {
    case AIState.Fleeing:
        if (health > 50) {
            currentState = AIState.Idle;
            break;
        }
        if (!IsSafe()) {
            Vector3 fleePoint = FindFleePoint();
            MoveTowards(fleePoint);
        }
        break;
    //... 다른 case들
}
이것을 다음과 같이 분해할 수 있습니다.

조건: IsHealthLow (체력이 50 미만)

조건: IsNotSafe (안전하지 않음)

액션: FindFleePoint (도망갈 지점 찾기)

액션: MoveTowards (해당 지점으로 이동)

구조: IsHealthLow 조건이 참일 때, IsNotSafe 조건을 확인하고, 참이면 FindFleePoint와 MoveTowards를 순서대로 실행해야 합니다. 이는 Sequence 구조에 적합합니다.

4.2. 2단계: C# 핵심 BT 프레임워크 구현
이제 분해된 구성 요소를 담을 수 있는 경량 C# 행동 트리 프레임워크를 구현합니다. 이 프레임워크는 여러 참고 자료에서 제시된 모범 사례들을 기반으로 합니다.   

Node.cs (모든 노드의 기반)

C#

public enum NodeState {
    RUNNING,
    SUCCESS,
    FAILURE
}

public abstract class Node {
    public abstract NodeState Evaluate();
}
CompositeNode.cs (복합 노드의 기반)

C#

using System.Collections.Generic;

public abstract class CompositeNode : Node {
    protected List<Node> children = new List<Node>();

    public CompositeNode(List<Node> children) {
        this.children = children;
    }
}
Sequence.cs (시퀀스 노드)

C#

using System.Collections.Generic;

public class Sequence : CompositeNode {
    public Sequence(List<Node> children) : base(children) { }

    public override NodeState Evaluate() {
        foreach (Node node in children) {
            switch (node.Evaluate()) {
                case NodeState.FAILURE:
                    return NodeState.FAILURE;
                case NodeState.SUCCESS:
                    continue;
                case NodeState.RUNNING:
                    return NodeState.RUNNING;
                default:
                    return NodeState.FAILURE;
            }
        }
        return NodeState.SUCCESS;
    }
}
Selector.cs (셀렉터 노드)

C#

using System.Collections.Generic;

public class Selector : CompositeNode {
    public Selector(List<Node> children) : base(children) { }

    public override NodeState Evaluate() {
        foreach (Node node in children) {
            switch (node.Evaluate()) {
                case NodeState.FAILURE:
                    continue;
                case NodeState.SUCCESS:
                    return NodeState.SUCCESS;
                case NodeState.RUNNING:
                    return NodeState.RUNNING;
                default:
                    continue;
            }
        }
        return NodeState.FAILURE;
    }
}
Blackboard.cs (간단한 블랙보드)

C#

using System.Collections.Generic;
using UnityEngine; // 예시를 위해 Unity 타입 사용

public class Blackboard {
    private Dictionary<string, object> data = new Dictionary<string, object>();

    public void SetData(string key, object value) {
        data[key] = value;
    }

    public T GetData<T>(string key) {
        if (data.TryGetValue(key, out object value)) {
            return (T)value;
        }
        return default(T);
    }
}
BehaviorTree.cs (트리 실행기)

C#

public class BehaviorTree {
    private Node rootNode;

    public BehaviorTree(Node root) {
        this.rootNode = root;
    }

    public NodeState Evaluate() {
        return rootNode.Evaluate();
    }
}
4.3. 3단계: '도주' 상태 리팩토링 코드 예시
이제 위 프레임워크를 사용하여 4.1절에서 분석한 '도주' 상태를 리팩토링하는 구체적인 코드를 작성해 보겠습니다.

Before (기존 switch 문):

C#

// In ClassAIManager.cs
case AIState.Fleeing:
    if (character.health > 50) { 
        currentState = AIState.Idle; 
        break; 
    }
    Vector3 fleePoint = character.FindFleePoint();
    character.MoveTowards(fleePoint);
    break;
After (행동 트리 구현):

먼저, 필요한 조건 및 액션 노드를 만듭니다.

C#

// IsHealthLowNode.cs
public class IsHealthLowNode : Node {
    private Character character;
    private float threshold;

    public IsHealthLowNode(Character character, float threshold) {
        this.character = character;
        this.threshold = threshold;
    }

    public override NodeState Evaluate() {
        return character.health < threshold? NodeState.SUCCESS : NodeState.FAILURE;
    }
}

// FindFleePointNode.cs
public class FindFleePointNode : Node {
    private Character character;
    private Blackboard blackboard;

    public FindFleePointNode(Character character, Blackboard blackboard) {
        this.character = character;
        this.blackboard = blackboard;
    }

    public override NodeState Evaluate() {
        Vector3 fleePoint = character.FindFleePoint();
        if (fleePoint!= Vector3.zero) {
            blackboard.SetData("fleeDestination", fleePoint);
            return NodeState.SUCCESS;
        }
        return NodeState.FAILURE;
    }
}

// MoveToNode.cs
public class MoveToNode : Node {
    private Character character;
    private Blackboard blackboard;

    public MoveToNode(Character character, Blackboard blackboard) {
        this.character = character;
        this.blackboard = blackboard;
    }

    public override NodeState Evaluate() {
        Vector3 destination = blackboard.GetData<Vector3>("fleeDestination");
        // MoveTowards가 완료되면 SUCCESS, 진행 중이면 RUNNING, 실패하면 FAILURE 반환
        return character.MoveTowards(destination); 
    }
}
이제 이 노드들을 조합하여 '도주' 분기를 만듭니다.

C#

// In BTController.cs, Start() method
var fleeBranch = new Sequence(new List<Node> {
    new IsHealthLowNode(character, 50f),
    new FindFleePointNode(character, blackboard),
    new MoveToNode(character, blackboard)
});
이 fleeBranch는 AI의 전체 행동 트리에서 가장 높은 우선순위를 가진 Selector의 자식으로 배치될 것입니다.

4.4. 4단계: ClassAIManager를 BTController로 교체
마지막으로, 기존 ClassAIManager를 대체할 새로운 BTController MonoBehaviour를 만듭니다.

C#

using UnityEngine;
using System.Collections.Generic;

public class BTController : MonoBehaviour {
    private BehaviorTree behaviorTree;
    private Blackboard blackboard;
    private Character character; // AI 캐릭터 참조

    void Start() {
        character = GetComponent<Character>();
        blackboard = new Blackboard();

        // 행동 트리 구조 생성
        // 예시: 도주 분기와 순찰 분기를 가진 셀렉터
        Node rootNode = new Selector(new List<Node> {
            // 1순위: 도주 행동
            new Sequence(new List<Node> {
                new IsHealthLowNode(character, 50f),
                new FindFleePointNode(character, blackboard),
                new MoveToNode(character, blackboard)
            }),
            // 2순위: 순찰 행동 (PatrolNode 등 추가 구현 필요)
            new PatrolNode(character, blackboard) 
        });

        behaviorTree = new BehaviorTree(rootNode);
    }

    void Update() {
        // 매 프레임 행동 트리를 평가
        behaviorTree.Evaluate();
    }
}
이제 AI 캐릭터 게임 오브젝트에서 기존 ClassAIManager 컴포넌트를 제거하고 새로 만든 BTController 컴포넌트를 추가하면 리팩토링이 완료됩니다. AI의 행동은 더 이상 거대한 switch 문이 아닌, 모듈화되고 확장 가능한 행동 트리에 의해 제어됩니다.

제 5장: 동적 및 상황별 AI 행동 구현
기본적인 행동 트리 프레임워크가 준비되었으므로, 이제 이를 활용하여 사용자가 요청한 "체력이 낮으면 도망", "아군을 우선 보호", "특정 스킬 콤보 사용"과 같은 동적이고 지능적인 행동을 구현하는 방법을 탐구합니다. 이러한 고급 행동들은 단순한 노드의 나열이 아닌, 특정 디자인 패턴을 통해 구현됩니다.

5.1. 반응형 로직: 높은 우선순위의 인터럽트
"체력이 낮을 때 도망가라"와 같은 행동은 AI가 다른 어떤 행동을 하고 있더라도 즉시 반응해야 합니다. 만약 AI가 Patrol과 같이 오랜 시간 동안 RUNNING 상태를 반환하는 행동을 수행 중이라면, 체력이 낮아져도 순찰이 끝날 때까지 기다리게 되어 반응이 늦어지는 문제가 발생합니다.   

이 문제를 해결하는 핵심 패턴은 "옵저버(Observer)" 또는 "조건부 중단(Conditional Abort)" 입니다. 이 패턴은 상위 우선순위의 조건이 충족되었을 때 현재 실행 중인 하위 우선순위 행동을 강제로 중단시키고, 즉시 상위 우선순위 행동으로 전환하는 메커니즘을 제공합니다.   

구현 패턴:
이 패턴은 주로 '리액티브 셀렉터(Reactive Selector)' 또는 '패러렐(Parallel)' 노드를 통해 구현됩니다. 일반적인 Selector는 자식 중 하나가 RUNNING 상태가 되면 다음 틱에서 해당 자식부터 다시 평가를 시작합니다. 하지만 리액티브 셀렉터는 RUNNING 중인 자식이 있더라도 매 틱마다 항상 첫 번째 자식부터 다시 평가합니다.

최상위 노드로 리액티브 셀렉터를 배치합니다.

첫 번째 자식(가장 높은 우선순위)으로 '도주' 분기를 배치합니다. 이 분기는 IsHealthLow 조건으로 시작합니다.

두 번째 자식(낮은 우선순위)으로 '공격' 또는 '순찰'과 같은 일반 행동 분기를 배치합니다.

동작 방식:

AI의 체력이 정상일 때, '도주' 분기의 IsHealthLow 조건이 FAILURE를 반환합니다. 리액티브 셀렉터는 다음 자식인 '순찰' 분기로 넘어가고, AI는 순찰을 시작합니다 (Patrol 노드가 RUNNING 반환).

AI가 순찰하던 중 피해를 입어 체력이 임계치 아래로 떨어졌다고 가정해 봅시다.

다음 틱에서 리액티브 셀렉터는 RUNNING 중인 '순찰' 노드를 무시하고 다시 첫 번째 자식부터 평가를 시작합니다.

이제 IsHealthLow 조건이 SUCCESS를 반환하므로, '도주' 분기가 실행됩니다.

이때 리액티브 셀렉터는 이전에 RUNNING 상태였던 '순찰' 노드에게 중단 신호를 보내고, '순찰' 노드는 자신의 상태를 정리하고 종료해야 합니다.

이러한 인터럽트 메커니즘은 언리얼 엔진과 같은 최신 게임 엔진의 행동 트리에서는 기본 기능으로 내장되어 최적화되어 있습니다. 이를 통해 AI는 주변 환경 변화에 즉각적으로 반응하는 생동감 있는 모습을 보여줄 수 있습니다.   

5.2. 순차적 숙련도: 복잡한 스킬 콤보 설계
"특정 스킬 콤보 사용" 요구사항을 순진하게 구현하면, Sequence 노드 아래에 UseSkillA, UseSkillB, UseSkillC를 순서대로 나열하는 방식을 생각할 수 있습니다. 하지만 이 접근법은 스킬 간의 타이밍, 애니메이션, 취소 가능성 등 복잡한 상호작용을 처리하기 어렵습니다.

더 나은 패턴은 콤보 로직을 행동 트리에서 분리하는 것입니다.   

행동 트리의 책임 (두뇌): 행동 트리는 고수준의 의사결정만을 담당합니다. 즉, 언제 콤보를 시작할지를 결정합니다. BT에는 다음과 같은 분기가 포함될 수 있습니다: Sequence -> IsEnemyVulnerable -> IsComboAvailable -> Action: ExecuteComboA.

콤보 시스템의 책임 (근육 기억): 실제 콤보 실행은 별도의 ComboManager 클래스가 담당합니다. ExecuteComboA 액션 노드는 단순히 comboManager.StartCombo("ComboA")를 호출하는 역할만 합니다. 이 ComboManager는 각 스킬의 애니메이션 타이밍, 데미지 판정, 다음 스킬로의 연계 조건 등을 내부적으로 관리합니다.

이러한 관심사의 분리(Separation of Concerns)는 두 시스템을 모두 깔끔하게 만듭니다. 행동 트리는 복잡한 실행 로직에 얽매이지 않고 고수준의 전략적 판단에 집중할 수 있으며, ComboManager는 AI뿐만 아니라 플레이어 캐릭터도 사용할 수 있는 재사용 가능한 모듈이 됩니다.

5.3. 협력적 지능: 아군 보호 아키텍처
"아군을 우선 보호"하는 행동은 공유 블랙보드(Shared Blackboard) 패턴의 훌륭한 적용 사례입니다.   

패턴:

분대(squad)에 속한 모든 AI가 동일한 블랙보드 인스턴스를 공유하도록 설정합니다.

'힐러'와 같은 지원형 AI가 적에게 공격받으면, 자신의 상태를 공유 블랙보드의 AllyUnderAttack 키에 true로, 자신의 위치를 AllyPosition 키에 기록합니다.

'탱커'와 같은 방어형 AI의 행동 트리에는 최상위 우선순위로 리액티브 분기가 존재합니다. 이 분기는 매 틱마다 공유 블랙보드의 AllyUnderAttack 키를 감시합니다.

만약 AllyUnderAttack이 true가 되면, 이 분기는 현재 행동을 즉시 중단시키고 새로운 Sequence를 실행합니다: MoveTo(AllyPosition) -> TauntNearestEnemy() -> AttackNearestEnemy().

이 방식을 통해 각 AI는 단순하고 분리된 규칙에 따라 행동하지만, 결과적으로는 서로를 보호하고 협력하는 것처럼 보이는 창발적(emergent) 분대 행동이 나타납니다. 외부의 거대한 '분대 관리자' 없이도, 개별 AI들의 로컬 상호작용만으로 지능적인 팀워크를 구현할 수 있습니다.   

제 6장: 고급 주제: 유지보수, 디버깅, 최적화
행동 트리 시스템을 성공적으로 구축했다면, 이제는 이를 장기적으로 유지보수하고, 문제를 해결하며, 성능을 최적화하는 고급 기법에 주목해야 합니다. 프로덕션 수준의 AI 시스템은 견고함과 효율성을 모두 갖추어야 합니다.

6.1. 재사용성을 위한 설계: 서브트리의 힘
행동 트리가 복잡해지면 하나의 거대한 그래프가 되어 가독성과 유지보수성이 떨어질 수 있습니다. 이에 대한 해결책은 특정 행동의 묶음을 **서브트리(Sub-tree)**로 캡슐화하는 것입니다.   

예를 들어, 전투와 관련된 모든 복잡한 행동들(엄폐물 찾기, 조준, 사격, 재장전 등)을 BT_Combat이라는 별도의 행동 트리 에셋으로 만들 수 있습니다. 그런 다음, 다른 AI 캐릭터의 메인 트리에서는 단순히 RunBehaviorTree(BT_Combat)라는 하나의 노드를 사용하여 이 모든 전투 로직을 실행할 수 있습니다. 이는 행동 트리의 모듈성을 극대화하는 궁극적인 재사용 기법입니다. 이를 통해 다음과 같은 이점을 얻을 수 있습니다.   

관심사의 분리: 전투 로직 전문가와 순찰 로직 전문가는 서로 다른 파일을 작업하며 충돌을 피할 수 있습니다.

재사용성 극대화: BT_Patrol 서브트리는 적 보병, 아군 NPC, 심지어 민간인 캐릭터 등 순찰이 필요한 모든 AI가 공유할 수 있습니다.

가독성 향상: 메인 트리는 Selector -> BT_Combat -> BT_Patrol 과 같이 매우 단순하고 읽기 쉬운 고수준의 로직 흐름만 보여줍니다.

6.2. 시각화 및 디버깅 전략
행동 트리의 가장 큰 장점 중 하나는 시각적인 특성 덕분에 디버깅이 직관적이라는 것입니다.   

실시간 디버깅: 개발 중인 게임 엔진에서 행동 트리 에디터를 열고 게임을 실행하면, 현재 어떤 노드가 평가되고 있고 어떤 상태(SUCCESS, FAILURE, RUNNING)를 반환하는지 실시간으로 시각화해주는 기능은 필수적입니다. 이를 통해 AI의 의사결정 과정을 단계별로 추적할 수 있습니다.   

로깅: 시각적 디버거만으로 부족할 때, 각 틱마다 트리의 상태와 블랙보드의 주요 값들을 출력하는 강력한 로깅 시스템은 매우 유용합니다. 로그를 통해 특정 상황에서 AI가 왜 그런 결정을 내렸는지 사후 분석이 가능합니다.   

인게임 시각화: 여러 AI가 동시에 상호작용하는 복잡한 상황에서는 어떤 AI를 디버깅하고 있는지 파악하기 어렵습니다. 언리얼 엔진의 Draw Debug String 노드처럼, AI의 현재 상태(예: "Chasing Player"), 목표 지점, 감지 범위 등을 게임 월드 내 캐릭터 위에 직접 텍스트나 도형으로 표시하는 기법은 매우 효과적입니다.   

6.3. 흔한 함정과 모범 사례
최고의 함정: BT로 FSM 흉내 내기: 다시 한번 강조하지만, 데코레이터와 블랙보드 변수를 사용하여 상태를 흉내 내고, 특정 분기에서 다른 분기로 '점프'하려는 시도는 행동 트리의 설계 철학에 완전히 위배됩니다. 이는 관리하기 힘든 '해킹'으로 이어지며, 결국 행동 트리를 사용하는 의미를 퇴색시킵니다. 행동 트리는 우선순위에 따라 행동을 '선택'하는 것이지, 상태를 '전이'하는 것이 아님을 명심해야 합니다.   

모범 사례: 이벤트 기반 최적화: 수백 개의 AI가 매 프레임마다 전체 트리를 평가한다면 심각한 성능 저하를 유발할 수 있습니다. 최적화된 접근 방식은 이벤트 기반(event-driven) 실행입니다. RUNNING 상태의 노드가 활성화되어 있는 동안 트리는 '수면' 상태에 들어갑니다. 그리고 해당 액션이 끝나거나(예: 이동 완료), 외부 이벤트(예: 피격 이벤트)가 발생하여 옵저버가 트리거될 때만 '깨어나서' 트리를 재평가합니다. 이는 언리얼 엔진과 같은 현대적인 엔진이 높은 AI 성능을 달성하는 방식입니다.   

모범 사례: 리프 노드는 단순하게 유지: 액션 및 조건 노드는 가능한 한 단순하고, 단일 목적을 가지며, 상태를 가지지 않도록(stateless) 설계해야 합니다. 모든 상태 정보는 캐릭터의 컴포넌트나 블랙보드에 저장되어야 합니다. 모든 복잡한 로직은 이러한 단순한 노드들을 트리의 구조를 통해 조합함으로써 만들어져야 합니다.

결론
게임 AI 개발에서 switch 문이나 전통적인 FSM이 제공하는 단순함은 프로젝트의 복잡성이 증가함에 따라 빠르게 관리 불가능한 부채로 전락합니다. 행동 트리(BT)는 이러한 한계를 극복하기 위한 강력하고 현대적인 대안을 제시합니다. BT는 제어의 중심을 개별 '상태'에서 계층적인 '트리 구조'로 옮김으로써, 본질적으로 모듈화되고, 재사용 가능하며, 반응성이 뛰어난 AI 아키텍처를 가능하게 합니다.

본 보고서에서 제시한 바와 같이, BT로의 성공적인 전환은 단순히 코드를 바꾸는 것을 넘어, AI의 행동을 설계하는 방식에 대한 근본적인 사고의 전환을 요구합니다. 개발자는 더 이상 상태 간의 복잡한 전이망을 그리는 대신, 현재 상황에 맞는 최우선 행동을 선택하는 논리적 계층을 설계하는 데 집중해야 합니다.

핵심 권장 사항은 다음과 같습니다:

아키텍처를 먼저 이해하라: Selector, Sequence와 같은 복합 노드가 어떻게 제어 흐름을 만드는지, 그리고 블랙보드가 어떻게 노드 간의 통신을 분리하는지를 완벽히 이해하는 것이 선행되어야 합니다.

점진적으로 리팩토링하라: 기존의 거대한 switch 문을 한 번에 바꾸려 하지 말고, 본 보고서 4장에서 제시한 바와 같이 하나의 case(예: '도주' 상태)부터 시작하여 조건, 액션, 구조로 분해하고 이를 BT의 작은 서브트리로 구현하는 과정을 반복하십시오.

패턴을 활용하라: "조건부 중단" 패턴으로 즉각적인 반응성을 구현하고, "콤보 로직 분리" 패턴으로 시스템 간의 결합도를 낮추며, "공유 블랙보드" 패턴으로 창발적인 분대 행동을 설계하는 등, 검증된 디자인 패턴을 적극적으로 활용하여 정교한 행동을 구현하십시오.

도구를 적극 활용하고 함정을 피하라: 시각적 디버거와 로깅 시스템을 구축하여 개발 효율성을 높이고, 가장 흔한 함정인 'BT로 FSM 흉내 내기'를 경계해야 합니다. BT의 철학을 존중하고 그에 맞는 방식으로 문제를 해결하는 것이 장기적으로 더 효율적이고 견고한 시스템을 만듭니다.

행동 트리는 복잡한 AI 로직을 시각적이고 체계적인 구조로 표현함으로써, 다양한 몬스터와 영웅에게 고유하고 역동적인 생명력을 불어넣을 수 있는 강력한 도구입니다. 이 가이드가 귀하의 ClassAIManager를 성공적으로 리팩토링하고, 확장 가능하며 유지보수하기 쉬운 지능형 시스템을 구축하는 데 든든한 초석이 되기를 바랍니다.
