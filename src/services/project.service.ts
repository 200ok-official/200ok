import { BaseService } from "./base.service";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "@/middleware/error.middleware";

export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'closed' | 'cancelled';

export interface CreateProjectData {
  title: string;
  description: string;
  project_type?: string;
  budget_min: number;
  budget_max: number;
  budget_estimate_only?: boolean;
  start_date?: Date;
  deadline?: Date;
  deadline_flexible?: boolean;
  required_skills?: string[];
  project_brief?: any;
  reference_links?: string[];
  design_style?: string;
  payment_method?: string;
  payment_schedule?: any;
  deliverables?: string[];
  communication_preference?: string[];
  special_requirements?: string;
  tag_ids?: string[];
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  project_type?: string;
  budget_min?: number;
  budget_max?: number;
  budget_estimate_only?: boolean;
  start_date?: Date;
  deadline?: Date;
  deadline_flexible?: boolean;
  required_skills?: string[];
  project_brief?: any;
  reference_links?: string[];
  design_style?: string;
  payment_method?: string;
  payment_schedule?: any;
  deliverables?: string[];
  communication_preference?: string[];
  special_requirements?: string;
  status?: ProjectStatus;
  tag_ids?: string[];
}

export interface SearchProjectsParams {
  status?: ProjectStatus | ProjectStatus[];
  skills?: string[];
  tags?: string[];
  budget_min?: number;
  budget_max?: number;
  project_type?: string;
  keyword?: string;
  client_id?: string;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "budget" | "deadline";
  sort_order?: "asc" | "desc";
}

export class ProjectService extends BaseService {
  /**
   * 建立新案件
   */
  async createProject(clientId: string, data: CreateProjectData) {
    // 驗證預算範圍
    if (data.budget_min > data.budget_max) {
      throw new BadRequestError("最低預算不能大於最高預算");
    }

    // 檢查 tag_ids 是否有效（如果有提供）
    if (data.tag_ids && data.tag_ids.length > 0) {
      const { data: tags, error } = await this.db
        .from("tags")
        .select("id")
        .in("id", data.tag_ids)
        .eq("is_active", true);

      if (error || !tags || tags.length !== data.tag_ids.length) {
        throw new BadRequestError("部分標籤無效或未啟用");
      }
    }

    const { tag_ids, ...projectData } = data;

    // 建立案件
    const { data: project, error } = await this.db
      .from("projects")
      .insert({
        client_id: clientId,
        ...projectData,
        start_date: data.start_date?.toISOString(),
        deadline: data.deadline?.toISOString(),
      })
      .select(
        `
        *,
        client:users!projects_client_id_fkey(id, name, avatar_url, rating)
      `
      )
      .single();

    if (error || !project) {
      throw new BadRequestError(`建立案件失敗: ${error?.message}`);
    }

    // 如果有標籤，建立關聯
    if (tag_ids && tag_ids.length > 0) {
      const tagRelations = tag_ids.map((tagId) => ({
        project_id: project.id,
        tag_id: tagId,
      }));

      await this.db.from("project_tags").insert(tagRelations);

      // 更新標籤使用次數
      for (const tagId of tag_ids) {
        await this.db.rpc("increment_tag_usage", { tag_id: tagId });
      }
    }

    // 取得完整資料（含標籤）
    return this.getProjectById(project.id, clientId);
  }

