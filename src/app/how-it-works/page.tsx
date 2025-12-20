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
      <div className="bg-[#20263e] text-white pb-20 pt-16 -mt-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">如何使用 200 OK</h1>
          <p className="text-xl text-[#c5ae8c] max-w-3xl mx-auto mb-4">
            專為軟體工程設計的接案平台，與綜合型接案平台做出區隔
          </p>
          <p className="text-lg text-white/80 max-w-3xl mx-auto">
            透過引導性類型特化步驟與 AI 輔助，讓需求更清晰，讓接案流程更流暢
          </p>
        </div>
      </div>

      {/* For Clients Section */}
      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#20263e] mb-4">給發案者</h2>
          <p className="text-xl text-[#c5ae8c] mb-2">
            透過 AI 輔助與引導式流程，清楚說明您的軟體需求
          </p>
          <p className="text-sm text-[#20263e]/70">
            AI 會協助您了解需求等級、描述完整度與市場定位
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
              透過引導性類型特化步驟，AI 輔助您清楚描述軟體需求，自動分析需求等級與完整度
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
              查看軟體工程師的技能展示與作品集，比較投標提案，選擇最適合的專業人才
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
          <p className="text-xl text-[#c5ae8c] mb-2">
            專為軟體工程師設計，節省更多力氣去釐清需求
          </p>
          <p className="text-sm text-[#20263e]/70">
            透過專屬技能展示空間，讓接案流程更流暢
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
              專為軟體工程師設計的檔案系統，完善技能展示、作品集與專業經歷
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
              查看經過 AI 分析的需求清晰案件，使用標籤篩選與搜尋功能，找到理想的合作機會
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
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#20263e] mb-4">
              平台特色
            </h2>
            <p className="text-lg text-[#c5ae8c]">
              與綜合型接案平台做出區隔，專為軟體工程設計
            </p>
          </div>

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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#20263e] mb-3">
                AI 輔助需求分析
              </h3>
              <p className="text-[#20263e]">
                透過引導性類型特化步驟與 AI 輔助，讓發案者清楚說明需求，了解需求等級、描述完整度與市場定位
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
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#20263e] mb-3">
                專屬技能展示
              </h3>
              <p className="text-[#20263e]">
                專為軟體工程師設計的檔案系統，讓接案工程師節省更多力氣去釐清需求，接案流程更流暢
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
                流暢接案流程
              </h3>
              <p className="text-[#20263e]">
                從需求發布到專案完成，每個環節都經過優化，讓軟體專案合作更高效順暢
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
          <p className="text-xl text-[#c5ae8c] mb-2">
            立即加入 200 OK，專為軟體工程設計的接案平台
          </p>
          <p className="text-sm text-white/80 mb-8">
            透過 AI 輔助與引導式流程，讓需求更清晰，讓合作更順暢
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
