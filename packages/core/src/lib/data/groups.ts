import type { GroupInfo } from '$shared/types'
import bakedData from 'virtual:mapper-data'

export async function getAllGroups(): Promise<Record<string, GroupInfo>> {
  return bakedData.groups as Record<string, GroupInfo>;
}

export async function getGroup(groupId: string | null | undefined): Promise<GroupInfo | null> {
  if (!groupId) return null;
  return ((bakedData.groups as Record<string, GroupInfo>)[groupId]) ?? null;
}
