# Task Guide MCP Server

AI Agent의 작업 성능 향상을 위한 MCP(Model Context Protocol) 서버입니다. 프로젝트가 방대해질수록 발생하는 AI 성능 저하 문제를 해결하기 위해 작업 영역을 세분화하고 계층적 RAG와 하이브리드 검색을 제공합니다.

## 주요 기능

### 1. Guidance 관리
- **create_guidance**: 새로운 작업 가이드 생성
- **update_guidance**: 기존 가이드 업데이트
- **list_guidances**: 모든 가이드 목록 조회
- **get_guidance**: 특정 가이드 조회
- **delete_guidance**: 가이드 삭제

### 2. 계층적 RAG (Hierarchical RAG)
- 코드베이스를 계층구조(디렉터리, 파일, 함수, 클래스)로 인덱싱
- 상위 개념→세부 정보로 단계적 탐색
- 필요 추상화 수준에 맞춰 관련 맥락만 동적으로 조합

### 3. 하이브리드 검색
- 벡터(의미) 검색과 구조적 인덱스 조합
- 지식 그래프를 통한 관계 기반 검색
- 정밀성 높은 증거, 코드, 결정 내역 조합

### 4. 인덱싱 및 검색
- **index_guidance**: 가이드에 대한 코드베이스와 문서 인덱싱
- **search**: 하이브리드 검색 수행
- **build_hierarchy**: 코드베이스 계층 구조 구축

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 빌드
```bash
npm run build
```

### 3. 개발 모드 실행
```bash
npm run dev
```

### 4. 프로덕션 실행
```bash
npm start
```

## 사용법

### MCP 클라이언트 설정
MCP 클라이언트에서 다음과 같이 서버를 설정하세요:

```json
{
  "mcpServers": {
    "task-guide": {
      "command": "node",
      "args": ["/path/to/task-guide-mcp/dist/index.js"]
    }
  }
}
```

### 가이드 생성 예시
```javascript
// 새로운 가이드 생성
await mcp.callTool('create_guidance', {
  title: 'React 컴포넌트 개발',
  objective: '재사용 가능한 React 컴포넌트 개발',
  technicalConstraints: [
    'TypeScript 사용',
    '함수형 컴포넌트만 사용',
    'Tailwind CSS 스타일링'
  ],
  workRules: [
    '컴포넌트는 단일 책임 원칙을 따름',
    'Props는 인터페이스로 정의',
    'Storybook 문서화 필수'
  ],
  completionCriteria: [
    '컴포넌트가 정상 동작',
    'TypeScript 에러 없음',
    'Storybook 스토리 작성 완료'
  ],
  tags: ['react', 'typescript', 'component'],
  priority: 'high'
});
```

### 검색 예시
```javascript
// 하이브리드 검색
const results = await mcp.callTool('search', {
  query: 'React 컴포넌트',
  type: 'code',
  limit: 5,
  threshold: 0.7
});
```

## 프로젝트 구조

```
task-guide-mcp/
├── src/
│   ├── types/
│   │   └── index.ts              # 타입 정의
│   ├── core/
│   │   ├── guidance-manager.ts   # 가이드 관리
│   │   ├── hierarchical-rag.ts   # 계층적 RAG
│   │   └── hybrid-search.ts      # 하이브리드 검색
│   └── index.ts                  # MCP 서버 메인
├── guidance/                     # 가이드 저장소
│   ├── {guidance-id}/
│   │   └── summary.json         # 가이드 요약
│   └── metadata/
│       └── {guidance-id}.vec    # 메타데이터 벡터
├── data/
│   └── search.db                # 검색 데이터베이스
├── package.json
├── tsconfig.json
└── README.md
```

## 기술 스택

- **TypeScript**: 타입 안전성
- **@modelcontextprotocol/sdk**: MCP 프로토콜 구현
- **better-sqlite3**: 벡터 및 구조적 인덱스 저장
- **OpenAI API**: 임베딩 생성 (향후 구현)
- **계층적 RAG**: 코드베이스 구조 분석
- **하이브리드 검색**: 벡터 + 구조적 검색

## 라이선스

MIT License
