package io.family.expense;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions;
import java.io.InputStream;

@CapacitorPlugin(name = "OCRPlugin")
public class OCRPlugin extends Plugin {

    @PluginMethod
    public void detectText(PluginCall call) {
        String base64 = call.getString("base64");
        String filePath = call.getString("filePath");

        Bitmap bitmap = null;
        try {
            if (base64 != null && !base64.isEmpty()) {
                // Remove data URL prefix if present (e.g. "data:image/jpeg;base64,")
                if (base64.contains(",")) {
                    base64 = base64.split(",")[1];
                }
                byte[] decodedString = Base64.decode(base64, Base64.DEFAULT);
                bitmap = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
            } else if (filePath != null && !filePath.isEmpty()) {
                Uri uri = Uri.parse(filePath);
                InputStream inputStream = getContext().getContentResolver().openInputStream(uri);
                bitmap = BitmapFactory.decodeStream(inputStream);
            }
        } catch (Exception e) {
            call.reject("Failed to load image: " + e.getMessage());
            return;
        }

        if (bitmap == null) {
            call.reject("No image data provided. Please provide 'base64' or 'filePath'.");
            return;
        }

        try {
            InputImage image = InputImage.fromBitmap(bitmap, 0);
            TextRecognizer recognizer = TextRecognition.getClient(new ChineseTextRecognizerOptions.Builder().build());

            recognizer.process(image)
                .addOnSuccessListener(visionText -> {
                    JSObject ret = new JSObject();
                    ret.put("text", visionText.getText());
                    call.resolve(ret);
                })
                .addOnFailureListener(e -> {
                    call.reject("OCR recognition failed: " + e.getMessage(), e);
                });
        } catch (Exception e) {
            call.reject("OCR processing exception: " + e.getMessage(), e);
        }
    }
}
