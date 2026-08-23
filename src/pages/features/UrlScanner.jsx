import Card from '../../components/common/Card';
import { FiLink, FiCheckCircle, FiAlertTriangle, FiGlobe, FiServer, FiShield, FiX, FiInfo } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';

export default function UrlScanner() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="w-full space-y-6">
        <PageHeader 
          title="URL Scanner"
          description="Analyze URLs for suspicious patterns and potential threats."
          icon={<FiLink />}
        />

        <Card className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
          <FiLink size={32} className="text-accent" />
        </div>
        <h2 className="text-2xl font-display font-semibold text-text-primary mb-3">
          URL Scanner
        </h2>
        <p className="text-text-secondary max-w-md mx-auto">
          This feature is currently under development. Team T2 will build out the URL scanning components here.
        </p>
        </Card>
      </div>
    </div>
  );
}
