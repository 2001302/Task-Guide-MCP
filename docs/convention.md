# TypeScript 코딩 컨벤션

## 1. 기본 규칙

### 1.1 파일 명명 규칙
- 파일명은 `camelCase`를 사용합니다
- 컴포넌트 파일은 `PascalCase`를 사용합니다 (예: `UserProfile.tsx`)
- 타입 정의 파일은 `.types.ts` 접미사를 사용합니다
- 유틸리티 파일은 `.utils.ts` 접미사를 사용합니다

### 1.2 변수 및 함수 명명 규칙
- 변수와 함수는 `camelCase`를 사용합니다
- 상수는 `UPPER_SNAKE_CASE`를 사용합니다
- 인터페이스는 `PascalCase`로 시작하고 `I` 접두사를 사용하지 않습니다
- 타입 별칭은 `PascalCase`를 사용합니다
- 열거형(enum)은 `PascalCase`를 사용합니다

```typescript
// 좋은 예
const userName = 'john';
const MAX_RETRY_COUNT = 3;
interface UserProfile { }
type UserStatus = 'active' | 'inactive';
enum UserRole { ADMIN, USER }

// 나쁜 예
const user_name = 'john';
const maxRetryCount = 3;
interface IUserProfile { }
type userStatus = 'active' | 'inactive';
enum userRole { ADMIN, USER }
```

## 2. 타입 정의

### 2.1 인터페이스 vs 타입 별칭
- 객체의 구조를 정의할 때는 `interface`를 사용합니다
- 유니온 타입, 교차 타입, 기본 타입 별칭에는 `type`을 사용합니다

```typescript
// 인터페이스 사용 (객체 구조)
interface User {
  id: string;
  name: string;
  email: string;
}

// 타입 별칭 사용 (유니온, 교차 타입)
type Status = 'pending' | 'approved' | 'rejected';
type UserWithStatus = User & { status: Status };
```

### 2.2 제네릭 명명 규칙
- 제네릭 타입 매개변수는 `T`, `U`, `V` 순서로 사용합니다
- 의미가 명확한 경우 더 구체적인 이름을 사용합니다

```typescript
// 기본 제네릭
function processData<T>(data: T): T { }

// 의미가 명확한 제네릭
function processUserData<UserData>(user: UserData): UserData { }
```

## 3. 함수 정의

### 3.1 함수 선언 방식
- 화살표 함수를 선호하되, 호이스팅이 필요한 경우 함수 선언을 사용합니다
- 매개변수와 반환 타입을 명시합니다

```typescript
// 화살표 함수 (일반적인 경우)
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// 함수 선언 (호이스팅이 필요한 경우)
function processUserData(user: User): ProcessedUser {
  // ...
}
```

### 3.2 매개변수 규칙
- 선택적 매개변수는 뒤에 배치합니다
- 기본값이 있는 매개변수는 타입을 생략할 수 있습니다
- 나머지 매개변수는 `...args` 형태로 명명합니다

```typescript
function createUser(
  name: string,
  email: string,
  age?: number,
  isActive: boolean = true,
  ...tags: string[]
): User {
  // ...
}
```

## 4. 클래스 정의

### 4.1 클래스 구조
- 프로퍼티는 생성자에서 초기화하거나 선언 시 초기화합니다
- 접근 제한자를 명시합니다
- 읽기 전용 프로퍼티는 `readonly`를 사용합니다

```typescript
class UserService {
  private readonly apiUrl: string;
  private users: User[] = [];

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  public async getUser(id: string): Promise<User | null> {
    // ...
  }

  private validateUser(user: User): boolean {
    // ...
  }
}
```

## 5. 모듈 및 임포트

### 5.1 임포트 순서
1. Node.js 내장 모듈
2. 외부 라이브러리
3. 내부 모듈 (상대 경로)

```typescript
// Node.js 내장 모듈
import { readFileSync } from 'fs';
import { join } from 'path';

// 외부 라이브러리
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// 내부 모듈
import { UserService } from './services/UserService';
import { validateUser } from './utils/validation';
```

