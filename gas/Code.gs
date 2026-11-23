/**
 * FolioLogic (합격로그) Google Apps Script Application Server
 * 
 * - doGet 라우팅 (?page=admin / ?page=index)
 * - 관리자 접근 제어 (ADMIN_EMAILS 화이트리스트 검사)
 * - Cloud Run AI 백엔드 통신 (UrlFetchApp)
 * - Google Sheets DB 스토리지 연동 (portfolios, portfolio_pages, chat_logs)
 */

// ==========================================
// 1. 라우팅 및 웹앱 엔드포인트
// ==========================================

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'index';

  if (page === 'admin') {
    // 관리자 페이지 접근 제어
    if (!isAdminUser_()) {
      var deniedHtml = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>접근 권한 없음</title>' +
        '<script src="https://cdn.tailwindcss.com"></script></head>' +
        '<body class="bg-slate-50 min-h-screen flex items-center justify-center p-4">' +
        '<div class="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">' +
        '<div class="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">' +
        '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>' +
        '</div>' +
        '<h1 class="text-xl font-bold text-slate-900 mb-2">접근 권한이 없습니다 (403)</h1>' +
        '<p class="text-sm text-slate-600 mb-6">등록된 관리자 이메일 계정으로 로그인한 경우에만 접근할 수 있습니다.<br>(현재 로그인: ' + (Session.getActiveUser().getEmail() || '비로그인') + ')</p>' +
        '<a href="?page=index" class="inline-block w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition">메인으로 돌아가기</a>' +
        '</div></body></html>';
      return HtmlService.createHtmlOutput(deniedHtml)
        .setTitle('접근 권한 없음 - FolioLogic')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }

    return HtmlService.createTemplateFromFile('admin')
      .evaluate()
      .setTitle('FolioLogic 관리자 검수 대시보드')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // 메인 페이지 (index.html)
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('FolioLogic (합격로그) - AI 포트폴리오 로직 분석')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Cloud Run 배포 웹훅 (gas-url-sync 스킬 지원)
 */
function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : '';
    var payload = raw ? JSON.parse(raw) : {};
    var props = PropertiesService.getScriptProperties();

    if (payload.serviceUrl) {
      props.setProperty('CLOUD_RUN_URL', payload.serviceUrl);
    }
    if (payload.apiToken) {
      props.setProperty('API_TOKEN', payload.apiToken);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      updated: {
        cloudRunUrl: payload.serviceUrl || null,
        timestamp: new Date().toISOString()
      }
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 2. 관리자 권한 및 시크릿 관리 헬퍼
// ==========================================

function isAdminUser_() {
  var userEmail = (Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  var adminEmailsProp = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS') || '';
  if (!userEmail || !adminEmailsProp) return false;

  var adminList = adminEmailsProp.toLowerCase().split(',').map(function(e) {
    return e.trim();
  });
  return adminList.indexOf(userEmail) !== -1;
}

function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty('SPREADSHEET_ID');

  if (sheetId) {
    try {
      return SpreadsheetApp.openById(sheetId);
    } catch (e) {
      Logger.log('Cannot open spreadsheet by ID: ' + e);
    }
  }

  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      props.setProperty('SPREADSHEET_ID', active.getId());
      return active;
    }
  } catch (e) {}

  var created = SpreadsheetApp.create('FolioLogic_Database');
  props.setProperty('SPREADSHEET_ID', created.getId());
  return created;
}

// ==========================================
// 3. 시트 초기화 함수 (setupSheets)
// ==========================================

