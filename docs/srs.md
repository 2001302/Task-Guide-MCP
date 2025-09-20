# SRS(Software Requirement Specification)

## System Architecture
---
### Project Dependencies
- knowledge-graph-driven-project-management-mcp

## Software Design
---
### knowledge-graph-driven-project-management-mcp
지식그래프 기반 프로젝트 관리를 위한 핵심 MCP서버
#### dependency
- @modelcontextprotocol/sdk: MCP(Model Context Protocol) 서버 구현을 위한 핵심 SDK.
- zod: 스키마 정의 및 유효성 검사를 위한 라이브러리.
- yargs: 커맨드 라인 인자(argument)를 파싱하고 처리하는 라이브러리.
- chalk: 터미널 출력에 색상을 입히는 라이브러리.
- @itseasy21/mcp-knowledge-graph: 지식그래프 생성
#### files
##### .knowledge-node.json
- 기본적으로 폴더별로 지식그래프를 관리
	- 트리구조로 상위 폴더의 node는 하위 폴더의 모든 node를 탐색. 
	- 하위 폴더의 node가 없다면 모든 파일을 탐색. 
##### .knowledge-ignore.json
- 지식그래프에서 무시할 항목을 추가
##### .knowledge-rule.mdc
- .mdc 형식
- description
	- purpose
	- folder 구조
- alwaysApply : false
	- 새로운 chat을 시작할 때 먼저 읽고 시작하라고 명시
- read .knowledge-node.json
	- 같은 폴더의 지식 그래프를 참조
- search child rule
	- 하위 폴더의 rule이 있다면 참조
#### api
- setup
	- root-directory/.knowledge-root 폴더를 생성
		- .config.yaml
		- .knowledge-node.json
		- .knowledge-ignore.json
	- 모든 directory를 순회하며 .knowledge-node 폴더를 생성하여 지식그래프에 file+node 목록을 채워넣음
		- .knowledge-node.json
		- .knowledge-rule.mdc
- generate
	- args
		- target 폴더 입력 필요
	- knowledge 를 dfs 순회
		- 하나씩 generate요청
			- .knowledge-node.json 에 있는 file대상으로 지식그래프 생성 + 하위 폴더의 .knowledge-node.json는 관계만 주입
			- .knowledge-rule.mdc 생성
- update
	- args
		- git diff 입력 필요
- private-knowledge 
	- root-directory/.my-knowledge 생성
	- 무슨 일을 할 것인지 물어봄
	- 자신의 일과 관련있는 node만을 수집
- clear
	- 모든 knowledge 정리

### unit test
#### publish
##### 방법 1: `npx`를 사용하는 방법 (글로벌 설치 X)
```json
{
  "mcpServers": {
    "project": {
      "command": "npx",
      "args": [
        "-y",
        "github:tejpalvirk/project"
      ]
    }
  }
}
```

*   **동작 방식**: 이 방법은 `npm install -g`로 **글로벌 설치를 하지 않습니다.** 대신, `npx`라는 도구를 사용합니다. `npx`는 패키지를 임시로 다운로드하여 실행한 뒤 제거하는 역할을 합니다.
*   **`command`**: `"npx"`
*   **`args`**:
    *   `"-y"`: `npx`가 패키지를 설치할지 묻는 프롬프트에 자동으로 "yes"라고 답하는 옵션입니다.
    *   `"github:tejpalvirk/project"`: `npx`가 실행할 패키지의 위치(GitHub 저장소)입니다.
*   **장점**: 컴퓨터에 패키지를 영구적으로 설치하지 않고 필요할 때마다 최신 버전을 가져와 실행하므로 깔끔하게 사용할 수 있습니다.
##### 방법 2: 글로벌 설치 후 사용하는 방법 (npm install -g)
```bash
# 1. 먼저 터미널에서 글로벌 설치를 합니다.
npm install -g github:tejpalvirk/project
```

이 명령어를 실행하면, `package.json`의 `"bin"` 필드에 정의된 `contextmanager-project`라는 명령어가 시스템 전역에서 사용할 수 있도록 등록됩니다.

```json
// package.json의 일부
"bin": {
  "contextmanager-project": "./index.js"
},
```

이제 `contextmanager-project`라는 명령어 자체가 하나의 실행 파일처럼 동작하므로, JSON 설정은 매우 간단해집니다.

```json
// 2. Claude Desktop 설정을 변경합니다.
{
  "mcpServers": {
    "project": {
      "command": "contextmanager-project"
      // args가 필요 없습니다.
    }
  }
}
```

*   **동작 방식**: 이미 시스템에 `contextmanager-project`라는 명령어가 설치되어 있으므로, 그 명령어를 직접 실행합니다.
*   **`command`**: `"contextmanager-project"`
*   **`args`**: 이 경우에는 추가로 전달할 인자가 없으므로 `args` 필드가 필요 없습니다.
*   **장점**: 매번 패키지를 다운로드할 필요 없이 로컬에 설치된 버전을 바로 실행하므로 더 빠를 수 있습니다.


>[!summary]
1.`npx` 방법: 글로벌 설치 필요 없음. `command`는 `npx`가 되고, `args`를 통해 실행할 패키지와 옵션을 지정합니다.
2.`npm install -g` 방법: 글로벌 설치 필요함. `command`는 설치된 패키지 이름(`contextmanager-project`)이 되며, 보통 `args`는 필요 없습니다.
-따라서 "글로벌하게 설치하고 `args`로 실행하는 구조"가 아니라, "글로벌하게 설치하면 `args` 없이 간단한 `command`로 실행할 수 있는 구조"가 되는 것입니다. `args`는 `npx`처럼 다른 프로그램을 통해 우회적으로 실행할 때 주로 사용됩니다.

