# Langfuse (React + Vite + JSX)
### 시작하기
1. git 저장소 다운로드 
```shell 
$ git clone https://github.com/SIEUN-C/Langfuse-FE-Renewal_T.git
```
2. 다운로드 받은 파일로 이동
```shell
$ cd --react_langfuse
```
3. `.env` 파일 환경 생성 및 설정
```javascript
// 생성경로
// C:\<폴더경로>\--React_LANGFUSE/.env
; 도커내부 API 게이트웨이 사용시
VITE_INTERNAL_URL=//localhost:28099

; 로컬 API 게이트웨이 사용시
; VITE_INTERNAL_URL=//localhost:28099

; 로컬백엔드 사용시
; VITE_INTERNAL_URL=//localhost:8092

# Langfuse API credentials
VITE_LANGFUSE_BASE_URL="http://localhost:3000" # langfuse docker 주소
VITE_LANGFUSE_PUBLIC_KEY="pk-..." # 퍼블릭 키 수정 
VITE_LANGFUSE_SECRET_KEY="sk-..." # 시크릿 키 수정
```
4. npm 설치 [npm 설치 공식 사이트](https://nodejs.org/en/download)
5. npm 버전 확인
```
$ npm -v
10.9.3
```
6. 프로젝트 노드 모듈 설치
```shell
$ npm install
```
7. 프로젝트 실행
```shell
$ npm run dev
```
### 폴더구조
```

```
