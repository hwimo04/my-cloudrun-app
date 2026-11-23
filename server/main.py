import os
import re
from flask import Flask, request, jsonify
from google import genai
from google.genai import types

app = Flask(__name__)

GUARDRAIL_REFUSAL = "죄송합니다. 포트폴리오와 관련된 질문에만 답변할 수 있습니다."

SYSTEM_INSTRUCTION = f"""당신은 FolioLogic의 합격 포트폴리오 전문 AI 멘토입니다.
제공되는 [컨텍스트(포트폴리오 내용 및 장표 분석)]를 기반으로 질문자의 질의에 논리적이고 전문적으로 답변하십시오.

[엄격한 도메인 가드레일 규칙]
사용자의 질문이 제공된 포트폴리오 내용, 장표별 기획 의도, 프로젝트 문제 해결 과정, 성과 지표, 직무 역량 및 취업/이직과 직접적으로 관련이 없는 경우(예: 일상 잡담, 주식/금융, 날씨, 번역, 일반 시사, 연애/엔터테인먼트, 코딩 기초 질문 등),
절대로 답변을 임의로 생성하거나 대화를 이어가지 마십시오.
어떤 추가 설명이나 인사말도 붙이지 말고, 반드시 정확히 아래 문장만을 단독으로 출력해야 합니다:
"{GUARDRAIL_REFUSAL}"
"""

@app.route("/", methods=["GET"])
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "service": "foliologic-ai-backend"}), 200

@app.route("/chat", methods=["POST"])
def chat():
    # 1. API Token 보안 검증
    expected_token = os.environ.get("API_TOKEN")
    received_token = request.headers.get("X-API-Token")
    if not expected_token or received_token != expected_token:
        return jsonify({"error": "Unauthorized: Invalid or missing X-API-Token"}), 401

    # 2. 요청 파라미터 파싱
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    context = (data.get("context") or "").strip()

    if not question:
        return jsonify({"error": "Bad Request: 'question' is required"}), 400

    # 3. 사전 가드레일 휴리스틱 검증 (비도메인 키워드 토큰 낭비 방지)
    irrelevant_patterns = [
        r"주식", r"코인", r"비트코인", r"테슬라", r"날씨", r"로또", r"맛집",
        r"영화", r"노래", r"연애", r"운세", r"심심해", r"놀아줘", r"안녕\s*$", r"누구니"
    ]
    if any(re.search(pat, question) for pat in irrelevant_patterns) and not ("포트폴리오" in question or "장표" in question):
        return jsonify({"answer": GUARDRAIL_REFUSAL}), 200

    # 4. Gemini 클라이언트 호출
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    gemini_model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    if not gemini_api_key:
        return jsonify({"error": "Server Configuration Error: GEMINI_API_KEY is not configured"}), 500

    user_prompt = f"""[컨텍스트 - 포트폴리오 분석 데이터]
{context if context else "컨텍스트 정보 없음"}

[사용자 질문]
{question}
"""

    try:
        client = genai.Client(api_key=gemini_api_key)
        response = client.models.generate_content(
            model=gemini_model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.2,
            )
        )

        answer = (response.text or "").strip()

        # 5. 사후 응답 검증 (가드레일 단독 출력 보장)
        if "포트폴리오와 관련된 질문에만" in answer or "관련된 질문에만 답변" in answer:
            answer = GUARDRAIL_REFUSAL

        return jsonify({"answer": answer}), 200

    except Exception as e:
        return jsonify({"error": f"AI Generation Failed: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
