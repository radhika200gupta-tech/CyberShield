import { useEffect } from 'react';
import { FiCrosshair } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import QRScanner from './components/QRScanner';
import './qrSecurity.css';

let pageUnmountTimeout = null;
let capturedStreams = new Set();

export default function QRSecurityPage() {
  useEffect(() => {
    if (pageUnmountTimeout) {
      clearTimeout(pageUnmountTimeout);
      pageUnmountTimeout = null;
    }

    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      try {
        const stream = await originalGetUserMedia(constraints);
        capturedStreams.add(stream);
        return stream;
      } catch (err) {
        throw err;
      }
    };

    return () => {
      navigator.mediaDevices.getUserMedia = originalGetUserMedia;
      
      pageUnmountTimeout = setTimeout(() => {
        capturedStreams.forEach(stream => {
          stream.getTracks().forEach(track => {
            track.stop();
          });
        });
        capturedStreams.clear();
      }, 500);
    };
  }, []);
  return (
    <>
      <div className="qr-security relative overflow-x-hidden">


        <div className="space-y-8 max-w-3xl mx-auto px-4 sm:px-6 pb-14 sm:pb-20">
          <PageHeader 
            title="Scan QR Codes"
            description="Scan and analyze QR codes for malicious redirects and hidden threats."
            badge="Scanner Ready"
            icon={<FiCrosshair />}
          />

        <QRScanner />

        <p className="mt-10 text-center text-xs text-text-muted">
          Heuristic Analysis · Rule-Based Detection · Client-side only
        </p>
        </div>
      </div>
    </>
  );
}