function setupSheets() {
  var ss = getSpreadsheet_();
  
  // 1. portfolios 시트
  var pSheet = ss.getSheetByName('portfolios');
  if (!pSheet) {
    pSheet = ss.insertSheet('portfolios');
  }
  if (pSheet.getLastRow() === 0) {
    pSheet.appendRow([
      'id', 'title', 'applicant_name', 'applicant_background',
      'job_category', 'target_firm', 'page_count', 'view_count',
      'bookmark_count', 'match_rate', 'created_at', 'status'
    ]);
    
    // 시드 데이터 추가
    pSheet.appendRow([
      'toss-pm-01',
      '비전공 문과의 토스 신입 PM 최종 합격 포트폴리오',
      '김지원',
      '비전공/인문계열 (경영학)',
      '서비스 기획 / PM',
      '빅테크 / 핀테크 (토스)',
      12, 14200, 2341, 98, new Date().toISOString(), 'PUBLISHED'
    ]);
    pSheet.appendRow([
      'daangn-uiux-01',
      '동네생활 커뮤니티 리텐션 32% 개선 UI/UX 케이스 스터디',
      '박준영',
      '부트캠프 수료 (비전공 6개월)',
      '프로덕트 디자이너 (UI/UX)',
      '커머스 / 플랫폼 (당근마켓)',
      10, 11800, 1890, 95, new Date().toISOString(), 'PUBLISHED'
    ]);
    pSheet.appendRow([
      'naver-fe-01',
      '대규모 트래픽 렌더링 최적화 & 디자인 시스템 구축기',
      '이지훈',
      '공학 / 컴퓨터공학 전공',
      '프론트엔드 개발',
      '빅테크 (네이버웹툰)',
      14, 9400, 1420, 92, new Date().toISOString(), 'PUBLISHED'
    ]);
    pSheet.appendRow([
      'yanolja-pm-01',
      '이탈율 40% 감소시킨 B2B 파트너 센터 온보딩 개편',
      '최서연',
      '중고신입 (타 산업 인턴 6개월)',
      '서비스 기획 / PM',
      '플랫폼 / 트래블테크 (야놀자)',
      8, 8100, 1120, 90, new Date().toISOString(), 'PUBLISHED'
    ]);
  }

  // 2. portfolio_pages 시트
  var pgSheet = ss.getSheetByName('portfolio_pages');
  if (!pgSheet) {
    pgSheet = ss.insertSheet('portfolio_pages');
  }
  if (pgSheet.getLastRow() === 0) {
    pgSheet.appendRow([
      'id', 'portfolio_id', 'page_number', 'title',
      'problem_definition', 'methodology', 'outcome',
      'image_url', 'logic_boxes_json'
    ]);
    
    // toss-pm-01 장표 시드 데이터
    pgSheet.appendRow([
      'pg-toss-01', 'toss-pm-01', 1,
      '표지 & 프로젝트 개요: 결제 전환 퍼널 개선',
      '기존 결제 흐름의 복잡한 인증 절차로 인한 이탈 문제 정의',
      'Double Diamond 프레임워크',
      '프로젝트 핵심 목표 설정 (C-to-D 전환 15%p 향상)',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      '[]'
    ]);
    pgSheet.appendRow([
      'pg-toss-02', 'toss-pm-01', 2,
      'VOC 및 정성 인터뷰 기반 유저 페인포인트 추출',
      '사용자 8명 심층 인터뷰를 통해 3중 본인 인증 단계의 심리적 저항 확인',
      '5 Whys 근본 원인 분석',
      '핵심 가설 수립 (인증 단계 단축 시 전환율 20% 상승)',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      '[]'
    ]);
    pgSheet.appendRow([
      'pg-toss-03', 'toss-pm-01', 3,
      '초기 진입 장벽 분석: 결제 전환 퍼널 내 68% 이탈 지점 발굴',
      '결제 전환 퍼널 내 68% 이탈 지점이 인증 팝업 지연 시간(평균 2.4초)에 기인함을 Amplitude 코호트 분석으로 증명',
      'Double Diamond + 5 Whys 결합 가설 설정',
      '단일 결제 진입 이탈률 14.8%p 개선 및 MAU 결제 완료 기여 논리 구조화',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=80',
      JSON.stringify([
        { id: 'box1', title: '핵심 병목 68%', desc: '불필요한 3중 본인 인증이 주요 원인', rate: '32%' },
        { id: 'box2', title: '타깃 KPI', desc: 'C-to-D 전환 15%p ↑', rate: '17.2%' }
      ])
    ]);
  }

  // 3. chat_logs 시트
  var cSheet = ss.getSheetByName('chat_logs');
  if (!cSheet) {
    cSheet = ss.insertSheet('chat_logs');
  }
  if (cSheet.getLastRow() === 0) {
    cSheet.appendRow([
      'id', 'portfolio_id', 'page_number', 'user_email',
      'question', 'answer', 'is_guardrail_triggered', 'created_at'
    ]);
  }

  return {
    status: 'success',
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl()
  };
}

