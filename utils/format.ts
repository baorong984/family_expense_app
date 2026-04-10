import dayjs from 'dayjs'

export function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

export function formatDate(date: Date | string, format = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format)
}

export function formatDateTime(date: Date | string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format)
}

export function formatMonth(date: Date | string): string {
  return dayjs(date).format('YYYY-MM')
}

export function formatTime(date: Date | string): string {
  return dayjs(date).format('HH:mm:ss')
}

/**
 * 格式化消费时间（拼接 date + time）
 * @param date 消费日期 YYYY-MM-DD
 * @param time 消费时间 HH:mm:ss 或 HH:mm 或 null
 * @returns 格式化后的日期时间字符串 YYYY-MM-DD HH:mm:ss
 */
export function formatExpenseDateTime(date: string, time: string | null): string {
  if (!date) return '-'

  // 如果没有时间，只显示日期
  if (!time) {
    return dayjs(date).format('YYYY-MM-DD')
  }

  // 补全时间格式
  let timePart = time
  const parts = time.split(':')

  if (parts.length === 1) {
    // 只有小时，补全分钟和秒
    timePart = `${time}:00:00`
  } else if (parts.length === 2) {
    // 只有小时和分钟，补全秒
    timePart = `${time}:00`
  }

  // 使用 dayjs 解析并格式化
  const datetime = dayjs(`${date} ${timePart}`)
  if (!datetime.isValid()) {
    return date
  }

  return datetime.format('YYYY-MM-DD HH:mm:ss')
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function getMonthRange(year: number, month: number) {
  const start = dayjs(`${year}-${month.toString().padStart(2, '0')}-01`)
  const end = start.endOf('month')
  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD'),
  }
}

export function getCurrentMonth() {
  const now = dayjs()
  return {
    year: now.year(),
    month: now.month() + 1,
  }
}

export function getPreviousMonth(year: number, month: number) {
  const prev = dayjs(`${year}-${month.toString().padStart(2, '0')}-01`).subtract(1, 'month')
  return {
    year: prev.year(),
    month: prev.month() + 1,
  }
}

export function getNextMonth(year: number, month: number) {
  const next = dayjs(`${year}-${month.toString().padStart(2, '0')}-01`).add(1, 'month')
  return {
    year: next.year(),
    month: next.month() + 1,
  }
}
