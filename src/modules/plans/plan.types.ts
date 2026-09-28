export type PlanStatus = "active" | "inactive";

export type BillingInterval = "monthly" | "yearly";

export type PlanFeatureType = "limit" | "boolean";

/* -------------------------------------------------------------------------- */
/*                              PLAN FEATURE                                  */
/* -------------------------------------------------------------------------- */

export interface PlanFeature {
  id: string;
  planId: string;
  featureKey: string;
  name: string;
  type: PlanFeatureType;
  limit: number | null;
  enabled: boolean;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                  PLAN                                      */
/* -------------------------------------------------------------------------- */

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPrice: string;
  yearlyPrice: string;
  currency: string;
  trialDays: number;
  status: PlanStatus;
  displayOrder: number;
  isPopular: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  planFeatures?: PlanFeature[];
}

/* -------------------------------------------------------------------------- */
/*                              PLAN QUERIES                                  */
/* -------------------------------------------------------------------------- */

export interface PlanListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: PlanStatus | "all";
}

/* -------------------------------------------------------------------------- */
/*                              PLAN RESPONSES                                */
/* -------------------------------------------------------------------------- */

export interface PlanListData {
  items: Plan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlansResponse {
  success: boolean;
  message?: string;
  data: PlanListData;
}

export interface PlanResponse {
  success: boolean;
  message?: string;
  data: Plan;
}

/* -------------------------------------------------------------------------- */
/*                             PLAN INPUTS                                     */
/* -------------------------------------------------------------------------- */

export interface CreatePlanInput {
  name: string;
  slug: string;
  description?: string | null;
  monthlyPrice: string;
  yearlyPrice: string;
  currency?: string;
  trialDays?: number;
  status?: PlanStatus;
  displayOrder?: number;
  isPopular?: boolean;
  isPublic?: boolean;
}

export interface UpdatePlanInput {
  name?: string;
  slug?: string;
  description?: string | null;
  monthlyPrice?: string;
  yearlyPrice?: string;
  currency?: string;
  trialDays?: number;
  status?: PlanStatus;
  displayOrder?: number;
  isPopular?: boolean;
  isPublic?: boolean;
}

export interface UpdatePlanStatusInput {
  status: PlanStatus;
}

/* -------------------------------------------------------------------------- */
/*                             PLAN DELETE                                    */
/* -------------------------------------------------------------------------- */

export interface DeletePlanResponse {
  success?: boolean;
  message?: string;
}

/* -------------------------------------------------------------------------- */
/*                           PLAN FEATURE INPUTS                               */
/* -------------------------------------------------------------------------- */

export interface CreatePlanFeatureInput {
  featureKey: string;
  name: string;
  type: PlanFeatureType;
  limit?: number | null;
  enabled?: boolean;
  unit?: string | null;
}

export interface UpdatePlanFeatureInput {
  featureKey?: string;
  name?: string;
  type?: PlanFeatureType;
  limit?: number | null;
  enabled?: boolean;
  unit?: string | null;
}

/* -------------------------------------------------------------------------- */
/*                         PLAN FEATURE RESPONSES                             */
/* -------------------------------------------------------------------------- */

export interface PlanFeaturesResponse {
  success: boolean;
  message?: string;
  data: PlanFeature[];
}

export interface PlanFeatureResponse {
  success: boolean;
  message?: string;
  data: PlanFeature;
}