// ==========================================
// 4. 클라이언트 노출 함수 (google.script.run)
// ==========================================

/**
 * 포트폴리오 목록 조회
 */
function getPortfolios(filterCriteria) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName('portfolios');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  var results = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      item[headers[j]] = row[j];
    }
    
    // 필터링 적용 (직무, 배경 등)
    if (filterCriteria) {
      if (filterCriteria.job && filterCriteria.job !== '전체' && item.job_category.indexOf(filterCriteria.job) === -1) {
        continue;
      }
      if (filterCriteria.background && filterCriteria.background !== '전체' && item.applicant_background.indexOf(filterCriteria.background) === -1) {
        continue;
      }
    }

    results.push(item);
  }

  return results;
}

/**
 * 포트폴리오 상세 및 장표 목록 조회
 */
function getPortfolioDetail(portfolioId) {
  var ss = getSpreadsheet_();
  var pSheet = ss.getSheetByName('portfolios');
  var pgSheet = ss.getSheetByName('portfolio_pages');
  if (!pSheet || !pgSheet) return null;

  var pData = pSheet.getDataRange().getValues();
  var portfolio = null;
  var pHeaders = pData[0];

  for (var i = 1; i < pData.length; i++) {
    if (pData[i][0] === portfolioId) {
      portfolio = {};
      for (var j = 0; j < pHeaders.length; j++) {
        portfolio[pHeaders[j]] = pData[i][j];
      }
      break;
    }
  }

  if (!portfolio) return null;

  // 장표 목록 추출
  var pgData = pgSheet.getDataRange().getValues();
  var pgHeaders = pgData[0];
  var pages = [];

  for (var k = 1; k < pgData.length; k++) {
    if (pgData[k][1] === portfolioId) {
      var page = {};
      for (var m = 0; m < pgHeaders.length; m++) {
        page[pgHeaders[m]] = pgData[k][m];
      }
      pages.push(page);
    }
  }

  // 페이지 순서 정렬
  pages.sort(function(a, b) {
    return Number(a.page_number) - Number(b.page_number);
  });

  return {
    portfolio: portfolio,
    pages: pages
  };
}

/**
 * AI 멘토 질의응답 (Cloud Run 프록시)
 */
