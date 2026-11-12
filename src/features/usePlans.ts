import useSWR from "swr";
import { api } from "@/lib/api";
import type { CaregiverLink, Plan } from "@/lib/types";

export const usePlans = () => useSWR<Plan[]>("/plans", (p: string) => api<Plan[]>(p));

export const useCaregivers = (planId?: string) =>
  useSWR<CaregiverLink[]>(planId ? `/plans/${planId}/caregivers` : null, (p: string) => api<CaregiverLink[]>(p));

export const useSupervised = () => useSWR<Plan[]>("/plans/supervised", (p: string) => api<Plan[]>(p));

export const useInvitations = () => useSWR<CaregiverLink[]>("/invitations", (p: string) => api<CaregiverLink[]>(p));