  /**
   * 取得案件詳情
   */
  async getProjectById(projectId: string, userId?: string) {
    const { data: project, error } = await this.db
      .from("projects")
      .select(
        `
        *,
        client:users!projects_client_id_fkey(id, name, avatar_url, rating),
        tags:project_tags(tag:tags(*))
      `
      )
      .eq("id", projectId)
      .single();

    if (error || !project) {
      throw new NotFoundError("案件不存在");
    }

    // 計算投標數
    const { count: bidsCount } = await this.db
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    // 如果是發案者本人，包含投標資訊
    let bids = undefined;
    if (userId && (project as any).client_id === userId) {
      const { data: bidsList } = await this.db
        .from("bids")
        .select(
          `
          *,
          freelancer:users!bids_freelancer_id_fkey(id, name, avatar_url, rating, skills)
        `
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      bids = bidsList;
    }

    // 檢查是否已收藏
    let is_saved = false;
    if (userId) {
      const { data: saved } = await this.db
        .from("saved_projects")
        .select("id")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .single();

      is_saved = !!saved;
    }

    return {
      ...project,
      _count: { bids: bidsCount || 0 },
      bids,
      is_saved,
    };
  }

  /**
   * 更新案件
   */
  async updateProject(
    projectId: string,
    clientId: string,
    data: UpdateProjectData
  ) {
    // 檢查案件是否存在
    const { data: project, error: fetchError } = await this.db
      .from("projects")
      .select("id, client_id, status")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      throw new NotFoundError("案件不存在");
    }

    // 檢查權限
    if ((project as any).client_id !== clientId) {
      throw new ForbiddenError("您沒有權限修改此案件");
    }

    // 只有 draft 或 open 狀態可以修改
    if (
      (project as any).status !== 'draft' &&
      (project as any).status !== 'open'
    ) {
      throw new BadRequestError("只有草稿或開放中的案件可以修改");
    }

    // 驗證預算範圍
    if (data.budget_min && data.budget_max) {
      if (data.budget_min > data.budget_max) {
        throw new BadRequestError("最低預算不能大於最高預算");
      }
    }

    const { tag_ids, ...updateData } = data;

    // 更新案件
    const { data: updatedProject, error } = await this.db
      .from("projects")
      .update({
        ...updateData,
        start_date: data.start_date?.toISOString(),
        deadline: data.deadline?.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single();

    if (error || !updatedProject) {
      throw new BadRequestError(`更新案件失敗: ${error?.message}`);
    }

    // 更新標籤關聯（如果有提供）
    if (tag_ids !== undefined) {
      // 刪除舊的標籤關聯
      await this.db.from("project_tags").delete().eq("project_id", projectId);

      // 建立新的標籤關聯
      if (tag_ids.length > 0) {
        const tagRelations = tag_ids.map((tagId) => ({
          project_id: projectId,
          tag_id: tagId,
        }));

        await this.db.from("project_tags").insert(tagRelations);
      }
    }

    return this.getProjectById(projectId, clientId);
  }

  /**
   * 刪除案件
   */
  async deleteProject(projectId: string, clientId: string) {
    // 檢查案件是否存在
    const { data: project, error: fetchError } = await this.db
      .from("projects")
      .select("id, client_id, status")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      throw new NotFoundError("案件不存在");
    }

    // 檢查權限
    if ((project as any).client_id !== clientId) {
      throw new ForbiddenError("您沒有權限刪除此案件");
    }

    // 只有 draft 狀態可以直接刪除
    if ((project as any).status !== 'draft') {
      throw new BadRequestError("只有草稿狀態的案件可以刪除");
    }

    // 刪除案件
    const { error } = await this.db.from("projects").delete().eq("id", projectId);

    if (error) {
      throw new BadRequestError(`刪除案件失敗: ${error.message}`);
    }
  }

  /**
   * 取消案件（將狀態改為 cancelled）
   */
  async cancelProject(projectId: string, clientId: string) {
    // 檢查案件是否存在
    const { data: project, error: fetchError } = await this.db
      .from("projects")
      .select("id, client_id, status")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      throw new NotFoundError("案件不存在");
    }

    // 檢查權限
    if ((project as any).client_id !== clientId) {
      throw new ForbiddenError("您沒有權限取消此案件");
    }

    // 不能取消已完成或已關閉的案件
    if (
      (project as any).status === 'completed' ||
      (project as any).status === 'closed'
    ) {
      throw new BadRequestError("無法取消已完成或已關閉的案件");
    }

    // 更新狀態
    const { data: updatedProject, error } = await this.db
      .from("projects")
      .update({ status: 'cancelled' })
      .eq("id", projectId)
      .select()
      .single();

    if (error || !updatedProject) {
      throw new BadRequestError(`取消案件失敗: ${error?.message}`);
    }

    return updatedProject;
  }

