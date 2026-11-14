# Milo the Robot 🤖✨

**Milo**, iPhone’unuzun işlem gücünü, **ARKit** yüz/göz takibini, **Google Gemini 2.5 Flash** multimodal yapay zekasını ve **ESP32** tabanlı motorlu robot gövdesini birleştiren yeni nesil kişisel masaüstü robot arkadaşıdır.

<p align="center">
  <img src="assets/milo-logo.png" alt="Milo Logo" width="140" />
</p>

## 🌟 Öne Çıkan Özellikler

- **9 Canlı Duygu & İfade Motoru (`GismoFaceView`):** Normal, Çok Mutlu, Mutlu, Dinliyor, Düşünceli, Şaşırmış, Üzgün, Kızgın ve Uyuyor modları arasında akıcı geçişler ve ses şiddetine duyarlı ağız senkronizasyonu (`CuteRobotVoiceDSP`).
- **ARKit Yüz Takibi & Lens Göz Modu:** Ekran %58 Robot Yüzü ve %42 Kamera Takip HUD paneline bölünür. Milo yüzünüzü takip ederek ESP32 gövdesini döndürür; selfie çekerken sol gözü kamera lensine (`CameraLensEye`) dönüşür.
- **Gemini 2.5 Flash Multimodal Görsel Zeka:** *"Milo, şu an elimde ne var?"* veya *"Bu kağıtta ne yazıyor?"* gibi sorularda fotoğrafı galeriye kaydetmeden anlık analiz (`analyzeCamera`) yapar ve fiziksel motor koreografisi (`MotorStep`) üretir.
- **10 Yerleşik iPhone Yeteneği (`PhoneIntegrationService`):**
  1. **Kamera:** Fotoğraf çekme ve görsel analiz
  2. **Rehber:** Türkçe ek çözümlemeli kişi arama ve yaklaşan doğum günleri
  3. **Takvim (EventKit):** Etkinlikleri listeleme ve yeni etkinlik oluşturma
  4. **Anımsatıcılar:** Yapılacaklar listesi ve zamanlı hatırlatıcılar
  5. **Alarm & Zamanlayıcı:** iOS 26+ `AlarmKit` ile gerçek sistem alarmı ve sayaç
  6. **Aktivite & Hareket (CoreMotion):** Adım sayar, mesafe, çıkılan kat ve anlık hareket durumu
  7. **Konum, Hava Durumu & Yol Tarifi:** Semt/adres bilgisi, 3 günlük hava tahmini ve Apple Haritalar rotası
  8. **Telefon Araması:** Rehberdeki kişiyi iOS sistem onayıyla arama
  9. **Mesajlar:** SMS, iMessage ve WhatsApp hazır mesaj taslağı açma
  10. **Cihaz Durumu:** Pil seviyesi, boş depolama, flaş fener ve ekran parlaklığı kontrolü
- **Google Workspace & Netgsm Bulut Entegrasyonları:** Gmail gelen kutusu okuma/yanıtlama, Google Drive fotoğraf yedekleme ve Netgsm üzerinden arka planda doğrudan SMS gönderimi.
- **ESP32 Gövde & Aktif Frenleme (`esp32.cpp`):** `GISMO_AP` kurulum modu, yerel HTTP + bulut WebSocket çift yönlü kontrol, 22ms aktif kısa devre motor frenlemesi ve GPIO 34 ADC üzerinden canlı 2S Li-Ion batarya telemetrisi (`LowBatteryLockOverlay`).

## 🚀 Landing Sayfasını Çalıştırma

Bu depo Milo'nun etkileşimli web tanıtım (landing) sayfasını içerir. Herhangi bir derleme adımına gerek olmadan doğrudan çalıştırabilirsiniz:

```bash
git clone https://github.com/cerilas/milo-the-robot.git
cd milo-the-robot
python3 -m http.server 8080
```

Ardından tarayıcınızda `http://localhost:8080` adresini açarak canlı Milo yüz simülatörünü ve komut laboratuvarını deneyimleyebilirsiniz.
