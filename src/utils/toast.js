/**
 * 全局 Toast / 消息提示工具
 * 基于 Element Plus 的 ElMessage
 */

import { ElMessage } from 'element-plus'

export function toast(message, type = 'info') {
  ElMessage({
    message,
    type, // 'success' | 'warning' | 'error' | 'info'
    duration: 3000,
    showClose: true,
    center: false,
    offset: 80
  })
}

export const showSuccess = (msg) => toast(msg, 'success')
export const showError = (msg) => toast(msg, 'error')
export const showWarning = (msg) => toast(msg, 'warning')
export const showInfo = (msg) => toast(msg, 'info')
