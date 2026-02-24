import type { GroupInfo } from '$lib/types'
import bakedData from '$lib/generated/data.json'

export async function getAllGroups(): Promise<Record<string, GroupInfo>> {
  return bakedData.groups as Record<string, GroupInfo>;
}

export async function getGroup(groupId: string | null | undefined): Promise<GroupInfo | null> {
  if (!groupId) return null;
  return ((bakedData.groups as Record<string, GroupInfo>)[groupId]) ?? null;
}
