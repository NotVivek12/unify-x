import NfcManager, { NfcEvents, NfcTech } from 'react-native-nfc-manager';

class NfcService {
  private isDemoMode = false;

  async init() {
    try {
      await NfcManager.start();
    } catch (e) {
      console.warn('NFC not supported or failed to start', e);
    }
  }

  setDemoMode(enabled: boolean) {
    this.isDemoMode = enabled;
  }

  getDemoMode() {
    return this.isDemoMode;
  }

  async scanTag(): Promise<string> {
    if (this.isDemoMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('TEST_LIVE_001');
        }, 1500); // Simulate scanning delay
      });
    }

    return new Promise(async (resolve, reject) => {
      try {
        await NfcManager.requestTechnology(NfcTech.Ndef);
        const tag = await NfcManager.getTag();
        
        let tagData = tag?.id || 'UNKNOWN';

        if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
          const payload = tag.ndefMessage[0].payload;
          if (payload && payload.length > 0) {
            // NDEF Text Record format: First byte is status byte (bit 0-5 = lang code len)
            const langCodeLen = payload[0] & 0x3F;
            const textBytes = payload.slice(1 + langCodeLen);
            tagData = String.fromCharCode.apply(null, textBytes);
          }
        }
        resolve(tagData);
      } catch (ex) {
        console.warn('NFC Exception:', ex);
        reject(ex);
      } finally {
        NfcManager.cancelTechnologyRequest();
      }
    });
  }

  async cancelScan() {
    if (!this.isDemoMode) {
      await NfcManager.cancelTechnologyRequest();
    }
  }
}

export default new NfcService();
