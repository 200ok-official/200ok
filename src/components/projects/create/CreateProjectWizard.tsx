"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiPost } from "@/lib/api";

// 引入各步驟組件 - 全新開發流程
import { Step1ProjectType } from "./steps/Step1ProjectType";
import { Step2UsageScenario } from "./steps/Step2UsageScenario";
import { Step3Goals } from "./steps/Step3Goals";
import { Step4Features } from "./steps/Step4Features";
import { Step5Outputs } from "./steps/Step5Outputs";
import { Step6Reference } from "./steps/Step6Reference";
import { Step7Integrations } from "./steps/Step7Integrations";
import { Step8BudgetSchedule } from "./steps/Step8BudgetSchedule";
import { Step9Deliverables } from "./steps/Step9Deliverables";
import { Step10Additional } from "./steps/Step10Additional";

// 引入修改維護流程
import { Step2MaintenanceSystem } from "./steps/Step2MaintenanceSystem";
import { Step3MaintenanceProblems } from "./steps/Step3MaintenanceProblems";
import { Step4MaintenanceTech } from "./steps/Step4MaintenanceTech";
import { Step5MaintenanceBudgetSimple } from "./steps/Step5MaintenanceBudgetSimple";
import { Step6MaintenanceExpectations } from "./steps/Step6MaintenanceExpectations";

interface FormData {
  // Step 1 - 共用
  projectMode: string;
  projectType: string;
  projectTypeOther?: string;
  
  // 共用欄位
  budgetMin: number;
  budgetMax: number;
  budgetEstimateOnly: boolean;
  startDate?: Date;
  deadline?: Date;
  deadlineFlexible: boolean;
  paymentMethod: string;
  paymentSchedule?: string;
  referenceLinks: string[];
  specialRequirements?: string;
  
  // === 全新開發流程 (Step 2-10) ===
  usageScenario: string;
  goals: string;
  features: string[];
  outputs: string[];
  outputsOther?: string;
  designStyle: string[];
  screenshots?: File[];
  integrations: string[];
  integrationsOther?: string;
  requiredTechStacks?: string[]; // 新增：全新開發也可選擇技術棧
  techStackOther?: string;       // 新增：其他技術說明
  deliverables: string[];
  communicationPreference: string[];
  concerns: string[];
  
  // === 修改維護流程 (Step 2-6) ===
  // Step 2: 系統基本資訊
  maint_system_name?: string;
  maint_system_purpose?: string;
  maint_current_users_count?: string;
  maint_system_age?: string;
  
  // Step 3: 問題與需求
  maint_current_problems?: string;
  maint_desired_improvements?: string;
  maint_new_features?: string;
  
  // Step 4: 技術資訊
  maint_known_tech_stack?: string[];
  maint_has_source_code?: boolean;
  maint_has_documentation?: boolean;
  maint_can_provide_access?: boolean;
  maint_technical_contact?: string;
  
  // Step 5: 預算時程（使用共用欄位）
  
  // Step 6: 交付期望
  maint_expected_outcomes?: string;
  maint_success_criteria?: string;
  maint_additional_notes?: string;
}

const NEW_DEVELOPMENT_STEPS = 10;
const MAINTENANCE_STEPS = 6;

