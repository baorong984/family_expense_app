import { successResponse, errorResponse } from '~/server/utils/response'
import { recognizeExpense } from '~/server/utils/ai'
import Tesseract from 'tesseract.js'

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  
  if (!formData || formData.length === 0) {
    return errorResponse('请上传图片', 400)
  }
  
  const file = formData.find(item => item.name === 'file' || item.name === 'image')
  if (!file || !file.data) {
    return errorResponse('请上传图片', 400)
  }
  
  try {
    const result = await Tesseract.recognize(
      Buffer.from(file.data),
      'chi_sim+eng',
      {
        logger: m => console.log(m.status, m.progress)
      }
    )
    
    const ocrText = result.data.text
    const extractedInfo = await recognizeExpense(ocrText)
    
    return successResponse({
      ocr_text: ocrText,
      extracted_info: extractedInfo,
    }, '识别成功')
  } catch (error: any) {
    console.error('图片识别失败:', error)
    return errorResponse('图片识别失败，请稍后重试', 500)
  }
})