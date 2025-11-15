import { Institution, InstitutionType } from '@account-book/types';
import { apiClient } from './client';

/**
 * Institution API
 */

export interface CreateInstitutionRequest {
  name: string;
  type: InstitutionType;
  credentials: {
    encrypted: string;
    iv: string;
    authTag: string;
    algorithm?: string;
    version?: string;
  };
}

export interface GetInstitutionsParams {
  type?: InstitutionType;
  isConnected?: boolean;
}

/**
 * 金融機関を登録
 */
export async function createInstitution(
  data: CreateInstitutionRequest,
): Promise<Institution> {
  return await apiClient.post<Institution>('/institutions', data);
}

/**
 * 金融機関一覧を取得
 */
export async function getInstitutions(
  params?: GetInstitutionsParams,
): Promise<Institution[]> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    if (params.type) searchParams.append('type', params.type);
    if (params.isConnected !== undefined) {
      searchParams.append('isConnected', params.isConnected.toString());
    }
  }

  const endpoint = `/institutions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return await apiClient.get<Institution[]>(endpoint);
}