export const CreateProjectWizard: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<FormData>>({
    features: [],
    outputs: [],
    referenceLinks: [],
    designStyle: [],
    integrations: [],
    budgetMin: 40000,
    budgetMax: 80000,
    budgetEstimateOnly: false,
    deadlineFlexible: true,
    paymentMethod: "installment",
    deliverables: [],
    communicationPreference: [],
    concerns: [],
    requiredTechStacks: [], // 預設值
  });

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const getTotalSteps = () => {
    return formData.projectMode === "maintenance_modification" 
      ? MAINTENANCE_STEPS 
      : NEW_DEVELOPMENT_STEPS;
  };

  const scrollToHeader = () => {
    if (typeof window === "undefined") return;
    const header = document.getElementById("new-project-header");
    if (header) {
      const rect = header.getBoundingClientRect();
      const offset = window.pageYOffset + rect.top - 16; // 保留一點上方空間
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  };

  const validateCurrentStep = (): boolean => {
    const isMaintenanceMode = formData.projectMode === "maintenance_modification";

    switch (currentStep) {
      case 1:
        if (!formData.projectMode) {
          alert("請選擇專案類型（全新開發或修改維護）");
          return false;
        }
        if (formData.projectMode === "new_development" && !formData.projectType) {
          alert("請選擇專案類型");
          return false;
        }
        return true;

      case 2:
        if (isMaintenanceMode) {
          if (!formData.maint_system_name) {
            alert("請輸入系統名稱");
            return false;
          }
          if (!formData.maint_system_purpose || formData.maint_system_purpose.length < 10) {
            alert("請說明系統用途（至少 10 字）");
            return false;
          }
          if (!formData.maint_current_users_count) {
            alert("請選擇使用人數");
            return false;
          }
          if (!formData.maint_system_age) {
            alert("請選擇系統使用時間");
            return false;
          }
        }
        return true;

      case 3:
        if (isMaintenanceMode) {
          if (!formData.maint_current_problems || formData.maint_current_problems.length < 20) {
            alert("請描述目前的問題（至少 20 字）");
            return false;
          }
          if (!formData.maint_desired_improvements || formData.maint_desired_improvements.length < 20) {
            alert("請描述希望的改善（至少 20 字）");
            return false;
          }
        }
        return true;

      case 4:
        if (isMaintenanceMode) {
          if (formData.maint_has_source_code === undefined) {
            alert("請選擇是否有原始碼");
            return false;
          }
          if (formData.maint_has_documentation === undefined) {
            alert("請選擇是否有文件");
            return false;
          }
          if (formData.maint_can_provide_access === undefined) {
            alert("請選擇是否可提供系統存取");
            return false;
          }
        }
        return true;

      case 5:
        if (isMaintenanceMode) {
          if (!formData.budgetMin || !formData.budgetMax) {
            alert("請選擇預算範圍");
            return false;
          }
          if (!formData.paymentMethod) {
            alert("請選擇付款方式");
            return false;
          }
        }
        return true;

      case 6:
        if (isMaintenanceMode) {
          if (!formData.maint_expected_outcomes || formData.maint_expected_outcomes.length < 20) {
            alert("請描述預期成果（至少 20 字）");
            return false;
          }
        }
        return true;

      case 8:
        if (!isMaintenanceMode) {
          if (!formData.budgetMin || !formData.budgetMax) {
            alert("請輸入預算範圍");
            return false;
          }
          if (!formData.paymentMethod) {
            alert("請選擇付款方式");
            return false;
          }
        }
        return true;

      default:
        return true;
    }
  };

  const nextStep = () => {
    // 驗證當前步驟
    if (!validateCurrentStep()) {
      return;
    }

    const totalSteps = getTotalSteps();
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      scrollToHeader();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollToHeader();
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    const isMaintenanceMode = formData.projectMode === "maintenance_modification";
    setIsSubmitting(true);
    
    try {
      const payload = {
        title: isMaintenanceMode 
          ? formData.maint_system_name || "系統修改維護專案"
          : `${formData.projectType}專案`,
        description: isMaintenanceMode 
          ? formData.maint_system_purpose || "" 
          : formData.usageScenario || "",
        project_mode: formData.projectMode,
        project_type: formData.projectType,
        budget_min: formData.budgetMin,
        budget_max: formData.budgetMax,
        budget_estimate_only: formData.budgetEstimateOnly,
        start_date: formData.startDate,
        deadline: formData.deadline,
        deadline_flexible: formData.deadlineFlexible,
        payment_method: formData.paymentMethod,
        payment_schedule: formData.paymentSchedule,
        reference_links: formData.referenceLinks?.filter(link => link.trim() !== ""),
        special_requirements: formData.specialRequirements,
        status: "draft",
        
        // 全新開發欄位
        ...((!isMaintenanceMode) && {
          new_usage_scenario: formData.usageScenario,
          new_goals: formData.goals,
          new_features: formData.features,
          new_outputs: formData.outputs,
          new_outputs_other: formData.outputsOther,
          new_design_style: formData.designStyle,
          new_integrations: formData.integrations,
          new_integrations_other: formData.integrationsOther,
          required_skills: formData.requiredTechStacks, // 傳遞技術需求
          new_deliverables: formData.deliverables,
          new_communication_preference: formData.communicationPreference,
          new_special_requirements: formData.specialRequirements,
          new_concerns: formData.concerns,
        }),
        
        // 修改維護欄位
        ...(isMaintenanceMode && {
          maint_system_name: formData.maint_system_name,
          maint_system_purpose: formData.maint_system_purpose,
          maint_current_users_count: formData.maint_current_users_count,
          maint_system_age: formData.maint_system_age,
          maint_current_problems: formData.maint_current_problems,
          maint_desired_improvements: formData.maint_desired_improvements,
          maint_new_features: formData.maint_new_features,
          maint_known_tech_stack: formData.maint_known_tech_stack,
          maint_has_source_code: formData.maint_has_source_code,
          maint_has_documentation: formData.maint_has_documentation,
          maint_can_provide_access: formData.maint_can_provide_access,
          maint_technical_contact: formData.maint_technical_contact,
          maint_expected_outcomes: formData.maint_expected_outcomes,
          maint_success_criteria: formData.maint_success_criteria,
          maint_additional_notes: formData.maint_additional_notes,
        }),
      };

      const result = await apiPost("/api/v1/projects", payload);
      router.push(`/projects/${result.data.id}`);
    } catch (error: any) {
      console.error("提交失敗:", error);
      alert(`發布失敗: ${error.message || "未知錯誤"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    // 第一步永遠是專案類型選擇
    if (currentStep === 1) {
      return <Step1ProjectType data={formData} updateData={updateFormData} />;
    }

    // 根據專案模式渲染不同的步驟
    if (formData.projectMode === "maintenance_modification") {
      // 修改維護流程（6步）
      switch (currentStep) {
        case 2:
          return <Step2MaintenanceSystem data={formData} updateData={updateFormData} />;
        case 3:
          return <Step3MaintenanceProblems data={formData} updateData={updateFormData} />;
        case 4:
          return <Step4MaintenanceTech data={formData} updateData={updateFormData} />;
        case 5:
          return <Step5MaintenanceBudgetSimple data={formData} updateData={updateFormData} />;
        case 6:
          return <Step6MaintenanceExpectations data={formData} updateData={updateFormData} />;
        default:
          return null;
      }
    } else {
      // 全新開發流程（10步）
      switch (currentStep) {
        case 2:
          return <Step2UsageScenario data={formData} updateData={updateFormData} />;
        case 3:
          return <Step3Goals data={formData} updateData={updateFormData} />;
        case 4:
          return <Step4Features data={formData} updateData={updateFormData} />;
        case 5:
          return <Step5Outputs data={formData} updateData={updateFormData} />;
        case 6:
          return <Step6Reference data={formData} updateData={updateFormData} />;
        case 7:
          return <Step7Integrations data={formData} updateData={updateFormData} />;
        case 8:
          return <Step8BudgetSchedule data={formData} updateData={updateFormData} />;
        case 9:
          return <Step9Deliverables data={formData} updateData={updateFormData} />;
        case 10:
          return <Step10Additional data={formData} updateData={updateFormData} />;
        default:
          return null;
      }
    }
  };

  const totalSteps = getTotalSteps();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 進度條 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-[#c5ae8c]">
            步驟 {currentStep} / {totalSteps}
            {formData.projectMode && (
              <span className="ml-2 text-xs">
                ({formData.projectMode === "maintenance_modification" ? "修改維護" : "全新開發"})
              </span>
            )}
          </span>
          <span className="text-sm text-[#c5ae8c]">
            {Math.round((currentStep / totalSteps) * 100)}% 完成
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-[#20263e] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 當前步驟內容 */}
      <Card className="p-6 md:p-8 min-h-[380px] flex flex-col justify-center">
        {renderStep()}
      </Card>

      {/* 導航按鈕 */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className={currentStep === 1 ? "invisible" : ""}
        >
          ← 上一步
        </Button>

        <div className="flex gap-3">
          {currentStep < totalSteps ? (
            <Button onClick={nextStep}>
              下一步 →
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={isSubmitting}>
              發布專案
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

