/**
 * Manual API hooks for staff permissions management.
 * Not orval-generated — added alongside the permissions endpoint.
 */
import { useMutation } from '@tanstack/react-query';
import { customFetch } from '../custom-fetch';

export interface UpdateEmployeePermissionsVariables {
  id: number;
  permissions: string[];
}

async function updateEmployeePermissions({ id, permissions }: UpdateEmployeePermissionsVariables) {
  return customFetch<unknown>(`/admin/employees/${id}/permissions`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ permissions }),
  });
}

export function useUpdateEmployeePermissions() {
  return useMutation({ mutationFn: updateEmployeePermissions });
}
