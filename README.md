# GitHub Actions 실습 ① — 자동 테스트에서 자동 배포까지

앱은 이미 완성되어 있습니다. 코드를 처음부터 작성하지 않고 GitHub Actions의 실행 조건, 로그, 실패, PR 검사, 배포를 직접 경험합니다.

이후 실습 순서는 ② Python API + 서버 배포, ③ Docker + 서버 배포입니다. 이 폴더는 첫 번째 실습만 담고 있습니다.

## 준비된 것

- 원 단위 팁 계산기: 10,000원 × 10% → 팁 1,000원, 총액 11,000원.
- 정상 계산, 반올림, 입력 오류 등을 검증하는 자동 테스트 7개.
- 배포할 파일을 dist에 만드는 빌드 명령.
- 즉시 사용할 CI 설정과 나중에 적용할 CI/CD 완성 설정.
- 버그 주입/복구 명령. 직접 앱 코드를 고칠 필요가 없습니다.

## 실습 지도

| 단계 | 직접 할 일 | 관찰할 결과 |
|---|---|---|
| 1 | 로컬 테스트와 앱 실행 | 내 컴퓨터에서 정상 작동 |
| 2 | GitHub에 첫 push | GitHub 컴퓨터에서도 테스트와 빌드 성공 |
| 3 | 버그가 있는 PR 생성 | 테스트 실패 로그와 건너뛴 빌드 |
| 4 | 같은 PR에서 버그 복구 후 병합 | 새 commit 자동 검사와 main 재검사 |
| 5 | Pages 설정과 CD 템플릿 적용 | CI 성공 뒤 실제 웹사이트 배포 |
| 6 | 문구 변경 PR을 병합 | PR에서는 배포 없음, 병합 뒤 사이트 갱신 |
| 선택 | 실패한 main 실행, 되돌리기, 필수 검사 | 배포 차단·롤백·병합 차단의 차이 |

GitHub에서 실행되는 부분은 본인 계정의 저장소에 올려야 확인할 수 있습니다. 제공된 파일에 원격 실행 결과가 미리 들어 있지는 않습니다.

## 1. 내 컴퓨터에서 실행

준비물: GitHub 계정, Git, Node.js 24 이상과 npm. 외부 앱 라이브러리는 없습니다.

이 프로젝트 폴더에서 터미널을 열고 실행하세요. Codex가 제공한 원본 폴더를 그대로 사용한다면:

```bash
cd /Users/kgmyh/Documents/Codex/2026-10-13/new-chat/outputs/github-actions-lab
node --version
npm --version
git --version
npm ci
npm test
npm run dev
```

ZIP을 다른 곳에 풀었다면 cd 경로만 그 폴더로 바꾸세요.

예상 결과:

