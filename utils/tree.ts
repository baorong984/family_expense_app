import type { Category } from '~/types'

export function buildTree<T extends { id: number; parent_id: number | null }>(
  items: T[]
): (T & { children?: T[] })[] {
  const map = new Map<number, T & { children?: T[] }>()
  const roots: (T & { children?: T[] })[] = []
  
  // 先创建所有节点
  items.forEach(item => {
    map.set(item.id, { ...item, children: [] } as any)
  })
  
  // 构建树结构
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
  
  // 按sort_order排序
  const sortNodes = (nodes: (T & { children?: T[] })[]) => {
    nodes.sort((a, b) => ((a as any).sort_order || 0) - ((b as any).sort_order || 0))
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children)
      }
    })
  }
  
  sortNodes(roots)
  
  return roots
}

export function flattenTree<T extends { children?: T[] }>(tree: T[]): Omit<T, 'children'>[] {
  const result: Omit<T, 'children'>[] = []
  
  const flatten = (nodes: T[]) => {
    nodes.forEach(node => {
      const { children, ...rest } = node
      result.push(rest)
      if (children && children.length > 0) {
        flatten(children)
      }
    })
  }
  
  flatten(tree)
  return result
}

export function findInTree<T extends { id: number; children?: T[] }>(
  tree: T[],
  id: number
): T | null {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.children) {
      const found = findInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

export function getTreePath<T extends { id: number; children?: T[] }>(
  tree: T[],
  id: number,
  path: number[] = []
): number[] | null {
  for (const node of tree) {
    const currentPath = [...path, node.id]
    if (node.id === id) return currentPath
    if (node.children) {
      const found = getTreePath(node.children, id, currentPath)
      if (found) return found
    }
  }
  return null
}

export function categoryTreeToCascaderData(categories: Category[]) {
  // 系统分类标记：🔷 系统预设
  // 自定义分类标记：⭐ 自定义
  const formatName = (name: string, isSystem: number) => {
    return isSystem === 1 ? `${name} 🔷` : `${name} ⭐`
  }

  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    is_system: cat.is_system,
    children: cat.children?.map(sub => ({
      id: sub.id,
      name: formatName(sub.name, sub.is_system),
      is_system: sub.is_system,
    })),
  }))
}
