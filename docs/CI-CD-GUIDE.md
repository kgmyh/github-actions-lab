# CI/CD와 GitHub Actions 학습 가이드

작성일: 2026-10-14 · 대상: GitHub Actions로 첫 CI/CD 실습을 진행하는 학습자

이 문서는 완성된 팁 계산기 프로젝트를 예로 들어 CI/CD의 개념, ci-cd.yml의 구조와 문법, 필요한 이론과 GitHub 설정을 설명합니다. 메뉴·버튼 이름은 GitHub 사이트의 영어 표기를 사용합니다.

## 읽는 순서

1. CI/CD의 목적과 용어를 이해합니다.
2. 전체 워크플로와 YAML 문법을 읽습니다.
3. 각 설정이 실행·실패·배포를 제어하는 방법을 확인합니다.
4. 저장소 설정과 로그 확인 방법을 익힙니다.
5. 마지막 확인 질문에 답하고 README의 실습을 반복합니다.

## 1. CI와 CD는 무엇인가요?

### 1-1. CI: Continuous Integration — 지속적 통합

CI는 개발자가 만든 작은 변경을 자주 통합하면서 자동으로 검증하는 개발 방식입니다. 테스트·빌드를 자동화하면 변경이 기존 기능을 깨뜨리는지 일찍 발견할 수 있습니다.

이 프로젝트에서는 코드가 main에 push되거나 main 대상 PR이 생성·갱신되면 다음 검사를 수행합니다.

```text
의존성 환경 구성 → 계산 함수 테스트 → 웹사이트 빌드
```

PR에서는 합치기 전에 변경을 확인하고, main에서는 합쳐진 결과를 다시 확인합니다. CI를 사용하는 것만으로 모든 버그가 발견되지는 않습니다. 검사가 다루는 동작과 테스트의 품질이 중요합니다.

### 1-2. CD: 두 가지 의미

| 용어 | 뜻 | 운영 배포 방식 |
|---|---|---|
| Continuous Delivery | 지속적 제공 | 검증된 결과를 배포 가능한 상태로 준비하고, 운영 배포 시 사람이 승인할 수 있음 |
| Continuous Deployment | 지속적 배포 | 정한 검증·조건을 통과한 변경을 별도 사람 승인 없이 자동 배포 |

이 실습은 **main의 검증이 성공하면 GitHub Pages로 자동 배포**하므로 Continuous Deployment에 해당합니다. 나중에 배포 환경에 사람 승인 단계를 추가하면 Continuous Delivery 방식으로 운영할 수 있습니다.

CD가 무엇을 뜻하는지는 약어만으로 확정하기 어렵습니다. 팀에서 마지막 배포 단계에 승인 절차가 있는지 함께 확인하세요.

### 1-3. CI/CD를 사용하는 이유

- 같은 명령과 환경으로 변경을 반복해서 검증합니다.
- 실패 로그를 남겨 어떤 변경에서 문제가 생겼는지 찾습니다.
- 검증을 통과한 결과물을 자동으로 배포합니다.
- 수동 배포에서 파일을 빠뜨리거나 잘못된 버전을 올리는 실수를 줄입니다.

