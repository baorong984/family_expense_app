export function successResponse(data: any, message = '操作成功') {
  return {
    success: true,
    data,
    message,
    code: 200,
  }
}

export function errorResponse(message: string, code = 400, data: any = null) {
  return {
    success: false,
    data,
    message,
    code,
  }
}

import dayjs from 'dayjs'

export function formatDate(date: Date | string, format = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format)
}

export function formatDateTime(date: Date | string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format)
}

export function buildTree<T extends { id: number; parent_id: number | null }>(
  items: T[]
): (T & { children?: T[] })[] {
  const map = new Map<number, T & { children?: T[] }>()
  const roots: (T & { children?: T[] })[] = []
  
  items.forEach(item => {
    map.set(item.id, { ...item, children: [] } as any)
  })
  
  items.forEach(item => {
    const node = map.get(item.id)!
    if (item.parent_id === null) {
      roots.push(node)
    } else {
      const parent = map.get(item.parent_id)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(node)
      }
    }
  })
  
  return roots
}
