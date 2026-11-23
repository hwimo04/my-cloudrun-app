---
name: gas-url-sync
description: >-
  Cloud Run 배포 완료 후 출력된 서비스 URL을 GAS 웹훅을 통해 스크립트 속성(PropertiesService)에 자동 주입하여 동기화합니다.
---

# Cloud Run URL to GAS Properties Sync Skill

## 개요
GitHub Actions 배포 직후 `${{ steps.deploy.outputs.url }}`로 출력된 Cloud Run 서비스 URL을 지정된 GAS 웹앱 엔드포인트로 전송하여, GAS 코드를 재배포하지 않고도 스크립트 속성(`SERVICE_URL`)을 동적으로 갱신합니다.

## 실행 지침
1. **GAS 웹훅 엔드포인트 준비**: GAS 프로젝트 내에 `doPost(e)` 함수를 구현하여 수신된 `serviceName`과 `serviceUrl`을 `PropertiesService.getScriptProperties().setProperty(...)`로 저장하도록 구성합니다.
2. **GitHub Actions 스텝 추가**: 배포 스텝(`google-github-actions/deploy-cloudrun@v2`, `id: deploy`) 바로 아래에 아래의 cURL 전송 스텝을 삽입합니다.
   ```yaml
   - name: Register URL to GAS Properties
     run: |
       SERVICE_URL="${{ steps.deploy.outputs.url }}"
       curl -X POST -L \
         -H "Content-Type: application/json" \
         -d '{"serviceName": "my-service", "serviceUrl": "'"$SERVICE_URL"'"}' \
         "${{ secrets.GAS_WEBHOOK_URL }}"
   ```
