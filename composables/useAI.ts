export function useAI() {
  const api = useApi()

  const recognizeExpense = async (text: string) => {
    return await api.post('/api/ai/recognize', { text })
  }

  const classifyExpense = async (description: string, amount: number) => {
    return await api.post('/api/ai/classify', { description, amount })
  }

  const recognizeImage = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)

    return await api.post('/api/ai/image-recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  return {
    recognizeExpense,
    classifyExpense,
    recognizeImage,
  }
}
