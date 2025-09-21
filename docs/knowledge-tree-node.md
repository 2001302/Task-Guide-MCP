# 역할
## .knowledge-tree-node.json의 역할: '무엇을(What)', '왜(Why)', '어디에서(Where)'에 대한 가이드라인을 제공
	- What/Why: objective, acceptance_criteria, scope 등이 이 역할
	- Where: related_files가 이 역할을 합니다. AI에게 "이 작업은 이 파일들과 관련이 깊으니, 여기를 중심으로 분석하고 수정해"라고 알려주는 것
## AI의 역할: '어떻게(How)'를 파악하고 실행
	- AI는 related_files에 명시된 파일들의 내용을 직접 읽고 분석하여 현재 코드 구조(클래스, 함수 등)를 파악
	- 그리고 주어진 목표(objective)와 완료 조건(acceptance_criteria)에 맞춰 최적의 방법으로 코드를 수정하거나 추가

# 기능
    - 