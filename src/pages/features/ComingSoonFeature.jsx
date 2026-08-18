import { FiClock, FiTool } from 'react-icons/fi';
import Card from '../../components/common/Card';

export default function ComingSoonFeature() {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto h-[70vh] flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
        <FiTool className="text-accent" size={32} />
      </div>
      <h1 className="text-3xl font-display font-semibold text-text-primary mb-4">Under Construction</h1>
      <p className="text-lg text-text-secondary max-w-lg mb-8">
        We are working hard to bring this feature to life. Check back soon for updates!
      </p>
      
      <div className="grid sm:grid-cols-2 gap-4 w-full max-w-md">
        <Card className="p-4 border-border flex items-center gap-3">
          <FiClock className="text-text-muted" size={20} />
          <div className="text-left">
            <p className="text-sm font-medium text-text-primary">Status</p>
            <p className="text-xs text-text-secondary">In Development</p>
          </div>
        </Card>
        <Card className="p-4 border-border flex items-center gap-3">
          <FiTool className="text-text-muted" size={20} />
          <div className="text-left">
            <p className="text-sm font-medium text-text-primary">Expected</p>
            <p className="text-xs text-text-secondary">Q4 2026</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
