import Card from '../../components/common/Card';
import { FiTarget } from 'react-icons/fi';

export default function PhishingChallenge() {
  return (
    <div className="space-y-6">
      <Card className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
          <FiTarget size={32} className="text-accent" />
        </div>
        <h2 className="text-2xl font-display font-semibold text-text-primary mb-3">
          Phishing Challenge
        </h2>
        <p className="text-text-secondary max-w-md mx-auto">
          Test your skills in identifying phishing attempts. This feature will be built out soon.
        </p>
      </Card>
    </div>
  );
}
