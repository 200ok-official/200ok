import { BaseService } from "./base.service";
import {
  NotFoundError,
  ForbiddenError,
} from "@/middleware/error.middleware";

export type UserRole = 'freelancer' | 'client' | 'admin';
export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'closed' | 'cancelled';

export class AdminService extends BaseService {
  /**
   * 檢查是否為管理員
   */
  private checkAdmin(userRoles: UserRole[]) {
    if (!userRoles.includes('admin')) {
      throw new ForbiddenError("需要管理員權限");
    }
  }

  /**
   * 取得所有使用者列表
   */
  async getAllUsers(
    adminRoles: UserRole[],
    page: number = 1,
    limit: number = 20,
    search?: string
  ) {
    this.checkAdmin(adminRoles);

    const offset = (page - 1) * limit;

    let query = this.db
      .from("users")
      .select(
        `
        id,
        name,
        email,
        roles,
        rating,
        avatar_url,
        phone,
        phone_verified,
        email_verified,
        created_at
      `,
        { count: "exact" }
      );

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`取得使用者列表失敗: ${error.message}`);
    }

    return {
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 取得所有案件列表（管理員）
   */
  async getAllProjects(
    adminRoles: UserRole[],
    page: number = 1,
    limit: number = 20,
    status?: ProjectStatus,
    search?: string
  ) {
    this.checkAdmin(adminRoles);

    const offset = (page - 1) * limit;

    let query = this.db
      .from("projects")
      .select(
        `
        *,
        client:users!projects_client_id_fkey(id, name, email, avatar_url),
        tags:project_tags(tag:tags(*))
      `,
        { count: "exact" }
      );

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: projects, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`取得案件列表失敗: ${error.message}`);
    }

    return {
      projects: projects || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 停權使用者
   */
  async banUser(adminRoles: UserRole[], userId: string) {
    this.checkAdmin(adminRoles);

    // 檢查使用者是否存在
    const { data: user, error } = await this.db
      .from("users")
      .select("id, roles")
      .eq("id", userId)
      .single();

    if (error || !user) {
      throw new NotFoundError("使用者不存在");
    }

    // 不能停權管理員
    if ((user as any).roles.includes('admin')) {
      throw new ForbiddenError("不能停權管理員");
    }

    // 刪除使用者的 refresh tokens
    await this.db.from("refresh_tokens").delete().eq("user_id", userId);

    // 取消使用者所有進行中的案件
    await this.db
      .from("projects")
      .update({ status: 'cancelled' })
      .eq("client_id", userId)
      .in("status", ['open', 'in_progress']);

    return { message: "使用者已停權" };
  }

  /**
   * 下架違規案件
   */
  async removeProject(adminRoles: UserRole[], projectId: string) {
    this.checkAdmin(adminRoles);

    // 檢查案件是否存在
    await this.checkExists("projects", projectId, "案件不存在");

    // 取得案件資訊
    const { data: project } = await this.db
      .from("projects")
      .select("client_id, title")
      .eq("id", projectId)
      .single();

    // 將案件狀態改為 cancelled
    const { data: updatedProject, error } = await this.db
      .from("projects")
      .update({ status: 'cancelled' })
      .eq("id", projectId)
      .select()
      .single();

    if (error || !updatedProject) {
      throw new Error(`下架案件失敗: ${error?.message}`);
    }

    // 通知發案者
    if (project) {
      await this.db.from("notifications").insert({
        user_id: (project as any).client_id,
        type: "project_status_change",
        title: "案件已被下架",
        content: `您的案件「${(project as any).title}」因違反平台規範已被管理員下架`,
        related_project_id: projectId,
      });
    }

    return updatedProject;
  }

  /**
   * 取得平台統計資訊
   */
  async getPlatformStats(adminRoles: UserRole[]) {
    this.checkAdmin(adminRoles);

    const [
      { count: totalUsers },
      { count: totalProjects },
      { count: totalBids },
      { count: totalReviews },
      { count: activeProjects },
      { count: completedProjects },
      { count: freelancers },
      { count: clients },
    ] = await Promise.all([
      this.db.from("users").select("id", { count: "exact", head: true }),
      this.db.from("projects").select("id", { count: "exact", head: true }),
      this.db.from("bids").select("id", { count: "exact", head: true }),
      this.db.from("reviews").select("id", { count: "exact", head: true }),
      this.db
        .from("projects")
        .select("id", { count: "exact", head: true })
        .in("status", ['open', 'in_progress']),
      this.db
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      this.db
        .from("users")
        .select("id", { count: "exact", head: true })
        .contains("roles", ['freelancer']),
      this.db
        .from("users")
        .select("id", { count: "exact", head: true })
        .contains("roles", ['client']),
    ]);

    // 計算完成率
    const completionRate =
      totalProjects && totalProjects > 0
        ? ((completedProjects || 0) / totalProjects) * 100
        : 0;

    return {
      users: {
        total: totalUsers || 0,
        freelancers: freelancers || 0,
        clients: clients || 0,
      },
      projects: {
        total: totalProjects || 0,
        active: activeProjects || 0,
        completed: completedProjects || 0,
        completion_rate: `${completionRate.toFixed(2)}%`,
      },
      bids: {
        total: totalBids || 0,
      },
      reviews: {
        total: totalReviews || 0,
      },
    };
  }

  /**
   * 取得最近活動
   */
  async getRecentActivity(adminRoles: UserRole[], limit: number = 20) {
    this.checkAdmin(adminRoles);

    const [
      { data: recentUsers },
      { data: recentProjects },
      { data: recentBids },
    ] = await Promise.all([
      this.db
        .from("users")
        .select("id, name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      this.db
        .from("projects")
        .select(
          `
          id,
          title,
          status,
          created_at,
          client:users!projects_client_id_fkey(id, name)
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit),
      this.db
        .from("bids")
        .select(
          `
          id,
          status,
          created_at,
          freelancer:users!bids_freelancer_id_fkey(id, name),
          project:projects(id, title)
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    return {
      recent_users: recentUsers || [],
      recent_projects: recentProjects || [],
      recent_bids: recentBids || [],
    };
  }

  /**
   * 取得標籤統計
   */
  async getTagStats(adminRoles: UserRole[]) {
    this.checkAdmin(adminRoles);

    const { data: tags, error } = await this.db
      .from("tags")
      .select("id, name, category, usage_count, is_active")
      .order("usage_count", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`取得標籤統計失敗: ${error.message}`);
    }

    return { tags: tags || [] };
  }
}
