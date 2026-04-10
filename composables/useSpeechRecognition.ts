export function useSpeechRecognition() {
  const isListening = ref(false)
  const transcript = ref('')
  const error = ref('')
  const recognition = ref<any>(null)
  
  const isSupported = computed(() => {
    return typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  })
  
  const startListening = () => {
    if (!isSupported.value) {
      error.value = '您的浏览器不支持语音识别功能'
      return
    }
    
    if (isListening.value) return
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    recognition.value = new SpeechRecognition()
    
    recognition.value.lang = 'zh-CN'
    recognition.value.continuous = false
    recognition.value.interimResults = false
    
    recognition.value.onresult = (event: any) => {
      transcript.value = event.results[0][0].transcript
      isListening.value = false
    }
    
    recognition.value.onend = () => {
      isListening.value = false
    }
    
    recognition.value.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      error.value = `语音识别错误: ${event.error}`
      isListening.value = false
    }
    
    recognition.value.start()
    isListening.value = true
    error.value = ''
  }
  
  const stopListening = () => {
    if (recognition.value && isListening.value) {
      recognition.value.stop()
      isListening.value = false
    }
  }
  
  const toggleListening = () => {
    if (isListening.value) {
      stopListening()
    } else {
      startListening()
    }
  }
  
  const clearTranscript = () => {
    transcript.value = ''
    error.value = ''
  }
  
  onUnmounted(() => {
    stopListening()
  })
  
  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
  }
}
