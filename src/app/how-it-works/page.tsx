"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  UserPlusIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  DocumentCheckIcon,
  TrophyIcon,
  CpuChipIcon,
  CodeBracketIcon,
  BoltIcon,
} from "@heroicons/react/24/solid";

export default function HowItWorksPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  
  return (
    <>
      <SEOHead 
        title="如何運作 - 了解平台使用流程"
        description="了解 200 OK 平台的運作方式。從註冊帳號、發布案件、提交提案到完成專案，完整的流程說明讓您快速上手。無論您是發案者還是接案者，都能輕鬆使用我們的平台。"
        keywords={[
          '使用說明',
          '平台介紹',
          '接案流程',
          '發案流程',
          '如何接案',
          '如何發案',
          '平台使用教學',
          '接案平台說明'
        ]}
      />
      <div ref={containerRef} className="min-h-screen flex flex-col bg-[#e6dfcf]">
        <Navbar />

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-br from-[#20263e] via-[#2d3550] to-[#20263e] pb-24 pt-32 overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5ae8c] rounded-full blur-[120px] opacity-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4f46e5] rounded-full blur-[120px] opacity-10" />
        </div>

        <div className="relative container mx-auto px-4 text-center z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-6 text-white"
          >
            如何使用 200 OK
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl md:text-2xl text-[#c5ae8c] max-w-3xl mx-auto mb-4 font-medium"
          >
            專為軟體工程設計的接案平台
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed"
          >
            透過 AI 輔助與引導式流程，讓需求更清晰，讓接案流程更流暢
          </motion.p>
        </div>
      </motion.div>

      {/* For Clients Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#e6dfcf] rounded-full blur-[100px]" />
          <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-[#c5ae8c] rounded-full blur-[120px] opacity-50" />
        </div>

        <div className="relative container mx-auto max-w-6xl z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#20263e] mb-4">給發案者</h2>
            <p className="text-xl text-[#c5ae8c] mb-2 font-medium">
              透過 AI 輔助與引導式流程，清楚說明您的軟體需求
            </p>
            <p className="text-sm text-[#20263e]/70 max-w-2xl mx-auto">
              AI 會協助您了解需求等級、描述完整度與市場定位，讓您的專案更容易找到合適的工程師
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-8 text-center bg-white border-2 border-[#c5ae8c]/30 hover:border-[#20263e] transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
                <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110">
                  <UserPlusIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-[#c5ae8c] tracking-widest uppercase mb-2">Step 01</div>
                <h3 className="text-xl font-bold text-[#20263e] mb-3">註冊帳號</h3>
                <p className="text-[#20263e]/80 leading-relaxed text-sm">
                  免費建立您的帳號，開始使用平台功能。只需幾分鐘即可完成註冊。
                </p>
              </Card>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-8 text-center bg-white border-2 border-[#c5ae8c]/30 hover:border-[#20263e] transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
                <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110">
                  <DocumentTextIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-[#c5ae8c] tracking-widest uppercase mb-2">Step 02</div>
                <h3 className="text-xl font-bold text-[#20263e] mb-3">發布案件</h3>
                <p className="text-[#20263e]/80 leading-relaxed text-sm">
                  透過引導性類型特化步驟，AI 輔助您清楚描述軟體需求，自動分析需求等級與完整度
                </p>
              </Card>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="p-8 text-center bg-white border-2 border-[#c5ae8c]/30 hover:border-[#20263e] transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
                <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110">
                  <UserGroupIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-[#c5ae8c] tracking-widest uppercase mb-2">Step 03</div>
                <h3 className="text-xl font-bold text-[#20263e] mb-3">選擇接案工程師</h3>
                <p className="text-[#20263e]/80 leading-relaxed text-sm">
                  查看軟體工程師的技能展示與作品集，比較投標提案，選擇最適合的專業人才
                </p>
              </Card>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="p-8 text-center bg-white border-2 border-[#c5ae8c]/30 hover:border-[#20263e] transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
                <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110">
                  <CheckCircleIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-[#c5ae8c] tracking-widest uppercase mb-2">Step 04</div>
                <h3 className="text-xl font-bold text-[#20263e] mb-3">完成專案</h3>
                <p className="text-[#20263e]/80 leading-relaxed text-sm">
                  透過平台內建溝通工具協作，驗收成果，完成專案並給予評價
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Freelancers Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-[#e6dfcf]">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-[#c5ae8c] rounded-full blur-[100px]" />
          <div className="absolute bottom-[20%] -left-[10%] w-[40%] h-[40%] bg-white rounded-full blur-[120px]" />
        </div>

        <div className="relative container mx-auto max-w-6xl z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#20263e] mb-4">給接案工程師</h2>
            <p className="text-xl text-[#c5ae8c] mb-2 font-medium">
              專為軟體工程師設計，節省更多力氣去釐清需求
            </p>
            <p className="text-sm text-[#20263e]/70 max-w-2xl mx-auto">
              透過專屬技能展示空間，讓接案流程更流暢，專注於您最擅長的開發工作
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-8 text-center bg-white border-2 border-[#c5ae8c]/30 hover:border-[#20263e] transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
                <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110">
                  <IdentificationIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-[#c5ae8c] tracking-widest uppercase mb-2">Step 01</div>
                <h3 className="text-xl font-bold text-[#20263e] mb-3">建立檔案</h3>
                <p className="text-[#20263e]/80 leading-relaxed text-sm">
                  專為軟體工程師設計的檔案系統，完善技能展示、作品集與專業經歷，讓發案者更了解您的專業能力
                </p>
              </Card>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-8 text-center bg-white border-2 border-[#c5ae8c]/30 hover:border-[#20263e] transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
                <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110">
                  <MagnifyingGlassIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-[#c5ae8c] tracking-widest uppercase mb-2">Step 02</div>
                <h3 className="text-xl font-bold text-[#20263e] mb-3">瀏覽案件</h3>
                <p className="text-[#20263e]/80 leading-relaxed text-sm">
                  查看經過 AI 分析的需求清晰案件，使用標籤篩選與搜尋功能，快速找到理想的合作機會
                </p>
              </Card>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="p-8 text-center bg-white border-2 border-[#c5ae8c]/30 hover:border-[#20263e] transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
                <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110">
                  <DocumentCheckIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-[#c5ae8c] tracking-widest uppercase mb-2">Step 03</div>
                <h3 className="text-xl font-bold text-[#20263e] mb-3">提交報價</h3>
                <p className="text-[#20263e]/80 leading-relaxed text-sm">
                  撰寫專業提案與報價，展現您的技術優勢與過往經驗，提高獲選機會
                </p>
              </Card>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="p-8 text-center bg-white border-2 border-[#c5ae8c]/30 hover:border-[#20263e] transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
                <div className="w-16 h-16 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110">
                  <TrophyIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-[#c5ae8c] tracking-widest uppercase mb-2">Step 04</div>
                <h3 className="text-xl font-bold text-[#20263e] mb-3">交付成果</h3>
                <p className="text-[#20263e]/80 leading-relaxed text-sm">
                  按時完成案件，獲得好評累積信用，建立您的專業聲譽
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-[#e6dfcf] rounded-full blur-[100px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-[#c5ae8c] rounded-full blur-[120px] opacity-50" />
        </div>

        <div className="relative container mx-auto max-w-6xl z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#20263e] mb-4">
              平台特色
            </h2>
            <p className="text-lg text-[#c5ae8c] font-medium max-w-2xl mx-auto">
              與綜合型接案平台做出區隔，專為軟體工程設計
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full"
            >
              <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 bg-white border-2 border-[#c5ae8c]/30 hover:border-[#20263e] hover:-translate-y-2 h-full">
                <div className="w-20 h-20 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <CpuChipIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#20263e] mb-3">
                  AI 輔助需求分析
                </h3>
                <p className="text-[#20263e]/80 leading-relaxed">
                  透過引導性類型特化步驟與 AI 輔助，讓發案者清楚說明需求，了解需求等級、描述完整度與市場定位
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full"
            >
              <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 bg-white border-2 border-[#c5ae8c]/30 hover:border-[#20263e] hover:-translate-y-2 h-full">
                <div className="w-20 h-20 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <CodeBracketIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#20263e] mb-3">
                  專屬技能展示
                </h3>
                <p className="text-[#20263e]/80 leading-relaxed">
                  專為軟體工程師設計的檔案系統，讓接案工程師節省更多力氣去釐清需求，接案流程更流暢
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-full"
            >
              <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 bg-white border-2 border-[#c5ae8c]/30 hover:border-[#20263e] hover:-translate-y-2 h-full">
                <div className="w-20 h-20 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <BoltIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#20263e] mb-3">
                  流暢接案流程
                </h3>
                <p className="text-[#20263e]/80 leading-relaxed">
                  從需求發布到專案完成，每個環節都經過優化，讓軟體專案合作更高效順暢
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative py-20 px-4 overflow-hidden bg-[#e6dfcf]">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#20263e] mb-4">
              常見問題
            </h2>
            <p className="text-lg text-[#c5ae8c] font-medium">
              為您解答關於平台的常見疑問
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                question: "使用平台需要付費嗎？",
                answer: "註冊和瀏覽案件完全免費！我們僅在交易或接洽時收取少量服務費，確保您只在獲得價值時才需要付費。"
              },
              {
                question: "如何確保案件品質？",
                answer: "我們有完善的評價系統與作品集連結展示功能，您可以查看接案工程師的過往評價、技能認證與實際作品，選擇最適合的專業人才。"
              },
              {
                question: "發生糾紛怎麼辦？",
                answer: "我們有專業的團隊協助處理糾紛，透過平台內建的溝通記錄與專案管理工具，確保公平合理的解決方案。"
              },
              {
                question: "AI 輔助功能如何使用？",
                answer: "在發布案件時，系統會透過引導式問答協助您描述需求，AI 會自動分析需求等級、完整度與市場定位，讓您的案件更容易被合適的工程師看到。"
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white border-2 border-[#c5ae8c]/30 hover:border-[#20263e] transition-all duration-300 hover:shadow-lg">
                  <h3 className="text-lg font-bold text-[#20263e] mb-3 flex items-start gap-3">
                    <span className="text-[#c5ae8c] font-bold text-xl shrink-0">Q{index + 1}</span>
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-[#20263e]/80 leading-relaxed ml-8">
                    {faq.answer}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-[#20263e] via-[#2d3550] to-[#20263e] overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5ae8c] rounded-full blur-[150px] opacity-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4f46e5] rounded-full blur-[150px] opacity-10" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto text-center z-10"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
            準備開始您的<span className="text-[#c5ae8c]">軟體專案</span>了嗎？
          </h2>
          <p className="text-xl text-[#c5ae8c] mb-4 font-medium">
            立即加入 200 OK，專為軟體工程設計的接案平台
          </p>
          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            透過 AI 輔助與引導式流程，讓需求更清晰，讓合作更順暢
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
            <Link href="/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="!bg-[#c5ae8c] hover:!bg-[#b89d7a] !text-[#20263e] px-8 py-3 text-lg font-bold border-none shadow-lg transition-all">
                  免費註冊
                </Button>
              </motion.div>
            </Link>
            <Link href="/projects">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="!bg-white/10 hover:!bg-white/20 !text-white px-8 py-3 text-lg font-bold border-2 border-white/30 backdrop-blur-sm transition-all">
                  瀏覽案件
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
      </div>
    </>
  );
}
