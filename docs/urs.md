# URS(User Requirement Specification)
## 프로젝트 개요
기존 AI Agent를 사용하면 프로젝트의 크기가 커질수로 다양한 문제점이 드러난다.
- 방대한 코드베이스를 잘못 이해
- 점점 느려짐
- 중복 코드 개발
- 코드베이스가 너무 클 경우 변경사항이 생길 때 indexing에 큰 부하가 걸림
이러한 문제를 해결하고 AI Agent사용의 효율을 높이고자 한다. 기본적으로 Visual Studio Code 플러그인으로 개발되며, MCP 서버에서 사용도 고려한다.

주요 목표는 다음과 같다.
- 프로젝트가 방대해짐에 따른 AI 성능저하를 막기위해 부분적으로 지식그래프를 관리함
- 지식그래프와 함께 개발 내용에 대한 rule을 엄격하게 관리하여 추후 유지보수를 용이하게 함
- 코드베이스 업데이트에 따라 지식그래프도 업데이트되는 과정을 CI/CD으로 통합하여 자동화 가능하게 함
## 주요 기능
### 코드베이스 계층화 관리
>기본적으로 폴더별로 지식그래프를 관리
- .knowledge-node.json 
- .knowledge-ignore.json
- .knowledge-rule.mdc
### AI Agent 를 사용할 때 참조해서 사용
- .knowledge-node.json 들을 태그해서 context를 최적화
- .my-knowledge 를 태그해서 자신의 일과 관련있는 node만을 사용

### PR시 CI/CD에 knowledge update flow 추가