- node --version: v24 이상. 설치가 필요하면 [Node.js 공식 다운로드](https://nodejs.org/en/download)에서 LTS를 설치합니다.
- npm test: tests 7, pass 7, fail 0.
- npm run dev: dist를 만든 뒤 http://127.0.0.1:4173 에서 미리보기를 시작합니다.
- 브라우저에서 10,000원, 10%의 총액이 11,000원으로 표시됩니다.

확인이 끝나면 터미널에서 **Ctrl+C**로 서버를 종료합니다. 이후 명령은 같은 프로젝트 폴더에서 실행합니다. 코드 변경을 로컬 미리보기에 반영하려면 npm run dev를 다시 실행하세요.

**배울 점:** 이 명령을 GitHub 컴퓨터가 대신 실행하게 만드는 것이 다음 단계의 CI입니다.

## 2. GitHub에 올려 첫 CI 실행

### 2-1. 로컬 저장소 만들기

```bash
git init -b main
git add .
git commit -m "chore: start GitHub Actions lab"
```

이 폴더는 Git 이력이 없는 상태로 제공됩니다. dist와 node_modules는 .gitignore 때문에 commit에 포함되지 않습니다. .github 폴더는 포함됩니다.

commit에서 이름/이메일 설정을 요구하면 아래 예시 값을 **본인의 값으로 바꿔** 실행한 뒤 commit을 다시 실행하세요. 이 설정은 현재 저장소에만 적용합니다. 이메일은 GitHub Settings → Emails에서 확인한 비공개 noreply 주소도 사용할 수 있습니다.

```bash
git config user.name "본인의 이름"
git config user.email "본인의 GitHub 이메일"
git commit -m "chore: start GitHub Actions lab"
```

### 2-2. 저장소 게시 — 두 방법 중 하나

**방법 A: GitHub Desktop을 사용하면 로그인 설정이 간단합니다.**

1. GitHub Desktop에서 본인 계정에 로그인합니다.
2. File → Add local repository로 이 프로젝트 폴더를 추가합니다.
3. Publish repository를 누릅니다.
4. 이름을 github-actions-lab으로 정하고 **Keep this code private를 해제**해 공개 저장소로 게시합니다.

방법 A를 사용했다면 바로 2-3으로 갑니다. 다음 단계의 git push는 Desktop의 Push origin으로 대신할 수도 있습니다.

**방법 B: 터미널로 게시합니다.**

1. [GitHub 새 저장소 만들기](https://github.com/new)를 엽니다.
2. 이름: github-actions-lab, 공개 범위: Public.
3. README, .gitignore, License 자동 생성은 선택하지 않고 빈 저장소를 만듭니다.
4. 아래 URL의 YOUR_USERNAME을 본인 GitHub 아이디로 바꿔 실행합니다.

```bash
git remote add origin https://github.com/YOUR_USERNAME/github-actions-lab.git
git push -u origin main
```

HTTPS push 인증은 GitHub 계정 비밀번호를 사용하지 않습니다. 이미 설정한 Git 인증이나 GitHub Desktop을 쓰면 편합니다. PAT를 직접 사용하는 경우 Actions 파일 업로드에 필요한 권한도 있어야 합니다. 인증 방법은 [GitHub 공식 안내](https://docs.github.com/en/get-started/git-basics/why-is-git-always-asking-for-my-password)를 참고하세요.

### 2-3. 실행 결과 찾기

GitHub 저장소 → **Actions** → **CI/CD Lab** → 최신 실행 → **Test and build**를 엽니다.

다음 step들이 순서대로 성공해야 합니다.

```text
Checkout repository
Set up Node.js
Install dependencies
Run tests
Build website
```

Run tests를 펼쳐 **pass 7 / fail 0**을 찾아보세요.

첫 단계의 파일은 .github/workflows/ci-cd.yml입니다. 현재는 CI만 정의되어 있어 아직 사이트가 배포되지 않습니다. 파일 이름은 CD를 추가해도 계속 사용합니다.

**체크:** 내가 수동으로 테스트하지 않아도 push 때문에 자동 실행되었나요?

## 3. 의도적인 실패를 PR에서 경험

main을 정상 상태로 유지하면서 새 브랜치에서 실패를 만듭니다.

```bash
git switch -c practice/ci-failure
npm run lab:break
git diff
npm test
```

이 테스트 실패는 실습의 예상 결과입니다. lab:break는 src/calculator.js의 TIP_DIVISOR를 100에서 10으로 바꿉니다. 10%를 잘못 계산하므로 예상 팁 1,000원과 실제 팁 10,000원이 다르게 나타납니다.

```bash
git add src/calculator.js
git commit -m "test: intentionally break tip calculation"
git push -u origin practice/ci-failure
```

GitHub 저장소 → Pull requests → New pull request에서 **base: main**, **compare: practice/ci-failure**로 PR을 만듭니다. Compare & pull request 버튼이 뜨면 그것을 사용해도 됩니다.

PR에서 검사가 시작되고 실패합니다. Details 또는 Actions 실행으로 들어가 **Run tests** 로그를 확인합니다.

- CI의 Run tests가 빨간색으로 실패합니다.
- Build website는 앞선 테스트 실패 때문에 건너뜁니다.
- 실패 로그에서 expected와 actual 값의 차이를 찾을 수 있습니다.

현재 workflow는 main push와 main 대상 PR을 검사합니다. feature 브랜치 push만 하고 PR을 만들지 않으면 자동 실행이 없는 것이 정상입니다.

**체크:** 테스트가 실패한 이유를 실행 로그만 보고 설명할 수 있나요?

## 4. 같은 PR을 복구하고 병합

계산 코드의 버그를 복구합니다. 테스트의 기대값은 수정하지 않습니다.

```bash
npm run lab:fix
npm test
printf '# CI 실습 기록\n\n실패 로그를 확인하고 계산 코드를 복구했습니다.\n' > docs/practice-notes.md
git add src/calculator.js docs/practice-notes.md
git commit -m "fix: restore correct tip calculation"
git push
```

같은 PR에 새 commit이 추가되고 검사가 자동 재실행됩니다. 성공한 최신 검사를 확인한 뒤 GitHub에서 **Merge pull request → Confirm merge**로 병합합니다. 비교하기 쉽도록 이 실습에서는 기본 merge 방식을 사용합니다.

main에도 push 이벤트가 발생하므로 CI가 다시 실행됩니다. 로컬 main을 최신 상태로 맞춥니다.

```bash
git switch main
git pull --ff-only
```

버그 복구 후 앱 코드는 원래 상태로 돌아옵니다. 함께 추가한 docs/practice-notes.md가 PR의 최종 변경으로 남고, Commits에는 실패/복구 이력이 남습니다.

**체크:** 같은 PR에서 새 commit을 올리면 자동으로 다시 검사되나요?

## 5. CD를 추가해 GitHub Pages에 배포

### 5-1. Pages 배포 방식 설정

GitHub 저장소 → **Settings → Pages → Build and deployment → Source → GitHub Actions**를 선택합니다.

이미 준비한 workflow를 사용할 것이므로 제안되는 다른 템플릿은 추가하지 않습니다. Pages 활성화가 끝난 뒤 다음 명령을 실행하세요. [공식 설정 문서](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

### 5-2. 준비된 CI/CD 설정 적용

```bash
cp docs/workflows/02-ci-cd.yml .github/workflows/ci-cd.yml
git diff .github/workflows/ci-cd.yml
git add .github/workflows/ci-cd.yml
git commit -m "ci: deploy passing builds to GitHub Pages"
git push
```

기존 CI 파일을 **교체**합니다. .github/workflows에 두 파일을 동시에 두면 중복 실행되므로 템플릿을 그 폴더에 추가 파일로 넣지 마세요. docs/workflows의 파일은 참고용이며 자동 실행되지 않습니다.

Actions에서 다음 흐름을 확인합니다.

```text
Test and build → Deploy to Pages
```

CI가 dist를 artifact로 업로드하고 deploy가 그 파일을 배포합니다. deploy에는 **needs: ci**가 있어 CI가 실패하면 배포하지 않습니다. [공식 배포 문서](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

사이트 주소는 실행의 배포 링크 또는 Settings → Pages에서 확인합니다. 일반적인 형태는 https://YOUR_USERNAME.github.io/github-actions-lab/ 입니다.

첫 배포 직후에는 웹사이트가 표시되기까지 잠시 걸릴 수 있습니다. 성공한 배포와 Pages의 Visit site 링크를 확인하세요.

**체크:** artifact가 무엇이고, deploy가 왜 ci 뒤에 실행되는지 설명할 수 있나요?

## 6. 화면 변경 → PR 검사 → 자동 배포

앱을 직접 작성할 필요 없이 준비된 문구 변경 명령을 사용합니다.

```bash
git switch -c practice/site-update
npm run lab:update
git diff src/index.html
npm test
npm run build
git add src/index.html
git commit -m "feat: update calculator headline"
git push -u origin practice/site-update
```

GitHub에서 main 대상으로 PR을 만듭니다.

1. PR 검사: **Test and build 성공**, **Deploy to Pages skipped**를 확인합니다.
2. 배포 사이트의 제목은 아직 **팁 계산기**입니다.
3. PR을 병합합니다.
4. main 실행에서 **Test and build → Deploy to Pages**가 성공할 때까지 기다립니다.
5. 사이트를 새로고침합니다. 제목이 **한 끼 팁 계산기**로 바뀝니다.

```bash
git switch main
git pull --ff-only
```

브라우저에 예전 화면이 남으면 강력 새로고침을 해보세요. macOS에서는 Command+Shift+R입니다.

이 단계가 **코드 변경 → 검증 → 통합 → 자동 배포**의 전체 흐름입니다.

## 선택 A. 실패한 main은 새 버전을 배포하지 않는지 확인

아직 branch protection을 설정하지 않은 개인 실습 저장소에서만 진행하세요. 공동 작업 저장소에서는 별도 실습 저장소를 사용합니다.

```bash
git switch main
npm run lab:break
git add src/calculator.js
git commit -m "test: verify deployment is blocked by failing CI"
git push
```

예상 결과: Run tests 실패, deploy skipped, 이미 배포한 정상 웹사이트는 유지. 원격 코드에 버그가 있어도 새 빌드가 배포되지 않는 것을 확인합니다.

확인 후 바로 복구합니다.

```bash
npm run lab:fix
npm test
git add src/calculator.js
git commit -m "fix: recover from failed CI experiment"
git push
```

예상 결과: CI 성공 후 정상 버전 재배포. 선택 A까지 완료했다면 로컬과 원격 main 모두 정상입니다.

## 선택 B. 배포된 화면 변경을 되돌리기

6단계의 문구 변경을 되돌리는 실습입니다. 이력 삭제 대신 되돌리는 새 commit을 만들어 동일한 CI/CD를 통과시킵니다.

```bash
git switch -c practice/revert-headline
git log --oneline -- src/index.html
```

목록에서 **feat: update calculator headline** commit의 짧은 해시를 찾습니다. merge commit 대신 해당 문구 변경 commit을 선택합니다. 아래 HEADLINE_COMMIT을 그 해시로 바꾸세요.

```bash
git revert HEADLINE_COMMIT
npm test
git push -u origin practice/revert-headline
```

열리는 편집기에서 기본 revert 메시지를 저장하고 닫습니다. 원하면 git revert --no-edit HEADLINE_COMMIT으로 편집기를 생략할 수 있습니다. PR을 만들어 성공한 검사 후 병합하면 제목이 다시 팁 계산기로 배포됩니다.

```bash
git switch main
git pull --ff-only
```

## 선택 C. 실패한 PR의 병합도 막기

**배포 차단과 병합 차단은 서로 다른 설정입니다.** workflow의 needs는 배포를 막습니다. 실패한 PR 병합을 막으려면 GitHub 저장소의 branch protection 또는 ruleset에서 **Test and build** 검사를 필수로 지정해야 합니다.

공개 저장소에는 GitHub Free에서도 branch protection을 사용할 수 있습니다. [공식 설명](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

이 선택 실습은 A와 B를 끝낸 뒤 진행합니다. main 보호를 켜면 앞 단계의 직접 push 방식이 제한될 수 있기 때문입니다.

1. Settings → Branches에서 main의 보호 규칙을 추가합니다. UI에 Add classic branch protection rule이 있다면 그 항목을 사용합니다.
2. Require status checks to pass before merging을 켭니다.
3. 최근 실행된 **Test and build** 검사를 필수로 지정합니다.
4. 관리자 본인에게도 적용하려면 Do not allow bypassing the above settings를 켭니다.
5. 3단계와 같은 버그 PR을 다른 이름의 브랜치로 만들어 병합이 막히는지 확인합니다.
6. lab:fix로 수정하고 push해 성공 후 병합합니다.

다른 사람의 승인까지 필수로 설정하면 혼자 하는 실습이 막힐 수 있습니다. 여기서는 상태 검사만 필수로 지정합니다.

## 문제가 생겼을 때

| 현상 | 확인할 것 |
|---|---|
| node 또는 npm을 찾지 못함 | Node.js 설치 후 터미널 다시 열기 |
| 4173 포트 사용 중 | 이전 npm run dev 서버를 Ctrl+C로 종료 |
| commit이 이름/이메일을 요구 | 2-1의 저장소별 git config 설정 |
| origin already exists | git remote -v로 대상 확인. 이미 맞는 저장소면 add 생략 |
| HTTPS push 인증 실패 | GitHub Desktop 로그인 또는 공식 Git 인증 설정 사용. 계정 비밀번호로 인증하지 않음 |
| non-fast-forward로 push 거절 | 빈 원격 저장소로 시작했는지 확인. 기존 이력을 덮어쓰지 말고 원인 확인 |
| Actions 실행이 없음 | .github/workflows 파일이 commit되어 있는지, main push인지/PR을 만들었는지 확인 |
| Actions 사용이 비활성화됨 | Settings → Actions → General의 정책 확인. 개인 실습용 저장소의 기본 정책 권장 |
| npm ci 실패 | package-lock.json이 commit됐는지, package.json과 일치하는지 확인 |
| Run tests 실패 | lab:break 상태라면 lab:fix 실행 후 수정 commit push |
| Re-run해도 같은 실패 | 재실행은 같은 commit을 다시 검사. 수정한 새 commit을 push해야 함 |
| Configure Pages에서 실패 | Settings → Pages → Source가 GitHub Actions인지 확인 |
| PR에서 deploy skipped | 정상. main의 성공한 실행만 배포하도록 설정했음 |
| main에서 deploy skipped | ci 실패 여부와 실행한 ref 확인 |
| 배포 성공인데 404 | Pages가 알려 주는 전체 주소와 저장소 경로 확인. 첫 게시 반영 기다리기 |
| workflow_dispatch 버튼 없음 | workflow 파일이 기본 브랜치 main에 있는지 확인 |
| 배포 환경에서 branch 거절 | Settings → Environments → github-pages에서 main 배포를 허용하는지 확인 |

## 파일 지도

```text
.github/workflows/ci-cd.yml    처음엔 CI만, 5단계에서 CI/CD로 교체
docs/workflows/01-ci.yml      초기 CI 참고본
docs/workflows/02-ci-cd.yml   CI/CD 완성본
docs/GITHUB-ACTIONS.md       용어, 조건식, 권한과 로그 읽기
src/                        완성된 웹앱
tests/calculator.test.js     자동 테스트 7개
scripts/build.js            배포 파일 생성
scripts/serve.js            로컬 미리보기
scripts/lab.js              실습용 버그 주입/복구/문구 변경
package.json                명령 정의
package-lock.json           재현 가능한 설치를 위한 lockfile
dist/                       빌드 결과. Git에 넣지 않음
```

## 완료 기준

- [ ] 첫 main push로 CI가 자동 실행됐다.
- [ ] 실패한 PR의 로그에서 잘못된 계산 결과를 찾았다.
- [ ] 같은 PR에 수정 commit을 올려 CI를 성공시켰다.
- [ ] main의 성공한 빌드를 GitHub Pages에 배포했다.
- [ ] PR 상태와 병합 후 배포 상태의 차이를 확인했다.
- [ ] 화면 변경이 자동으로 사이트에 반영됐다.

실습이 끝나면 [GitHub Actions 해설](docs/GITHUB-ACTIONS.md)의 돌아보기 질문에 답해보세요.