function askAiMentor(portfolioId, pageNumber, question) {
  var props = PropertiesService.getScriptProperties();
  var cloudRunUrl = props.getProperty('CLOUD_RUN_URL');
  var apiToken = props.getProperty('API_TOKEN');

  var detail = getPortfolioDetail(portfolioId);
  var targetPage = null;
  if (detail && detail.pages) {
    for (var i = 0; i < detail.pages.length; i++) {
      if (Number(detail.pages[i].page_number) === Number(pageNumber)) {
        targetPage = detail.pages[i];
        break;
      }
    }
  }

  var context = '';
  if (detail && detail.portfolio) {
    context += '[포트폴리오: ' + detail.portfolio.title + ' / 지원자: ' + detail.portfolio.applicant_background + ']\n';
  }
  if (targetPage) {
    context += '[장표 ' + targetPage.page_number + '페이지: ' + targetPage.title + ']\n' +
      '- 문제 정의: ' + targetPage.problem_definition + '\n' +
      '- 방법론/프레임워크: ' + targetPage.methodology + '\n' +
      '- 성과 지표: ' + targetPage.outcome + '\n';
  }

  var answerText = '';
  var isGuardrail = false;

  // Cloud Run 호출
  if (cloudRunUrl && apiToken) {
    try {
      var options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'X-API-Token': apiToken
        },
        payload: JSON.stringify({
          question: question,
          context: context
        }),
        muteHttpExceptions: true
      };

      var response = UrlFetchApp.fetch(cloudRunUrl.replace(/\/$/, '') + '/chat', options);
      var resCode = response.getResponseCode();
      var resBody = JSON.parse(response.getContentText());

      if (resCode === 200 && resBody.answer) {
        answerText = resBody.answer;
        if (answerText.indexOf('포트폴리오와 관련된 질문에만') !== -1) {
          isGuardrail = true;
        }
      } else {
        answerText = '죄송합니다. AI 응답 처리 중 오류가 발생했습니다. (' + resCode + ')';
      }
    } catch (e) {
      answerText = 'AI 백엔드 서버에 연결할 수 없습니다: ' + e.toString();
    }
  } else {
    // Cloud Run 미설정 시 폴백 응답
    if (question.match(/(주식|날씨|로또|영화|안녕|누구)/)) {
      answerText = '죄송합니다. 포트폴리오와 관련된 질문에만 답변할 수 있습니다.';
      isGuardrail = true;
    } else {
      answerText = '[안내] Cloud Run AI 백엔드 URL이 설정되지 않아 모의 응답을 반환합니다.\n' +
        '해당 장표는 정량적 퍼널 분석(68% 이탈)을 선행하여 데이터 기반 기획력을 명확히 증명한 사례입니다.';
    }
  }

  // 질의응답 로그 기록
  try {
    var ss = getSpreadsheet_();
    var cSheet = ss.getSheetByName('chat_logs');
    if (cSheet) {
      cSheet.appendRow([
        'chat-' + Utilities.getUuid().substring(0, 8),
        portfolioId,
        pageNumber,
        Session.getActiveUser().getEmail() || 'anonymous',
        question,
        answerText,
        isGuardrail,
        new Date().toISOString()
      ]);
    }
  } catch (logErr) {
    Logger.log('Logging failed: ' + logErr);
  }

  return {
    answer: answerText,
    isGuardrail: isGuardrail
  };
}

// ==========================================
// 5. 관리자 전용 서버 함수 (admin.html 연동)
// ==========================================

function adminGetDashboard() {
  if (!isAdminUser_()) {
    throw new Error('403 Forbidden: 관리자 권한이 없습니다.');
  }

  var ss = getSpreadsheet_();
  var pSheet = ss.getSheetByName('portfolios');
  var list = getPortfolios();

  return {
    adminEmail: Session.getActiveUser().getEmail(),
    portfolios: list,
    totalCount: list.length,
    spreadsheetUrl: ss.getUrl()
  };
}

function adminSavePortfolio(portfolioData) {
  if (!isAdminUser_()) {
    throw new Error('403 Forbidden: 관리자 권한이 없습니다.');
  }

  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName('portfolios');
  if (!sheet) throw new Error('portfolios sheet not found');

  var id = portfolioData.id || ('pf-' + Utilities.getUuid().substring(0, 8));
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      rowIndex = i + 1;
      break;
    }
  }

  var row = [
    id,
    portfolioData.title || '',
    portfolioData.applicant_name || '익명',
    portfolioData.applicant_background || '',
    portfolioData.job_category || '',
    portfolioData.target_firm || '',
    Number(portfolioData.page_count || 1),
    Number(portfolioData.view_count || 0),
    Number(portfolioData.bookmark_count || 0),
    Number(portfolioData.match_rate || 90),
    new Date().toISOString(),
    portfolioData.status || 'PUBLISHED'
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return { status: 'success', id: id };
}

function adminSavePage(pageData) {
  if (!isAdminUser_()) {
    throw new Error('403 Forbidden: 관리자 권한이 없습니다.');
  }

  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName('portfolio_pages');
  if (!sheet) throw new Error('portfolio_pages sheet not found');

  var id = pageData.id || ('pg-' + Utilities.getUuid().substring(0, 8));
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      rowIndex = i + 1;
      break;
    }
  }

  var row = [
    id,
    pageData.portfolio_id,
    Number(pageData.page_number || 1),
    pageData.title || '',
    pageData.problem_definition || '',
    pageData.methodology || '',
    pageData.outcome || '',
    pageData.image_url || '',
    pageData.logic_boxes_json || '[]'
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return { status: 'success', id: id };
}