### 5.2 임포트 방식
- 기본 임포트는 이름 없이 사용합니다
- 명명된 임포트는 중괄호를 사용합니다
- 타입만 임포트할 때는 `import type`을 사용합니다

```typescript
// 기본 임포트
import express from 'express';

// 명명된 임포트
import { Server, StdioServerTransport } from '@modelcontextprotocol/sdk/server/index.js';

// 타입 임포트
import type { User, UserRole } from './types/User';
```

## 6. 에러 처리

### 6.1 에러 타입 정의
- 커스텀 에러 클래스를 정의합니다
- 에러 코드와 메시지를 포함합니다

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### 6.2 에러 처리 패턴
- 가능한 한 구체적인 에러 타입을 사용합니다
- 에러를 적절히 전파하거나 처리합니다

```typescript
async function processUser(userData: unknown): Promise<User> {
  try {
    const validatedUser = validateUser(userData);
    return await saveUser(validatedUser);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new Error(`사용자 검증 실패: ${error.message}`);
    }
    throw error;
  }
}
```

## 7. 주석 및 문서화

### 7.1 JSDoc 사용
- 공개 API에는 JSDoc 주석을 작성합니다
- 매개변수, 반환값, 예외를 문서화합니다

```typescript
/**
 * 사용자 정보를 검증합니다
 * @param userData - 검증할 사용자 데이터
 * @returns 검증된 사용자 객체
 * @throws {ValidationError} 사용자 데이터가 유효하지 않은 경우
 */
function validateUser(userData: unknown): User {
  // ...
}
```

### 7.2 인라인 주석
- 복잡한 로직에만 주석을 작성합니다
- "무엇을 하는지"보다 "왜 하는지"를 설명합니다

```typescript
// 사용자 권한 확인 - 관리자만 접근 가능
if (user.role !== 'admin') {
  throw new Error('권한이 없습니다');
}
```

## 8. 코드 포맷팅

### 8.1 들여쓰기 및 공백
- 2칸 들여쓰기를 사용합니다
- 세미콜론을 사용합니다
- 문자열은 작은따옴표를 사용합니다

### 8.2 줄 길이
- 한 줄은 100자를 넘지 않도록 합니다
- 긴 줄은 적절히 분리합니다

```typescript
// 긴 함수 호출 분리
const result = await someVeryLongFunctionName(
  parameter1,
  parameter2,
  parameter3
);
```

## 9. 비동기 처리

### 9.1 Promise vs async/await
- `async/await`를 선호합니다
- Promise 체이닝보다는 `async/await`를 사용합니다

```typescript
// 좋은 예
async function fetchUserData(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    const userData = await response.json();
    return validateUser(userData);
  } catch (error) {
    throw new Error(`사용자 데이터 조회 실패: ${error.message}`);
  }
}

// 나쁜 예
function fetchUserData(id: string): Promise<User> {
  return fetch(`/api/users/${id}`)
    .then(response => response.json())
    .then(userData => validateUser(userData))
    .catch(error => {
      throw new Error(`사용자 데이터 조회 실패: ${error.message}`);
    });
}
```

## 10. 테스트 코드

### 10.1 테스트 파일 명명
- 테스트 파일은 `.test.ts` 또는 `.spec.ts` 접미사를 사용합니다
- 테스트 파일은 원본 파일과 같은 디렉토리에 배치합니다

### 10.2 테스트 구조
- `describe` 블록으로 테스트 그룹을 구성합니다
- 각 테스트는 `it` 또는 `test`를 사용합니다
- 테스트 이름은 명확하고 구체적으로 작성합니다

```typescript
describe('UserService', () => {
  describe('getUser', () => {
    it('유효한 ID로 사용자를 조회하면 사용자 객체를 반환한다', async () => {
      // Given
      const userId = 'valid-id';
      const expectedUser = { id: userId, name: 'John' };
      
      // When
      const result = await userService.getUser(userId);
      
      // Then
      expect(result).toEqual(expectedUser);
    });
  });
});
```

이 컨벤션은 프로젝트의 일관성과 가독성을 높이며, 팀 협업을 원활하게 합니다.