  /**
   * 搜尋與篩選案件
   */
  async searchProjects(params: SearchProjectsParams) {
    const {
      status,
      skills,
      tags,
      budget_min,
      budget_max,
      project_type,
      keyword,
      client_id,
      page = 1,
      limit = 10,
      sort_by = "created_at",
      sort_order = "desc",
    } = params;

    const offset = (page - 1) * limit;

    let query = this.db.from("projects").select(
      `
        *,
        client:users!projects_client_id_fkey(id, name, avatar_url, rating),
        tags:project_tags(tag:tags(*)),
        bids_count:bids(count)
      `,
      { count: "exact" }
    );

    // 狀態篩選
    if (status) {
      if (Array.isArray(status)) {
        query = query.in("status", status);
      } else {
        query = query.eq("status", status);
      }
    } else {
      // 預設只顯示 open 和 in_progress 的案件
      query = query.in("status", ['open', 'in_progress']);
    }

    // 技能篩選
    if (skills && skills.length > 0) {
      query = query.overlaps("required_skills", skills);
    }

    // 預算篩選
    if (budget_min !== undefined) {
      query = query.gte("budget_max", budget_min);
    }
    if (budget_max !== undefined) {
      query = query.lte("budget_min", budget_max);
    }

    // 專案類型篩選
    if (project_type) {
      query = query.eq("project_type", project_type);
    }

    // 發案者篩選
    if (client_id) {
      query = query.eq("client_id", client_id);
    }

    // 關鍵字搜尋
    if (keyword) {
      query = query.or(
        `title.ilike.%${keyword}%,description.ilike.%${keyword}%,ai_summary.ilike.%${keyword}%`
      );
    }

    // 排序
    const ascending = sort_order === "asc";
    if (sort_by === "budget") {
      query = query.order("budget_max", { ascending });
    } else if (sort_by === "deadline") {
      query = query.order("deadline", { ascending });
    } else {
      query = query.order("created_at", { ascending });
    }

    // 分頁
    const { data: projects, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      throw new BadRequestError(`搜尋案件失敗: ${error.message}`);
    }

    // 處理投標計數 - 將 bids_count 從物件轉為數字
    const processedProjects = (projects || []).map(project => ({
      ...project,
      bids_count: Array.isArray(project.bids_count) && project.bids_count.length > 0
        ? project.bids_count[0]?.count || 0
        : 0
    }));

    return {
      projects: processedProjects,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 取得我的案件（發案者）
   */
  async getMyProjects(clientId: string, page: number = 1, limit: number = 10) {
    return this.searchProjects({
      client_id: clientId,
      status: undefined,
      page,
      limit,
    });
  }

  /**
   * 收藏案件
   */
  async saveProject(userId: string, projectId: string) {
    // 檢查案件是否存在
    await this.checkExists("projects", projectId, "案件不存在");

    // 檢查是否已收藏
    const { data: existing } = await this.db
      .from("saved_projects")
      .select("id")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .single();

    if (existing) {
      throw new BadRequestError("已經收藏過此案件");
    }

    // 建立收藏
    const { data: saved, error } = await this.db
      .from("saved_projects")
      .insert({
        user_id: userId,
        project_id: projectId,
      })
      .select()
      .single();

    if (error || !saved) {
      throw new BadRequestError(`收藏失敗: ${error?.message}`);
    }

    return saved;
  }

  /**
   * 取消收藏案件
   */
  async unsaveProject(userId: string, projectId: string) {
    // 檢查是否已收藏
    const { data: existing } = await this.db
      .from("saved_projects")
      .select("id")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .single();

    if (!existing) {
      throw new NotFoundError("尚未收藏此案件");
    }

    // 刪除收藏
    const { error } = await this.db
      .from("saved_projects")
      .delete()
      .eq("user_id", userId)
      .eq("project_id", projectId);

    if (error) {
      throw new BadRequestError(`取消收藏失敗: ${error.message}`);
    }
  }

  /**
   * 取得我的收藏案件
   */
  async getMySavedProjects(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const offset = (page - 1) * limit;

    const [
      { data: savedProjects, error },
      { count: total },
    ] = await Promise.all([
      this.db
        .from("saved_projects")
        .select(
          `
          *,
          project:projects(
            *,
            client:users!projects_client_id_fkey(id, name, avatar_url, rating),
            tags:project_tags(tag:tags(*))
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
      this.db
        .from("saved_projects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    if (error) {
      throw new BadRequestError(`取得收藏失敗: ${error.message}`);
    }

    return {
      projects: (savedProjects || []).map((sp: any) => sp.project),
      pagination: {
        page,
        limit,
        total: total || 0,
        total_pages: Math.ceil((total || 0) / limit),
      },
    };
  }

  /**
   * 發布案件（從草稿變為 open）
   */
  async publishProject(projectId: string, clientId: string) {
    // 檢查案件是否存在
    const { data: project, error: fetchError } = await this.db
      .from("projects")
      .select("id, client_id, status")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      throw new NotFoundError("案件不存在");
    }

    // 檢查權限
    if ((project as any).client_id !== clientId) {
      throw new ForbiddenError("您沒有權限發布此案件");
    }

    // 只有草稿狀態可以發布
    if ((project as any).status !== 'draft') {
      throw new BadRequestError("只有草稿狀態的案件可以發布");
    }

    // 更新狀態
    const { data: updatedProject, error } = await this.db
      .from("projects")
      .update({ status: 'open' })
      .eq("id", projectId)
      .select()
      .single();

    if (error || !updatedProject) {
      throw new BadRequestError(`發布案件失敗: ${error?.message}`);
    }

    return updatedProject;
  }
}
