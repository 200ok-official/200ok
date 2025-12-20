"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CreateProjectWizard } from "@/components/projects/create/CreateProjectWizard";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#e6dfcf]">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 頁面標題 */}
          <div id="new-project-header" className="text-center mb-6">
            <h1 className="text-4xl font-bold text-[#20263e] mb-3">
              建立新專案
            </h1>
            <p className="text-lg text-[#c5ae8c]">
              透過簡單的問答，讓我們了解您的需求
            </p>
          </div>

          {/* 引導式表單 */}
          <CreateProjectWizard />
        </div>
      </main>

      <Footer />
    </div>
  );
}

