import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#e6dfcf]">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-[#20263e] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">如何使用 200 OK</h1>
          <p className="text-xl text-[#c5ae8c] max-w-3xl mx-auto">
            無論您是發案者或接案工程師，都能輕鬆在平台上找到最適合的合作夥伴
          </p>
        </div>
      </div>

      {/* For Clients Section */}
      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#20263e] mb-4">給發案者</h2>
          <p className="text-xl text-[#c5ae8c]">
            四步驟快速找到專業人才完成您的專案
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {/* Step 1 */}
          <Card className="p-6 text-center bg-white border-2 border-[#c5ae8c] hover:border-[#20263e] transition">
            <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">1</span>
            </div>
            <h3 className="text-xl font-bold text-[#20263e] mb-3">註冊帳號</h3>
            <p className="text-[#20263e]">
              免費建立您的帳號，開始使用平台功能
            </p>
            <div className="mt-4">
              <svg
                className="w-12 h-12 mx-auto text-[#c5ae8c]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="p-6 text-center bg-white border-2 border-[#c5ae8c] hover:border-[#20263e] transition">
            <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">2</span>
            </div>
            <h3 className="text-xl font-bold text-[#20263e] mb-3">發布案件</h3>
            <p className="text-[#20263e]">
              使用引導式問答建立案件，AI 自動生成專案摘要
            </p>
            <div className="mt-4">
              <svg
                className="w-12 h-12 mx-auto text-[#c5ae8c]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="p-6 text-center bg-white border-2 border-[#c5ae8c] hover:border-[#20263e] transition">
            <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-bold text-[#20263e] mb-3">選擇接案工程師</h3>
            <p className="text-[#20263e]">
              比較投標提案，選擇最適合的專業人才合作
            </p>
            <div className="mt-4">
              <svg
                className="w-12 h-12 mx-auto text-[#c5ae8c]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </Card>

          {/* Step 4 */}
          <Card className="p-6 text-center bg-white border-2 border-[#c5ae8c] hover:border-[#20263e] transition">
            <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">4</span>
            </div>
            <h3 className="text-xl font-bold text-[#20263e] mb-3">完成專案</h3>
            <p className="text-[#20263e]">
              溝通細節、驗收成果，完成專案並給予評價
            </p>
            <div className="mt-4">
              <svg
                className="w-12 h-12 mx-auto text-[#c5ae8c]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
          </Card>
        </div>

        {/* For Freelancers Section */}
        <div className="text-center mb-12 mt-20">
          <h2 className="text-3xl font-bold text-[#20263e] mb-4">給接案工程師</h2>
          <p className="text-xl text-[#c5ae8c]">
            展現您的專業，接取心儀的案件
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {/* Step 1 */}
          <Card className="p-6 text-center bg-white border-2 border-[#c5ae8c] hover:border-[#20263e] transition">
            <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">1</span>
            </div>
            <h3 className="text-xl font-bold text-[#20263e] mb-3">建立檔案</h3>
            <p className="text-[#20263e]">
              完善個人資料、技能與作品集，提升曝光度
            </p>
            <div className="mt-4">
              <svg
                className="w-12 h-12 mx-auto text-[#c5ae8c]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="p-6 text-center bg-white border-2 border-[#c5ae8c] hover:border-[#20263e] transition">
            <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">2</span>
            </div>
            <h3 className="text-xl font-bold text-[#20263e] mb-3">瀏覽案件</h3>
            <p className="text-[#20263e]">
              使用標籤篩選與搜尋功能，找到理想的合作機會
            </p>
            <div className="mt-4">
              <svg
                className="w-12 h-12 mx-auto text-[#c5ae8c]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="p-6 text-center bg-white border-2 border-[#c5ae8c] hover:border-[#20263e] transition">
            <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-bold text-[#20263e] mb-3">提交報價</h3>
            <p className="text-[#20263e]">
              撰寫專業提案與報價，展現您的優勢
            </p>
            <div className="mt-4">
              <svg
                className="w-12 h-12 mx-auto text-[#c5ae8c]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </Card>

          {/* Step 4 */}
          <Card className="p-6 text-center bg-white border-2 border-[#c5ae8c] hover:border-[#20263e] transition">
            <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">4</span>
            </div>
            <h3 className="text-xl font-bold text-[#20263e] mb-3">交付成果</h3>
            <p className="text-[#20263e]">
              按時完成案件，獲得好評累積信用
            </p>
            <div className="mt-4">
              <svg
                className="w-12 h-12 mx-auto text-[#c5ae8c]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-[#20263e] text-center mb-12">
            平台特色
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-all bg-white border-2 border-[#c5ae8c] hover:border-[#20263e]">
              <div className="w-20 h-20 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#20263e] mb-3">
                安全保障
              </h3>
              <p className="text-[#20263e]">
                嚴格的實名認證與信用評價系統，保障雙方權益
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all bg-white border-2 border-[#c5ae8c] hover:border-[#20263e]">
              <div className="w-20 h-20 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#20263e] mb-3">
                快速配對
              </h3>
              <p className="text-[#20263e]">
                智能推薦系統與標籤篩選，讓您快速找到最合適的合作對象
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all bg-white border-2 border-[#c5ae8c] hover:border-[#20263e]">
              <div className="w-20 h-20 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#20263e] mb-3">
                即時溝通
              </h3>
              <p className="text-[#20263e]">
                內建訊息系統，隨時與合作夥伴保持聯繫
              </p>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-[#20263e] text-center mb-12">
            常見問題
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            <Card className="p-6 bg-white border-2 border-[#c5ae8c]">
              <h3 className="text-lg font-bold text-[#20263e] mb-2">
                ❓ 使用平台需要付費嗎？
              </h3>
              <p className="text-[#20263e]">
                註冊和瀏覽案件完全免費！我們僅在交易成功後收取少量服務費。
              </p>
            </Card>

            <Card className="p-6 bg-white border-2 border-[#c5ae8c]">
              <h3 className="text-lg font-bold text-[#20263e] mb-2">
                ❓ 如何確保案件品質？
              </h3>
              <p className="text-[#20263e]">
                我們有完善的評價系統，您可以查看接案工程師的過往評價與作品集，選擇最適合的人選。
              </p>
            </Card>

            <Card className="p-6 bg-white border-2 border-[#c5ae8c]">
              <h3 className="text-lg font-bold text-[#20263e] mb-2">
                ❓ 付款安全嗎？
              </h3>
              <p className="text-[#20263e]">
                我們提供第三方支付保障與託管機制，確保雙方權益。款項會在案件完成驗收後才撥付給接案工程師。
              </p>
            </Card>

            <Card className="p-6 bg-white border-2 border-[#c5ae8c]">
              <h3 className="text-lg font-bold text-[#20263e] mb-2">
                ❓ 發生糾紛怎麼辦？
              </h3>
              <p className="text-[#20263e]">
                我們有專業的客服團隊協助處理糾紛，確保公平合理的解決方案。
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-[#20263e] rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">準備開始了嗎？</h2>
          <p className="text-xl text-[#c5ae8c] mb-8">
            立即加入 200 OK，開啟您的接案或發案之旅
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register">
              <Button className="bg-[#c5ae8c] hover:bg-[#b89d7a] text-[#20263e] px-8 py-3 text-lg font-semibold">
                免費註冊
              </Button>
            </Link>
            <Link href="/projects">
              <Button className="bg-white hover:bg-[#e6dfcf] text-[#20263e] px-8 py-3 text-lg font-semibold">
                瀏覽案件
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