GitHub Actions는 이 자동화를 실행하는 도구입니다. CI/CD 외에도 정기 작업이나 릴리스 자동화에 사용할 수 있습니다. [GitHub Actions 개념](https://docs.github.com/en/actions/get-started/understand-github-actions)

## 2. 실습에 등장하는 구성요소

| 용어 | 의미 | 이 프로젝트의 예 |
|---|---|---|
| Repository | 코드와 이력을 보관하는 저장소 | github-actions-lab |
| Commit | 변경 내용을 기록한 단위 | 계산 버그 수정 commit |
| Branch | 독립적으로 변경을 진행하는 개발 흐름 | main, practice/site-update |
| Pull Request, PR | 한 브랜치의 변경을 다른 브랜치에 합치도록 요청 | practice/site-update → main |
| Event | 자동화를 시작하는 계기 | push, pull_request |
| Workflow | YAML로 정의한 자동화 전체 | CI/CD Lab |
| Workflow run | workflow가 한 번 실행된 기록 | Actions 목록의 각 실행 |
| Job | workflow 안의 작업 단위 | ci, deploy |
| Step | job 안에서 수행하는 개별 단계 | Run tests |
| Action | step에서 사용하는 재사용 가능한 프로그램 | actions/checkout |
| Runner | job을 실행하는 컴퓨터·실행 환경 | ubuntu-latest |
| Artifact | 실행에서 만든 파일을 보관·전달하는 묶음 | dist의 웹사이트 파일 |
| Environment | 배포 대상과 보호 규칙을 연결하는 설정 | github-pages |

workflow가 실행되면 job이 runner에 할당되고 step이 수행됩니다. 일반적인 job의 step은 순서대로 실행하며, 의존성이 없는 job은 병렬로 실행할 수 있습니다. [Job 사용법](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs)

GitHub 호스팅 Ubuntu runner를 사용하는 이 예제에서는 job마다 별도의 실행 환경이 준비됩니다. 따라서 ci의 로컬 파일이 deploy에 자동으로 이어지지 않습니다. [GitHub-hosted runners](https://docs.github.com/en/actions/concepts/runners/github-hosted-runners)

## 3. 이 프로젝트의 실제 실행 흐름

```text
practice/site-update에서 commit과 push
  ↓
main을 대상으로 PR 생성
  ↓
ci: checkout → Node 설정 → npm ci → npm test → npm run build
  ↓
PR 검사 결과 확인 (이 실행에서는 배포 생략)
  ↓
PR 병합 → main에 push 이벤트 발생
  ↓
ci: 설치 → 테스트 → 빌드 → Pages 설정 확인 → artifact 업로드
  ├─ 실패: deploy를 건너뛰고 기존 사이트 유지
  └─ 성공: deploy가 artifact를 받아 Pages에 배포
```

이 흐름에서 구분할 결과는 세 가지입니다.

| 결과 | 의미 |
|---|---|
| CI 성공 | 정의한 검사와 빌드가 통과함 |
| PR 병합 | 변경이 main에 합쳐짐 |
| 배포 성공 | 합쳐진 결과물이 웹사이트에 게시됨 |

CI가 성공해도 Pages 설정이나 배포 권한에 문제가 있으면 배포는 실패할 수 있습니다. PR 검사가 성공해도 아직 병합하지 않았다면 사이트는 바뀌지 않습니다.

## 4. ci-cd.yml은 어디에 있나요?

GitHub는 저장소 루트의 **.github/workflows/** 안에 있는 **.yml 또는 .yaml** 파일을 workflow로 인식합니다. ci-cd.yml이라는 이름 자체에는 특별한 기능이 없습니다. 파일 위치와 내용이 실행을 결정합니다. [워크플로 파일 문법](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)

이 프로젝트의 파일은 다음처럼 구분됩니다.

| 파일 | 역할 |
|---|---|
| .github/workflows/ci-cd.yml | GitHub가 실제로 실행하는 설정 |
| docs/workflows/01-ci.yml | 초기 CI 설정 참고본 |
| docs/workflows/02-ci-cd.yml | 배포까지 추가한 CI/CD 완성본 |

처음 제공한 ci-cd.yml은 CI만 포함합니다. README의 5단계에서 02-ci-cd.yml을 복사하면 배포가 추가됩니다. 아래 설명은 **02-ci-cd.yml 완성본**을 기준으로 합니다. 이미 교체했다면 실제 ci-cd.yml과 같은 구조입니다.

docs/workflows의 YAML은 참고 파일입니다. 이 폴더에 두었다고 GitHub에서 자동 실행되지는 않습니다.

## 5. 전체 ci-cd.yml 읽기

다음은 이 프로젝트의 CI/CD 완성본입니다. 입력 파일은 [02-ci-cd.yml](workflows/02-ci-cd.yml)에서 확인할 수 있습니다.

```yaml
name: CI/CD Lab

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

# CI에는 읽기 권한만 줍니다.
permissions:
  contents: read

# main 배포는 진행 중인 실행을 끝냅니다. 같은 PR의 오래된 검사는 취소합니다.
concurrency:
  group: lab-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  ci:
    name: Test and build
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout repository
        uses: actions/checkout@v7
      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: '24'
          package-manager-cache: false
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build website
        run: npm run build
      - name: Configure Pages
        if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
        uses: actions/configure-pages@v5
      - name: Upload website artifact
        if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
        uses: actions/upload-pages-artifact@v4
        with:
          path: dist

  deploy:
    name: Deploy to Pages
    # ci가 실패하면 이 job은 실행되지 않습니다.
    needs: ci
    if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy website
        id: deployment
        uses: actions/deploy-pages@v4
```

Actions의 버전은 프로젝트 예제에 명시한 값입니다. @v7 같은 action 버전과 node-version: '24' 같은 앱 실행 버전은 다른 설정입니다.

## 6. YAML 기본 문법

### 6-1. key: value와 들여쓰기

```yaml
jobs:
  ci:
    name: Test and build
```

jobs 아래 ci가 있고, ci 아래 name이 있습니다. 들여쓰기가 부모·자식 관계를 정합니다. 탭 대신 공백을 사용하며 이 예제는 단계마다 공백 2개를 사용합니다.

ci와 deploy가 같은 들여쓰기 수준인 것은 두 개의 job이 나란히 존재한다는 뜻입니다. YAML에 적힌 위치만으로 두 job의 실행 순서가 정해지지는 않습니다.

### 6-2. 목록: -와 [ ]

```yaml
steps:
  - name: Run tests
    run: npm test
  - name: Build website
    run: npm run build
```

-는 목록의 새 항목입니다. steps는 두 개의 step을 담는 목록입니다. 각 name과 run은 같은 step의 속성입니다.

branches: [main]은 목록을 한 줄로 적은 것입니다. 다음과 같은 의미입니다.

```yaml
branches:
  - main
```

### 6-3. 문자열·불리언·주석·여러 줄 명령

| 표기 | 의미 |
|---|---|
| node-version: '24' | 문자열로 표현한 버전 |
| timeout-minutes: 10 | 숫자 |
| package-manager-cache: false | 불리언 거짓 |
| # 설명 | 주석. 실행에 영향을 주지 않음 |
| workflow_dispatch: | 별도 옵션 없이 이 이벤트를 활성화 |
| run: \| | 아래 여러 줄을 하나의 명령 블록으로 읽음 |

```yaml
- name: Check and build
  run: |
    npm test
    npm run build
```

여러 명령을 한 step에 넣을 수 있지만, 이 실습은 로그와 실패 위치를 쉽게 찾도록 테스트와 빌드를 별도 step으로 나눴습니다.

### 6-4. YAML·GitHub 표현식·셸은 서로 다른 층입니다

```yaml
- name: Show current ref
  env:
    CURRENT_REF: ${{ github.ref }}
  run: printf '%s\n' "$CURRENT_REF"
```

- YAML은 name, env, run의 구조를 정합니다.
- GitHub는 ${{ github.ref }}를 실행 정보로 계산합니다.
- runner의 셸은 $CURRENT_REF를 환경 변수로 읽고 printf를 실행합니다.

${{ ... }}와 $VARIABLE을 같은 문법으로 생각하면 조건식과 명령 작성에서 혼동하기 쉽습니다. [Contexts](https://docs.github.com/en/actions/concepts/workflows-and-actions/contexts), [Expressions](https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions)

## 7. 최상위 설정 설명

### 7-1. name: 표시 이름

name: CI/CD Lab은 Actions 왼쪽 workflow 목록에 표시할 이름입니다. 개별 실행 목록의 제목은 별도로 정해집니다. 이 파일에는 run-name이 없으므로 push 실행에서는 commit 메시지 등을 제목으로 사용합니다.

### 7-2. on: 언제 실행할지

| 설정 | 이번 실습에서의 의미 |
|---|---|
| push → branches: [main] | main에 push되면 실행 |
| pull_request → branches: [main] | main을 대상으로 하는 PR이 생성·갱신되면 실행 |
| workflow_dispatch | Actions에서 수동 실행 허용 |

pull_request의 branches는 **PR의 대상 브랜치(base)**를 필터링합니다. practice/site-update처럼 변경을 보내는 브랜치(compare)의 이름을 필터링하는 설정이 아닙니다.

pull_request는 types를 생략하면 기본적으로 opened, synchronize, reopened 이벤트에 반응합니다. synchronize에는 PR 브랜치에 새 commit을 push해 갱신하는 경우가 포함됩니다. PR 병합은 main의 push 이벤트로 다시 검사됩니다.

수동 실행 버튼을 사용하려면 workflow 파일이 기본 브랜치에 있어야 합니다. 버튼에서 다른 브랜치를 선택할 수도 있지만 이 파일의 배포 조건은 main만 허용합니다. [이벤트별 실행 조건](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)

**이 파일에서 자동 실행되는 경우**는 다음과 같습니다.

| 행동 | 실행 여부 |
|---|---|
| 로컬에서 파일만 수정 | 실행되지 않음 |
| 로컬에서 commit만 생성 | 실행되지 않음 |
| PR 없는 feature 브랜치에 push | 자동 실행되지 않음 |
| main 대상 PR 생성 | CI 실행 |
| 열린 main 대상 PR에 수정 commit push | CI 재실행 |
| main에 push 또는 PR 병합 | CI 실행 후 조건을 만족하면 배포 |

### 7-3. permissions: 자동화 토큰 권한

GitHub는 job에 임시 GITHUB_TOKEN을 자동 제공합니다. 저장소 읽기나 Pages 배포처럼 GitHub와 통신할 때 사용합니다. [GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token)

최상위 contents: read는 기본 작업에 저장소 읽기 권한을 줍니다. deploy는 job 수준에서 pages: write와 id-token: write를 별도로 지정합니다. 명시적으로 permissions 목록을 작성하면 생략한 권한은 none이 되므로, deploy가 모든 기본 권한을 추가로 받는다고 생각하면 안 됩니다. [토큰 권한 설정](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token)

로컬 git push에 사용하는 로그인과 runner의 GITHUB_TOKEN은 별개의 인증입니다. 이 Pages 실습에서는 배포용 PAT나 서버 비밀번호를 직접 등록하지 않습니다.

### 7-4. concurrency: 중복 실행 조정

```yaml
concurrency:
  group: lab-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

같은 workflow와 ref의 실행을 같은 그룹으로 묶습니다. PR에 새 commit이 올라오면 그 PR의 오래된 진행 중 검사를 취소할 수 있습니다. main 실행에서는 cancel-in-progress가 false이므로 진행 중 실행을 취소하지 않습니다.

이 설정은 중복 작업과 겹치는 배포를 조정하는 데 사용합니다. 모든 대기 실행을 순서대로 처리하는 일반적인 FIFO 큐로 보장되는 것은 아닙니다. [Concurrency 설명](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)

## 8. ci job 설명

### 8-1. ci, name, runs-on, timeout-minutes

| 항목 | 역할 |
|---|---|
| ci | job ID. 다른 설정에서 참조하는 이름 |
| name: Test and build | GitHub 화면에 표시할 job 이름 |
| runs-on: ubuntu-latest | GitHub가 제공하는 Ubuntu 실행 환경 선택 |
| timeout-minutes: 10 | job 실행이 10분을 넘으면 제한 적용 |

name을 화면용으로 바꾸더라도 needs에서는 job ID인 ci를 사용해야 합니다. ubuntu-latest의 구성은 시간이 지나며 갱신될 수 있으므로, 앱 실행 버전은 setup-node에서 명시합니다.

### 8-2. uses와 with

```yaml
- name: Set up Node.js
  uses: actions/setup-node@v7
  with:
    node-version: '24'
    package-manager-cache: false
```

uses는 재사용 action을 선택하고 with는 그 action에 입력값을 전달합니다. actions/setup-node@v7은 actions 조직의 setup-node 프로그램을 v7 참조로 사용한다는 뜻입니다.

setup-node는 이 job의 Node.js 버전을 24로 맞춥니다. 이 앱은 외부 의존성이 없으므로 자동 npm 캐시를 비활성화했습니다. [setup-node 공식 저장소](https://github.com/actions/setup-node)

checkout은 실행 대상 소스를 runner에 내려받습니다. checkout을 해야 package.json과 앱 소스를 읽고 명령을 실행할 수 있습니다. [checkout 공식 저장소](https://github.com/actions/checkout)

### 8-3. run과 package.json

run은 runner에서 명령을 실행합니다. 여기서 npm test와 npm run build가 무엇을 하는지는 앱의 package.json이 정합니다.

| 명령 | 이 프로젝트에서 하는 일 |
|---|---|
| npm ci | package-lock.json 기준으로 의존성 환경 구성 |
| npm test | node --test 실행. 계산 함수 테스트 7개 |
| npm run build | scripts/build.js 실행. src 파일을 dist에 복사 |

npm ci는 lockfile과 package.json이 맞지 않으면 실패하며 lockfile을 수정해서 맞추지 않습니다. 기존 node_modules가 있으면 새 설치를 위해 제거합니다. 이 특성 때문에 자동화에서 설치 환경을 재현하는 데 적합합니다. [npm ci 공식 문서](https://docs.npmjs.com/cli/v11/commands/npm-ci/)

명령 이름 npm ci와 개발 방식 CI는 구분하세요. npm ci는 의존성 설치 단계이고, 이 프로젝트의 CI 전체는 설치·테스트·빌드를 포함합니다.

빌드가 단순 복사인 것은 이 앱의 구현 선택입니다. React 등 다른 프로젝트에서는 번들링·컴파일로 바뀌어도 workflow에서 npm run build를 호출하는 구조는 유지할 수 있습니다.

### 8-4. 실패와 종료 코드

프로그램은 종료 코드 0으로 성공, 0이 아닌 값으로 실패를 알립니다. 테스트 실패는 npm test의 실패 종료 코드로 전달되어 Run tests step과 ci job이 실패합니다.

기본 흐름에서 앞선 step이 실패하면 뒤의 일반 step은 건너뜁니다. 이 파일은 continue-on-error를 사용하지 않으므로 테스트 실패를 무시하지 않습니다. needs: ci를 둔 deploy도 실행되지 않습니다.

실패 로그 수집처럼 실패 후에도 필요한 step에는 if: failure() 또는 상황에 맞는 조건을 별도로 사용할 수 있습니다. always()나 continue-on-error를 추가하면 실패 처리 방식이 달라지므로 배포 검사에 무심코 적용하지 마세요. [Job 의존성과 실행 조건](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs)

### 8-5. Pages 준비와 artifact 업로드

Configure Pages는 Pages 설정과 관련 정보를 확인합니다. 이 실습에서는 먼저 Settings → Pages에서 Source를 GitHub Actions로 선택합니다.

Upload website artifact는 dist를 Pages 배포 형식으로 묶어 보관합니다. 소스 전체를 보내는 대신 빌드한 웹사이트 파일을 전달합니다. 이 업로드와 배포는 GitHub Pages 전용 action을 사용합니다. [Pages 워크플로 구성](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 9. deploy job 설명

### 9-1. needs: ci — CI 성공을 기다리기

needs는 job 간 의존성을 정합니다. 이 파일은 ci가 성공해야 deploy를 실행합니다. deploy를 YAML 아래쪽에 적는 것만으로 순서가 보장되지 않으므로 needs를 명시합니다.

needs는 **실행 순서와 성공 조건**을 연결하지만 파일을 복사하지는 않습니다. 파일 전달은 앞서 업로드한 artifact가 담당합니다.

### 9-2. if — main에서만 배포하기

```yaml
if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
```

조건은 두 가지를 동시에 확인합니다.

1. 실행 ref가 main 브랜치인가?
2. 실행 이벤트가 pull_request가 아닌가?

&&는 AND, ==는 같음, !=는 다름입니다. github.ref와 github.event_name은 GitHub가 제공하는 실행 정보입니다. if에서는 보통 ${{ }}를 생략할 수 있습니다. [표현식 문법](https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions)

| 실행 상황 | 대표 ref | CI | 배포 |
|---|---|---|---|
| main push | refs/heads/main | 실행 | CI 성공 후 실행 |
| 열린 PR 검사 | refs/pull/번호/merge | 실행 | 생략 |
| main 수동 실행 | refs/heads/main | 실행 | CI 성공 후 실행 |
| feature 브랜치 수동 실행 | refs/heads/practice/site-update | 실행 | 생략 |

PR 검사의 ref는 일반적으로 PR 병합 가능성을 검사하기 위한 merge ref입니다. main 대상 PR이라고 해서 github.ref가 refs/heads/main이 되는 것은 아닙니다. [pull_request 이벤트](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request)

### 9-3. 배포 권한과 environment

| 설정 | 의미 |
|---|---|
| pages: write | Pages 배포 권한 |
| id-token: write | 배포 신원을 증명할 OIDC 토큰 요청 권한 |
| environment.name: github-pages | 배포 대상 이름과 보호 규칙 연결 |

id-token: write는 저장소 코드를 수정하는 권한을 뜻하지 않습니다. OIDC는 실행의 신원을 검증해 장기 비밀번호 없이 인증을 연결하는 방식입니다. Pages 배포 action은 해당 권한을 사용합니다. [Pages 배포 요구사항](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages#deploying-github-pages-artifacts)

GitHub Environment에는 승인이나 허용 브랜치 같은 배포 보호 규칙을 설정할 수 있습니다. 이 예제는 별도 승인 규칙을 추가하지 않는 자동 배포 실습입니다. Environment 기능의 제공 범위는 저장소 공개 여부와 플랜에 따라 다릅니다. [Environment 관리](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)

### 9-4. id와 outputs: 배포 URL 읽기

```yaml
environment:
  name: github-pages
  url: ${{ steps.deployment.outputs.page_url }}
steps:
  - name: Deploy website
    id: deployment
    uses: actions/deploy-pages@v4
```

id: deployment는 이 step을 코드에서 참조할 식별자입니다. 배포 action이 반환한 page_url을 steps.deployment.outputs.page_url로 읽어 배포 링크에 표시합니다. name: Deploy website는 화면 표시 이름입니다.

deploy-pages는 앞 job이 업로드한 Pages artifact를 배포합니다. 이 job에는 checkout이나 재빌드가 없어 검사한 빌드 결과를 그대로 사용합니다.

## 10. 더 알아야 할 이론

### 10-1. 재현 가능한 환경

내 컴퓨터와 runner의 운영체제·실행 버전·설치 패키지가 다르면 결과도 달라질 수 있습니다. 이 예제는 Node.js 24를 명시하고 lockfile을 commit합니다.

package-lock.json은 앱 의존성의 설치 결과를 고정하는 데 도움을 줍니다. 다만 ubuntu-latest 이미지, Node 24의 패치 버전, action의 메이저 태그까지 모두 완전히 고정하는 것은 아닙니다.

### 10-2. Artifact와 Cache

| 구분 | 목적 | 예 |
|---|---|---|
| Artifact | 특정 실행에서 만든 결과물을 보관하거나 job 간 전달 | 배포할 dist, 테스트 보고서 |
| Cache | 반복 실행에서 재사용해 작업 속도를 높임 | 다운로드한 npm 패키지 |

이 예제에서 artifact는 ci와 deploy를 연결하는 역할을 합니다. 캐시는 없어도 작업이 정상 실행되어야 하며, 오래된 캐시가 배포할 결과물을 대신하지 않습니다. [캐시와 artifact의 차이](https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching)

### 10-3. Context, Variable, Secret

| 구분 | 의미 | 읽는 방법 |
|---|---|---|
| github context | 이벤트·저장소·ref 등 실행 정보 | ${{ github.ref }} |
| env | workflow/job/step에서 정의한 환경 변수 | ${{ env.APP_MODE }} 또는 셸의 $APP_MODE |
| vars | GitHub 설정에서 관리하는 일반 설정값 | ${{ vars.APP_MODE }} |
| secrets | 토큰·비밀번호 등 민감한 설정값 | ${{ secrets.DEPLOY_TOKEN }} |

일반 URL이나 모드 값은 Variables로 관리할 수 있습니다. 비밀번호와 토큰은 Secrets로 관리하고 명령 로그에 출력하지 않습니다. GitHub의 자동 마스킹이 모든 변형된 비밀값을 가려 준다고 보장되지는 않습니다. [변수](https://docs.github.com/en/actions/reference/workflows-and-actions/variables), [Secrets](https://docs.github.com/en/actions/concepts/security/secrets)

현재 Pages 실습은 사용자가 만든 배포 Secret을 요구하지 않습니다. 다음 Python·Docker 배포 실습에서는 호스팅 서비스의 인증 방식에 따라 추가 설정이 필요할 수 있습니다.

### 10-4. 빌드 한 번, 검증한 결과 배포

CI에서 만든 artifact를 CD에서 그대로 배포하면 검사한 버전과 배포한 버전을 연결하기 쉽습니다. commit, workflow run, artifact, deployment의 관계를 기록하면 실패 원인과 되돌릴 버전을 찾는 데 도움이 됩니다.

### 10-5. 롤백

자동 배포 후 문제가 발견되면 이전 정상 버전으로 되돌릴 수 있어야 합니다. 이 실습은 git revert로 변경을 취소하는 새 commit을 만들고, 동일한 CI/CD를 통과해 다시 배포하는 방법을 사용합니다.

이것은 기존 배포를 순간적으로 되돌리는 기능과는 다릅니다. 새 검증과 배포가 완료될 때까지 시간이 필요합니다.

### 10-6. PR 코드와 권한

PR 코드는 runner에서 실행될 수 있으므로 출처에 따라 권한을 구분해야 합니다. 일반적인 fork PR에는 Secrets가 전달되지 않고 GITHUB_TOKEN 쓰기 권한도 제한됩니다. 이 예제는 pull_request로 검사하며 PR에서 배포를 하지 않습니다. [PR 이벤트와 fork 제한](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflows-in-forked-repositories)

pull_request_target은 더 높은 권한의 맥락에서 실행될 수 있는 별도 이벤트입니다. 단순히 배포 권한 문제를 해결하려고 이 이벤트로 바꾸고 PR 코드를 실행하지 마세요.

외부 action에는 버전 참조를 명시합니다. @v7은 편리한 메이저 버전 참조이며, 더 엄격한 고정이 필요하면 검증한 전체 commit SHA를 사용합니다. [안전한 Actions 사용](https://docs.github.com/en/actions/reference/security/secure-use)

## 11. GitHub에서 알아야 할 설정

설정 화면의 표시 항목은 계정 권한·플랜·조직 정책에 따라 달라질 수 있습니다. 아래는 저장소 단위 메뉴를 기준으로 합니다.

### 11-1. Actions 활성화와 허용 action

**Settings → Actions → General**에서 Actions 정책을 확인합니다. 조직이나 저장소가 특정 action만 허용하면 YAML이 올바르더라도 실행이 제한될 수 있습니다.

프로젝트의 checkout, setup-node, configure-pages, upload-pages-artifact, deploy-pages를 사용할 수 있어야 합니다. 제한이 있는 조직에서는 그 정책에 맞춰 설정해야 합니다.

저장소별 허용 정책과 기본 토큰 권한은 [GitHub Actions 설정 공식 문서](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)를 참고하세요.

### 11-2. Workflow permissions

같은 화면의 **Workflow permissions**는 자동화 토큰의 기본 권한과 관련된 설정입니다. 이번 예제는 YAML의 permissions로 각 job의 필요한 권한을 명시합니다. 배포를 위해 저장소 전체를 무조건 Read and write permissions로 바꿀 필요는 없습니다. 실제 허용 범위는 조직 정책과 이벤트 제한도 함께 영향을 줍니다.

### 11-3. GitHub Pages

**Settings → Pages → Build and deployment → Source → GitHub Actions**를 선택합니다. 이 프로젝트는 공개 저장소의 정적 웹사이트를 배포합니다. 배포된 페이지 주소도 Settings → Pages에서 확인할 수 있습니다. [Pages 게시 방식 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

### 11-4. Secrets와 Variables

**Settings → Secrets and variables → Actions**에서 관리합니다.

- **Secrets → New repository secret**: 민감한 배포 토큰 등 등록.
- **Variables**: 민감하지 않은 설정값 등록.

이 실습에서는 추가 Secret을 등록하지 않습니다. 필요한 작업에서만 명시적으로 참조해 사용합니다. [Secrets 설정 방법](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)

### 11-5. 배포 Environment

**Settings → Environments → github-pages**에서 배포 브랜치와 보호 규칙을 확인합니다. 여기서 main 배포가 막혀 있거나 승인이 필요하도록 설정되어 있으면 CI 이후 배포가 거절되거나 대기할 수 있습니다.

environment.name을 쓰는 것만으로 사람 승인이 자동으로 추가되지는 않습니다. 승인 규칙을 별도로 설정해야 합니다.

### 11-6. CI 실패 시 PR 병합 차단

**Settings**에서 **Branches**의 branch protection 또는 **Rulesets**를 사용해 main 보호를 설정할 수 있습니다. Rulesets가 Rules 하위에 표시되는 화면에서는 **Rules → Rulesets**로 이동합니다. 현재 저장소에서 제공되는 방식을 사용합니다. [Ruleset 생성 안내](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)

필수 상태 검사로 **Test and build**를 지정하면 해당 검사 결과를 병합 조건으로 사용할 수 있습니다. 관리자의 우회가 허용되어 있으면 본인 계정에서는 병합이 가능할 수 있으므로 우회 적용 범위도 확인합니다. [보호 브랜치 설명](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

| 막으려는 행동 | 제어하는 설정 |
|---|---|
| 실패한 CI 뒤 배포 실행 | workflow의 needs: ci |
| PR 또는 다른 브랜치에서 운영 배포 | workflow의 if 및 Environment 배포 규칙 |
| 실패한 PR 병합 | branch protection/ruleset의 필수 검사 |

workflow를 만들었다고 실패한 PR의 병합이 자동으로 금지되지는 않습니다. CI 결과를 병합 규칙에 연결해야 합니다.

## 12. GitHub 화면에서 결과 확인하기

### 12-1. 테스트·빌드 로그

1. 저장소 상단 **Actions**를 클릭합니다.
2. 왼쪽 **CI/CD Lab**을 선택합니다.
3. 최신 실행의 제목을 클릭합니다. commit 해시 링크 대신 실행 제목을 선택합니다.
4. **Test and build**를 클릭합니다.
5. **Run tests** 또는 **Build website**를 펼칩니다.

Test and build는 개별 실행 안의 job 이름입니다. Actions의 workflow 목록만 보고 있을 때는 아직 보이지 않을 수 있습니다.

### 12-2. 수동 실행

**Actions → CI/CD Lab → Run workflow**에서 실행 브랜치를 선택합니다. main이면 CI 성공 후 배포하고 다른 브랜치이면 배포를 생략합니다. 이미 배포가 추가된 완성본 기준입니다.

### 12-3. PR 검사와 병합

**Pull requests → 해당 PR → Conversation**에서 검사 결과를 확인합니다. 성공 후 아래의 **Merge pull request → Confirm merge**로 병합합니다. PR 생성 시 base는 main, compare는 변경한 브랜치를 선택합니다.

### 12-4. 실패를 읽는 순서

```text
실패한 workflow run → 실패한 job → 실패한 step → 로그의 원인 메시지
```

| 실패 위치 | 주로 확인할 내용 |
|---|---|
| workflow 자체 | YAML 들여쓰기, 키, 이벤트·정책 제한 |
| Install dependencies | lockfile 유무·일치 여부, 패키지 접근 |
| Run tests | expected와 actual, 입력·출력, 실패한 테스트 |
| Build website | 빌드 명령과 파일 경로 |
| Configure Pages | Pages Source 설정 |
| Upload website artifact | dist 생성 여부와 업로드 경로 |
| Deploy to Pages | 권한, Environment 규칙, artifact 존재 |

**Re-run jobs**는 같은 commit을 다시 실행합니다. 소스 코드 버그를 고쳤다면 수정 commit을 push해야 새 코드가 검사됩니다. 네트워크 등 일시적 문제였다면 재실행이 도움이 될 수 있습니다.

## 13. 확장할 때 배우면 좋은 설정

현재 실습을 마친 뒤 필요한 것부터 추가하세요. 아래 항목은 현재 ci-cd.yml에 포함되어 있지 않습니다.

| 설정·기능 | 사용하는 상황 |
|---|---|
| strategy.matrix | 여러 Node 버전·운영체제에서 검사 |
| paths 필터 | 특정 경로가 변경된 경우에만 실행 |
| schedule | 정해진 시간에 주기적 실행 |
| workflow_dispatch.inputs | 수동 실행 시 옵션 입력 |
| workflow_call | 여러 workflow가 공통 자동화를 재사용 |
| job outputs | job 간 작은 결과값 전달 |
| services | API 테스트용 데이터베이스 등 실행 |
| container | 지정한 컨테이너 안에서 job 실행 |
| cache | 반복 다운로드 시간을 줄임 |

Node 버전을 여러 개로 검사할 때는 예를 들어 다음과 같이 표현합니다. 이것은 **부분 예제**이며 전체 파일을 대체하지 않습니다.

```yaml
strategy:
  matrix:
    node: ['24', '26']
steps:
  - uses: actions/setup-node@v7
    with:
      node-version: ${{ matrix.node }}
```

각 버전 조합에 대해 job이 실행됩니다. 배포는 모든 검사가 끝난 뒤 검증한 하나의 결과물을 선택하도록 별도로 설계합니다.

## 14. 스스로 확인하는 질문

| 질문 | 핵심 답 |
|---|---|
| CI와 CD의 차이는? | CI는 변경의 통합·검증, CD는 검증 후 배포 준비 또는 자동 배포 |
| PR에서 사이트가 바로 바뀌지 않는 이유는? | 배포 조건이 main 실행만 허용함 |
| YAML에서 ci를 위에 적으면 먼저 실행되는가? | job 간 순서는 needs로 정함 |
| needs: ci가 파일도 전달하는가? | 순서·성공 조건을 연결. 파일은 artifact로 전달 |
| uses와 run은? | 재사용 action 호출과 명령 실행 |
| name과 id는? | 화면 표시 이름과 코드 참조 식별자 |
| CI 실패가 PR 병합도 자동으로 막는가? | 필수 검사 규칙을 별도 설정해야 함 |
| npm ci가 CI 전체인가? | 설치 단계. 테스트와 빌드는 별도 명령 |
| 성공한 PR 검사가 배포 성공도 뜻하는가? | 병합 후 main 실행의 배포 결과를 따로 확인 |
| 초록색 검사가 모든 정상 동작을 보장하는가? | 작성한 검사 범위가 통과했다는 뜻 |

## 15. 참고 문서와 실습 파일

- [단계별 실습 README](../README.md)
- [간단한 GitHub Actions 해설](GITHUB-ACTIONS.md)
- [초기 CI 참고본](workflows/01-ci.yml)
- [CI/CD 완성본](workflows/02-ci-cd.yml)
- [GitHub Actions 공식 문법](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)

설명은 제공된 로컬 실습 파일과 2026-10-14 확인한 공식 문서를 기준으로 작성했습니다. 실제 원격 저장소의 실행 결과나 현재 설정을 대신 확인한 기록은 아닙니다.
