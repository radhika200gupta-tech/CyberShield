import Card from '../../components/common/Card';
import { FiMaximize } from 'react-icons/fi';

export default function QrScanner() {
  return (
    <div className="space-y-6">
      <Card className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
          <FiMaximize size={32} className="text-accent" />
        </div>
        <h2 className="text-2xl font-display font-semibold text-text-primary mb-3">
          QR Security Scanner
        </h2>
        <p className="text-text-secondary max-w-md mx-auto">
          This feature is currently under development. Team T2 will build out the QR code analysis tools here.
        </p>
      </Card>
    </div>
  );
}

