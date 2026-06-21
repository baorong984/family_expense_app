import { registerPlugin } from '@capacitor/core';

export interface OCRPluginInterface {
  detectText(options: { base64?: string; filePath?: string }): Promise<{ text: string }>;
}

const OCRPlugin = registerPlugin<OCRPluginInterface>('OCRPlugin');
export default OCRPlugin;
