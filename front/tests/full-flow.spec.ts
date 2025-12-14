import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:8000/api/v1";

test.describe("🔎 반하우스 전체 기능 자동 점검", () => {

  // 1) 회원가입 → 로그인 → JWT 확보
  test("1. 회원가입 및 로그인", async ({ request }) => {

    const email = "test" + Date.now() + "@example.com";
    const password = "test1234";

    // 회원가입
    const signup = await request.post(`${API_BASE}/auth/signup`, {
      data: { email, password, password_confirm: password }
    });
    expect(signup.status()).toBe(200);

    // 로그인
    const login = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password }
    });
    expect(login.status()).toBe(200);

    const token = (await login.json()).access_token;
    expect(token).not.toBeUndefined();
  });

  // 2) 우리회사 등록
  test("2. 우리회사 정보 등록", async ({ request }) => {

    const res = await request.post(`${API_BASE}/company`, {
      data: {
        corp_num: "1234567890",
        corp_name: "테스트회사",
        ceo_name: "홍길동",
        email: "company@example.com",
        biz_type: "서비스업",
        biz_class: "개발",
      }
    });

    expect(res.status()).toBe(200);
  });

  // 3) 거래처 생성
  test("3. 거래처 등록", async ({ request }) => {
    const res = await request.post(`${API_BASE}/client`, {
      data: {
        name: "테스트거래처",
        corp_num: "1112223334",
        email: "client@example.com",
      }
    });
    expect(res.status()).toBe(200);
  });

  // 4) 사업자 상태조회
  test("4. 사업자 상태조회", async ({ request }) => {

    const res = await request.get(`${API_BASE}/corp/state/1112223334`);
    expect([200, 400]).toContain(res.status());
  });

  // 5) 세금계산서 발행
  test("5. 세금계산서 발행", async ({ request }) => {

    const res = await request.post(`${API_BASE}/invoice/issue`, {
      data: {
        supplier_corp_num: "1234567890",
        recipient_corp_num: "1112223334",
        items: [
          {
            name: "품목1",
            qty: 1,
            price: 10000,
          }
        ]
      }
    });

    expect([200, 400]).toContain(res.status());
  });

  // 6) 프론트 UI 흐름 테스트
  test("6. UI 전체 흐름 체크", async ({ page }) => {

    await page.goto("http://localhost:3000");

    // 로그인 페이지
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "test1234");
    await page.click('button:has-text("로그인")');

    // 이동 확인
    await expect(page.locator("text=우리회사")).toBeVisible();

    // 거래처 페이지 이동
    await page.click('text=거래처');
    await expect(page.locator("text=거래처 등록")).toBeVisible();

    // 빠른 발행 페이지 이동
    await page.click('text=빠른발행');
    await expect(page.locator("text=품목")).toBeVisible();

    // 입력 후 바로발행 버튼 클릭
    await page.fill('input[name="itemName"]', "테스트품목");
    await page.fill('input[name="itemQty"]', "1");
    await page.fill('input[name="itemPrice"]', "10000");

    await page.click('button:has-text("바로발행")');

    // 안내창 또는 성공 메시지 확인
    const modal = page.locator(".modal");
    await expect(modal).toBeVisible();
  });

});
