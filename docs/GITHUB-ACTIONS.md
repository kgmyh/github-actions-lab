# 이 프로젝트로 읽는 GitHub Actions

## CI와 CD가 실행하는 일

CI(Continuous Integration)는 코드가 합쳐지기 전에 자동으로 검증하는 과정입니다. 이 프로젝트는 npm ci → npm test → npm run build를 실행합니다.

CD는 Continuous Delivery 또는 Continuous Deployment를 뜻합니다. 이 실습에서는 성공한 main의 빌드를 승인 단계 없이 자동 배포하므로 Continuous Deployment에 해당합니다.

GitHub Actions는 이 과정을 실행하는 도구이고, GitHub Pages는 빌드 결과를 웹사이트로 제공하는 서비스입니다.

```text
PR 생성 / PR에 새 commit
  └─ ci: 설치 → 테스트 → 빌드
       └─ deploy: skipped (PR은 배포하지 않음)

main에 push / main에서 수동 실행
  └─ ci: 설치 → 테스트 → 빌드 → Pages 준비 → artifact 업로드
       ├─ 성공 → deploy: artifact를 Pages에 배포
       └─ 실패 → deploy: skipped (기존 배포 유지)
```

## YAML 용어

| 항목 | 이 실습에서의 의미 |
|---|---|
| workflow | .github/workflows/ci-cd.yml에 정의한 자동화 전체 |
| on | 실행 계기. main push, main 대상 PR, 수동 실행 |
| workflow_dispatch | Actions 화면의 Run workflow 버튼을 제공 |
| job | ci와 deploy처럼 하나의 작업 단위 |
| runs-on | 작업할 컴퓨터. GitHub가 제공하는 Ubuntu runner 사용 |
| step | checkout, Node 설정, 테스트처럼 순서대로 수행할 일 |
| uses | 이미 만들어진 action 사용 |
| run | runner에서 명령 실행 |
| needs: ci | ci 성공 후 deploy를 실행. 두 job 사이 의존성 |
| if | 해당 작업을 실행할 조건 |
| permissions | 자동 제공되는 GITHUB_TOKEN의 권한 범위 |
| environment | 배포 대상을 github-pages라는 이름으로 표시 |
| concurrency | 같은 PR의 오래된 검사를 취소하고 main 배포 실행을 조정 |
| artifact | job 사이에서 전달하는 파일 묶음. 여기서는 dist 웹사이트 |
| ${{ ... }} | GitHub가 실행 시 계산하는 표현식 |

서로 다른 job은 기본적으로 독립적입니다. 위 파일은 needs로 순서를 정하고, 업로드한 artifact로 배포할 파일을 전달합니다. deploy에서 소스를 다시 빌드하지 않으므로 검사한 결과물을 그대로 배포합니다.

## 왜 세 명령을 분리할까요?

- npm ci: package-lock.json 기준으로 의존성 환경을 구성합니다. 이 앱은 외부 의존성이 없어도 명령과 lockfile 사용법을 익히게 합니다.
- npm test: 계산 결과와 입력 검증을 확인합니다. 실패하면 종료 코드가 0이 아니므로 job이 실패합니다.
- npm run build: 웹사이트 파일을 dist에 준비합니다. 테스트가 앞에서 실패하면 이 step도 건너뜁니다.

빌드는 이 작은 앱에서 파일 복사입니다. 큰 앱에서는 번들링이나 컴파일로 바뀌어도 CI/CD의 흐름은 같습니다. 이 빌드 자체가 테스트를 대신하지는 않습니다.

## 조건식 읽기

```yaml
if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
```

main의 push나 main에서 수동 실행한 경우만 artifact를 올리고 배포합니다. feature 브랜치에서 수동 실행하면 CI만 수행합니다. PR 검사에는 보통 refs/pull/... ref가 사용되며 배포 조건을 만족하지 않습니다.

## 배포 권한과 Secrets

CI job은 contents: read만 사용합니다. deploy job에는 pages: write와 id-token: write를 줍니다. 후자는 GitHub가 배포 신원을 증명할 수 있게 하는 OIDC 토큰 권한입니다.

이 실습은 GitHub가 제공하는 인증을 사용하므로 별도 서버 비밀번호나 사용자가 만든 배포용 PAT를 Secrets에 넣지 않습니다. 로컬 Git push 로그인은 이 배포 인증과 별개의 과정입니다.

## 반드시 구분할 두 가지

1. CI 실패가 후속 배포를 막는 것: needs: ci로 구현합니다.
2. CI 실패가 PR 병합을 막는 것: 저장소의 branch protection/ruleset에서 별도로 설정해야 합니다.

워크플로 파일만 추가했다고 실패한 PR의 병합이 자동으로 금지되지는 않습니다. README의 선택 실습에서 상태 검사를 필수로 지정할 수 있습니다.

## 실패를 읽는 순서

Actions 실행 목록 → 실패한 실행 → 빨간 job → 빨간 step → 로그의 첫 관련 오류.

실습 버그는 Run tests에서 Expected/actual 차이를 남깁니다. 테스트는 요구사항인 1,000원을 기대하지만 버그가 있는 계산은 10,000원을 반환합니다. 테스트의 기대값을 바꾸면 잘못된 결과를 정답으로 인정하게 됩니다. lab:fix로 계산 코드를 복구하세요.

## 돌아보기

- uses와 run의 차이는 무엇인가요?
- needs: ci를 지우면 어떤 문제가 생길 수 있나요?
- PR을 만들어도 운영 사이트가 바로 바뀌지 않는 이유는 무엇인가요?
- 실패한 실행의 Re-run jobs만 눌렀을 때 같은 버그가 다시 나타나는 이유는 무엇인가요?
- dist를 Git에 commit하지 않아도 배포할 수 있는 이유는 무엇인가요?
- CI가 통과했어도 Pages 설정이 잘못돼 있으면 어떤 job 또는 step이 실패할까요?

## 공식 문서

- [Actions의 기본 개념](https://docs.github.com/en/actions/get-started/understand-github-actions)
- [Node.js 빌드와 테스트](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)
- [Pages 게시 소스 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Pages 사용자 지정 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node)

2026-10-13 공식 문서를 확인한 예제입니다. Action 자체가 사용하는 Node 버전과 앱의 node-version: '24'는 서로 다른 설정입니다. 이 예제는 GitHub 호스팅 runner를 사용합니다.
